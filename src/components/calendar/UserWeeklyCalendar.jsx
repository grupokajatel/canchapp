import React, { useState, useMemo } from "react";
import { format, addDays, startOfWeek, addWeeks, subWeeks, isSameDay } from "date-fns";
import { es } from "date-fns/locale";
import { ChevronLeft, ChevronRight, Clock, Check, Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export default function UserWeeklyCalendar({
  court,
  reservations = [],
  selectedSlots = [],
  onSlotSelect,
  selectedDate,
  onDateChange
}) {
  const [weekStart, setWeekStart] = useState(startOfWeek(selectedDate || new Date(), { weekStartsOn: 1 }));
  
  const openingHour = court?.opening_hour || 6;
  const closingHour = court?.closing_hour || 23;

  const hours = useMemo(() => {
    const h = [];
    for (let i = openingHour; i < closingHour; i++) h.push(i);
    return h;
  }, [openingHour, closingHour]);

  const weekDays = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  }, [weekStart]);

  const goToPrevWeek = () => setWeekStart(subWeeks(weekStart, 1));
  const goToNextWeek = () => setWeekStart(addWeeks(weekStart, 1));
  const goToToday = () => setWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }));

  const isSlotReserved = (date, hour) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return reservations.some(r => 
      r.date === dateStr &&
      hour >= r.start_hour && 
      hour < r.end_hour && 
      !["rejected", "cancelled", "auto_rejected"].includes(r.status)
    );
  };

  const isSlotSelected = (date, hour) => {
    const key = `${format(date, 'yyyy-MM-dd')}_${hour}`;
    return selectedSlots.includes(key);
  };

  const isPastSlot = (date, hour) => {
    const now = new Date();
    const slotTime = new Date(date);
    slotTime.setHours(hour, 0, 0, 0);
    return slotTime < now;
  };

  const getSlotPrice = (hour) => {
    if (court?.night_price_enabled && hour >= 18 && court?.night_price_per_hour) {
      return court.night_price_per_hour;
    }
    return court?.price_per_hour || 0;
  };

  const handleSlotClick = (date, hour) => {
    if (isSlotReserved(date, hour) || isPastSlot(date, hour)) return;
    const key = `${format(date, 'yyyy-MM-dd')}_${hour}`;
    onSlotSelect(key, date, hour);
  };

  const formatHour = (hour) => {
    if (hour < 12) return `${hour} AM`;
    if (hour === 12) return "12 PM";
    return `${hour - 12} PM`;
  };

  // Calculate totals
  const totalPrice = selectedSlots.reduce((sum, key) => {
    const hour = parseInt(key.split('_')[1]);
    return sum + getSlotPrice(hour);
  }, 0);

  return (
    <div className="space-y-4">
      {/* Header with navigation */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={goToPrevWeek}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={goToToday}>
            Hoy
          </Button>
          <Button variant="outline" size="icon" onClick={goToNextWeek}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        <h3 className="text-lg font-semibold text-slate-800">
          {format(weekStart, "MMMM yyyy", { locale: es })}
        </h3>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 text-sm text-slate-600 bg-slate-50 p-3 rounded-lg">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-teal-500 shadow-sm" />
          <span>Seleccionado</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-slate-300" />
          <span>Ocupado</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-white border-2 border-slate-200" />
          <span>Disponible</span>
        </div>
        <div className="flex items-center gap-2">
          <Moon className="h-4 w-4 text-amber-500" />
          <span>Horario nocturno</span>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="w-full min-w-[700px] border-collapse">
          <thead className="bg-slate-50">
            <tr>
              <th className="p-3 text-left text-sm font-medium text-slate-500 w-20 sticky left-0 bg-slate-50 z-10 border-r border-slate-200">
                <Clock className="h-4 w-4" />
              </th>
              {weekDays.map(day => {
                const isToday = isSameDay(day, new Date());
                const isPast = day < new Date() && !isToday;
                return (
                  <th 
                    key={day.toISOString()} 
                    className={cn(
                      "p-3 text-center min-w-[90px] border-r border-slate-100 last:border-r-0",
                      isToday && "bg-teal-50",
                      isPast && "opacity-50"
                    )}
                  >
                    <div className="text-xs font-medium text-slate-500 uppercase">
                      {format(day, "EEE", { locale: es })}
                    </div>
                    <div className={cn(
                      "text-xl font-bold mt-0.5",
                      isToday ? "text-teal-600" : "text-slate-700"
                    )}>
                      {format(day, "d")}
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {hours.map(hour => {
              const isNightHour = court?.night_price_enabled && hour >= 18;
              return (
                <tr key={hour} className="border-t border-slate-100">
                  <td className={cn(
                    "p-2 text-sm font-medium sticky left-0 z-10 border-r border-slate-200",
                    isNightHour ? "bg-amber-50 text-amber-700" : "bg-white text-slate-500"
                  )}>
                    <div className="flex items-center gap-1">
                      {isNightHour && <Moon className="h-3 w-3" />}
                      {formatHour(hour)}
                    </div>
                  </td>
                  {weekDays.map(day => {
                    const reserved = isSlotReserved(day, hour);
                    const selected = isSlotSelected(day, hour);
                    const past = isPastSlot(day, hour);
                    const isToday = isSameDay(day, new Date());
                    const price = getSlotPrice(hour);

                    return (
                      <td 
                        key={day.toISOString()} 
                        className={cn(
                          "p-1 border-r border-slate-100 last:border-r-0",
                          isToday && "bg-teal-50/30"
                        )}
                      >
                        <button
                          onClick={() => handleSlotClick(day, hour)}
                          disabled={reserved || past}
                          className={cn(
                            "w-full h-14 rounded-lg border-2 transition-all duration-200 relative group",
                            reserved && "bg-slate-100 border-slate-200 cursor-not-allowed",
                            past && !reserved && "bg-slate-50 border-slate-100 cursor-not-allowed opacity-40",
                            selected && "bg-teal-500 border-teal-500 text-white shadow-lg shadow-teal-500/30",
                            !reserved && !selected && !past && "bg-white border-slate-200 hover:border-teal-400 hover:shadow-md cursor-pointer"
                          )}
                        >
                          {reserved ? (
                            <span className="text-xs text-slate-400">Ocupado</span>
                          ) : selected ? (
                            <div className="flex flex-col items-center justify-center">
                              <Check className="h-5 w-5" />
                              <span className="text-xs mt-0.5">S/{price}</span>
                            </div>
                          ) : !past && (
                            <span className={cn(
                              "text-xs font-medium",
                              isNightHour ? "text-amber-600" : "text-teal-600"
                            )}>
                              S/{price}
                            </span>
                          )}
                        </button>
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Selection Summary */}
      {selectedSlots.length > 0 && (
        <div className="bg-gradient-to-r from-teal-500 to-teal-600 rounded-xl p-4 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-teal-100">Horarios seleccionados</p>
              <p className="text-lg font-semibold mt-1">
                {selectedSlots.length} hora{selectedSlots.length > 1 ? 's' : ''}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-teal-100">Total</p>
              <p className="text-2xl font-bold">S/ {totalPrice}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}