import mongoose from "mongoose";

const PostSchema = new mongoose.Schema(
  {
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "UserModel",
      required: true,
    },
    content: {
      type: String,
      required: true,
      trim: true,
      maxlength: 280,
    },
    comments: [
      {
        body: {
          type: String,
          required: true,
          trim: true,
        },
        date: { type: Date, required: true, default: Date.now },
      },
    ],
    upvotes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "UserModel",
      },
    ],
    downvotes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "UserModel",
      },
    ],
  },
  { timestamps: true }
);

export const PostModel = mongoose.model("PostModel", PostSchema);
