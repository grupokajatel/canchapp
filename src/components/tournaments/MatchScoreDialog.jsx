import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Trophy, Save } from "lucide-react";

export default function MatchScoreDialog({ open, onClose, match, onSave, isSaving }) {
  const [formData, setFormData] = useState({
    home_score: 0,
    away_score: 0,
    home_penalties: null,
    away_penalties: null,
    date: "",
    time: "",
    status: "scheduled"
  });

  useEffect(() => {
    if (match) {
      setFormData({
        home_score: match.home_score ?? 0,
        away_score: match.away_score ?? 0,
        home_penalties: match.home_penalties ?? null,
        away_penalties: match.away_penalties ?? null,
        date: match.date || "",
        time: match.time || "",
        status: match.status || "scheduled"
      });
    }
  }, [match]);

  if (!match) return null;

  const handleSave = () => {
    const data = { ...formData };
    
    // Determine winner
    if (formData.status === "completed") {
      if (formData.home_penalties !== null && formData.away_penalties !== null) {
        // Penalties
        data.winner_id = formData.home_penalties > formData.away_penalties 
          ? match.home_team_id 
          : match.away_team_id;
      } else if (formData.home_score !== formData.away_score) {
        data.winner_id = formData.home_score > formData.away_score 
          ? match.home_team_id 
          : match.away_team_id;
      }
    }

    onSave(match.id, data);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-orange-500" />
            Editar Partido
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Teams Display */}
          <div className="text-center p-4 bg-slate-50 rounded-xl">
            <p className="font-semibold">{match.home_team_name}</p>
            <p className="text-sm text-slate-500">vs</p>
            <p className="font-semibold">{match.away_team_name}</p>
          </div>

          {/* Date & Time */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Fecha</Label>
              <Input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="mt-1"
              />
            </div>
            <div>
              <Label>Hora</Label>
              <Input
                type="time"
                value={formData.time}
                onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                className="mt-1"
              />
            </div>
          </div>

          {/* Score */}
          <div>
            <Label>Resultado</Label>
            <div className="flex items-center gap-4 mt-2">
              <div className="flex-1 text-center">
                <p className="text-sm text-slate-500 mb-1">{match.home_team_name}</p>
                <Input
                  type="number"
                  value={formData.home_score}
                  onChange={(e) => setFormData({ ...formData, home_score: parseInt(e.target.value) || 0 })}
                  min={0}
                  className="text-center text-2xl font-bold h-14"
                />
              </div>
              <span className="text-2xl font-bold text-slate-300">-</span>
              <div className="flex-1 text-center">
                <p className="text-sm text-slate-500 mb-1">{match.away_team_name}</p>
                <Input
                  type="number"
                  value={formData.away_score}
                  onChange={(e) => setFormData({ ...formData, away_score: parseInt(e.target.value) || 0 })}
                  min={0}
                  className="text-center text-2xl font-bold h-14"
                />
              </div>
            </div>
          </div>

          {/* Penalties (if tied) */}
          {formData.home_score === formData.away_score && formData.status === "completed" && (
            <div className="p-4 bg-amber-50 rounded-xl">
              <Label className="text-amber-700">Penales (si aplica)</Label>
              <div className="flex items-center gap-4 mt-2">
                <Input
                  type="number"
                  value={formData.home_penalties ?? ""}
                  onChange={(e) => setFormData({ ...formData, home_penalties: parseInt(e.target.value) || null })}
                  min={0}
                  placeholder="Local"
                  className="text-center"
                />
                <span>-</span>
                <Input
                  type="number"
                  value={formData.away_penalties ?? ""}
                  onChange={(e) => setFormData({ ...formData, away_penalties: parseInt(e.target.value) || null })}
                  min={0}
                  placeholder="Visit."
                  className="text-center"
                />
              </div>
            </div>
          )}

          {/* Status */}
          <div>
            <Label>Estado</Label>
            <Select
              value={formData.status}
              onValueChange={(v) => setFormData({ ...formData, status: v })}
            >
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="scheduled">Programado</SelectItem>
                <SelectItem value="in_progress">En Juego</SelectItem>
                <SelectItem value="completed">Finalizado</SelectItem>
                <SelectItem value="postponed">Aplazado</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex gap-3">
          <Button variant="outline" className="flex-1" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            className="flex-1 bg-orange-600 hover:bg-orange-700"
            onClick={handleSave}
            disabled={isSaving}
          >
            <Save className="h-4 w-4 mr-2" />
            {isSaving ? "Guardando..." : "Guardar"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}