import { useEffect, useRef, useState } from 'react';
import { MessageCircle, Send, Users, Wifi } from 'lucide-react';

// Mock PeerJS for demo - replace with real PeerJS
const mockPeer = {
  connect: (id) => ({
    on: (event, callback) => {
      if (event === 'open') setTimeout(() => callback(), 1000);
    },
    send: (data) => console.log('Sent:', data),
    open: true
  }),
  on: (event, callback) => {
    if (event === 'open') setTimeout(() => callback(), 500);
  }
};

export default function PeerChat({ sellerEmail }) {
  const [userEmail] = useState(localStorage.getItem('email')); 
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState('');
  const [connected, setConnected] = useState(false);
  const [connecting, setConnecting] = useState(false);
  
  const connRef = useRef(null);

  // Initialize peer
  useEffect(() => {
    // In real app: const peer = new Peer(userEmail);
    const peer = mockPeer;
    
    peer.on('open', () => {
      console.log('Peer ready:', userEmail);
    });
  }, [userEmail]);

  // Connect to seller
  const connectToSeller = async () => {
    setConnecting(true);
    
    // In real app: const conn = new Peer(userEmail).connect(sellerEmail);
    const conn = mockPeer.connect(sellerEmail);
    
    conn.on('open', () => {
      connRef.current = conn;
      setConnected(true);
      setConnecting(false);
      
      // Send first message
      const firstMsg = 'Hi! I\'m interested in your product';
      conn.send(firstMsg);
      setMessages([{ text: firstMsg, from: 'self', time: new Date() }]);
    });
  };

  // Send message
  const sendMessage = () => {
    if (connRef.current && message.trim()) {
      connRef.current.send(message);
      setMessages(prev => [...prev, { text: message, from: 'self', time: new Date() }]);
      setMessage('');
    }
  };

  return (
    <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg overflow-hidden">
      {/* Header */}
      <div className="bg-blue-500  p-4 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <MessageCircle className="w-5 h-5" />
          <span className="font-medium">Chat with Seller</span>
        </div>
        <div className="flex items-center space-x-1">
          {connected ? <Wifi className="w-4 h-4" /> : <Users className="w-4 h-4" />}
          <span className="text-sm">{connected ? 'Connected' : 'Ready'}</span>
        </div>
      </div>

      {/* Connect Button */}
      {!connected && (
        <div className="p-4 text-center border-b">
          <button
            onClick={connectToSeller}
            disabled={connecting}
            className="bg-green-500 hover:bg-green-600 disabled:bg-gray-300  px-6 py-2 rounded-full"
          >
            {connecting ? 'Connecting...' : 'Connect & Chat'}
          </button>
        </div>
      )}

      {/* Messages */}
      <div className="h-64 overflow-y-auto p-4 space-y-2">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.from === 'self' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-xs px-3 py-2 rounded-lg ${
              msg.from === 'self' ? 'bg-blue-500 ' : 'bg-gray-100'
            }`}>
              <p className="text-sm">{msg.text}</p>
              <p className={`text-xs mt-1 ${msg.from === 'self' ? 'text-blue-100' : 'text-gray-500'}`}>
                {msg.time.toLocaleTimeString()}
              </p>
            </div>
          </div>
        ))}
        {messages.length === 0 && (
          <div className="text-center text-gray-500 py-8">
            <MessageCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No messages yet</p>
          </div>
        )}
      </div>

      {/* Input */}
      {connected && (
        <div className="p-4 border-t flex space-x-2">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
            placeholder="Type message..."
            className="flex-1 px-3 py-2 border rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={sendMessage}
            disabled={!message.trim()}
            className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300  p-2 rounded-full"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Info */}
      <div className="px-4 py-2 bg-gray-50 text-xs text-gray-600 border-t">
        <p>Your ID: {userEmail}</p>
        <p>Seller: {sellerEmail}</p>
      </div>
    </div>
  );
}
