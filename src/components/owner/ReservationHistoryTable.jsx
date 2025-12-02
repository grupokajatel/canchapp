import React, { useState } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle
} from "@/components/ui/dialog";
import {
  Search, Filter, Calendar, Clock, User, MapPin, Phone,
  DollarSign, MessageSquare, ChevronDown, Eye, Download, Edit
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const STATUS_CONFIG = {
  pending: { label: "Pendiente", color: "bg-amber-100 text-amber-700" },
  accepted: { label: "Aceptada", color: "bg-green-100 text-green-700" },
  rejected: { label: "Rechazada", color: "bg-red-100 text-red-700" },
  completed: { label: "Completada", color: "bg-blue-100 text-blue-700" },
  cancelled: { label: "Cancelada", color: "bg-slate-100 text-slate-700" },
  auto_rejected: { label: "Auto-rechazada", color: "bg-red-100 text-red-700" }
};

export default function ReservationHistoryTable({ reservations, courts, onEditReservation }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [courtFilter, setCourtFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");
  const [selectedReservation, setSelectedReservation] = useState(null);

  // Filter logic
  const filteredReservations = reservations.filter(r => {
    // Search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      if (!r.user_name?.toLowerCase().includes(query) &&
          !r.user_phone?.includes(query) &&
          !r.court_name?.toLowerCase().includes(query)) {
        return false;
      }
    }
    // Status
    if (statusFilter !== "all" && r.status !== statusFilter) return false;
    // Court
    if (courtFilter !== "all" && r.court_id !== courtFilter) return false;
    // Date
    if (dateFilter !== "all") {
      const today = new Date();
      const resDate = new Date(r.date);
      if (dateFilter === "today" && format(resDate, 'yyyy-MM-dd') !== format(today, 'yyyy-MM-dd')) return false;
      if (dateFilter === "week") {
        const weekAgo = new Date(today);
        weekAgo.setDate(weekAgo.getDate() - 7);
        if (resDate < weekAgo || resDate > today) return false;
      }
      if (dateFilter === "month") {
        const monthAgo = new Date(today);
        monthAgo.setMonth(monthAgo.getMonth() - 1);
        if (resDate < monthAgo || resDate > today) return false;
      }
    }
    return true;
  });

  // Stats
  const totalRevenue = filteredReservations
    .filter(r => ["accepted", "completed"].includes(r.status))
    .reduce((sum, r) => sum + (r.total_price || 0), 0);
  const acceptedCount = filteredReservations.filter(r => r.status === "accepted").length;
  const pendingCount = filteredReservations.filter(r => r.status === "pending").length;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-slate-500">Total Reservas</p>
            <p className="text-2xl font-bold text-slate-800">{filteredReservations.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-slate-500">Confirmadas</p>
            <p className="text-2xl font-bold text-green-600">{acceptedCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-slate-500">Pendientes</p>
            <p className="text-2xl font-bold text-amber-600">{pendingCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-slate-500">Ingresos</p>
            <p className="text-2xl font-bold text-teal-600">S/ {totalRevenue}</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Buscar por nombre, teléfono..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full md:w-40">
            <SelectValue placeholder="Estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            {Object.entries(STATUS_CONFIG).map(([key, { label }]) => (
              <SelectItem key={key} value={key}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={courtFilter} onValueChange={setCourtFilter}>
          <SelectTrigger className="w-full md:w-40">
            <SelectValue placeholder="Cancha" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            {courts.map(court => (
              <SelectItem key={court.id} value={court.id}>{court.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={dateFilter} onValueChange={setDateFilter}>
          <SelectTrigger className="w-full md:w-40">
            <SelectValue placeholder="Período" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todo el tiempo</SelectItem>
            <SelectItem value="today">Hoy</SelectItem>
            <SelectItem value="week">Última semana</SelectItem>
            <SelectItem value="month">Último mes</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <Card>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cliente</TableHead>
                <TableHead>Cancha</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead>Horario</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredReservations.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12 text-slate-500">
                    No se encontraron reservas
                  </TableCell>
                </TableRow>
              ) : (
                filteredReservations.map(reservation => {
                  const status = STATUS_CONFIG[reservation.status] || STATUS_CONFIG.pending;
                  return (
                    <TableRow key={reservation.id} className="cursor-pointer hover:bg-slate-50">
                      <TableCell>
                        <div>
                          <p className="font-medium">{reservation.user_name || "Cliente"}</p>
                          {reservation.user_phone && (
                            <p className="text-xs text-slate-500">{reservation.user_phone}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{reservation.court_name}</TableCell>
                      <TableCell>
                        {format(new Date(reservation.date + 'T00:00:00'), "d MMM yyyy", { locale: es })}
                      </TableCell>
                      <TableCell>
                        {reservation.start_hour}:00 - {reservation.end_hour}:00
                      </TableCell>
                      <TableCell className="font-semibold text-teal-600">
                        S/ {reservation.total_price}
                      </TableCell>
                      <TableCell>
                        <Badge className={status.color}>{status.label}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedReservation(reservation)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          {onEditReservation && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => onEditReservation(reservation)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* Detail Modal */}
      <Dialog open={!!selectedReservation} onOpenChange={() => setSelectedReservation(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Detalle de Reserva</DialogTitle>
          </DialogHeader>
          {selectedReservation && (
            <div className="space-y-4 py-4">
              <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl">
                <div className="w-12 h-12 rounded-full bg-teal-100 flex items-center justify-center">
                  <User className="h-6 w-6 text-teal-600" />
                </div>
                <div>
                  <p className="font-semibold text-lg">{selectedReservation.user_name}</p>
                  {selectedReservation.user_phone && (
                    <a href={`tel:${selectedReservation.user_phone}`} className="text-sm text-teal-600">
                      {selectedReservation.user_phone}
                    </a>
                  )}
                </div>
                <Badge className={`ml-auto ${STATUS_CONFIG[selectedReservation.status]?.color}`}>
                  {STATUS_CONFIG[selectedReservation.status]?.label}
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-slate-50 rounded-lg">
                  <p className="text-xs text-slate-500 flex items-center gap-1">
                    <MapPin className="h-3 w-3" /> Cancha
                  </p>
                  <p className="font-medium">{selectedReservation.court_name}</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg">
                  <p className="text-xs text-slate-500 flex items-center gap-1">
                    <Calendar className="h-3 w-3" /> Fecha
                  </p>
                  <p className="font-medium">
                    {format(new Date(selectedReservation.date + 'T00:00:00'), "d MMM yyyy", { locale: es })}
                  </p>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg">
                  <p className="text-xs text-slate-500 flex items-center gap-1">
                    <Clock className="h-3 w-3" /> Horario
                  </p>
                  <p className="font-medium">
                    {selectedReservation.start_hour}:00 - {selectedReservation.end_hour}:00
                  </p>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg">
                  <p className="text-xs text-slate-500 flex items-center gap-1">
                    <DollarSign className="h-3 w-3" /> Total
                  </p>
                  <p className="font-bold text-teal-600">S/ {selectedReservation.total_price}</p>
                </div>
              </div>

              {selectedReservation.notes && (
                <div className="p-3 bg-blue-50 rounded-lg">
                  <p className="text-xs text-blue-600 flex items-center gap-1 mb-1">
                    <MessageSquare className="h-3 w-3" /> Notas
                  </p>
                  <p className="text-sm text-blue-800">{selectedReservation.notes}</p>
                </div>
              )}

              <div className="text-xs text-slate-400 text-center">
                Reserva creada: {format(new Date(selectedReservation.created_date), "d MMM yyyy HH:mm", { locale: es })}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}