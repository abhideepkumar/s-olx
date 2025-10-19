import mongoose from "mongoose";

const MessageSchema = new mongoose.Schema(
  {
    messageId: {
      type: String,
      unique: true,
      required: true,
      index: true
    },
    roomId: {
      type: String,
      required: true,
      index: true
    },
    content: {
      text: {
        type: String,
        required: true,
        maxlength: 2000
      },
      type: {
        type: String,
        enum: ['text', 'image', 'file', 'escrow_request', 'escrow_response', 'system'],
        default: 'text'
      },
      metadata: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
      }
    },
    sender: {
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "user",
        required: true,
        index: true
      },
      email: {
        type: String,
        required: true
      },
      name: {
        type: String
      }
    },
    receiver: {
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "user",
        required: true,
        index: true
      },
      email: {
        type: String,
        required: true
      },
      name: {
        type: String
      }
    },
    timestamp: {
      type: Date,
      default: Date.now,
      index: true
    },
    status: {
      type: String,
      enum: ['sent', 'delivered', 'read', 'pending', 'failed'],
      default: 'sent',
      index: true
    },
    escrow: {
      amount: {
        type: Number,
        min: 0
      },
      currency: {
        type: String,
        default: 'INR'
      },
      status: {
        type: String,
        enum: ['pending', 'accepted', 'rejected', 'completed', 'cancelled'],
        default: 'pending'
      },
      escrowId: {
        type: String,
        unique: true,
        sparse: true
      },
      productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "product"
      },
      terms: {
        type: String,
        maxlength: 500
      },
      expiresAt: {
        type: Date
      },
      acceptedAt: {
        type: Date
      },
      completedAt: {
        type: Date
      }
    },
    // Message processing metadata
    processing: {
      batchId: {
        type: String,
        index: true
      },
      processedAt: {
        type: Date
      },
      retryCount: {
        type: Number,
        default: 0
      },
      lastError: {
        type: String
      }
    },
    // Message metadata
    metadata: {
      ipAddress: {
        type: String
      },
      userAgent: {
        type: String
      },
      deviceInfo: {
        type: mongoose.Schema.Types.Mixed
      },
      location: {
        type: mongoose.Schema.Types.Mixed
      }
    }
  },
  {
    timestamps: true,
    collection: 'messages'
  }
);

// Compound indexes for performance
MessageSchema.index({ roomId: 1, timestamp: -1 }); // For room message queries
MessageSchema.index({ sender: 1, timestamp: -1 }); // For sender message queries
MessageSchema.index({ receiver: 1, timestamp: -1 }); // For receiver message queries
MessageSchema.index({ status: 1, timestamp: -1 }); // For status-based queries
MessageSchema.index({ 'escrow.status': 1, timestamp: -1 }); // For escrow queries
MessageSchema.index({ 'processing.batchId': 1 }); // For batch processing
MessageSchema.index({ messageId: 1, roomId: 1 }); // For deduplication

// Text search index for message content
MessageSchema.index({ 'content.text': 'text' });

// TTL index for old messages (optional - keep messages for 1 year)
MessageSchema.index({ timestamp: 1 }, { expireAfterSeconds: 31536000 });

// Virtual for message age
MessageSchema.virtual('age').get(function() {
  return Date.now() - this.timestamp.getTime();
});

// Virtual for escrow status
MessageSchema.virtual('hasEscrow').get(function() {
  return this.escrow && this.escrow.amount > 0;
});

// Pre-save middleware for validation
MessageSchema.pre('save', function(next) {
  // Ensure messageId is unique
  if (!this.messageId) {
    this.messageId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  
  // Validate escrow data
  if (this.escrow && this.escrow.amount > 0) {
    if (!this.escrow.escrowId) {
      this.escrow.escrowId = `escrow_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
  }
  
  next();
});

// Static method for message deduplication
MessageSchema.statics.findDuplicate = function(messageId, roomId) {
  return this.findOne({ messageId, roomId });
};

// Static method for room messages
MessageSchema.statics.getRoomMessages = function(roomId, limit = 50, skip = 0) {
  return this.find({ roomId })
    .sort({ timestamp: -1 })
    .limit(limit)
    .skip(skip)
    .populate('sender.userId', 'name email')
    .populate('receiver.userId', 'name email')
    .populate('escrow.productId', 'title price');
};

// Static method for user messages
MessageSchema.statics.getUserMessages = function(userId, limit = 50, skip = 0) {
  return this.find({
    $or: [
      { 'sender.userId': userId },
      { 'receiver.userId': userId }
    ]
  })
  .sort({ timestamp: -1 })
  .limit(limit)
  .skip(skip)
  .populate('sender.userId', 'name email')
  .populate('receiver.userId', 'name email')
  .populate('escrow.productId', 'title price');
};

// Static method for escrow messages
MessageSchema.statics.getEscrowMessages = function(status = 'pending', limit = 50) {
  return this.find({
    'escrow.status': status,
    'escrow.amount': { $gt: 0 }
  })
  .sort({ timestamp: -1 })
  .limit(limit)
  .populate('sender.userId', 'name email')
  .populate('receiver.userId', 'name email')
  .populate('escrow.productId', 'title price');
};

// Instance method for message status update
MessageSchema.methods.updateStatus = function(newStatus) {
  this.status = newStatus;
  if (newStatus === 'read') {
    this.readAt = new Date();
  }
  return this.save();
};

// Instance method for escrow status update
MessageSchema.methods.updateEscrowStatus = function(newStatus, additionalData = {}) {
  if (this.escrow) {
    this.escrow.status = newStatus;
    
    if (newStatus === 'accepted') {
      this.escrow.acceptedAt = new Date();
    } else if (newStatus === 'completed') {
      this.escrow.completedAt = new Date();
    }
    
    // Merge additional data
    Object.assign(this.escrow, additionalData);
  }
  return this.save();
};

export const Message = mongoose.model("Message", MessageSchema);
