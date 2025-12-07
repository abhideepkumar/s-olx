"use client";

import { useState, useRef, useEffect } from "react";
import { MessageCircle, X, Send, Loader2, Sparkles, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import axios from "axios";
import ReactMarkdown from "react-markdown";
import Image from "next/image";

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

// Simple Product Card
function ProductCard({ doc }: { doc: RetrievedDocument }) {
  const [imgError, setImgError] = useState(false);
  const imgUrl = doc.content.images?.[0];

  return (
    <div className="flex-shrink-0 w-44 bg-slate-800 rounded-xl overflow-hidden border border-slate-700 hover:border-violet-500 transition-colors">
      {/* Image */}
      <div className="relative h-24 bg-slate-700">
        {imgUrl && !imgError ? (
          <Image
            src={imgUrl}
            alt={doc.content.title || "Product"}
            fill
            className="object-cover"
            onError={() => setImgError(true)}
            sizes="176px"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Sparkles className="h-6 w-6 text-slate-500" />
          </div>
        )}
        {doc.content.condition && (
          <span className="absolute top-1 left-1 bg-slate-900/80 text-[10px] px-1.5 py-0.5 rounded text-white uppercase">
            {doc.content.condition}
          </span>
        )}
      </div>

      {/* Info */}
      <div className="p-2">
        <h4 className="text-xs font-medium text-white line-clamp-2 capitalize mb-1">
          {doc.content.title || "Untitled"}
        </h4>
        {doc.content.price && (
          <span className="text-sm font-bold text-green-400">
            ₹{doc.content.price.toLocaleString()}
          </span>
        )}
      </div>
    </div>
  );
}

// Horizontal Product List
function ProductList({ documents }: { documents: RetrievedDocument[] }) {
  if (!documents?.length) return null;

  return (
    <div className="mt-3 pt-3 border-t border-slate-600/50">
      <p className="text-xs text-violet-400 mb-2 flex items-center gap-1">
        <Sparkles className="h-3 w-3" />
        Found {documents.length} matching products
      </p>
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {documents.slice(0, 5).map((doc, i) => (
          <ProductCard key={doc.id || i} doc={doc} />
        ))}
      </div>
    </div>
  );
}

export default function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content: "👋 Hi! I'm your **S-OLX Assistant**. Ask me to find products like:\n- \"Chairs under ₹4000\"\n- \"Available laptops\"\n- \"Engineering books\"",
    },
  ]);
  const [input, setInput] = useState("");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMsg: Message = { id: Date.now().toString(), role: "user", content: input };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);

    try {
      const res = await axios.post("http://localhost:8000/api/v1/ai/chat", {
        message: input,
        sessionId: sessionId || undefined,
      });
      const data = res.data.data;
      if (data.sessionId) setSessionId(data.sessionId);

      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: data.answer?.response || data.answer || "Couldn't process that.",
          documents: data.answer?.retrievedDocuments,
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { id: (Date.now() + 1).toString(), role: "assistant", content: "😔 Error. Please try again." },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const reset = async () => {
    if (sessionId) {
      try { await axios.delete(`http://localhost:8000/api/v1/ai/session/${sessionId}`); } catch {}
    }
    setSessionId(null);
    setMessages([{ id: "welcome", role: "assistant", content: "👋 Hi! Ask me to find products." }]);
  };

  return (
    <>
      {/* FAB */}
      <Button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-xl z-50",
          "bg-gradient-to-br from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500",
          isOpen && "opacity-0 pointer-events-none"
        )}
        size="icon"
      >
        <MessageCircle className="h-7 w-7 text-white" />
      </Button>

      {/* Chat Window */}
      <div
        className={cn(
          "fixed bottom-6 right-6 w-96 h-[550px] max-h-[85vh] rounded-2xl shadow-2xl z-50 flex flex-col",
          "bg-slate-900 border border-slate-700",
          isOpen ? "opacity-100 scale-100" : "opacity-0 scale-95 pointer-events-none",
          "transition-all duration-200"
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-3 border-b border-slate-700 bg-slate-800/50">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-violet-600 flex items-center justify-center">
              <Sparkles className="h-4 w-4 text-white" />
            </div>
            <span className="font-medium text-white text-sm">S-OLX Assistant</span>
          </div>
          <div className="flex gap-1">
            <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-400 hover:text-white" onClick={reset}>
              <RotateCcw className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-400 hover:text-white" onClick={() => setIsOpen(false)}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Messages */}
        <ScrollArea className="flex-1 p-3">
          <div className="space-y-3">
            {messages.map((msg) => (
              <div key={msg.id} className={cn("flex", msg.role === "user" ? "justify-end" : "justify-start")}>
                <div
                  className={cn(
                    "max-w-[90%] rounded-xl px-3 py-2 text-sm",
                    msg.role === "user"
                      ? "bg-violet-600 text-white"
                      : "bg-slate-800 text-slate-100 border border-slate-700"
                  )}
                >
                  <div className="prose prose-sm prose-invert max-w-none">
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                  </div>
                  {msg.documents && <ProductList documents={msg.documents} />}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-slate-800 rounded-xl px-3 py-2 border border-slate-700">
                  <Loader2 className="h-4 w-4 animate-spin text-violet-400" />
                </div>
              </div>
            )}
            <div ref={scrollRef} />
          </div>
        </ScrollArea>

        {/* Input */}
        <form onSubmit={handleSubmit} className="p-3 border-t border-slate-700 flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about products..."
            className="flex-1 bg-slate-800 border-slate-600 text-white text-sm"
          />
          <Button type="submit" size="icon" disabled={isLoading || !input.trim()} className="bg-violet-600 hover:bg-violet-500">
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </>
  );
}
