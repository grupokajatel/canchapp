import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { format, isPast } from "date-fns";
import { es } from "date-fns/locale";
import {
  Trophy, Calendar, Users, MapPin, Plus, Search, Filter,
  ChevronRight, Medal, DollarSign, Clock
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import EmptyState from "@/components/ui/EmptyState";
import TournamentCard from "@/components/tournaments/TournamentCard";
import CreateTournamentDialog from "@/components/tournaments/CreateTournamentDialog";

const SPORT_OPTIONS = [
  { value: "all", label: "Todos los deportes" },
  { value: "futbol", label: "Fútbol" },
  { value: "voley", label: "Vóley" },
  { value: "basquet", label: "Básquet" },
  { value: "futsal", label: "Futsal" },
  { value: "tenis", label: "Tenis" },
];

export default function Tournaments() {
  const [user, setUser] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [sportFilter, setSportFilter] = useState("all");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const queryClient = useQueryClient();

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

  const { data: tournaments = [], isLoading } = useQuery({
    queryKey: ['tournaments'],
    queryFn: () => base44.entities.Tournament.list('-created_date'),
  });

  const { data: myTeams = [] } = useQuery({
    queryKey: ['my-tournament-teams', user?.id],
    queryFn: () => base44.entities.TournamentTeam.filter({ captain_id: user.id }),
    enabled: !!user?.id,
  });

  const createTournamentMutation = useMutation({
    mutationFn: (data) => base44.entities.Tournament.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['tournaments']);
      setShowCreateDialog(false);
    }
  });

  const filteredTournaments = tournaments.filter(t => {
    const matchesSearch = t.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSport = sportFilter === "all" || t.sport_type === sportFilter;
    return matchesSearch && matchesSport;
  });

  const activeTournaments = filteredTournaments.filter(t => 
    ["registration", "in_progress"].includes(t.status)
  );
  const upcomingTournaments = filteredTournaments.filter(t => 
    t.status === "draft" && !isPast(new Date(t.start_date))
  );
  const completedTournaments = filteredTournaments.filter(t => 
    t.status === "completed"
  );
  const myTournaments = filteredTournaments.filter(t => 
    t.organizer_id === user?.id || myTeams.some(team => team.tournament_id === t.id)
  );

  if (isLoading) {
    return <LoadingSpinner className="min-h-screen" text="Cargando torneos..." />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white pb-20">
      {/* Header */}
      <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 text-white py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold flex items-center gap-3">
                <Trophy className="h-10 w-10" />
                Torneos y Ligas
              </h1>
              <p className="text-white/80 mt-2">
                Crea o únete a torneos amateur de tu deporte favorito
              </p>
            </div>
            <Button
              onClick={() => {
                if (!user) {
                  base44.auth.redirectToLogin(window.location.href);
                  return;
                }
                setShowCreateDialog(true);
              }}
              className="bg-white text-orange-600 hover:bg-orange-50"
            >
              <Plus className="h-4 w-4 mr-2" />
              Crear Torneo
            </Button>
          </div>

          {/* Search & Filters */}
          <div className="mt-8 flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
              <Input
                placeholder="Buscar torneos..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-white/90 border-0 text-slate-800"
              />
            </div>
            <Select value={sportFilter} onValueChange={setSportFilter}>
              <SelectTrigger className="w-48 bg-white/90 border-0 text-slate-800">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SPORT_OPTIONS.map(opt => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs defaultValue="active" className="space-y-6">
          <TabsList className="bg-slate-100">
            <TabsTrigger value="active">
              Activos ({activeTournaments.length})
            </TabsTrigger>
            <TabsTrigger value="upcoming">
              Próximos ({upcomingTournaments.length})
            </TabsTrigger>
            <TabsTrigger value="my">
              Mis Torneos ({myTournaments.length})
            </TabsTrigger>
            <TabsTrigger value="completed">
              Finalizados
            </TabsTrigger>
          </TabsList>

          <TabsContent value="active">
            {activeTournaments.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {activeTournaments.map(tournament => (
                  <TournamentCard key={tournament.id} tournament={tournament} />
                ))}
              </div>
            ) : (
              <EmptyState
                icon={Trophy}
                title="No hay torneos activos"
                description="Crea tu propio torneo o espera a que se abran inscripciones"
                action={
                  <Button onClick={() => setShowCreateDialog(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Crear Torneo
                  </Button>
                }
              />
            )}
          </TabsContent>

          <TabsContent value="upcoming">
            {upcomingTournaments.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {upcomingTournaments.map(tournament => (
                  <TournamentCard key={tournament.id} tournament={tournament} />
                ))}
              </div>
            ) : (
              <EmptyState
                icon={Calendar}
                title="No hay torneos próximos"
                description="Los nuevos torneos aparecerán aquí"
              />
            )}
          </TabsContent>

          <TabsContent value="my">
            {myTournaments.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {myTournaments.map(tournament => (
                  <TournamentCard 
                    key={tournament.id} 
                    tournament={tournament}
                    isOrganizer={tournament.organizer_id === user?.id}
                  />
                ))}
              </div>
            ) : (
              <EmptyState
                icon={Medal}
                title="No participas en ningún torneo"
                description="Inscríbete o crea tu propio torneo"
              />
            )}
          </TabsContent>

          <TabsContent value="completed">
            {completedTournaments.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {completedTournaments.map(tournament => (
                  <TournamentCard key={tournament.id} tournament={tournament} />
                ))}
              </div>
            ) : (
              <EmptyState
                icon={Trophy}
                title="No hay torneos finalizados"
                description="Los torneos completados aparecerán aquí"
              />
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Create Tournament Dialog */}
      <CreateTournamentDialog
        open={showCreateDialog}
        onClose={() => setShowCreateDialog(false)}
        onCreate={(data) => createTournamentMutation.mutate({
          ...data,
          organizer_id: user?.id,
          organizer_name: user?.full_name,
          status: "draft"
        })}
        isCreating={createTournamentMutation.isPending}
        user={user}
      />
    </div>
  );
}