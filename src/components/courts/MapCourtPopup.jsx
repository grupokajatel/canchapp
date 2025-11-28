import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Star, MapPin, Clock, Navigation, ChevronRight, Wifi, Car, ShowerHead, Coffee } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const AMENITY_ICONS = {
  "Wifi": Wifi, "WiFi": Wifi, "Estacionamiento": Car, "Duchas": ShowerHead, "Cafetería": Coffee, "Cafeteria": Coffee
};

export default function MapCourtPopup({ court, userLocation }) {
  const sportLabels = {
    futbol: "Fútbol", voley: "Vóley", basquet: "Básquet", futsal: "Futsal", tenis: "Tenis", otro: "Otro"
  };

  const formatDistance = (distance) => {
    if (!distance) return null;
    if (distance < 1) return `${Math.round(distance * 1000)} m`;
    return `${distance.toFixed(1)} km`;
  };

  return (
    <div className="w-72 p-0">
      {/* Image */}
      <div className="relative h-32 -mx-3 -mt-3 mb-3 overflow-hidden rounded-t-lg">
        <img
          src={court.photos?.[0] || "https://images.unsplash.com/photo-1529900748604-07564a03e7a6?w=400"}
          alt={court.name}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
        <Badge className="absolute top-2 left-2 bg-white/90 text-slate-700 text-xs">
          {sportLabels[court.sport_type]}
        </Badge>
        {court.average_rating > 0 && (
          <div className="absolute top-2 right-2 flex items-center gap-1 bg-white/90 px-1.5 py-0.5 rounded text-xs">
            <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
            <span className="font-semibold">{court.average_rating.toFixed(1)}</span>
          </div>
        )}
        <div className="absolute bottom-2 right-2 bg-teal-600 text-white px-2 py-1 rounded text-sm font-semibold">
          S/ {court.price_per_hour}/h
        </div>
      </div>

      {/* Content */}
      <div className="space-y-2">
        <h3 className="font-semibold text-slate-800 text-base line-clamp-1">{court.name}</h3>
        
        <div className="flex items-center gap-1 text-slate-500 text-xs">
          <MapPin className="h-3 w-3 flex-shrink-0" />
          <span className="line-clamp-1">{court.address}</span>
        </div>

        <div className="flex items-center gap-3 text-xs text-slate-500">
          <div className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            <span>{court.opening_hour || 6}:00 - {court.closing_hour || 23}:00</span>
          </div>
          {court.distance && (
            <div className="flex items-center gap-1 text-blue-600 font-medium">
              <Navigation className="h-3 w-3" />
              <span>{formatDistance(court.distance)}</span>
            </div>
          )}
        </div>

        {/* Amenities */}
        {court.amenities?.length > 0 && (
          <div className="flex gap-1.5">
            {court.amenities.slice(0, 4).map((amenity, idx) => {
              const Icon = AMENITY_ICONS[amenity];
              return Icon ? (
                <div key={idx} className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center" title={amenity}>
                  <Icon className="h-3 w-3 text-slate-600" />
                </div>
              ) : null;
            })}
            {court.amenities.length > 4 && (
              <span className="text-xs text-slate-400 self-center">+{court.amenities.length - 4}</span>
            )}
          </div>
        )}

        {/* Action */}
        <Link to={createPageUrl(`CourtDetail?id=${court.id}`)} className="block pt-2">
          <Button className="w-full h-9 bg-teal-600 hover:bg-teal-700 text-sm">
            Ver detalles
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </Link>
      </div>
    </div>
  );
}