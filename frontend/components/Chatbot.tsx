"use client";

import { useState, useRef, useEffect } from "react";
import { MessageCircle, X, Send, Loader2, Sparkles, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import axios from "axios";
import ReactMarkdown from "react-markdown";

interface RetrievedDocument {
  id: string;
  score: number;
  content: {
    title?: string;
    description?: string;
    condition?: string;
    category?: string;
    price?: number;
    images?: string[];
  };
}

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  documents?: RetrievedDocument[];
}

export default function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content: "👋 Hi! I'm your **S-OLX Assistant**. I can help you find products in our marketplace. Try asking me things like:\n\n- \"Show me chairs under ₹4000\"\n- \"Any laptops available?\"\n- \"Find books for engineering\"",
    },
  ]);
  const [input, setInput] = useState("");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await axios.post("http://localhost:8000/api/v1/ai/chat", {
        message: userMessage.content,
        sessionId: sessionId || undefined,
      });

      const responseData = response.data.data;
      
      // Save session ID for conversation continuity
      if (responseData.sessionId) {
        setSessionId(responseData.sessionId);
      }

      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: responseData.answer?.response || responseData.answer || "I couldn't process that request.",
        documents: responseData.answer?.retrievedDocuments,
      };

      setMessages((prev) => [...prev, botMessage]);
    } catch (error) {
      console.error("Chat error:", error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "😔 Sorry, I encountered an error. Please try again later.",
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const resetConversation = async () => {
    // End current session if exists
    if (sessionId) {
      try {
        await axios.delete(`http://localhost:8000/api/v1/ai/session/${sessionId}`);
      } catch (error) {
        console.error("Failed to end session:", error);
      }
    }

    setSessionId(null);
    setMessages([
      {
        id: "welcome",
        role: "assistant",
        content: "👋 Hi! I'm your **S-OLX Assistant**. I can help you find products in our marketplace. Try asking me things like:\n\n- \"Show me chairs under ₹4000\"\n- \"Any laptops available?\"\n- \"Find books for engineering\"",
      },
    ]);
  };

  return (
    <>
      {/* Floating Action Button */}
      <Button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-xl transition-all duration-300 z-50",
          "bg-gradient-to-br from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500",
          "hover:scale-110 hover:shadow-2xl hover:shadow-violet-500/25",
          isOpen ? "rotate-90 opacity-0 pointer-events-none scale-75" : "opacity-100"
        )}
        size="icon"
      >
        <MessageCircle className="h-7 w-7 text-white" />
      </Button>

      {/* Chat Window */}
      <div
        className={cn(
          "fixed bottom-6 right-6 w-[380px] sm:w-[420px] rounded-2xl shadow-2xl transition-all duration-300 z-50 flex flex-col overflow-hidden",
          "bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-700/50",
          isOpen
            ? "translate-y-0 opacity-100 scale-100"
            : "translate-y-10 opacity-0 scale-95 pointer-events-none"
        )}
        style={{ height: "550px", maxHeight: "85vh" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-700/50 bg-gradient-to-r from-violet-600/20 to-indigo-600/20 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-violet-500 to-indigo-500 flex items-center justify-center">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 bg-green-500 rounded-full border-2 border-slate-900" />
            </div>
            <div>
              <h3 className="font-semibold text-white">S-OLX Assistant</h3>
              <p className="text-xs text-slate-400">AI-powered product search</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-slate-400 hover:text-white hover:bg-slate-700/50"
              onClick={resetConversation}
              title="New conversation"
            >
              <RotateCcw className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-slate-400 hover:text-white hover:bg-slate-700/50"
              onClick={() => setIsOpen(false)}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Messages */}
        <ScrollArea className="flex-1 p-4">
          <div className="space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  "flex w-full",
                  message.role === "user" ? "justify-end" : "justify-start"
                )}
              >
                <div
                  className={cn(
                    "max-w-[85%] rounded-2xl px-4 py-3 text-sm",
                    message.role === "user"
                      ? "bg-gradient-to-br from-violet-600 to-indigo-600 text-white rounded-br-md"
                      : "bg-slate-800/80 text-slate-100 rounded-bl-md border border-slate-700/50"
                  )}
                >
                  <div className="prose prose-sm max-w-none prose-invert [&>p]:mb-2 last:[&>p]:mb-0 [&>ul]:list-disc [&>ul]:pl-4 [&>ol]:list-decimal [&>ol]:pl-4 [&_strong]:text-violet-300">
                    <ReactMarkdown>
                      {message.content}
                    </ReactMarkdown>
                  </div>
                  
                  {/* Retrieved Documents */}
                  {message.documents && message.documents.length > 0 && (
                    <div className="mt-4 space-y-2 pt-3 border-t border-slate-600/50">
                      <p className="text-xs font-semibold text-violet-400 flex items-center gap-1">
                        <Sparkles className="h-3 w-3" />
                        Matching Products:
                      </p>
                      {message.documents.slice(0, 3).map((doc) => (
                        <div
                          key={doc.id}
                          className="bg-slate-900/80 p-3 rounded-xl text-xs border border-slate-700/50 hover:border-violet-500/50 transition-colors"
                        >
                          {doc.content.title && (
                            <p className="font-bold text-sm mb-1 text-white capitalize">
                              {doc.content.title}
                            </p>
                          )}
                          {doc.content.description && (
                            <p className="text-slate-300 line-clamp-2 mb-2">
                              {doc.content.description}
                            </p>
                          )}
                          <div className="flex flex-wrap gap-2 text-[10px]">
                            {doc.content.condition && (
                              <span className="bg-slate-700 text-slate-300 px-2 py-0.5 rounded-full uppercase tracking-wider">
                                {doc.content.condition}
                              </span>
                            )}
                            {doc.content.category && (
                              <span className="bg-slate-700 text-slate-300 px-2 py-0.5 rounded-full uppercase tracking-wider">
                                {doc.content.category}
                              </span>
                            )}
                            {doc.content.price && (
                              <span className="bg-green-900/50 text-green-400 px-2 py-0.5 rounded-full font-bold">
                                ₹{doc.content.price}
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
            
            {/* Loading indicator */}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-slate-800/80 rounded-2xl rounded-bl-md px-4 py-3 border border-slate-700/50">
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin text-violet-400" />
                    <span className="text-sm text-slate-400">Searching products...</span>
                  </div>
                </div>
              </div>
            )}
            <div ref={scrollRef} />
          </div>
        </ScrollArea>

        {/* Input */}
        <div className="p-4 border-t border-slate-700/50 bg-slate-900/50">
          <form onSubmit={handleSubmit} className="flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about products..."
              className="flex-1 bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 focus:ring-violet-500 focus:border-violet-500 rounded-xl"
            />
            <Button 
              type="submit" 
              size="icon" 
              disabled={isLoading || !input.trim()}
              className="bg-gradient-to-br from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 rounded-xl h-10 w-10"
            >
              <Send className="h-4 w-4" />
            </Button>
          </form>
          {sessionId && (
            <p className="text-[10px] text-slate-500 mt-2 text-center">
              Session active • Conversation history maintained
            </p>
          )}
        </div>
      </div>
    </>
  );
}
