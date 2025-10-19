import { Conversation } from "../models/conversation.model.js";
import { Message } from "../models/message.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { user } from "../models/user.model.js";

// Start a new conversation (Contact Seller)
const startConversation = asyncHandler(async (req, res) => {
  const { productId, sellerId } = req.body;
  const buyerId = req.user._id;

  if (!productId || !sellerId) {
    throw new ApiError(400, "Product ID and seller ID are required");
  }

  if (buyerId.toString() === sellerId) {
    throw new ApiError(400, "Cannot start conversation with yourself");
  }

  // Get seller information
  const seller = await user.findById(sellerId).select("email username avatar");
  if (!seller) {
    throw new ApiError(404, "Seller not found");
  }

  // Generate room ID
  const participantIds = [buyerId.toString(), sellerId].sort();
  const roomId = `product_${productId}_users_${participantIds.join('_')}`;

  // Check if conversation already exists
  let conversation = await Conversation.findOne({ roomId });

  if (!conversation) {
    // Create new conversation
    const participants = [
      {
        userId: buyerId,
        email: req.user.email,
        name: req.user.username || req.user.email
      },
      {
        userId: sellerId,
        email: seller.email,
        name: seller.username || seller.email
      }
    ];

    conversation = new Conversation({
      roomId,
      participants,
      product: {
        productId,
        title: req.body.productTitle || "Product",
        price: req.body.productPrice || 0,
        images: req.body.productImages || []
      },
      metadata: {
        messageCount: 0,
        lastActivity: new Date(),
        isActive: true
      }
    });

    await conversation.save();
  }

  // Get recent messages
  const recentMessages = await Message.find({ roomId })
    .sort({ timestamp: -1 })
    .limit(20)
    .populate('sender.userId', 'username email avatar')
    .populate('receiver.userId', 'username email avatar')
    .lean();

  return res.status(200).json(
    new ApiResponse(200, {
      conversation,
      recentMessages: recentMessages.reverse(),
      roomId
    }, "Conversation started successfully")
  );
});

// Get user conversations
const getUserConversations = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { page = 1, limit = 20 } = req.query;

  const conversations = await Conversation.find({
    'participants.userId': userId,
    'metadata.isActive': true
  })
    .sort({ 'metadata.lastActivity': -1 })
    .populate('participants.userId', 'username email avatar')
    .populate('product.productId', 'title price images')
    .skip((page - 1) * limit)
    .limit(parseInt(limit));

  // Get message counts for each conversation
  const conversationsWithCounts = await Promise.all(
    conversations.map(async (conv) => {
      const messageCount = await Message.countDocuments({ roomId: conv.roomId });
      const unreadCount = await Message.countDocuments({
        roomId: conv.roomId,
        'receiver.userId': userId,
        status: { $in: ['sent', 'delivered'] }
      });

      return {
        ...conv.toObject(),
        messageCount,
        unreadCount
      };
    })
  );

  return res.status(200).json(
    new ApiResponse(200, {
      conversations: conversationsWithCounts,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: conversationsWithCounts.length
      }
    }, "User conversations retrieved successfully")
  );
});

// Get conversation messages
const getConversationMessages = asyncHandler(async (req, res) => {
  const { roomId } = req.params;
  const userId = req.user._id;
  const { page = 1, limit = 50 } = req.query;

  // Verify user is participant
  const conversation = await Conversation.findOne({
    roomId,
    'participants.userId': userId
  });

  if (!conversation) {
    throw new ApiError(404, "Conversation not found or access denied");
  }

  const messages = await Message.find({ roomId })
    .sort({ timestamp: -1 })
    .populate('sender.userId', 'username email avatar')
    .populate('receiver.userId', 'username email avatar')
    .skip((page - 1) * limit)
    .limit(parseInt(limit));

  // Mark messages as read
  await Message.updateMany(
    {
      roomId,
      'receiver.userId': userId,
      status: { $in: ['sent', 'delivered'] }
    },
    { status: 'read' }
  );

  return res.status(200).json(
    new ApiResponse(200, {
      messages: messages.reverse(),
      conversation,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: messages.length
      }
    }, "Conversation messages retrieved successfully")
  );
});

// Get conversation by room ID
const getConversation = asyncHandler(async (req, res) => {
  const { roomId } = req.params;
  const userId = req.user._id;

  const conversation = await Conversation.findOne({
    roomId,
    'participants.userId': userId
  })
    .populate('participants.userId', 'username email avatar')
    .populate('product.productId', 'title price images');

  if (!conversation) {
    throw new ApiError(404, "Conversation not found or access denied");
  }

  return res.status(200).json(
    new ApiResponse(200, conversation, "Conversation retrieved successfully")
  );
});

// Archive conversation
const archiveConversation = asyncHandler(async (req, res) => {
  const { roomId } = req.params;
  const userId = req.user._id;

  const conversation = await Conversation.findOneAndUpdate(
    {
      roomId,
      'participants.userId': userId
    },
    {
      'metadata.archived': true,
      'metadata.isActive': false
    },
    { new: true }
  );

  if (!conversation) {
    throw new ApiError(404, "Conversation not found or access denied");
  }

  return res.status(200).json(
    new ApiResponse(200, conversation, "Conversation archived successfully")
  );
});

// Delete conversation
const deleteConversation = asyncHandler(async (req, res) => {
  const { roomId } = req.params;
  const userId = req.user._id;

  const conversation = await Conversation.findOne({
    roomId,
    'participants.userId': userId
  });

  if (!conversation) {
    throw new ApiError(404, "Conversation not found or access denied");
  }

  // Soft delete - mark as inactive
  conversation.metadata.isActive = false;
  conversation.metadata.archived = true;
  await conversation.save();

  return res.status(200).json(
    new ApiResponse(200, null, "Conversation deleted successfully")
  );
});

export {
  startConversation,
  getUserConversations,
  getConversationMessages,
  getConversation,
  archiveConversation,
  deleteConversation
};
