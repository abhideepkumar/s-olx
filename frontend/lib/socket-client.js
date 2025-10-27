import { io } from 'socket.io-client';

class SocketClient {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.currentUserId = null;
    this.currentReceiverId = null;
    this.messageHandlers = new Map();
    this.statusHandlers = new Map();
    this.typingHandlers = new Map();
  }

  // Initialize connection
  connect(userId, token) {
    if (this.socket && this.isConnected) {
      return Promise.resolve();
    }

    return new Promise((resolve, reject) => {
      this.socket = io(process.env.NEXT_PUBLIC_BACKEND_URL, {
        auth: {
          token: token
        },
        transports: ['websocket', 'polling']
      });

      this.socket.on('connect', () => {
        console.log('Connected to Socket.IO server');
        this.isConnected = true;
        
        // Join with user ID
        this.socket.emit('join', { userId, token });
        this.currentUserId = userId;
        
        resolve();
      });

      this.socket.on('connected', (data) => {
        console.log('Socket.IO connected:', data.message);
      });

      this.socket.on('disconnect', () => {
        console.log('Disconnected from Socket.IO server');
        this.isConnected = false;
      });

      this.socket.on('error', (error) => {
        console.error('Socket.IO error:', error);
        reject(error);
      });

      // Set up message handlers
      this.setupMessageHandlers();
    });
  }

  // Join a chat room with another user
  joinChat(receiverId) {
    if (!this.socket || !this.isConnected) {
      console.warn('Socket not connected, cannot join chat');
      return;
    }

    this.currentReceiverId = receiverId;
    this.socket.emit('join_chat', {
      userId: this.currentUserId,
      otherUserId: receiverId
    });
  }

  // Send a message
  sendMessage(messageData) {
    if (!this.socket || !this.isConnected) {
      console.warn('Socket not connected, message will be sent via API');
      return false;
    }

    this.socket.emit('send_message', messageData);
    return true;
  }

  // Send typing indicator
  sendTyping(isTyping) {
    if (!this.socket || !this.isConnected || !this.currentReceiverId) {
      return;
    }

    this.socket.emit('typing', {
      userId: this.currentUserId,
      otherUserId: this.currentReceiverId,
      isTyping
    });
  }

  // Set up message event handlers
  setupMessageHandlers() {
    if (!this.socket) return;

    // Handle incoming messages
    this.socket.on('receive_message', (message) => {
      console.log('Received message via socket:', message);
      this.messageHandlers.forEach(handler => {
        handler('receive', message);
      });
    });

    // Handle message sent confirmation
    this.socket.on('message_sent', (message) => {
      console.log('Message sent confirmation:', message);
      this.messageHandlers.forEach(handler => {
        handler('sent', message);
      });
    });

    // Handle user status updates
    this.socket.on('user_status', (data) => {
      console.log('User status:', data);
      this.statusHandlers.forEach(handler => {
        handler(data);
      });
    });

    this.socket.on('user_status_update', (data) => {
      console.log('User status update:', data);
      this.statusHandlers.forEach(handler => {
        handler(data);
      });
    });

    // Handle typing indicators
    this.socket.on('user_typing', (data) => {
      console.log('User typing:', data);
      this.typingHandlers.forEach(handler => {
        handler(data);
      });
    });
  }

  // Register message handler
  onMessage(handler) {
    const id = Date.now() + Math.random();
    this.messageHandlers.set(id, handler);
    return () => this.messageHandlers.delete(id);
  }

  // Register status handler
  onStatus(handler) {
    const id = Date.now() + Math.random();
    this.statusHandlers.set(id, handler);
    return () => this.statusHandlers.delete(id);
  }

  // Register typing handler
  onTyping(handler) {
    const id = Date.now() + Math.random();
    this.typingHandlers.set(id, handler);
    return () => this.typingHandlers.delete(id);
  }

  // Disconnect
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
      this.currentUserId = null;
      this.currentReceiverId = null;
      this.messageHandlers.clear();
      this.statusHandlers.clear();
      this.typingHandlers.clear();
    }
  }

  // Check if connected
  getConnectionStatus() {
    return {
      isConnected: this.isConnected,
      userId: this.currentUserId,
      receiverId: this.currentReceiverId
    };
  }
}

// Create singleton instance
const socketClient = new SocketClient();

export default socketClient;
