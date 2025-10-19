'use client';

import { useState, useEffect, useRef } from 'react';
import { useSocket } from '../hooks/useSocket';
import { Send, Wifi, WifiOff, Users } from 'lucide-react';
import offlineSyncService from '../services/offlineSyncService';

interface Message {
  messageId: string;
  senderId: string;
  senderEmail: string;
  message?: string;
  content?: {
    text: string;
    type: string;
  };
  timestamp: Date;
  roomId: string;
}

interface SimpleChatProps {
  roomId: string;
  currentUserId: string;
  currentUserEmail: string;
  receiverId: string;
  receiverEmail: string;
  productId?: string;
  sellerId?: string;
  initialMessages?: any[];
  isOffline?: boolean;
}

export default function SimpleChat({
  roomId,
  currentUserId,
  currentUserEmail,
  receiverId,
  receiverEmail,
  productId,
  sellerId,
  initialMessages = [],
  isOffline = false
}: SimpleChatProps) {
  const [messages, setMessages] = useState<Message[]>(initialMessages || []);
  const [newMessage, setNewMessage] = useState('');
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const {
    connected,
    connecting,
    error,
    joinRoom,
    leaveRoom,
    sendMessage,
    onMessage,
    onUserJoined,
    onUserLeft,
    onTyping,
    emitTyping,
    removeAllListeners
  } = useSocket();

  // Join room when connected
  useEffect(() => {
    if (connected && roomId && productId && sellerId) {
      joinRoom(roomId, productId, sellerId);
    }
  }, [connected, roomId, productId, sellerId]);

  // Setup message listeners
  useEffect(() => {
    const handleNewMessage = (message: Message) => {
      setMessages(prev => [...prev, message]);
    };

    const handleUserJoined = (data: any) => {
      console.log('User joined:', data);
    };

    const handleUserLeft = (data: any) => {
      console.log('User left:', data);
    };

    const handleTyping = (data: any) => {
      if (data.isTyping) {
        setTypingUsers(prev => [...prev.filter(email => email !== data.userEmail), data.userEmail]);
      } else {
        setTypingUsers(prev => prev.filter(email => email !== data.userEmail));
      }
    };

    onMessage(handleNewMessage);
    onUserJoined(handleUserJoined);
    onUserLeft(handleUserLeft);
    onTyping(handleTyping);

    return () => {
      removeAllListeners();
    };
  }, [onMessage, onUserJoined, onUserLeft, onTyping, removeAllListeners]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Leave room on unmount
  useEffect(() => {
    return () => {
      if (roomId) {
        leaveRoom(roomId);
      }
    };
  }, [roomId, leaveRoom]);

  const handleSendMessage = () => {
    if (newMessage.trim()) {
      const messageData = {
        roomId,
        message: newMessage.trim(),
        productId,
        sellerId
      };

      if (isOffline) {
        // Handle offline message sending
        handleOfflineMessage(messageData);
      } else if (connected) {
        // Handle online message sending
        sendMessage(messageData);
        // Stop typing indicator
        emitTyping(roomId, false);
      }
      
      setNewMessage('');
    }
  };

  const handleOfflineMessage = (messageData: any) => {
    const offlineMessage: Message = {
      messageId: `offline_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      senderId: currentUserId,
      senderEmail: currentUserEmail,
      message: messageData.message,
      timestamp: new Date(),
      roomId: messageData.roomId
    };

    // Add message to local state
    setMessages(prev => [...prev, offlineMessage]);
    
    // Store message in localStorage for later sync
    storeOfflineMessage(offlineMessage);
    
    console.log('Message stored offline:', offlineMessage);
  };

  const storeOfflineMessage = (message: Message) => {
    try {
      offlineSyncService.addOfflineMessage({
        ...message,
        receiverId: receiverId
      });
    } catch (error) {
      console.error('Failed to store offline message:', error);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleTyping = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewMessage(e.target.value);
    
    if (connected) {
      // Emit typing indicator
      emitTyping(roomId, true);

      // Clear previous timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      // Set timeout to stop typing indicator
      typingTimeoutRef.current = setTimeout(() => {
        emitTyping(roomId, false);
      }, 1000);
    }
  };

  const getConnectionStatus = () => {
    if (isOffline) return 'Offline Mode';
    if (connecting) return 'Connecting...';
    if (connected) return 'Connected';
    if (error) return 'Connection Error';
    return 'Disconnected';
  };

  const getConnectionIcon = () => {
    if (isOffline) return <WifiOff className="w-4 h-4 text-orange-500" />;
    if (connecting) return <Users className="w-4 h-4 animate-pulse" />;
    if (connected) return <Wifi className="w-4 h-4 text-green-500" />;
    return <WifiOff className="w-4 h-4 text-red-500" />;
  };

  return (
    <div className="flex flex-col h-96 bg-white border border-gray-200 rounded-lg shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50">
        <div>
          <h3 className="font-medium text-gray-900">Chat with {receiverEmail}</h3>
          <p className="text-sm text-gray-500">Room: {roomId}</p>
        </div>
        <div className="flex items-center space-x-2">
          {getConnectionIcon()}
          <span className={`text-sm ${
            isOffline ? 'text-orange-600' :
            connected ? 'text-green-600' : 
            connecting ? 'text-yellow-600' : 
            'text-red-600'
          }`}>
            {getConnectionStatus()}
          </span>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="p-3 bg-red-50 border-b border-red-200">
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((message) => (
          <div
            key={message.messageId}
            className={`flex ${message.senderId === currentUserId ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`max-w-xs px-3 py-2 rounded-lg ${
              message.senderId === currentUserId 
                ? 'bg-blue-500 text-white' 
                : 'bg-gray-100 text-gray-900'
            }`}>
              <p className="text-sm">{message.message || message.content?.text}</p>
              <p className={`text-xs mt-1 ${
                message.senderId === currentUserId 
                  ? 'text-blue-100' 
                  : 'text-gray-500'
              }`}>
                {new Date(message.timestamp).toLocaleTimeString()}
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
            <p className="text-sm">No messages yet. Start the conversation!</p>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-gray-200">
        <div className="flex space-x-2">
          <input
            type="text"
            value={newMessage}
            onChange={handleTyping}
            onKeyPress={handleKeyPress}
            placeholder="Type a message..."
            disabled={!connected && !isOffline}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
          />
          <button
            onClick={handleSendMessage}
            disabled={!newMessage.trim() || (!connected && !isOffline)}
            className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white p-2 rounded-md transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
