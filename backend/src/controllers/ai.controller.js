import { vectorRetrieval, createAISession, updateSessionActivity, deleteAISession } from '../services/vectorsync.service.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';

// System prompt for the AI assistant
const SYSTEM_PROMPT = `You are an intelligent shopping assistant for S-OLX, a student-to-student marketplace. 
Your role is to help students find products based strictly on the provided context. 

When a user asks for products:
- Analyze the retrieved context and suggest specific items
- For each recommendation, provide: Product Name, Price, Condition, and a brief description
- If no suitable products are found in the context, clearly state that

Be helpful, concise, and friendly. Focus on matching user needs with available products.`;

// Session configuration
const SESSION_CONFIG = {
  systemPrompt: SYSTEM_PROMPT,
  contextSources: [
    { collectionName: 'products', fields: ['title', 'description', 'more_info', 'condition', 'category', 'price'] }
  ],
  model: 'qwen2.5-coder:7b',
  provider: 'ollama'
};

/**
 * Chat with AI - supports both session-based and stateless queries
 * POST /api/v1/ai/chat
 * Body: { message: string, sessionId?: string }
 */
export const chatWithAI = asyncHandler(async (req, res) => {
  const { message, sessionId: reqSessionId } = req.body;

  if (!message) {
    throw new ApiError(400, 'Message is required');
  }

  if (!vectorRetrieval) {
    throw new ApiError(503, 'AI Chat service is not initialized. Please try again later.');
  }

  try {
    let sessionId = reqSessionId;
    let isNewSession = false;

    // Create new session if not provided
    if (!sessionId) {
      sessionId = createAISession(SESSION_CONFIG);
      isNewSession = true;
      console.log(`Created new AI session: ${sessionId}`);
    } else {
      // Update session activity timestamp
      updateSessionActivity(sessionId);
    }

    // Query with the session
    const result = await vectorRetrieval.query(sessionId, message);

    return res.status(200).json(
      new ApiResponse(200, 'Message processed successfully', {
        answer: result,
        sessionId,
        isNewSession
      })
    );
  } catch (error) {
    console.error('AI Chat Error:', error);
    
    // If session error, suggest creating new session
    if (error.message?.includes('session')) {
      throw new ApiError(400, 'Invalid session. Please start a new conversation.');
    }
    
    throw new ApiError(500, 'Failed to process chat message');
  }
});

/**
 * One-off query without session management
 * POST /api/v1/ai/query
 * Body: { message: string }
 */
export const queryOnce = asyncHandler(async (req, res) => {
  const { message } = req.body;

  if (!message) {
    throw new ApiError(400, 'Message is required');
  }

  if (!vectorRetrieval) {
    throw new ApiError(503, 'AI Chat service is not initialized. Please try again later.');
  }

  try {
    const result = await vectorRetrieval.queryOnce(
      SESSION_CONFIG,
      message,
      { debug: true }
    );

    return res.status(200).json(
      new ApiResponse(200, 'Query processed successfully', { answer: result })
    );
  } catch (error) {
    console.error('AI Query Error:', error);
    throw new ApiError(500, 'Failed to process query');
  }
});

/**
 * End an AI chat session
 * DELETE /api/v1/ai/session/:sessionId
 */
export const endSession = asyncHandler(async (req, res) => {
  const { sessionId } = req.params;

  if (!sessionId) {
    throw new ApiError(400, 'Session ID is required');
  }

  const deleted = deleteAISession(sessionId);

  if (!deleted) {
    throw new ApiError(404, 'Session not found');
  }

  return res.status(200).json(
    new ApiResponse(200, 'Session ended successfully', { sessionId })
  );
});

/**
 * Health check for AI service
 * GET /api/v1/ai/health
 */
export const aiHealthCheck = asyncHandler(async (req, res) => {
  const isReady = vectorRetrieval !== null;

  return res.status(isReady ? 200 : 503).json(
    new ApiResponse(
      isReady ? 200 : 503,
      isReady ? 'AI service is ready' : 'AI service is not initialized',
      { ready: isReady }
    )
  );
});
