import { VectorSync, VectorRetrieval } from 'vectorsync';
import { PineconeVectorDB } from 'vectorsync/dist/adapters/vectordb/pinecone.js';
import { OllamaEmbeddingProvider } from 'vectorsync/dist/adapters/embeddings/ollama.js';
import dotenv from 'dotenv';

export let vectorRetrieval = null;

// Store active sessions for cleanup
const activeSessions = new Map();

dotenv.config();

export const initVectorSync = async () => {
  try {
    console.log('Initializing VectorSync...');

    const pineconeApiKey = process.env.PINECONE_API_KEY;
    const pineconeIndex = process.env.PINECONE_INDEX;
    const mongoUri = process.env.MONGODB_URI;
    const ollamaBaseUrl = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';

    if (!pineconeApiKey || !pineconeIndex || !mongoUri) {
      console.warn('Missing environment variables for VectorSync. Skipping initialization.');
      console.warn('Required: PINECONE_API_KEY, PINECONE_INDEX, MONGODB_URI');
      return;
    }

    // 1. Initialize VectorSync with Ollama for Embeddings
    const vectorSync = new VectorSync({
      mongoUri,
      vectorDb: {
        type: 'pinecone',
        options: {
          apiKey: pineconeApiKey,
          index: pineconeIndex
        }
      },
      embeddingProvider: {
        type: 'ollama',
        options: {
          baseUrl: ollamaBaseUrl,
          model: 'mxbai-embed-large:latest'
        }
      }
    });

    // 2. Create a Sync Context for products
    await vectorSync.createContext('products', {
      fields: ['title', 'description', 'more_info', 'condition', 'category', 'price', 'tags']
    });

    console.log('VectorSync initialized successfully and watching "products" collection.');

    // 3. Initialize Retrieval Layer with Ollama
    const vectorDbAdapter = new PineconeVectorDB(pineconeApiKey, pineconeIndex);
    const embeddingAdapter = new OllamaEmbeddingProvider(ollamaBaseUrl, 'mxbai-embed-large:latest');

    vectorRetrieval = new VectorRetrieval(vectorDbAdapter, embeddingAdapter);
    
    console.log('VectorRetrieval initialized with Ollama.');

  } catch (error) {
    console.error('Failed to initialize VectorSync:', error);
  }
};

// Session management helpers
export const createAISession = (config) => {
  if (!vectorRetrieval) {
    throw new Error('VectorRetrieval not initialized');
  }
  
  const sessionId = vectorRetrieval.createSession(config);
  activeSessions.set(sessionId, {
    createdAt: Date.now(),
    lastUsed: Date.now()
  });
  
  return sessionId;
};

export const updateSessionActivity = (sessionId) => {
  if (activeSessions.has(sessionId)) {
    activeSessions.get(sessionId).lastUsed = Date.now();
  }
};

export const deleteAISession = (sessionId) => {
  if (vectorRetrieval && activeSessions.has(sessionId)) {
    vectorRetrieval.deleteSession(sessionId);
    activeSessions.delete(sessionId);
    return true;
  }
  return false;
};

// Cleanup stale sessions (older than 30 minutes of inactivity)
export const cleanupStaleSessions = () => {
  const STALE_THRESHOLD = 30 * 60 * 1000; // 30 minutes
  const now = Date.now();
  
  for (const [sessionId, data] of activeSessions.entries()) {
    if (now - data.lastUsed > STALE_THRESHOLD) {
      deleteAISession(sessionId);
      console.log(`Cleaned up stale session: ${sessionId}`);
    }
  }
};

// Run cleanup every 10 minutes
setInterval(cleanupStaleSessions, 10 * 60 * 1000);
