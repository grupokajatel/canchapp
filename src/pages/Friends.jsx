import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Users, UserPlus, Search, Check, X, MessageCircle, UserMinus
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { createPageUrl } from "@/utils";
import { Link } from "react-router-dom";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import EmptyState from "@/components/ui/EmptyState";
import { toast } from "sonner";

export default function Friends() {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
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

  // Get friends list
  const { data: friends = [] } = useQuery({
    queryKey: ['friends-list', user?.id, user?.friends],
    queryFn: async () => {
      if (!user?.friends?.length) return [];
      const allUsers = await base44.entities.User.list();
      return allUsers.filter(u => user.friends.includes(u.id));
    },
    enabled: !!user?.id,
  });

  // Get friend requests
  const friendRequests = user?.friend_requests || [];

  // Search users
  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    
    const allUsers = await base44.entities.User.list();
    const results = allUsers.filter(u => 
      u.id !== user?.id &&
      (u.nickname?.toLowerCase().includes(searchQuery.toLowerCase()) ||
       u.full_name?.toLowerCase().includes(searchQuery.toLowerCase()))
    );
    setSearchResults(results.slice(0, 10));
    setIsSearching(false);
  };

  // Send friend request
  const sendRequestMutation = useMutation({
    mutationFn: async (targetUser) => {
      const currentRequests = targetUser.friend_requests || [];
      
      // Check if already sent
      if (currentRequests.some(r => r.from_user_id === user.id)) {
        throw new Error("Ya enviaste una solicitud");
      }

      await base44.entities.User.update(targetUser.id, {
        friend_requests: [
          ...currentRequests,
          {
            from_user_id: user.id,
            from_nickname: user.nickname || user.full_name,
            sent_at: new Date().toISOString()
          }
        ]
      });
    },
    onSuccess: () => {
      toast.success("Solicitud enviada");
      setSearchResults([]);
      setSearchQuery("");
    },
    onError: (error) => {
      toast.error(error.message || "Error al enviar solicitud");
    }
  });

  // Accept friend request
  const acceptRequestMutation = useMutation({
    mutationFn: async (request) => {
      // Add to my friends
      const myFriends = user.friends || [];
      await base44.auth.updateMe({
        friends: [...myFriends, request.from_user_id],
        friend_requests: (user.friend_requests || []).filter(
          r => r.from_user_id !== request.from_user_id
        )
      });

      // Add me to their friends
      const otherUser = await base44.entities.User.filter({ id: request.from_user_id });
      if (otherUser.length > 0) {
        const theirFriends = otherUser[0].friends || [];
        await base44.entities.User.update(otherUser[0].id, {
          friends: [...theirFriends, user.id]
        });
      }
    },
    onSuccess: () => {
      toast.success("Solicitud aceptada");
      loadUser();
      queryClient.invalidateQueries(['friends-list']);
    },
    onError: () => {
      toast.error("Error al aceptar solicitud");
    }
  });

  // Reject friend request
  const rejectRequestMutation = useMutation({
    mutationFn: async (request) => {
      await base44.auth.updateMe({
        friend_requests: (user.friend_requests || []).filter(
          r => r.from_user_id !== request.from_user_id
        )
      });
    },
    onSuccess: () => {
      toast.success("Solicitud rechazada");
      loadUser();
    }
  });

  // Remove friend
  const removeFriendMutation = useMutation({
    mutationFn: async (friendId) => {
      // Remove from my list
      await base44.auth.updateMe({
        friends: (user.friends || []).filter(id => id !== friendId)
      });

      // Remove me from their list
      const otherUser = await base44.entities.User.filter({ id: friendId });
      if (otherUser.length > 0) {
        await base44.entities.User.update(otherUser[0].id, {
          friends: (otherUser[0].friends || []).filter(id => id !== user.id)
        });
      }
    },
    onSuccess: () => {
      toast.success("Amigo eliminado");
      loadUser();
      queryClient.invalidateQueries(['friends-list']);
    }
  });

  if (isLoading) {
    return <LoadingSpinner className="min-h-screen" />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white pb-20">
      {/* Header */}
      <div className="bg-gradient-to-r from-teal-600 to-teal-700 text-white py-6 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Users className="h-6 w-6" />
            Amigos
          </h1>
          <p className="text-teal-100 mt-1">Gestiona tu lista de amigos</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Tabs defaultValue="friends" className="space-y-6">
          <TabsList className="bg-slate-100">
            <TabsTrigger value="friends">
              Amigos ({friends.length})
            </TabsTrigger>
            <TabsTrigger value="requests">
              Solicitudes
              {friendRequests.length > 0 && (
                <Badge className="ml-2 bg-teal-600">{friendRequests.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="search">
              <UserPlus className="h-4 w-4 mr-1" />
              Buscar
            </TabsTrigger>
          </TabsList>

          {/* Friends List */}
          <TabsContent value="friends">
            {friends.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {friends.map(friend => (
                  <Card key={friend.id}>
                    <CardContent className="p-4 flex items-center gap-4">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={friend.profile_photo} />
                        <AvatarFallback className="bg-teal-100 text-teal-700">
                          {(friend.nickname || friend.full_name)?.charAt(0)?.toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-slate-800 truncate">
                          {friend.full_name}
                        </p>
                        {friend.nickname && (
                          <p className="text-sm text-slate-500">@{friend.nickname}</p>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Link to={createPageUrl(`Messages?user=${friend.id}`)}>
                          <Button variant="outline" size="icon">
                            <MessageCircle className="h-4 w-4" />
                          </Button>
                        </Link>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="outline" size="icon" className="text-red-500">
                              <UserMinus className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>¿Eliminar amigo?</AlertDialogTitle>
                              <AlertDialogDescription>
                                ¿Estás seguro de eliminar a {friend.full_name} de tus amigos?
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => removeFriendMutation.mutate(friend.id)}
                                className="bg-red-600"
                              >
                                Eliminar
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <EmptyState
                icon={Users}
                title="Sin amigos aún"
                description="Busca personas para agregarlas como amigos"
              />
            )}
          </TabsContent>

          {/* Friend Requests */}
          <TabsContent value="requests">
            {friendRequests.length > 0 ? (
              <div className="space-y-4">
                {friendRequests.map((request, idx) => (
                  <Card key={idx}>
                    <CardContent className="p-4 flex items-center gap-4">
                      <Avatar>
                        <AvatarFallback className="bg-teal-100 text-teal-700">
                          {request.from_nickname?.charAt(0)?.toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="font-semibold">{request.from_nickname}</p>
                        <p className="text-sm text-slate-500">
                          Quiere ser tu amigo
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          className="bg-teal-600"
                          onClick={() => acceptRequestMutation.mutate(request)}
                          disabled={acceptRequestMutation.isPending}
                        >
                          <Check className="h-4 w-4 mr-1" />
                          Aceptar
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => rejectRequestMutation.mutate(request)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <EmptyState
                icon={UserPlus}
                title="Sin solicitudes"
                description="No tienes solicitudes de amistad pendientes"
              />
            )}
          </TabsContent>

          {/* Search Users */}
          <TabsContent value="search">
            <Card>
              <CardHeader>
                <CardTitle>Buscar usuarios</CardTitle>
                <CardDescription>Busca por nickname o nombre</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    placeholder="Buscar..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  />
                  <Button onClick={handleSearch} disabled={isSearching}>
                    <Search className="h-4 w-4 mr-2" />
                    Buscar
                  </Button>
                </div>

                {searchResults.length > 0 && (
                  <div className="space-y-2 pt-4 border-t">
                    {searchResults.map(result => {
                      const isFriend = user?.friends?.includes(result.id);
                      const hasPendingRequest = result.friend_requests?.some(
                        r => r.from_user_id === user?.id
                      );
                      
                      return (
                        <div
                          key={result.id}
                          className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg"
                        >
                          <Avatar>
                            <AvatarImage src={result.profile_photo} />
                            <AvatarFallback className="bg-teal-100 text-teal-700">
                              {(result.nickname || result.full_name)?.charAt(0)?.toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <p className="font-medium">{result.full_name}</p>
                            {result.nickname && (
                              <p className="text-sm text-slate-500">@{result.nickname}</p>
                            )}
                          </div>
                          {isFriend ? (
                            <Badge variant="secondary">Amigo</Badge>
                          ) : hasPendingRequest ? (
                            <Badge variant="outline">Solicitud enviada</Badge>
                          ) : (
                            <Button
                              size="sm"
                              onClick={() => sendRequestMutation.mutate(result)}
                              disabled={sendRequestMutation.isPending}
                            >
                              <UserPlus className="h-4 w-4 mr-1" />
                              Agregar
                            </Button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}