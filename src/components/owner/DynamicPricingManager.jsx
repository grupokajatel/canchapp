import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Trash2, DollarSign, Clock, Calendar } from "lucide-react";
import { toast } from "sonner";

const DAY_NAMES = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
const DAY_SHORT = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

export default function DynamicPricingManager({ court, pricingRules, onSave, onDelete, isLoading }) {
  const [showDialog, setShowDialog] = useState(false);
  const [editingRule, setEditingRule] = useState(null);
  const [newRule, setNewRule] = useState({
    day_of_week: 0,
    hour: null,
    price_modifier: 1.0,
    fixed_price: null,
    is_active: true,
    apply_all_hours: true
  });

  const courtRules = pricingRules.filter(r => r.court_id === court?.id);

  const handleSaveRule = () => {
    if (!court) return;
    
    const ruleData = {
      court_id: court.id,
      day_of_week: newRule.day_of_week,
      hour: newRule.apply_all_hours ? null : newRule.hour,
      price_modifier: newRule.fixed_price ? null : newRule.price_modifier,
      fixed_price: newRule.fixed_price || null,
      is_active: newRule.is_active
    };

    onSave(ruleData, editingRule?.id);
    setShowDialog(false);
    setEditingRule(null);
    setNewRule({ day_of_week: 0, hour: null, price_modifier: 1.0, fixed_price: null, is_active: true, apply_all_hours: true });
  };

  const openEditDialog = (rule) => {
    setEditingRule(rule);
    setNewRule({
      day_of_week: rule.day_of_week,
      hour: rule.hour,
      price_modifier: rule.price_modifier || 1.0,
      fixed_price: rule.fixed_price,
      is_active: rule.is_active,
      apply_all_hours: rule.hour === null
    });
    setShowDialog(true);
  };

  const getEffectivePrice = (basePrice, rule) => {
    if (rule.fixed_price) return rule.fixed_price;
    return basePrice * (rule.price_modifier || 1);
  };

  // Build pricing grid for visualization
  const pricingGrid = Array.from({ length: 7 }, (_, dayIdx) => {
    const dayRules = courtRules.filter(r => r.day_of_week === dayIdx && r.is_active);
    return {
      day: dayIdx,
      hasRules: dayRules.length > 0,
      rules: dayRules
    };
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-lg">Precios dinámicos</h3>
          <p className="text-sm text-slate-500">Configura precios por día y hora para {court?.name}</p>
        </div>
        <Dialog open={showDialog} onOpenChange={(open) => { setShowDialog(open); if (!open) { setEditingRule(null); } }}>
          <DialogTrigger asChild>
            <Button className="bg-teal-600">
              <Plus className="h-4 w-4 mr-2" />
              Nueva regla
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingRule ? "Editar" : "Nueva"} regla de precio</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label>Día de la semana</Label>
                <Select value={newRule.day_of_week.toString()} onValueChange={(v) => setNewRule({...newRule, day_of_week: parseInt(v)})}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DAY_NAMES.map((day, idx) => (
                      <SelectItem key={idx} value={idx.toString()}>{day}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-2">
                <Checkbox 
                  checked={newRule.apply_all_hours} 
                  onCheckedChange={(v) => setNewRule({...newRule, apply_all_hours: v, hour: v ? null : 8})}
                />
                <Label>Aplicar a todas las horas del día</Label>
              </div>

              {!newRule.apply_all_hours && (
                <div>
                  <Label>Hora específica</Label>
                  <Select value={(newRule.hour || 8).toString()} onValueChange={(v) => setNewRule({...newRule, hour: parseInt(v)})}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 17 }, (_, i) => i + 6).map(h => (
                        <SelectItem key={h} value={h.toString()}>{h}:00</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Modificador de precio (%)</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <Input
                      type="number"
                      step="0.05"
                      min="0.5"
                      max="2"
                      value={newRule.price_modifier}
                      onChange={(e) => setNewRule({...newRule, price_modifier: parseFloat(e.target.value), fixed_price: null})}
                      disabled={!!newRule.fixed_price}
                    />
                    <span className="text-sm text-slate-500">= {((newRule.price_modifier - 1) * 100).toFixed(0)}%</span>
                  </div>
                </div>
                <div>
                  <Label>O precio fijo (S/)</Label>
                  <Input
                    type="number"
                    value={newRule.fixed_price || ""}
                    onChange={(e) => setNewRule({...newRule, fixed_price: e.target.value ? parseFloat(e.target.value) : null})}
                    placeholder="Opcional"
                    className="mt-1"
                  />
                </div>
              </div>

              {court && (
                <div className="p-4 bg-teal-50 rounded-xl">
                  <p className="text-sm text-teal-600">Precio resultante</p>
                  <p className="text-2xl font-bold text-teal-700">
                    S/ {getEffectivePrice(court.price_per_hour, newRule).toFixed(0)}/h
                  </p>
                  <p className="text-xs text-teal-600 mt-1">
                    Base: S/ {court.price_per_hour}/h
                  </p>
                </div>
              )}

              <div className="flex items-center justify-between">
                <Label>Regla activa</Label>
                <Switch checked={newRule.is_active} onCheckedChange={(v) => setNewRule({...newRule, is_active: v})} />
              </div>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => setShowDialog(false)}>Cancelar</Button>
              <Button className="flex-1 bg-teal-600" onClick={handleSaveRule} disabled={isLoading}>
                {isLoading ? "Guardando..." : "Guardar"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Pricing Grid Visualization */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Vista semanal de precios</CardTitle>
          <CardDescription>Precio base: S/ {court?.price_per_hour}/h</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-2">
            {pricingGrid.map(({ day, hasRules, rules }) => (
              <div 
                key={day} 
                className={`p-3 rounded-xl border-2 transition-all cursor-pointer ${
                  hasRules ? 'border-teal-300 bg-teal-50' : 'border-slate-200 hover:border-slate-300'
                }`}
                onClick={() => {
                  setNewRule({ ...newRule, day_of_week: day });
                  setShowDialog(true);
                }}
              >
                <p className="text-xs font-medium text-center mb-2">{DAY_SHORT[day]}</p>
                {hasRules ? (
                  <div className="space-y-1">
                    {rules.slice(0, 2).map((rule, idx) => (
                      <Badge 
                        key={idx} 
                        className={`text-[10px] w-full justify-center ${rule.is_active ? 'bg-teal-100 text-teal-700' : 'bg-slate-100 text-slate-500'}`}
                      >
                        {rule.hour !== null ? `${rule.hour}h` : "Todo"}: 
                        {rule.fixed_price ? ` S/${rule.fixed_price}` : ` ${((rule.price_modifier - 1) * 100).toFixed(0)}%`}
                      </Badge>
                    ))}
                    {rules.length > 2 && (
                      <p className="text-[10px] text-center text-teal-600">+{rules.length - 2} más</p>
                    )}
                  </div>
                ) : (
                  <p className="text-xs text-center text-slate-400">Base</p>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Rules List */}
      {courtRules.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Reglas configuradas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {courtRules.map(rule => (
                <div 
                  key={rule.id} 
                  className={`flex items-center justify-between p-3 rounded-lg border ${rule.is_active ? 'bg-white' : 'bg-slate-50 opacity-60'}`}
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-slate-100 rounded-lg">
                      {rule.hour !== null ? <Clock className="h-4 w-4 text-slate-600" /> : <Calendar className="h-4 w-4 text-slate-600" />}
                    </div>
                    <div>
                      <p className="font-medium text-sm">
                        {DAY_NAMES[rule.day_of_week]}
                        {rule.hour !== null && ` a las ${rule.hour}:00`}
                      </p>
                      <p className="text-xs text-slate-500">
                        {rule.fixed_price 
                          ? `Precio fijo: S/ ${rule.fixed_price}` 
                          : `Modificador: ${rule.price_modifier > 1 ? '+' : ''}${((rule.price_modifier - 1) * 100).toFixed(0)}%`
                        }
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={rule.is_active ? "default" : "secondary"}>
                      {rule.is_active ? "Activa" : "Inactiva"}
                    </Badge>
                    <Button variant="ghost" size="icon" onClick={() => openEditDialog(rule)}>
                      <DollarSign className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="text-red-500"
                      onClick={() => onDelete(rule.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}