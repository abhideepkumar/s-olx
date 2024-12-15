import mongoose from 'mongoose';

const ProductSoldSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'product',
      required: true,
    },
    buyer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'user',
      default: null,
    },
    price_locked: {
      type: Number,
    },
    remark: {
      type: String,
    },
  },
  { timestamps: true }
);

export const productSold = mongoose.model('productSold', ProductSoldSchema);
