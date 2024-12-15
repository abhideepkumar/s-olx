import mongoose from 'mongoose';

const ProductSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 280,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    more_info: {
      type: String,
      trim: true,
    },
    price: {
      type: Number,
      required: true,
    },
    condition: {
      type: String,
      required: true,
    },
    tags: [
      {
        type: String,
        required: true,
      },
    ],
    category: {
      type: String,
      required: true,
    },
    images: [
      {
        type: String,
      },
    ],
    seller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'user',
      required: true,
    },
  },
  { timestamps: true }
);

ProductSchema.index({
  title: 'text',
  description: 'text',
  more_info: 'text',
  condition: 'text',
  tags: 'text',
  category: 'text',
});

export const product = mongoose.model('product', ProductSchema);
