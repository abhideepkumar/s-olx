import { Server } from 'socket.io';
import { createServer } from 'http';
import express from 'express';
import persistenceService from '../services/persistence.service.js';

class SocketService {
  constructor(app) {
    this.app = app;
    this.httpServer = createServer(app);
    this.io = new Server(this.httpServer, {
      cors: {
        origin: process.env.FRONTEND_URL || "http://localhost:3000",
        methods: ["GET", "POST"],
        credentials: true
      }
    });
    
    this.connectedUsers = new Map(); // userId -> socketId
    this.userSockets = new Map(); // socketId -> userId
    
    this.setupSocketHandlers();
  }

  setupSocketHandlers() {
    this.io.on('connection', (socket) => {
      console.log(`User connected: ${socket.id}`);

      // Handle user authentication and join
      socket.on('join', async (data) => {
        try {
          const { userId, token } = data;
          
          // In a real app, you'd verify the token here
          // For now, we'll trust the client
          
          if (userId) {
            // Store user connection
            this.connectedUsers.set(userId, socket.id);
            this.userSockets.set(socket.id, userId);
            
            // Join user to their personal room
            socket.join(`user_${userId}`);
            
            console.log(`User ${userId} joined with socket ${socket.id}`);
            
            // Notify user of successful connection
            socket.emit('connected', { 
              userId, 
              message: 'Successfully connected to chat server' 
            });
            
            // Broadcast online status to all rooms this user is in
            this.broadcastUserStatus(userId, 'online');
          }
        } catch (error) {
          console.error('Error in join handler:', error);
          socket.emit('error', { message: 'Failed to join chat' });
        }
      });

      // Handle joining a chat room with another user
      socket.on('join_chat', (data) => {
        try {
          const { userId, otherUserId } = data;
          const currentUserId = this.userSockets.get(socket.id);
          
          if (currentUserId === userId) {
            // Join both users to a shared room
            const roomId = this.getRoomId(userId, otherUserId);
            socket.join(roomId);
            
            console.log(`User ${userId} joined chat room ${roomId}`);
            
            // Notify if other user is online
            const otherUserSocketId = this.connectedUsers.get(otherUserId);
            if (otherUserSocketId) {
              socket.emit('user_status', { 
                userId: otherUserId, 
                status: 'online' 
              });
            } else {
              socket.emit('user_status', { 
                userId: otherUserId, 
                status: 'offline' 
              });
            }
          }
        } catch (error) {
          console.error('Error in join_chat handler:', error);
          socket.emit('error', { message: 'Failed to join chat room' });
        }
      });

      // Handle sending messages
      socket.on('send_message', async (data) => {
        try {
          const { messageId, content, senderId, receiverId, timestamp, escrow } = data;
          const currentUserId = this.userSockets.get(socket.id);
          
          if (currentUserId !== senderId) {
            socket.emit('error', { message: 'Unauthorized message sender' });
            return;
          }

          // Store message using persistence service
          const messageData = {
            messageId,
            content: { text: content },
            senderId,
            receiverId,
            timestamp: timestamp || new Date(),
            status: 'sent',
            escrow: (() => {
              const amount = Number(escrow?.amount);
              if (!isNaN(amount) && amount > 0) {
                return { amount, status: 'pending' };
              }
              return { amount: 0, status: 'null' };
            })()
          };

          await persistenceService.storeMessage(messageData);

          // Check if receiver is online
          const receiverSocketId = this.connectedUsers.get(receiverId);
          
          if (receiverSocketId) {
            // Send message directly to receiver
            this.io.to(receiverSocketId).emit('receive_message', {
              ...messageData,
              senderId: { _id: senderId },
              receiverId: { _id: receiverId }
            });
            
            // Also send to sender for confirmation
            socket.emit('message_sent', {
              ...messageData,
              senderId: { _id: senderId },
              receiverId: { _id: receiverId }
            });
            
            console.log(`Message sent via socket from ${senderId} to ${receiverId}`);
          } else {
            // Receiver is offline, just confirm to sender
            socket.emit('message_sent', {
              ...messageData,
              senderId: { _id: senderId },
              receiverId: { _id: receiverId }
            });
            
            console.log(`Message stored for offline user ${receiverId}`);
          }
        } catch (error) {
          console.error('Error in send_message handler:', error);
          socket.emit('error', { message: 'Failed to send message' });
        }
      });

      // Handle typing indicators
      socket.on('typing', (data) => {
        try {
          const { userId, otherUserId, isTyping } = data;
          const currentUserId = this.userSockets.get(socket.id);
          
          if (currentUserId === userId) {
            const otherUserSocketId = this.connectedUsers.get(otherUserId);
            if (otherUserSocketId) {
              this.io.to(otherUserSocketId).emit('user_typing', {
                userId,
                isTyping
              });
            }
          }
        } catch (error) {
          console.error('Error in typing handler:', error);
        }
      });

      // Handle disconnect
      socket.on('disconnect', () => {
        try {
          const userId = this.userSockets.get(socket.id);
          
          if (userId) {
            // Remove user from connected users
            this.connectedUsers.delete(userId);
            this.userSockets.delete(socket.id);
            
            console.log(`User ${userId} disconnected`);
            
            // Broadcast offline status
            this.broadcastUserStatus(userId, 'offline');
          }
        } catch (error) {
          console.error('Error in disconnect handler:', error);
        }
      });
    });
  }

  getRoomId(userId1, userId2) {
    // Create a consistent room ID for two users
    const sortedIds = [userId1, userId2].sort();
    return `chat_${sortedIds[0]}_${sortedIds[1]}`;
  }

  broadcastUserStatus(userId, status) {
    // Broadcast user status to all connected clients
    this.io.emit('user_status_update', {
      userId,
      status
    });
  }

  // Method to get online users count
  getOnlineUsersCount() {
    return this.connectedUsers.size;
  }

  // Method to check if user is online
  isUserOnline(userId) {
    return this.connectedUsers.has(userId);
  }

  // Method to send message to specific user (for notifications, etc.)
  sendToUser(userId, event, data) {
    const socketId = this.connectedUsers.get(userId);
    if (socketId) {
      this.io.to(socketId).emit(event, data);
      return true;
    }
    return false;
  }

  getServer() {
    return this.httpServer;
  }

  getIO() {
    return this.io;
  }
}

export default SocketService;
