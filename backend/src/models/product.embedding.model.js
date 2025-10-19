import mongoose from 'mongoose';

const ProductEmbeddingSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'product',
      required: true,
      unique: true,
      index: true,
    },
    // Combined text for embedding generation
    combinedText: {
      type: String,
      required: true,
    },
    // Embedding vector (768 dimensions for Google AI Studio embedding-001)
    embedding: {
      type: [Number],
      required: true,
    },
    // Metadata for optimization
    lastUpdated: {
      type: Date,
      default: Date.now,
    },
    // Version for model updates
    embeddingVersion: {
      type: String,
      default: 'v1',
    },
  },
  { timestamps: true }
);

// Index for efficient similarity searches
ProductEmbeddingSchema.index({ product: 1 });
ProductEmbeddingSchema.index({ lastUpdated: 1 });

export const ProductEmbedding = mongoose.model('ProductEmbedding', ProductEmbeddingSchema);
