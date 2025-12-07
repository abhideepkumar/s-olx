import { vectorRetrieval, sessionStore } from '../services/vectorsync.service.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';

// System prompt for the AI assistant
const SYSTEM_PROMPT = `You are an intelligent shopping assistant for S-OLX, a student-to-student marketplace.
Your role is to help students find products based strictly on the provided context.

GUIDELINES:
- Provide a brief, friendly response (2-3 sentences max)
- NEVER list products in text - they appear as visual cards automatically
- If no matches, suggest alternative search terms

EXAMPLE: "Found some great options for you! 🪑 Here are the available chairs."`;

// Session configuration
const SESSION_CONFIG = {
  systemPrompt: SYSTEM_PROMPT,
  contextSources: [{ collectionName: 'products', fields: ['title', 'description', 'more_info', 'condition', 'category', 'price', 'images'] }],
  model: 'qwen2.5-coder:3b',
  provider: 'ollama',
  scoreThreshold: 0.6,
};

// Helper: ensure vectorRetrieval is ready
const ensureReady = () => {
  if (!vectorRetrieval) throw new ApiError(503, 'AI service not initialized');
};

/**
 * Chat with AI - session-based queries
 * POST /api/v1/ai/chat
 */
export const chatWithAI = asyncHandler(async (req, res) => {
  const { message, sessionId: reqSessionId } = req.body;
  if (!message) throw new ApiError(400, 'Message is required');
  ensureReady();

  let sessionId = reqSessionId;
  let isNewSession = false;

  // Create or validate session
  if (!sessionId || !sessionStore.has(sessionId)) {
    sessionId = vectorRetrieval.createSession(SESSION_CONFIG);
    sessionStore.set(sessionId, Date.now());
    isNewSession = true;
  } else {
    sessionStore.set(sessionId, Date.now()); // Update activity
  }

  const result = await vectorRetrieval.query(sessionId, message);

  res.json(new ApiResponse(200, 'Message processed', { answer: result, sessionId, isNewSession }));
});

/**
 * One-off query (stateless)
 * POST /api/v1/ai/query
 */
export const queryOnce = asyncHandler(async (req, res) => {
  const { message } = req.body;
  if (!message) throw new ApiError(400, 'Message is required');
  ensureReady();

  const result = await vectorRetrieval.queryOnce(SESSION_CONFIG, message, { debug: true });

  res.json(new ApiResponse(200, 'Query processed', { answer: result }));
});

/**
 * End session
 * DELETE /api/v1/ai/session/:sessionId
 */
export const endSession = asyncHandler(async (req, res) => {
  const { sessionId } = req.params;
  if (!sessionId) throw new ApiError(400, 'Session ID required');

  if (!sessionStore.has(sessionId)) throw new ApiError(404, 'Session not found');

  vectorRetrieval?.deleteSession(sessionId);
  sessionStore.delete(sessionId);

  res.json(new ApiResponse(200, 'Session ended', { sessionId }));
});

/**
 * Health check
 * GET /api/v1/ai/health
 */
export const aiHealthCheck = asyncHandler(async (req, res) => {
  const ready = vectorRetrieval !== null;
  res.status(ready ? 200 : 503).json(new ApiResponse(ready ? 200 : 503, ready ? 'AI ready' : 'AI not initialized', { ready }));
});
