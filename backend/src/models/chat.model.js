import mongoose from "mongoose";

const ChatSchema = new mongoose.Schema(
  {
    messageId: {
      type: String,
      required: true,
      unique: true
    },
    content: {
      text: {
        type: String,
        required: true
      }
    },
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: true
    },
    receiverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: true
    },
    timestamp: {
      type: Date,
      default: Date.now
    },
    status: {
      type: String,
      enum: ["read", "sent", "pending"],
      default: "pending"
    },
    escrow: {
      amount: {
        type: Number,
        default: 0
      },
      status: {
        type: String,
        enum: ["accepted", "pending", "rejected","null"],
        default: "null"
      }
    }
  },
  { timestamps: true }
);

export const chat = mongoose.model("chat", ChatSchema);