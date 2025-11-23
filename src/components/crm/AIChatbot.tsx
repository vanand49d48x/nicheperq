import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card } from "@/components/ui/card";
import { Sparkles, Send, X, Minimize2, Maximize2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ChatMessage } from "./ChatMessage";
import { ChatContactCard } from "./ChatContactCard";

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  contacts?: ContactRecommendation[];
  stats?: Record<string, any>;
  timestamp: Date;
}

interface ContactRecommendation {
  id: string;
  business_name: string;
  priority: 'low' | 'medium' | 'high';
  suggested_action: string;
  reasoning: string;
  contact_status?: string;
  rating?: number;
  phone?: string;
  website?: string;
  city?: string;
  state?: string;
  niche?: string;
}

const QUICK_ACTIONS = [
  "Who should I follow up with today?",
  "Show me my highest priority leads",
  "Which contacts are most engaged?",
  "Suggest 3 actions for this week",
  "Find contacts I haven't contacted in 30 days"
];

export const AIChatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      loadChatHistory();
    }
  }, [isOpen]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const loadChatHistory = async () => {
    try {
      const { data, error } = await supabase
        .from('ai_chat_messages')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;

      if (data && data.length > 0) {
        const history: Message[] = [];
        
        data.reverse().forEach(msg => {
          history.push({
            id: msg.id,
            role: 'user' as const,
            content: msg.message,
            timestamp: new Date(msg.created_at),
          });
          
          const context = msg.context as any;
          history.push({
            id: `${msg.id}-response`,
            role: 'assistant' as const,
            content: msg.response,
            contacts: context?.contacts || [],
            stats: context?.stats,
            timestamp: new Date(msg.created_at),
          });
        });

        setMessages(history.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime()));
      }
    } catch (error) {
      console.error('Error loading chat history:', error);
    }
  };

  const sendMessage = async (messageText: string) => {
    if (!messageText.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: messageText,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('ai-crm-assistant', {
        body: { question: messageText }
      });

      if (error) throw error;

      const assistantMessage: Message = {
        id: `${Date.now()}-assistant`,
        role: 'assistant',
        content: data.answer,
        contacts: data.contacts || [],
        stats: data.summary_stats,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error: any) {
      console.error('Error sending message:', error);
      toast.error(error.message || "Failed to get AI response");
      
      const errorMessage: Message = {
        id: `${Date.now()}-error`,
        role: 'assistant',
        content: "I'm sorry, I encountered an error processing your question. Please try again.",
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickAction = (action: string) => {
    sendMessage(action);
  };

  if (!isOpen) {
    return (
      <Button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg z-50"
        size="icon"
      >
        <Sparkles className="h-6 w-6" />
      </Button>
    );
  }

  return (
    <Card className={`fixed ${isMinimized ? 'bottom-6 right-6 w-80 h-16' : 'bottom-6 right-6 w-96 h-[600px]'} shadow-2xl z-50 flex flex-col transition-all duration-300`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          <h3 className="font-semibold">AI Assistant</h3>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsMinimized(!isMinimized)}
          >
            {isMinimized ? <Maximize2 className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsOpen(false)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {!isMinimized && (
        <>
          {/* Messages */}
          <ScrollArea className="flex-1 p-4" ref={scrollRef}>
            {messages.length === 0 ? (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  👋 Hi! I'm your AI CRM assistant. Ask me anything about your contacts and pipeline!
                </p>
                <div className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground">Quick Actions:</p>
                  {QUICK_ACTIONS.map((action, idx) => (
                    <Button
                      key={idx}
                      variant="outline"
                      size="sm"
                      className="w-full justify-start text-left text-xs h-auto py-2"
                      onClick={() => handleQuickAction(action)}
                    >
                      {action}
                    </Button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {messages.map((message) => (
                  <div key={message.id}>
                    <ChatMessage message={message} />
                    {message.contacts && message.contacts.length > 0 && (
                      <div className="space-y-2 mt-2">
                        {message.contacts.map((contact) => (
                          <ChatContactCard key={contact.id} contact={contact} />
                        ))}
                      </div>
                    )}
                  </div>
                ))}
                {isLoading && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <div className="animate-pulse">Thinking...</div>
                  </div>
                )}
              </div>
            )}
          </ScrollArea>

          {/* Input */}
          <div className="p-4 border-t">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                sendMessage(input);
              }}
              className="flex gap-2"
            >
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask me anything..."
                disabled={isLoading}
              />
              <Button type="submit" size="icon" disabled={isLoading || !input.trim()}>
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </div>
        </>
      )}
    </Card>
  );
};
