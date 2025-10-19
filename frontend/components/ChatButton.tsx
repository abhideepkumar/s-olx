'use client';

import { useState } from 'react';
import { MessageCircle, X } from 'lucide-react';
import SimpleChat from './SimpleChat';

interface ChatButtonProps {
  productId: string;
  sellerId: string;
  sellerEmail: string;
  productTitle?: string;
  productPrice?: number;
  productImages?: string[];
}

export default function ChatButton({ 
  productId, 
  sellerId, 
  sellerEmail, 
  productTitle,
  productPrice,
  productImages
}: ChatButtonProps) {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [conversation, setConversation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleContactSeller = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      alert('Please login to start a chat');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000'}/api/v1/conversations/start`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          productId,
          sellerId,
          productTitle,
          productPrice,
          productImages
        })
      });

      if (!response.ok) {
        throw new Error('Failed to start conversation');
      }

      const data = await response.json();
      setConversation(data.data);
      setIsChatOpen(true);
    } catch (err) {
      // If backend is offline, create a local conversation
      if (err.message.includes('Failed to fetch') || err.message.includes('ERR_CONNECTION_REFUSED')) {
        console.log('Backend offline, creating local conversation');
        const localConversation = createLocalConversation();
        setConversation(localConversation);
        setIsChatOpen(true);
        setError('Backend offline - messages will be queued locally');
      } else {
        setError(err.message);
        console.error('Failed to start conversation:', err);
      }
    } finally {
      setLoading(false);
    }
  };

  const createLocalConversation = () => {
    const currentUserId = localStorage.getItem('userId') || 'local_user';
    const currentUserEmail = localStorage.getItem('email') || 'user@example.com';
    
    // Generate room ID locally
    const participantIds = [currentUserId, sellerId].sort();
    const roomId = `product_${productId}_users_${participantIds.join('_')}`;
    
    return {
      roomId,
      conversation: {
        roomId,
        participants: [
          {
            userId: currentUserId,
            email: currentUserEmail,
            name: currentUserEmail
          },
          {
            userId: sellerId,
            email: sellerEmail,
            name: sellerEmail
          }
        ],
        product: {
          productId,
          title: productTitle,
          price: productPrice,
          images: productImages
        },
        metadata: {
          messageCount: 0,
          lastActivity: new Date(),
          isActive: true
        }
      },
      recentMessages: [],
      isOffline: true
    };
  };

  const handleCloseChat = () => {
    setIsChatOpen(false);
    setConversation(null);
    setError(null);
  };

  return (
    <>
      {/* Contact Seller Button */}
      <button
        onClick={handleContactSeller}
        disabled={loading}
        className="flex items-center space-x-2 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 text-white px-4 py-2 rounded-lg transition-colors"
      >
        <MessageCircle className="w-4 h-4" />
        <span>{loading ? 'Starting Chat...' : 'Contact Seller'}</span>
      </button>

      {/* Error Display */}
      {error && (
        <div className={`mt-2 p-2 border rounded text-sm ${
          error.includes('offline') 
            ? 'bg-orange-50 border-orange-200 text-orange-600' 
            : 'bg-red-50 border-red-200 text-red-600'
        }`}>
          {error}
        </div>
      )}

      {/* Chat Modal */}
      {isChatOpen && conversation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  Chat with {sellerEmail}
                </h2>
                {productTitle && (
                  <p className="text-sm text-gray-500">About: {productTitle}</p>
                )}
              </div>
              <button
                onClick={handleCloseChat}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Chat Component */}
            <div className="flex-1 p-4">
              <SimpleChat
                roomId={conversation.roomId}
                currentUserId={conversation.conversation.participants.find(p => p.userId !== sellerId)?.userId}
                currentUserEmail={conversation.conversation.participants.find(p => p.userId !== sellerId)?.email}
                receiverId={sellerId}
                receiverEmail={sellerEmail}
                productId={productId}
                sellerId={sellerId}
                initialMessages={conversation.recentMessages}
                isOffline={conversation.isOffline}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
