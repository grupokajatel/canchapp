import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Calendar, Clock, MapPin, Users, DollarSign, Trophy } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { format } from "date-fns";
import { es } from "date-fns/locale";

export default function MatchCard({ match, onJoin, onViewDetails, isJoining }) {
  const sportLabels = {
    futbol: "Fútbol",
    voley: "Vóley",
    basquet: "Básquet",
    futsal: "Futsal",
    tenis: "Tenis",
    otro: "Otro"
  };

  const statusColors = {
    open: "bg-emerald-100 text-emerald-700 border-emerald-200",
    full: "bg-amber-100 text-amber-700 border-amber-200",
    completed: "bg-slate-100 text-slate-700 border-slate-200",
    cancelled: "bg-red-100 text-red-700 border-red-200"
  };

  const statusLabels = {
    open: "Abierto",
    full: "Completo",
    completed: "Finalizado",
    cancelled: "Cancelado"
  };

  const playerProgress = (match.current_players / match.max_players) * 100;

  return (
    <div className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 border border-slate-100">
      {/* Image Header */}
      <div className="relative h-40 bg-gradient-to-br from-teal-500 to-teal-700">
        {match.image_url ? (
          <img 
            src={match.image_url} 
            alt={match.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <Trophy className="h-16 w-16 text-white/30" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        
        {/* Status Badge */}
        <Badge className={`absolute top-3 right-3 ${statusColors[match.status]}`}>
          {statusLabels[match.status]}
        </Badge>

        {/* Sport Badge */}
        <Badge className="absolute top-3 left-3 bg-white/90 text-slate-700">
          {sportLabels[match.sport_type]}
        </Badge>

        {/* Title */}
        <div className="absolute bottom-3 left-3 right-3">
          <h3 className="text-lg font-bold text-white line-clamp-1">{match.title}</h3>
          <p className="text-sm text-white/80 mt-0.5">Por {match.organizer_name || "Anónimo"}</p>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-4">
        {/* Date & Time */}
        <div className="flex items-center gap-4 text-sm text-slate-600">
          <div className="flex items-center gap-1.5">
            <Calendar className="h-4 w-4 text-teal-500" />
            <span>{format(new Date(match.date), "EEE d MMM", { locale: es })}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Clock className="h-4 w-4 text-teal-500" />
            <span>{match.time}</span>
          </div>
        </div>

        {/* Location */}
        {match.court_address && (
          <div className="flex items-start gap-1.5 text-sm text-slate-500">
            <MapPin className="h-4 w-4 text-slate-400 flex-shrink-0 mt-0.5" />
            <span className="line-clamp-1">{match.court_address}</span>
          </div>
        )}

        {/* Players Progress */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-600 flex items-center gap-1.5">
              <Users className="h-4 w-4 text-teal-500" />
              Jugadores
            </span>
            <span className="font-semibold text-slate-700">
              {match.current_players || 1} / {match.max_players}
            </span>
          </div>
          <Progress value={playerProgress} className="h-2" />
        </div>

        {/* Prices */}
        <div className="flex items-center gap-4 pt-2 border-t border-slate-100">
          <div className="flex-1">
            <p className="text-xs text-slate-500">Por persona</p>
            <p className="text-lg font-bold text-teal-600">S/ {match.price_per_person}</p>
          </div>
          {match.bet_amount > 0 && (
            <div className="flex-1 text-right">
              <p className="text-xs text-amber-600">Apuesta</p>
              <p className="text-lg font-bold text-amber-600">S/ {match.bet_amount}</p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <Button 
            variant="outline"
            className="flex-1"
            onClick={(e) => {
              e.preventDefault();
              onViewDetails?.();
            }}
          >
            Ver Detalles
          </Button>
          {match.status === "open" && (
            <Button 
              className="flex-1 bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-700 hover:to-teal-800"
              onClick={(e) => {
                e.preventDefault();
                onJoin?.();
              }}
              disabled={isJoining}
            >
              {isJoining ? "..." : "Unirse"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}