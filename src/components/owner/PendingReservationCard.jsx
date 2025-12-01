import React from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Clock, Phone, User, MapPin, Calendar, DollarSign, Check, X, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

export default function PendingReservationCard({ reservation, onAccept, onReject, isLoading }) {
  const timeRemaining = () => {
    if (!reservation.response_deadline) return null;
    const deadline = new Date(reservation.response_deadline);
    const now = new Date();
    const diff = deadline - now;
    if (diff <= 0) return "Expirado";
    const minutes = Math.floor(diff / 60000);
    return `${minutes} min restantes`;
  };

  return (
    <Card className="overflow-hidden border-l-4 border-l-amber-500 hover:shadow-lg transition-shadow">
      <CardContent className="p-0">
        <div className="flex flex-col lg:flex-row">
          {/* Main Info */}
          <div className="flex-1 p-5">
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-teal-500 to-teal-600 flex items-center justify-center text-white font-bold">
                    {(reservation.user_name || "C").charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-800 text-lg">{reservation.user_name || "Cliente"}</h3>
                    {reservation.user_phone && (
                      <a href={`tel:${reservation.user_phone}`} className="flex items-center gap-1 text-sm text-teal-600 hover:underline">
                        <Phone className="h-3 w-3" />
                        {reservation.user_phone}
                      </a>
                    )}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <Badge className="bg-amber-100 text-amber-700 border-amber-200">
                  <Clock className="h-3 w-3 mr-1" />
                  Pendiente
                </Badge>
                {timeRemaining() && (
                  <p className="text-xs text-red-500 mt-1 font-medium">{timeRemaining()}</p>
                )}
              </div>
            </div>

            {/* Details Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-slate-50 rounded-xl p-4">
              <div className="flex items-start gap-2">
                <MapPin className="h-4 w-4 text-slate-400 mt-0.5" />
                <div>
                  <p className="text-xs text-slate-500">Cancha</p>
                  <p className="font-medium text-slate-700 text-sm">{reservation.court_name}</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Calendar className="h-4 w-4 text-slate-400 mt-0.5" />
                <div>
                  <p className="text-xs text-slate-500">Fecha</p>
                  <p className="font-medium text-slate-700 text-sm">
                    {format(new Date(reservation.date + 'T00:00:00'), "EEE d MMM", { locale: es })}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Clock className="h-4 w-4 text-slate-400 mt-0.5" />
                <div>
                  <p className="text-xs text-slate-500">Horario</p>
                  <p className="font-medium text-slate-700 text-sm">
                    {reservation.start_hour}:00 - {reservation.end_hour}:00
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <DollarSign className="h-4 w-4 text-slate-400 mt-0.5" />
                <div>
                  <p className="text-xs text-slate-500">Total</p>
                  <p className="font-bold text-teal-600">S/ {reservation.total_price}</p>
                </div>
              </div>
            </div>

            {/* Notes */}
            {reservation.notes && (
              <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-100">
                <div className="flex items-start gap-2">
                  <MessageSquare className="h-4 w-4 text-blue-500 mt-0.5" />
                  <div>
                    <p className="text-xs text-blue-600 font-medium">Nota del cliente:</p>
                    <p className="text-sm text-blue-700">{reservation.notes}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Payment Method */}
            <div className="mt-3 flex items-center gap-2">
              <Badge variant="outline" className="capitalize">
                {reservation.payment_method === "efectivo" ? "💵 Efectivo" : "📱 " + reservation.payment_method}
              </Badge>
              <span className="text-xs text-slate-400">•</span>
              <span className="text-xs text-slate-500">{reservation.duration_hours}h de reserva</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex lg:flex-col gap-2 p-4 lg:p-5 bg-slate-50 lg:bg-transparent lg:border-l border-t lg:border-t-0 border-slate-100 justify-center lg:justify-start lg:min-w-[140px]">
            <Button
              onClick={() => onAccept(reservation)}
              disabled={isLoading}
              className="flex-1 lg:flex-none bg-green-600 hover:bg-green-700 text-white shadow-lg shadow-green-600/20"
            >
              <Check className="h-4 w-4 mr-2" />
              Aceptar
            </Button>
            <Button
              onClick={() => onReject(reservation)}
              disabled={isLoading}
              variant="outline"
              className="flex-1 lg:flex-none border-red-200 text-red-600 hover:bg-red-50"
            >
              <X className="h-4 w-4 mr-2" />
              Rechazar
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}