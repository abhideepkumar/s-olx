import mongoose from 'mongoose';

const WishlistSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'user',
      required: true,
    },
    products: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'product',
    }]
  },
  { timestamps: true }
);

export const wishlist = mongoose.model('wishlist', WishlistSchema); 