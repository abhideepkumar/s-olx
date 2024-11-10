import mongoose from "mongoose";

const NotificationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "UserModel",
      required: true,
    },
    message: { type: String, required: true },
    type: { type: String, enum: ["community", "chat", "product"] },
  },
  { timestamps: true }
);

export const NotificationModel = mongoose.model(
  "NotificationModel",
  NotificationSchema
);
