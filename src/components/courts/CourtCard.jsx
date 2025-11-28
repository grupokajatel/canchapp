import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { MapPin, Star, Clock, DollarSign } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function CourtCard({ court, featured = false }) {
  const sportLabels = {
    futbol: "Fútbol",
    voley: "Vóley",
    basquet: "Básquet",
    futsal: "Futsal",
    tenis: "Tenis",
    otro: "Otro"
  };

  return (
    <Link to={createPageUrl(`CourtDetail?id=${court.id}`)}>
      <div className={`group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-slate-100 ${featured ? 'ring-2 ring-teal-500/20' : ''}`}>
        {/* Image */}
        <div className="relative aspect-[4/3] overflow-hidden">
          <img
            src={court.photos?.[0] || "https://images.unsplash.com/photo-1529900748604-07564a03e7a6?w=800"}
            alt={court.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
          
          {/* Sport Badge */}
          <Badge className="absolute top-3 left-3 bg-white/90 text-slate-700 backdrop-blur-sm">
            {sportLabels[court.sport_type] || court.sport_type}
          </Badge>

          {/* Rating */}
          {court.average_rating > 0 && (
            <div className="absolute top-3 right-3 flex items-center gap-1 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-lg">
              <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
              <span className="text-sm font-semibold">{court.average_rating.toFixed(1)}</span>
            </div>
          )}

          {/* Price */}
          <div className="absolute bottom-3 right-3 bg-teal-600 text-white px-3 py-1.5 rounded-lg font-semibold text-sm shadow-lg">
            S/ {court.price_per_hour}/hora
          </div>
        </div>

        {/* Content */}
        <div className="p-4">
          <h3 className="font-semibold text-lg text-slate-800 group-hover:text-teal-700 transition-colors line-clamp-1">
            {court.name}
          </h3>
          
          <div className="flex items-center gap-1.5 mt-2 text-slate-500 text-sm">
            <MapPin className="h-4 w-4 flex-shrink-0" />
            <span className="line-clamp-1">{court.address}</span>
          </div>

          <div className="flex items-center gap-4 mt-3 pt-3 border-t border-slate-100">
            <div className="flex items-center gap-1.5 text-slate-500 text-sm">
              <Clock className="h-4 w-4" />
              <span>{court.opening_hour || 6}am - {court.closing_hour || 23}pm</span>
            </div>
            {court.night_price_enabled && court.night_price_per_hour && (
              <div className="text-xs text-amber-600 font-medium">
                Noche: S/ {court.night_price_per_hour}/h
              </div>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}