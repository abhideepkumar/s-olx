import { VectorSync, VectorRetrieval } from 'vectorsync';
import { PineconeVectorDB } from 'vectorsync/dist/adapters/vectordb/pinecone.js';
import { OllamaEmbeddingProvider } from 'vectorsync/dist/adapters/embeddings/ollama.js';
import dotenv from 'dotenv';

dotenv.config();

export let vectorRetrieval = null;

// Simple session store for tracking active sessions
export const sessionStore = new Map();

const config = {
  pineconeApiKey: process.env.PINECONE_API_KEY,
  pineconeIndex: process.env.PINECONE_INDEX,
  mongoUri: process.env.MONGODB_URI,
  ollamaBaseUrl: process.env.OLLAMA_BASE_URL || 'http://localhost:11434',
  embeddingModel: 'mxbai-embed-large:latest'
};

export const initVectorSync = async () => {
  const { pineconeApiKey, pineconeIndex, mongoUri, ollamaBaseUrl, embeddingModel } = config;

  if (!pineconeApiKey || !pineconeIndex || !mongoUri) {
    console.warn('Missing required env vars: PINECONE_API_KEY, PINECONE_INDEX, MONGODB_URI');
    return;
  }

  try {
    // Initialize VectorSync for data synchronization
    const vectorSync = new VectorSync({
      mongoUri,
      vectorDb: { type: 'pinecone', options: { apiKey: pineconeApiKey, index: pineconeIndex } },
      embeddingProvider: { type: 'ollama', options: { baseUrl: ollamaBaseUrl, model: embeddingModel } }
    });

    await vectorSync.createContext('products', {
      fields: ['title', 'description', 'more_info', 'condition', 'category', 'price', 'tags', 'images']
    });

    // Initialize VectorRetrieval for RAG queries
    vectorRetrieval = new VectorRetrieval(
      new PineconeVectorDB(pineconeApiKey, pineconeIndex),
      new OllamaEmbeddingProvider(ollamaBaseUrl, embeddingModel)
    );

    console.log('VectorSync & VectorRetrieval initialized successfully.');
  } catch (error) {
    console.error('Failed to initialize VectorSync:', error);
  }
};
