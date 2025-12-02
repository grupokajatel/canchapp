import React, { useState, useMemo } from "react";
import { format, differenceInMinutes, differenceInHours, addHours } from "date-fns";
import { es } from "date-fns/locale";
import { 
  Zap, Clock, MapPin, Users, DollarSign, Trophy, Filter, 
  Navigation, ChevronRight, AlertCircle, CreditCard, Banknote
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";

const SPORT_TYPES = [
  { value: "all", label: "Todos" },
  { value: "futbol", label: "Fútbol" },
  { value: "voley", label: "Vóley" },
  { value: "basquet", label: "Básquet" },
  { value: "futsal", label: "Futsal" },
  { value: "tenis", label: "Tenis" },
];

const sportLabels = {
  futbol: "Fútbol", voley: "Vóley", basquet: "Básquet",
  futsal: "Futsal", tenis: "Tenis", otro: "Otro"
};

// Calculate distance between coordinates (Haversine)
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  if (!lat1 || !lon1 || !lat2 || !lon2) return null;
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

const formatTimeRemaining = (matchDate, matchTime) => {
  const now = new Date();
  const matchDateTime = new Date(`${matchDate}T${matchTime}:00`);
  const mins = differenceInMinutes(matchDateTime, now);
  
  if (mins < 0) return null;
  if (mins < 60) return `${mins} min`;
  const hrs = differenceInHours(matchDateTime, now);
  if (hrs < 24) return `${hrs}h`;
  return null;
};

export default function QuickMatchesSection({ 
  matches, 
  courts,
  userLocation, 
  user, 
  onJoin, 
  isJoining,
  onCreateQuickMatch 
}) {
  const [sportFilter, setSportFilter] = useState("all");
  const [timeFilter, setTimeFilter] = useState("all"); // all, 1h, 3h, today
  const [distanceFilter, setDistanceFilter] = useState("all"); // all, 5km, 10km, 20km
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState("efectivo");
  const [isProcessing, setIsProcessing] = useState(false);

  // Filter and sort quick matches
  const quickMatches = useMemo(() => {
    const now = new Date();
    const maxHours = 6; // Only show matches within 6 hours
    
    return matches
      .filter(match => {
        if (match.status !== "open") return false;
        
        const matchDateTime = new Date(`${match.date}T${match.time}:00`);
        const hoursUntil = differenceInHours(matchDateTime, now);
        
        // Must be within maxHours and not started yet
        if (hoursUntil < 0 || hoursUntil > maxHours) return false;
        
        // Sport filter
        if (sportFilter !== "all" && match.sport_type !== sportFilter) return false;
        
        // Time filter
        if (timeFilter === "1h" && hoursUntil > 1) return false;
        if (timeFilter === "3h" && hoursUntil > 3) return false;
        
        // Distance filter (need court coordinates)
        if (distanceFilter !== "all" && userLocation) {
          const court = courts.find(c => c.id === match.court_id);
          if (court?.latitude && court?.longitude) {
            const dist = calculateDistance(
              userLocation.lat, userLocation.lng,
              court.latitude, court.longitude
            );
            const maxDist = parseInt(distanceFilter.replace("km", ""));
            if (dist > maxDist) return false;
          }
        }
        
        return true;
      })
      .map(match => {
        const court = courts.find(c => c.id === match.court_id);
        const distance = userLocation && court?.latitude && court?.longitude
          ? calculateDistance(userLocation.lat, userLocation.lng, court.latitude, court.longitude)
          : null;
        return { ...match, distance, court };
      })
      .sort((a, b) => {
        // Sort by time remaining (soonest first)
        const timeA = new Date(`${a.date}T${a.time}:00`);
        const timeB = new Date(`${b.date}T${b.time}:00`);
        return timeA - timeB;
      });
  }, [matches, courts, userLocation, sportFilter, timeFilter, distanceFilter]);

  const handleQuickJoin = (match) => {
    if (!user) {
      toast.error("Inicia sesión para unirte");
      return;
    }
    
    const isAlreadyJoined = match.players?.some(p => p.user_id === user.id);
    if (isAlreadyJoined) {
      toast.error("Ya estás en este partido");
      return;
    }

    // If match has a price, show payment modal
    if (match.price_per_person > 0) {
      setSelectedMatch(match);
      setShowPaymentModal(true);
    } else {
      onJoin(match);
    }
  };

  const handleConfirmPayment = async () => {
    if (!selectedMatch) return;
    setIsProcessing(true);
    
    try {
      // Join the match
      await onJoin(selectedMatch, paymentMethod);
      setShowPaymentModal(false);
      setSelectedMatch(null);
      toast.success("¡Te uniste al partido!");
    } catch (error) {
      toast.error("Error al procesar");
    } finally {
      setIsProcessing(false);
    }
  };

  if (quickMatches.length === 0 && sportFilter === "all" && timeFilter === "all") {
    return null; // Don't show section if no quick matches
  }

  return (
    <div className="mb-8">
      {/* Section Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-amber-100 rounded-lg">
            <Zap className="h-5 w-5 text-amber-600" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-800">Partidos Rápidos</h2>
            <p className="text-sm text-slate-500">Comienzan en las próximas horas</p>
          </div>
        </div>
        <Button 
          variant="outline" 
          size="sm"
          onClick={onCreateQuickMatch}
          className="text-amber-600 border-amber-200 hover:bg-amber-50"
        >
          <Zap className="h-4 w-4 mr-1" />
          Crear rápido
        </Button>
      </div>

      {/* Quick Filters */}
      <div className="flex flex-wrap gap-2 mb-4">
        <Select value={timeFilter} onValueChange={setTimeFilter}>
          <SelectTrigger className="w-32 h-9 text-sm">
            <Clock className="h-3.5 w-3.5 mr-1" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Próx. 6h</SelectItem>
            <SelectItem value="1h">En 1 hora</SelectItem>
            <SelectItem value="3h">En 3 horas</SelectItem>
          </SelectContent>
        </Select>

        <Select value={sportFilter} onValueChange={setSportFilter}>
          <SelectTrigger className="w-32 h-9 text-sm">
            <Trophy className="h-3.5 w-3.5 mr-1" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {SPORT_TYPES.map(s => (
              <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {userLocation && (
          <Select value={distanceFilter} onValueChange={setDistanceFilter}>
            <SelectTrigger className="w-32 h-9 text-sm">
              <Navigation className="h-3.5 w-3.5 mr-1" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Cualquier dist.</SelectItem>
              <SelectItem value="5km">{"< 5 km"}</SelectItem>
              <SelectItem value="10km">{"< 10 km"}</SelectItem>
              <SelectItem value="20km">{"< 20 km"}</SelectItem>
            </SelectContent>
          </Select>
        )}
      </div>

      {/* Quick Match Cards - Horizontal Scroll */}
      {quickMatches.length > 0 ? (
        <div className="flex gap-4 overflow-x-auto pb-4 -mx-4 px-4 snap-x">
          {quickMatches.map(match => {
            const timeRemaining = formatTimeRemaining(match.date, match.time);
            const playerProgress = (match.current_players / match.max_players) * 100;
            const spotsLeft = match.max_players - (match.current_players || 1);
            
            return (
              <div 
                key={match.id}
                className="flex-shrink-0 w-72 bg-white rounded-2xl border-2 border-amber-200 shadow-lg shadow-amber-100/50 overflow-hidden snap-start"
              >
                {/* Urgency Header */}
                <div className="bg-gradient-to-r from-amber-500 to-orange-500 px-4 py-2 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-white">
                    <Zap className="h-4 w-4" />
                    <span className="font-semibold text-sm">
                      {timeRemaining ? `Empieza en ${timeRemaining}` : "¡Ya empezó!"}
                    </span>
                  </div>
                  {spotsLeft <= 3 && spotsLeft > 0 && (
                    <Badge className="bg-white/20 text-white text-xs">
                      ¡{spotsLeft} lugar{spotsLeft > 1 ? 'es' : ''}!
                    </Badge>
                  )}
                </div>

                {/* Content */}
                <div className="p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-bold text-slate-800 line-clamp-1">{match.title}</h3>
                      <Badge variant="outline" className="mt-1 text-xs">
                        {sportLabels[match.sport_type]}
                      </Badge>
                    </div>
                  </div>

                  {/* Time & Location */}
                  <div className="space-y-1.5 text-sm">
                    <div className="flex items-center gap-2 text-slate-600">
                      <Clock className="h-4 w-4 text-amber-500" />
                      <span>{match.time} hrs</span>
                    </div>
                    {(match.court_address || match.court_name) && (
                      <div className="flex items-center gap-2 text-slate-500">
                        <MapPin className="h-4 w-4 text-slate-400" />
                        <span className="line-clamp-1">{match.court_name || match.court_address}</span>
                      </div>
                    )}
                    {match.distance && (
                      <div className="flex items-center gap-2 text-teal-600">
                        <Navigation className="h-4 w-4" />
                        <span className="font-medium">{match.distance.toFixed(1)} km</span>
                      </div>
                    )}
                  </div>

                  {/* Players */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-600 flex items-center gap-1">
                        <Users className="h-4 w-4 text-amber-500" />
                        Jugadores
                      </span>
                      <span className="font-semibold">{match.current_players || 1}/{match.max_players}</span>
                    </div>
                    <Progress value={playerProgress} className="h-2 bg-amber-100" />
                  </div>

                  {/* Price & Join */}
                  <div className="flex items-center justify-between pt-2 border-t">
                    <div>
                      <p className="text-xs text-slate-500">Por persona</p>
                      <p className="text-xl font-bold text-teal-600">
                        {match.price_per_person > 0 ? `S/ ${match.price_per_person}` : "Gratis"}
                      </p>
                    </div>
                    <Button
                      onClick={() => handleQuickJoin(match)}
                      disabled={isJoining === match.id}
                      className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 shadow-lg shadow-amber-500/30"
                    >
                      {isJoining === match.id ? "..." : "Unirme ya"}
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-amber-50 rounded-xl p-6 text-center border border-amber-200">
          <Zap className="h-10 w-10 text-amber-400 mx-auto mb-2" />
          <p className="text-slate-600">No hay partidos rápidos con estos filtros</p>
          <Button 
            variant="link" 
            className="text-amber-600"
            onClick={() => { setSportFilter("all"); setTimeFilter("all"); setDistanceFilter("all"); }}
          >
            Limpiar filtros
          </Button>
        </div>
      )}

      {/* Quick Payment Modal */}
      <Dialog open={showPaymentModal} onOpenChange={setShowPaymentModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-amber-500" />
              Unirse a partido rápido
            </DialogTitle>
            <DialogDescription>
              Confirma tu participación y método de pago
            </DialogDescription>
          </DialogHeader>

          {selectedMatch && (
            <div className="space-y-4 py-4">
              {/* Match Summary */}
              <div className="bg-slate-50 rounded-xl p-4">
                <h4 className="font-semibold text-slate-800">{selectedMatch.title}</h4>
                <div className="flex items-center gap-3 mt-2 text-sm text-slate-600">
                  <span className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    {selectedMatch.time}
                  </span>
                  <Badge variant="outline">{sportLabels[selectedMatch.sport_type]}</Badge>
                </div>
              </div>

              {/* Time Warning */}
              <Alert className="border-amber-200 bg-amber-50">
                <AlertCircle className="h-4 w-4 text-amber-600" />
                <AlertDescription className="text-amber-800">
                  Este partido comienza pronto. Asegúrate de poder llegar a tiempo.
                </AlertDescription>
              </Alert>

              {/* Payment Method */}
              <div>
                <Label className="text-base font-medium">Método de pago</Label>
                <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod} className="mt-2">
                  <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-slate-50 cursor-pointer">
                    <RadioGroupItem value="efectivo" id="efectivo" />
                    <Label htmlFor="efectivo" className="flex items-center gap-2 cursor-pointer flex-1">
                      <Banknote className="h-5 w-5 text-green-600" />
                      Efectivo (pagar al llegar)
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-slate-50 cursor-pointer">
                    <RadioGroupItem value="yape" id="yape" />
                    <Label htmlFor="yape" className="flex items-center gap-2 cursor-pointer flex-1">
                      <CreditCard className="h-5 w-5 text-purple-600" />
                      Yape / Plin
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              {/* Total */}
              <div className="bg-teal-50 rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <span className="text-teal-800 font-medium">Total a pagar</span>
                  <span className="text-2xl font-bold text-teal-700">
                    S/ {selectedMatch.price_per_person}
                  </span>
                </div>
              </div>
            </div>
          )}

          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={() => setShowPaymentModal(false)}>
              Cancelar
            </Button>
            <Button 
              className="flex-1 bg-gradient-to-r from-amber-500 to-orange-500"
              onClick={handleConfirmPayment}
              disabled={isProcessing}
            >
              {isProcessing ? "Procesando..." : "Confirmar y unirme"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}