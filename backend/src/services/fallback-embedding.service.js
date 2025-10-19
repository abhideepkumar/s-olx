import dotenv from 'dotenv';

dotenv.config();

class FallbackEmbeddingService {
  constructor() {
    this.embeddingCache = new Map();
    this.vectorSize = 768; // Same size as Google AI Studio embedding-001 model
  }

  /**
   * Generate embedding using simple text features
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
      
      // Generate embedding using text features
      const embedding = this.generateTextFeatures(cleanText);

      // Cache the result
      this.embeddingCache.set(cacheKey, embedding);
      
      return embedding;
    } catch (error) {
      throw new Error('Failed to generate fallback embedding');
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
      throw new Error('Failed to generate fallback embeddings');
    }
  }

  /**
   * Generate text features as embedding
   * @param {string} text - Clean text
   * @returns {number[]} - Feature vector
   */
  generateTextFeatures(text) {
    const words = text.toLowerCase().split(/\s+/);
    const features = new Array(this.vectorSize).fill(0);
    
    // Word frequency features
    const wordFreq = {};
    words.forEach(word => {
      wordFreq[word] = (wordFreq[word] || 0) + 1;
    });

    // Create hash-based features
    Object.keys(wordFreq).forEach(word => {
      const hash = this.simpleHash(word);
      const index = Math.abs(hash) % this.vectorSize;
      features[index] += wordFreq[word] * 0.1;
    });

    // Text length features
    features[0] = Math.min(text.length / 100, 1);
    features[1] = Math.min(words.length / 50, 1);
    
    // Character frequency features
    const charFreq = {};
    text.split('').forEach(char => {
      charFreq[char] = (charFreq[char] || 0) + 1;
    });
    
    Object.keys(charFreq).forEach(char => {
      const hash = this.simpleHash(char);
      const index = (Math.abs(hash) % (this.vectorSize - 10)) + 10;
      features[index] += charFreq[char] * 0.01;
    });

    // Normalize vector
    const magnitude = Math.sqrt(features.reduce((sum, val) => sum + val * val, 0));
    if (magnitude > 0) {
      return features.map(val => val / magnitude);
    }
    
    return features;
  }

  /**
   * Simple hash function
   * @param {string} str - String to hash
   * @returns {number} - Hash value
   */
  simpleHash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash;
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

export const fallbackEmbeddingService = new FallbackEmbeddingService();
