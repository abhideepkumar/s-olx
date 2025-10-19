import { ProductEmbedding } from '../models/product.embedding.model.js';
import { product } from '../models/product.model.js';
import { embeddingService } from './embedding.service.js';
import { ApiError } from '../utils/ApiError.js';

class SemanticSearchService {
  constructor() {
    this.similarityThreshold = 0.3; // Minimum similarity score
    this.maxResults = 20; // Maximum results to return
  }

  /**
   * Generate or update embedding for a product
   * @param {Object} productData - Product data
   * @returns {Promise<Object>} - Embedding document
   */
  async generateProductEmbedding(productData) {
    try {
      // Create combined text for embedding
      const combinedText = this.createCombinedText(productData);
      
      // Generate embedding
      const embedding = await embeddingService.generateEmbedding(combinedText);
      
      // Save or update embedding
      const embeddingDoc = await ProductEmbedding.findOneAndUpdate(
        { product: productData._id },
        {
          product: productData._id,
          combinedText,
          embedding,
          lastUpdated: new Date(),
        },
        { upsert: true, new: true }
      );

      return embeddingDoc;
    } catch (error) {
      throw new Error('Failed to generate product embedding');
    }
  }

  /**
   * Perform semantic search
   * @param {string} query - Search query
   * @param {Object} options - Search options
   * @returns {Promise<Array>} - Search results
   */
  async semanticSearch(query, options = {}) {
    try {
      const {
        limit = this.maxResults,
        threshold = this.similarityThreshold,
        category = null,
        minPrice = null,
        maxPrice = null,
        condition = null,
      } = options;

      // Generate query embedding
      const queryEmbedding = await embeddingService.generateEmbedding(query);
      
      // Build aggregation pipeline
      const pipeline = [
        // Match filters first for efficiency
        ...this.buildFilterStage(category, minPrice, maxPrice, condition),
        
        // Add similarity calculation
        {
          $addFields: {
            similarity: {
              $let: {
                vars: {
                  queryVector: queryEmbedding,
                  productVector: '$embedding',
                },
                in: {
                  $divide: [
                    {
                      $reduce: {
                        input: { $range: [0, { $size: '$embedding' }] },
                        initialValue: 0,
                        in: {
                          $add: [
                            '$$value',
                            {
                              $multiply: [
                                { $arrayElemAt: ['$$queryVector', '$$this'] },
                                { $arrayElemAt: ['$$productVector', '$$this'] },
                              ],
                            },
                          ],
                        },
                      },
                    },
                    {
                      $multiply: [
                        {
                          $sqrt: {
                            $reduce: {
                              input: '$embedding',
                              initialValue: 0,
                              in: { $add: ['$$value', { $multiply: ['$$this', '$$this'] }] },
                            },
                          },
                        },
                        {
                          $sqrt: {
                            $reduce: {
                              input: queryEmbedding,
                              initialValue: 0,
                              in: { $add: ['$$value', { $multiply: ['$$this', '$$this'] }] },
                            },
                          },
                        },
                      ],
                    },
                  ],
                },
              },
            },
          },
        },
        
        // Filter by similarity threshold
        {
          $match: {
            similarity: { $gte: threshold },
          },
        },
        
        // Sort by similarity
        {
          $sort: { similarity: -1 },
        },
        
        // Limit results
        {
          $limit: limit,
        },
        
        // Lookup product details
        {
          $lookup: {
            from: 'products',
            localField: 'product',
            foreignField: '_id',
            as: 'productDetails',
          },
        },
        
        // Unwind product details
        {
          $unwind: '$productDetails',
        },
        
        // Project final result
        {
          $project: {
            _id: '$productDetails._id',
            title: '$productDetails.title',
            description: '$productDetails.description',
            price: '$productDetails.price',
            images: '$productDetails.images',
            condition: '$productDetails.condition',
            category: '$productDetails.category',
            tags: '$productDetails.tags',
            seller: '$productDetails.seller',
            createdAt: '$productDetails.createdAt',
            similarity: 1,
            searchScore: { $multiply: ['$similarity', 100] }, // Convert to percentage
          },
        },
      ];

      const results = await ProductEmbedding.aggregate(pipeline);
      
      return results;
    } catch (error) {
      throw new ApiError(500, 'Semantic search failed');
    }
  }

  /**
   * Get product recommendations
   * @param {string} productId - Product ID
   * @param {Object} options - Recommendation options
   * @returns {Promise<Array>} - Recommended products
   */
  async getRecommendations(productId, options = {}) {
    try {
      const {
        limit = 5,
        threshold = 0.4,
        excludeSameSeller = true,
      } = options;

      // Get product embedding
      const productEmbedding = await ProductEmbedding.findOne({ product: productId });
      if (!productEmbedding) {
        throw new ApiError(404, 'Product embedding not found');
      }

      // Get product details for filtering
      const productDetails = await product.findById(productId);
      if (!productDetails) {
        throw new ApiError(404, 'Product not found');
      }

      // Build aggregation pipeline
      const pipeline = [
        // Exclude the current product
        {
          $match: {
            product: { $ne: productId },
          },
        },
        
        // Add similarity calculation
        {
          $addFields: {
            similarity: {
              $let: {
                vars: {
                  queryVector: productEmbedding.embedding,
                  productVector: '$embedding',
                },
                in: {
                  $divide: [
                    {
                      $reduce: {
                        input: { $range: [0, { $size: '$embedding' }] },
                        initialValue: 0,
                        in: {
                          $add: [
                            '$$value',
                            {
                              $multiply: [
                                { $arrayElemAt: ['$$queryVector', '$$this'] },
                                { $arrayElemAt: ['$$productVector', '$$this'] },
                              ],
                            },
                          ],
                        },
                      },
                    },
                    {
                      $multiply: [
                        {
                          $sqrt: {
                            $reduce: {
                              input: '$embedding',
                              initialValue: 0,
                              in: { $add: ['$$value', { $multiply: ['$$this', '$$this'] }] },
                            },
                          },
                        },
                        {
                          $sqrt: {
                            $reduce: {
                              input: productEmbedding.embedding,
                              initialValue: 0,
                              in: { $add: ['$$value', { $multiply: ['$$this', '$$this'] }] },
                            },
                          },
                        },
                      ],
                    },
                  ],
                },
              },
            },
          },
        },
        
        // Filter by similarity threshold
        {
          $match: {
            similarity: { $gte: threshold },
          },
        },
        
        // Sort by similarity
        {
          $sort: { similarity: -1 },
        },
        
        // Limit results
        {
          $limit: limit * 2, // Get more to filter later
        },
        
        // Lookup product details
        {
          $lookup: {
            from: 'products',
            localField: 'product',
            foreignField: '_id',
            as: 'productDetails',
          },
        },
        
        // Unwind product details
        {
          $unwind: '$productDetails',
        },
      ];

      // Add seller filter if needed
      if (excludeSameSeller) {
        pipeline.push({
          $match: {
            'productDetails.seller': { $ne: productDetails.seller },
          },
        });
      }

      // Add final projection and limit
      pipeline.push(
        {
          $project: {
            _id: '$productDetails._id',
            title: '$productDetails.title',
            description: '$productDetails.description',
            price: '$productDetails.price',
            images: '$productDetails.images',
            condition: '$productDetails.condition',
            category: '$productDetails.category',
            tags: '$productDetails.tags',
            seller: '$productDetails.seller',
            createdAt: '$productDetails.createdAt',
            similarity: 1,
            recommendationScore: { $multiply: ['$similarity', 100] },
          },
        },
        {
          $limit: limit,
        }
      );

      const results = await ProductEmbedding.aggregate(pipeline);
      
      return results;
    } catch (error) {
      throw new ApiError(500, 'Failed to get recommendations');
    }
  }

  /**
   * Create combined text for embedding
   * @param {Object} productData - Product data
   * @returns {string} - Combined text
   */
  createCombinedText(productData) {
    const parts = [
      productData.title,
      productData.description,
      productData.more_info || '',
      productData.condition,
      productData.category,
      ...(productData.tags || []),
    ];

    return parts
      .filter(part => part && part.trim())
      .join(' ')
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Build filter stage for aggregation
   * @param {string} category - Category filter
   * @param {number} minPrice - Minimum price
   * @param {number} maxPrice - Maximum price
   * @param {string} condition - Condition filter
   * @returns {Array} - Filter stages
   */
  buildFilterStage(category, minPrice, maxPrice, condition) {
    const stages = [];

    // Add lookup to get product details for filtering
    stages.push({
      $lookup: {
        from: 'products',
        localField: 'product',
        foreignField: '_id',
        as: 'productDetails',
      },
    });

    stages.push({
      $unwind: '$productDetails',
    });

    // Build match conditions
    const matchConditions = {};

    if (category) {
      matchConditions['productDetails.category'] = category;
    }

    if (minPrice || maxPrice) {
      matchConditions['productDetails.price'] = {};
      if (minPrice) matchConditions['productDetails.price'].$gte = minPrice;
      if (maxPrice) matchConditions['productDetails.price'].$lte = maxPrice;
    }

    if (condition) {
      matchConditions['productDetails.condition'] = condition;
    }

    if (Object.keys(matchConditions).length > 0) {
      stages.push({
        $match: matchConditions,
      });
    }

    return stages;
  }

  /**
   * Batch generate embeddings for all products
   * @returns {Promise<Object>} - Batch operation result
   */
  async batchGenerateEmbeddings() {
    try {
      const products = await product.find({});
      const results = {
        total: products.length,
        success: 0,
        failed: 0,
        errors: [],
      };

      for (const productData of products) {
        try {
          await this.generateProductEmbedding(productData);
          results.success++;
        } catch (error) {
          results.failed++;
          results.errors.push({
            productId: productData._id,
            error: error.message,
          });
        }
      }

      return results;
    } catch (error) {
      throw new ApiError(500, 'Batch embedding generation failed');
    }
  }

  /**
   * Update embedding for a specific product
   * @param {string} productId - Product ID
   * @returns {Promise<Object>} - Updated embedding
   */
  async updateProductEmbedding(productId) {
    try {
      const productData = await product.findById(productId);
      if (!productData) {
        throw new ApiError(404, 'Product not found');
      }

      return await this.generateProductEmbedding(productData);
    } catch (error) {
      throw new ApiError(500, 'Failed to update product embedding');
    }
  }
}

export const semanticSearchService = new SemanticSearchService();
