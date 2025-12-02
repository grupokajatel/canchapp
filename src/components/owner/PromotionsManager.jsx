import React, { useState } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Trash2, Tag, Percent, Gift, Clock, Calendar, Copy } from "lucide-react";
import { toast } from "sonner";

const PROMO_TYPES = [
  { value: "percentage", label: "Descuento %", icon: Percent, description: "Porcentaje de descuento" },
  { value: "fixed", label: "Descuento fijo", icon: Tag, description: "Monto fijo de descuento" },
  { value: "package", label: "Paquete", icon: Gift, description: "Paquete de horas a precio especial" },
  { value: "2x1", label: "2x1", icon: Gift, description: "Segunda hora gratis" },
  { value: "free_hours", label: "Horas gratis", icon: Clock, description: "Horas de bonificación" }
];

const DAY_NAMES = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

export default function PromotionsManager({ promotions, courts, onCreate, onUpdate, onDelete, isLoading }) {
  const [showDialog, setShowDialog] = useState(false);
  const [editingPromo, setEditingPromo] = useState(null);
  const [newPromo, setNewPromo] = useState({
    title: "",
    description: "",
    type: "percentage",
    discount_value: 10,
    min_hours: 1,
    package_hours: 2,
    package_price: 80,
    valid_days: [0, 1, 2, 3, 4, 5, 6],
    valid_hours_start: 6,
    valid_hours_end: 23,
    start_date: format(new Date(), 'yyyy-MM-dd'),
    end_date: "",
    max_uses: null,
    code: "",
    court_id: "",
    is_active: true
  });

  const generateCode = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let code = "";
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setNewPromo({ ...newPromo, code });
  };

  const handleSave = () => {
    if (!newPromo.title) {
      toast.error("Ingresa un título");
      return;
    }

    const promoData = {
      ...newPromo,
      max_uses: newPromo.max_uses || null,
      end_date: newPromo.end_date || null,
      court_id: newPromo.court_id || null
    };

    if (editingPromo) {
      onUpdate(editingPromo.id, promoData);
    } else {
      onCreate(promoData);
    }
    setShowDialog(false);
    resetForm();
  };

  const resetForm = () => {
    setEditingPromo(null);
    setNewPromo({
      title: "", description: "", type: "percentage", discount_value: 10,
      min_hours: 1, package_hours: 2, package_price: 80,
      valid_days: [0, 1, 2, 3, 4, 5, 6], valid_hours_start: 6, valid_hours_end: 23,
      start_date: format(new Date(), 'yyyy-MM-dd'), end_date: "", max_uses: null,
      code: "", court_id: "", is_active: true
    });
  };

  const openEdit = (promo) => {
    setEditingPromo(promo);
    setNewPromo({
      title: promo.title,
      description: promo.description || "",
      type: promo.type,
      discount_value: promo.discount_value || 10,
      min_hours: promo.min_hours || 1,
      package_hours: promo.package_hours || 2,
      package_price: promo.package_price || 80,
      valid_days: promo.valid_days || [0, 1, 2, 3, 4, 5, 6],
      valid_hours_start: promo.valid_hours_start || 6,
      valid_hours_end: promo.valid_hours_end || 23,
      start_date: promo.start_date || format(new Date(), 'yyyy-MM-dd'),
      end_date: promo.end_date || "",
      max_uses: promo.max_uses || null,
      code: promo.code || "",
      court_id: promo.court_id || "",
      is_active: promo.is_active
    });
    setShowDialog(true);
  };

  const toggleDay = (dayIdx) => {
    setNewPromo(prev => ({
      ...prev,
      valid_days: prev.valid_days.includes(dayIdx)
        ? prev.valid_days.filter(d => d !== dayIdx)
        : [...prev.valid_days, dayIdx].sort()
    }));
  };

  const activePromos = promotions.filter(p => p.is_active);
  const inactivePromos = promotions.filter(p => !p.is_active);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-lg">Promociones</h3>
          <p className="text-sm text-slate-500">{activePromos.length} activas</p>
        </div>
        <Dialog open={showDialog} onOpenChange={(open) => { setShowDialog(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button className="bg-teal-600">
              <Plus className="h-4 w-4 mr-2" />
              Nueva promoción
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingPromo ? "Editar" : "Nueva"} promoción</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label>Título *</Label>
                <Input
                  value={newPromo.title}
                  onChange={(e) => setNewPromo({...newPromo, title: e.target.value})}
                  placeholder="Ej: Descuento de verano"
                  className="mt-1"
                />
              </div>

              <div>
                <Label>Descripción</Label>
                <Textarea
                  value={newPromo.description}
                  onChange={(e) => setNewPromo({...newPromo, description: e.target.value})}
                  placeholder="Descripción de la promoción..."
                  className="mt-1"
                />
              </div>

              <div>
                <Label>Tipo de promoción</Label>
                <Select value={newPromo.type} onValueChange={(v) => setNewPromo({...newPromo, type: v})}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PROMO_TYPES.map(t => (
                      <SelectItem key={t.value} value={t.value}>
                        <div className="flex items-center gap-2">
                          <t.icon className="h-4 w-4" />
                          {t.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Type-specific fields */}
              {newPromo.type === "percentage" && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Descuento (%)</Label>
                    <Input
                      type="number"
                      min={1}
                      max={100}
                      value={newPromo.discount_value}
                      onChange={(e) => setNewPromo({...newPromo, discount_value: parseInt(e.target.value)})}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label>Mínimo horas</Label>
                    <Input
                      type="number"
                      min={1}
                      value={newPromo.min_hours}
                      onChange={(e) => setNewPromo({...newPromo, min_hours: parseInt(e.target.value)})}
                      className="mt-1"
                    />
                  </div>
                </div>
              )}

              {newPromo.type === "fixed" && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Descuento (S/)</Label>
                    <Input
                      type="number"
                      min={1}
                      value={newPromo.discount_value}
                      onChange={(e) => setNewPromo({...newPromo, discount_value: parseInt(e.target.value)})}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label>Mínimo horas</Label>
                    <Input
                      type="number"
                      min={1}
                      value={newPromo.min_hours}
                      onChange={(e) => setNewPromo({...newPromo, min_hours: parseInt(e.target.value)})}
                      className="mt-1"
                    />
                  </div>
                </div>
              )}

              {newPromo.type === "package" && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Horas del paquete</Label>
                    <Input
                      type="number"
                      min={2}
                      value={newPromo.package_hours}
                      onChange={(e) => setNewPromo({...newPromo, package_hours: parseInt(e.target.value)})}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label>Precio del paquete (S/)</Label>
                    <Input
                      type="number"
                      min={1}
                      value={newPromo.package_price}
                      onChange={(e) => setNewPromo({...newPromo, package_price: parseInt(e.target.value)})}
                      className="mt-1"
                    />
                  </div>
                </div>
              )}

              <div>
                <Label>Aplicar a cancha</Label>
                <Select value={newPromo.court_id} onValueChange={(v) => setNewPromo({...newPromo, court_id: v})}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Todas las canchas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={null}>Todas las canchas</SelectItem>
                    {courts.map(c => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Valid days */}
              <div>
                <Label className="mb-2 block">Días válidos</Label>
                <div className="flex gap-1">
                  {DAY_NAMES.map((day, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => toggleDay(idx)}
                      className={`w-10 h-10 rounded-lg text-xs font-medium transition-all ${
                        newPromo.valid_days.includes(idx)
                          ? 'bg-teal-600 text-white'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {day}
                    </button>
                  ))}
                </div>
              </div>

              {/* Time range */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Hora inicio</Label>
                  <Select value={newPromo.valid_hours_start.toString()} onValueChange={(v) => setNewPromo({...newPromo, valid_hours_start: parseInt(v)})}>
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 18 }, (_, i) => i + 6).map(h => (
                        <SelectItem key={h} value={h.toString()}>{h}:00</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Hora fin</Label>
                  <Select value={newPromo.valid_hours_end.toString()} onValueChange={(v) => setNewPromo({...newPromo, valid_hours_end: parseInt(v)})}>
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 18 }, (_, i) => i + 6).map(h => (
                        <SelectItem key={h} value={h.toString()}>{h}:00</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Date range */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Fecha inicio</Label>
                  <Input
                    type="date"
                    value={newPromo.start_date}
                    onChange={(e) => setNewPromo({...newPromo, start_date: e.target.value})}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>Fecha fin (opcional)</Label>
                  <Input
                    type="date"
                    value={newPromo.end_date}
                    onChange={(e) => setNewPromo({...newPromo, end_date: e.target.value})}
                    className="mt-1"
                  />
                </div>
              </div>

              {/* Code and limits */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Código promocional</Label>
                  <div className="flex gap-2 mt-1">
                    <Input
                      value={newPromo.code}
                      onChange={(e) => setNewPromo({...newPromo, code: e.target.value.toUpperCase()})}
                      placeholder="VERANO2024"
                    />
                    <Button type="button" variant="outline" size="icon" onClick={generateCode}>
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div>
                  <Label>Máximo de usos</Label>
                  <Input
                    type="number"
                    min={1}
                    value={newPromo.max_uses || ""}
                    onChange={(e) => setNewPromo({...newPromo, max_uses: e.target.value ? parseInt(e.target.value) : null})}
                    placeholder="Ilimitado"
                    className="mt-1"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <Label>Promoción activa</Label>
                <Switch checked={newPromo.is_active} onCheckedChange={(v) => setNewPromo({...newPromo, is_active: v})} />
              </div>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => setShowDialog(false)}>Cancelar</Button>
              <Button className="flex-1 bg-teal-600" onClick={handleSave} disabled={isLoading}>
                {isLoading ? "Guardando..." : "Guardar"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Promotions List */}
      {promotions.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Gift className="h-12 w-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500">No tienes promociones creadas</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {activePromos.map(promo => (
            <PromoCard key={promo.id} promo={promo} courts={courts} onEdit={openEdit} onDelete={onDelete} />
          ))}
          {inactivePromos.length > 0 && (
            <>
              <p className="text-sm text-slate-500 font-medium pt-4">Inactivas</p>
              {inactivePromos.map(promo => (
                <PromoCard key={promo.id} promo={promo} courts={courts} onEdit={openEdit} onDelete={onDelete} />
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
}

function PromoCard({ promo, courts, onEdit, onDelete }) {
  const typeConfig = PROMO_TYPES.find(t => t.value === promo.type);
  const court = courts.find(c => c.id === promo.court_id);

  return (
    <Card className={!promo.is_active ? "opacity-60" : ""}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <div className={`p-2 rounded-lg ${promo.is_active ? 'bg-teal-100' : 'bg-slate-100'}`}>
              {typeConfig && <typeConfig.icon className={`h-5 w-5 ${promo.is_active ? 'text-teal-600' : 'text-slate-400'}`} />}
            </div>
            <div>
              <h4 className="font-semibold">{promo.title}</h4>
              <p className="text-sm text-slate-500">{promo.description || typeConfig?.description}</p>
              <div className="flex flex-wrap gap-2 mt-2">
                <Badge variant="outline">{typeConfig?.label}</Badge>
                {promo.code && <Badge className="bg-purple-100 text-purple-700">{promo.code}</Badge>}
                {court && <Badge variant="secondary">{court.name}</Badge>}
                {promo.max_uses && (
                  <Badge variant="secondary">{promo.current_uses || 0}/{promo.max_uses} usos</Badge>
                )}
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={() => onEdit(promo)}>Editar</Button>
            <Button variant="ghost" size="icon" className="text-red-500" onClick={() => onDelete(promo.id)}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}