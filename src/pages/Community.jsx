import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createPageUrl } from "@/utils";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
  Plus, Trophy, Users, Search, Filter, Calendar, MapPin, Zap, Upload, Image, X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import MatchCard from "@/components/community/MatchCard";
import MatchDetailModal from "@/components/community/MatchDetailModal";
import MatchLikeButtons from "@/components/community/MatchLikeButtons";
import JoinMatchModal from "@/components/community/JoinMatchModal";
import EditMatchModal from "@/components/community/EditMatchModal";
import QuickMatchesSection from "@/components/community/QuickMatchesSection";
import CreateQuickMatchDialog from "@/components/community/CreateQuickMatchDialog";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import EmptyState from "@/components/ui/EmptyState";
import { toast } from "sonner";

const SPORT_TYPES = [
  { value: "futbol", label: "Fútbol" },
  { value: "voley", label: "Vóley" },
  { value: "basquet", label: "Básquet" },
  { value: "futsal", label: "Futsal" },
  { value: "tenis", label: "Tenis" },
  { value: "otro", label: "Otro" },
];

export default function Community() {
  const [user, setUser] = useState(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [sportFilter, setSportFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [joiningMatchId, setJoiningMatchId] = useState(null);
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [showQuickMatchDialog, setShowQuickMatchDialog] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingMatch, setEditingMatch] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  
  const [newMatch, setNewMatch] = useState({
    title: "",
    description: "",
    sport_type: "futbol",
    date: "",
    time: "",
    max_players: 10,
    price_per_person: 0,
    bet_amount: 0,
    court_id: "",
    court_name: "",
    court_address: "",
    image_url: ""
  });

  const queryClient = useQueryClient();

  useEffect(() => {
    loadUser();
    getUserLocation();
  }, []);

  const getUserLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        () => {},
        { enableHighAccuracy: true, timeout: 10000 }
      );
    }
  };

  const loadUser = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);
    } catch (error) {
      setUser(null);
    }
  };

  const { data: matches = [], isLoading } = useQuery({
    queryKey: ['matches', sportFilter],
    queryFn: async () => {
      let query = {};
      if (sportFilter !== "all") {
        query.sport_type = sportFilter;
      }
      return base44.entities.Match.filter(query, '-created_date');
    },
  });

  const { data: courts = [] } = useQuery({
    queryKey: ['all-courts'],
    queryFn: () => base44.entities.Court.filter({ status: "approved", is_active: true }),
  });

  const createMatchMutation = useMutation({
    mutationFn: (data) => base44.entities.Match.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['matches']);
      setShowCreateDialog(false);
      setNewMatch({
        title: "",
        description: "",
        sport_type: "futbol",
        date: "",
        time: "",
        max_players: 10,
        price_per_person: 0,
        bet_amount: 0,
        court_id: "",
        court_name: "",
        court_address: "",
        image_url: ""
      });
      toast.success("¡Partido creado exitosamente!");
    },
    onError: () => {
      toast.error("Error al crear el partido");
    }
  });

  const joinMatchMutation = useMutation({
    mutationFn: async ({ matchId, match, paymentMethod, nickname }) => {
      const updatedPlayers = [...(match.players || []), {
        user_id: user.id,
        user_name: user.full_name,
        user_email: user.email,
        nickname: nickname || user.nickname || user.full_name,
        payment_method: paymentMethod || "efectivo",
        payment_status: match.price_per_person > 0 ? "pending" : "free",
        joined_at: new Date().toISOString()
      }];
      return base44.entities.Match.update(matchId, {
        players: updatedPlayers,
        current_players: updatedPlayers.length,
        status: updatedPlayers.length >= match.max_players ? "full" : "open"
      });
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries(['matches']);
      toast.success("¡Te has unido al partido!");
      setJoiningMatchId(null);
      setShowJoinModal(false);
      setSelectedMatch(null);
      
      // Redirect to location if available
      const match = variables.match;
      if (match.court_latitude && match.court_longitude) {
        window.open(
          `https://www.google.com/maps/dir/?api=1&destination=${match.court_latitude},${match.court_longitude}`,
          '_blank'
        );
      }
    },
    onError: () => {
      toast.error("Error al unirse al partido");
      setJoiningMatchId(null);
    }
  });

  const updateMatchMutation = useMutation({
    mutationFn: ({ matchId, data }) => base44.entities.Match.update(matchId, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['matches']);
      toast.success("Partido actualizado");
      setShowEditModal(false);
      setEditingMatch(null);
    },
    onError: () => toast.error("Error al actualizar")
  });

  const likeMatchMutation = useMutation({
    mutationFn: async (match) => {
      const likes = match.likes || [];
      const dislikes = match.dislikes || [];
      
      if (likes.includes(user.id)) {
        // Remove like
        return base44.entities.Match.update(match.id, {
          likes: likes.filter(id => id !== user.id)
        });
      } else {
        // Add like, remove dislike if exists
        return base44.entities.Match.update(match.id, {
          likes: [...likes, user.id],
          dislikes: dislikes.filter(id => id !== user.id)
        });
      }
    },
    onSuccess: () => queryClient.invalidateQueries(['matches'])
  });

  const dislikeMatchMutation = useMutation({
    mutationFn: async (match) => {
      const likes = match.likes || [];
      const dislikes = match.dislikes || [];
      
      if (dislikes.includes(user.id)) {
        // Remove dislike
        return base44.entities.Match.update(match.id, {
          dislikes: dislikes.filter(id => id !== user.id)
        });
      } else {
        // Add dislike, remove like if exists
        return base44.entities.Match.update(match.id, {
          dislikes: [...dislikes, user.id],
          likes: likes.filter(id => id !== user.id)
        });
      }
    },
    onSuccess: () => queryClient.invalidateQueries(['matches'])
  });

  const handleCreateMatch = () => {
    if (!user) {
      // Skip auth redirect on localhost for development
      if (window.location.hostname !== 'localhost') {
        base44.auth.redirectToLogin(window.location.href);
      }
      return;
    }

    if (!newMatch.title || !newMatch.date || !newMatch.time) {
      toast.error("Completa los campos requeridos");
      return;
    }

    const matchData = {
      ...newMatch,
      organizer_id: user.id,
      organizer_name: user.full_name,
      current_players: 1,
      players: [{
        user_id: user.id,
        user_name: user.full_name,
        user_email: user.email
      }],
      status: "open"
    };

    createMatchMutation.mutate(matchData);
  };

  const handleJoinMatch = (match, paymentMethod, nickname) => {
    if (!user) {
      // Skip auth redirect on localhost for development
      if (window.location.hostname !== 'localhost') {
        base44.auth.redirectToLogin(window.location.href);
      }
      return;
    }

    const isAlreadyJoined = match.players?.some(p => p.user_id === user.id);
    if (isAlreadyJoined) {
      toast.error("Ya estás en este partido");
      return;
    }

    setJoiningMatchId(match.id);
    joinMatchMutation.mutate({ matchId: match.id, match, paymentMethod, nickname });
  };

  const handleOpenJoinModal = (match) => {
    if (!user) {
      // Skip auth redirect on localhost for development
      if (window.location.hostname !== 'localhost') {
        base44.auth.redirectToLogin(window.location.href);
      }
      return;
    }
    setSelectedMatch(match);
    setShowJoinModal(true);
  };

  const handleEditMatch = (match) => {
    setEditingMatch(match);
    setShowEditModal(true);
  };

  const handleLike = (match) => {
    if (!user) {
      // Skip auth redirect on localhost for development
      if (window.location.hostname !== 'localhost') {
        base44.auth.redirectToLogin(window.location.href);
      }
      return;
    }
    likeMatchMutation.mutate(match);
  };

  const handleDislike = (match) => {
    if (!user) {
      // Skip auth redirect on localhost for development
      if (window.location.hostname !== 'localhost') {
        base44.auth.redirectToLogin(window.location.href);
      }
      return;
    }
    dislikeMatchMutation.mutate(match);
  };

  const handleCreateQuickMatch = (matchData) => {
    if (!user) {
      // Skip auth redirect on localhost for development
      if (window.location.hostname !== 'localhost') {
        base44.auth.redirectToLogin(window.location.href);
      }
      return;
    }

    const fullMatchData = {
      ...matchData,
      organizer_id: user.id,
      organizer_name: user.full_name,
      current_players: 1,
      players: [{
        user_id: user.id,
        user_name: user.full_name,
        user_email: user.email
      }],
      status: "open"
    };

    createMatchMutation.mutate(fullMatchData);
    setShowQuickMatchDialog(false);
  };

  const filteredMatches = matches.filter(match => {
    if (searchQuery && !match.title.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    return true;
  });

  const openMatches = filteredMatches.filter(m => m.status === "open");
  const myMatches = filteredMatches.filter(m => 
    m.organizer_id === user?.id || m.players?.some(p => p.user_id === user?.id)
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white pb-20">
      {/* Header */}
      <div className="bg-gradient-to-r from-teal-600 to-teal-700 text-white py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-3 mb-2">
            <Trophy className="h-8 w-8" />
            <h1 className="text-2xl md:text-3xl font-bold">Comunidad</h1>
          </div>
          <p className="text-teal-100">Únete a partidos o crea el tuyo propio</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Quick Matches Section */}
        <QuickMatchesSection
          matches={matches}
          courts={courts}
          userLocation={userLocation}
          user={user}
          onJoin={(match, paymentMethod) => handleJoinMatch(match, paymentMethod)}
          isJoining={joiningMatchId}
          onCreateQuickMatch={() => setShowQuickMatchDialog(true)}
        />

        {/* Actions & Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
            <Input
              placeholder="Buscar partidos..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-12"
            />
          </div>
          
          <Select value={sportFilter} onValueChange={setSportFilter}>
            <SelectTrigger className="w-full sm:w-48 h-12">
              <SelectValue placeholder="Deporte" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los deportes</SelectItem>
              {SPORT_TYPES.map(sport => (
                <SelectItem key={sport.value} value={sport.value}>{sport.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button className="h-12 bg-teal-600 hover:bg-teal-700 shadow-lg shadow-teal-500/20">
                <Plus className="h-5 w-5 mr-2" />
                Crear Partido
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Crear Nuevo Partido</DialogTitle>
                <DialogDescription>
                  Completa los datos para crear tu partido
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-4">
                <div>
                  <Label>Título del partido *</Label>
                  <Input
                    value={newMatch.title}
                    onChange={(e) => setNewMatch({...newMatch, title: e.target.value})}
                    placeholder="Ej: Pichanga de los sábados"
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label>Descripción</Label>
                  <Textarea
                    value={newMatch.description}
                    onChange={(e) => setNewMatch({...newMatch, description: e.target.value})}
                    placeholder="Describe tu partido..."
                    className="mt-1"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Deporte *</Label>
                    <Select 
                      value={newMatch.sport_type} 
                      onValueChange={(value) => setNewMatch({...newMatch, sport_type: value})}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {SPORT_TYPES.map(sport => (
                          <SelectItem key={sport.value} value={sport.value}>{sport.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Máx. jugadores *</Label>
                    <Input
                      type="number"
                      value={newMatch.max_players}
                      onChange={(e) => setNewMatch({...newMatch, max_players: parseInt(e.target.value)})}
                      min={2}
                      max={30}
                      className="mt-1"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Fecha *</Label>
                    <Input
                      type="date"
                      value={newMatch.date}
                      onChange={(e) => setNewMatch({...newMatch, date: e.target.value})}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label>Hora *</Label>
                    <Input
                      type="time"
                      value={newMatch.time}
                      onChange={(e) => setNewMatch({...newMatch, time: e.target.value})}
                      className="mt-1"
                    />
                  </div>
                </div>

                <div>
                  <Label>Cancha</Label>
                  <Select 
                    value={newMatch.court_id || "manual"} 
                    onValueChange={(value) => {
                      if (value === "manual") {
                        setNewMatch({...newMatch, court_id: "", court_name: "", court_address: ""});
                      } else {
                        const selectedCourt = courts.find(c => c.id === value);
                        if (selectedCourt) {
                          setNewMatch({
                            ...newMatch, 
                            court_id: selectedCourt.id,
                            court_name: selectedCourt.name, 
                            court_address: selectedCourt.address
                          });
                        }
                      }
                    }}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Selecciona una cancha" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="manual">Ingresar manualmente</SelectItem>
                      {courts.map(court => (
                        <SelectItem key={court.id} value={court.id}>
                          {court.name} - {court.address}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {!newMatch.court_id && (
                  <>
                    <div>
                      <Label>Nombre de la cancha</Label>
                      <Input
                        value={newMatch.court_name}
                        onChange={(e) => setNewMatch({...newMatch, court_name: e.target.value})}
                        placeholder="Nombre de la cancha"
                        className="mt-1"
                      />
                    </div>

                    <div>
                      <Label>Dirección</Label>
                      <Input
                        value={newMatch.court_address}
                        onChange={(e) => setNewMatch({...newMatch, court_address: e.target.value})}
                        placeholder="Dirección de la cancha"
                        className="mt-1"
                      />
                    </div>
                  </>
                )}

                {newMatch.court_id && (
                  <div className="p-3 bg-teal-50 rounded-lg text-sm text-teal-700">
                    <p className="font-medium">{newMatch.court_name}</p>
                    <p className="text-teal-600">{newMatch.court_address}</p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Precio por persona (S/)</Label>
                    <Input
                      type="number"
                      value={newMatch.price_per_person}
                      onChange={(e) => setNewMatch({...newMatch, price_per_person: parseFloat(e.target.value)})}
                      min={0}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label>Apuesta (S/)</Label>
                    <Input
                      type="number"
                      value={newMatch.bet_amount}
                      onChange={(e) => setNewMatch({...newMatch, bet_amount: parseFloat(e.target.value)})}
                      min={0}
                      className="mt-1"
                    />
                  </div>
                </div>

                {/* Image Upload */}
                <div>
                  <Label>Imagen del partido (opcional)</Label>
                  <div className="mt-1">
                    {newMatch.image_url ? (
                      <div className="relative">
                        <img 
                          src={newMatch.image_url} 
                          alt="Preview" 
                          className="w-full h-40 object-cover rounded-lg"
                        />
                        <Button
                          type="button"
                          size="sm"
                          variant="destructive"
                          className="absolute top-2 right-2"
                          onClick={() => setNewMatch({...newMatch, image_url: ""})}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-slate-300 rounded-lg cursor-pointer hover:border-teal-500 transition-colors">
                        <Upload className="h-8 w-8 text-slate-400 mb-2" />
                        <span className="text-sm text-slate-500">Subir imagen</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              try {
                                const { file_url } = await base44.integrations.Core.UploadFile({ file });
                                setNewMatch({...newMatch, image_url: file_url});
                              } catch (error) {
                                toast.error("Error al subir imagen");
                              }
                            }
                          }}
                        />
                      </label>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => setShowCreateDialog(false)}
                >
                  Cancelar
                </Button>
                <Button 
                  className="flex-1 bg-teal-600 hover:bg-teal-700"
                  onClick={handleCreateMatch}
                  disabled={createMatchMutation.isPending}
                >
                  {createMatchMutation.isPending ? "Creando..." : "Crear Partido"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="open" className="space-y-6">
          <TabsList className="bg-slate-100">
            <TabsTrigger value="open" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Abiertos ({openMatches.length})
            </TabsTrigger>
            {user && (
              <TabsTrigger value="my" className="flex items-center gap-2">
                <Trophy className="h-4 w-4" />
                Mis Partidos ({myMatches.length})
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="open">
            {isLoading ? (
              <LoadingSpinner className="py-20" text="Cargando partidos..." />
            ) : openMatches.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {openMatches.map((match) => (
                  <MatchCard 
                    key={match.id} 
                    match={match}
                    onJoin={() => handleOpenJoinModal(match)}
                    onViewDetails={() => setSelectedMatch(match)}
                    isJoining={joiningMatchId === match.id}
                    showLikes={true}
                  />
                ))}
              </div>
            ) : (
              <EmptyState
                icon={Trophy}
                title="No hay partidos abiertos"
                description="Sé el primero en crear un partido y junta a tus amigos"
                action={
                  <Button 
                    className="bg-teal-600 hover:bg-teal-700"
                    onClick={() => setShowCreateDialog(true)}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Crear Partido
                  </Button>
                }
              />
            )}
          </TabsContent>

          {user && (
            <TabsContent value="my">
              {myMatches.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {myMatches.map((match) => (
                    <MatchCard 
                      key={match.id} 
                      match={match}
                      onJoin={() => {}}
                      onViewDetails={() => setSelectedMatch(match)}
                      isJoining={false}
                    />
                  ))}
                </div>
              ) : (
                <EmptyState
                  icon={Users}
                  title="No tienes partidos"
                  description="Únete a un partido abierto o crea el tuyo"
                />
              )}
            </TabsContent>
          )}
        </Tabs>

        {/* Match Detail Modal */}
        <MatchDetailModal
          match={selectedMatch && !showJoinModal ? selectedMatch : null}
          open={!!selectedMatch && !showJoinModal}
          onClose={() => setSelectedMatch(null)}
          onJoin={() => {
            if (selectedMatch) handleOpenJoinModal(selectedMatch);
          }}
          onEdit={() => {
            if (selectedMatch && selectedMatch.organizer_id === user?.id) {
              handleEditMatch(selectedMatch);
            }
          }}
          onLike={() => selectedMatch && handleLike(selectedMatch)}
          onDislike={() => selectedMatch && handleDislike(selectedMatch)}
          isJoining={selectedMatch && joiningMatchId === selectedMatch.id}
          currentUserId={user?.id}
        />

        {/* Join Match Modal */}
        <JoinMatchModal
          match={selectedMatch}
          open={showJoinModal}
          onClose={() => {
            setShowJoinModal(false);
            setSelectedMatch(null);
          }}
          onJoin={(match, paymentMethod, nickname) => handleJoinMatch(match, paymentMethod, nickname)}
          isJoining={joiningMatchId === selectedMatch?.id}
          user={user}
        />

        {/* Edit Match Modal */}
        <EditMatchModal
          match={editingMatch}
          open={showEditModal}
          onClose={() => {
            setShowEditModal(false);
            setEditingMatch(null);
          }}
          onSave={(matchId, data) => updateMatchMutation.mutate({ matchId, data })}
          isSaving={updateMatchMutation.isPending}
          courts={courts}
        />

        {/* Create Quick Match Dialog */}
        <CreateQuickMatchDialog
          open={showQuickMatchDialog}
          onClose={() => setShowQuickMatchDialog(false)}
          courts={courts}
          onCreateMatch={handleCreateQuickMatch}
          isLoading={createMatchMutation.isPending}
        />
      </div>
    </div>
  );
}