"use client";

import { useState, useRef, useEffect } from "react";
import { MessageCircle, X, Send, Loader2 } from "lucide-react";
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
    title: string;
    description: string;
    condition: string;
    category: string;
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
      id: "1",
      role: "assistant",
      content: "Hi! I'm your S-OLX assistant. How can I help you find products today?",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);

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
      const response = await axios.post("http://localhost:8000/api/v1/ai", {
        query: userMessage.content,
      });

      const responseData = response.data.data;
      
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: responseData.response,
        documents: responseData.retrievedDocuments,
      };

      setMessages((prev) => [...prev, botMessage]);
    } catch (error) {
      console.error("Chat error:", error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "Sorry, I encountered an error. Please try again later.",
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Floating Button */}
      <Button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg transition-all duration-300 z-50",
          isOpen ? "rotate-90 opacity-0 pointer-events-none" : "opacity-100"
        )}
        size="icon"
      >
        <MessageCircle className="h-8 w-8" />
      </Button>

      {/* Chat Window */}
      <div
        className={cn(
          "fixed bottom-6 right-6 w-[350px] sm:w-[400px] bg-background border rounded-lg shadow-2xl transition-all duration-300 z-50 flex flex-col overflow-hidden",
          isOpen
            ? "translate-y-0 opacity-100 scale-100"
            : "translate-y-10 opacity-0 scale-95 pointer-events-none"
        )}
        style={{ height: "500px", maxHeight: "80vh" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b bg-primary text-primary-foreground">
          <div className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            <h3 className="font-semibold">S-OLX Assistant</h3>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 hover:bg-primary-foreground/20 text-primary-foreground"
            onClick={() => setIsOpen(false)}
          >
            <X className="h-5 w-5" />
          </Button>
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
                    "max-w-[80%] rounded-lg px-4 py-2 text-sm",
                    message.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted"
                  )}
                >
                  <div className="prose prose-sm max-w-none dark:prose-invert [&>p]:mb-2 last:[&>p]:mb-0 [&>ul]:list-disc [&>ul]:pl-4 [&>ol]:list-decimal [&>ol]:pl-4">
                    <ReactMarkdown>
                      {message.content}
                    </ReactMarkdown>
                  </div>
                  {message.documents && message.documents.length > 0 && (
                    <div className="mt-4 space-y-2">
                      <p className="text-xs font-semibold opacity-70">Relevant Products:</p>
                      {message.documents.map((doc) => (
                        <div
                          key={doc.id}
                          className="bg-background/80 p-3 rounded-md text-xs border border-border/50 shadow-sm"
                        >
                          <p className="font-bold text-sm mb-1 capitalize">
                            {doc.content.title}
                          </p>
                          <p className="opacity-90 line-clamp-2 mb-2">
                            {doc.content.description}
                          </p>
                          <div className="flex flex-wrap gap-2 text-[10px] opacity-70 uppercase tracking-wider">
                            <span className="bg-primary/10 px-1.5 py-0.5 rounded">
                              {doc.content.condition}
                            </span>
                            <span className="bg-primary/10 px-1.5 py-0.5 rounded">
                              {doc.content.category}
                            </span>
                            {doc.content.price && (
                              <span className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100 px-1.5 py-0.5 rounded font-bold">
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
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-muted rounded-lg px-4 py-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                </div>
              </div>
            )}
            <div ref={scrollRef} />
          </div>
        </ScrollArea>

        {/* Input */}
        <div className="p-4 border-t bg-background">
          <form onSubmit={handleSubmit} className="flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about products..."
              className="flex-1"
            />
            <Button type="submit" size="icon" disabled={isLoading || !input.trim()}>
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
      </div>
    </>
  );
}
