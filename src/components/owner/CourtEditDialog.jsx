import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import CourtPhotoUploader from "./CourtPhotoUploader";

const DEPARTMENTS = ["Lima", "Arequipa", "Cusco", "Trujillo", "Chiclayo", "Piura", "Iquitos", "Tacna", "Huancayo", "Puno", "Cajamarca", "Ayacucho", "Ica"];
const SPORTS = [
  { value: "futbol", label: "Fútbol" },
  { value: "voley", label: "Vóley" },
  { value: "basquet", label: "Básquet" },
  { value: "futsal", label: "Futsal" },
  { value: "tenis", label: "Tenis" },
];
const AMENITIES_OPTIONS = ["Wifi", "Estacionamiento", "Duchas", "Vestuarios", "Cafetería", "Tribuna", "Iluminación"];

export default function CourtEditDialog({ court, open, onClose, onSave, isLoading }) {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    sport_type: "futbol",
    address: "",
    department: "Lima",
    phone: "",
    price_per_hour: 50,
    night_price_per_hour: 70,
    night_price_enabled: false,
    opening_hour: 6,
    closing_hour: 23,
    photos: [],
    amenities: [],
    latitude: null,
    longitude: null,
  });

  useEffect(() => {
    if (court) {
      setFormData({
        name: court.name || "",
        description: court.description || "",
        sport_type: court.sport_type || "futbol",
        address: court.address || "",
        department: court.department || "Lima",
        phone: court.phone || "",
        price_per_hour: court.price_per_hour || 50,
        night_price_per_hour: court.night_price_per_hour || 70,
        night_price_enabled: court.night_price_enabled || false,
        opening_hour: court.opening_hour || 6,
        closing_hour: court.closing_hour || 23,
        photos: court.photos || [],
        amenities: court.amenities || [],
        latitude: court.latitude || null,
        longitude: court.longitude || null,
      });
    }
  }, [court]);

  const handleAmenityToggle = (amenity) => {
    setFormData(prev => ({
      ...prev,
      amenities: prev.amenities.includes(amenity)
        ? prev.amenities.filter(a => a !== amenity)
        : [...prev.amenities, amenity]
    }));
  };

  const handleSubmit = () => {
    onSave(court.id, formData);
  };

  const hours = Array.from({ length: 18 }, (_, i) => i + 6); // 6am to 11pm

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Cancha</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <Label>Nombre de la cancha *</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="mt-1"
              />
            </div>

            <div className="md:col-span-2">
              <Label>Descripción</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="mt-1"
                rows={3}
              />
            </div>

            <div>
              <Label>Tipo de deporte</Label>
              <Select value={formData.sport_type} onValueChange={(v) => setFormData({ ...formData, sport_type: v })}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SPORTS.map(s => (
                    <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Departamento</Label>
              <Select value={formData.department} onValueChange={(v) => setFormData({ ...formData, department: v })}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DEPARTMENTS.map(d => (
                    <SelectItem key={d} value={d}>{d}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="md:col-span-2">
              <Label>Dirección *</Label>
              <Input
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="mt-1"
              />
            </div>

            <div>
              <Label>Teléfono *</Label>
              <Input
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="mt-1"
              />
            </div>
          </div>

          {/* Pricing */}
          <div className="space-y-4">
            <h3 className="font-semibold text-slate-700">Precios</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Precio por hora (S/)</Label>
                <Input
                  type="number"
                  value={formData.price_per_hour}
                  onChange={(e) => setFormData({ ...formData, price_per_hour: parseInt(e.target.value) || 0 })}
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Precio nocturno (S/)</Label>
                <Input
                  type="number"
                  value={formData.night_price_per_hour}
                  onChange={(e) => setFormData({ ...formData, night_price_per_hour: parseInt(e.target.value) || 0 })}
                  className="mt-1"
                  disabled={!formData.night_price_enabled}
                />
              </div>
            </div>
            <div className="flex items-center justify-between bg-slate-50 rounded-lg p-3">
              <Label className="cursor-pointer">Habilitar precio nocturno (después de las 6pm)</Label>
              <Switch
                checked={formData.night_price_enabled}
                onCheckedChange={(v) => setFormData({ ...formData, night_price_enabled: v })}
              />
            </div>
          </div>

          {/* Hours */}
          <div className="space-y-4">
            <h3 className="font-semibold text-slate-700">Horario de atención</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Hora de apertura</Label>
                <Select value={formData.opening_hour.toString()} onValueChange={(v) => setFormData({ ...formData, opening_hour: parseInt(v) })}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {hours.map(h => (
                      <SelectItem key={h} value={h.toString()}>{h}:00</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Hora de cierre</Label>
                <Select value={formData.closing_hour.toString()} onValueChange={(v) => setFormData({ ...formData, closing_hour: parseInt(v) })}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {hours.map(h => (
                      <SelectItem key={h} value={h.toString()}>{h}:00</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Amenities */}
          <div className="space-y-4">
            <h3 className="font-semibold text-slate-700">Servicios disponibles</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {AMENITIES_OPTIONS.map(amenity => (
                <div key={amenity} className="flex items-center space-x-2">
                  <Checkbox
                    id={amenity}
                    checked={formData.amenities.includes(amenity)}
                    onCheckedChange={() => handleAmenityToggle(amenity)}
                  />
                  <Label htmlFor={amenity} className="cursor-pointer text-sm">{amenity}</Label>
                </div>
              ))}
            </div>
          </div>

          {/* Photos */}
          <div className="space-y-4">
            <h3 className="font-semibold text-slate-700">Fotografías</h3>
            <CourtPhotoUploader
              photos={formData.photos}
              onPhotosChange={(photos) => setFormData({ ...formData, photos })}
            />
          </div>

          {/* Location */}
          <div className="space-y-4">
            <h3 className="font-semibold text-slate-700">Ubicación GPS (opcional)</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Latitud</Label>
                <Input
                  type="number"
                  step="any"
                  value={formData.latitude || ""}
                  onChange={(e) => setFormData({ ...formData, latitude: parseFloat(e.target.value) || null })}
                  placeholder="-12.0464"
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Longitud</Label>
                <Input
                  type="number"
                  step="any"
                  value={formData.longitude || ""}
                  onChange={(e) => setFormData({ ...formData, longitude: parseFloat(e.target.value) || null })}
                  placeholder="-77.0428"
                  className="mt-1"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-3 pt-4 border-t">
          <Button variant="outline" className="flex-1" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            className="flex-1 bg-teal-600 hover:bg-teal-700"
            onClick={handleSubmit}
            disabled={isLoading || !formData.name || !formData.address || !formData.phone}
          >
            {isLoading ? "Guardando..." : "Guardar cambios"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}