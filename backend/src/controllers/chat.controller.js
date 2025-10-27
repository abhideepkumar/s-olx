import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { chat } from '../models/chat.model.js';
import mongoose from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import persistenceService from '../services/persistence.service.js';

// Add a new message
export const addMessage = asyncHandler(async (req, res) => {
  const { content, senderId, receiverId, escrow } = req.body;

  // Validate required fields
  if (!content?.text || !senderId || !receiverId) {
    throw new ApiError(400, 'Content text, senderId, and receiverId are required');
  }

  // Validate ObjectId format
  if (!mongoose.Types.ObjectId.isValid(senderId) || !mongoose.Types.ObjectId.isValid(receiverId)) {
    throw new ApiError(400, 'Invalid senderId or receiverId format');
  }

  // Generate unique messageId
  const messageId = uuidv4();

  // Create message data
  const messageData = {
    messageId,
    content: {
      text: content.text
    },
    senderId,
    receiverId,
    status: 'sent',
    escrow: (() => {
      const amount = Number(escrow?.amount);
      if (!isNaN(amount) && amount > 0) {
        return { amount, status: 'pending' };
      }
      return { amount: 0, status: 'null' };
    })()
  };

  try {
    // Store message to disk immediately using persistence service
    const storedMessage = await persistenceService.storeMessage(messageData);
    
    // Return the stored message data (without DB population since it's not in DB yet)
    return res.status(201).json(
      new ApiResponse(201, 'Message sent successfully and stored to disk', {
        ...storedMessage,
        status: 'stored_to_disk',
        note: 'Message will be synced to database within 15 minutes'
      })
    );
  } catch (error) {
    throw new ApiError(500, `Error storing message: ${error.message}`);
  }
});

// Get messages between two users
export const getMessages = asyncHandler(async (req, res) => {
  const { senderId, receiverId } = req.params;

  // Validate ObjectId format
  if (!mongoose.Types.ObjectId.isValid(senderId) || !mongoose.Types.ObjectId.isValid(receiverId)) {
    throw new ApiError(400, 'Invalid senderId or receiverId format');
  }

  try {
    // Fetch all messages where either user is sender and the other is receiver
    const messages = await chat.find({
      $or: [
        { senderId, receiverId },
        { senderId: receiverId, receiverId: senderId }
      ]
    })
    .populate('senderId', 'name email profile_url')
    .populate('receiverId', 'name email profile_url')
    .sort({ timestamp: 1 }); // Sort by timestamp in ascending order (oldest first)

    return res.status(200).json(
      new ApiResponse(200, 'Messages fetched successfully', messages)
    );
  } catch (error) {
    throw new ApiError(500, `Error fetching messages: ${error.message}`);
  }
});

// Update message status (mark as read)
export const updateMessageStatus = asyncHandler(async (req, res) => {
  const { messageId } = req.params;
  const { status } = req.body;

  if (!status || !['read', 'sent', 'pending'].includes(status)) {
    throw new ApiError(400, 'Valid status is required (read, sent, pending)');
  }

  try {
    const updatedMessage = await chat.findOneAndUpdate(
      { messageId },
      { status },
      { new: true, runValidators: true }
    ).populate('senderId', 'name email profile_url')
     .populate('receiverId', 'name email profile_url');

    if (!updatedMessage) {
      throw new ApiError(404, 'Message not found');
    }

    return res.status(200).json(
      new ApiResponse(200, 'Message status updated successfully', updatedMessage)
    );
  } catch (error) {
    throw new ApiError(500, `Error updating message status: ${error.message}`);
  }
});

// Update escrow status
export const updateEscrowStatus = asyncHandler(async (req, res) => {
  const { messageId } = req.params;
  const { escrowStatus, amount } = req.body;

  if (!escrowStatus || !['accepted', 'pending', 'rejected'].includes(escrowStatus)) {
    throw new ApiError(400, 'Valid escrow status is required (accepted, pending, rejected)');
  }

  try {
    const updateData = {
      'escrow.status': escrowStatus
    };

    if (amount !== undefined) {
      updateData['escrow.amount'] = amount;
    }

    const updatedMessage = await chat.findOneAndUpdate(
      { messageId },
      { $set: updateData },
      { new: true, runValidators: true }
    ).populate('senderId', 'name email profile_url')
     .populate('receiverId', 'name email profile_url');

    if (!updatedMessage) {
      throw new ApiError(404, 'Message not found');
    }

    return res.status(200).json(
      new ApiResponse(200, 'Escrow status updated successfully', updatedMessage)
    );
  } catch (error) {
    throw new ApiError(500, `Error updating escrow status: ${error.message}`);
  }
});

// Trigger batch processing manually
export const triggerBatchProcessing = asyncHandler(async (req, res) => {
  try {
    await persistenceService.triggerBatchProcessing();
    
    return res.status(200).json(
      new ApiResponse(200, 'Batch processing triggered successfully', {
        pendingCount: persistenceService.getPendingMessageCount()
      })
    );
  } catch (error) {
    throw new ApiError(500, `Error triggering batch processing: ${error.message}`);
  }
});

// Get pending messages count
export const getPendingMessagesCount = asyncHandler(async (req, res) => {
  try {
    const count = persistenceService.getPendingMessageCount();
    
    return res.status(200).json(
      new ApiResponse(200, 'Pending messages count fetched successfully', {
        pendingCount: count
      })
    );
  } catch (error) {
    throw new ApiError(500, `Error getting pending messages count: ${error.message}`);
  }
});

// Get pending messages (for debugging)
export const getPendingMessages = asyncHandler(async (req, res) => {
  try {
    const messages = persistenceService.getPendingMessages();
    
    return res.status(200).json(
      new ApiResponse(200, 'Pending messages fetched successfully', {
        messages,
        count: messages.length
      })
    );
  } catch (error) {
    throw new ApiError(500, `Error getting pending messages: ${error.message}`);
  }
});
