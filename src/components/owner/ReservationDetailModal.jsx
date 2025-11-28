import React, { useState } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { User, Phone, Calendar, Clock, DollarSign, MapPin, FileText, Edit, Trash2, Check, X, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function ReservationDetailModal({
  reservation,
  courts,
  existingReservations,
  open,
  onClose,
  onUpdate,
  onDelete,
  isUpdating
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({});
  const [conflictError, setConflictError] = useState("");

  if (!reservation) return null;

  const statusConfig = {
    pending: { label: "Pendiente", color: "bg-amber-100 text-amber-700 border-amber-200", icon: Clock },
    accepted: { label: "Confirmada", color: "bg-green-100 text-green-700 border-green-200", icon: Check },
    rejected: { label: "Rechazada", color: "bg-red-100 text-red-700 border-red-200", icon: X },
    completed: { label: "Completada", color: "bg-blue-100 text-blue-700 border-blue-200", icon: Check },
    cancelled: { label: "Cancelada", color: "bg-slate-100 text-slate-700 border-slate-200", icon: X },
    auto_rejected: { label: "Sin respuesta", color: "bg-slate-100 text-slate-700 border-slate-200", icon: AlertCircle },
  };

  const status = statusConfig[reservation.status] || statusConfig.pending;
  const StatusIcon = status.icon;

  const startEdit = () => {
    setEditData({
      user_name: reservation.user_name || "",
      user_phone: reservation.user_phone || "",
      date: reservation.date,
      start_hour: reservation.start_hour,
      duration_hours: reservation.duration_hours || (reservation.end_hour - reservation.start_hour),
      court_id: reservation.court_id,
      notes: reservation.notes || "",
      status: reservation.status
    });
    setConflictError("");
    setIsEditing(true);
  };

  const checkConflict = (courtId, date, startHour, duration) => {
    const endHour = startHour + duration;
    return existingReservations.some(r => 
      r.id !== reservation.id &&
      r.court_id === courtId &&
      r.date === date &&
      !["cancelled", "rejected", "auto_rejected"].includes(r.status) &&
      ((startHour >= r.start_hour && startHour < r.end_hour) ||
       (endHour > r.start_hour && endHour <= r.end_hour) ||
       (startHour <= r.start_hour && endHour >= r.end_hour))
    );
  };

  const handleSave = () => {
    const hasConflict = checkConflict(
      editData.court_id,
      editData.date,
      editData.start_hour,
      editData.duration_hours
    );

    if (hasConflict) {
      setConflictError("El horario seleccionado tiene conflicto con otra reserva existente");
      return;
    }

    const court = courts.find(c => c.id === editData.court_id);
    const pricePerHour = court?.night_price_enabled && editData.start_hour >= 18 
      ? court?.night_price_per_hour 
      : court?.price_per_hour || 0;

    onUpdate(reservation.id, {
      ...editData,
      end_hour: editData.start_hour + editData.duration_hours,
      total_price: pricePerHour * editData.duration_hours,
      court_name: court?.name
    });
    setIsEditing(false);
  };

  const handleStatusChange = (newStatus) => {
    onUpdate(reservation.id, { status: newStatus });
  };

  const selectedCourt = courts.find(c => c.id === (isEditing ? editData.court_id : reservation.court_id));
  const hours = [];
  for (let i = (selectedCourt?.opening_hour || 6); i < (selectedCourt?.closing_hour || 23); i++) {
    hours.push(i);
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Detalle de Reserva</span>
            <Badge className={`${status.color} border`}>
              <StatusIcon className="h-3 w-3 mr-1" />
              {status.label}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Quick Status Actions */}
          {!isEditing && reservation.status === "pending" && (
            <div className="flex gap-2 p-3 bg-amber-50 rounded-xl border border-amber-200">
              <Button
                size="sm"
                variant="outline"
                className="flex-1 text-red-600 border-red-200 hover:bg-red-50"
                onClick={() => handleStatusChange("rejected")}
                disabled={isUpdating}
              >
                <X className="h-4 w-4 mr-1" />
                Rechazar
              </Button>
              <Button
                size="sm"
                className="flex-1 bg-green-600 hover:bg-green-700"
                onClick={() => handleStatusChange("accepted")}
                disabled={isUpdating}
              >
                <Check className="h-4 w-4 mr-1" />
                Confirmar
              </Button>
            </div>
          )}

          {isEditing ? (
            <>
              {conflictError && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{conflictError}</AlertDescription>
                </Alert>
              )}

              <div>
                <Label>Cliente</Label>
                <Input
                  value={editData.user_name}
                  onChange={(e) => setEditData({...editData, user_name: e.target.value})}
                  className="mt-1"
                />
              </div>

              <div>
                <Label>Teléfono</Label>
                <Input
                  value={editData.user_phone}
                  onChange={(e) => setEditData({...editData, user_phone: e.target.value})}
                  className="mt-1"
                />
              </div>

              <div>
                <Label>Cancha</Label>
                <Select value={editData.court_id} onValueChange={(v) => setEditData({...editData, court_id: v})}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {courts.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Fecha</Label>
                  <Input
                    type="date"
                    value={editData.date}
                    onChange={(e) => setEditData({...editData, date: e.target.value})}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>Hora inicio</Label>
                  <Select value={editData.start_hour?.toString()} onValueChange={(v) => setEditData({...editData, start_hour: parseInt(v)})}>
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {hours.map(h => <SelectItem key={h} value={h.toString()}>{h}:00</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Duración</Label>
                  <Select value={editData.duration_hours?.toString()} onValueChange={(v) => setEditData({...editData, duration_hours: parseInt(v)})}>
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {[1, 2, 3, 4].map(h => <SelectItem key={h} value={h.toString()}>{h}h</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Estado</Label>
                  <Select value={editData.status} onValueChange={(v) => setEditData({...editData, status: v})}>
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pendiente</SelectItem>
                      <SelectItem value="accepted">Confirmada</SelectItem>
                      <SelectItem value="completed">Completada</SelectItem>
                      <SelectItem value="cancelled">Cancelada</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label>Notas</Label>
                <Textarea
                  value={editData.notes}
                  onChange={(e) => setEditData({...editData, notes: e.target.value})}
                  className="mt-1"
                />
              </div>
            </>
          ) : (
            <>
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                  <User className="h-5 w-5 text-slate-400" />
                  <div>
                    <p className="text-xs text-slate-500">Cliente</p>
                    <p className="font-medium">{reservation.user_name || "Sin nombre"}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                  <Phone className="h-5 w-5 text-slate-400" />
                  <div>
                    <p className="text-xs text-slate-500">Teléfono</p>
                    <p className="font-medium">{reservation.user_phone || "Sin teléfono"}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                  <MapPin className="h-5 w-5 text-slate-400" />
                  <div>
                    <p className="text-xs text-slate-500">Cancha</p>
                    <p className="font-medium">{reservation.court_name}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                    <Calendar className="h-5 w-5 text-slate-400" />
                    <div>
                      <p className="text-xs text-slate-500">Fecha</p>
                      <p className="font-medium">{format(new Date(reservation.date), "d MMM yyyy", { locale: es })}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                    <Clock className="h-5 w-5 text-slate-400" />
                    <div>
                      <p className="text-xs text-slate-500">Horario</p>
                      <p className="font-medium">{reservation.start_hour}:00 - {reservation.end_hour}:00</p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-teal-50 rounded-lg">
                  <DollarSign className="h-5 w-5 text-teal-600" />
                  <div>
                    <p className="text-xs text-teal-600">Total</p>
                    <p className="font-bold text-lg text-teal-700">S/ {reservation.total_price}</p>
                  </div>
                  <Badge variant="outline" className="ml-auto capitalize">{reservation.payment_method}</Badge>
                </div>

                {reservation.notes && (
                  <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
                    <FileText className="h-5 w-5 text-slate-400 mt-0.5" />
                    <div>
                      <p className="text-xs text-slate-500">Notas</p>
                      <p className="text-sm">{reservation.notes}</p>
                    </div>
                  </div>
                )}

                {reservation.is_manual && (
                  <Badge className="bg-purple-100 text-purple-700 border border-purple-200">Reserva Manual</Badge>
                )}
              </div>
            </>
          )}
        </div>

        <div className="flex gap-3 pt-4 border-t">
          {isEditing ? (
            <>
              <Button variant="outline" className="flex-1" onClick={() => setIsEditing(false)}>Cancelar</Button>
              <Button className="flex-1 bg-teal-600 hover:bg-teal-700" onClick={handleSave} disabled={isUpdating}>
                {isUpdating ? "Guardando..." : "Guardar Cambios"}
              </Button>
            </>
          ) : (
            <>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" className="text-red-600 border-red-200 hover:bg-red-50">
                    <Trash2 className="h-4 w-4 mr-1" />
                    Eliminar
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>¿Eliminar reserva?</AlertDialogTitle>
                    <AlertDialogDescription>Esta acción no se puede deshacer.</AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={() => onDelete(reservation.id)} className="bg-red-600">Eliminar</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
              <Button variant="outline" className="flex-1" onClick={startEdit}>
                <Edit className="h-4 w-4 mr-1" />
                Editar
              </Button>
              <Button variant="outline" onClick={onClose}>Cerrar</Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}