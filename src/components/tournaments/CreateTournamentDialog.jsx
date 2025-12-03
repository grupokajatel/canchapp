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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Trophy, Calendar, Users, DollarSign } from "lucide-react";
import { toast } from "sonner";

const SPORT_TYPES = [
  { value: "futbol", label: "Fútbol" },
  { value: "voley", label: "Vóley" },
  { value: "basquet", label: "Básquet" },
  { value: "futsal", label: "Futsal" },
  { value: "tenis", label: "Tenis" },
  { value: "otro", label: "Otro" },
];

const TOURNAMENT_TYPES = [
  { value: "knockout", label: "Eliminación Directa", desc: "Pierde y queda eliminado" },
  { value: "league", label: "Liga", desc: "Todos contra todos" },
  { value: "groups_knockout", label: "Grupos + Eliminación", desc: "Fase de grupos y luego eliminatoria" },
];

export default function CreateTournamentDialog({ open, onClose, onCreate, isCreating, user }) {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    sport_type: "futbol",
    tournament_type: "knockout",
    start_date: "",
    end_date: "",
    registration_deadline: "",
    max_teams: 8,
    min_players_per_team: 5,
    max_players_per_team: 15,
    registration_fee: 0,
    prize_description: "",
    rules: "",
    location: "",
    groups_count: 2,
    teams_advancing_per_group: 2
  });

  const handleCreate = () => {
    if (!formData.name || !formData.start_date) {
      toast.error("Completa los campos requeridos");
      return;
    }
    onCreate(formData);
  };

  const updateField = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-orange-500" />
            Crear Torneo
          </DialogTitle>
          <DialogDescription>
            {step === 1 ? "Información básica" : "Configuración avanzada"}
          </DialogDescription>
        </DialogHeader>

        {step === 1 ? (
          <div className="space-y-4 py-4">
            <div>
              <Label>Nombre del torneo *</Label>
              <Input
                value={formData.name}
                onChange={(e) => updateField("name", e.target.value)}
                placeholder="Copa Verano 2024"
                className="mt-1"
              />
            </div>

            <div>
              <Label>Descripción</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => updateField("description", e.target.value)}
                placeholder="Describe tu torneo..."
                className="mt-1"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Deporte *</Label>
                <Select
                  value={formData.sport_type}
                  onValueChange={(v) => updateField("sport_type", v)}
                >
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
                <Label>Formato *</Label>
                <Select
                  value={formData.tournament_type}
                  onValueChange={(v) => updateField("tournament_type", v)}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TOURNAMENT_TYPES.map(t => (
                      <SelectItem key={t.value} value={t.value}>
                        {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Fecha inicio *</Label>
                <Input
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => updateField("start_date", e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Fecha fin</Label>
                <Input
                  type="date"
                  value={formData.end_date}
                  onChange={(e) => updateField("end_date", e.target.value)}
                  className="mt-1"
                />
              </div>
            </div>

            <div>
              <Label>Cierre de inscripciones</Label>
              <Input
                type="date"
                value={formData.registration_deadline}
                onChange={(e) => updateField("registration_deadline", e.target.value)}
                className="mt-1"
              />
            </div>

            <div>
              <Label>Ubicación</Label>
              <Input
                value={formData.location}
                onChange={(e) => updateField("location", e.target.value)}
                placeholder="Ej: Complejo Deportivo San Juan"
                className="mt-1"
              />
            </div>

            <div className="flex gap-3 pt-4">
              <Button variant="outline" className="flex-1" onClick={onClose}>
                Cancelar
              </Button>
              <Button 
                className="flex-1 bg-orange-600 hover:bg-orange-700"
                onClick={() => setStep(2)}
              >
                Siguiente
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Máximo equipos</Label>
                <Input
                  type="number"
                  value={formData.max_teams}
                  onChange={(e) => updateField("max_teams", parseInt(e.target.value))}
                  min={2}
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Inscripción (S/)</Label>
                <Input
                  type="number"
                  value={formData.registration_fee}
                  onChange={(e) => updateField("registration_fee", parseFloat(e.target.value))}
                  min={0}
                  className="mt-1"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Mín. jugadores/equipo</Label>
                <Input
                  type="number"
                  value={formData.min_players_per_team}
                  onChange={(e) => updateField("min_players_per_team", parseInt(e.target.value))}
                  min={1}
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Máx. jugadores/equipo</Label>
                <Input
                  type="number"
                  value={formData.max_players_per_team}
                  onChange={(e) => updateField("max_players_per_team", parseInt(e.target.value))}
                  min={1}
                  className="mt-1"
                />
              </div>
            </div>

            {formData.tournament_type === "groups_knockout" && (
              <div className="grid grid-cols-2 gap-4 p-3 bg-orange-50 rounded-lg">
                <div>
                  <Label>Número de grupos</Label>
                  <Input
                    type="number"
                    value={formData.groups_count}
                    onChange={(e) => updateField("groups_count", parseInt(e.target.value))}
                    min={2}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>Avanzan por grupo</Label>
                  <Input
                    type="number"
                    value={formData.teams_advancing_per_group}
                    onChange={(e) => updateField("teams_advancing_per_group", parseInt(e.target.value))}
                    min={1}
                    className="mt-1"
                  />
                </div>
              </div>
            )}

            <div>
              <Label>Premio</Label>
              <Input
                value={formData.prize_description}
                onChange={(e) => updateField("prize_description", e.target.value)}
                placeholder="Ej: Trofeo + S/ 500"
                className="mt-1"
              />
            </div>

            <div>
              <Label>Reglas</Label>
              <Textarea
                value={formData.rules}
                onChange={(e) => updateField("rules", e.target.value)}
                placeholder="Reglas y condiciones del torneo..."
                className="mt-1 h-24"
              />
            </div>

            <div className="flex gap-3 pt-4">
              <Button variant="outline" className="flex-1" onClick={() => setStep(1)}>
                Atrás
              </Button>
              <Button 
                className="flex-1 bg-orange-600 hover:bg-orange-700"
                onClick={handleCreate}
                disabled={isCreating}
              >
                {isCreating ? "Creando..." : "Crear Torneo"}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}