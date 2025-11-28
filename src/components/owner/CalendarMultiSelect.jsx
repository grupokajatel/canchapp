import React, { useState, useMemo } from "react";
import { format, addDays, eachDayOfInterval, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from "date-fns";
import { es } from "date-fns/locale";
import { Check, X, Clock, AlertCircle, User } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export default function CalendarMultiSelect({
  courts,
  selectedCourt,
  selectedDate,
  viewMode,
  reservations,
  selectedSlots,
  onSlotToggle,
  onSlotClick,
  onReservationClick
}) {
  const openingHour = selectedCourt?.opening_hour || 6;
  const closingHour = selectedCourt?.closing_hour || 23;
  
  const hours = useMemo(() => {
    const h = [];
    for (let i = openingHour; i < closingHour; i++) h.push(i);
    return h;
  }, [openingHour, closingHour]);

  const getDateRange = () => {
    if (viewMode === "day") return { start: selectedDate, end: selectedDate };
    if (viewMode === "week") return { start: startOfWeek(selectedDate, { weekStartsOn: 1 }), end: endOfWeek(selectedDate, { weekStartsOn: 1 }) };
    return { start: startOfMonth(selectedDate), end: endOfMonth(selectedDate) };
  };

  const dateRange = getDateRange();

  const getReservationForSlot = (date, hour, courtId) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return reservations.find(r => 
      r.date === dateStr &&
      r.court_id === courtId &&
      hour >= r.start_hour && hour < r.end_hour && 
      !["cancelled", "rejected", "auto_rejected"].includes(r.status)
    );
  };

  const isSlotSelected = (date, hour, courtId) => {
    const key = `${format(date, 'yyyy-MM-dd')}_${hour}_${courtId}`;
    return selectedSlots.includes(key);
  };

  const isSlotAvailable = (date, hour, courtId) => {
    return !getReservationForSlot(date, hour, courtId);
  };

  const handleSlotClick = (date, hour, courtId) => {
    const reservation = getReservationForSlot(date, hour, courtId);
    if (reservation) {
      onReservationClick(reservation);
    } else {
      const key = `${format(date, 'yyyy-MM-dd')}_${hour}_${courtId}`;
      onSlotToggle(key);
    }
  };

  const getSlotClass = (date, hour, courtId) => {
    const reservation = getReservationForSlot(date, hour, courtId);
    const selected = isSlotSelected(date, hour, courtId);

    if (reservation) {
      switch (reservation.status) {
        case "pending": return "bg-amber-100 border-amber-300 text-amber-800 cursor-pointer hover:bg-amber-200";
        case "accepted": return reservation.is_manual 
          ? "bg-purple-100 border-purple-300 text-purple-800 cursor-pointer hover:bg-purple-200"
          : "bg-teal-100 border-teal-300 text-teal-800 cursor-pointer hover:bg-teal-200";
        case "completed": return "bg-blue-100 border-blue-300 text-blue-800 cursor-pointer hover:bg-blue-200";
        default: return "bg-slate-100 border-slate-300 text-slate-800";
      }
    }

    if (selected) return "bg-teal-500 border-teal-600 text-white cursor-pointer ring-2 ring-teal-300";
    return "bg-white border-slate-200 text-slate-600 cursor-pointer hover:bg-teal-50 hover:border-teal-300";
  };

  const getStatusBadge = (status, isManual) => {
    const configs = {
      pending: { label: "Pendiente", class: "bg-amber-500" },
      accepted: { label: isManual ? "Manual" : "Confirmada", class: isManual ? "bg-purple-600" : "bg-teal-600" },
      completed: { label: "Completada", class: "bg-blue-600" },
      cancelled: { label: "Cancelada", class: "bg-slate-500" },
    };
    const config = configs[status] || configs.pending;
    return <Badge className={`text-[10px] ${config.class}`}>{config.label}</Badge>;
  };

  // Day View
  if (viewMode === "day") {
    return (
      <TooltipProvider>
        <div className="space-y-4">
          {/* Legend */}
          <div className="flex flex-wrap gap-3 text-xs">
            <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-white border-2 border-slate-200" /><span>Libre</span></div>
            <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-teal-500" /><span>Seleccionado</span></div>
            <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-amber-100 border border-amber-300" /><span>Pendiente</span></div>
            <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-teal-100 border border-teal-300" /><span>Confirmada</span></div>
            <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-purple-100 border border-purple-300" /><span>Manual</span></div>
          </div>

          {/* Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
            {hours.map(hour => {
              const reservation = getReservationForSlot(selectedDate, hour, selectedCourt?.id);
              const selected = isSlotSelected(selectedDate, hour, selectedCourt?.id);

              return (
                <Tooltip key={hour}>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => handleSlotClick(selectedDate, hour, selectedCourt?.id)}
                      className={cn(
                        "p-3 rounded-xl border-2 text-center transition-all",
                        getSlotClass(selectedDate, hour, selectedCourt?.id)
                      )}
                    >
                      <p className="font-semibold">{hour}:00</p>
                      {reservation ? (
                        <div className="mt-1 space-y-1">
                          <p className="text-xs truncate">{reservation.user_name || "Cliente"}</p>
                          {getStatusBadge(reservation.status, reservation.is_manual)}
                        </div>
                      ) : selected ? (
                        <div className="mt-1">
                          <Check className="h-4 w-4 mx-auto" />
                          <p className="text-xs">Seleccionado</p>
                        </div>
                      ) : (
                        <p className="text-xs mt-1 opacity-60">Disponible</p>
                      )}
                    </button>
                  </TooltipTrigger>
                  {reservation && (
                    <TooltipContent>
                      <div className="text-sm">
                        <p className="font-medium">{reservation.user_name}</p>
                        <p>{reservation.user_phone}</p>
                        <p>{reservation.start_hour}:00 - {reservation.end_hour}:00</p>
                        <p className="font-medium text-teal-600">S/ {reservation.total_price}</p>
                      </div>
                    </TooltipContent>
                  )}
                </Tooltip>
              );
            })}
          </div>
        </div>
      </TooltipProvider>
    );
  }

  // Week View
  if (viewMode === "week") {
    const days = eachDayOfInterval({ start: dateRange.start, end: dateRange.end });
    
    return (
      <div className="overflow-x-auto">
        <table className="w-full min-w-[800px] border-collapse">
          <thead>
            <tr>
              <th className="p-2 text-left text-sm font-medium text-slate-500 w-20 sticky left-0 bg-white z-10">Hora</th>
              {days.map(day => {
                const isToday = format(day, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');
                return (
                  <th key={day.toISOString()} className={cn("p-2 text-center text-sm", isToday && "bg-teal-50")}>
                    <div className="font-medium text-slate-700">{format(day, "EEE", { locale: es })}</div>
                    <div className={cn("text-lg font-bold", isToday && "text-teal-600")}>{format(day, "d")}</div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {hours.map(hour => (
              <tr key={hour} className="border-t border-slate-100">
                <td className="p-2 text-sm text-slate-500 font-medium sticky left-0 bg-white z-10">{hour}:00</td>
                {days.map(day => {
                  const reservation = getReservationForSlot(day, hour, selectedCourt?.id);
                  const selected = isSlotSelected(day, hour, selectedCourt?.id);
                  const isToday = format(day, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');

                  return (
                    <td key={day.toISOString()} className={cn("p-1", isToday && "bg-teal-50/50")}>
                      <button
                        onClick={() => handleSlotClick(day, hour, selectedCourt?.id)}
                        className={cn(
                          "w-full h-12 rounded-lg border text-xs transition-all flex items-center justify-center",
                          getSlotClass(day, hour, selectedCourt?.id)
                        )}
                      >
                        {reservation ? (
                          <span className="truncate px-1">{reservation.user_name?.split(' ')[0] || "R"}</span>
                        ) : selected ? (
                          <Check className="h-4 w-4" />
                        ) : null}
                      </button>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  // Month View
  const days = eachDayOfInterval({ start: dateRange.start, end: dateRange.end });
  const getReservationsForDate = (date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return reservations.filter(r => 
      r.date === dateStr && 
      r.court_id === selectedCourt?.id &&
      !["cancelled", "rejected", "auto_rejected"].includes(r.status)
    );
  };

  return (
    <div className="grid grid-cols-7 gap-2">
      {["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"].map(d => (
        <div key={d} className="p-2 text-center text-sm font-medium text-slate-500">{d}</div>
      ))}
      {days.map(day => {
        const dayReservations = getReservationsForDate(day);
        const isToday = format(day, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');
        const pendingCount = dayReservations.filter(r => r.status === "pending").length;
        const confirmedCount = dayReservations.filter(r => r.status === "accepted").length;

        return (
          <button
            key={day.toISOString()}
            onClick={() => onSlotClick(day)}
            className={cn(
              "p-2 rounded-xl min-h-[90px] text-left transition-all hover:ring-2 hover:ring-teal-300",
              isToday ? "bg-teal-50 border-2 border-teal-400" : "bg-white border border-slate-200"
            )}
          >
            <p className={cn("text-sm font-semibold", isToday ? "text-teal-700" : "text-slate-700")}>
              {format(day, "d")}
            </p>
            {dayReservations.length > 0 && (
              <div className="mt-1 space-y-1">
                {pendingCount > 0 && (
                  <Badge className="text-[10px] bg-amber-500 w-full justify-center">{pendingCount} pend.</Badge>
                )}
                {confirmedCount > 0 && (
                  <Badge className="text-[10px] bg-teal-600 w-full justify-center">{confirmedCount} conf.</Badge>
                )}
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
}