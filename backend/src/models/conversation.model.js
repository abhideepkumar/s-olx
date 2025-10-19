import mongoose from "mongoose";

const ConversationSchema = new mongoose.Schema(
  {
    roomId: {
      type: String,
      unique: true,
      required: true,
      index: true
    },
    participants: [{
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "user",
        required: true
      },
      email: {
        type: String,
        required: true
      },
      name: {
        type: String
      },
      joinedAt: {
        type: Date,
        default: Date.now
      },
      lastSeen: {
        type: Date,
        default: Date.now
      },
      isActive: {
        type: Boolean,
        default: true
      }
    }],
    product: {
      productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "product",
        index: true
      },
      title: {
        type: String
      },
      price: {
        type: Number
      },
      images: [{
        type: String
      }]
    },
    metadata: {
      messageCount: {
        type: Number,
        default: 0
      },
      lastMessageId: {
        type: String
      },
      lastActivity: {
        type: Date,
        default: Date.now,
        index: true
      },
      lastMessage: {
        text: {
          type: String,
          maxlength: 200
        },
        sender: {
          type: String
        },
        timestamp: {
          type: Date
        }
      },
      unreadCount: {
        type: Map,
        of: Number,
        default: new Map()
      },
      isActive: {
        type: Boolean,
        default: true,
        index: true
      },
      archived: {
        type: Boolean,
        default: false,
        index: true
      },
      muted: {
        type: Map,
        of: Boolean,
        default: new Map()
      }
    },
    escrow: {
      totalAmount: {
        type: Number,
        default: 0
      },
      pendingAmount: {
        type: Number,
        default: 0
      },
      completedAmount: {
        type: Number,
        default: 0
      },
      activeEscrows: [{
        escrowId: {
          type: String
        },
        amount: {
          type: Number
        },
        status: {
          type: String,
          enum: ['pending', 'accepted', 'rejected', 'completed', 'cancelled']
        },
        createdAt: {
          type: Date
        }
      }]
    },
    settings: {
      notifications: {
        type: Map,
        of: Boolean,
        default: new Map()
      },
      autoArchive: {
        type: Boolean,
        default: false
      },
      archiveAfterDays: {
        type: Number,
        default: 30
      }
    }
  },
  {
    timestamps: true,
    collection: 'conversations'
  }
);

// Compound indexes for performance
ConversationSchema.index({ 'metadata.lastActivity': -1 }); // For recent conversations
ConversationSchema.index({ 'metadata.isActive': 1, 'metadata.lastActivity': -1 }); // For active conversations
ConversationSchema.index({ 'participants.userId': 1, 'metadata.lastActivity': -1 }); // For user conversations
ConversationSchema.index({ 'product.productId': 1 }); // For product conversations
ConversationSchema.index({ 'escrow.totalAmount': -1 }); // For escrow value sorting
ConversationSchema.index({ 'metadata.archived': 1, 'metadata.lastActivity': -1 }); // For archived conversations

// Text search index for conversation content
ConversationSchema.index({ 'product.title': 'text', 'metadata.lastMessage.text': 'text' });

// Virtual for participant count
ConversationSchema.virtual('participantCount').get(function() {
  return this.participants.length;
});

// Virtual for active participant count
ConversationSchema.virtual('activeParticipantCount').get(function() {
  return this.participants.filter(p => p.isActive).length;
});

// Virtual for conversation age
ConversationSchema.virtual('age').get(function() {
  return Date.now() - this.metadata.lastActivity.getTime();
});

// Pre-save middleware for validation
ConversationSchema.pre('save', function(next) {
  // Ensure roomId is unique
  if (!this.roomId) {
    const participants = this.participants.map(p => p.userId.toString()).sort();
    this.roomId = `room_${participants.join('_')}_${Date.now()}`;
  }
  
  // Update last activity
  this.metadata.lastActivity = new Date();
  
  next();
});

// Static method for finding or creating conversation
ConversationSchema.statics.findOrCreate = async function(participants, productInfo = null) {
  const participantIds = participants.map(p => p.userId.toString()).sort();
  const roomId = `room_${participantIds.join('_')}_${Date.now()}`;
  
  let conversation = await this.findOne({ roomId });
  
  if (!conversation) {
    conversation = await this.create({
      roomId,
      participants,
      product: productInfo,
      metadata: {
        messageCount: 0,
        lastActivity: new Date(),
        isActive: true
      }
    });
  }
  
  return conversation;
};

// Static method for user conversations
ConversationSchema.statics.getUserConversations = function(userId, limit = 20, skip = 0) {
  return this.find({
    'participants.userId': userId,
    'metadata.archived': false
  })
  .sort({ 'metadata.lastActivity': -1 })
  .limit(limit)
  .skip(skip)
  .populate('participants.userId', 'name email')
  .populate('product.productId', 'title price images');
};

// Static method for active conversations
ConversationSchema.statics.getActiveConversations = function(limit = 50) {
  return this.find({
    'metadata.isActive': true,
    'metadata.archived': false
  })
  .sort({ 'metadata.lastActivity': -1 })
  .limit(limit)
  .populate('participants.userId', 'name email')
  .populate('product.productId', 'title price images');
};

// Instance method for adding participant
ConversationSchema.methods.addParticipant = function(participant) {
  const existingParticipant = this.participants.find(p => p.userId.toString() === participant.userId.toString());
  
  if (!existingParticipant) {
    this.participants.push({
      ...participant,
      joinedAt: new Date(),
      lastSeen: new Date(),
      isActive: true
    });
  } else {
    existingParticipant.isActive = true;
    existingParticipant.lastSeen = new Date();
  }
  
  return this.save();
};

// Instance method for removing participant
ConversationSchema.methods.removeParticipant = function(userId) {
  const participant = this.participants.find(p => p.userId.toString() === userId.toString());
  
  if (participant) {
    participant.isActive = false;
    participant.lastSeen = new Date();
  }
  
  return this.save();
};

// Instance method for updating last message
ConversationSchema.methods.updateLastMessage = function(messageData) {
  this.metadata.lastMessage = {
    text: messageData.content.text,
    sender: messageData.sender.email,
    timestamp: messageData.timestamp
  };
  this.metadata.lastMessageId = messageData.messageId;
  this.metadata.messageCount += 1;
  this.metadata.lastActivity = new Date();
  
  return this.save();
};

// Instance method for updating unread count
ConversationSchema.methods.updateUnreadCount = function(userId, increment = 1) {
  const currentCount = this.metadata.unreadCount.get(userId.toString()) || 0;
  this.metadata.unreadCount.set(userId.toString(), currentCount + increment);
  
  return this.save();
};

// Instance method for marking as read
ConversationSchema.methods.markAsRead = function(userId) {
  this.metadata.unreadCount.set(userId.toString(), 0);
  
  // Update participant's last seen
  const participant = this.participants.find(p => p.userId.toString() === userId.toString());
  if (participant) {
    participant.lastSeen = new Date();
  }
  
  return this.save();
};

// Instance method for archiving conversation
ConversationSchema.methods.archive = function() {
  this.metadata.archived = true;
  this.metadata.isActive = false;
  
  return this.save();
};

// Instance method for unarchiving conversation
ConversationSchema.methods.unarchive = function() {
  this.metadata.archived = false;
  this.metadata.isActive = true;
  
  return this.save();
};

// Instance method for updating escrow info
ConversationSchema.methods.updateEscrowInfo = function(escrowData) {
  if (escrowData.amount > 0) {
    this.escrow.totalAmount += escrowData.amount;
    
    if (escrowData.status === 'pending') {
      this.escrow.pendingAmount += escrowData.amount;
    } else if (escrowData.status === 'completed') {
      this.escrow.completedAmount += escrowData.amount;
      this.escrow.pendingAmount -= escrowData.amount;
    }
    
    // Add to active escrows
    this.escrow.activeEscrows.push({
      escrowId: escrowData.escrowId,
      amount: escrowData.amount,
      status: escrowData.status,
      createdAt: new Date()
    });
  }
  
  return this.save();
};

export const Conversation = mongoose.model("Conversation", ConversationSchema);
