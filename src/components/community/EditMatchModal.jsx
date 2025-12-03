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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Save, X } from "lucide-react";

const SPORT_TYPES = [
  { value: "futbol", label: "Fútbol" },
  { value: "voley", label: "Vóley" },
  { value: "basquet", label: "Básquet" },
  { value: "futsal", label: "Futsal" },
  { value: "tenis", label: "Tenis" },
  { value: "otro", label: "Otro" },
];

export default function EditMatchModal({ 
  match, 
  open, 
  onClose, 
  onSave, 
  isSaving,
  courts = [] 
}) {
  const [formData, setFormData] = useState({});

  useEffect(() => {
    if (match) {
      setFormData({
        title: match.title || "",
        description: match.description || "",
        sport_type: match.sport_type || "futbol",
        date: match.date || "",
        time: match.time || "",
        max_players: match.max_players || 10,
        price_per_person: match.price_per_person || 0,
        bet_amount: match.bet_amount || 0,
        court_id: match.court_id || "",
        court_name: match.court_name || "",
        court_address: match.court_address || "",
        status: match.status || "open"
      });
    }
  }, [match]);

  if (!match) return null;

  const handleSave = () => {
    if (!formData.title || !formData.date || !formData.time) {
      return;
    }
    onSave(match.id, formData);
  };

  const handleCourtChange = (courtId) => {
    if (courtId === "manual") {
      setFormData({ ...formData, court_id: "", court_name: "", court_address: "" });
    } else {
      const selectedCourt = courts.find(c => c.id === courtId);
      if (selectedCourt) {
        setFormData({
          ...formData,
          court_id: selectedCourt.id,
          court_name: selectedCourt.name,
          court_address: selectedCourt.address,
          court_latitude: selectedCourt.latitude,
          court_longitude: selectedCourt.longitude
        });
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Partido</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div>
            <Label>Título *</Label>
            <Input
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="mt-1"
            />
          </div>

          <div>
            <Label>Descripción</Label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="mt-1"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Deporte</Label>
              <Select
                value={formData.sport_type}
                onValueChange={(v) => setFormData({ ...formData, sport_type: v })}
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
              <Label>Máx. jugadores</Label>
              <Input
                type="number"
                value={formData.max_players}
                onChange={(e) => setFormData({ ...formData, max_players: parseInt(e.target.value) })}
                min={2}
                className="mt-1"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Fecha *</Label>
              <Input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="mt-1"
              />
            </div>
            <div>
              <Label>Hora *</Label>
              <Input
                type="time"
                value={formData.time}
                onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                className="mt-1"
              />
            </div>
          </div>

          <div>
            <Label>Cancha</Label>
            <Select
              value={formData.court_id || "manual"}
              onValueChange={handleCourtChange}
            >
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Selecciona" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="manual">Ingresar manualmente</SelectItem>
                {courts.map(court => (
                  <SelectItem key={court.id} value={court.id}>
                    {court.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {!formData.court_id && (
            <>
              <div>
                <Label>Nombre de la cancha</Label>
                <Input
                  value={formData.court_name}
                  onChange={(e) => setFormData({ ...formData, court_name: e.target.value })}
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Dirección</Label>
                <Input
                  value={formData.court_address}
                  onChange={(e) => setFormData({ ...formData, court_address: e.target.value })}
                  className="mt-1"
                />
              </div>
            </>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Precio por persona (S/)</Label>
              <Input
                type="number"
                value={formData.price_per_person}
                onChange={(e) => setFormData({ ...formData, price_per_person: parseFloat(e.target.value) })}
                min={0}
                className="mt-1"
              />
            </div>
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
                  <SelectItem value="open">Abierto</SelectItem>
                  <SelectItem value="full">Completo</SelectItem>
                  <SelectItem value="cancelled">Cancelado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <Button variant="outline" className="flex-1" onClick={onClose}>
            <X className="h-4 w-4 mr-2" />
            Cancelar
          </Button>
          <Button
            className="flex-1 bg-teal-600 hover:bg-teal-700"
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