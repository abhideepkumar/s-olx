import mongoose from 'mongoose';

const NotificationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'user',
      required: true,
    },
    message: { type: String, required: true },
    type: { type: String, enum: ['community', 'chat', 'product'] },
  },
  { timestamps: true }
);

export const notification = mongoose.model('notification', NotificationSchema);
