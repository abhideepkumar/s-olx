import mongoose from "mongoose";

const PostSchema = new mongoose.Schema(
  {
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "StudentModel",
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
        date: { type: Date, required: true },
      },
    ],
    upvotes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "StudentModel",
      },
    ],
    downvotes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "StudentModel",
      },
    ],
  },
  { timestamps: true }
);

export const PostModel = mongoose.model("PostModel", PostSchema);
