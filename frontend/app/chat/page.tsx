"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Send, ArrowLeft, MessageCircle} from "lucide-react";
import Link from "next/link";
import socketClient from "@/lib/socket-client";

interface Message {
  _id: string;
  messageId: string;
  content: {
    text: string;
  };
  senderId: {
    _id: string;
    name: string;
    email: string;
    profile_url: string;
  };
  receiverId: {
    _id: string;
    name: string;
    email: string;
    profile_url: string;
  };
  timestamp: string;
  status: string;
  escrow: {
    amount: number;
    status: string;
  };
}

interface User {
  _id: string;
  name: string;
  email: string;
  profile_url: string;
}

export default function ChatPage() {
  const searchParams = useSearchParams();
  const receiverId = searchParams.get("id");

  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [receiver, setReceiver] = useState<User | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isOnline, setIsOnline] = useState(false);
  const [isSocketConnected, setIsSocketConnected] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [otherUserTyping, setOtherUserTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [escrowEnabled, setEscrowEnabled] = useState(false);
  const [escrowAmount, setEscrowAmount] = useState<string>("");

  // Get current user from localStorage and connect to socket
  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    const userId = localStorage.getItem("token");
    const name = localStorage.getItem("name");
    const email = localStorage.getItem("email");
    const profile_url = localStorage.getItem("profile_url");

    if (token && userId && name && email) {
      const user = {
        _id: userId,
        name: name,
        email: email,
        profile_url: profile_url || "",
      };
      setCurrentUser(user);

      // Connect to Socket.IO
      socketClient
        .connect(userId, token)
        .then(() => {
          setIsSocketConnected(true);
          console.log("Connected to Socket.IO");
        })
        .catch((error) => {
          console.error("Failed to connect to Socket.IO:", error);
          setIsSocketConnected(false);
        });
    }

    // Cleanup on unmount
    return () => {
      socketClient.disconnect();
    };
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const fetchUserInfo = async (userId: string) => {
    try {
      const token = localStorage.getItem("accessToken");
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/users/profile/${userId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (response.ok) {
        const data = await response.json();
        setReceiver(data.data);
      }
    } catch (error) {
      console.error("Error fetching user info:", error);
    }
  };

  const fetchMessages = useCallback(async () => {
    if (!currentUser || !receiverId) return;

    setIsLoading(true);
    try {
      const token = localStorage.getItem("accessToken");
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/chat/messages/${currentUser._id}/${receiverId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setMessages(data.data || []);
      } else {
        console.error("Failed to fetch messages");
      }
    } catch (error) {
      console.error("Error fetching messages:", error);
    } finally {
      setIsLoading(false);
    }
  }, [currentUser, receiverId]);

  // Fetch receiver information
  useEffect(() => {
    if (receiverId) {
      fetchUserInfo(receiverId);
    }
  }, [receiverId]);

  // Join chat room and set up socket handlers when both users are available
  useEffect(() => {
    if (receiverId && currentUser && isSocketConnected) {
      // Join chat room
      socketClient.joinChat(receiverId);

      // Set up message handlers
      const unsubscribeMessage = socketClient.onMessage(
        (type: string, message: Message) => {
          if (type === "receive") {
            // Received a new message
            setMessages((prev) => [...prev, message]);
          } else if (type === "sent") {
            // Message sent confirmation
            setMessages((prev) => [...prev, message]);
          }
        }
      );

      // Set up status handlers
      const unsubscribeStatus = socketClient.onStatus(
        (data: { userId: string; status: string }) => {
          if (data.userId === receiverId) {
            setIsOnline(data.status === "online");
          }
        }
      );

      // Set up typing handlers
      const unsubscribeTyping = socketClient.onTyping(
        (data: { userId: string; isTyping: boolean }) => {
          if (data.userId === receiverId) {
            setOtherUserTyping(data.isTyping);
          }
        }
      );

      // Fetch existing messages
      fetchMessages();

      // Cleanup handlers
      return () => {
        unsubscribeMessage();
        unsubscribeStatus();
        unsubscribeTyping();
      };
    }
  }, [receiverId, currentUser, isSocketConnected, fetchMessages]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async () => {
    if (!newMessage.trim() || !currentUser || !receiverId || isSending) return;

    setIsSending(true);
    const messageText = newMessage.trim();
    setNewMessage("");

    // Stop typing indicator
    setIsTyping(false);
    socketClient.sendTyping(false);

    try {
      const messageId = `msg_${Date.now()}_${Math.random()
        .toString(36)
        .substr(2, 9)}`;
      const timestamp = new Date().toISOString();

      // Try to send via Socket.IO first
      const socketSent = socketClient.sendMessage({
        messageId,
        content: messageText,
        senderId: currentUser._id,
        receiverId: receiverId,
        timestamp,
        escrow: escrowEnabled && Number(escrowAmount) > 0 ? { amount: Number(escrowAmount) } : undefined,
      });

      if (!socketSent) {
        // Fallback to API if socket is not connected
        console.log("Socket not connected, sending via API");
        await sendMessageViaAPI(messageText);
      }
    } catch (error) {
      console.error("Error sending message:", error);
      // Restore the message if sending failed
      setNewMessage(messageText);
    } finally {
      setIsSending(false);
    }
  };

  const sendMessageViaAPI = async (messageText: string) => {
    const token = localStorage.getItem("accessToken");
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/chat/message`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          content: { text: messageText },
          senderId: currentUser!._id,
          receiverId: receiverId,
          escrow: escrowEnabled && Number(escrowAmount) > 0 ? { amount: Number(escrowAmount) } : undefined,
        }),
      }
    );

    if (response.ok) {
      const data = await response.json();
      // Add the new message to the local state
      const newMsg: Message = {
        _id: data.data.messageId,
        messageId: data.data.messageId,
        content: { text: messageText },
        senderId: currentUser!,
        receiverId: receiver!,
        timestamp: new Date().toISOString(),
        status: "sent",
        escrow: escrowEnabled && Number(escrowAmount) > 0 ? { amount: Number(escrowAmount), status: "pending" } : { amount: 0, status: "null" },
      };
      setMessages((prev) => [...prev, newMsg]);
      // reset escrow controls after sending
      setEscrowEnabled(false);
      setEscrowAmount("");
    } else {
      console.error("Failed to send message via API");
      throw new Error("Failed to send message");
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setNewMessage(value);

    // Handle typing indicator
    if (value.trim() && !isTyping) {
      setIsTyping(true);
      socketClient.sendTyping(true);
    }

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set timeout to stop typing indicator
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      socketClient.sendTyping(false);
    }, 1000);
  };

  const updateEscrowStatus = async (messageId: string, escrowStatus: "accepted" | "rejected") => {
    try {
      const token = localStorage.getItem("accessToken");
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/chat/message/${messageId}/escrow`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ escrowStatus }),
        }
      );
      if (res.ok) {
        const data = await res.json();
        const updated = data.data as Message;
        setMessages(prev => prev.map(m => m.messageId === updated.messageId ? { ...m, escrow: updated.escrow } : m));
      }
    } catch (e) {
      console.error("Failed updating escrow status", e);
    }
  };

  if (!receiverId) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <Card>
          <CardContent className="p-6 text-center">
            <MessageCircle className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <h2 className="text-xl font-semibold mb-2">No Chat Selected</h2>
            <p className="text-gray-600 mb-4">
              Please select a seller to start a conversation.
            </p>
            <Link href="/">
              <Button variant="outline">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Home
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <Card>
          <CardContent className="p-6 text-center">
            <h2 className="text-xl font-semibold mb-2">Please Log In</h2>
            <p className="text-gray-600 mb-4">
              You need to be logged in to start a conversation.
            </p>
            <Link href="/login">
              <Button>Log In</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <Card className="h-[600px] flex flex-col">
        {/* Header */}
        <div className="border-b p-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Link href="/">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4" />
              </Button>
            </Link>
            {receiver && (
              <>
                <Avatar className="h-8 w-8">
                  <AvatarImage src={receiver.profile_url} alt={receiver.name} />
                  <AvatarFallback>{receiver.name}</AvatarFallback>
                </Avatar>
                <div>
                  <div className="flex items-center space-x-2">
                    <h2 className="font-semibold">{receiver.name}</h2>
                    <div className="flex items-center space-x-1">
                      {isOnline ? (
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      ) : (
                        <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                      )}
                      <span
                        className={`text-xs ${
                          isOnline ? "text-green-500" : "text-gray-400"
                        }`}
                      >
                        {isOnline ? "Online" : "Offline"}
                      </span>
                    </div>
                  </div>
                  <p className="text-sm text-gray-500">{receiver.email}</p>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {isLoading ? (
            <div className="text-center text-gray-500 py-8">
              <MessageCircle className="w-8 h-8 mx-auto mb-2 animate-spin" />
              <p>Loading messages...</p>
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              <MessageCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>No messages yet. Start the conversation!</p>
            </div>
          ) : (
            messages.map((message) => {
              const isOwnMessage = message.senderId._id === currentUser._id;
              return (
                <div
                  key={message._id}
                  className={`flex ${
                    isOwnMessage ? "justify-end" : "justify-start"
                  }`}
                >
                  {message.escrow?.status && message.escrow.status !== "null" ? (
                    <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg border ${isOwnMessage ? 'bg-blue-50 border-blue-200' : 'bg-orange-50 border-orange-200'}`}>
                      <div className="text-sm font-semibold">Escrow Offer</div>
                      <div className="mt-1 text-sm">Amount: Rs {message.escrow.amount}</div>
                      <div className="mt-2 text-xs text-gray-500">{new Date(message.timestamp).toLocaleTimeString()}</div>
                      {(!isOwnMessage && message.escrow.status === 'pending') && (
                        <div className="mt-3 flex gap-2">
                          <Button size="sm" onClick={() => updateEscrowStatus(message.messageId, 'accepted')}>Accept</Button>
                          <Button size="sm" variant="outline" onClick={() => updateEscrowStatus(message.messageId, 'rejected')}>Reject</Button>
                        </div>
                      )}
                      {message.escrow.status !== 'pending' && (
                        <div className={`mt-2 text-xs ${message.escrow.status === 'accepted' ? 'text-green-600' : 'text-red-600'}`}>Escrow {message.escrow.status}</div>
                      )}
                    </div>
                  ) : (
                    <div
                      className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                        isOwnMessage
                          ? "bg-primary text-white"
                          : "bg-gray-100 text-gray-900"
                      }`}
                    >
                      <p className="text-sm">{message.content.text}</p>
                      <p
                        className={`text-xs mt-1 ${
                          isOwnMessage
                            ? "text-primary-foreground/70"
                            : "text-gray-500"
                        }`}
                      >
                        {new Date(message.timestamp).toLocaleTimeString()}
                      </p>
                    </div>
                  )}
                </div>
              );
            })
          )}
          {otherUserTyping && (
            <div className="flex justify-start">
              <div className="bg-gray-100 px-3 py-2 rounded-lg">
                <div className="flex items-center space-x-1">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div
                      className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                      style={{ animationDelay: "0.1s" }}
                    ></div>
                    <div
                      className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                      style={{ animationDelay: "0.2s" }}
                    ></div>
                  </div>
                  <span className="text-xs text-gray-500 ml-2">
                    {receiver?.name} is typing...
                  </span>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="border-t p-4">
          <div className="flex space-x-2 items-center">
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant={escrowEnabled ? 'default' : 'outline'}
                size="sm"
                onClick={() => setEscrowEnabled(prev => !prev)}
              >
                {escrowEnabled ? 'Escrow On' : 'Escrow'}
              </Button>
              {escrowEnabled && (
                <Input
                  type="number"
                  min="1"
                  step="1"
                  value={escrowAmount}
                  onChange={(e) => setEscrowAmount(e.target.value)}
                  placeholder="Amount"
                  className="w-28"
                />
              )}
            </div>
            <Input
              value={newMessage}
              onChange={handleInputChange}
              onKeyPress={handleKeyPress}
              placeholder="Type your message..."
              disabled={isSending}
              className="flex-1"
            />
            <Button
              onClick={sendMessage}
              disabled={!newMessage.trim() || isSending}
              size="sm"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
