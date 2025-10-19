import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { Message } from '../models/message.model.js';
import { Conversation } from '../models/conversation.model.js';
import messagePersistenceEnhancedService from './message-persistence-enhanced.service.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class MessageBatchService {
  constructor() {
    this.messageQueue = new Map(); // In-memory message storage
    this.queueFilePath = path.join(__dirname, '../../utils/messages_queue.json');
    this.batchInterval = 15 * 60 * 1000; // 15 minutes in milliseconds
    this.batchTimer = null;
    this.isProcessing = false;
    this.maxBatchSize = 1000; // Maximum messages per batch
    this.shutdownHandlers = [];
    
    this.initialize();
  }

  async initialize() {
    try {
      // Ensure utils directory exists
      const utilsDir = path.dirname(this.queueFilePath);
      await fs.mkdir(utilsDir, { recursive: true });
      
      // Load existing messages from file
      await this.loadMessagesFromFile();
      
      // Start batch processing timer
      this.startBatchTimer();
      
      // Setup graceful shutdown handlers
      this.setupGracefulShutdown();
      
      console.log('Message batch service initialized');
    } catch (error) {
      console.error('Failed to initialize message batch service:', error);
    }
  }

  // Add message to queue (called by Socket.IO service)
  async addMessage(messageData) {
    try {
      const messageId = messageData.messageId || this.generateMessageId();
      
      // Create structured message object
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
        status: 'pending',
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
        }
      };

      // Store in memory
      this.messageQueue.set(messageId, structuredMessage);
      
      // Save to NDJSON file with enhanced persistence
      await messagePersistenceEnhancedService.saveMessage(structuredMessage);
      
      console.log(`Message ${messageId} added to queue`);
      return messageId;
    } catch (error) {
      console.error('Failed to add message to queue:', error);
      throw error;
    }
  }

  // Load messages from file on startup
  async loadMessagesFromFile() {
    try {
      // Load messages from enhanced persistence service
      const loadedMessages = await messagePersistenceEnhancedService.loadMessages();
      
      // Clear existing in-memory queue
      this.messageQueue.clear();
      
      // Load messages into memory
      loadedMessages.forEach(msg => {
        this.messageQueue.set(msg.messageId, msg);
      });
      
      console.log(`Loaded ${this.messageQueue.size} messages from persistence file`);
    } catch (error) {
      console.error('Failed to load messages from persistence file:', error);
      // Continue without loading messages
    }
  }



  // Start batch processing timer
  startBatchTimer() {
    if (this.batchTimer) {
      clearInterval(this.batchTimer);
    }
    
    this.batchTimer = setInterval(() => {
      this.processBatch().catch(error => {
        console.error('Batch processing error:', error);
      });
    }, this.batchInterval);
    
    console.log(`Batch processing timer started (${this.batchInterval / 1000 / 60} minutes)`);
  }

  // Process batch of messages
  async processBatch() {
    if (this.isProcessing || this.messageQueue.size === 0) {
      return;
    }

    this.isProcessing = true;
    console.log(`Starting batch processing: ${this.messageQueue.size} messages`);

    try {
      const startTime = Date.now();
      const messagesToProcess = Array.from(this.messageQueue.values());
      
      if (messagesToProcess.length === 0) {
        console.log('No messages to process');
        return;
      }

      // Group messages by roomId for efficient database operations
      const messagesByRoom = this.groupMessagesByRoom(messagesToProcess);
      
      // Process each room's messages
      const results = await this.processRoomMessages(messagesByRoom);
      
      // Remove processed messages from queue
      await this.removeProcessedMessages(messagesToProcess);
      
      // Update queue file
      await this.updateQueueFile();
      
      const processingTime = Date.now() - startTime;
      console.log(`Batch processing completed: ${results.processed} messages processed, ${results.errors} errors, ${processingTime}ms`);
      
    } catch (error) {
      console.error('Batch processing failed:', error);
    } finally {
      this.isProcessing = false;
    }
  }

  // Group messages by roomId
  groupMessagesByRoom(messages) {
    const grouped = new Map();
    
    messages.forEach(msg => {
      if (!grouped.has(msg.roomId)) {
        grouped.set(msg.roomId, []);
      }
      grouped.get(msg.roomId).push(msg);
    });
    
    return grouped;
  }

  // Process messages for a specific room
  async processRoomMessages(messagesByRoom) {
    let totalProcessed = 0;
    let totalErrors = 0;
    
    for (const [roomId, messages] of messagesByRoom) {
      try {
        // Find or create conversation
        let conversation = await Conversation.findOne({ roomId });
        
        if (!conversation) {
          // Extract participants from messages
          const participants = this.extractParticipants(messages);
          
          // Create new conversation
          conversation = await Conversation.findOrCreate(participants, {
            productId: messages[0].productId,
            title: messages[0].productTitle,
            price: messages[0].productPrice,
            images: messages[0].productImages || []
          });
        }
        
        // Process each message
        for (const messageData of messages) {
          try {
            // Check for duplicates
            const existingMessage = await Message.findDuplicate(messageData.messageId, roomId);
            
            if (!existingMessage) {
              // Create new message
              const message = new Message(messageData);
              await message.save();
              
              // Acknowledge message as saved
              await messagePersistenceEnhancedService.acknowledgeMessage(messageData.messageId, 'saved');
              
              // Update conversation metadata
              await conversation.updateLastMessage(messageData);
              
              // Update escrow info if present
              if (messageData.escrow && messageData.escrow.amount > 0) {
                await conversation.updateEscrowInfo(messageData.escrow);
              }
              
              totalProcessed++;
            } else {
              console.log(`Message ${messageData.messageId} already exists, acknowledging`);
              // Acknowledge existing message
              await messagePersistenceEnhancedService.acknowledgeMessage(messageData.messageId, 'saved');
            }
          } catch (error) {
            console.error(`Failed to process message ${messageData.messageId}:`, error);
            totalErrors++;
          }
        }
        
        console.log(`Processed ${messages.length} messages for room ${roomId}`);
        
      } catch (error) {
        console.error(`Failed to process messages for room ${roomId}:`, error);
        totalErrors += messages.length;
      }
    }
    
    return { processed: totalProcessed, errors: totalErrors };
  }

  // Extract unique participants from messages
  extractParticipants(messages) {
    const participants = new Map();
    
    messages.forEach(msg => {
      // Add sender
      if (msg.sender && msg.sender.userId) {
        participants.set(msg.sender.userId.toString(), {
          userId: msg.sender.userId,
          email: msg.sender.email,
          name: msg.sender.name
        });
      }
      
      // Add receiver
      if (msg.receiver && msg.receiver.userId) {
        participants.set(msg.receiver.userId.toString(), {
          userId: msg.receiver.userId,
          email: msg.receiver.email,
          name: msg.receiver.name
        });
      }
    });
    
    return Array.from(participants.values());
  }

  // Remove processed messages from queue
  async removeProcessedMessages(processedMessages) {
    processedMessages.forEach(msg => {
      this.messageQueue.delete(msg.messageId);
    });
  }

  // Update queue file after processing
  async updateQueueFile() {
    try {
      const queueData = {
        messages: Array.from(this.messageQueue.values()),
        lastBatchProcessed: new Date().toISOString(),
        nextBatchTime: new Date(Date.now() + this.batchInterval).toISOString(),
        lastUpdated: new Date().toISOString(),
        version: '1.0'
      };
      
      await fs.writeFile(this.queueFilePath, JSON.stringify(queueData, null, 2));
    } catch (error) {
      console.error('Failed to update queue file:', error);
    }
  }

  // Setup graceful shutdown handlers
  setupGracefulShutdown() {
    const shutdown = async (signal) => {
      console.log(`Received ${signal}, starting graceful shutdown...`);
      
      // Stop batch timer
      if (this.batchTimer) {
        clearInterval(this.batchTimer);
        this.batchTimer = null;
      }
      
      // Process remaining messages
      if (this.messageQueue.size > 0) {
        console.log(`Processing ${this.messageQueue.size} remaining messages...`);
        await this.processBatch();
      }
      
      // Save final state to file
      await this.updateQueueFile();
      
      console.log('Graceful shutdown completed');
      process.exit(0);
    };
    
    // Register shutdown handlers
    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGUSR2', () => shutdown('SIGUSR2')); // For nodemon
    
    // Handle uncaught exceptions
    process.on('uncaughtException', async (error) => {
      console.error('Uncaught exception:', error);
      await shutdown('uncaughtException');
    });
    
    // Handle unhandled promise rejections
    process.on('unhandledRejection', async (reason, promise) => {
      console.error('Unhandled rejection at:', promise, 'reason:', reason);
      await shutdown('unhandledRejection');
    });
  }

  // Manual batch processing (for testing/admin)
  async processBatchNow() {
    if (this.isProcessing) {
      throw new Error('Batch processing already in progress');
    }
    
    return await this.processBatch();
  }

  // Get queue statistics
  getQueueStats() {
    return {
      totalMessages: this.messageQueue.size,
      isProcessing: this.isProcessing,
      nextBatchTime: new Date(Date.now() + this.batchInterval).toISOString(),
      batchInterval: this.batchInterval,
      maxBatchSize: this.maxBatchSize
    };
  }

  // Get messages by room
  getMessagesByRoom(roomId) {
    const roomMessages = [];
    this.messageQueue.forEach(msg => {
      if (msg.roomId === roomId) {
        roomMessages.push(msg);
      }
    });
    return roomMessages.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
  }

  // Clear queue (for testing)
  async clearQueue() {
    this.messageQueue.clear();
    await this.updateQueueFile();
    console.log('Message queue cleared');
  }

  // Generate unique message ID
  generateMessageId() {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Health check
  async healthCheck() {
    try {
      const stats = this.getQueueStats();
      const fileExists = await fs.access(this.queueFilePath).then(() => true).catch(() => false);
      
      return {
        status: 'healthy',
        queueStats: stats,
        fileExists,
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
}

export default new MessageBatchService();
