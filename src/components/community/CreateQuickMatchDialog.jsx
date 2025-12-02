import React, { useState } from "react";
import { format, addHours } from "date-fns";
import { Zap, Clock, MapPin, Users, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";

const SPORT_TYPES = [
  { value: "futbol", label: "Fútbol" },
  { value: "voley", label: "Vóley" },
  { value: "basquet", label: "Básquet" },
  { value: "futsal", label: "Futsal" },
  { value: "tenis", label: "Tenis" },
];

const QUICK_TIMES = [
  { label: "En 1 hora", hours: 1 },
  { label: "En 2 horas", hours: 2 },
  { label: "En 3 horas", hours: 3 },
];

export default function CreateQuickMatchDialog({ open, onClose, courts, onCreateMatch, isLoading }) {
  const [selectedTime, setSelectedTime] = useState(null);
  const [match, setMatch] = useState({
    title: "",
    description: "",
    sport_type: "futbol",
    court_id: "",
    court_name: "",
    court_address: "",
    max_players: 10,
    price_per_person: 10,
  });

  const handleTimeSelect = (hours) => {
    setSelectedTime(hours);
  };

  const getMatchDateTime = () => {
    if (!selectedTime) return null;
    const now = new Date();
    const matchTime = addHours(now, selectedTime);
    return {
      date: format(matchTime, 'yyyy-MM-dd'),
      time: format(matchTime, 'HH:mm')
    };
  };

  const handleCourtSelect = (courtId) => {
    if (courtId === "custom") {
      setMatch({ ...match, court_id: "", court_name: "", court_address: "" });
    } else {
      const court = courts.find(c => c.id === courtId);
      if (court) {
        setMatch({
          ...match,
          court_id: court.id,
          court_name: court.name,
          court_address: court.address
        });
      }
    }
  };

  const handleCreate = () => {
    if (!match.title || !selectedTime) return;
    
    const dateTime = getMatchDateTime();
    onCreateMatch({
      ...match,
      ...dateTime,
      is_quick_match: true
    });
  };

  const matchDateTime = getMatchDateTime();

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="p-2 bg-amber-100 rounded-lg">
              <Zap className="h-5 w-5 text-amber-600" />
            </div>
            Crear Partido Rápido
          </DialogTitle>
          <DialogDescription>
            Organiza un partido de última hora y encuentra jugadores rápidamente
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-4">
          {/* Quick Time Selection */}
          <div>
            <Label className="text-base font-medium">¿Cuándo juegas?</Label>
            <div className="grid grid-cols-3 gap-2 mt-2">
              {QUICK_TIMES.map(({ label, hours }) => (
                <button
                  key={hours}
                  type="button"
                  onClick={() => handleTimeSelect(hours)}
                  className={`p-3 rounded-xl border-2 text-center transition-all ${
                    selectedTime === hours
                      ? "border-amber-500 bg-amber-50 text-amber-700"
                      : "border-slate-200 hover:border-amber-300"
                  }`}
                >
                  <Clock className={`h-5 w-5 mx-auto mb-1 ${selectedTime === hours ? "text-amber-500" : "text-slate-400"}`} />
                  <p className="font-medium text-sm">{label}</p>
                </button>
              ))}
            </div>
            {matchDateTime && (
              <Badge className="mt-2 bg-amber-100 text-amber-700">
                {matchDateTime.time} hrs - Hoy
              </Badge>
            )}
          </div>

          {/* Title */}
          <div>
            <Label>Nombre del partido *</Label>
            <Input
              value={match.title}
              onChange={(e) => setMatch({ ...match, title: e.target.value })}
              placeholder="Ej: Pichanga urgente!"
              className="mt-1"
            />
          </div>

          {/* Sport & Players */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Deporte</Label>
              <Select value={match.sport_type} onValueChange={(v) => setMatch({ ...match, sport_type: v })}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SPORT_TYPES.map(s => (
                    <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Jugadores necesarios</Label>
              <Input
                type="number"
                value={match.max_players}
                onChange={(e) => setMatch({ ...match, max_players: parseInt(e.target.value) })}
                min={2}
                max={30}
                className="mt-1"
              />
            </div>
          </div>

          {/* Court Selection */}
          <div>
            <Label>¿Dónde juegan?</Label>
            <Select onValueChange={handleCourtSelect}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Selecciona cancha o ingresa una" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="custom">Ingresar manualmente</SelectItem>
                {courts.map(c => (
                  <SelectItem key={c.id} value={c.id}>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-slate-400" />
                      {c.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            {!match.court_id && (
              <div className="grid grid-cols-1 gap-2 mt-2">
                <Input
                  value={match.court_name}
                  onChange={(e) => setMatch({ ...match, court_name: e.target.value })}
                  placeholder="Nombre de la cancha"
                />
                <Input
                  value={match.court_address}
                  onChange={(e) => setMatch({ ...match, court_address: e.target.value })}
                  placeholder="Dirección"
                />
              </div>
            )}
          </div>

          {/* Price */}
          <div>
            <Label>Precio por persona (S/)</Label>
            <Input
              type="number"
              value={match.price_per_person}
              onChange={(e) => setMatch({ ...match, price_per_person: parseFloat(e.target.value) })}
              min={0}
              className="mt-1"
            />
            <p className="text-xs text-slate-500 mt-1">
              Ingresa 0 si es gratis
            </p>
          </div>

          {/* Description */}
          <div>
            <Label>Descripción (opcional)</Label>
            <Textarea
              value={match.description}
              onChange={(e) => setMatch({ ...match, description: e.target.value })}
              placeholder="Detalles adicionales..."
              className="mt-1"
              rows={2}
            />
          </div>
        </div>

        <div className="flex gap-3">
          <Button variant="outline" className="flex-1" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            className="flex-1 bg-gradient-to-r from-amber-500 to-orange-500"
            onClick={handleCreate}
            disabled={!match.title || !selectedTime || isLoading}
          >
            {isLoading ? "Creando..." : (
              <>
                <Zap className="h-4 w-4 mr-2" />
                Crear Partido
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}