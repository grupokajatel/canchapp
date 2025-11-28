import React from "react";
import { cn } from "@/lib/utils";
import { Clock, Check } from "lucide-react";

export default function TimeSlotPicker({ 
  date, 
  openingHour = 6, 
  closingHour = 23,
  reservations = [],
  selectedSlots = [],
  onSlotSelect,
  pricePerHour,
  nightPricePerHour,
  nightPriceEnabled
}) {
  const hours = [];
  for (let i = openingHour; i < closingHour; i++) {
    hours.push(i);
  }

  const isSlotReserved = (hour) => {
    return reservations.some(r => {
      const startHour = r.start_hour;
      const endHour = r.end_hour;
      return hour >= startHour && hour < endHour && r.status !== 'rejected' && r.status !== 'cancelled' && r.status !== 'auto_rejected';
    });
  };

  const isSlotSelected = (hour) => {
    return selectedSlots.includes(hour);
  };

  const getSlotPrice = (hour) => {
    if (nightPriceEnabled && hour >= 18 && nightPricePerHour) {
      return nightPricePerHour;
    }
    return pricePerHour;
  };

  const handleSlotClick = (hour) => {
    if (isSlotReserved(hour)) return;
    onSlotSelect(hour);
  };

  const formatHour = (hour) => {
    if (hour === 0) return "12:00 AM";
    if (hour < 12) return `${hour}:00 AM`;
    if (hour === 12) return "12:00 PM";
    return `${hour - 12}:00 PM`;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4 text-sm text-slate-600">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-teal-500" />
          <span>Seleccionado</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-slate-200" />
          <span>Ocupado</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-white border border-slate-200" />
          <span>Disponible</span>
        </div>
      </div>

      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2">
        {hours.map((hour) => {
          const reserved = isSlotReserved(hour);
          const selected = isSlotSelected(hour);
          const price = getSlotPrice(hour);
          const isNightPrice = nightPriceEnabled && hour >= 18;

          return (
            <button
              key={hour}
              onClick={() => handleSlotClick(hour)}
              disabled={reserved}
              className={cn(
                "relative p-3 rounded-xl border-2 transition-all duration-200 text-left",
                reserved && "bg-slate-100 border-slate-200 cursor-not-allowed opacity-50",
                selected && "bg-teal-500 border-teal-500 text-white shadow-lg shadow-teal-500/30",
                !reserved && !selected && "bg-white border-slate-200 hover:border-teal-300 hover:shadow-md cursor-pointer"
              )}
            >
              <div className="flex items-center gap-1 mb-1">
                <Clock className={cn("h-3.5 w-3.5", selected ? "text-white" : "text-slate-400")} />
                <span className={cn("text-sm font-medium", selected ? "text-white" : "text-slate-700")}>
                  {formatHour(hour)}
                </span>
              </div>
              <div className={cn(
                "text-xs font-semibold",
                selected ? "text-teal-100" : isNightPrice ? "text-amber-600" : "text-teal-600"
              )}>
                S/ {price}
              </div>
              {selected && (
                <div className="absolute top-1 right-1">
                  <Check className="h-4 w-4 text-white" />
                </div>
              )}
            </button>
          );
        })}
      </div>

      {selectedSlots.length > 0 && (
        <div className="mt-4 p-4 bg-teal-50 rounded-xl border border-teal-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-teal-700 font-medium">Horarios seleccionados:</p>
              <p className="text-teal-600 text-sm mt-1">
                {selectedSlots.sort((a, b) => a - b).map(h => formatHour(h)).join(", ")}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-teal-600">Total</p>
              <p className="text-xl font-bold text-teal-700">
                S/ {selectedSlots.reduce((sum, h) => sum + getSlotPrice(h), 0)}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}