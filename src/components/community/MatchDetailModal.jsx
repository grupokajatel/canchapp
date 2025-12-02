import React from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import {
  Calendar, Clock, MapPin, Users, DollarSign, Trophy,
  Phone, MessageCircle, Share2, User, Crown
} from "lucide-react";

const SPORT_LABELS = {
  futbol: "Fútbol",
  voley: "Vóley",
  basquet: "Básquet",
  futsal: "Futsal",
  tenis: "Tenis",
  otro: "Otro"
};

const STATUS_CONFIG = {
  open: { label: "Abierto", color: "bg-emerald-100 text-emerald-700" },
  full: { label: "Completo", color: "bg-amber-100 text-amber-700" },
  completed: { label: "Finalizado", color: "bg-slate-100 text-slate-700" },
  cancelled: { label: "Cancelado", color: "bg-red-100 text-red-700" }
};

export default function MatchDetailModal({ match, open, onClose, onJoin, isJoining, currentUserId }) {
  if (!match) return null;

  const playerProgress = (match.current_players / match.max_players) * 100;
  const isOrganizer = match.organizer_id === currentUserId;
  const isJoined = match.players?.some(p => p.user_id === currentUserId);
  const statusConfig = STATUS_CONFIG[match.status] || STATUS_CONFIG.open;
  const spotsLeft = match.max_players - (match.current_players || 1);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto p-0">
        {/* Header Image */}
        <div className="relative h-48 bg-gradient-to-br from-teal-500 to-teal-700">
          {match.image_url ? (
            <img src={match.image_url} alt={match.title} className="w-full h-full object-cover" />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <Trophy className="h-20 w-20 text-white/20" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
          
          <Badge className={`absolute top-4 right-4 ${statusConfig.color}`}>
            {statusConfig.label}
          </Badge>
          <Badge className="absolute top-4 left-4 bg-white/90 text-slate-700">
            {SPORT_LABELS[match.sport_type]}
          </Badge>

          <div className="absolute bottom-4 left-4 right-4">
            <h2 className="text-2xl font-bold text-white">{match.title}</h2>
            <div className="flex items-center gap-2 mt-1 text-white/80">
              <Crown className="h-4 w-4" />
              <span className="text-sm">Organizado por {match.organizer_name || "Anónimo"}</span>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Date, Time & Location */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
              <div className="p-2 bg-teal-100 rounded-lg">
                <Calendar className="h-5 w-5 text-teal-600" />
              </div>
              <div>
                <p className="text-xs text-slate-500">Fecha</p>
                <p className="font-medium text-slate-800">
                  {format(new Date(match.date + 'T00:00:00'), "EEE d MMM", { locale: es })}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
              <div className="p-2 bg-teal-100 rounded-lg">
                <Clock className="h-5 w-5 text-teal-600" />
              </div>
              <div>
                <p className="text-xs text-slate-500">Hora</p>
                <p className="font-medium text-slate-800">{match.time}</p>
              </div>
            </div>
          </div>

          {(match.court_name || match.court_address) && (
            <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-xl">
              <MapPin className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                {match.court_name && <p className="font-medium text-slate-800">{match.court_name}</p>}
                {match.court_address && <p className="text-sm text-slate-600">{match.court_address}</p>}
              </div>
            </div>
          )}

          {/* Description */}
          {match.description && (
            <div>
              <h3 className="font-semibold text-slate-800 mb-2">Descripción</h3>
              <p className="text-slate-600">{match.description}</p>
            </div>
          )}

          <Separator />

          {/* Players */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                <Users className="h-5 w-5 text-teal-600" />
                Jugadores
              </h3>
              <span className="text-sm text-slate-500">
                {spotsLeft > 0 ? `${spotsLeft} lugar${spotsLeft > 1 ? 'es' : ''} disponible${spotsLeft > 1 ? 's' : ''}` : "Completo"}
              </span>
            </div>
            
            <Progress value={playerProgress} className="h-3 mb-4" />
            
            <div className="grid grid-cols-2 gap-2">
              {match.players?.map((player, idx) => (
                <div
                  key={idx}
                  className={`flex items-center gap-2 p-2 rounded-lg ${
                    player.user_id === match.organizer_id 
                      ? "bg-amber-50 border border-amber-200" 
                      : "bg-slate-50"
                  }`}
                >
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-teal-100 text-teal-700 text-xs">
                      {(player.user_name || "U").charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{player.user_name || "Jugador"}</p>
                    {player.user_id === match.organizer_id && (
                      <p className="text-xs text-amber-600">Organizador</p>
                    )}
                  </div>
                </div>
              ))}
              
              {/* Empty slots */}
              {Array.from({ length: spotsLeft }).slice(0, 4).map((_, idx) => (
                <div key={`empty-${idx}`} className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 border-2 border-dashed border-slate-200">
                  <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center">
                    <User className="h-4 w-4 text-slate-400" />
                  </div>
                  <span className="text-sm text-slate-400">Disponible</span>
                </div>
              ))}
              {spotsLeft > 4 && (
                <div className="col-span-2 text-center text-sm text-slate-500">
                  +{spotsLeft - 4} lugares más disponibles
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* Pricing */}
          <div className="flex items-center justify-between p-4 bg-teal-50 rounded-xl">
            <div>
              <p className="text-sm text-teal-700">Precio por persona</p>
              <p className="text-2xl font-bold text-teal-700">S/ {match.price_per_person}</p>
            </div>
            {match.bet_amount > 0 && (
              <div className="text-right">
                <p className="text-sm text-amber-700">Apuesta</p>
                <p className="text-2xl font-bold text-amber-600">S/ {match.bet_amount}</p>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={onClose}>
              Cerrar
            </Button>
            
            {match.status === "open" && !isJoined && !isOrganizer && (
              <Button
                className="flex-1 bg-gradient-to-r from-teal-600 to-teal-700"
                onClick={onJoin}
                disabled={isJoining}
              >
                {isJoining ? "Uniéndose..." : "Unirse al Partido"}
              </Button>
            )}
            
            {isJoined && !isOrganizer && (
              <Button className="flex-1" variant="secondary" disabled>
                Ya estás inscrito
              </Button>
            )}
            
            {isOrganizer && (
              <Button className="flex-1" variant="secondary" disabled>
                Eres el organizador
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}