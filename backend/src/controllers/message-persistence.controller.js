import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import messagePersistenceEnhancedService from "../services/message-persistence-enhanced.service.js";

// Get persistence health check
const getPersistenceHealth = asyncHandler(async (req, res) => {
  const health = await messagePersistenceEnhancedService.healthCheck();
  
  const statusCode = health.status === 'healthy' ? 200 : 503;
  
  return res.status(statusCode).json(
    new ApiResponse(statusCode, health, "Persistence health check completed")
  );
});

// Get message status
const getMessageStatus = asyncHandler(async (req, res) => {
  const { messageId } = req.params;
  
  if (!messageId) {
    throw new ApiError(400, "Message ID is required");
  }
  
  const status = messagePersistenceEnhancedService.getMessageStatus(messageId);
  
  if (!status) {
    throw new ApiError(404, "Message status not found");
  }
  
  return res.status(200).json(
    new ApiResponse(200, { messageId, ...status }, "Message status retrieved successfully")
  );
});

// Get all message statuses
const getAllMessageStatuses = asyncHandler(async (req, res) => {
  const statuses = messagePersistenceEnhancedService.getAllMessageStatuses();
  
  return res.status(200).json(
    new ApiResponse(200, statuses, "All message statuses retrieved successfully")
  );
});

// Update message status
const updateMessageStatus = asyncHandler(async (req, res) => {
  const { messageId } = req.params;
  const { status, additionalData } = req.body;
  
  if (!messageId || !status) {
    throw new ApiError(400, "Message ID and status are required");
  }
  
  await messagePersistenceEnhancedService.updateMessageStatus(messageId, status, additionalData);
  
  return res.status(200).json(
    new ApiResponse(200, { messageId, status }, "Message status updated successfully")
  );
});

// Acknowledge message
const acknowledgeMessage = asyncHandler(async (req, res) => {
  const { messageId } = req.params;
  const { status = 'delivered' } = req.body;
  
  if (!messageId) {
    throw new ApiError(400, "Message ID is required");
  }
  
  const acknowledgment = await messagePersistenceEnhancedService.acknowledgeMessage(messageId, status);
  
  return res.status(200).json(
    new ApiResponse(200, acknowledgment, "Message acknowledged successfully")
  );
});

// Get unacknowledged messages
const getUnacknowledgedMessages = asyncHandler(async (req, res) => {
  const messages = await messagePersistenceEnhancedService.getUnacknowledgedMessages();
  
  return res.status(200).json(
    new ApiResponse(200, { count: messages.length, messages }, "Unacknowledged messages retrieved successfully")
  );
});

// Get failed acknowledgments
const getFailedAcknowledgments = asyncHandler(async (req, res) => {
  const acknowledgments = await messagePersistenceEnhancedService.getFailedAcknowledgments();
  
  return res.status(200).json(
    new ApiResponse(200, { count: acknowledgments.length, acknowledgments }, "Failed acknowledgments retrieved successfully")
  );
});

// Trigger recovery check
const triggerRecoveryCheck = asyncHandler(async (req, res) => {
  await messagePersistenceEnhancedService.performRecoveryCheck();
  
  return res.status(200).json(
    new ApiResponse(200, null, "Recovery check triggered successfully")
  );
});

// Get file statistics
const getFileStats = asyncHandler(async (req, res) => {
  const stats = await messagePersistenceEnhancedService.getFileStats();
  
  return res.status(200).json(
    new ApiResponse(200, stats, "File statistics retrieved successfully")
  );
});

// Cleanup old files
const cleanupOldFiles = asyncHandler(async (req, res) => {
  const { daysToKeep = 30 } = req.body;
  
  await messagePersistenceEnhancedService.cleanupOldFiles(daysToKeep);
  
  return res.status(200).json(
    new ApiResponse(200, { daysToKeep }, "Old files cleaned up successfully")
  );
});

// Get persistence logs
const getPersistenceLogs = asyncHandler(async (req, res) => {
  const { limit = 100, level } = req.query;
  
  try {
    const fs = await import('fs/promises');
    const path = await import('path');
    const { fileURLToPath } = await import('url');
    
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    const logFilePath = path.join(__dirname, '../../utils/message_persistence.log');
    
    const fileContent = await fs.readFile(logFilePath, 'utf8');
    const lines = fileContent.trim().split('\n').filter(line => line.trim());
    
    let logs = lines
      .slice(-parseInt(limit))
      .map(line => {
        try {
          return JSON.parse(line);
        } catch (error) {
          return null;
        }
      })
      .filter(log => log !== null);
    
    // Filter by level if specified
    if (level) {
      logs = logs.filter(log => log.level === level.toUpperCase());
    }
    
    return res.status(200).json(
      new ApiResponse(200, { count: logs.length, logs }, "Persistence logs retrieved successfully")
    );
  } catch (error) {
    throw new ApiError(404, "Log file not found or cannot be read");
  }
});

// Get persistence statistics
const getPersistenceStats = asyncHandler(async (req, res) => {
  const health = await messagePersistenceEnhancedService.healthCheck();
  const allStatuses = messagePersistenceEnhancedService.getAllMessageStatuses();
  
  // Calculate statistics
  const statusCounts = allStatuses.reduce((acc, status) => {
    acc[status.status] = (acc[status.status] || 0) + 1;
    return acc;
  }, {});
  
  const stats = {
    totalMessages: allStatuses.length,
    statusCounts,
    unacknowledgedMessages: health.unacknowledgedMessages,
    failedAcknowledgments: health.failedAcknowledgments,
    messageStatusCount: health.messageStatusCount,
    pendingAcknowledgmentsCount: health.pendingAcknowledgmentsCount,
    fileStats: health.stats,
    lastUpdated: new Date().toISOString()
  };
  
  return res.status(200).json(
    new ApiResponse(200, stats, "Persistence statistics retrieved successfully")
  );
});

export {
  getPersistenceHealth,
  getMessageStatus,
  getAllMessageStatuses,
  updateMessageStatus,
  acknowledgeMessage,
  getUnacknowledgedMessages,
  getFailedAcknowledgments,
  triggerRecoveryCheck,
  getFileStats,
  cleanupOldFiles,
  getPersistenceLogs,
  getPersistenceStats
};
