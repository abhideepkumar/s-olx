import mongoose from "mongoose";

const TweetSchema = new mongoose.Schema(
  {
    title: {
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
    upvotes: {
      type: Number,
      default: 0,
      min: 0,
    },
    downvotes: {
      type: Number,
      default: 0,
    },
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "StudentModel",
      required: true,
    },
  },
  { timestamps: true }
);

export const TweetModel = mongoose.model("TweetModel", TweetSchema);
