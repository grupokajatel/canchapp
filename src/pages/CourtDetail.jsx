import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createPageUrl } from "@/utils";
import { format, addDays } from "date-fns";
import { es } from "date-fns/locale";
import {
  MapPin, Phone, Star, Clock, ChevronLeft, ChevronRight,
  Calendar as CalendarIcon, CreditCard, Banknote, Navigation,
  Share2, Heart, Check, AlertCircle, Download
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import TimeSlotPicker from "@/components/reservation/TimeSlotPicker";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { toast } from "sonner";

export default function CourtDetail() {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedSlots, setSelectedSlots] = useState([]);
  const [paymentMethod, setPaymentMethod] = useState("efectivo");
  const [userPhone, setUserPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [user, setUser] = useState(null);
  const [reservationDetails, setReservationDetails] = useState(null);

  const queryClient = useQueryClient();

  // Get court ID from URL
  const urlParams = new URLSearchParams(window.location.search);
  const courtId = urlParams.get("id");

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);
      if (currentUser.phone) setUserPhone(currentUser.phone);
    } catch (error) {
      setUser(null);
    }
  };

  const { data: court, isLoading: courtLoading } = useQuery({
    queryKey: ['court', courtId],
    queryFn: () => base44.entities.Court.filter({ id: courtId }),
    select: (data) => data[0],
    enabled: !!courtId,
  });

  const { data: reviews = [] } = useQuery({
    queryKey: ['reviews', courtId],
    queryFn: () => base44.entities.Review.filter({ court_id: courtId }, '-created_date'),
    enabled: !!courtId,
  });

  const { data: reservations = [] } = useQuery({
    queryKey: ['reservations', courtId, format(selectedDate, 'yyyy-MM-dd')],
    queryFn: () => base44.entities.Reservation.filter({
      court_id: courtId,
      date: format(selectedDate, 'yyyy-MM-dd')
    }),
    enabled: !!courtId,
  });

  const createReservationMutation = useMutation({
    mutationFn: (data) => base44.entities.Reservation.create(data),
    onSuccess: (data) => {
      setReservationDetails(data);
      setShowConfirmDialog(false);
      setShowSuccessDialog(true);
      setSelectedSlots([]);
      queryClient.invalidateQueries(['reservations', courtId]);
      toast.success("¡Reserva creada exitosamente!");
    },
    onError: (error) => {
      toast.error("Error al crear la reserva");
    }
  });

  if (courtLoading) {
    return <LoadingSpinner className="min-h-screen" text="Cargando cancha..." />;
  }

  if (!court) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-slate-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-slate-800">Cancha no encontrada</h2>
          <p className="text-slate-500 mt-2">La cancha que buscas no existe o ha sido eliminada</p>
        </div>
      </div>
    );
  }

  const images = court.photos?.length > 0 
    ? court.photos 
    : ["https://images.unsplash.com/photo-1529900748604-07564a03e7a6?w=800"];

  const handleSlotSelect = (hour) => {
    setSelectedSlots(prev => {
      if (prev.includes(hour)) {
        return prev.filter(h => h !== hour);
      }
      return [...prev, hour].sort((a, b) => a - b);
    });
  };

  const calculateTotal = () => {
    return selectedSlots.reduce((sum, hour) => {
      if (court.night_price_enabled && hour >= 18 && court.night_price_per_hour) {
        return sum + court.night_price_per_hour;
      }
      return sum + court.price_per_hour;
    }, 0);
  };

  const handleReserve = () => {
    if (!user) {
      base44.auth.redirectToLogin(window.location.href);
      return;
    }
    if (selectedSlots.length === 0) {
      toast.error("Selecciona al menos un horario");
      return;
    }
    setShowConfirmDialog(true);
  };

  const confirmReservation = async () => {
    const sortedSlots = [...selectedSlots].sort((a, b) => a - b);
    const startHour = sortedSlots[0];
    const endHour = sortedSlots[sortedSlots.length - 1] + 1;
    
    const responseDeadline = new Date();
    responseDeadline.setMinutes(responseDeadline.getMinutes() + 10);

    const reservationData = {
      court_id: courtId,
      court_name: court.name,
      user_id: user.id,
      user_name: user.full_name,
      user_phone: userPhone,
      date: format(selectedDate, 'yyyy-MM-dd'),
      start_hour: startHour,
      end_hour: endHour,
      duration_hours: selectedSlots.length,
      total_price: calculateTotal(),
      payment_method: paymentMethod,
      owner_id: court.owner_id,
      response_deadline: responseDeadline.toISOString(),
      notes: notes,
      status: "pending"
    };

    createReservationMutation.mutate(reservationData);
  };

  const sportLabels = {
    futbol: "Fútbol",
    voley: "Vóley",
    basquet: "Básquet",
    futsal: "Futsal",
    tenis: "Tenis",
    otro: "Otro"
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white pb-24">
      {/* Image Gallery */}
      <div className="relative h-64 md:h-96 bg-slate-900">
        <img
          src={images[currentImageIndex]}
          alt={court.name}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        
        {/* Navigation Arrows */}
        {images.length > 1 && (
          <>
            <button
              onClick={() => setCurrentImageIndex(prev => prev === 0 ? images.length - 1 : prev - 1)}
              className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center hover:bg-white transition-colors"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>
            <button
              onClick={() => setCurrentImageIndex(prev => prev === images.length - 1 ? 0 : prev + 1)}
              className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center hover:bg-white transition-colors"
            >
              <ChevronRight className="h-6 w-6" />
            </button>
          </>
        )}

        {/* Image Indicators */}
        {images.length > 1 && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
            {images.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentImageIndex(idx)}
                className={`w-2 h-2 rounded-full transition-all ${
                  idx === currentImageIndex ? 'bg-white w-6' : 'bg-white/50'
                }`}
              />
            ))}
          </div>
        )}

        {/* Sport Badge */}
        <Badge className="absolute top-4 left-4 bg-white/90 text-slate-700">
          {sportLabels[court.sport_type]}
        </Badge>

        {/* Actions */}
        <div className="absolute top-4 right-4 flex gap-2">
          <Button size="icon" variant="ghost" className="bg-white/80 backdrop-blur-sm hover:bg-white">
            <Share2 className="h-5 w-5" />
          </Button>
          <Button size="icon" variant="ghost" className="bg-white/80 backdrop-blur-sm hover:bg-white">
            <Heart className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Header Card */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <div className="flex items-start justify-between">
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold text-slate-800">{court.name}</h1>
                  <div className="flex items-center gap-1.5 mt-2 text-slate-500">
                    <MapPin className="h-4 w-4" />
                    <span>{court.address}</span>
                  </div>
                </div>
                {court.average_rating > 0 && (
                  <div className="flex items-center gap-1 bg-amber-50 px-3 py-1.5 rounded-lg">
                    <Star className="h-5 w-5 fill-amber-400 text-amber-400" />
                    <span className="font-bold text-amber-700">{court.average_rating.toFixed(1)}</span>
                    <span className="text-slate-500 text-sm">({court.total_reviews})</span>
                  </div>
                )}
              </div>

              <div className="flex flex-wrap gap-3 mt-4 pt-4 border-t border-slate-100">
                <div className="flex items-center gap-2 text-slate-600">
                  <Clock className="h-4 w-4 text-teal-500" />
                  <span>{court.opening_hour || 6}:00 - {court.closing_hour || 23}:00</span>
                </div>
                <div className="flex items-center gap-2 text-slate-600">
                  <Phone className="h-4 w-4 text-teal-500" />
                  <span>{court.phone}</span>
                </div>
              </div>

              {court.description && (
                <p className="mt-4 text-slate-600">{court.description}</p>
              )}

              {/* Amenities */}
              {court.amenities?.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {court.amenities.map((amenity, idx) => (
                    <Badge key={idx} variant="secondary" className="bg-slate-100">
                      <Check className="h-3 w-3 mr-1" />
                      {amenity}
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {/* Tabs */}
            <Tabs defaultValue="horarios" className="bg-white rounded-2xl shadow-lg overflow-hidden">
              <TabsList className="w-full justify-start rounded-none border-b bg-slate-50 p-1">
                <TabsTrigger value="horarios" className="flex-1">Horarios</TabsTrigger>
                <TabsTrigger value="ubicacion" className="flex-1">Ubicación</TabsTrigger>
                <TabsTrigger value="resenas" className="flex-1">Reseñas</TabsTrigger>
              </TabsList>

              <TabsContent value="horarios" className="p-6">
                <div className="space-y-6">
                  {/* Date Picker */}
                  <div>
                    <Label className="text-base font-semibold mb-3 block">Selecciona una fecha</Label>
                    <div className="flex gap-2 overflow-x-auto pb-2">
                      {[...Array(14)].map((_, idx) => {
                        const date = addDays(new Date(), idx);
                        const isSelected = format(date, 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd');
                        return (
                          <button
                            key={idx}
                            onClick={() => {
                              setSelectedDate(date);
                              setSelectedSlots([]);
                            }}
                            className={`flex-shrink-0 p-3 rounded-xl text-center transition-all min-w-[70px] ${
                              isSelected 
                                ? 'bg-teal-600 text-white shadow-lg shadow-teal-500/30' 
                                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                            }`}
                          >
                            <p className="text-xs font-medium opacity-80">
                              {format(date, 'EEE', { locale: es })}
                            </p>
                            <p className="text-xl font-bold">{format(date, 'd')}</p>
                            <p className="text-xs opacity-80">
                              {format(date, 'MMM', { locale: es })}
                            </p>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Time Slots */}
                  <div>
                    <Label className="text-base font-semibold mb-3 block">
                      Horarios disponibles - {format(selectedDate, "EEEE d 'de' MMMM", { locale: es })}
                    </Label>
                    <TimeSlotPicker
                      date={selectedDate}
                      openingHour={court.opening_hour || 6}
                      closingHour={court.closing_hour || 23}
                      reservations={reservations}
                      selectedSlots={selectedSlots}
                      onSlotSelect={handleSlotSelect}
                      pricePerHour={court.price_per_hour}
                      nightPricePerHour={court.night_price_per_hour}
                      nightPriceEnabled={court.night_price_enabled}
                    />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="ubicacion" className="p-6">
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <MapPin className="h-5 w-5 text-teal-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-slate-800">{court.address}</p>
                      <p className="text-slate-500">{court.department}</p>
                    </div>
                  </div>

                  {court.latitude && court.longitude ? (
                    <div className="h-80 rounded-xl overflow-hidden border border-slate-200">
                      <MapContainer
                        center={[court.latitude, court.longitude]}
                        zoom={15}
                        style={{ height: "100%", width: "100%" }}
                      >
                        <TileLayer
                          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        />
                        <Marker position={[court.latitude, court.longitude]}>
                          <Popup>{court.name}</Popup>
                        </Marker>
                      </MapContainer>
                    </div>
                  ) : (
                    <div className="h-80 bg-slate-100 rounded-xl flex items-center justify-center">
                      <p className="text-slate-500">Mapa no disponible</p>
                    </div>
                  )}

                  {court.latitude && court.longitude && (
                    <a
                      href={`https://www.google.com/maps/dir/?api=1&destination=${court.latitude},${court.longitude}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Button className="w-full bg-teal-600 hover:bg-teal-700">
                        <Navigation className="h-4 w-4 mr-2" />
                        Cómo llegar
                      </Button>
                    </a>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="resenas" className="p-6">
                {reviews.length > 0 ? (
                  <div className="space-y-4">
                    {reviews.map((review) => (
                      <div key={review.id} className="p-4 bg-slate-50 rounded-xl">
                        <div className="flex items-center justify-between mb-2">
                          <p className="font-medium text-slate-800">{review.user_name || "Usuario"}</p>
                          <div className="flex items-center gap-1">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`h-4 w-4 ${
                                  i < review.rating
                                    ? 'fill-amber-400 text-amber-400'
                                    : 'text-slate-300'
                                }`}
                              />
                            ))}
                          </div>
                        </div>
                        {review.comment && (
                          <p className="text-slate-600 text-sm">{review.comment}</p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Star className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                    <p className="text-slate-500">Aún no hay reseñas</p>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>

          {/* Sidebar - Reservation Card */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-lg p-6 sticky top-24">
              <div className="flex items-baseline justify-between mb-4">
                <div>
                  <span className="text-3xl font-bold text-teal-600">S/ {court.price_per_hour}</span>
                  <span className="text-slate-500">/hora</span>
                </div>
                {court.night_price_enabled && court.night_price_per_hour && (
                  <Badge className="bg-amber-100 text-amber-700">
                    Noche: S/ {court.night_price_per_hour}
                  </Badge>
                )}
              </div>

              {selectedSlots.length > 0 && (
                <div className="bg-teal-50 rounded-xl p-4 mb-4">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-slate-600">
                      {selectedSlots.length} hora{selectedSlots.length > 1 ? 's' : ''}
                    </span>
                    <span className="font-medium text-slate-800">
                      {format(selectedDate, "d MMM", { locale: es })}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600">Total</span>
                    <span className="text-2xl font-bold text-teal-700">
                      S/ {calculateTotal()}
                    </span>
                  </div>
                </div>
              )}

              <Button 
                onClick={handleReserve}
                disabled={selectedSlots.length === 0}
                className="w-full h-12 bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-700 hover:to-teal-800 text-lg shadow-lg shadow-teal-500/20"
              >
                {selectedSlots.length === 0 ? "Selecciona horario" : "Reservar ahora"}
              </Button>

              {!user && (
                <p className="text-sm text-slate-500 text-center mt-3">
                  Debes iniciar sesión para reservar
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Confirm Dialog */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Confirmar Reserva</DialogTitle>
            <DialogDescription>
              Completa los datos para tu reserva
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="bg-slate-50 rounded-xl p-4">
              <p className="font-semibold text-slate-800">{court?.name}</p>
              <p className="text-sm text-slate-500 mt-1">
                {format(selectedDate, "EEEE d 'de' MMMM", { locale: es })}
              </p>
              <p className="text-sm text-slate-500">
                {selectedSlots.sort((a, b) => a - b).map(h => `${h}:00`).join(" - ")} hrs
              </p>
            </div>

            <div>
              <Label>Tu teléfono</Label>
              <Input
                value={userPhone}
                onChange={(e) => setUserPhone(e.target.value)}
                placeholder="999 999 999"
                className="mt-1"
              />
            </div>

            <div>
              <Label>Método de pago</Label>
              <RadioGroup
                value={paymentMethod}
                onValueChange={setPaymentMethod}
                className="mt-2"
              >
                <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-slate-50 cursor-pointer">
                  <RadioGroupItem value="efectivo" id="efectivo" />
                  <Label htmlFor="efectivo" className="flex items-center gap-2 cursor-pointer flex-1">
                    <Banknote className="h-5 w-5 text-green-600" />
                    Efectivo (pagar en cancha)
                  </Label>
                </div>
                <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-slate-50 cursor-pointer">
                  <RadioGroupItem value="yape" id="yape" />
                  <Label htmlFor="yape" className="flex items-center gap-2 cursor-pointer flex-1">
                    <CreditCard className="h-5 w-5 text-purple-600" />
                    Yape
                  </Label>
                </div>
              </RadioGroup>
            </div>

            <div>
              <Label>Notas (opcional)</Label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Alguna nota para el dueño de la cancha..."
                className="mt-1"
              />
            </div>

            <div className="bg-teal-50 rounded-xl p-4">
              <div className="flex justify-between items-center">
                <span className="font-medium text-teal-800">Total a pagar</span>
                <span className="text-2xl font-bold text-teal-700">
                  S/ {calculateTotal()}
                </span>
              </div>
            </div>

            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                El dueño tiene 10 minutos para confirmar tu reserva
              </AlertDescription>
            </Alert>
          </div>

          <div className="flex gap-3">
            <Button 
              variant="outline" 
              className="flex-1"
              onClick={() => setShowConfirmDialog(false)}
            >
              Cancelar
            </Button>
            <Button 
              className="flex-1 bg-teal-600 hover:bg-teal-700"
              onClick={confirmReservation}
              disabled={createReservationMutation.isPending}
            >
              {createReservationMutation.isPending ? "Procesando..." : "Confirmar"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Success Dialog */}
      <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <DialogContent className="max-w-md text-center">
          <div className="py-6">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="h-8 w-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-slate-800 mb-2">¡Reserva Creada!</h2>
            <p className="text-slate-500 mb-6">
              Tu reserva está pendiente de confirmación. Te notificaremos cuando el dueño la acepte.
            </p>

            {reservationDetails && (
              <div className="bg-slate-50 rounded-xl p-4 text-left mb-6">
                <p className="font-semibold text-slate-800">{court?.name}</p>
                <p className="text-sm text-slate-500 mt-1">
                  {format(new Date(reservationDetails.date), "EEEE d 'de' MMMM", { locale: es })}
                </p>
                <p className="text-sm text-slate-500">
                  {reservationDetails.start_hour}:00 - {reservationDetails.end_hour}:00
                </p>
                <p className="text-lg font-bold text-teal-600 mt-2">
                  S/ {reservationDetails.total_price}
                </p>
              </div>
            )}

            <div className="flex gap-3">
              <Button 
                variant="outline" 
                className="flex-1"
                onClick={() => setShowSuccessDialog(false)}
              >
                Cerrar
              </Button>
              <Button 
                className="flex-1 bg-teal-600 hover:bg-teal-700"
                onClick={() => window.location.href = createPageUrl("MyReservations")}
              >
                Ver mis reservas
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}