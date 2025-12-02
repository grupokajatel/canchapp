import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { MessageCircle, Send, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

export default function ChatWidget({ courtId, courtName, ownerId, ownerName, currentUser }) {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState("");
  const scrollRef = useRef(null);
  const queryClient = useQueryClient();

  // Generate unique conversation ID
  const conversationId = `${courtId}_${currentUser?.id}`;

  const { data: messages = [], isLoading } = useQuery({
    queryKey: ['chat-messages', conversationId],
    queryFn: async () => {
      const allMessages = await base44.entities.ChatMessage.filter({ 
        conversation_id: conversationId 
      }, 'created_date', 100);
      return allMessages;
    },
    enabled: isOpen && !!currentUser?.id,
    refetchInterval: isOpen ? 5000 : false, // Poll every 5s when open
  });

  const sendMessageMutation = useMutation({
    mutationFn: (content) => base44.entities.ChatMessage.create({
      conversation_id: conversationId,
      court_id: courtId,
      sender_id: currentUser.id,
      sender_name: currentUser.full_name,
      sender_email: currentUser.email,
      receiver_id: ownerId,
      receiver_name: ownerName,
      content,
      is_read: false
    }),
    onSuccess: () => {
      queryClient.invalidateQueries(['chat-messages', conversationId]);
      setMessage("");
    }
  });

  // Scroll to bottom when messages change
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = () => {
    if (!message.trim() || !currentUser) return;
    sendMessageMutation.mutate(message.trim());
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!currentUser) return null;

  return (
    <>
      {/* Chat Button */}
      <Button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-24 right-4 md:bottom-8 z-40 h-14 w-14 rounded-full bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-700 hover:to-teal-800 shadow-xl shadow-teal-500/30"
      >
        <MessageCircle className="h-6 w-6" />
      </Button>

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-24 right-4 md:bottom-8 md:right-8 z-50 w-[calc(100vw-2rem)] md:w-96 h-[500px] bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden">
          {/* Header */}
          <div className="p-4 bg-gradient-to-r from-teal-600 to-teal-700 text-white flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10 border-2 border-white/30">
                <AvatarFallback className="bg-teal-800 text-white">
                  {(ownerName || "D").charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-semibold">{ownerName || "Dueño"}</p>
                <p className="text-xs text-teal-100">{courtName}</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/20"
              onClick={() => setIsOpen(false)}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Messages */}
          <ScrollArea className="flex-1 p-4" ref={scrollRef}>
            {isLoading ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="h-6 w-6 animate-spin text-teal-600" />
              </div>
            ) : messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <MessageCircle className="h-12 w-12 text-slate-300 mb-3" />
                <p className="text-slate-500 text-sm">
                  Inicia una conversación con el dueño de la cancha
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {messages.map((msg) => {
                  const isOwn = msg.sender_id === currentUser.id;
                  return (
                    <div
                      key={msg.id}
                      className={cn("flex", isOwn ? "justify-end" : "justify-start")}
                    >
                      <div
                        className={cn(
                          "max-w-[80%] rounded-2xl px-4 py-2.5",
                          isOwn
                            ? "bg-teal-600 text-white rounded-br-md"
                            : "bg-slate-100 text-slate-800 rounded-bl-md"
                        )}
                      >
                        <p className="text-sm">{msg.content}</p>
                        <p
                          className={cn(
                            "text-[10px] mt-1",
                            isOwn ? "text-teal-200" : "text-slate-400"
                          )}
                        >
                          {format(new Date(msg.created_date), "HH:mm", { locale: es })}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </ScrollArea>

          {/* Input */}
          <div className="p-4 border-t border-slate-100">
            <div className="flex gap-2">
              <Input
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Escribe un mensaje..."
                className="flex-1"
                disabled={sendMessageMutation.isPending}
              />
              <Button
                onClick={handleSend}
                disabled={!message.trim() || sendMessageMutation.isPending}
                className="bg-teal-600 hover:bg-teal-700"
              >
                {sendMessageMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}