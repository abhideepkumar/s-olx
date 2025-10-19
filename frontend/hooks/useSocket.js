import { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';

export const useSocket = () => {
  const [connected, setConnected] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState(null);
  const socketRef = useRef(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      setError('No authentication token found');
      return;
    }

    setConnecting(true);
    
    // Initialize socket connection
    socketRef.current = io(process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000', {
      auth: {
        token: token
      },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
      timeout: 20000
    });

    // Connection event handlers
    socketRef.current.on('connect', () => {
      console.log('Socket connected');
      setConnected(true);
      setConnecting(false);
      setError(null);
    });

    socketRef.current.on('disconnect', () => {
      console.log('Socket disconnected');
      setConnected(false);
    });

    socketRef.current.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      setError('Connection failed');
      setConnecting(false);
    });

    socketRef.current.on('reconnect', (attemptNumber) => {
      console.log('Socket reconnected after', attemptNumber, 'attempts');
      setConnected(true);
      setError(null);
    });

    socketRef.current.on('reconnect_error', (error) => {
      console.error('Socket reconnection error:', error);
      setError('Reconnection failed');
    });

    socketRef.current.on('reconnect_failed', () => {
      console.error('Socket reconnection failed');
      setError('Reconnection failed');
      setConnected(false);
    });

    // Cleanup on unmount
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, []);

  const joinRoom = (roomId, productId, sellerId) => {
    if (socketRef.current && connected) {
      socketRef.current.emit('join_chat_room', { roomId, productId, sellerId });
    }
  };

  const leaveRoom = (roomId) => {
    if (socketRef.current && connected) {
      socketRef.current.emit('leave_chat_room', { roomId });
    }
  };

  const sendMessage = (messageData) => {
    if (socketRef.current && connected) {
      socketRef.current.emit('send_message', messageData);
    }
  };

  const onMessage = (callback) => {
    if (socketRef.current) {
      socketRef.current.on('new_message', callback);
    }
  };

  const onUserJoined = (callback) => {
    if (socketRef.current) {
      socketRef.current.on('user_joined', callback);
    }
  };

  const onUserLeft = (callback) => {
    if (socketRef.current) {
      socketRef.current.on('user_left', callback);
    }
  };

  const onTyping = (callback) => {
    if (socketRef.current) {
      socketRef.current.on('user_typing', callback);
    }
  };

  const emitTyping = (roomId, isTyping) => {
    if (socketRef.current && connected) {
      socketRef.current.emit('typing', { roomId, isTyping });
    }
  };

  const removeAllListeners = () => {
    if (socketRef.current) {
      socketRef.current.removeAllListeners();
    }
  };

  return {
    socket: socketRef.current,
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
  };
};
