import React, { useState, useEffect, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { MapPin, List, Map as MapIcon, Navigation, Locate } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import CourtCard from "@/components/courts/CourtCard";
import VenueCard from "@/components/courts/VenueCard";
import CourtFilters from "@/components/courts/CourtFilters";
import MapCourtPopup from "@/components/courts/MapCourtPopup";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import EmptyState from "@/components/ui/EmptyState";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Fix for default markers
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

// Custom user location icon
const userLocationIcon = new L.Icon({
  iconUrl: 'data:image/svg+xml;base64,' + btoa(`
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="#3B82F6" stroke="#fff" stroke-width="2">
      <circle cx="12" cy="12" r="8"/>
    </svg>
  `),
  iconSize: [24, 24],
  iconAnchor: [12, 12],
});

// Custom court marker icon
const courtMarkerIcon = new L.Icon({
  iconUrl: 'data:image/svg+xml;base64,' + btoa(`
    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="40" viewBox="0 0 32 40">
      <path d="M16 0C7.163 0 0 7.163 0 16c0 12 16 24 16 24s16-12 16-24c0-8.837-7.163-16-16-16z" fill="#0D9488"/>
      <circle cx="16" cy="14" r="6" fill="#fff"/>
    </svg>
  `),
  iconSize: [32, 40],
  iconAnchor: [16, 40],
  popupAnchor: [0, -40],
});

// Calculate distance between two coordinates
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

// Map controller component to handle centering
function MapController({ center, zoom }) {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.setView(center, zoom);
    }
  }, [center, zoom, map]);
  return null;
}

export default function SearchCourts() {
  const [viewMode, setViewMode] = useState("list");
  const [userLocation, setUserLocation] = useState(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [mapCenter, setMapCenter] = useState([-12.0464, -77.0428]);
  const [mapZoom, setMapZoom] = useState(6);
  const [filters, setFilters] = useState({
    search: "",
    department: "all",
    sport_type: "all",
    maxPrice: null,
    minPrice: null,
    availableHour: null,
    amenities: []
  });

  // Get user location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const loc = { lat: position.coords.latitude, lng: position.coords.longitude };
          setUserLocation(loc);
          setMapCenter([loc.lat, loc.lng]);
          setMapZoom(13);
        },
        () => {},
        { enableHighAccuracy: true, timeout: 10000 }
      );
    }
  }, []);

  // Get search param from URL
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const searchParam = urlParams.get("search");
    if (searchParam) {
      setFilters(prev => ({ ...prev, search: searchParam }));
    }
  }, []);

  const { data: courts = [], isLoading } = useQuery({
    queryKey: ['courts', filters.department, filters.sport_type],
    queryFn: async () => {
      let query = { status: "approved", is_active: true };
      if (filters.department && filters.department !== "all") {
        query.department = filters.department;
      }
      if (filters.sport_type && filters.sport_type !== "all") {
        query.sport_type = filters.sport_type;
      }
      return base44.entities.Court.filter(query, '-average_rating');
    },
  });

  // Apply all filters and add distance
  const filteredCourts = useMemo(() => {
    return courts
      .map(court => ({
        ...court,
        distance: userLocation && court.latitude && court.longitude
          ? calculateDistance(userLocation.lat, userLocation.lng, court.latitude, court.longitude)
          : null
      }))
      .filter(court => {
        // Search filter
        if (filters.search && !court.name.toLowerCase().includes(filters.search.toLowerCase())) {
          return false;
        }
        // Price range filter
        if (filters.minPrice && court.price_per_hour < filters.minPrice) {
          return false;
        }
        if (filters.maxPrice && court.price_per_hour > filters.maxPrice) {
          return false;
        }
        // Available hour filter
        if (filters.availableHour) {
          const opening = court.opening_hour || 6;
          const closing = court.closing_hour || 23;
          if (filters.availableHour < opening || filters.availableHour >= closing) {
            return false;
          }
        }
        // Amenities filter
        if (filters.amenities?.length > 0) {
          const courtAmenities = court.amenities || [];
          const hasAllAmenities = filters.amenities.every(amenity => 
            courtAmenities.some(ca => ca.toLowerCase().includes(amenity.toLowerCase()))
          );
          if (!hasAllAmenities) {
            return false;
          }
        }
        return true;
      })
      .sort((a, b) => {
        // Sort by distance if available
        if (a.distance !== null && b.distance !== null) {
          return a.distance - b.distance;
        }
        return (b.average_rating || 0) - (a.average_rating || 0);
      });
  }, [courts, filters, userLocation]);

  // Group courts by venue (owner_id)
  const venues = useMemo(() => {
    if (filteredCourts.length === 0) return [];
    
    const venueMap = new Map();
    filteredCourts.forEach(court => {
      const key = court.owner_id;
      if (!venueMap.has(key)) {
        venueMap.set(key, { courts: [], mainCourt: court });
      }
      venueMap.get(key).courts.push(court);
    });

    return Array.from(venueMap.values())
      .map(venue => ({
        ...venue,
        mainCourt: {
          ...venue.courts[0],
          distance: Math.min(...venue.courts.map(c => c.distance || 999))
        }
      }))
      .sort((a, b) => (a.mainCourt.distance || 999) - (b.mainCourt.distance || 999));
  }, [filteredCourts]);

  const clearFilters = () => {
    setFilters({
      search: "",
      department: "all",
      sport_type: "all",
      maxPrice: null,
      minPrice: null,
      availableHour: null,
      amenities: []
    });
  };

  const handleLocateMe = () => {
    setLocationLoading(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const loc = { lat: position.coords.latitude, lng: position.coords.longitude };
          setUserLocation(loc);
          setMapCenter([loc.lat, loc.lng]);
          setMapZoom(14);
          setLocationLoading(false);
        },
        () => setLocationLoading(false),
        { enableHighAccuracy: true, timeout: 10000 }
      );
    } else {
      setLocationLoading(false);
    }
  };

  const courtsWithCoords = filteredCourts.filter(court => court.latitude && court.longitude);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white pb-20">
      {/* Header */}
      <div className="bg-gradient-to-r from-teal-600 to-teal-700 text-white py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-2xl md:text-3xl font-bold mb-2 flex items-center gap-2">
            {userLocation && <Navigation className="h-6 w-6" />}
            Buscar Canchas
          </h1>
          <p className="text-teal-100">
            {userLocation 
              ? "Mostrando canchas ordenadas por distancia desde tu ubicación" 
              : "Encuentra la cancha perfecta para tu próximo partido"
            }
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Filters */}
        <div className="mb-6">
          <CourtFilters 
            filters={filters}
            onFilterChange={setFilters}
            onClearFilters={clearFilters}
          />
        </div>

        {/* View Toggle & Results Count */}
        <div className="flex items-center justify-between mb-6">
          <p className="text-sm text-slate-600">
            {filteredCourts.length} cancha{filteredCourts.length !== 1 ? 's' : ''} en {venues.length} local{venues.length !== 1 ? 'es' : ''}
          </p>
          <Tabs value={viewMode} onValueChange={setViewMode}>
            <TabsList className="bg-slate-100">
              <TabsTrigger value="list" className="flex items-center gap-1.5">
                <List className="h-4 w-4" />
                Lista
              </TabsTrigger>
              <TabsTrigger value="map" className="flex items-center gap-1.5">
                <MapIcon className="h-4 w-4" />
                Mapa
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Content */}
        {isLoading ? (
          <LoadingSpinner className="py-20" text="Buscando canchas..." />
        ) : viewMode === "list" ? (
          venues.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {venues.map((venue) => (
                venue.courts.length > 1 ? (
                  <VenueCard key={venue.mainCourt.owner_id} venue={venue} showDistance={!!userLocation} />
                ) : (
                  <CourtCard key={venue.mainCourt.id} court={venue.mainCourt} showDistance={!!userLocation} />
                )
              ))}
            </div>
          ) : (
            <EmptyState
              icon={MapPin}
              title="No se encontraron canchas"
              description="Intenta ajustar tus filtros de búsqueda"
              action={
                <Button variant="outline" onClick={clearFilters}>
                  Limpiar filtros
                </Button>
              }
            />
          )
        ) : (
          <div className="relative">
            {/* Locate Me Button */}
            <Button
              onClick={handleLocateMe}
              disabled={locationLoading}
              className="absolute top-4 right-4 z-[1000] bg-white text-slate-700 hover:bg-slate-50 shadow-lg"
              size="sm"
            >
              <Locate className={`h-4 w-4 mr-2 ${locationLoading ? 'animate-pulse' : ''}`} />
              {locationLoading ? "Buscando..." : "Mi ubicación"}
            </Button>

            <div className="h-[600px] rounded-2xl overflow-hidden border border-slate-200 shadow-lg">
              <MapContainer
                center={mapCenter}
                zoom={mapZoom}
                style={{ height: "100%", width: "100%" }}
              >
                <MapController center={mapCenter} zoom={mapZoom} />
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                
                {/* User location marker */}
                {userLocation && (
                  <Marker 
                    position={[userLocation.lat, userLocation.lng]} 
                    icon={userLocationIcon}
                  >
                    <Popup>
                      <div className="text-center p-2">
                        <p className="font-semibold text-blue-600">Tu ubicación</p>
                      </div>
                    </Popup>
                  </Marker>
                )}

                {/* Court markers */}
                {courtsWithCoords.map((court) => (
                  <Marker
                    key={court.id}
                    position={[court.latitude, court.longitude]}
                    icon={courtMarkerIcon}
                  >
                    <Popup maxWidth={300} minWidth={280}>
                      <MapCourtPopup court={court} userLocation={userLocation} />
                    </Popup>
                  </Marker>
                ))}
              </MapContainer>
            </div>

            {/* Courts count overlay */}
            <div className="absolute bottom-4 left-4 z-[1000] bg-white rounded-lg shadow-lg px-4 py-2">
              <p className="text-sm text-slate-600">
                <span className="font-semibold text-teal-600">{courtsWithCoords.length}</span> canchas en el mapa
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}