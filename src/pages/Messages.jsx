import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
  MessageCircle, Send, Search, ArrowLeft, User, UserPlus, Check
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import EmptyState from "@/components/ui/EmptyState";
import { toast } from "sonner";

export default function Messages() {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [newMessage, setNewMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const messagesEndRef = useRef(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);
    } catch (error) {
      base44.auth.redirectToLogin(window.location.href);
    } finally {
      setIsLoading(false);
    }
  };

  // Get all messages where user is sender or receiver
  const { data: messages = [] } = useQuery({
    queryKey: ['direct-messages', user?.id],
    queryFn: async () => {
      const sent = await base44.entities.DirectMessage.filter({ sender_id: user.id });
      const received = await base44.entities.DirectMessage.filter({ receiver_id: user.id });
      return [...sent, ...received].sort((a, b) => 
        new Date(a.created_date) - new Date(b.created_date)
      );
    },
    enabled: !!user?.id,
    refetchInterval: 5000,
  });

  // Get friends list
  const { data: friends = [] } = useQuery({
    queryKey: ['friends', user?.id, user?.friends],
    queryFn: async () => {
      if (!user?.friends?.length) return [];
      const allUsers = await base44.entities.User.list();
      return allUsers.filter(u => user.friends.includes(u.id));
    },
    enabled: !!user?.id && user?.friends?.length > 0,
  });

  // Group messages by conversation
  const conversations = React.useMemo(() => {
    const convMap = new Map();
    
    messages.forEach(msg => {
      const otherId = msg.sender_id === user?.id ? msg.receiver_id : msg.sender_id;
      const otherNickname = msg.sender_id === user?.id ? msg.receiver_nickname : msg.sender_nickname;
      
      if (!convMap.has(otherId)) {
        convMap.set(otherId, {
          id: otherId,
          nickname: otherNickname || "Usuario",
          messages: [],
          unread: 0,
          lastMessage: null
        });
      }
      
      convMap.get(otherId).messages.push(msg);
      
      if (!msg.is_read && msg.receiver_id === user?.id) {
        convMap.get(otherId).unread++;
      }
    });

    // Set last message for each conversation
    convMap.forEach((conv) => {
      if (conv.messages.length > 0) {
        conv.lastMessage = conv.messages[conv.messages.length - 1];
      }
    });

    return Array.from(convMap.values()).sort((a, b) => {
      if (!a.lastMessage) return 1;
      if (!b.lastMessage) return -1;
      return new Date(b.lastMessage.created_date) - new Date(a.lastMessage.created_date);
    });
  }, [messages, user?.id]);

  const sendMessageMutation = useMutation({
    mutationFn: (data) => base44.entities.DirectMessage.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['direct-messages']);
      setNewMessage("");
    },
    onError: () => toast.error("Error al enviar mensaje")
  });

  const markAsReadMutation = useMutation({
    mutationFn: async (conversationMessages) => {
      const unread = conversationMessages.filter(
        m => m.receiver_id === user?.id && !m.is_read
      );
      await Promise.all(
        unread.map(m => base44.entities.DirectMessage.update(m.id, { is_read: true }))
      );
    },
    onSuccess: () => queryClient.invalidateQueries(['direct-messages'])
  });

  useEffect(() => {
    if (selectedConversation) {
      const conv = conversations.find(c => c.id === selectedConversation);
      if (conv?.messages?.length > 0) {
        markAsReadMutation.mutate(conv.messages);
      }
    }
  }, [selectedConversation]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, selectedConversation]);

  const handleSendMessage = () => {
    if (!newMessage.trim() || !selectedConversation) return;

    const conv = conversations.find(c => c.id === selectedConversation);
    const convId = [user.id, selectedConversation].sort().join('_');

    sendMessageMutation.mutate({
      conversation_id: convId,
      sender_id: user.id,
      sender_nickname: user.nickname || user.full_name,
      receiver_id: selectedConversation,
      receiver_nickname: conv?.nickname || "Usuario",
      content: newMessage.trim()
    });
  };

  if (isLoading) {
    return <LoadingSpinner className="min-h-screen" />;
  }

  const selectedConv = conversations.find(c => c.id === selectedConversation);
  const filteredConversations = conversations.filter(c =>
    c.nickname?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white pb-20">
      {/* Header */}
      <div className="bg-gradient-to-r from-teal-600 to-teal-700 text-white py-6 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <MessageCircle className="h-6 w-6" />
            Mensajes
          </h1>
          <p className="text-teal-100 mt-1">Chatea con otros jugadores</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden h-[600px] flex">
          {/* Conversations List */}
          <div className={`w-full md:w-80 border-r border-slate-100 flex flex-col ${selectedConversation ? 'hidden md:flex' : 'flex'}`}>
            <div className="p-4 border-b border-slate-100">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Buscar conversaciones..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            <ScrollArea className="flex-1">
              {filteredConversations.length > 0 ? (
                filteredConversations.map(conv => (
                  <button
                    key={conv.id}
                    onClick={() => setSelectedConversation(conv.id)}
                    className={`w-full p-4 flex items-center gap-3 hover:bg-slate-50 transition-colors border-b border-slate-50 ${
                      selectedConversation === conv.id ? 'bg-teal-50' : ''
                    }`}
                  >
                    <Avatar>
                      <AvatarFallback className="bg-teal-100 text-teal-700">
                        {conv.nickname?.charAt(0)?.toUpperCase() || "U"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 text-left min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="font-medium text-slate-800 truncate">{conv.nickname}</p>
                        {conv.unread > 0 && (
                          <Badge className="bg-teal-600 text-white">{conv.unread}</Badge>
                        )}
                      </div>
                      {conv.lastMessage && (
                        <p className="text-sm text-slate-500 truncate">
                          {conv.lastMessage.content}
                        </p>
                      )}
                    </div>
                  </button>
                ))
              ) : (
                <div className="p-8 text-center text-slate-500">
                  <MessageCircle className="h-12 w-12 mx-auto text-slate-300 mb-3" />
                  <p>No hay conversaciones</p>
                  <p className="text-sm mt-1">Agrega amigos para chatear</p>
                </div>
              )}
            </ScrollArea>
          </div>

          {/* Messages Area */}
          <div className={`flex-1 flex flex-col ${selectedConversation ? 'flex' : 'hidden md:flex'}`}>
            {selectedConv ? (
              <>
                {/* Chat Header */}
                <div className="p-4 border-b border-slate-100 flex items-center gap-3">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="md:hidden"
                    onClick={() => setSelectedConversation(null)}
                  >
                    <ArrowLeft className="h-5 w-5" />
                  </Button>
                  <Avatar>
                    <AvatarFallback className="bg-teal-100 text-teal-700">
                      {selectedConv.nickname?.charAt(0)?.toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold text-slate-800">{selectedConv.nickname}</p>
                  </div>
                </div>

                {/* Messages */}
                <ScrollArea className="flex-1 p-4">
                  <div className="space-y-4">
                    {selectedConv.messages.map((msg) => {
                      const isOwn = msg.sender_id === user?.id;
                      return (
                        <div
                          key={msg.id}
                          className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                        >
                          <div
                            className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                              isOwn
                                ? 'bg-teal-600 text-white rounded-br-md'
                                : 'bg-slate-100 text-slate-800 rounded-bl-md'
                            }`}
                          >
                            <p>{msg.content}</p>
                            <p className={`text-xs mt-1 ${isOwn ? 'text-teal-100' : 'text-slate-400'}`}>
                              {format(new Date(msg.created_date), "HH:mm", { locale: es })}
                              {isOwn && msg.is_read && <Check className="h-3 w-3 inline ml-1" />}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                    <div ref={messagesEndRef} />
                  </div>
                </ScrollArea>

                {/* Input */}
                <div className="p-4 border-t border-slate-100">
                  <div className="flex gap-2">
                    <Input
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="Escribe un mensaje..."
                      onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                    />
                    <Button
                      onClick={handleSendMessage}
                      disabled={!newMessage.trim() || sendMessageMutation.isPending}
                      className="bg-teal-600 hover:bg-teal-700"
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <EmptyState
                  icon={MessageCircle}
                  title="Selecciona una conversación"
                  description="Elige un chat para ver los mensajes"
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}