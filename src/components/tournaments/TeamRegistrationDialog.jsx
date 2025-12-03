import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Users, Plus, X, Trophy, Phone } from "lucide-react";
import { toast } from "sonner";

export default function TeamRegistrationDialog({ 
  open, 
  onClose, 
  onRegister, 
  isRegistering, 
  tournament,
  user 
}) {
  const [teamName, setTeamName] = useState("");
  const [captainPhone, setCaptainPhone] = useState(user?.phone || "");
  const [players, setPlayers] = useState([
    { name: user?.full_name || "", nickname: user?.nickname || "", number: "", position: "" }
  ]);

  const addPlayer = () => {
    if (players.length >= (tournament?.max_players_per_team || 20)) {
      toast.error(`Máximo ${tournament?.max_players_per_team} jugadores`);
      return;
    }
    setPlayers([...players, { name: "", nickname: "", number: "", position: "" }]);
  };

  const removePlayer = (index) => {
    if (index === 0) return; // Can't remove captain
    setPlayers(players.filter((_, i) => i !== index));
  };

  const updatePlayer = (index, field, value) => {
    const updated = [...players];
    updated[index] = { ...updated[index], [field]: value };
    setPlayers(updated);
  };

  const handleSubmit = () => {
    if (!teamName.trim()) {
      toast.error("Ingresa el nombre del equipo");
      return;
    }
    if (players.length < (tournament?.min_players_per_team || 1)) {
      toast.error(`Mínimo ${tournament?.min_players_per_team} jugadores`);
      return;
    }

    onRegister({
      name: teamName,
      captain_phone: captainPhone,
      players: players.map((p, i) => ({
        ...p,
        user_id: i === 0 ? user?.id : null
      }))
    });
  };

  if (!tournament) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-orange-500" />
            Inscribir Equipo
          </DialogTitle>
          <DialogDescription>
            Registra tu equipo en {tournament.name}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Team Name */}
          <div>
            <Label>Nombre del equipo *</Label>
            <Input
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              placeholder="Los Invencibles FC"
              className="mt-1"
            />
          </div>

          {/* Captain Phone */}
          <div>
            <Label>Teléfono del capitán</Label>
            <Input
              value={captainPhone}
              onChange={(e) => setCaptainPhone(e.target.value)}
              placeholder="999 999 999"
              className="mt-1"
            />
          </div>

          {/* Registration Fee */}
          {tournament.registration_fee > 0 && (
            <div className="p-4 bg-orange-50 rounded-xl">
              <p className="text-sm text-orange-700">
                <strong>Inscripción:</strong> S/ {tournament.registration_fee}
              </p>
              <p className="text-xs text-orange-600 mt-1">
                El pago se coordinará con el organizador
              </p>
            </div>
          )}

          {/* Players */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <Label className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Jugadores ({players.length}/{tournament.max_players_per_team || 20})
              </Label>
              <Badge variant="outline">
                Mín: {tournament.min_players_per_team || 1}
              </Badge>
            </div>

            <div className="space-y-3 max-h-60 overflow-y-auto">
              {players.map((player, idx) => (
                <div 
                  key={idx} 
                  className={`p-3 rounded-lg border ${idx === 0 ? 'bg-orange-50 border-orange-200' : 'bg-slate-50'}`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">
                      {idx === 0 ? "Capitán (Tú)" : `Jugador ${idx + 1}`}
                    </span>
                    {idx > 0 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removePlayer(idx)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      placeholder="Nombre"
                      value={player.name}
                      onChange={(e) => updatePlayer(idx, "name", e.target.value)}
                      disabled={idx === 0}
                    />
                    <Input
                      placeholder="Nickname"
                      value={player.nickname}
                      onChange={(e) => updatePlayer(idx, "nickname", e.target.value)}
                    />
                    <Input
                      placeholder="Número"
                      value={player.number}
                      onChange={(e) => updatePlayer(idx, "number", e.target.value)}
                      type="number"
                    />
                    <Input
                      placeholder="Posición"
                      value={player.position}
                      onChange={(e) => updatePlayer(idx, "position", e.target.value)}
                    />
                  </div>
                </div>
              ))}
            </div>

            <Button
              variant="outline"
              className="w-full mt-3"
              onClick={addPlayer}
              disabled={players.length >= (tournament.max_players_per_team || 20)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Agregar Jugador
            </Button>
          </div>
        </div>

        <div className="flex gap-3">
          <Button variant="outline" className="flex-1" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            className="flex-1 bg-orange-600 hover:bg-orange-700"
            onClick={handleSubmit}
            disabled={isRegistering}
          >
            {isRegistering ? "Registrando..." : "Inscribir Equipo"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}