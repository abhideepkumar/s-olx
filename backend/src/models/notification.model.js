import mongoose from "mongoose";

const NotificationSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "StudentModel",
      required: true,
    },
    message: { type: String, required: true },
    type: { type: String, enum: ["community", "chat", "product"] },
  },
  { timestamp: true }
);

export const NotificationModel = mongoose.model(
  "NotificationModel",
  NotificationSchema
);
