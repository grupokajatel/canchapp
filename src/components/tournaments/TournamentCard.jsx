import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Trophy, Calendar, Users, MapPin, DollarSign, Crown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

const SPORT_LABELS = {
  futbol: "Fútbol",
  voley: "Vóley",
  basquet: "Básquet",
  futsal: "Futsal",
  tenis: "Tenis",
  otro: "Otro"
};

const TYPE_LABELS = {
  knockout: "Eliminación Directa",
  league: "Liga",
  groups_knockout: "Grupos + Eliminación"
};

const STATUS_CONFIG = {
  draft: { label: "Borrador", color: "bg-slate-100 text-slate-700" },
  registration: { label: "Inscripciones Abiertas", color: "bg-green-100 text-green-700" },
  in_progress: { label: "En Curso", color: "bg-amber-100 text-amber-700" },
  completed: { label: "Finalizado", color: "bg-blue-100 text-blue-700" },
  cancelled: { label: "Cancelado", color: "bg-red-100 text-red-700" }
};

export default function TournamentCard({ tournament, isOrganizer = false }) {
  const statusConfig = STATUS_CONFIG[tournament.status] || STATUS_CONFIG.draft;

  return (
    <Link to={createPageUrl(`TournamentDetail?id=${tournament.id}`)}>
      <div className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 border border-slate-100">
        {/* Image Header */}
        <div className="relative h-40 bg-gradient-to-br from-amber-500 to-orange-600">
          {tournament.image_url ? (
            <img 
              src={tournament.image_url} 
              alt={tournament.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <Trophy className="h-16 w-16 text-white/30" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          
          {/* Badges */}
          <div className="absolute top-3 right-3 flex gap-2">
            {isOrganizer && (
              <Badge className="bg-amber-500 text-white">
                <Crown className="h-3 w-3 mr-1" />
                Organizador
              </Badge>
            )}
            <Badge className={statusConfig.color}>
              {statusConfig.label}
            </Badge>
          </div>

          <Badge className="absolute top-3 left-3 bg-white/90 text-slate-700">
            {SPORT_LABELS[tournament.sport_type]}
          </Badge>

          {/* Title */}
          <div className="absolute bottom-3 left-3 right-3">
            <h3 className="text-lg font-bold text-white line-clamp-1">{tournament.name}</h3>
            <p className="text-sm text-white/80">{TYPE_LABELS[tournament.tournament_type]}</p>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 space-y-3">
          {/* Date */}
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <Calendar className="h-4 w-4 text-orange-500" />
            <span>
              {format(new Date(tournament.start_date), "d MMM", { locale: es })}
              {tournament.end_date && ` - ${format(new Date(tournament.end_date), "d MMM", { locale: es })}`}
            </span>
          </div>

          {/* Location */}
          {tournament.location && (
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <MapPin className="h-4 w-4 text-slate-400" />
              <span className="line-clamp-1">{tournament.location}</span>
            </div>
          )}

          {/* Teams */}
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <Users className="h-4 w-4 text-orange-500" />
            <span>{tournament.max_teams} equipos máximo</span>
          </div>

          {/* Registration Fee */}
          {tournament.registration_fee > 0 && (
            <div className="flex items-center gap-2 text-sm">
              <DollarSign className="h-4 w-4 text-green-500" />
              <span className="font-semibold text-green-600">
                S/ {tournament.registration_fee} por equipo
              </span>
            </div>
          )}

          {/* Prize */}
          {tournament.prize_description && (
            <div className="p-2 bg-amber-50 rounded-lg">
              <p className="text-xs text-amber-600 font-medium flex items-center gap-1">
                <Trophy className="h-3 w-3" />
                Premio: {tournament.prize_description}
              </p>
            </div>
          )}

          {/* View Button */}
          <Button variant="outline" className="w-full mt-2">
            Ver Detalles
          </Button>
        </div>
      </div>
    </Link>
  );
}