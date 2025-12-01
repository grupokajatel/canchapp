import React, { useState, useMemo } from "react";
import { format, addDays, startOfWeek, addWeeks, subWeeks, isSameDay, startOfMonth, endOfMonth, eachDayOfInterval } from "date-fns";
import { es } from "date-fns/locale";
import { 
  ChevronLeft, ChevronRight, Calendar, AlertTriangle, 
  Clock, User, Building2, Filter, Eye, TrendingUp
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export default function OwnerConsolidatedCalendar({
  courts = [],
  reservations = [],
  onReservationClick,
  onDayClick
}) {
  const [viewMode, setViewMode] = useState("week"); // week, month
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedCourtFilter, setSelectedCourtFilter] = useState("all");

  const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 });

  const goToPrev = () => {
    if (viewMode === "week") {
      setSelectedDate(subWeeks(selectedDate, 1));
    } else {
      setSelectedDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth() - 1, 1));
    }
  };

  const goToNext = () => {
    if (viewMode === "week") {
      setSelectedDate(addWeeks(selectedDate, 1));
    } else {
      setSelectedDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 1));
    }
  };

  const goToToday = () => setSelectedDate(new Date());

  // Filter reservations
  const filteredReservations = useMemo(() => {
    if (selectedCourtFilter === "all") return reservations;
    return reservations.filter(r => r.court_id === selectedCourtFilter);
  }, [reservations, selectedCourtFilter]);

  // Get days based on view mode
  const days = useMemo(() => {
    if (viewMode === "week") {
      return Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
    }
    return eachDayOfInterval({
      start: startOfMonth(selectedDate),
      end: endOfMonth(selectedDate)
    });
  }, [viewMode, selectedDate, weekStart]);

  // Get reservations for a specific date
  const getReservationsForDate = (date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return filteredReservations.filter(r => 
      r.date === dateStr && 
      !["cancelled", "rejected", "auto_rejected"].includes(r.status)
    );
  };

  // Detect conflicts (overlapping reservations on same court)
  const getConflicts = (date) => {
    const dateReservations = getReservationsForDate(date);
    const conflicts = [];
    
    const courtReservations = {};
    dateReservations.forEach(r => {
      if (!courtReservations[r.court_id]) courtReservations[r.court_id] = [];
      courtReservations[r.court_id].push(r);
    });

    Object.values(courtReservations).forEach(courtRes => {
      for (let i = 0; i < courtRes.length; i++) {
        for (let j = i + 1; j < courtRes.length; j++) {
          const a = courtRes[i];
          const b = courtRes[j];
          if (a.start_hour < b.end_hour && b.start_hour < a.end_hour) {
            conflicts.push({ a, b });
          }
        }
      }
    });
    
    return conflicts;
  };

  // Get busy level for a date (for heatmap)
  const getBusyLevel = (date) => {
    const reservations = getReservationsForDate(date);
    const totalHours = reservations.reduce((sum, r) => sum + (r.end_hour - r.start_hour), 0);
    const maxPossibleHours = courts.length * 17; // Assuming ~17 hours per court
    const percentage = (totalHours / maxPossibleHours) * 100;
    
    if (percentage >= 80) return "very-busy";
    if (percentage >= 50) return "busy";
    if (percentage >= 20) return "moderate";
    if (percentage > 0) return "light";
    return "empty";
  };

  // Stats calculations
  const stats = useMemo(() => {
    const today = format(new Date(), 'yyyy-MM-dd');
    const todayReservations = filteredReservations.filter(r => r.date === today);
    const pendingCount = filteredReservations.filter(r => r.status === "pending").length;
    const weekRevenue = filteredReservations
      .filter(r => {
        const rDate = new Date(r.date);
        return rDate >= weekStart && rDate <= addDays(weekStart, 6) && r.status === "accepted";
      })
      .reduce((sum, r) => sum + (r.total_price || 0), 0);

    return {
      todayCount: todayReservations.length,
      pendingCount,
      weekRevenue
    };
  }, [filteredReservations, weekStart]);

  const busyLevelColors = {
    "very-busy": "bg-red-100 border-red-300 text-red-800",
    "busy": "bg-orange-100 border-orange-300 text-orange-800",
    "moderate": "bg-amber-100 border-amber-300 text-amber-800",
    "light": "bg-teal-100 border-teal-300 text-teal-800",
    "empty": "bg-white border-slate-200 text-slate-600"
  };

  const statusColors = {
    pending: "bg-amber-500",
    accepted: "bg-teal-500",
    completed: "bg-blue-500"
  };

  return (
    <TooltipProvider>
      <div className="space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-gradient-to-br from-teal-500 to-teal-600 text-white border-0">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-teal-100 text-sm">Hoy</p>
                  <p className="text-2xl font-bold">{stats.todayCount} reservas</p>
                </div>
                <Calendar className="h-8 w-8 text-teal-200" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-amber-500 to-amber-600 text-white border-0">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-amber-100 text-sm">Pendientes</p>
                  <p className="text-2xl font-bold">{stats.pendingCount}</p>
                </div>
                <Clock className="h-8 w-8 text-amber-200" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm">Ingresos Semana</p>
                  <p className="text-2xl font-bold">S/ {stats.weekRevenue}</p>
                </div>
                <TrendingUp className="h-8 w-8 text-blue-200" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Calendar Header */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={goToPrev}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={goToToday}>
              Hoy
            </Button>
            <Button variant="outline" size="icon" onClick={goToNext}>
              <ChevronRight className="h-4 w-4" />
            </Button>
            <h3 className="text-lg font-semibold text-slate-800 ml-2">
              {viewMode === "week" 
                ? `${format(weekStart, "d MMM", { locale: es })} - ${format(addDays(weekStart, 6), "d MMM yyyy", { locale: es })}`
                : format(selectedDate, "MMMM yyyy", { locale: es })
              }
            </h3>
          </div>

          <div className="flex items-center gap-3">
            <Select value={selectedCourtFilter} onValueChange={setSelectedCourtFilter}>
              <SelectTrigger className="w-[180px]">
                <Building2 className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Todas las canchas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las canchas</SelectItem>
                {courts.map(court => (
                  <SelectItem key={court.id} value={court.id}>{court.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="flex rounded-lg border border-slate-200 overflow-hidden">
              <Button
                variant={viewMode === "week" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode("week")}
                className="rounded-none"
              >
                Semana
              </Button>
              <Button
                variant={viewMode === "month" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode("month")}
                className="rounded-none"
              >
                Mes
              </Button>
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-4 text-sm text-slate-600 bg-slate-50 p-3 rounded-lg">
          <span className="font-medium">Ocupación:</span>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-red-100 border border-red-300" />
            <span>Muy ocupado</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-orange-100 border border-orange-300" />
            <span>Ocupado</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-amber-100 border border-amber-300" />
            <span>Moderado</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-teal-100 border border-teal-300" />
            <span>Bajo</span>
          </div>
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-red-500" />
            <span>Conflicto</span>
          </div>
        </div>

        {/* Week View */}
        {viewMode === "week" && (
          <div className="grid grid-cols-7 gap-3">
            {days.map(day => {
              const dayReservations = getReservationsForDate(day);
              const conflicts = getConflicts(day);
              const busyLevel = getBusyLevel(day);
              const isToday = isSameDay(day, new Date());
              const isPast = day < new Date() && !isToday;

              return (
                <div
                  key={day.toISOString()}
                  onClick={() => onDayClick?.(day)}
                  className={cn(
                    "rounded-xl border-2 p-3 min-h-[200px] cursor-pointer transition-all hover:shadow-lg",
                    busyLevelColors[busyLevel],
                    isToday && "ring-2 ring-teal-500 ring-offset-2",
                    isPast && "opacity-60"
                  )}
                >
                  {/* Day Header */}
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="text-xs font-medium uppercase opacity-70">
                        {format(day, "EEE", { locale: es })}
                      </p>
                      <p className={cn(
                        "text-2xl font-bold",
                        isToday && "text-teal-600"
                      )}>
                        {format(day, "d")}
                      </p>
                    </div>
                    {conflicts.length > 0 && (
                      <Tooltip>
                        <TooltipTrigger>
                          <div className="flex items-center gap-1 bg-red-500 text-white px-2 py-1 rounded-full text-xs">
                            <AlertTriangle className="h-3 w-3" />
                            {conflicts.length}
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>{conflicts.length} conflicto(s) de horario</p>
                        </TooltipContent>
                      </Tooltip>
                    )}
                  </div>

                  {/* Reservations List */}
                  <div className="space-y-1.5">
                    {dayReservations.slice(0, 4).map(reservation => {
                      const court = courts.find(c => c.id === reservation.court_id);
                      return (
                        <Tooltip key={reservation.id}>
                          <TooltipTrigger asChild>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onReservationClick?.(reservation);
                              }}
                              className={cn(
                                "w-full text-left p-2 rounded-lg text-xs text-white transition-all hover:opacity-90",
                                statusColors[reservation.status] || "bg-slate-500"
                              )}
                            >
                              <div className="flex items-center justify-between">
                                <span className="font-medium truncate">
                                  {reservation.start_hour}:00-{reservation.end_hour}:00
                                </span>
                              </div>
                              <p className="truncate opacity-90 mt-0.5">
                                {reservation.user_name?.split(' ')[0] || "Cliente"}
                              </p>
                            </button>
                          </TooltipTrigger>
                          <TooltipContent side="right">
                            <div className="text-sm space-y-1">
                              <p className="font-semibold">{reservation.user_name}</p>
                              <p className="text-slate-500">{court?.name || "Cancha"}</p>
                              <p>{reservation.start_hour}:00 - {reservation.end_hour}:00</p>
                              <p className="font-medium text-teal-600">S/ {reservation.total_price}</p>
                              <Badge className={statusColors[reservation.status]}>
                                {reservation.status === "pending" ? "Pendiente" : 
                                 reservation.status === "accepted" ? "Confirmada" : "Completada"}
                              </Badge>
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      );
                    })}
                    {dayReservations.length > 4 && (
                      <p className="text-xs text-center opacity-70 pt-1">
                        +{dayReservations.length - 4} más
                      </p>
                    )}
                  </div>

                  {dayReservations.length === 0 && (
                    <p className="text-xs text-center opacity-50 mt-8">Sin reservas</p>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Month View */}
        {viewMode === "month" && (
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            {/* Day names */}
            <div className="grid grid-cols-7 bg-slate-50 border-b border-slate-200">
              {["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"].map(d => (
                <div key={d} className="p-3 text-center text-sm font-medium text-slate-500">
                  {d}
                </div>
              ))}
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7">
              {/* Add empty cells for days before the first of the month */}
              {Array.from({ length: (days[0].getDay() + 6) % 7 }).map((_, i) => (
                <div key={`empty-${i}`} className="p-2 min-h-[100px] bg-slate-50 border-b border-r border-slate-100" />
              ))}
              
              {days.map(day => {
                const dayReservations = getReservationsForDate(day);
                const conflicts = getConflicts(day);
                const busyLevel = getBusyLevel(day);
                const isToday = isSameDay(day, new Date());
                const pendingCount = dayReservations.filter(r => r.status === "pending").length;
                const confirmedCount = dayReservations.filter(r => r.status === "accepted").length;

                return (
                  <div
                    key={day.toISOString()}
                    onClick={() => onDayClick?.(day)}
                    className={cn(
                      "p-2 min-h-[100px] border-b border-r border-slate-100 cursor-pointer transition-all hover:bg-slate-50",
                      isToday && "bg-teal-50"
                    )}
                  >
                    <div className="flex items-start justify-between">
                      <span className={cn(
                        "text-sm font-semibold",
                        isToday ? "bg-teal-500 text-white w-7 h-7 rounded-full flex items-center justify-center" : "text-slate-700"
                      )}>
                        {format(day, "d")}
                      </span>
                      {conflicts.length > 0 && (
                        <AlertTriangle className="h-4 w-4 text-red-500" />
                      )}
                    </div>

                    {dayReservations.length > 0 && (
                      <div className="mt-2 space-y-1">
                        {pendingCount > 0 && (
                          <Badge className="text-[10px] bg-amber-500 w-full justify-center">
                            {pendingCount} pendiente{pendingCount > 1 ? 's' : ''}
                          </Badge>
                        )}
                        {confirmedCount > 0 && (
                          <Badge className="text-[10px] bg-teal-500 w-full justify-center">
                            {confirmedCount} confirmada{confirmedCount > 1 ? 's' : ''}
                          </Badge>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </TooltipProvider>
  );
}