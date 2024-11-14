import mongoose from "mongoose";

const ChatSchema = new mongoose.Schema(
  {
    participants: [{ type: mongoose.Schema.Types.ObjectId, ref: "user" }],
    product: { type: mongoose.Schema.Types.ObjectId, ref: "product" },
    messages: [
      {
        sender: { type: mongoose.Schema.Types.ObjectId, ref: "user" },
        message: { type: String },
        timestamp: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

export const chat = mongoose.model("chat",ChatSchema)