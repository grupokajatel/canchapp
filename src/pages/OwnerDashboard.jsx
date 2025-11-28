import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createPageUrl } from "@/utils";
import { Link } from "react-router-dom";
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, addDays, addWeeks, addMonths, subWeeks, subMonths, eachDayOfInterval } from "date-fns";
import { es } from "date-fns/locale";
import {
  LayoutDashboard, Calendar, Building2, BarChart3, Settings,
  Plus, ChevronLeft, ChevronRight, Check, X, Clock, DollarSign,
  Users, TrendingUp, Menu, LogOut, Home, Bell, RefreshCw,
  FileSpreadsheet, AlertCircle, Package, ShoppingCart, Edit, Trash2,
  CalendarDays, CalendarRange
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
  const [viewMode, setViewMode] = useState("day"); // day, week, month
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [showCreateCourtDialog, setShowCreateCourtDialog] = useState(false);
  const [showManualReservationDialog, setShowManualReservationDialog] = useState(false);
  const [showProductDialog, setShowProductDialog] = useState(false);
  const [showSaleDialog, setShowSaleDialog] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  
  const [newCourt, setNewCourt] = useState({
    name: "", description: "", sport_type: "futbol", address: "",
    department: "Lima", phone: "", price_per_hour: 50,
    night_price_per_hour: 70, night_price_enabled: false,
    opening_hour: 6, closing_hour: 23, amenities: []
  });

  const [manualReservation, setManualReservation] = useState({
    user_name: "", user_phone: "", date: format(new Date(), 'yyyy-MM-dd'),
    start_hour: 8, duration_hours: 1, payment_method: "efectivo", notes: ""
  });

  const [newProduct, setNewProduct] = useState({
    name: "", description: "", price: 0, stock: 0, category: "bebidas"
  });

  const [newSale, setNewSale] = useState({
    product_id: "", quantity: 1, customer_name: "", payment_method: "efectivo"
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

  const { data: courts = [] } = useQuery({
    queryKey: ['owner-courts', user?.id],
    queryFn: () => base44.entities.Court.filter({ owner_id: user.id }),
    enabled: !!user?.id,
  });

  // Get date range based on view mode
  const getDateRange = () => {
    if (viewMode === "day") {
      return { start: selectedDate, end: selectedDate };
    } else if (viewMode === "week") {
      return {
        start: startOfWeek(selectedDate, { weekStartsOn: 1 }),
        end: endOfWeek(selectedDate, { weekStartsOn: 1 })
      };
    } else {
      return {
        start: startOfMonth(selectedDate),
        end: endOfMonth(selectedDate)
      };
    }
  };

  const dateRange = getDateRange();

  const { data: reservations = [] } = useQuery({
    queryKey: ['owner-reservations', selectedCourt?.id, viewMode, format(selectedDate, 'yyyy-MM')],
    queryFn: async () => {
      if (!selectedCourt?.id) return [];
      const allReservations = await base44.entities.Reservation.filter({ court_id: selectedCourt.id });
      const start = format(dateRange.start, 'yyyy-MM-dd');
      const end = format(dateRange.end, 'yyyy-MM-dd');
      return allReservations.filter(r => r.date >= start && r.date <= end);
    },
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

  const { data: products = [] } = useQuery({
    queryKey: ['owner-products', user?.id],
    queryFn: () => base44.entities.Product.filter({ owner_id: user.id }),
    enabled: !!user?.id,
  });

  const { data: sales = [] } = useQuery({
    queryKey: ['owner-sales', user?.id],
    queryFn: () => base44.entities.Sale.filter({ owner_id: user.id }, '-created_date', 100),
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

  const createManualReservationMutation = useMutation({
    mutationFn: (data) => base44.entities.Reservation.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['owner-reservations']);
      queryClient.invalidateQueries(['all-owner-reservations']);
      setShowManualReservationDialog(false);
      setManualReservation({
        user_name: "", user_phone: "", date: format(new Date(), 'yyyy-MM-dd'),
        start_hour: 8, duration_hours: 1, payment_method: "efectivo", notes: ""
      });
      toast.success("Reserva manual creada");
    },
    onError: () => toast.error("Error al crear la reserva")
  });

  const createProductMutation = useMutation({
    mutationFn: (data) => base44.entities.Product.create({ ...data, owner_id: user.id }),
    onSuccess: () => {
      queryClient.invalidateQueries(['owner-products']);
      setShowProductDialog(false);
      setNewProduct({ name: "", description: "", price: 0, stock: 0, category: "bebidas" });
      setEditingProduct(null);
      toast.success("Producto guardado");
    },
    onError: () => toast.error("Error al guardar el producto")
  });

  const updateProductMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Product.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['owner-products']);
      setShowProductDialog(false);
      setNewProduct({ name: "", description: "", price: 0, stock: 0, category: "bebidas" });
      setEditingProduct(null);
      toast.success("Producto actualizado");
    },
    onError: () => toast.error("Error al actualizar")
  });

  const deleteProductMutation = useMutation({
    mutationFn: (id) => base44.entities.Product.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['owner-products']);
      toast.success("Producto eliminado");
    }
  });

  const createSaleMutation = useMutation({
    mutationFn: async (data) => {
      const product = products.find(p => p.id === data.product_id);
      if (!product) throw new Error("Producto no encontrado");
      if (product.stock < data.quantity) throw new Error("Stock insuficiente");
      
      // Create sale
      await base44.entities.Sale.create({
        ...data,
        product_name: product.name,
        unit_price: product.price,
        total_price: product.price * data.quantity,
        owner_id: user.id
      });
      
      // Update stock
      await base44.entities.Product.update(product.id, {
        stock: product.stock - data.quantity
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['owner-products']);
      queryClient.invalidateQueries(['owner-sales']);
      setShowSaleDialog(false);
      setNewSale({ product_id: "", quantity: 1, customer_name: "", payment_method: "efectivo" });
      toast.success("Venta registrada");
    },
    onError: (error) => toast.error(error.message || "Error al registrar venta")
  });

  useEffect(() => {
    if (courts.length > 0 && !selectedCourt) {
      setSelectedCourt(courts[0]);
    }
  }, [courts]);

  if (isLoading) return <LoadingSpinner className="min-h-screen" />;
  if (!user) return null;

  const pendingReservations = allReservations.filter(r => r.status === "pending");
  const todayReservations = allReservations.filter(r => 
    r.date === format(new Date(), 'yyyy-MM-dd') && r.status === "accepted"
  );
  const totalIncome = allReservations
    .filter(r => r.status === "accepted" || r.status === "completed")
    .reduce((sum, r) => sum + (r.total_price || 0), 0);
  const totalSalesIncome = sales.reduce((sum, s) => sum + (s.total_price || 0), 0);

  const hours = [];
  const openingHour = selectedCourt?.opening_hour || 6;
  const closingHour = selectedCourt?.closing_hour || 23;
  for (let i = openingHour; i < closingHour; i++) {
    hours.push(i);
  }

  const getReservationsForDate = (date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return reservations.filter(r => 
      r.date === dateStr && 
      r.status !== "cancelled" && r.status !== "rejected" && r.status !== "auto_rejected"
    );
  };

  const getReservationForHour = (date, hour) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return reservations.find(r => 
      r.date === dateStr &&
      hour >= r.start_hour && hour < r.end_hour && 
      r.status !== "cancelled" && r.status !== "rejected" && r.status !== "auto_rejected"
    );
  };

  const navigateDate = (direction) => {
    if (viewMode === "day") {
      setSelectedDate(addDays(selectedDate, direction));
    } else if (viewMode === "week") {
      setSelectedDate(direction > 0 ? addWeeks(selectedDate, 1) : subWeeks(selectedDate, 1));
    } else {
      setSelectedDate(direction > 0 ? addMonths(selectedDate, 1) : subMonths(selectedDate, 1));
    }
  };

  const getDateLabel = () => {
    if (viewMode === "day") {
      return format(selectedDate, "EEEE d 'de' MMMM yyyy", { locale: es });
    } else if (viewMode === "week") {
      return `${format(dateRange.start, "d MMM", { locale: es })} - ${format(dateRange.end, "d MMM yyyy", { locale: es })}`;
    } else {
      return format(selectedDate, "MMMM yyyy", { locale: es });
    }
  };

  const handleCreateManualReservation = () => {
    if (!selectedCourt) return;
    
    const endHour = manualReservation.start_hour + manualReservation.duration_hours;
    const pricePerHour = selectedCourt.night_price_enabled && manualReservation.start_hour >= 18 
      ? selectedCourt.night_price_per_hour 
      : selectedCourt.price_per_hour;
    
    createManualReservationMutation.mutate({
      court_id: selectedCourt.id,
      court_name: selectedCourt.name,
      user_name: manualReservation.user_name,
      user_phone: manualReservation.user_phone,
      date: manualReservation.date,
      start_hour: manualReservation.start_hour,
      end_hour: endHour,
      duration_hours: manualReservation.duration_hours,
      total_price: pricePerHour * manualReservation.duration_hours,
      payment_method: manualReservation.payment_method,
      owner_id: user.id,
      status: "accepted",
      is_manual: true,
      notes: manualReservation.notes
    });
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
          { id: "products", icon: Package, label: "Productos" },
          { id: "sales", icon: ShoppingCart, label: "Ventas" },
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
      <aside className="hidden lg:block w-64 fixed inset-y-0 left-0">
        <Sidebar />
      </aside>

      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetContent side="left" className="p-0 w-64">
          <Sidebar />
        </SheetContent>
      </Sheet>

      <main className="flex-1 lg:ml-64">
        <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
          <div className="flex items-center justify-between px-4 lg:px-8 h-16">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setSidebarOpen(true)}>
                <Menu className="h-5 w-5" />
              </Button>
              <h1 className="text-lg font-semibold text-slate-800">
                {activeTab === "dashboard" && "Dashboard"}
                {activeTab === "calendar" && "Calendario de Reservas"}
                {activeTab === "courts" && "Mis Canchas"}
                {activeTab === "products" && "Inventario de Productos"}
                {activeTab === "sales" && "Ventas"}
                {activeTab === "reports" && "Reportes"}
              </h1>
            </div>
            <div className="flex items-center gap-3">
              {pendingReservations.length > 0 && (
                <Badge className="bg-amber-500">{pendingReservations.length} pendiente{pendingReservations.length > 1 ? 's' : ''}</Badge>
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
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-slate-500">Reservas Hoy</p>
                        <p className="text-3xl font-bold text-slate-800">{todayReservations.length}</p>
                      </div>
                      <div className="p-3 bg-teal-100 rounded-xl"><Calendar className="h-6 w-6 text-teal-600" /></div>
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
                      <div className="p-3 bg-amber-100 rounded-xl"><Clock className="h-6 w-6 text-amber-600" /></div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-slate-500">Ingresos Reservas</p>
                        <p className="text-3xl font-bold text-green-600">S/ {totalIncome}</p>
                      </div>
                      <div className="p-3 bg-green-100 rounded-xl"><DollarSign className="h-6 w-6 text-green-600" /></div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-slate-500">Ventas Productos</p>
                        <p className="text-3xl font-bold text-purple-600">S/ {totalSalesIncome}</p>
                      </div>
                      <div className="p-3 bg-purple-100 rounded-xl"><ShoppingCart className="h-6 w-6 text-purple-600" /></div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {pendingReservations.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <AlertCircle className="h-5 w-5 text-amber-500" />
                      Reservas Pendientes
                    </CardTitle>
                    <CardDescription>Tienes 10 minutos para responder cada reserva</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {pendingReservations.slice(0, 5).map(reservation => (
                        <div key={reservation.id} className="flex items-center justify-between p-4 bg-amber-50 rounded-xl border border-amber-100">
                          <div>
                            <p className="font-medium text-slate-800">{reservation.user_name}</p>
                            <p className="text-sm text-slate-500">
                              {reservation.court_name} • {format(new Date(reservation.date), "d MMM", { locale: es })} • {reservation.start_hour}:00
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline" className="text-red-600 border-red-200 hover:bg-red-50"
                              onClick={() => updateReservationMutation.mutate({ id: reservation.id, data: { status: "rejected" } })}>
                              <X className="h-4 w-4" />
                            </Button>
                            <Button size="sm" className="bg-green-600 hover:bg-green-700"
                              onClick={() => updateReservationMutation.mutate({ id: reservation.id, data: { status: "accepted" } })}>
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
                <EmptyState icon={Building2} title="No tienes canchas" description="Crea tu primera cancha para ver el calendario"
                  action={<Button onClick={() => setShowCreateCourtDialog(true)} className="bg-teal-600 hover:bg-teal-700"><Plus className="h-4 w-4 mr-2" />Crear Cancha</Button>}
                />
              ) : (
                <>
                  {/* Controls */}
                  <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
                    <div className="flex flex-col sm:flex-row gap-3">
                      <Select value={selectedCourt?.id} onValueChange={(id) => setSelectedCourt(courts.find(c => c.id === id))}>
                        <SelectTrigger className="w-full sm:w-64 bg-white">
                          <SelectValue placeholder="Selecciona cancha" />
                        </SelectTrigger>
                        <SelectContent>
                          {courts.map(court => (
                            <SelectItem key={court.id} value={court.id}>{court.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      {/* View Mode Selector */}
                      <Tabs value={viewMode} onValueChange={setViewMode} className="bg-white rounded-lg border">
                        <TabsList className="h-10">
                          <TabsTrigger value="day" className="px-4"><CalendarDays className="h-4 w-4 mr-1" />Día</TabsTrigger>
                          <TabsTrigger value="week" className="px-4"><CalendarRange className="h-4 w-4 mr-1" />Semana</TabsTrigger>
                          <TabsTrigger value="month" className="px-4"><Calendar className="h-4 w-4 mr-1" />Mes</TabsTrigger>
                        </TabsList>
                      </Tabs>
                    </div>

                    <Dialog open={showManualReservationDialog} onOpenChange={setShowManualReservationDialog}>
                      <DialogTrigger asChild>
                        <Button className="bg-teal-600 hover:bg-teal-700">
                          <Plus className="h-4 w-4 mr-2" />Reserva Manual
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader><DialogTitle>Crear Reserva Manual</DialogTitle></DialogHeader>
                        <div className="space-y-4 py-4">
                          <div>
                            <Label>Nombre del cliente *</Label>
                            <Input value={manualReservation.user_name} onChange={(e) => setManualReservation({...manualReservation, user_name: e.target.value})} className="mt-1" />
                          </div>
                          <div>
                            <Label>Teléfono</Label>
                            <Input value={manualReservation.user_phone} onChange={(e) => setManualReservation({...manualReservation, user_phone: e.target.value})} className="mt-1" />
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label>Fecha *</Label>
                              <Input type="date" value={manualReservation.date} onChange={(e) => setManualReservation({...manualReservation, date: e.target.value})} className="mt-1" />
                            </div>
                            <div>
                              <Label>Hora inicio *</Label>
                              <Select value={manualReservation.start_hour.toString()} onValueChange={(v) => setManualReservation({...manualReservation, start_hour: parseInt(v)})}>
                                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                  {hours.map(h => <SelectItem key={h} value={h.toString()}>{h}:00</SelectItem>)}
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label>Duración (horas)</Label>
                              <Select value={manualReservation.duration_hours.toString()} onValueChange={(v) => setManualReservation({...manualReservation, duration_hours: parseInt(v)})}>
                                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                  {[1, 2, 3, 4].map(h => <SelectItem key={h} value={h.toString()}>{h} hora{h > 1 ? 's' : ''}</SelectItem>)}
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <Label>Método de pago</Label>
                              <Select value={manualReservation.payment_method} onValueChange={(v) => setManualReservation({...manualReservation, payment_method: v})}>
                                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="efectivo">Efectivo</SelectItem>
                                  <SelectItem value="yape">Yape</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                          <div>
                            <Label>Notas</Label>
                            <Textarea value={manualReservation.notes} onChange={(e) => setManualReservation({...manualReservation, notes: e.target.value})} className="mt-1" />
                          </div>
                        </div>
                        <div className="flex gap-3">
                          <Button variant="outline" className="flex-1" onClick={() => setShowManualReservationDialog(false)}>Cancelar</Button>
                          <Button className="flex-1 bg-teal-600 hover:bg-teal-700" onClick={handleCreateManualReservation} disabled={createManualReservationMutation.isPending}>
                            {createManualReservationMutation.isPending ? "Creando..." : "Crear Reserva"}
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>

                  {/* Date Navigation */}
                  <div className="flex items-center justify-center gap-4 bg-white rounded-xl border p-3">
                    <Button variant="ghost" size="icon" onClick={() => navigateDate(-1)}><ChevronLeft className="h-5 w-5" /></Button>
                    <span className="text-lg font-semibold text-slate-800 min-w-[250px] text-center capitalize">{getDateLabel()}</span>
                    <Button variant="ghost" size="icon" onClick={() => navigateDate(1)}><ChevronRight className="h-5 w-5" /></Button>
                    <Button variant="outline" size="sm" onClick={() => setSelectedDate(new Date())}>Hoy</Button>
                  </div>

                  {/* Calendar Grid */}
                  <Card>
                    <CardContent className="p-6">
                      {viewMode === "day" && (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
                          {hours.map(hour => {
                            const reservation = getReservationForHour(selectedDate, hour);
                            return (
                              <div key={hour} className={`p-3 rounded-xl text-center transition-all cursor-pointer ${
                                reservation
                                  ? reservation.status === "pending"
                                    ? "bg-amber-100 border-2 border-amber-300"
                                    : reservation.is_manual
                                    ? "bg-purple-100 border-2 border-purple-300"
                                    : "bg-teal-100 border-2 border-teal-300"
                                  : "bg-slate-50 border-2 border-slate-200 hover:border-teal-300"
                              }`}>
                                <p className="font-medium text-slate-700">{hour}:00</p>
                                {reservation ? (
                                  <div className="mt-1">
                                    <p className="text-xs font-medium truncate">{reservation.user_name || "Cliente"}</p>
                                    <Badge className={`text-xs mt-1 ${reservation.status === "pending" ? "bg-amber-500" : reservation.is_manual ? "bg-purple-600" : "bg-teal-600"}`}>
                                      {reservation.status === "pending" ? "Pendiente" : reservation.is_manual ? "Manual" : "Confirmado"}
                                    </Badge>
                                  </div>
                                ) : (
                                  <p className="text-xs text-slate-400 mt-1">Libre</p>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {viewMode === "week" && (
                        <div className="overflow-x-auto">
                          <table className="w-full min-w-[700px]">
                            <thead>
                              <tr>
                                <th className="p-2 text-left text-sm font-medium text-slate-500 w-16">Hora</th>
                                {eachDayOfInterval({ start: dateRange.start, end: dateRange.end }).map(day => (
                                  <th key={day.toISOString()} className="p-2 text-center text-sm font-medium text-slate-700">
                                    <div>{format(day, "EEE", { locale: es })}</div>
                                    <div className="text-lg">{format(day, "d")}</div>
                                  </th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {hours.map(hour => (
                                <tr key={hour} className="border-t">
                                  <td className="p-2 text-sm text-slate-500">{hour}:00</td>
                                  {eachDayOfInterval({ start: dateRange.start, end: dateRange.end }).map(day => {
                                    const reservation = getReservationForHour(day, hour);
                                    return (
                                      <td key={day.toISOString()} className="p-1">
                                        <div className={`h-10 rounded-lg flex items-center justify-center text-xs ${
                                          reservation
                                            ? reservation.status === "pending"
                                              ? "bg-amber-100 text-amber-700"
                                              : reservation.is_manual
                                              ? "bg-purple-100 text-purple-700"
                                              : "bg-teal-100 text-teal-700"
                                            : "bg-slate-50"
                                        }`}>
                                          {reservation && <span className="truncate px-1">{reservation.user_name?.split(' ')[0] || "R"}</span>}
                                        </div>
                                      </td>
                                    );
                                  })}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}

                      {viewMode === "month" && (
                        <div className="grid grid-cols-7 gap-2">
                          {["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"].map(d => (
                            <div key={d} className="p-2 text-center text-sm font-medium text-slate-500">{d}</div>
                          ))}
                          {eachDayOfInterval({ start: dateRange.start, end: dateRange.end }).map(day => {
                            const dayReservations = getReservationsForDate(day);
                            const isToday = format(day, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');
                            return (
                              <div key={day.toISOString()} className={`p-2 rounded-xl min-h-[80px] ${isToday ? "bg-teal-50 border-2 border-teal-300" : "bg-slate-50 border border-slate-200"}`}>
                                <p className={`text-sm font-medium ${isToday ? "text-teal-700" : "text-slate-700"}`}>{format(day, "d")}</p>
                                {dayReservations.length > 0 && (
                                  <div className="mt-1">
                                    <Badge className="text-xs bg-teal-600">{dayReservations.length} reserva{dayReservations.length > 1 ? 's' : ''}</Badge>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
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
                    <Button className="bg-teal-600 hover:bg-teal-700"><Plus className="h-4 w-4 mr-2" />Nueva Cancha</Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                    <DialogHeader><DialogTitle>Crear Nueva Cancha</DialogTitle></DialogHeader>
                    <div className="space-y-4 py-4">
                      <div>
                        <Label>Nombre *</Label>
                        <Input value={newCourt.name} onChange={(e) => setNewCourt({...newCourt, name: e.target.value})} placeholder="Cancha La Victoria" className="mt-1" />
                      </div>
                      <div>
                        <Label>Descripción</Label>
                        <Textarea value={newCourt.description} onChange={(e) => setNewCourt({...newCourt, description: e.target.value})} className="mt-1" />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Deporte</Label>
                          <Select value={newCourt.sport_type} onValueChange={(v) => setNewCourt({...newCourt, sport_type: v})}>
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
                          <Select value={newCourt.department} onValueChange={(v) => setNewCourt({...newCourt, department: v})}>
                            <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              {["Lima", "Arequipa", "Cusco", "Trujillo", "Chiclayo"].map(d => (
                                <SelectItem key={d} value={d}>{d}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div><Label>Dirección *</Label><Input value={newCourt.address} onChange={(e) => setNewCourt({...newCourt, address: e.target.value})} className="mt-1" /></div>
                      <div><Label>Teléfono *</Label><Input value={newCourt.phone} onChange={(e) => setNewCourt({...newCourt, phone: e.target.value})} className="mt-1" /></div>
                      <div className="grid grid-cols-2 gap-4">
                        <div><Label>Precio/hora (S/)</Label><Input type="number" value={newCourt.price_per_hour} onChange={(e) => setNewCourt({...newCourt, price_per_hour: parseInt(e.target.value)})} className="mt-1" /></div>
                        <div><Label>Precio nocturno (S/)</Label><Input type="number" value={newCourt.night_price_per_hour} onChange={(e) => setNewCourt({...newCourt, night_price_per_hour: parseInt(e.target.value)})} className="mt-1" /></div>
                      </div>
                      <div className="flex items-center justify-between"><Label>Habilitar precio nocturno</Label><Switch checked={newCourt.night_price_enabled} onCheckedChange={(v) => setNewCourt({...newCourt, night_price_enabled: v})} /></div>
                    </div>
                    <div className="flex gap-3">
                      <Button variant="outline" className="flex-1" onClick={() => setShowCreateCourtDialog(false)}>Cancelar</Button>
                      <Button className="flex-1 bg-teal-600 hover:bg-teal-700" onClick={() => createCourtMutation.mutate(newCourt)} disabled={createCourtMutation.isPending}>
                        {createCourtMutation.isPending ? "Creando..." : "Crear Cancha"}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>

              {courts.length === 0 ? (
                <EmptyState icon={Building2} title="No tienes canchas registradas" description="Registra tu primera cancha y empieza a recibir reservas" />
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
                          <Badge className={court.status === "approved" ? "bg-green-100 text-green-700" : court.status === "rejected" ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"}>
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

          {/* Products Tab */}
          {activeTab === "products" && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <p className="text-slate-500">{products.length} producto{products.length !== 1 ? 's' : ''}</p>
                <Dialog open={showProductDialog} onOpenChange={(open) => {
                  setShowProductDialog(open);
                  if (!open) { setEditingProduct(null); setNewProduct({ name: "", description: "", price: 0, stock: 0, category: "bebidas" }); }
                }}>
                  <DialogTrigger asChild>
                    <Button className="bg-teal-600 hover:bg-teal-700"><Plus className="h-4 w-4 mr-2" />Nuevo Producto</Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader><DialogTitle>{editingProduct ? "Editar Producto" : "Nuevo Producto"}</DialogTitle></DialogHeader>
                    <div className="space-y-4 py-4">
                      <div><Label>Nombre *</Label><Input value={newProduct.name} onChange={(e) => setNewProduct({...newProduct, name: e.target.value})} className="mt-1" /></div>
                      <div><Label>Descripción</Label><Textarea value={newProduct.description} onChange={(e) => setNewProduct({...newProduct, description: e.target.value})} className="mt-1" /></div>
                      <div className="grid grid-cols-2 gap-4">
                        <div><Label>Precio (S/)</Label><Input type="number" value={newProduct.price} onChange={(e) => setNewProduct({...newProduct, price: parseFloat(e.target.value)})} className="mt-1" /></div>
                        <div><Label>Stock</Label><Input type="number" value={newProduct.stock} onChange={(e) => setNewProduct({...newProduct, stock: parseInt(e.target.value)})} className="mt-1" /></div>
                      </div>
                      <div>
                        <Label>Categoría</Label>
                        <Select value={newProduct.category} onValueChange={(v) => setNewProduct({...newProduct, category: v})}>
                          <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="bebidas">Bebidas</SelectItem>
                            <SelectItem value="snacks">Snacks</SelectItem>
                            <SelectItem value="equipamiento">Equipamiento</SelectItem>
                            <SelectItem value="alquiler">Alquiler</SelectItem>
                            <SelectItem value="otros">Otros</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <Button variant="outline" className="flex-1" onClick={() => setShowProductDialog(false)}>Cancelar</Button>
                      <Button className="flex-1 bg-teal-600 hover:bg-teal-700" onClick={() => {
                        if (editingProduct) {
                          updateProductMutation.mutate({ id: editingProduct.id, data: newProduct });
                        } else {
                          createProductMutation.mutate(newProduct);
                        }
                      }}>
                        {editingProduct ? "Guardar" : "Crear"}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>

              {products.length === 0 ? (
                <EmptyState icon={Package} title="Sin productos" description="Agrega productos para vender en tu cancha" />
              ) : (
                <Card>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Producto</TableHead>
                        <TableHead>Categoría</TableHead>
                        <TableHead>Precio</TableHead>
                        <TableHead>Stock</TableHead>
                        <TableHead>Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {products.map(product => (
                        <TableRow key={product.id}>
                          <TableCell className="font-medium">{product.name}</TableCell>
                          <TableCell><Badge variant="outline" className="capitalize">{product.category}</Badge></TableCell>
                          <TableCell>S/ {product.price}</TableCell>
                          <TableCell>
                            <span className={product.stock <= 5 ? "text-red-600 font-bold" : ""}>{product.stock}</span>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button size="icon" variant="ghost" onClick={() => {
                                setEditingProduct(product);
                                setNewProduct({ name: product.name, description: product.description || "", price: product.price, stock: product.stock, category: product.category });
                                setShowProductDialog(true);
                              }}><Edit className="h-4 w-4" /></Button>
                              <AlertDialog>
                                <AlertDialogTrigger asChild><Button size="icon" variant="ghost" className="text-red-500"><Trash2 className="h-4 w-4" /></Button></AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader><AlertDialogTitle>¿Eliminar producto?</AlertDialogTitle></AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => deleteProductMutation.mutate(product.id)} className="bg-red-600">Eliminar</AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </Card>
              )}
            </div>
          )}

          {/* Sales Tab */}
          {activeTab === "sales" && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-4">
                  <p className="text-slate-500">{sales.length} venta{sales.length !== 1 ? 's' : ''}</p>
                  <Badge className="bg-green-100 text-green-700">Total: S/ {totalSalesIncome}</Badge>
                </div>
                <Dialog open={showSaleDialog} onOpenChange={setShowSaleDialog}>
                  <DialogTrigger asChild>
                    <Button className="bg-teal-600 hover:bg-teal-700"><ShoppingCart className="h-4 w-4 mr-2" />Nueva Venta</Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader><DialogTitle>Registrar Venta</DialogTitle></DialogHeader>
                    <div className="space-y-4 py-4">
                      <div>
                        <Label>Producto *</Label>
                        <Select value={newSale.product_id} onValueChange={(v) => setNewSale({...newSale, product_id: v})}>
                          <SelectTrigger className="mt-1"><SelectValue placeholder="Selecciona producto" /></SelectTrigger>
                          <SelectContent>
                            {products.filter(p => p.stock > 0).map(p => (
                              <SelectItem key={p.id} value={p.id}>{p.name} - S/ {p.price} (Stock: {p.stock})</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div><Label>Cantidad</Label><Input type="number" min={1} value={newSale.quantity} onChange={(e) => setNewSale({...newSale, quantity: parseInt(e.target.value)})} className="mt-1" /></div>
                        <div>
                          <Label>Método de pago</Label>
                          <Select value={newSale.payment_method} onValueChange={(v) => setNewSale({...newSale, payment_method: v})}>
                            <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="efectivo">Efectivo</SelectItem>
                              <SelectItem value="yape">Yape</SelectItem>
                              <SelectItem value="plin">Plin</SelectItem>
                              <SelectItem value="tarjeta">Tarjeta</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div><Label>Nombre cliente (opcional)</Label><Input value={newSale.customer_name} onChange={(e) => setNewSale({...newSale, customer_name: e.target.value})} className="mt-1" /></div>
                      {newSale.product_id && (
                        <div className="p-4 bg-teal-50 rounded-xl">
                          <p className="text-sm text-teal-600">Total a cobrar</p>
                          <p className="text-2xl font-bold text-teal-700">
                            S/ {(products.find(p => p.id === newSale.product_id)?.price || 0) * newSale.quantity}
                          </p>
                        </div>
                      )}
                    </div>
                    <div className="flex gap-3">
                      <Button variant="outline" className="flex-1" onClick={() => setShowSaleDialog(false)}>Cancelar</Button>
                      <Button className="flex-1 bg-teal-600 hover:bg-teal-700" onClick={() => createSaleMutation.mutate(newSale)} disabled={createSaleMutation.isPending || !newSale.product_id}>
                        {createSaleMutation.isPending ? "Registrando..." : "Registrar Venta"}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>

              {sales.length === 0 ? (
                <EmptyState icon={ShoppingCart} title="Sin ventas" description="Registra tu primera venta" />
              ) : (
                <Card>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Fecha</TableHead>
                        <TableHead>Producto</TableHead>
                        <TableHead>Cantidad</TableHead>
                        <TableHead>Total</TableHead>
                        <TableHead>Pago</TableHead>
                        <TableHead>Cliente</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sales.map(sale => (
                        <TableRow key={sale.id}>
                          <TableCell>{format(new Date(sale.created_date), "d MMM HH:mm", { locale: es })}</TableCell>
                          <TableCell className="font-medium">{sale.product_name}</TableCell>
                          <TableCell>{sale.quantity}</TableCell>
                          <TableCell className="font-bold text-green-600">S/ {sale.total_price}</TableCell>
                          <TableCell><Badge variant="outline" className="capitalize">{sale.payment_method}</Badge></TableCell>
                          <TableCell>{sale.customer_name || "-"}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </Card>
              )}
            </div>
          )}

          {/* Reports Tab */}
          {activeTab === "reports" && (
            <div className="space-y-6">
              <Card>
                <CardHeader><CardTitle>Reportes</CardTitle><CardDescription>Exporta tus reportes de reservas y ventas</CardDescription></CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-3">
                    <Button variant="outline"><FileSpreadsheet className="h-4 w-4 mr-2" />Reservas Semanal</Button>
                    <Button variant="outline"><FileSpreadsheet className="h-4 w-4 mr-2" />Reservas Mensual</Button>
                    <Button variant="outline"><FileSpreadsheet className="h-4 w-4 mr-2" />Ventas Productos</Button>
                  </div>
                </CardContent>
              </Card>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader><CardTitle>Reservas</CardTitle></CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 bg-slate-50 rounded-xl"><p className="text-sm text-slate-500">Totales</p><p className="text-2xl font-bold">{allReservations.length}</p></div>
                      <div className="p-4 bg-slate-50 rounded-xl"><p className="text-sm text-slate-500">Confirmadas</p><p className="text-2xl font-bold text-green-600">{allReservations.filter(r => r.status === "accepted" || r.status === "completed").length}</p></div>
                      <div className="p-4 bg-slate-50 rounded-xl"><p className="text-sm text-slate-500">Manuales</p><p className="text-2xl font-bold text-purple-600">{allReservations.filter(r => r.is_manual).length}</p></div>
                      <div className="p-4 bg-slate-50 rounded-xl"><p className="text-sm text-slate-500">Ingresos</p><p className="text-2xl font-bold text-teal-600">S/ {totalIncome}</p></div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader><CardTitle>Ventas de Productos</CardTitle></CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 bg-slate-50 rounded-xl"><p className="text-sm text-slate-500">Ventas</p><p className="text-2xl font-bold">{sales.length}</p></div>
                      <div className="p-4 bg-slate-50 rounded-xl"><p className="text-sm text-slate-500">Ingresos</p><p className="text-2xl font-bold text-green-600">S/ {totalSalesIncome}</p></div>
                      <div className="p-4 bg-slate-50 rounded-xl"><p className="text-sm text-slate-500">Productos</p><p className="text-2xl font-bold">{products.length}</p></div>
                      <div className="p-4 bg-slate-50 rounded-xl"><p className="text-sm text-slate-500">Stock Bajo</p><p className="text-2xl font-bold text-red-600">{products.filter(p => p.stock <= 5).length}</p></div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}