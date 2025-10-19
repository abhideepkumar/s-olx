import { GoogleGenerativeAI } from '@google/generative-ai';
import { fallbackEmbeddingService } from './fallback-embedding.service.js';
import dotenv from 'dotenv';

dotenv.config();

class EmbeddingService {
  constructor() {
    // Initialize Google AI Studio
    this.genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY);
    this.model = this.genAI.getGenerativeModel({ model: 'embedding-001' });
    this.embeddingCache = new Map(); // Simple in-memory cache
    this.vectorSize = 768; // Gemini embedding-001 produces 768-dimensional vectors
  }

  /**
   * Generate embedding for a given text
   * @param {string} text - Text to embed
   * @returns {Promise<number[]>} - Embedding vector
   */
  async generateEmbedding(text) {
    try {
      // Check cache first
      const cacheKey = this.getCacheKey(text);
      if (this.embeddingCache.has(cacheKey)) {
        return this.embeddingCache.get(cacheKey);
      }

      // Clean and prepare text
      const cleanText = this.preprocessText(text);
      
      let embedding;
      
      // Try Google AI Studio API first
      try {
        embedding = await this.callGoogleAIAPI(cleanText);
      } catch (apiError) {
        // Fallback to local implementation
        embedding = await fallbackEmbeddingService.generateEmbedding(cleanText);
      }

      // Cache the result
      this.embeddingCache.set(cacheKey, embedding);
      
      return embedding;
    } catch (error) {
      throw new Error('Failed to generate embedding');
    }
  }

  /**
   * Call Google AI Studio API for embeddings
   * @param {string} text - Text to embed
   * @returns {Promise<number[]>} - Embedding vector
   */
  async callGoogleAIAPI(text) {
    try {
      const result = await this.model.embedContent(text);
      const embedding = result.embedding.values;
      
      if (!embedding || embedding.length === 0) {
        throw new Error('No embedding returned from Google AI API');
      }
      
      return embedding;
    } catch (error) {
      throw new Error(`Google AI API error: ${error.message}`);
    }
  }

  /**
   * Generate embeddings for multiple texts
   * @param {string[]} texts - Array of texts to embed
   * @returns {Promise<number[][]>} - Array of embedding vectors
   */
  async generateEmbeddings(texts) {
    try {
      const embeddings = await Promise.all(
        texts.map(text => this.generateEmbedding(text))
      );
      return embeddings;
    } catch (error) {
      throw new Error('Failed to generate embeddings');
    }
  }

  /**
   * Calculate cosine similarity between two vectors
   * @param {number[]} vecA - First vector
   * @param {number[]} vecB - Second vector
   * @returns {number} - Similarity score (0-1)
   */
  calculateSimilarity(vecA, vecB) {
    if (vecA.length !== vecB.length) {
      throw new Error('Vectors must have the same length');
    }

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < vecA.length; i++) {
      dotProduct += vecA[i] * vecB[i];
      normA += vecA[i] * vecA[i];
      normB += vecB[i] * vecB[i];
    }

    normA = Math.sqrt(normA);
    normB = Math.sqrt(normB);

    if (normA === 0 || normB === 0) {
      return 0;
    }

    return dotProduct / (normA * normB);
  }

  /**
   * Find similar vectors using cosine similarity
   * @param {number[]} queryVector - Query vector
   * @param {Array<{vector: number[], id: string}>} vectors - Array of vectors with IDs
   * @param {number} threshold - Minimum similarity threshold
   * @returns {Array<{id: string, similarity: number}>} - Similar items
   */
  findSimilarVectors(queryVector, vectors, threshold = 0.3) {
    const similarities = vectors.map(({ vector, id }) => ({
      id,
      similarity: this.calculateSimilarity(queryVector, vector)
    }));

    return similarities
      .filter(item => item.similarity >= threshold)
      .sort((a, b) => b.similarity - a.similarity);
  }

  /**
   * Preprocess text for better embeddings
   * @param {string} text - Raw text
   * @returns {string} - Cleaned text
   */
  preprocessText(text) {
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ') // Remove special characters
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim()
      .substring(0, 512); // Limit length for efficiency
  }

  /**
   * Create cache key for text
   * @param {string} text - Text to cache
   * @returns {string} - Cache key
   */
  getCacheKey(text) {
    return this.preprocessText(text);
  }

  /**
   * Clear embedding cache
   */
  clearCache() {
    this.embeddingCache.clear();
  }

  /**
   * Get cache statistics
   * @returns {Object} - Cache stats
   */
  getCacheStats() {
    return {
      size: this.embeddingCache.size,
      keys: Array.from(this.embeddingCache.keys())
    };
  }
}

export const embeddingService = new EmbeddingService();
