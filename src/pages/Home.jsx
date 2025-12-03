import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { 
  Search, 
  MapPin, 
  ArrowRight, 
  Star, 
  Users, 
  Calendar,
  Trophy,
  ChevronRight,
  Sparkles,
  Navigation
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import CourtCard from "@/components/courts/CourtCard";
import VenueCard from "@/components/courts/VenueCard";
import MatchCard from "@/components/community/MatchCard";
import MatchDetailModal from "@/components/community/MatchDetailModal";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

// Calculate distance between two coordinates (Haversine formula)
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

export default function Home() {
  const [searchQuery, setSearchQuery] = useState("");
  const [userLocation, setUserLocation] = useState(null);
  const [locationError, setLocationError] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [user, setUser] = useState(null);

  // Load user
  useEffect(() => {
    const loadUser = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
      } catch (error) {
        setUser(null);
      }
    };
    loadUser();
  }, []);

  // Get user's location on mount
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        () => setLocationError(true),
        { enableHighAccuracy: true, timeout: 10000 }
      );
    }
  }, []);

  const { data: courts = [], isLoading: courtsLoading } = useQuery({
    queryKey: ['featured-courts'],
    queryFn: () => base44.entities.Court.filter({ status: "approved", is_active: true }, '-average_rating', 20),
  });

  // Group courts by owner/address (venue) and sort by distance
  const venues = React.useMemo(() => {
    if (courts.length === 0) return [];
    
    // Add distance to each court
    const courtsWithDistance = courts.map(court => ({
      ...court,
      distance: userLocation && court.latitude && court.longitude 
        ? calculateDistance(userLocation.lat, userLocation.lng, court.latitude, court.longitude)
        : 999
    }));

    // Group by owner_id (same owner = same venue)
    const venueMap = new Map();
    courtsWithDistance.forEach(court => {
      const key = court.owner_id;
      if (!venueMap.has(key)) {
        venueMap.set(key, { courts: [], mainCourt: court });
      }
      venueMap.get(key).courts.push(court);
    });

    // Convert to array and sort by best court distance
    return Array.from(venueMap.values())
      .map(venue => ({
        ...venue,
        mainCourt: {
          ...venue.courts[0],
          distance: Math.min(...venue.courts.map(c => c.distance))
        }
      }))
      .sort((a, b) => a.mainCourt.distance - b.mainCourt.distance)
      .slice(0, 6);
  }, [courts, userLocation]);

  const { data: matches = [], isLoading: matchesLoading } = useQuery({
    queryKey: ['upcoming-matches'],
    queryFn: () => base44.entities.Match.filter({ status: "open" }, '-created_date', 4),
  });

  const { data: ads = [] } = useQuery({
    queryKey: ['home-ads'],
    queryFn: () => base44.entities.Advertisement.filter({ location: "home", is_active: true }),
  });

  const handleSearch = (e) => {
    e.preventDefault();
    window.location.href = createPageUrl(`SearchCourts?search=${encodeURIComponent(searchQuery)}`);
  };

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-teal-600 via-teal-700 to-teal-900 text-white">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=1600')] bg-cover bg-center opacity-20" />
        <div className="absolute inset-0 bg-gradient-to-t from-teal-900/80 to-transparent" />
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-32">
          <div className="max-w-3xl">
            <Badge className="bg-white/10 text-white border-white/20 mb-6">
              <Sparkles className="h-3.5 w-3.5 mr-1.5" />
              La mejor app de canchas en Perú
            </Badge>
            
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-6">
              Reserva tu cancha en 
              <span className="text-amber-400"> segundos</span>
            </h1>
            
            <p className="text-lg md:text-xl text-teal-100 mb-8 max-w-2xl">
              Encuentra canchas de fútbol, vóley, básquet y más cerca de ti. 
              Únete a partidos o crea el tuyo.
            </p>

            {/* Search Bar */}
            <form onSubmit={handleSearch} className="flex gap-2 max-w-xl">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                <Input
                  type="text"
                  placeholder="Buscar canchas..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-12 h-14 bg-white border-0 text-slate-800 placeholder:text-slate-400 rounded-xl text-lg shadow-xl"
                />
              </div>
              <Button 
                type="submit"
                size="lg" 
                className="h-14 px-8 bg-amber-500 hover:bg-amber-600 text-white rounded-xl shadow-xl shadow-amber-500/30"
              >
                Buscar
              </Button>
            </form>

            {/* Quick Stats */}
            <div className="flex flex-wrap gap-6 mt-10 pt-10 border-t border-white/10">
              <div>
                <p className="text-3xl font-bold">500+</p>
                <p className="text-teal-200 text-sm">Canchas activas</p>
              </div>
              <div>
                <p className="text-3xl font-bold">10k+</p>
                <p className="text-teal-200 text-sm">Reservas mensuales</p>
              </div>
              <div>
                <p className="text-3xl font-bold">26</p>
                <p className="text-teal-200 text-sm">Departamentos</p>
              </div>
            </div>
          </div>
        </div>

        {/* Wave Shape */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M0 120L48 105C96 90 192 60 288 45C384 30 480 30 576 37.5C672 45 768 60 864 67.5C960 75 1056 75 1152 67.5C1248 60 1344 45 1392 37.5L1440 30V120H1392C1344 120 1248 120 1152 120C1056 120 960 120 864 120C768 120 672 120 576 120C480 120 384 120 288 120C192 120 96 120 48 120H0Z" fill="white"/>
          </svg>
        </div>
      </section>

      {/* Featured Courts */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-slate-800 flex items-center gap-2">
              {userLocation ? (
                <>
                  <Navigation className="h-6 w-6 text-teal-500" />
                  Canchas Cercanas
                </>
              ) : (
                "Canchas Destacadas"
              )}
            </h2>
            <p className="text-slate-500 mt-1">
              {userLocation ? "Ordenadas por distancia desde tu ubicación" : "Las mejor calificadas cerca de ti"}
            </p>
          </div>
          <Link 
            to={createPageUrl("SearchCourts")}
            className="flex items-center gap-1 text-teal-600 hover:text-teal-700 font-medium"
          >
            Ver todas
            <ChevronRight className="h-5 w-5" />
          </Link>
        </div>

        {courtsLoading ? (
          <LoadingSpinner className="py-12" />
        ) : venues.length > 0 ? (
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
          <div className="text-center py-12 bg-slate-50 rounded-2xl">
            <MapPin className="h-12 w-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500">No hay canchas disponibles aún</p>
          </div>
        )}
      </section>

      {/* Advertisement Banner */}
      {ads.length > 0 && (
        <section className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto mb-16">
          <a 
            href={ads[0].link_url || "#"} 
            target="_blank" 
            rel="noopener noreferrer"
            className="block relative overflow-hidden rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 text-white p-8 md:p-12"
          >
            {ads[0].image_url && (
              <img 
                src={ads[0].image_url} 
                alt={ads[0].title}
                className="absolute inset-0 w-full h-full object-cover mix-blend-overlay opacity-30"
              />
            )}
            <div className="relative">
              <Badge className="bg-white/20 text-white border-0 mb-4">Promoción</Badge>
              <h3 className="text-2xl md:text-3xl font-bold mb-2">{ads[0].title}</h3>
              <p className="text-white/80 max-w-lg">{ads[0].description}</p>
            </div>
          </a>
        </section>
      )}

      {/* Community Matches */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto bg-gradient-to-b from-white to-slate-50">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-slate-800 flex items-center gap-3">
              <Trophy className="h-8 w-8 text-amber-500" />
              Partidos Abiertos
            </h2>
            <p className="text-slate-500 mt-1">Únete a la comunidad de jugadores</p>
          </div>
          <Link 
            to={createPageUrl("Community")}
            className="flex items-center gap-1 text-teal-600 hover:text-teal-700 font-medium"
          >
            Ver todos
            <ChevronRight className="h-5 w-5" />
          </Link>
        </div>

        {matchesLoading ? (
          <LoadingSpinner className="py-12" />
        ) : matches.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {matches.map((match) => (
              <MatchCard 
                key={match.id} 
                match={match} 
                onViewDetails={() => setSelectedMatch(match)}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-white rounded-2xl border border-slate-100">
            <Users className="h-12 w-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500 mb-4">No hay partidos abiertos</p>
            <Link to={createPageUrl("Community")}>
              <Button className="bg-teal-600 hover:bg-teal-700">
                Crear un partido
              </Button>
            </Link>
          </div>
        )}
      </section>

      {/* How It Works */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-slate-900 text-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              ¿Cómo funciona?
            </h2>
            <p className="text-slate-400 max-w-2xl mx-auto">
              Reservar tu cancha favorita nunca fue tan fácil
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: Search,
                title: "Busca",
                description: "Encuentra canchas cerca de ti con nuestro buscador inteligente"
              },
              {
                icon: Calendar,
                title: "Reserva",
                description: "Elige el horario disponible y confirma tu reserva al instante"
              },
              {
                icon: Trophy,
                title: "Juega",
                description: "Llega a la cancha y disfruta tu partido con amigos"
              }
            ].map((step, index) => (
              <div key={index} className="relative">
                <div className="bg-gradient-to-br from-teal-500 to-teal-700 w-16 h-16 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-teal-500/30">
                  <step.icon className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-bold mb-3">{step.title}</h3>
                <p className="text-slate-400">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-teal-600 to-teal-700">
        <div className="max-w-4xl mx-auto text-center text-white">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            ¿Tienes una cancha deportiva?
          </h2>
          <p className="text-xl text-teal-100 mb-8">
            Únete a CanchApp y aumenta tus reservas hasta un 300%
          </p>
          <Link to={createPageUrl("Profile")}>
            <Button size="lg" className="bg-white text-teal-700 hover:bg-teal-50 shadow-xl">
              Registrar mi cancha
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-white py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-gradient-to-br from-teal-500 to-teal-700 rounded-xl flex items-center justify-center">
                <span className="text-white font-bold text-lg">C</span>
              </div>
              <span className="text-xl font-bold">CanchApp</span>
            </div>
            <p className="text-slate-400 text-sm">
              © 2024 CanchApp. Todos los derechos reservados.
            </p>
          </div>
        </div>
      </footer>

      {/* Match Detail Modal */}
      <MatchDetailModal
        match={selectedMatch}
        open={!!selectedMatch}
        onClose={() => setSelectedMatch(null)}
        onJoin={() => {
          window.location.href = createPageUrl("Community");
        }}
        isJoining={false}
        currentUserId={user?.id}
      />
    </div>
  );
}