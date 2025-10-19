'use client';

import { useEffect, useRef, useState } from 'react';
import { MessageCircle, Send, Users, Wifi, X } from 'lucide-react';
import { io, Socket } from 'socket.io-client';

interface Message {
  messageId: string;
  senderId: string;
  senderEmail: string;
  message: string;
  timestamp: Date;
  roomId: string;
}

interface SocketChatProps {
  productId: string;
  sellerId: string;
  sellerEmail: string;
  onClose?: () => void;
}

export default function SocketChat({ productId, sellerId, sellerEmail, onClose }: SocketChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [message, setMessage] = useState('');
  const [connected, setConnected] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  
  const socketRef = useRef<Socket | null>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize socket connection
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      setError('Authentication token not found');
      return;
    }

    setConnecting(true);
    
    // Connect to Socket.IO server
    socketRef.current = io(process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000', {
      auth: {
        token: token
      },
      transports: ['websocket', 'polling']
    });

    // Connection event handlers
    socketRef.current.on('connect', () => {
      console.log('Connected to chat server');
      setConnected(true);
      setConnecting(false);
      setError(null);
      
      // Join the chat room
      joinChatRoom();
    });

    socketRef.current.on('disconnect', () => {
      console.log('Disconnected from chat server');
      setConnected(false);
    });

    socketRef.current.on('connect_error', (error) => {
      console.error('Connection error:', error);
      setError('Failed to connect to chat server');
      setConnecting(false);
    });

    // Chat event handlers
    socketRef.current.on('room_joined', (data) => {
      console.log('Joined room:', data);
    });

    socketRef.current.on('new_message', (messageData: Message) => {
      setMessages(prev => [...prev, messageData]);
    });

    socketRef.current.on('user_joined', (data) => {
      console.log('User joined:', data);
    });

    socketRef.current.on('user_left', (data) => {
      console.log('User left:', data);
    });

    socketRef.current.on('user_typing', (data) => {
      if (data.isTyping) {
        setTypingUsers(prev => [...prev.filter(email => email !== data.userEmail), data.userEmail]);
      } else {
        setTypingUsers(prev => prev.filter(email => email !== data.userEmail));
      }
    });

    socketRef.current.on('error', (error) => {
      setError(error.message);
    });

    // Cleanup on unmount
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [productId, sellerId]);

  const joinChatRoom = () => {
    if (socketRef.current && connected) {
      socketRef.current.emit('join_chat_room', {
        productId,
        sellerId
      });
    }
  };

  const sendMessage = () => {
    if (socketRef.current && message.trim() && connected) {
      const messageData = {
        roomId: `product_${productId}_users_${[localStorage.getItem('userId'), sellerId].sort().join('_')}`,
        message: message.trim(),
        productId,
        sellerId
      };

      socketRef.current.emit('send_message', messageData);
      setMessage('');
      
      // Stop typing indicator
      socketRef.current.emit('typing', {
        roomId: messageData.roomId,
        isTyping: false
      });
    }
  };

  const handleTyping = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMessage(e.target.value);
    
    if (socketRef.current && connected) {
      const roomId = `product_${productId}_users_${[localStorage.getItem('userId'), sellerId].sort().join('_')}`;
      
      // Emit typing indicator
      socketRef.current.emit('typing', {
        roomId,
        isTyping: true
      });

      // Clear previous timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      // Set timeout to stop typing indicator
      typingTimeoutRef.current = setTimeout(() => {
        if (socketRef.current) {
          socketRef.current.emit('typing', {
            roomId,
            isTyping: false
          });
        }
      }, 1000);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg overflow-hidden">
      {/* Header */}
      <div className="bg-blue-500 text-white p-4 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <MessageCircle className="w-5 h-5" />
          <span className="font-medium">Chat with {sellerEmail}</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-1">
            {connected ? <Wifi className="w-4 h-4" /> : <Users className="w-4 h-4" />}
            <span className="text-sm">{connected ? 'Connected' : 'Connecting...'}</span>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="p-1 hover:bg-blue-600 rounded"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="p-4 bg-red-50 border-b border-red-200">
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      )}

      {/* Connect Button */}
      {!connected && !connecting && (
        <div className="p-4 text-center border-b">
          <button
            onClick={joinChatRoom}
            disabled={connecting}
            className="bg-green-500 hover:bg-green-600 disabled:bg-gray-300 text-white px-6 py-2 rounded-full"
          >
            {connecting ? 'Connecting...' : 'Connect & Chat'}
          </button>
        </div>
      )}

      {/* Messages */}
      <div className="h-64 overflow-y-auto p-4 space-y-2">
        {messages.map((msg) => (
          <div key={msg.messageId} className={`flex ${msg.senderId === localStorage.getItem('userId') ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-xs px-3 py-2 rounded-lg ${
              msg.senderId === localStorage.getItem('userId') ? 'bg-blue-500 text-white' : 'bg-gray-100'
            }`}>
              <p className="text-sm">{msg.message}</p>
              <p className={`text-xs mt-1 ${
                msg.senderId === localStorage.getItem('userId') ? 'text-blue-100' : 'text-gray-500'
              }`}>
                {new Date(msg.timestamp).toLocaleTimeString()}
              </p>
            </div>
          </div>
        ))}
        
        {/* Typing Indicator */}
        {typingUsers.length > 0 && (
          <div className="flex justify-start">
            <div className="bg-gray-100 px-3 py-2 rounded-lg">
              <p className="text-sm text-gray-600">
                {typingUsers.join(', ')} {typingUsers.length === 1 ? 'is' : 'are'} typing...
              </p>
            </div>
          </div>
        )}
        
        {messages.length === 0 && connected && (
          <div className="text-center text-gray-500 py-8">
            <MessageCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No messages yet. Start the conversation!</p>
          </div>
        )}
      </div>

      {/* Input */}
      {connected && (
        <div className="p-4 border-t flex space-x-2">
          <input
            type="text"
            value={message}
            onChange={handleTyping}
            onKeyPress={handleKeyPress}
            placeholder="Type message..."
            className="flex-1 px-3 py-2 border rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={sendMessage}
            disabled={!message.trim()}
            className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 text-white p-2 rounded-full"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Info */}
      <div className="px-4 py-2 bg-gray-50 text-xs text-gray-600 border-t">
        <p>Product ID: {productId}</p>
        <p>Seller: {sellerEmail}</p>
        <p>Room: product_{productId}_users_{[localStorage.getItem('userId'), sellerId].sort().join('_')}</p>
      </div>
    </div>
  );
}
