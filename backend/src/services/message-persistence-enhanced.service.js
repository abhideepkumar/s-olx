import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { Message } from '../models/message.model.js';
import { Conversation } from '../models/conversation.model.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class MessagePersistenceEnhancedService {
  constructor() {
    this.messagesFilePath = path.join(__dirname, '../../utils/messages_queue.ndjson');
    this.acknowledgmentsFilePath = path.join(__dirname, '../../utils/message_acknowledgments.ndjson');
    this.recoveryFilePath = path.join(__dirname, '../../utils/recovery_log.ndjson');
    this.logFilePath = path.join(__dirname, '../../utils/message_persistence.log');
    
    this.batchSize = 1000;
    this.maxFileSize = 100 * 1024 * 1024; // 100MB
    this.acknowledgmentTimeout = 30000; // 30 seconds
    this.recoveryCheckInterval = 60000; // 1 minute
    
    this.pendingAcknowledgments = new Map();
    this.messageStatus = new Map();
    this.recoveryTimer = null;
    
    this.initialize();
  }

  async initialize() {
    try {
      // Ensure utils directory exists
      const utilsDir = path.dirname(this.messagesFilePath);
      await fs.mkdir(utilsDir, { recursive: true });
      
      // Initialize files
      await this.ensureFilesExist();
      
      // Start recovery mechanism
      this.startRecoveryCheck();
      
      // Load pending acknowledgments
      await this.loadPendingAcknowledgments();
      
      console.log('Enhanced message persistence service initialized');
    } catch (error) {
      console.error('Failed to initialize enhanced message persistence service:', error);
    }
  }

  async ensureFilesExist() {
    const files = [
      this.messagesFilePath,
      this.acknowledgmentsFilePath,
      this.recoveryFilePath,
      this.logFilePath
    ];

    for (const filePath of files) {
      try {
        await fs.access(filePath);
      } catch (error) {
        if (error.code === 'ENOENT') {
          await fs.writeFile(filePath, '');
          console.log(`Created file: ${path.basename(filePath)}`);
        }
      }
    }
  }

  // Atomic write operation
  async atomicWrite(filePath, data, operation = 'append') {
    const tempPath = `${filePath}.tmp`;
    const lockPath = `${filePath}.lock`;
    
    try {
      // Create lock file
      await fs.writeFile(lockPath, Date.now().toString());
      
      if (operation === 'append') {
        // Append operation - read existing content first
        let existingContent = '';
        try {
          existingContent = await fs.readFile(filePath, 'utf8');
        } catch (error) {
          if (error.code !== 'ENOENT') throw error;
        }
        
        const newContent = existingContent + data;
        await fs.writeFile(tempPath, newContent);
      } else {
        // Write operation
        await fs.writeFile(tempPath, data);
      }
      
      // Atomic move
      await fs.rename(tempPath, filePath);
      
      // Remove lock file
      await fs.unlink(lockPath);
      
      return true;
    } catch (error) {
      // Cleanup on error
      try {
        await fs.unlink(tempPath);
        await fs.unlink(lockPath);
      } catch (cleanupError) {
        // Ignore cleanup errors
      }
      throw error;
    }
  }

  // Save message with atomic write
  async saveMessage(messageData) {
    try {
      const messageId = messageData.messageId || this.generateMessageId();
      
      // Create structured message with status tracking
      const structuredMessage = {
        messageId,
        roomId: messageData.roomId,
        content: {
          text: messageData.message,
          type: messageData.contentType || 'text',
          metadata: messageData.metadata || {}
        },
        sender: {
          userId: messageData.senderId,
          email: messageData.senderEmail,
          name: messageData.senderName || messageData.senderEmail
        },
        receiver: {
          userId: messageData.receiverId || messageData.sellerId,
          email: messageData.receiverEmail || messageData.sellerEmail,
          name: messageData.receiverName || messageData.sellerEmail
        },
        timestamp: messageData.timestamp || new Date(),
        status: 'sent',
        escrow: messageData.escrow || null,
        processing: {
          batchId: null,
          processedAt: null,
          retryCount: 0,
          lastError: null
        },
        metadata: {
          ipAddress: messageData.ipAddress,
          userAgent: messageData.userAgent,
          deviceInfo: messageData.deviceInfo,
          location: messageData.location
        },
        persistence: {
          savedAt: new Date(),
          filePath: this.messagesFilePath,
          acknowledged: false,
          acknowledgmentId: null
        }
      };

      // Atomic write to file
      const ndjsonLine = JSON.stringify(structuredMessage) + '\n';
      await this.atomicWrite(this.messagesFilePath, ndjsonLine, 'append');
      
      // Track message status
      this.messageStatus.set(messageId, {
        status: 'sent',
        savedAt: new Date(),
        acknowledged: false
      });
      
      // Log the operation
      await this.logOperation('MESSAGE_SAVED', {
        messageId,
        roomId: messageData.roomId,
        status: 'sent'
      });
      
      console.log(`Message ${messageId} saved atomically`);
      return structuredMessage;
    } catch (error) {
      await this.logOperation('MESSAGE_SAVE_ERROR', {
        messageId: messageData.messageId,
        error: error.message
      });
      throw error;
    }
  }

  // Message acknowledgment system
  async acknowledgeMessage(messageId, status = 'delivered') {
    try {
      const acknowledgment = {
        messageId,
        status,
        acknowledgedAt: new Date(),
        acknowledgmentId: `ack_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      };

      // Save acknowledgment
      const ndjsonLine = JSON.stringify(acknowledgment) + '\n';
      await this.atomicWrite(this.acknowledgmentsFilePath, ndjsonLine, 'append');
      
      // Update message status
      if (this.messageStatus.has(messageId)) {
        this.messageStatus.get(messageId).acknowledged = true;
        this.messageStatus.get(messageId).status = status;
      }
      
      // Remove from pending acknowledgments
      this.pendingAcknowledgments.delete(messageId);
      
      // Log the operation
      await this.logOperation('MESSAGE_ACKNOWLEDGED', {
        messageId,
        status,
        acknowledgmentId: acknowledgment.acknowledgmentId
      });
      
      console.log(`Message ${messageId} acknowledged with status: ${status}`);
      return acknowledgment;
    } catch (error) {
      await this.logOperation('ACKNOWLEDGMENT_ERROR', {
        messageId,
        error: error.message
      });
      throw error;
    }
  }

  // Load messages from persistence file
  async loadMessages() {
    try {
      const fileContent = await fs.readFile(this.messagesFilePath, 'utf8');
      const lines = fileContent.trim().split('\n').filter(line => line.trim());
      
      const messages = [];
      for (const line of lines) {
        try {
          const message = JSON.parse(line);
          messages.push(message);
        } catch (error) {
          console.error('Failed to parse message line:', line);
        }
      }
      
      console.log(`Loaded ${messages.length} messages from persistence file`);
      return messages;
    } catch (error) {
      if (error.code === 'ENOENT') {
        return []; // File doesn't exist yet, return empty array
      }
      console.error('Failed to load messages from persistence file:', error);
      throw error;
    }
  }

  // Load pending acknowledgments
  async loadPendingAcknowledgments() {
    try {
      const fileContent = await fs.readFile(this.acknowledgmentsFilePath, 'utf8');
      const lines = fileContent.trim().split('\n').filter(line => line.trim());
      
      for (const line of lines) {
        try {
          const acknowledgment = JSON.parse(line);
          this.pendingAcknowledgments.set(acknowledgment.messageId, acknowledgment);
        } catch (error) {
          console.error('Failed to parse acknowledgment line:', line);
        }
      }
      
      console.log(`Loaded ${this.pendingAcknowledgments.size} pending acknowledgments`);
    } catch (error) {
      if (error.code !== 'ENOENT') {
        console.error('Failed to load pending acknowledgments:', error);
      }
    }
  }

  // Recovery mechanism for server restarts
  async startRecoveryCheck() {
    this.recoveryTimer = setInterval(async () => {
      try {
        await this.performRecoveryCheck();
      } catch (error) {
        console.error('Recovery check failed:', error);
      }
    }, this.recoveryCheckInterval);
    
    console.log('Recovery check started');
  }

  async performRecoveryCheck() {
    try {
      // Check for unacknowledged messages
      const unacknowledgedMessages = await this.getUnacknowledgedMessages();
      
      if (unacknowledgedMessages.length > 0) {
        console.log(`Found ${unacknowledgedMessages.length} unacknowledged messages`);
        
        // Process unacknowledged messages
        for (const message of unacknowledgedMessages) {
          try {
            // Retry processing
            await this.retryMessageProcessing(message);
          } catch (error) {
            console.error(`Failed to retry message ${message.messageId}:`, error);
          }
        }
      }
      
      // Check for failed acknowledgments
      const failedAcknowledgments = await this.getFailedAcknowledgments();
      
      if (failedAcknowledgments.length > 0) {
        console.log(`Found ${failedAcknowledgments.length} failed acknowledgments`);
        
        // Retry acknowledgments
        for (const acknowledgment of failedAcknowledgments) {
          try {
            await this.retryAcknowledgment(acknowledgment);
          } catch (error) {
            console.error(`Failed to retry acknowledgment ${acknowledgment.messageId}:`, error);
          }
        }
      }
      
      // Log recovery check
      await this.logOperation('RECOVERY_CHECK', {
        unacknowledgedCount: unacknowledgedMessages.length,
        failedAcknowledgmentsCount: failedAcknowledgments.length,
        timestamp: new Date()
      });
      
    } catch (error) {
      await this.logOperation('RECOVERY_CHECK_ERROR', {
        error: error.message,
        timestamp: new Date()
      });
    }
  }

  async getUnacknowledgedMessages() {
    try {
      const fileContent = await fs.readFile(this.messagesFilePath, 'utf8');
      const lines = fileContent.trim().split('\n').filter(line => line.trim());
      
      const unacknowledgedMessages = [];
      
      for (const line of lines) {
        try {
          const message = JSON.parse(line);
          
          // Check if message is unacknowledged
          if (!message.persistence?.acknowledged) {
            unacknowledgedMessages.push(message);
          }
        } catch (error) {
          console.error('Failed to parse message line:', line);
        }
      }
      
      return unacknowledgedMessages;
    } catch (error) {
      if (error.code === 'ENOENT') {
        return [];
      }
      throw error;
    }
  }

  async getFailedAcknowledgments() {
    try {
      const fileContent = await fs.readFile(this.acknowledgmentsFilePath, 'utf8');
      const lines = fileContent.trim().split('\n').filter(line => line.trim());
      
      const failedAcknowledgments = [];
      
      for (const line of lines) {
        try {
          const acknowledgment = JSON.parse(line);
          
          // Check if acknowledgment is old and might have failed
          const acknowledgmentAge = Date.now() - new Date(acknowledgment.acknowledgedAt).getTime();
          
          if (acknowledgmentAge > this.acknowledgmentTimeout) {
            failedAcknowledgments.push(acknowledgment);
          }
        } catch (error) {
          console.error('Failed to parse acknowledgment line:', line);
        }
      }
      
      return failedAcknowledgments;
    } catch (error) {
      if (error.code === 'ENOENT') {
        return [];
      }
      throw error;
    }
  }

  async retryMessageProcessing(message) {
    try {
      // Update retry count
      message.processing.retryCount = (message.processing.retryCount || 0) + 1;
      message.processing.lastError = null;
      
      // Try to process message again
      const existingMessage = await Message.findDuplicate(message.messageId, message.roomId);
      
      if (!existingMessage) {
        // Create new message
        const messageDoc = new Message(message);
        await messageDoc.save();
        
        // Acknowledge message
        await this.acknowledgeMessage(message.messageId, 'saved');
        
        console.log(`Successfully retried message ${message.messageId}`);
      } else {
        // Message already exists, acknowledge it
        await this.acknowledgeMessage(message.messageId, 'saved');
        console.log(`Message ${message.messageId} already exists, acknowledged`);
      }
      
    } catch (error) {
      // Update error information
      message.processing.lastError = error.message;
      
      // Log retry failure
      await this.logOperation('MESSAGE_RETRY_FAILED', {
        messageId: message.messageId,
        retryCount: message.processing.retryCount,
        error: error.message
      });
      
      throw error;
    }
  }

  async retryAcknowledgment(acknowledgment) {
    try {
      // Check if message exists in database
      const message = await Message.findOne({ messageId: acknowledgment.messageId });
      
      if (message) {
        // Update message status
        await message.updateStatus(acknowledgment.status);
        
        // Remove from pending acknowledgments
        this.pendingAcknowledgments.delete(acknowledgment.messageId);
        
        console.log(`Successfully retried acknowledgment ${acknowledgment.messageId}`);
      } else {
        // Message not found, mark acknowledgment as failed
        await this.logOperation('ACKNOWLEDGMENT_RETRY_FAILED', {
          messageId: acknowledgment.messageId,
          reason: 'Message not found in database'
        });
      }
      
    } catch (error) {
      await this.logOperation('ACKNOWLEDGMENT_RETRY_ERROR', {
        messageId: acknowledgment.messageId,
        error: error.message
      });
      throw error;
    }
  }

  // Comprehensive logging system
  async logOperation(operation, data) {
    try {
      const logEntry = {
        timestamp: new Date().toISOString(),
        operation,
        data,
        level: this.getLogLevel(operation)
      };
      
      const logLine = JSON.stringify(logEntry) + '\n';
      await this.atomicWrite(this.logFilePath, logLine, 'append');
      
      // Also log to console based on level
      const message = `${operation}: ${JSON.stringify(data)}`;
      
      switch (logEntry.level) {
        case 'ERROR':
          console.error(message);
          break;
        case 'WARN':
          console.warn(message);
          break;
        case 'INFO':
        default:
          console.log(message);
          break;
      }
      
    } catch (error) {
      console.error('Failed to log operation:', error);
    }
  }

  getLogLevel(operation) {
    if (operation.includes('ERROR') || operation.includes('FAILED')) {
      return 'ERROR';
    }
    if (operation.includes('WARN') || operation.includes('RETRY')) {
      return 'WARN';
    }
    return 'INFO';
  }

  // Message status tracking
  async updateMessageStatus(messageId, status, additionalData = {}) {
    try {
      if (this.messageStatus.has(messageId)) {
        const currentStatus = this.messageStatus.get(messageId);
        currentStatus.status = status;
        currentStatus.updatedAt = new Date();
        Object.assign(currentStatus, additionalData);
      } else {
        this.messageStatus.set(messageId, {
          status,
          updatedAt: new Date(),
          ...additionalData
        });
      }
      
      // Log status update
      await this.logOperation('MESSAGE_STATUS_UPDATED', {
        messageId,
        status,
        ...additionalData
      });
      
    } catch (error) {
      await this.logOperation('STATUS_UPDATE_ERROR', {
        messageId,
        error: error.message
      });
      throw error;
    }
  }

  // Get message status
  getMessageStatus(messageId) {
    return this.messageStatus.get(messageId) || null;
  }

  // Get all message statuses
  getAllMessageStatuses() {
    return Array.from(this.messageStatus.entries()).map(([messageId, status]) => ({
      messageId,
      ...status
    }));
  }

  // Health check
  async healthCheck() {
    try {
      const stats = await this.getFileStats();
      const unacknowledgedCount = (await this.getUnacknowledgedMessages()).length;
      const failedAcknowledgmentsCount = (await this.getFailedAcknowledgments()).length;
      
      return {
        status: 'healthy',
        stats,
        unacknowledgedMessages: unacknowledgedCount,
        failedAcknowledgments: failedAcknowledgmentsCount,
        messageStatusCount: this.messageStatus.size,
        pendingAcknowledgmentsCount: this.pendingAcknowledgments.size,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  // Get file statistics
  async getFileStats() {
    try {
      const files = [
        { name: 'messages', path: this.messagesFilePath },
        { name: 'acknowledgments', path: this.acknowledgmentsFilePath },
        { name: 'recovery', path: this.recoveryFilePath },
        { name: 'logs', path: this.logFilePath }
      ];
      
      const stats = {};
      
      for (const file of files) {
        try {
          const fileStats = await fs.stat(file.path);
          stats[file.name] = {
            size: fileStats.size,
            lastModified: fileStats.mtime,
            exists: true
          };
        } catch (error) {
          stats[file.name] = {
            exists: false,
            error: error.message
          };
        }
      }
      
      return stats;
    } catch (error) {
      console.error('Failed to get file stats:', error);
      return null;
    }
  }

  // Cleanup old files
  async cleanupOldFiles(daysToKeep = 30) {
    try {
      const utilsDir = path.dirname(this.messagesFilePath);
      const files = await fs.readdir(utilsDir);
      
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
      
      for (const file of files) {
        if (file.endsWith('.ndjson') || file.endsWith('.log')) {
          const filePath = path.join(utilsDir, file);
          const stats = await fs.stat(filePath);
          
          if (stats.mtime < cutoffDate) {
            await fs.unlink(filePath);
            await this.logOperation('FILE_CLEANUP', {
              file,
              deletedAt: new Date()
            });
            console.log(`Deleted old file: ${file}`);
          }
        }
      }
    } catch (error) {
      await this.logOperation('CLEANUP_ERROR', {
        error: error.message
      });
      console.error('Failed to cleanup old files:', error);
    }
  }

  // Graceful shutdown
  async shutdown() {
    try {
      // Stop recovery timer
      if (this.recoveryTimer) {
        clearInterval(this.recoveryTimer);
        this.recoveryTimer = null;
      }
      
      // Process remaining unacknowledged messages
      const unacknowledgedMessages = await this.getUnacknowledgedMessages();
      
      if (unacknowledgedMessages.length > 0) {
        console.log(`Processing ${unacknowledgedMessages.length} unacknowledged messages before shutdown`);
        
        for (const message of unacknowledgedMessages) {
          try {
            await this.retryMessageProcessing(message);
          } catch (error) {
            console.error(`Failed to process message ${message.messageId} during shutdown:`, error);
          }
        }
      }
      
      // Log shutdown
      await this.logOperation('SERVICE_SHUTDOWN', {
        unacknowledgedCount: unacknowledgedMessages.length,
        messageStatusCount: this.messageStatus.size,
        pendingAcknowledgmentsCount: this.pendingAcknowledgments.size
      });
      
      console.log('Enhanced message persistence service shutdown completed');
    } catch (error) {
      console.error('Error during shutdown:', error);
    }
  }

  // Generate unique message ID
  generateMessageId() {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

export default new MessagePersistenceEnhancedService();
