import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { MapPin, Star, Building2, Layers } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function VenueCard({ venue, showDistance = false }) {
  const { courts, mainCourt } = venue;
  
  const sportLabels = {
    futbol: "Fútbol",
    voley: "Vóley",
    basquet: "Básquet",
    futsal: "Futsal",
    tenis: "Tenis",
    otro: "Otro"
  };

  // Get unique sports
  const uniqueSports = [...new Set(courts.map(c => c.sport_type))];
  
  // Get best rating
  const bestRating = Math.max(...courts.map(c => c.average_rating || 0));
  
  // Get price range
  const prices = courts.map(c => c.price_per_hour);
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);

  const formatDistance = (distance) => {
    if (!distance || distance === 999) return null;
    if (distance < 1) return `${Math.round(distance * 1000)} m`;
    return `${distance.toFixed(1)} km`;
  };

  return (
    <Link to={createPageUrl(`CourtDetail?id=${mainCourt.id}`)}>
      <div className="group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-slate-100">
        {/* Image with multiple courts indicator */}
        <div className="relative aspect-[4/3] overflow-hidden">
          <img
            src={mainCourt.photos?.[0] || "https://images.unsplash.com/photo-1529900748604-07564a03e7a6?w=800"}
            alt={mainCourt.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          
          {/* Multiple courts badge */}
          {courts.length > 1 && (
            <Badge className="absolute top-3 left-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white border-0 shadow-lg">
              <Layers className="h-3.5 w-3.5 mr-1" />
              {courts.length} canchas
            </Badge>
          )}

          {/* Sport badges */}
          <div className="absolute top-3 right-3 flex flex-wrap gap-1 max-w-[120px] justify-end">
            {uniqueSports.slice(0, 2).map(sport => (
              <Badge key={sport} className="bg-white/90 text-slate-700 backdrop-blur-sm text-xs">
                {sportLabels[sport]}
              </Badge>
            ))}
            {uniqueSports.length > 2 && (
              <Badge className="bg-white/90 text-slate-700 backdrop-blur-sm text-xs">
                +{uniqueSports.length - 2}
              </Badge>
            )}
          </div>

          {/* Rating */}
          {bestRating > 0 && (
            <div className="absolute bottom-3 left-3 flex items-center gap-1 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-lg">
              <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
              <span className="text-sm font-semibold">{bestRating.toFixed(1)}</span>
            </div>
          )}

          {/* Distance */}
          {showDistance && mainCourt.distance && mainCourt.distance !== 999 && (
            <div className="absolute bottom-3 right-3 flex items-center gap-1 bg-blue-600 text-white px-2.5 py-1 rounded-lg text-sm font-medium shadow-lg">
              <MapPin className="h-3.5 w-3.5" />
              {formatDistance(mainCourt.distance)}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-4">
          <div className="flex items-start gap-2">
            {courts.length > 1 && (
              <Building2 className="h-5 w-5 text-purple-600 flex-shrink-0 mt-0.5" />
            )}
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-lg text-slate-800 group-hover:text-teal-700 transition-colors line-clamp-1">
                {mainCourt.name}
              </h3>
              <div className="flex items-center gap-1.5 mt-1 text-slate-500 text-sm">
                <MapPin className="h-4 w-4 flex-shrink-0" />
                <span className="line-clamp-1">{mainCourt.address}</span>
              </div>
            </div>
          </div>

          {/* Courts preview for multi-court venues */}
          {courts.length > 1 && (
            <div className="mt-3 p-3 bg-gradient-to-r from-slate-50 to-purple-50 rounded-xl">
              <p className="text-xs text-slate-500 mb-2">Canchas disponibles:</p>
              <div className="flex flex-wrap gap-1.5">
                {courts.slice(0, 3).map(court => (
                  <Badge key={court.id} variant="outline" className="text-xs bg-white">
                    {sportLabels[court.sport_type]} • S/{court.price_per_hour}
                  </Badge>
                ))}
                {courts.length > 3 && (
                  <Badge variant="outline" className="text-xs bg-white text-purple-600">
                    +{courts.length - 3} más
                  </Badge>
                )}
              </div>
            </div>
          )}

          {/* Price */}
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100">
            <span className="text-sm text-slate-500">Desde</span>
            <div className="text-right">
              <span className="text-lg font-bold text-teal-600">S/ {minPrice}</span>
              <span className="text-slate-500 text-sm">/hora</span>
              {minPrice !== maxPrice && (
                <p className="text-xs text-slate-400">hasta S/ {maxPrice}</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}