import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
  Trophy, Calendar, Users, MapPin, DollarSign, Crown, Shield,
  Plus, Settings, Play, MessageCircle, ChevronLeft, Medal,
  Check, X, Clock, Edit, Trash2, Send, Pin, FileText
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import EmptyState from "@/components/ui/EmptyState";
import TournamentBracket from "@/components/tournaments/TournamentBracket";
import TournamentStandings from "@/components/tournaments/TournamentStandings";
import TeamRegistrationDialog from "@/components/tournaments/TeamRegistrationDialog";
import MatchScoreDialog from "@/components/tournaments/MatchScoreDialog";
import { toast } from "sonner";

const SPORT_LABELS = {
  futbol: "Fútbol", voley: "Vóley", basquet: "Básquet",
  futsal: "Futsal", tenis: "Tenis", otro: "Otro"
};

const TYPE_LABELS = {
  knockout: "Eliminación Directa",
  league: "Liga",
  groups_knockout: "Grupos + Eliminación"
};

const STATUS_CONFIG = {
  draft: { label: "Borrador", color: "bg-slate-100 text-slate-700" },
  registration: { label: "Inscripciones", color: "bg-green-100 text-green-700" },
  in_progress: { label: "En Curso", color: "bg-amber-100 text-amber-700" },
  completed: { label: "Finalizado", color: "bg-blue-100 text-blue-700" },
  cancelled: { label: "Cancelado", color: "bg-red-100 text-red-700" }
};

export default function TournamentDetail() {
  const [user, setUser] = useState(null);
  const [showRegisterDialog, setShowRegisterDialog] = useState(false);
  const [showScoreDialog, setShowScoreDialog] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [newMessage, setNewMessage] = useState("");
  const queryClient = useQueryClient();

  const urlParams = new URLSearchParams(window.location.search);
  const tournamentId = urlParams.get("id");

  useEffect(() => {
    const loadUser = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
      } catch (error) {
        setUser(null);
      }
    };
    loadUser();
  }, []);

  const { data: tournament, isLoading } = useQuery({
    queryKey: ['tournament', tournamentId],
    queryFn: () => base44.entities.Tournament.filter({ id: tournamentId }),
    select: (data) => data[0],
    enabled: !!tournamentId,
  });

  const { data: teams = [] } = useQuery({
    queryKey: ['tournament-teams', tournamentId],
    queryFn: () => base44.entities.TournamentTeam.filter({ tournament_id: tournamentId }),
    enabled: !!tournamentId,
  });

  const { data: matches = [] } = useQuery({
    queryKey: ['tournament-matches', tournamentId],
    queryFn: () => base44.entities.TournamentMatch.filter({ tournament_id: tournamentId }),
    enabled: !!tournamentId,
  });

  const { data: messages = [] } = useQuery({
    queryKey: ['tournament-messages', tournamentId],
    queryFn: () => base44.entities.TournamentMessage.filter({ tournament_id: tournamentId }, '-created_date', 100),
    enabled: !!tournamentId,
    refetchInterval: 10000,
  });

  const isOrganizer = tournament?.organizer_id === user?.id;
  const myTeam = teams.find(t => t.captain_id === user?.id);
  const approvedTeams = teams.filter(t => t.status === "approved");
  const pendingTeams = teams.filter(t => t.status === "pending");
  const statusConfig = STATUS_CONFIG[tournament?.status] || STATUS_CONFIG.draft;

  // Mutations
  const updateTournamentMutation = useMutation({
    mutationFn: (data) => base44.entities.Tournament.update(tournamentId, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['tournament', tournamentId]);
      toast.success("Torneo actualizado");
    }
  });

  const registerTeamMutation = useMutation({
    mutationFn: (data) => base44.entities.TournamentTeam.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['tournament-teams']);
      setShowRegisterDialog(false);
      toast.success("Equipo registrado");
    }
  });

  const updateTeamMutation = useMutation({
    mutationFn: ({ teamId, data }) => base44.entities.TournamentTeam.update(teamId, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['tournament-teams']);
      toast.success("Equipo actualizado");
    }
  });

  const updateMatchMutation = useMutation({
    mutationFn: ({ matchId, data }) => base44.entities.TournamentMatch.update(matchId, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['tournament-matches']);
      setShowScoreDialog(false);
      toast.success("Resultado guardado");
    }
  });

  const sendMessageMutation = useMutation({
    mutationFn: (data) => base44.entities.TournamentMessage.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['tournament-messages']);
      setNewMessage("");
    }
  });

  const generateBracketMutation = useMutation({
    mutationFn: async () => {
      // Generate matches based on tournament type and approved teams
      const teamsToUse = approvedTeams;
      const newMatches = [];

      if (tournament.tournament_type === "knockout") {
        // Simple single elimination bracket
        const rounds = Math.ceil(Math.log2(teamsToUse.length));
        let matchNumber = 1;
        
        // First round matches
        for (let i = 0; i < teamsToUse.length; i += 2) {
          newMatches.push({
            tournament_id: tournamentId,
            phase: rounds === 1 ? "final" : rounds === 2 ? "semifinal" : "round_" + rounds,
            match_number: matchNumber++,
            round: 1,
            home_team_id: teamsToUse[i]?.id || null,
            home_team_name: teamsToUse[i]?.name || "TBD",
            away_team_id: teamsToUse[i + 1]?.id || null,
            away_team_name: teamsToUse[i + 1]?.name || "TBD",
            status: "scheduled"
          });
        }
      } else if (tournament.tournament_type === "league") {
        // Round robin - everyone plays everyone
        let matchNumber = 1;
        for (let i = 0; i < teamsToUse.length; i++) {
          for (let j = i + 1; j < teamsToUse.length; j++) {
            newMatches.push({
              tournament_id: tournamentId,
              phase: "league",
              match_number: matchNumber++,
              round: 1,
              home_team_id: teamsToUse[i].id,
              home_team_name: teamsToUse[i].name,
              away_team_id: teamsToUse[j].id,
              away_team_name: teamsToUse[j].name,
              status: "scheduled"
            });
          }
        }
      }

      // Create all matches
      await base44.entities.TournamentMatch.bulkCreate(newMatches);
      
      // Update tournament status
      await base44.entities.Tournament.update(tournamentId, { 
        status: "in_progress",
        current_phase: tournament.tournament_type === "league" ? "league" : "round_1"
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['tournament-matches']);
      queryClient.invalidateQueries(['tournament']);
      toast.success("Bracket generado");
    }
  });

  const handleSendMessage = () => {
    if (!newMessage.trim()) return;
    sendMessageMutation.mutate({
      tournament_id: tournamentId,
      sender_id: user.id,
      sender_name: user.nickname || user.full_name,
      sender_team: myTeam?.name || (isOrganizer ? "Organizador" : ""),
      content: newMessage.trim(),
      is_announcement: isOrganizer
    });
  };

  if (isLoading) {
    return <LoadingSpinner className="min-h-screen" text="Cargando torneo..." />;
  }

  if (!tournament) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <EmptyState icon={Trophy} title="Torneo no encontrado" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white pb-20">
      {/* Header */}
      <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 text-white py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <Link to={createPageUrl("Tournaments")} className="inline-flex items-center gap-1 text-white/80 hover:text-white mb-4">
            <ChevronLeft className="h-4 w-4" />
            Volver a Torneos
          </Link>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <Badge className="bg-white/20">{SPORT_LABELS[tournament.sport_type]}</Badge>
                <Badge className={statusConfig.color}>{statusConfig.label}</Badge>
              </div>
              <h1 className="text-3xl font-bold">{tournament.name}</h1>
              <p className="text-white/80 mt-1">{TYPE_LABELS[tournament.tournament_type]}</p>
              <p className="text-sm text-white/70 mt-2 flex items-center gap-2">
                <Crown className="h-4 w-4" />
                Organizado por {tournament.organizer_name}
              </p>
            </div>

            <div className="flex gap-2">
              {tournament.status === "registration" && !myTeam && (
                <Button
                  onClick={() => {
                    if (!user) {
                      base44.auth.redirectToLogin(window.location.href);
                      return;
                    }
                    setShowRegisterDialog(true);
                  }}
                  className="bg-white text-orange-600 hover:bg-orange-50"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Inscribir Equipo
                </Button>
              )}
              {isOrganizer && tournament.status === "draft" && (
                <Button
                  onClick={() => updateTournamentMutation.mutate({ status: "registration" })}
                  className="bg-white text-orange-600 hover:bg-orange-50"
                >
                  Abrir Inscripciones
                </Button>
              )}
              {isOrganizer && tournament.status === "registration" && approvedTeams.length >= 2 && (
                <Button
                  onClick={() => generateBracketMutation.mutate()}
                  disabled={generateBracketMutation.isPending}
                  className="bg-white text-orange-600 hover:bg-orange-50"
                >
                  <Play className="h-4 w-4 mr-2" />
                  Iniciar Torneo
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2">
            <Tabs defaultValue="bracket" className="space-y-4">
              <TabsList>
                <TabsTrigger value="bracket">
                  {tournament.tournament_type === "league" ? "Partidos" : "Bracket"}
                </TabsTrigger>
                <TabsTrigger value="standings">Tabla</TabsTrigger>
                <TabsTrigger value="teams">Equipos ({approvedTeams.length})</TabsTrigger>
                <TabsTrigger value="info">Info</TabsTrigger>
              </TabsList>

              <TabsContent value="bracket">
                {matches.length > 0 ? (
                  <TournamentBracket
                    matches={matches}
                    teams={approvedTeams}
                    tournamentType={tournament.tournament_type}
                    isOrganizer={isOrganizer}
                    onEditMatch={(match) => {
                      setSelectedMatch(match);
                      setShowScoreDialog(true);
                    }}
                  />
                ) : (
                  <EmptyState
                    icon={Trophy}
                    title="Sin partidos aún"
                    description={tournament.status === "registration" 
                      ? "El bracket se generará cuando inicie el torneo"
                      : "Esperando generación del bracket"
                    }
                  />
                )}
              </TabsContent>

              <TabsContent value="standings">
                <TournamentStandings teams={approvedTeams} matches={matches} />
              </TabsContent>

              <TabsContent value="teams">
                <div className="space-y-4">
                  {/* Pending Teams (for organizer) */}
                  {isOrganizer && pendingTeams.length > 0 && (
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base flex items-center gap-2">
                          <Clock className="h-4 w-4 text-amber-500" />
                          Solicitudes Pendientes ({pendingTeams.length})
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {pendingTeams.map(team => (
                          <div key={team.id} className="flex items-center justify-between p-3 bg-amber-50 rounded-lg">
                            <div>
                              <p className="font-semibold">{team.name}</p>
                              <p className="text-sm text-slate-500">Capitán: {team.captain_name}</p>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                onClick={() => updateTeamMutation.mutate({ 
                                  teamId: team.id, 
                                  data: { status: "approved" } 
                                })}
                              >
                                <Check className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => updateTeamMutation.mutate({ 
                                  teamId: team.id, 
                                  data: { status: "rejected" } 
                                })}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  )}

                  {/* Approved Teams */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {approvedTeams.map((team, idx) => (
                      <Card key={team.id}>
                        <CardContent className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center text-white font-bold">
                              {idx + 1}
                            </div>
                            <div className="flex-1">
                              <p className="font-semibold">{team.name}</p>
                              <p className="text-sm text-slate-500">
                                {team.players?.length || 0} jugadores
                              </p>
                            </div>
                            {team.group && (
                              <Badge variant="outline">Grupo {team.group}</Badge>
                            )}
                          </div>
                          {team.players?.length > 0 && (
                            <div className="mt-3 pt-3 border-t">
                              <p className="text-xs text-slate-500 mb-2">Jugadores:</p>
                              <div className="flex flex-wrap gap-1">
                                {team.players.slice(0, 5).map((p, i) => (
                                  <Badge key={i} variant="secondary" className="text-xs">
                                    {p.nickname || p.name}
                                  </Badge>
                                ))}
                                {team.players.length > 5 && (
                                  <Badge variant="secondary" className="text-xs">
                                    +{team.players.length - 5}
                                  </Badge>
                                )}
                              </div>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="info">
                <Card>
                  <CardContent className="p-6 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-slate-500">Fecha inicio</p>
                        <p className="font-semibold">
                          {format(new Date(tournament.start_date), "d MMMM yyyy", { locale: es })}
                        </p>
                      </div>
                      {tournament.end_date && (
                        <div>
                          <p className="text-sm text-slate-500">Fecha fin</p>
                          <p className="font-semibold">
                            {format(new Date(tournament.end_date), "d MMMM yyyy", { locale: es })}
                          </p>
                        </div>
                      )}
                      <div>
                        <p className="text-sm text-slate-500">Equipos</p>
                        <p className="font-semibold">{approvedTeams.length} / {tournament.max_teams}</p>
                      </div>
                      <div>
                        <p className="text-sm text-slate-500">Inscripción</p>
                        <p className="font-semibold">
                          {tournament.registration_fee > 0 
                            ? `S/ ${tournament.registration_fee}` 
                            : "Gratis"
                          }
                        </p>
                      </div>
                    </div>

                    {tournament.location && (
                      <div>
                        <p className="text-sm text-slate-500">Ubicación</p>
                        <p className="font-semibold flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-orange-500" />
                          {tournament.location}
                        </p>
                      </div>
                    )}

                    {tournament.prize_description && (
                      <div className="p-4 bg-amber-50 rounded-xl">
                        <p className="text-sm text-amber-600 font-medium flex items-center gap-2">
                          <Trophy className="h-4 w-4" />
                          Premio
                        </p>
                        <p className="font-semibold text-amber-800 mt-1">
                          {tournament.prize_description}
                        </p>
                      </div>
                    )}

                    {tournament.description && (
                      <div>
                        <p className="text-sm text-slate-500 mb-1">Descripción</p>
                        <p className="text-slate-700">{tournament.description}</p>
                      </div>
                    )}

                    {tournament.rules && (
                      <div>
                        <p className="text-sm text-slate-500 mb-1 flex items-center gap-1">
                          <FileText className="h-4 w-4" />
                          Reglas
                        </p>
                        <p className="text-slate-700 whitespace-pre-wrap">{tournament.rules}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Sidebar - Chat */}
          <div className="lg:col-span-1">
            <Card className="h-[600px] flex flex-col">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <MessageCircle className="h-4 w-4 text-orange-500" />
                  Chat del Torneo
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col p-0">
                <ScrollArea className="flex-1 px-4">
                  <div className="space-y-3 py-2">
                    {messages.length > 0 ? (
                      [...messages].reverse().map(msg => (
                        <div 
                          key={msg.id}
                          className={`p-3 rounded-lg ${
                            msg.is_announcement 
                              ? "bg-orange-50 border border-orange-200" 
                              : "bg-slate-50"
                          }`}
                        >
                          <div className="flex items-center gap-2 mb-1">
                            {msg.is_announcement && <Pin className="h-3 w-3 text-orange-500" />}
                            <span className="font-medium text-sm">{msg.sender_name}</span>
                            {msg.sender_team && (
                              <Badge variant="secondary" className="text-xs">
                                {msg.sender_team}
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-slate-700">{msg.content}</p>
                          <p className="text-xs text-slate-400 mt-1">
                            {format(new Date(msg.created_date), "d MMM, HH:mm", { locale: es })}
                          </p>
                        </div>
                      ))
                    ) : (
                      <p className="text-center text-slate-400 text-sm py-8">
                        No hay mensajes aún
                      </p>
                    )}
                  </div>
                </ScrollArea>
                {user && (
                  <div className="p-4 border-t">
                    <div className="flex gap-2">
                      <Input
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Escribe un mensaje..."
                        onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                      />
                      <Button 
                        onClick={handleSendMessage}
                        disabled={!newMessage.trim()}
                        className="bg-orange-600 hover:bg-orange-700"
                      >
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Register Team Dialog */}
      <TeamRegistrationDialog
        open={showRegisterDialog}
        onClose={() => setShowRegisterDialog(false)}
        onRegister={(data) => registerTeamMutation.mutate({
          ...data,
          tournament_id: tournamentId,
          captain_id: user?.id,
          captain_name: user?.full_name,
          status: "pending",
          stats: { played: 0, won: 0, drawn: 0, lost: 0, goals_for: 0, goals_against: 0, points: 0 }
        })}
        isRegistering={registerTeamMutation.isPending}
        tournament={tournament}
        user={user}
      />

      {/* Match Score Dialog */}
      <MatchScoreDialog
        open={showScoreDialog}
        onClose={() => setShowScoreDialog(false)}
        match={selectedMatch}
        onSave={(matchId, data) => updateMatchMutation.mutate({ matchId, data })}
        isSaving={updateMatchMutation.isPending}
      />
    </div>
  );
}