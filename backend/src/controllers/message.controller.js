import { Message } from "../models/message.model.js";
import { Conversation } from "../models/conversation.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import messagePersistenceEnhancedService from "../services/message-persistence-enhanced.service.js";

// Send a new message
const sendMessage = asyncHandler(async (req, res) => {
  const { roomId, content, receiverId, escrow } = req.body;
  const senderId = req.user._id;

  if (!roomId || !content || !receiverId) {
    throw new ApiError(400, "Room ID, content, and receiver ID are required");
  }

  if (senderId.toString() === receiverId) {
    throw new Error("Cannot send message to yourself");
  }

  // Generate unique message ID
  const messageId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  // Create message object
  const messageData = {
    messageId,
    roomId,
    content: {
      text: content.text,
      type: content.type || 'text',
      metadata: content.metadata || {}
    },
    sender: {
      userId: senderId,
      email: req.user.email,
      name: req.user.name || req.user.email
    },
    receiver: {
      userId: receiverId,
      email: req.body.receiverEmail || 'unknown@example.com',
      name: req.body.receiverName || 'Unknown User'
    },
    timestamp: new Date(),
    status: 'sent',
    escrow: escrow || null,
    processing: {
      batchId: null,
      processedAt: null,
      retryCount: 0,
      lastError: null
    },
    metadata: {
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      deviceInfo: req.body.deviceInfo || {},
      location: req.body.location || {}
    }
  };

  // Save to NDJSON file immediately
  await messagePersistenceEnhancedService.saveMessage(messageData);

  // Create message in database
  const message = new Message(messageData);
  await message.save();

  // Update conversation metadata
  let conversation = await Conversation.findOne({ roomId });
  if (!conversation) {
    // Create new conversation
    conversation = await Conversation.findOrCreate(
      [
        {
          userId: senderId,
          email: req.user.email,
          name: req.user.name || req.user.email
        },
        {
          userId: receiverId,
          email: req.body.receiverEmail || 'unknown@example.com',
          name: req.body.receiverName || 'Unknown User'
        }
      ],
      req.body.productInfo || null
    );
  }

  await conversation.updateLastMessage(messageData);

  // Update escrow info if present
  if (escrow && escrow.amount > 0) {
    await conversation.updateEscrowInfo(escrow);
  }

  return res.status(201).json(
    new ApiResponse(201, message, "Message sent successfully")
  );
});

// Get messages by room
const getRoomMessages = asyncHandler(async (req, res) => {
  const { roomId } = req.params;
  const { limit = 50, skip = 0 } = req.query;
  const userId = req.user._id;

  if (!roomId) {
    throw new ApiError(400, "Room ID is required");
  }

  // Check if user is participant in conversation
  const conversation = await Conversation.findOne({ roomId });
  if (!conversation) {
    throw new ApiError(404, "Conversation not found");
  }

  const isParticipant = conversation.participants.some(
    p => p.userId.toString() === userId.toString()
  );

  if (!isParticipant) {
    throw new ApiError(403, "Not authorized to view this conversation");
  }

  // Get messages from database
  const messages = await Message.getRoomMessages(roomId, parseInt(limit), parseInt(skip));

  // Mark messages as read
  await conversation.markAsRead(userId);

  return res.status(200).json(
    new ApiResponse(200, {
      roomId,
      messages,
      conversation: {
        participants: conversation.participants,
        metadata: conversation.metadata,
        escrow: conversation.escrow
      }
    }, "Room messages retrieved successfully")
  );
});

// Get user's conversations
const getUserConversations = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { limit = 20, skip = 0 } = req.query;

  const conversations = await Conversation.getUserConversations(
    userId,
    parseInt(limit),
    parseInt(skip)
  );

  return res.status(200).json(
    new ApiResponse(200, conversations, "User conversations retrieved successfully")
  );
});

// Update message status
const updateMessageStatus = asyncHandler(async (req, res) => {
  const { messageId } = req.params;
  const { status } = req.body;
  const userId = req.user._id;

  if (!status) {
    throw new ApiError(400, "Status is required");
  }

  const message = await Message.findOne({ messageId });
  if (!message) {
    throw new ApiError(404, "Message not found");
  }

  // Check if user is sender or receiver
  const isAuthorized = message.sender.userId.toString() === userId.toString() ||
                      message.receiver.userId.toString() === userId.toString();

  if (!isAuthorized) {
    throw new ApiError(403, "Not authorized to update this message");
  }

  await message.updateStatus(status);

  return res.status(200).json(
    new ApiResponse(200, message, "Message status updated successfully")
  );
});

// Update escrow status
const updateEscrowStatus = asyncHandler(async (req, res) => {
  const { messageId } = req.params;
  const { status, additionalData } = req.body;
  const userId = req.user._id;

  if (!status) {
    throw new ApiError(400, "Status is required");
  }

  const message = await Message.findOne({ messageId });
  if (!message) {
    throw new ApiError(404, "Message not found");
  }

  // Check if user is sender or receiver
  const isAuthorized = message.sender.userId.toString() === userId.toString() ||
                      message.receiver.userId.toString() === userId.toString();

  if (!isAuthorized) {
    throw new ApiError(403, "Not authorized to update this message");
  }

  if (!message.escrow || message.escrow.amount <= 0) {
    throw new ApiError(400, "Message does not have escrow");
  }

  await message.updateEscrowStatus(status, additionalData);

  // Update conversation escrow info
  const conversation = await Conversation.findOne({ roomId: message.roomId });
  if (conversation) {
    await conversation.updateEscrowInfo({
      escrowId: message.escrow.escrowId,
      amount: message.escrow.amount,
      status: status,
      ...additionalData
    });
  }

  return res.status(200).json(
    new ApiResponse(200, message, "Escrow status updated successfully")
  );
});

// Search messages
const searchMessages = asyncHandler(async (req, res) => {
  const { query, limit = 100 } = req.query;
  const userId = req.user._id;

  if (!query) {
    throw new ApiError(400, "Search query is required");
  }

  // Search in NDJSON file
  const messages = await messagePersistenceService.searchMessages(query, parseInt(limit));

  // Filter messages where user is sender or receiver
  const userMessages = messages.filter(msg => 
    msg.sender.userId.toString() === userId.toString() ||
    msg.receiver.userId.toString() === userId.toString()
  );

  return res.status(200).json(
    new ApiResponse(200, userMessages, "Messages found successfully")
  );
});

// Get escrow messages
const getEscrowMessages = asyncHandler(async (req, res) => {
  const { status = 'pending', limit = 50 } = req.query;
  const userId = req.user._id;

  const messages = await Message.getEscrowMessages(status, parseInt(limit));

  // Filter messages where user is sender or receiver
  const userMessages = messages.filter(msg => 
    msg.sender.userId.toString() === userId.toString() ||
    msg.receiver.userId.toString() === userId.toString()
  );

  return res.status(200).json(
    new ApiResponse(200, userMessages, "Escrow messages retrieved successfully")
  );
});

// Get message statistics
const getMessageStats = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  // Get user's message count
  const totalMessages = await Message.countDocuments({
    $or: [
      { 'sender.userId': userId },
      { 'receiver.userId': userId }
    ]
  });

  // Get user's conversation count
  const totalConversations = await Conversation.countDocuments({
    'participants.userId': userId
  });

  // Get unread message count
  const conversations = await Conversation.find({
    'participants.userId': userId
  });

  let totalUnread = 0;
  conversations.forEach(conv => {
    const unreadCount = conv.metadata.unreadCount.get(userId.toString()) || 0;
    totalUnread += unreadCount;
  });

  // Get escrow statistics
  const escrowMessages = await Message.find({
    $or: [
      { 'sender.userId': userId },
      { 'receiver.userId': userId }
    ],
    'escrow.amount': { $gt: 0 }
  });

  const escrowStats = {
    total: escrowMessages.length,
    pending: escrowMessages.filter(m => m.escrow.status === 'pending').length,
    accepted: escrowMessages.filter(m => m.escrow.status === 'accepted').length,
    completed: escrowMessages.filter(m => m.escrow.status === 'completed').length,
    totalAmount: escrowMessages.reduce((sum, m) => sum + (m.escrow.amount || 0), 0)
  };

  return res.status(200).json(
    new ApiResponse(200, {
      totalMessages,
      totalConversations,
      totalUnread,
      escrowStats
    }, "Message statistics retrieved successfully")
  );
});

// Archive conversation
const archiveConversation = asyncHandler(async (req, res) => {
  const { roomId } = req.params;
  const userId = req.user._id;

  const conversation = await Conversation.findOne({ roomId });
  if (!conversation) {
    throw new ApiError(404, "Conversation not found");
  }

  const isParticipant = conversation.participants.some(
    p => p.userId.toString() === userId.toString()
  );

  if (!isParticipant) {
    throw new ApiError(403, "Not authorized to archive this conversation");
  }

  await conversation.archive();

  return res.status(200).json(
    new ApiResponse(200, conversation, "Conversation archived successfully")
  );
});

// Unarchive conversation
const unarchiveConversation = asyncHandler(async (req, res) => {
  const { roomId } = req.params;
  const userId = req.user._id;

  const conversation = await Conversation.findOne({ roomId });
  if (!conversation) {
    throw new ApiError(404, "Conversation not found");
  }

  const isParticipant = conversation.participants.some(
    p => p.userId.toString() === userId.toString()
  );

  if (!isParticipant) {
    throw new ApiError(403, "Not authorized to unarchive this conversation");
  }

  await conversation.unarchive();

  return res.status(200).json(
    new ApiResponse(200, conversation, "Conversation unarchived successfully")
  );
});

export {
  sendMessage,
  getRoomMessages,
  getUserConversations,
  updateMessageStatus,
  updateEscrowStatus,
  searchMessages,
  getEscrowMessages,
  getMessageStats,
  archiveConversation,
  unarchiveConversation
};
