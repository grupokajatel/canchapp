import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createPageUrl } from "@/utils";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
  Calendar, Clock, MapPin, AlertCircle, Check, X, 
  RefreshCw, Download, ChevronRight, Eye
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import EmptyState from "@/components/ui/EmptyState";
import ReservationDetailModal from "@/components/reservations/ReservationDetailModal";
import { toast } from "sonner";

export default function MyReservations() {
  const [user, setUser] = useState(null);
  const [isLoadingUser, setIsLoadingUser] = useState(true);
  const [selectedReservation, setSelectedReservation] = useState(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);
    } catch (error) {
      // Skip auth redirect on localhost for development
      if (window.location.hostname !== 'localhost') {
        base44.auth.redirectToLogin(window.location.href);
      }
    } finally {
      setIsLoadingUser(false);
    }
  };

  const { data: reservations = [], isLoading, refetch } = useQuery({
    queryKey: ['my-reservations', user?.id],
    queryFn: () => base44.entities.Reservation.filter({ user_id: user.id }, '-created_date'),
    enabled: !!user?.id,
  });

  const cancelReservationMutation = useMutation({
    mutationFn: (reservationId) => 
      base44.entities.Reservation.update(reservationId, { status: "cancelled" }),
    onSuccess: () => {
      queryClient.invalidateQueries(['my-reservations']);
      toast.success("Reserva cancelada");
    },
    onError: () => {
      toast.error("Error al cancelar la reserva");
    }
  });

  if (isLoadingUser) {
    return <LoadingSpinner className="min-h-screen" />;
  }

  if (!user) {
    return null;
  }

  const statusConfig = {
    pending: { label: "Pendiente", color: "bg-amber-100 text-amber-700 border-amber-200", icon: Clock },
    accepted: { label: "Confirmada", color: "bg-green-100 text-green-700 border-green-200", icon: Check },
    rejected: { label: "Rechazada", color: "bg-red-100 text-red-700 border-red-200", icon: X },
    auto_rejected: { label: "Sin respuesta", color: "bg-slate-100 text-slate-700 border-slate-200", icon: AlertCircle },
    completed: { label: "Completada", color: "bg-blue-100 text-blue-700 border-blue-200", icon: Check },
    cancelled: { label: "Cancelada", color: "bg-slate-100 text-slate-700 border-slate-200", icon: X },
  };

  const pendingReservations = reservations.filter(r => r.status === "pending");
  const confirmedReservations = reservations.filter(r => r.status === "accepted");
  const pastReservations = reservations.filter(r => 
    ["completed", "cancelled", "rejected", "auto_rejected"].includes(r.status)
  );

  const ReservationCard = ({ reservation }) => {
    const status = statusConfig[reservation.status] || statusConfig.pending;
    const StatusIcon = status.icon;
    const canCancel = reservation.status === "pending";

    return (
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden hover:shadow-md transition-shadow">
        <div className="p-5">
          <div className="flex items-start justify-between mb-3">
            <div>
              <h3 className="font-semibold text-lg text-slate-800">{reservation.court_name}</h3>
              <Badge className={`${status.color} mt-1 border`}>
                <StatusIcon className="h-3 w-3 mr-1" />
                {status.label}
              </Badge>
            </div>
            {reservation.is_manual && (
              <Badge variant="outline" className="text-xs">Manual</Badge>
            )}
          </div>

          <div className="space-y-2 text-sm text-slate-600">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-teal-500" />
              <span>{format(new Date(reservation.date), "EEEE d 'de' MMMM, yyyy", { locale: es })}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-teal-500" />
              <span>{reservation.start_hour}:00 - {reservation.end_hour}:00 ({reservation.duration_hours}h)</span>
            </div>
          </div>

          <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-100">
            <div>
              <p className="text-xs text-slate-500">Total</p>
              <p className="text-xl font-bold text-teal-600">S/ {reservation.total_price}</p>
            </div>

            <div className="flex gap-2">
              {canCancel && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline" size="sm" className="text-red-600 border-red-200 hover:bg-red-50">
                      Cancelar
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
                        onClick={() => cancelReservationMutation.mutate(reservation.id)}
                        className="bg-red-600 hover:bg-red-700"
                      >
                        Sí, cancelar
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setSelectedReservation(reservation)}
              >
                <Eye className="h-4 w-4 mr-1" />
                Ver detalles
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white pb-20">
      {/* Header */}
      <div className="bg-gradient-to-r from-teal-600 to-teal-700 text-white py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">Mis Reservas</h1>
            <p className="text-teal-100 mt-1">Gestiona todas tus reservas</p>
          </div>
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => refetch()}
            className="text-white hover:bg-white/10"
          >
            <RefreshCw className="h-5 w-5" />
          </Button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {isLoading ? (
          <LoadingSpinner className="py-20" text="Cargando reservas..." />
        ) : reservations.length === 0 ? (
          <EmptyState
            icon={Calendar}
            title="No tienes reservas"
            description="Busca canchas y haz tu primera reserva"
            action={
              <Link to={createPageUrl("SearchCourts")}>
                <Button className="bg-teal-600 hover:bg-teal-700">
                  Buscar canchas
                </Button>
              </Link>
            }
          />
        ) : (
          <Tabs defaultValue="confirmed" className="space-y-6">
            <TabsList className="bg-slate-100">
              <TabsTrigger value="pending" className="relative">
                Pendientes
                {pendingReservations.length > 0 && (
                  <span className="ml-2 bg-amber-500 text-white text-xs rounded-full px-2 py-0.5">
                    {pendingReservations.length}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="confirmed">
                Confirmadas ({confirmedReservations.length})
              </TabsTrigger>
              <TabsTrigger value="history">
                Historial ({pastReservations.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="pending">
              {pendingReservations.length > 0 ? (
                <div className="space-y-4">
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-amber-800">Reservas pendientes de confirmación</p>
                      <p className="text-sm text-amber-700 mt-1">
                        El dueño de la cancha tiene 10 minutos para confirmar tu reserva
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {pendingReservations.map((reservation) => (
                      <ReservationCard key={reservation.id} reservation={reservation} />
                    ))}
                  </div>
                </div>
              ) : (
                <EmptyState
                  icon={Clock}
                  title="Sin reservas pendientes"
                  description="No tienes reservas esperando confirmación"
                />
              )}
            </TabsContent>

            <TabsContent value="confirmed">
              {confirmedReservations.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {confirmedReservations.map((reservation) => (
                    <ReservationCard key={reservation.id} reservation={reservation} />
                  ))}
                </div>
              ) : (
                <EmptyState
                  icon={Check}
                  title="Sin reservas confirmadas"
                  description="Tus reservas confirmadas aparecerán aquí"
                />
              )}
            </TabsContent>

            <TabsContent value="history">
              {pastReservations.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {pastReservations.map((reservation) => (
                    <ReservationCard key={reservation.id} reservation={reservation} />
                  ))}
                </div>
              ) : (
                <EmptyState
                  icon={Calendar}
                  title="Sin historial"
                  description="Tu historial de reservas aparecerá aquí"
                />
              )}
            </TabsContent>
          </Tabs>
        )}

        {/* Reservation Detail Modal */}
        <ReservationDetailModal
          reservation={selectedReservation}
          open={!!selectedReservation}
          onClose={() => setSelectedReservation(null)}
          onCancel={(id) => {
            cancelReservationMutation.mutate(id);
            setSelectedReservation(null);
          }}
          isCancelling={cancelReservationMutation.isPending}
        />
      </div>
    </div>
  );
}