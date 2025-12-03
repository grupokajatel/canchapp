import React, { useState } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { 
  Calendar, Clock, MapPin, DollarSign, User, Phone, FileText,
  Edit, Trash2, X, Check, AlertCircle
} from "lucide-react";
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
import { createPageUrl } from "@/utils";
import { Link } from "react-router-dom";

const STATUS_CONFIG = {
  pending: { label: "Pendiente", color: "bg-amber-100 text-amber-700 border-amber-200", icon: Clock },
  accepted: { label: "Confirmada", color: "bg-green-100 text-green-700 border-green-200", icon: Check },
  rejected: { label: "Rechazada", color: "bg-red-100 text-red-700 border-red-200", icon: X },
  auto_rejected: { label: "Sin respuesta", color: "bg-slate-100 text-slate-700 border-slate-200", icon: AlertCircle },
  completed: { label: "Completada", color: "bg-blue-100 text-blue-700 border-blue-200", icon: Check },
  cancelled: { label: "Cancelada", color: "bg-slate-100 text-slate-700 border-slate-200", icon: X },
};

export default function ReservationDetailModal({ 
  reservation, 
  open, 
  onClose, 
  onCancel,
  isCancelling 
}) {
  if (!reservation) return null;

  const status = STATUS_CONFIG[reservation.status] || STATUS_CONFIG.pending;
  const StatusIcon = status.icon;
  const canCancel = reservation.status === "pending";

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
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
          {/* Court Info */}
          <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl">
            <MapPin className="h-5 w-5 text-teal-600" />
            <div>
              <p className="font-semibold text-slate-800">{reservation.court_name}</p>
              <Link 
                to={createPageUrl(`CourtDetail?id=${reservation.court_id}`)}
                className="text-sm text-teal-600 hover:underline"
              >
                Ver cancha
              </Link>
            </div>
          </div>

          {/* Date & Time */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
              <Calendar className="h-5 w-5 text-teal-500" />
              <div>
                <p className="text-xs text-slate-500">Fecha</p>
                <p className="font-medium text-slate-800">
                  {format(new Date(reservation.date + 'T00:00:00'), "EEE d MMM yyyy", { locale: es })}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
              <Clock className="h-5 w-5 text-teal-500" />
              <div>
                <p className="text-xs text-slate-500">Horario</p>
                <p className="font-medium text-slate-800">
                  {reservation.start_hour}:00 - {reservation.end_hour}:00
                </p>
              </div>
            </div>
          </div>

          {/* Duration */}
          <div className="p-3 bg-slate-50 rounded-lg">
            <p className="text-sm text-slate-600">
              Duración: <span className="font-medium">{reservation.duration_hours} hora{reservation.duration_hours > 1 ? 's' : ''}</span>
            </p>
          </div>

          {/* Price */}
          <div className="flex items-center justify-between p-4 bg-teal-50 rounded-xl">
            <div className="flex items-center gap-3">
              <DollarSign className="h-5 w-5 text-teal-600" />
              <div>
                <p className="text-xs text-teal-600">Total a pagar</p>
                <p className="text-2xl font-bold text-teal-700">S/ {reservation.total_price}</p>
              </div>
            </div>
            <Badge variant="outline" className="capitalize">
              {reservation.payment_method}
            </Badge>
          </div>

          {/* Notes */}
          {reservation.notes && (
            <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
              <FileText className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs text-blue-600">Notas</p>
                <p className="text-sm text-blue-800">{reservation.notes}</p>
              </div>
            </div>
          )}

          {/* Manual Badge */}
          {reservation.is_manual && (
            <Badge className="bg-purple-100 text-purple-700 border border-purple-200">
              Reserva Manual
            </Badge>
          )}

          {/* Created Date */}
          <p className="text-xs text-slate-400 text-center">
            Creada el {format(new Date(reservation.created_date), "d MMM yyyy 'a las' HH:mm", { locale: es })}
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-4 border-t">
          {canCancel && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" className="flex-1 text-red-600 border-red-200 hover:bg-red-50">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Cancelar Reserva
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>¿Cancelar reserva?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Esta acción no se puede deshacer. ¿Estás seguro de que deseas cancelar esta reserva?
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>No, mantener</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => onCancel(reservation.id)}
                    className="bg-red-600 hover:bg-red-700"
                    disabled={isCancelling}
                  >
                    {isCancelling ? "Cancelando..." : "Sí, cancelar"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
          <Button variant="outline" className="flex-1" onClick={onClose}>
            Cerrar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}