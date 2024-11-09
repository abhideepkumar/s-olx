import mongoose from "mongoose";

const ChatSchema = new mongoose.Schema(
  {
    participants: [{ type: mongoose.Schema.Types.ObjectId, ref: "StudentModel" }],
    product: { type: mongoose.Schema.Types.ObjectId, ref: "ProductModel" },
    messages: [
      {
        sender: { type: mongoose.Schema.Types.ObjectId, ref: "StudentModel" },
        message: { type: String },
        timestamp: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

export const ChatModel = mongoose.model("ChatModel",ChatSchema)