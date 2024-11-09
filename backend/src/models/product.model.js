import mongoose from "mongoose";

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
      ref: "StudentModel",
      required: true,
    },
    buyer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "StudentModel",
    },
    deal_info: {
      price_locked: {
        type: Number,
      },
      remark: {
        type: String,
      },
      status: {
        type: String,
        enum: ["accepted", "pending"],
        default: "pending",
      },
    },
  },
  { timestamps: true }
);

export const ProductModel = mongoose.model("ProductModel", ProductSchema);
