import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { MapPin, List, Map as MapIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import CourtCard from "@/components/courts/CourtCard";
import CourtFilters from "@/components/courts/CourtFilters";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import EmptyState from "@/components/ui/EmptyState";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Fix for default markers
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

export default function SearchCourts() {
  const [viewMode, setViewMode] = useState("list");
  const [filters, setFilters] = useState({
    search: "",
    department: "all",
    sport_type: "all",
    maxPrice: null
  });

  // Get search param from URL
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const searchParam = urlParams.get("search");
    if (searchParam) {
      setFilters(prev => ({ ...prev, search: searchParam }));
    }
  }, []);

  const { data: courts = [], isLoading } = useQuery({
    queryKey: ['courts', filters],
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

  // Client-side filtering for search and price
  const filteredCourts = courts.filter(court => {
    if (filters.search && !court.name.toLowerCase().includes(filters.search.toLowerCase())) {
      return false;
    }
    if (filters.maxPrice && court.price_per_hour > filters.maxPrice) {
      return false;
    }
    return true;
  });

  const clearFilters = () => {
    setFilters({
      search: "",
      department: "all",
      sport_type: "all",
      maxPrice: null
    });
  };

  // Default center for Peru
  const mapCenter = [-12.0464, -77.0428];

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white pb-20">
      {/* Header */}
      <div className="bg-gradient-to-r from-teal-600 to-teal-700 text-white py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-2xl md:text-3xl font-bold mb-2">Buscar Canchas</h1>
          <p className="text-teal-100">Encuentra la cancha perfecta para tu próximo partido</p>
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
            {filteredCourts.length} cancha{filteredCourts.length !== 1 ? 's' : ''} encontrada{filteredCourts.length !== 1 ? 's' : ''}
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
          filteredCourts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCourts.map((court) => (
                <CourtCard key={court.id} court={court} />
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
          <div className="h-[600px] rounded-2xl overflow-hidden border border-slate-200 shadow-lg">
            <MapContainer
              center={mapCenter}
              zoom={6}
              style={{ height: "100%", width: "100%" }}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              {filteredCourts
                .filter(court => court.latitude && court.longitude)
                .map((court) => (
                  <Marker
                    key={court.id}
                    position={[court.latitude, court.longitude]}
                  >
                    <Popup>
                      <div className="p-2">
                        <h3 className="font-semibold">{court.name}</h3>
                        <p className="text-sm text-slate-500">{court.address}</p>
                        <p className="text-sm font-medium text-teal-600 mt-1">
                          S/ {court.price_per_hour}/hora
                        </p>
                        <a 
                          href={`/CourtDetail?id=${court.id}`}
                          className="text-sm text-teal-600 hover:underline block mt-2"
                        >
                          Ver detalles →
                        </a>
                      </div>
                    </Popup>
                  </Marker>
                ))}
            </MapContainer>
          </div>
        )}
      </div>
    </div>
  );
}