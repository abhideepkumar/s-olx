import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import { user } from '../models/user.model.js';
import messageBatchService from './message-batch.service.js';
import messagePersistenceEnhancedService from './message-persistence-enhanced.service.js';

class SocketService {
  constructor() {
    this.io = null;
    this.activeRooms = new Map(); // Track active rooms and participants
    this.userSockets = new Map(); // Track user socket connections
  }

  initialize(server) {
    this.io = new Server(server, {
      cors: {
        origin: process.env.FRONTEND_URL || "http://localhost:3000",
        methods: ["GET", "POST"],
        credentials: true
      },
      connectionStateRecovery: {
        maxDisconnectionTime: 2 * 60 * 1000, // 2 minutes
        skipMiddlewares: true
      }
    });

    this.setupMiddleware();
    this.setupEventHandlers();
    
    console.log('Socket.IO server initialized');
    return this.io;
  }

  setupMiddleware() {
    // Authentication middleware
    this.io.use(async (socket, next) => {
      try {
        const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(' ')[1];
        
        if (!token) {
          return next(new Error('Authentication token required'));
        }

        const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
        const userData = await user.findById(decoded._id).select('-password');
        
        if (!userData) {
          return next(new Error('User not found'));
        }

        socket.userId = userData._id.toString();
        socket.userData = userData;
        next();
      } catch (error) {
        next(new Error('Invalid authentication token'));
      }
    });
  }

  setupEventHandlers() {
    this.io.on('connection', (socket) => {
      console.log(`User ${socket.userData.email} connected with socket ${socket.id}`);
      
      // Store user socket mapping
      this.userSockets.set(socket.userId, socket.id);

      // Handle joining a chat room
      socket.on('join_chat_room', (data) => {
        this.handleJoinRoom(socket, data);
      });

      // Handle sending messages
      socket.on('send_message', async (data) => {
        await this.handleSendMessage(socket, data);
      });

      // Handle leaving a chat room
      socket.on('leave_chat_room', (data) => {
        this.handleLeaveRoom(socket, data);
      });

      // Handle typing indicators
      socket.on('typing', (data) => {
        this.handleTyping(socket, data);
      });

      // Handle disconnect
      socket.on('disconnect', () => {
        this.handleDisconnect(socket);
      });

      // Handle connection errors
      socket.on('error', (error) => {
        console.error(`Socket error for user ${socket.userId}:`, error);
      });
    });
  }

  handleJoinRoom(socket, data) {
    const { roomId, productId, sellerId } = data;
    
    if (!roomId) {
      socket.emit('error', { message: 'Room ID is required' });
      return;
    }
    
    // Join the room
    socket.join(roomId);
    
    // Track room participants
    if (!this.activeRooms.has(roomId)) {
      this.activeRooms.set(roomId, {
        productId,
        participants: new Set(),
        createdAt: new Date(),
        lastActivity: new Date()
      });
    }
    
    this.activeRooms.get(roomId).participants.add(socket.userId);
    this.activeRooms.get(roomId).lastActivity = new Date();

    console.log(`User ${socket.userData.email} joined room ${roomId}`);
    
    // Notify others in the room
    socket.to(roomId).emit('user_joined', {
      userId: socket.userId,
      userEmail: socket.userData.email,
      timestamp: new Date()
    });

    // Send room info to the joining user
    socket.emit('room_joined', {
      roomId,
      participants: Array.from(this.activeRooms.get(roomId).participants),
      timestamp: new Date()
    });
  }

  async handleSendMessage(socket, data) {
    const { roomId, message, productId, sellerId } = data;
    
    if (!message || !message.trim()) {
      socket.emit('error', { message: 'Message cannot be empty' });
      return;
    }

    // Validate room access
    if (!socket.rooms.has(roomId)) {
      socket.emit('error', { message: 'Not authorized to send message to this room' });
      return;
    }

    const messageData = {
      messageId: this.generateMessageId(),
      senderId: socket.userId,
      senderEmail: socket.userData.email,
      message: message.trim(),
      timestamp: new Date(),
      roomId,
      productId,
      sellerId
    };

    // Broadcast message to all participants in the room
    this.io.to(roomId).emit('new_message', messageData);
    
    // Update room activity
    if (this.activeRooms.has(roomId)) {
      this.activeRooms.get(roomId).lastActivity = new Date();
    }

    console.log(`Message sent in room ${roomId} by ${socket.userData.email}`);
    
    // Store message in queue for batching
    try {
      await messageBatchService.addMessage(messageData);
      
      // Acknowledge message as delivered
      await messagePersistenceEnhancedService.acknowledgeMessage(messageData.messageId, 'delivered');
    } catch (error) {
      console.error('Failed to add message to batch queue:', error);
      // Message still broadcasted, but not queued for DB save
      
      // Log the error
      await messagePersistenceEnhancedService.logOperation('SOCKET_MESSAGE_ERROR', {
        messageId: messageData.messageId,
        error: error.message
      });
    }
    
    return messageData;
  }

  handleLeaveRoom(socket, data) {
    const { roomId } = data;
    
    if (roomId && socket.rooms.has(roomId)) {
      socket.leave(roomId);
      
      // Update room participants
      if (this.activeRooms.has(roomId)) {
        this.activeRooms.get(roomId).participants.delete(socket.userId);
        
        // Clean up empty rooms
        if (this.activeRooms.get(roomId).participants.size === 0) {
          this.activeRooms.delete(roomId);
        }
      }
      
      // Notify others in the room
      socket.to(roomId).emit('user_left', {
        userId: socket.userId,
        userEmail: socket.userData.email,
        timestamp: new Date()
      });
      
      console.log(`User ${socket.userData.email} left room ${roomId}`);
    }
  }

  handleTyping(socket, data) {
    const { roomId, isTyping } = data;
    
    if (socket.rooms.has(roomId)) {
      socket.to(roomId).emit('user_typing', {
        userId: socket.userId,
        userEmail: socket.userData.email,
        isTyping,
        timestamp: new Date()
      });
    }
  }

  handleDisconnect(socket) {
    console.log(`User ${socket.userData?.email} disconnected`);
    
    // Remove from user sockets mapping
    this.userSockets.delete(socket.userId);
    
    // Leave all rooms and update participant lists
    socket.rooms.forEach((roomId) => {
      if (roomId !== socket.id && this.activeRooms.has(roomId)) {
        this.activeRooms.get(roomId).participants.delete(socket.userId);
        
        // Notify others in the room
        socket.to(roomId).emit('user_left', {
          userId: socket.userId,
          userEmail: socket.userData.email,
          timestamp: new Date()
        });
        
        // Clean up empty rooms
        if (this.activeRooms.get(roomId).participants.size === 0) {
          this.activeRooms.delete(roomId);
        }
      }
    });
  }

  // Utility methods
  generateRoomId(productId, userId1, userId2) {
    // Create consistent room ID regardless of user order
    const participants = [userId1, userId2].sort();
    return `product_${productId}_users_${participants.join('_')}`;
  }

  generateMessageId() {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Get active rooms info (for monitoring)
  getActiveRoomsInfo() {
    const roomsInfo = [];
    this.activeRooms.forEach((roomData, roomId) => {
      roomsInfo.push({
        roomId,
        productId: roomData.productId,
        participantCount: roomData.participants.size,
        participants: Array.from(roomData.participants),
        createdAt: roomData.createdAt,
        lastActivity: roomData.lastActivity
      });
    });
    return roomsInfo;
  }

  // Get user's active rooms
  getUserActiveRooms(userId) {
    const userRooms = [];
    this.activeRooms.forEach((roomData, roomId) => {
      if (roomData.participants.has(userId)) {
        userRooms.push({
          roomId,
          productId: roomData.productId,
          participantCount: roomData.participants.size,
          lastActivity: roomData.lastActivity
        });
      }
    });
    return userRooms;
  }

  // Send message to specific user
  sendToUser(userId, event, data) {
    const socketId = this.userSockets.get(userId);
    if (socketId) {
      this.io.to(socketId).emit(event, data);
      return true;
    }
    return false;
  }

  // Broadcast to all users
  broadcastToAll(event, data) {
    this.io.emit(event, data);
  }
}

export default new SocketService();
