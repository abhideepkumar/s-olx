import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import messageBatchService from "../services/message-batch.service.js";

// Get queue statistics
const getQueueStats = asyncHandler(async (req, res) => {
  const stats = messageBatchService.getQueueStats();
  
  return res.status(200).json(
    new ApiResponse(200, stats, "Queue statistics retrieved successfully")
  );
});

// Get messages by room
const getMessagesByRoom = asyncHandler(async (req, res) => {
  const { roomId } = req.params;
  
  if (!roomId) {
    throw new ApiError(400, "Room ID is required");
  }
  
  const messages = messageBatchService.getMessagesByRoom(roomId);
  
  return res.status(200).json(
    new ApiResponse(200, { roomId, messages }, "Room messages retrieved successfully")
  );
});

// Process batch manually
const processBatchNow = asyncHandler(async (req, res) => {
  try {
    const result = await messageBatchService.processBatchNow();
    
    return res.status(200).json(
      new ApiResponse(200, result, "Batch processed successfully")
    );
  } catch (error) {
    throw new ApiError(400, error.message);
  }
});

// Clear message queue
const clearQueue = asyncHandler(async (req, res) => {
  await messageBatchService.clearQueue();
  
  return res.status(200).json(
    new ApiResponse(200, null, "Message queue cleared successfully")
  );
});

// Health check
const healthCheck = asyncHandler(async (req, res) => {
  const health = await messageBatchService.healthCheck();
  
  const statusCode = health.status === 'healthy' ? 200 : 503;
  
  return res.status(statusCode).json(
    new ApiResponse(statusCode, health, "Health check completed")
  );
});

// Get queue file contents (for debugging)
const getQueueFile = asyncHandler(async (req, res) => {
  const fs = await import('fs/promises');
  const path = await import('path');
  const { fileURLToPath } = await import('url');
  
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const queueFilePath = path.join(__dirname, '../../utils/messages_queue.json');
  
  try {
    const fileContent = await fs.readFile(queueFilePath, 'utf8');
    const queueData = JSON.parse(fileContent);
    
    return res.status(200).json(
      new ApiResponse(200, queueData, "Queue file contents retrieved successfully")
    );
  } catch (error) {
    throw new ApiError(404, "Queue file not found or cannot be read");
  }
});

export {
  getQueueStats,
  getMessagesByRoom,
  processBatchNow,
  clearQueue,
  healthCheck,
  getQueueFile
};
