import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { vectorRetrieval } from '../services/vectorsync.service.js';

// Chat with AI using RAG
export const chatWithAI = asyncHandler(async (req, res) => {
  const { query } = req.body;

  // Validate required fields
  if (!query) {
    throw new ApiError(400, 'Query is required');
  }

  if (!vectorRetrieval) {
    throw new ApiError(503, 'AI service is not initialized. Please try again later.');
  }

  try {
    // Use queryOnce for stateless RAG query with debugging enabled
    const result = await vectorRetrieval.queryOnce(
      query,
      {
        topK: 5,
        includeMetadata: true
      },
      {
        provider: 'ollama',
        model: 'llama3.2:latest',
        systemPrompt: `You are a helpful AI assistant for an online marketplace called S-OLX. 
Your role is to help users find products based on their queries. 
Use the provided context to give accurate and helpful responses about available products.
If the context doesn't contain relevant information, politely say so and suggest the user try a different search.
Always be friendly, concise, and helpful.`,
        temperature: 0.7,
        maxTokens: 500
      },
      true // Enable debug mode to get retrieved documents
    );

    // The result contains both the AI response and retrieved documents
    return res.status(200).json(
      new ApiResponse(200, 'AI response generated successfully', {
        response: result.response,
        retrievedDocuments: result.retrievedDocuments || []
      })
    );
  } catch (error) {
    console.error('Error in chatWithAI:', error);
    throw new ApiError(500, `Error generating AI response: ${error.message}`);
  }
});
