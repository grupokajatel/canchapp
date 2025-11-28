import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createPageUrl } from "@/utils";
import { Link } from "react-router-dom";
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, addDays } from "date-fns";
import { es } from "date-fns/locale";
import {
  LayoutDashboard, Calendar, Building2, BarChart3, Settings,
  Plus, ChevronLeft, ChevronRight, Check, X, Clock, DollarSign,
  Users, TrendingUp, Menu, LogOut, Home, Bell, RefreshCw,
  FileSpreadsheet, AlertCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import EmptyState from "@/components/ui/EmptyState";
import { toast } from "sonner";

export default function OwnerDashboard() {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCourt, setSelectedCourt] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [showCreateCourtDialog, setShowCreateCourtDialog] = useState(false);
  const [newCourt, setNewCourt] = useState({
    name: "", description: "", sport_type: "futbol", address: "",
    department: "Lima", phone: "", price_per_hour: 50,
    night_price_per_hour: 70, night_price_enabled: false,
    opening_hour: 6, closing_hour: 23, amenities: []
  });

  const queryClient = useQueryClient();

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const currentUser = await base44.auth.me();
      if (currentUser.user_type !== "dueno" && currentUser.role !== "admin") {
        window.location.href = createPageUrl("Profile");
        return;
      }
      setUser(currentUser);
    } catch (error) {
      base44.auth.redirectToLogin(window.location.href);
    } finally {
      setIsLoading(false);
    }
  };

  const { data: courts = [], isLoading: courtsLoading } = useQuery({
    queryKey: ['owner-courts', user?.id],
    queryFn: () => base44.entities.Court.filter({ owner_id: user.id }),
    enabled: !!user?.id,
  });

  const { data: reservations = [], isLoading: reservationsLoading } = useQuery({
    queryKey: ['owner-reservations', selectedCourt?.id, format(selectedDate, 'yyyy-MM-dd')],
    queryFn: () => base44.entities.Reservation.filter({
      court_id: selectedCourt.id,
      date: format(selectedDate, 'yyyy-MM-dd')
    }),
    enabled: !!selectedCourt?.id,
  });

  const { data: allReservations = [] } = useQuery({
    queryKey: ['all-owner-reservations', user?.id],
    queryFn: async () => {
      const allCourts = await base44.entities.Court.filter({ owner_id: user.id });
      const courtIds = allCourts.map(c => c.id);
      const reservations = await base44.entities.Reservation.list('-created_date', 100);
      return reservations.filter(r => courtIds.includes(r.court_id));
    },
    enabled: !!user?.id,
  });

  const createCourtMutation = useMutation({
    mutationFn: (data) => base44.entities.Court.create({ ...data, owner_id: user.id }),
    onSuccess: () => {
      queryClient.invalidateQueries(['owner-courts']);
      setShowCreateCourtDialog(false);
      setNewCourt({
        name: "", description: "", sport_type: "futbol", address: "",
        department: "Lima", phone: "", price_per_hour: 50,
        night_price_per_hour: 70, night_price_enabled: false,
        opening_hour: 6, closing_hour: 23, amenities: []
      });
      toast.success("Cancha creada. Pendiente de aprobación.");
    },
    onError: () => toast.error("Error al crear la cancha")
  });

  const updateReservationMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Reservation.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['owner-reservations']);
      queryClient.invalidateQueries(['all-owner-reservations']);
      toast.success("Reserva actualizada");
    },
    onError: () => toast.error("Error al actualizar la reserva")
  });

  useEffect(() => {
    if (courts.length > 0 && !selectedCourt) {
      setSelectedCourt(courts[0]);
    }
  }, [courts]);

  if (isLoading) {
    return <LoadingSpinner className="min-h-screen" />;
  }

  if (!user) return null;

  const pendingReservations = allReservations.filter(r => r.status === "pending");
  const todayReservations = allReservations.filter(r => 
    r.date === format(new Date(), 'yyyy-MM-dd') && r.status === "accepted"
  );
  const totalIncome = allReservations
    .filter(r => r.status === "accepted" || r.status === "completed")
    .reduce((sum, r) => sum + (r.total_price || 0), 0);

  const hours = [];
  const openingHour = selectedCourt?.opening_hour || 6;
  const closingHour = selectedCourt?.closing_hour || 23;
  for (let i = openingHour; i < closingHour; i++) {
    hours.push(i);
  }

  const getReservationForHour = (hour) => {
    return reservations.find(r => 
      hour >= r.start_hour && hour < r.end_hour && 
      r.status !== "cancelled" && r.status !== "rejected" && r.status !== "auto_rejected"
    );
  };

  const Sidebar = () => (
    <div className="flex flex-col h-full bg-slate-900 text-white">
      <div className="p-6 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-teal-500 to-teal-700 rounded-xl flex items-center justify-center">
            <span className="text-white font-bold text-lg">C</span>
          </div>
          <div>
            <p className="font-bold">CanchApp</p>
            <p className="text-xs text-slate-400">Panel Dueño</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {[
          { id: "dashboard", icon: LayoutDashboard, label: "Dashboard" },
          { id: "calendar", icon: Calendar, label: "Calendario" },
          { id: "courts", icon: Building2, label: "Mis Canchas" },
          { id: "reports", icon: BarChart3, label: "Reportes" },
        ].map(item => (
          <button
            key={item.id}
            onClick={() => { setActiveTab(item.id); setSidebarOpen(false); }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
              activeTab === item.id 
                ? "bg-teal-600 text-white" 
                : "text-slate-400 hover:bg-slate-800 hover:text-white"
            }`}
          >
            <item.icon className="h-5 w-5" />
            {item.label}
            {item.id === "calendar" && pendingReservations.length > 0 && (
              <Badge className="ml-auto bg-amber-500">{pendingReservations.length}</Badge>
            )}
          </button>
        ))}
      </nav>

      <div className="p-4 border-t border-slate-800">
        <Link to={createPageUrl("Home")}>
          <Button variant="ghost" className="w-full justify-start text-slate-400 hover:text-white hover:bg-slate-800">
            <Home className="h-4 w-4 mr-2" />
            Volver al inicio
          </Button>
        </Link>
        <Button 
          variant="ghost" 
          className="w-full justify-start text-slate-400 hover:text-white hover:bg-slate-800"
          onClick={() => base44.auth.logout()}
        >
          <LogOut className="h-4 w-4 mr-2" />
          Cerrar sesión
        </Button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-100 flex">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:block w-64 fixed inset-y-0 left-0">
        <Sidebar />
      </aside>

      {/* Mobile Sidebar */}
      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetContent side="left" className="p-0 w-64">
          <Sidebar />
        </SheetContent>
      </Sheet>

      {/* Main Content */}
      <main className="flex-1 lg:ml-64">
        {/* Top Bar */}
        <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
          <div className="flex items-center justify-between px-4 lg:px-8 h-16">
            <div className="flex items-center gap-4">
              <Button 
                variant="ghost" 
                size="icon" 
                className="lg:hidden"
                onClick={() => setSidebarOpen(true)}
              >
                <Menu className="h-5 w-5" />
              </Button>
              <h1 className="text-lg font-semibold text-slate-800">
                {activeTab === "dashboard" && "Dashboard"}
                {activeTab === "calendar" && "Calendario de Reservas"}
                {activeTab === "courts" && "Mis Canchas"}
                {activeTab === "reports" && "Reportes"}
              </h1>
            </div>
            <div className="flex items-center gap-3">
              {pendingReservations.length > 0 && (
                <Badge className="bg-amber-500">
                  {pendingReservations.length} pendiente{pendingReservations.length > 1 ? 's' : ''}
                </Badge>
              )}
              <Avatar>
                <AvatarImage src={user.profile_photo} />
                <AvatarFallback>{user.full_name?.charAt(0)}</AvatarFallback>
              </Avatar>
            </div>
          </div>
        </header>

        <div className="p-4 lg:p-8">
          {/* Dashboard Tab */}
          {activeTab === "dashboard" && (
            <div className="space-y-6">
              {/* Stats Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-slate-500">Reservas Hoy</p>
                        <p className="text-3xl font-bold text-slate-800">{todayReservations.length}</p>
                      </div>
                      <div className="p-3 bg-teal-100 rounded-xl">
                        <Calendar className="h-6 w-6 text-teal-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-slate-500">Pendientes</p>
                        <p className="text-3xl font-bold text-amber-600">{pendingReservations.length}</p>
                      </div>
                      <div className="p-3 bg-amber-100 rounded-xl">
                        <Clock className="h-6 w-6 text-amber-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-slate-500">Mis Canchas</p>
                        <p className="text-3xl font-bold text-slate-800">{courts.length}</p>
                      </div>
                      <div className="p-3 bg-blue-100 rounded-xl">
                        <Building2 className="h-6 w-6 text-blue-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-slate-500">Ingresos Total</p>
                        <p className="text-3xl font-bold text-green-600">S/ {totalIncome}</p>
                      </div>
                      <div className="p-3 bg-green-100 rounded-xl">
                        <DollarSign className="h-6 w-6 text-green-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Pending Reservations */}
              {pendingReservations.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <AlertCircle className="h-5 w-5 text-amber-500" />
                      Reservas Pendientes
                    </CardTitle>
                    <CardDescription>
                      Tienes 10 minutos para responder cada reserva
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {pendingReservations.slice(0, 5).map(reservation => (
                        <div 
                          key={reservation.id}
                          className="flex items-center justify-between p-4 bg-amber-50 rounded-xl border border-amber-100"
                        >
                          <div>
                            <p className="font-medium text-slate-800">{reservation.user_name}</p>
                            <p className="text-sm text-slate-500">
                              {reservation.court_name} • {format(new Date(reservation.date), "d MMM", { locale: es })} • {reservation.start_hour}:00
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-red-600 border-red-200 hover:bg-red-50"
                              onClick={() => updateReservationMutation.mutate({
                                id: reservation.id,
                                data: { status: "rejected" }
                              })}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              className="bg-green-600 hover:bg-green-700"
                              onClick={() => updateReservationMutation.mutate({
                                id: reservation.id,
                                data: { status: "accepted" }
                              })}
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* Calendar Tab */}
          {activeTab === "calendar" && (
            <div className="space-y-6">
              {courts.length === 0 ? (
                <EmptyState
                  icon={Building2}
                  title="No tienes canchas"
                  description="Crea tu primera cancha para ver el calendario"
                  action={
                    <Button onClick={() => setShowCreateCourtDialog(true)} className="bg-teal-600 hover:bg-teal-700">
                      <Plus className="h-4 w-4 mr-2" />
                      Crear Cancha
                    </Button>
                  }
                />
              ) : (
                <>
                  {/* Court & Date Selection */}
                  <div className="flex flex-col sm:flex-row gap-4">
                    <Select 
                      value={selectedCourt?.id} 
                      onValueChange={(id) => setSelectedCourt(courts.find(c => c.id === id))}
                    >
                      <SelectTrigger className="w-full sm:w-64">
                        <SelectValue placeholder="Selecciona cancha" />
                      </SelectTrigger>
                      <SelectContent>
                        {courts.map(court => (
                          <SelectItem key={court.id} value={court.id}>{court.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <div className="flex items-center gap-2 bg-white rounded-xl border p-1">
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => setSelectedDate(addDays(selectedDate, -1))}
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <span className="px-4 font-medium">
                        {format(selectedDate, "EEEE d 'de' MMMM", { locale: es })}
                      </span>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => setSelectedDate(addDays(selectedDate, 1))}
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Calendar Grid */}
                  <Card>
                    <CardContent className="p-6">
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
                        {hours.map(hour => {
                          const reservation = getReservationForHour(hour);
                          return (
                            <div
                              key={hour}
                              className={`p-3 rounded-xl text-center transition-all ${
                                reservation
                                  ? reservation.status === "pending"
                                    ? "bg-amber-100 border-2 border-amber-300"
                                    : "bg-teal-100 border-2 border-teal-300"
                                  : "bg-slate-50 border-2 border-slate-200"
                              }`}
                            >
                              <p className="font-medium text-slate-700">{hour}:00</p>
                              {reservation ? (
                                <div className="mt-1">
                                  <p className="text-xs font-medium truncate">{reservation.user_name}</p>
                                  <Badge 
                                    className={`text-xs mt-1 ${
                                      reservation.status === "pending" 
                                        ? "bg-amber-500" 
                                        : "bg-teal-600"
                                    }`}
                                  >
                                    {reservation.status === "pending" ? "Pendiente" : "Confirmado"}
                                  </Badge>
                                </div>
                              ) : (
                                <p className="text-xs text-slate-400 mt-1">Libre</p>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>
                </>
              )}
            </div>
          )}

          {/* Courts Tab */}
          {activeTab === "courts" && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <p className="text-slate-500">{courts.length} cancha{courts.length !== 1 ? 's' : ''}</p>
                <Dialog open={showCreateCourtDialog} onOpenChange={setShowCreateCourtDialog}>
                  <DialogTrigger asChild>
                    <Button className="bg-teal-600 hover:bg-teal-700">
                      <Plus className="h-4 w-4 mr-2" />
                      Nueva Cancha
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Crear Nueva Cancha</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div>
                        <Label>Nombre *</Label>
                        <Input
                          value={newCourt.name}
                          onChange={(e) => setNewCourt({...newCourt, name: e.target.value})}
                          placeholder="Cancha La Victoria"
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label>Descripción</Label>
                        <Textarea
                          value={newCourt.description}
                          onChange={(e) => setNewCourt({...newCourt, description: e.target.value})}
                          className="mt-1"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Deporte</Label>
                          <Select 
                            value={newCourt.sport_type}
                            onValueChange={(v) => setNewCourt({...newCourt, sport_type: v})}
                          >
                            <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="futbol">Fútbol</SelectItem>
                              <SelectItem value="voley">Vóley</SelectItem>
                              <SelectItem value="basquet">Básquet</SelectItem>
                              <SelectItem value="futsal">Futsal</SelectItem>
                              <SelectItem value="tenis">Tenis</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label>Departamento</Label>
                          <Select 
                            value={newCourt.department}
                            onValueChange={(v) => setNewCourt({...newCourt, department: v})}
                          >
                            <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              {["Lima", "Arequipa", "Cusco", "Trujillo", "Chiclayo"].map(d => (
                                <SelectItem key={d} value={d}>{d}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div>
                        <Label>Dirección *</Label>
                        <Input
                          value={newCourt.address}
                          onChange={(e) => setNewCourt({...newCourt, address: e.target.value})}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label>Teléfono *</Label>
                        <Input
                          value={newCourt.phone}
                          onChange={(e) => setNewCourt({...newCourt, phone: e.target.value})}
                          className="mt-1"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Precio/hora (S/)</Label>
                          <Input
                            type="number"
                            value={newCourt.price_per_hour}
                            onChange={(e) => setNewCourt({...newCourt, price_per_hour: parseInt(e.target.value)})}
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label>Precio nocturno (S/)</Label>
                          <Input
                            type="number"
                            value={newCourt.night_price_per_hour}
                            onChange={(e) => setNewCourt({...newCourt, night_price_per_hour: parseInt(e.target.value)})}
                            className="mt-1"
                          />
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <Label>Habilitar precio nocturno (después de 6pm)</Label>
                        <Switch
                          checked={newCourt.night_price_enabled}
                          onCheckedChange={(v) => setNewCourt({...newCourt, night_price_enabled: v})}
                        />
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <Button variant="outline" className="flex-1" onClick={() => setShowCreateCourtDialog(false)}>
                        Cancelar
                      </Button>
                      <Button 
                        className="flex-1 bg-teal-600 hover:bg-teal-700"
                        onClick={() => createCourtMutation.mutate(newCourt)}
                        disabled={createCourtMutation.isPending}
                      >
                        {createCourtMutation.isPending ? "Creando..." : "Crear Cancha"}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>

              {courts.length === 0 ? (
                <EmptyState
                  icon={Building2}
                  title="No tienes canchas registradas"
                  description="Registra tu primera cancha y empieza a recibir reservas"
                />
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {courts.map(court => (
                    <Card key={court.id}>
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="font-semibold text-lg">{court.name}</h3>
                            <p className="text-sm text-slate-500">{court.address}</p>
                          </div>
                          <Badge className={
                            court.status === "approved" 
                              ? "bg-green-100 text-green-700" 
                              : court.status === "rejected"
                              ? "bg-red-100 text-red-700"
                              : "bg-amber-100 text-amber-700"
                          }>
                            {court.status === "approved" ? "Aprobada" : court.status === "rejected" ? "Rechazada" : "Pendiente"}
                          </Badge>
                        </div>
                        <div className="mt-4 flex items-center gap-4 text-sm text-slate-600">
                          <span>S/ {court.price_per_hour}/h</span>
                          <span>{court.opening_hour || 6}:00 - {court.closing_hour || 23}:00</span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Reports Tab */}
          {activeTab === "reports" && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Reportes</CardTitle>
                  <CardDescription>Exporta tus reportes de reservas</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-3">
                    <Button variant="outline">
                      <FileSpreadsheet className="h-4 w-4 mr-2" />
                      Exportar Semanal
                    </Button>
                    <Button variant="outline">
                      <FileSpreadsheet className="h-4 w-4 mr-2" />
                      Exportar Mensual
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Estadísticas del Mes</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-slate-50 rounded-xl">
                      <p className="text-sm text-slate-500">Reservas Totales</p>
                      <p className="text-2xl font-bold">{allReservations.length}</p>
                    </div>
                    <div className="p-4 bg-slate-50 rounded-xl">
                      <p className="text-sm text-slate-500">Confirmadas</p>
                      <p className="text-2xl font-bold text-green-600">
                        {allReservations.filter(r => r.status === "accepted" || r.status === "completed").length}
                      </p>
                    </div>
                    <div className="p-4 bg-slate-50 rounded-xl">
                      <p className="text-sm text-slate-500">Canceladas</p>
                      <p className="text-2xl font-bold text-red-600">
                        {allReservations.filter(r => r.status === "cancelled" || r.status === "rejected").length}
                      </p>
                    </div>
                    <div className="p-4 bg-slate-50 rounded-xl">
                      <p className="text-sm text-slate-500">Ingresos</p>
                      <p className="text-2xl font-bold text-teal-600">S/ {totalIncome}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}