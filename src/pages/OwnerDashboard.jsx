import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createPageUrl } from "@/utils";
import { Link } from "react-router-dom";
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, addDays, addWeeks, addMonths, subWeeks, subMonths } from "date-fns";
import { es } from "date-fns/locale";
import {
  LayoutDashboard, Calendar, Building2, BarChart3, Plus, ChevronLeft, ChevronRight,
  Check, X, Clock, DollarSign, Users, Menu, LogOut, Home, Package, ShoppingCart,
  Edit, Trash2, CalendarDays, CalendarRange, Bell, FileSpreadsheet, AlertCircle, CreditCard, Settings
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import EmptyState from "@/components/ui/EmptyState";
import CalendarMultiSelect from "@/components/owner/CalendarMultiSelect";
import ReservationDetailModal from "@/components/owner/ReservationDetailModal";
import NotificationCenter from "@/components/owner/NotificationCenter";
import CollaboratorManager from "@/components/owner/CollaboratorManager";
import CourtPhotoUploader from "@/components/owner/CourtPhotoUploader";
import PaymentConfigManager from "@/components/owner/PaymentConfigManager";
import PaymentHistory from "@/components/owner/PaymentHistory";
import NotificationService from "@/components/notifications/NotificationService";
import { toast } from "sonner";

export default function OwnerDashboard() {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCourt, setSelectedCourt] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [viewMode, setViewMode] = useState("day");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [selectedSlots, setSelectedSlots] = useState([]);
  const [selectedReservation, setSelectedReservation] = useState(null);
  const [showManualReservationDialog, setShowManualReservationDialog] = useState(false);
  const [showCreateCourtDialog, setShowCreateCourtDialog] = useState(false);
  const [showProductDialog, setShowProductDialog] = useState(false);
  const [showSaleDialog, setShowSaleDialog] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  
  const [newCourt, setNewCourt] = useState({ name: "", description: "", sport_type: "futbol", address: "", department: "Lima", phone: "", price_per_hour: 50, night_price_per_hour: 70, night_price_enabled: false, opening_hour: 6, closing_hour: 23, photos: [] });
  const [manualReservation, setManualReservation] = useState({ user_name: "", user_phone: "", date: format(new Date(), 'yyyy-MM-dd'), start_hour: 8, duration_hours: 1, payment_method: "efectivo", notes: "" });
  const [newProduct, setNewProduct] = useState({ name: "", description: "", price: 0, stock: 0, category: "bebidas" });
  const [newSale, setNewSale] = useState({ product_id: "", quantity: 1, customer_name: "", payment_method: "efectivo" });

  const queryClient = useQueryClient();

  useEffect(() => { loadUser(); }, []);

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

  const getDateRange = () => {
    if (viewMode === "day") return { start: selectedDate, end: selectedDate };
    if (viewMode === "week") return { start: startOfWeek(selectedDate, { weekStartsOn: 1 }), end: endOfWeek(selectedDate, { weekStartsOn: 1 }) };
    return { start: startOfMonth(selectedDate), end: endOfMonth(selectedDate) };
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
      const res = await base44.entities.Reservation.list('-created_date', 200);
      return res.filter(r => courtIds.includes(r.court_id));
    },
    enabled: !!user?.id,
  });

  const { data: notifications = [] } = useQuery({
    queryKey: ['owner-notifications', user?.id],
    queryFn: () => base44.entities.Notification.filter({ owner_id: user.id }, '-created_date', 50),
    enabled: !!user?.id,
  });

  const { data: collaborators = [] } = useQuery({
    queryKey: ['owner-collaborators', user?.id],
    queryFn: () => base44.entities.Collaborator.filter({ owner_id: user.id }),
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

  const { data: payments = [] } = useQuery({
    queryKey: ['owner-payments', user?.id],
    queryFn: () => base44.entities.Payment.filter({ owner_id: user.id }, '-created_date', 200),
    enabled: !!user?.id,
  });

  const { data: paymentConfig } = useQuery({
    queryKey: ['owner-payment-config', user?.id],
    queryFn: async () => {
      const configs = await base44.entities.PaymentConfig.filter({ owner_id: user.id });
      return configs[0] || null;
    },
    enabled: !!user?.id,
  });

  // Mutations
  const createCourtMutation = useMutation({
    mutationFn: (data) => base44.entities.Court.create({ ...data, owner_id: user.id }),
    onSuccess: () => { queryClient.invalidateQueries(['owner-courts']); setShowCreateCourtDialog(false); toast.success("Cancha creada"); }
  });

  const updateReservationMutation = useMutation({
    mutationFn: async ({ id, data, reservation }) => {
      await base44.entities.Reservation.update(id, data);
      
      // Notify user about status change
      if (data.status && reservation) {
        if (data.status === "accepted") {
          await NotificationService.notifyUser(reservation.user_id, reservation.created_by, 'reservation_confirmed', {
            courtName: reservation.court_name,
            date: format(new Date(reservation.date), "d 'de' MMMM", { locale: es }),
            time: `${reservation.start_hour}:00`,
            referenceId: id,
            referenceType: "reservation"
          });
        } else if (data.status === "rejected") {
          await NotificationService.notifyUser(reservation.user_id, reservation.created_by, 'reservation_rejected', {
            courtName: reservation.court_name,
            date: format(new Date(reservation.date), "d 'de' MMMM", { locale: es }),
            referenceId: id,
            referenceType: "reservation"
          });
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['owner-reservations']);
      queryClient.invalidateQueries(['all-owner-reservations']);
      setSelectedReservation(null);
      toast.success("Reserva actualizada");
    }
  });

  const deleteReservationMutation = useMutation({
    mutationFn: (id) => base44.entities.Reservation.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['owner-reservations']);
      queryClient.invalidateQueries(['all-owner-reservations']);
      setSelectedReservation(null);
      toast.success("Reserva eliminada");
    }
  });

  const createManualReservationMutation = useMutation({
    mutationFn: async (data) => {
      const reservation = await base44.entities.Reservation.create(data);
      // Create notification
      await base44.entities.Notification.create({
        owner_id: user.id,
        title: "Nueva reserva manual",
        message: `Reserva creada para ${data.user_name} el ${format(new Date(data.date), "d MMM", { locale: es })} a las ${data.start_hour}:00`,
        type: "reservation_created",
        reference_id: reservation.id,
        reference_type: "reservation"
      });
      return reservation;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['owner-reservations']);
      queryClient.invalidateQueries(['all-owner-reservations']);
      queryClient.invalidateQueries(['owner-notifications']);
      setShowManualReservationDialog(false);
      setSelectedSlots([]);
      toast.success("Reserva creada");
    }
  });

  const markNotificationReadMutation = useMutation({
    mutationFn: (id) => base44.entities.Notification.update(id, { is_read: true }),
    onSuccess: () => queryClient.invalidateQueries(['owner-notifications'])
  });

  const markAllNotificationsReadMutation = useMutation({
    mutationFn: async () => {
      const unread = notifications.filter(n => !n.is_read);
      await Promise.all(unread.map(n => base44.entities.Notification.update(n.id, { is_read: true })));
    },
    onSuccess: () => queryClient.invalidateQueries(['owner-notifications'])
  });

  const deleteNotificationMutation = useMutation({
    mutationFn: (id) => base44.entities.Notification.delete(id),
    onSuccess: () => queryClient.invalidateQueries(['owner-notifications'])
  });

  const createCollaboratorMutation = useMutation({
    mutationFn: (data) => base44.entities.Collaborator.create({ ...data, owner_id: user.id }),
    onSuccess: () => { queryClient.invalidateQueries(['owner-collaborators']); toast.success("Colaborador agregado"); }
  });

  const updateCollaboratorMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Collaborator.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries(['owner-collaborators']); toast.success("Colaborador actualizado"); }
  });

  const deleteCollaboratorMutation = useMutation({
    mutationFn: (id) => base44.entities.Collaborator.delete(id),
    onSuccess: () => { queryClient.invalidateQueries(['owner-collaborators']); toast.success("Colaborador eliminado"); }
  });

  const createProductMutation = useMutation({
    mutationFn: (data) => base44.entities.Product.create({ ...data, owner_id: user.id }),
    onSuccess: () => { queryClient.invalidateQueries(['owner-products']); setShowProductDialog(false); toast.success("Producto creado"); }
  });

  const updateProductMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Product.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries(['owner-products']); setShowProductDialog(false); setEditingProduct(null); toast.success("Producto actualizado"); }
  });

  const deleteProductMutation = useMutation({
    mutationFn: (id) => base44.entities.Product.delete(id),
    onSuccess: () => { queryClient.invalidateQueries(['owner-products']); toast.success("Producto eliminado"); }
  });

  const createSaleMutation = useMutation({
    mutationFn: async (data) => {
      const product = products.find(p => p.id === data.product_id);
      if (!product || product.stock < data.quantity) throw new Error("Stock insuficiente");
      await base44.entities.Sale.create({ ...data, product_name: product.name, unit_price: product.price, total_price: product.price * data.quantity, owner_id: user.id });
      await base44.entities.Product.update(product.id, { stock: product.stock - data.quantity });
    },
    onSuccess: () => { queryClient.invalidateQueries(['owner-products']); queryClient.invalidateQueries(['owner-sales']); setShowSaleDialog(false); toast.success("Venta registrada"); }
  });

  const savePaymentConfigMutation = useMutation({
    mutationFn: async (data) => {
      if (paymentConfig?.id) {
        return base44.entities.PaymentConfig.update(paymentConfig.id, data);
      } else {
        return base44.entities.PaymentConfig.create({ ...data, owner_id: user.id });
      }
    },
    onSuccess: () => { queryClient.invalidateQueries(['owner-payment-config']); toast.success("Configuración guardada"); }
  });

  const updatePaymentStatusMutation = useMutation({
    mutationFn: async ({ id, status }) => {
      await base44.entities.Payment.update(id, { status });
      const payment = payments.find(p => p.id === id);
      
      // If completed, also update the reservation and notify user
      if (status === "completed" && payment) {
        if (payment.reservation_id) {
          await base44.entities.Reservation.update(payment.reservation_id, { status: "accepted" });
        }
        
        // Notify user that payment was confirmed and reservation accepted
        await NotificationService.notifyUser(payment.user_id, payment.user_email, 'reservation_confirmed', {
          courtName: payment.court_name,
          date: "próximamente",
          time: "",
          referenceId: payment.reservation_id,
          referenceType: "reservation"
        });
      }
    },
    onSuccess: () => { 
      queryClient.invalidateQueries(['owner-payments']); 
      queryClient.invalidateQueries(['owner-reservations']);
      queryClient.invalidateQueries(['all-owner-reservations']);
      toast.success("Estado actualizado"); 
    }
  });

  useEffect(() => { if (courts.length > 0 && !selectedCourt) setSelectedCourt(courts[0]); }, [courts]);

  if (isLoading) return <LoadingSpinner className="min-h-screen" />;
  if (!user) return null;

  const pendingReservations = allReservations.filter(r => r.status === "pending");
  const todayReservations = allReservations.filter(r => r.date === format(new Date(), 'yyyy-MM-dd') && r.status === "accepted");
  const totalIncome = allReservations.filter(r => ["accepted", "completed"].includes(r.status)).reduce((sum, r) => sum + (r.total_price || 0), 0);
  const totalSalesIncome = sales.reduce((sum, s) => sum + (s.total_price || 0), 0);

  const hours = [];
  for (let i = (selectedCourt?.opening_hour || 6); i < (selectedCourt?.closing_hour || 23); i++) hours.push(i);

  const navigateDate = (direction) => {
    if (viewMode === "day") setSelectedDate(addDays(selectedDate, direction));
    else if (viewMode === "week") setSelectedDate(direction > 0 ? addWeeks(selectedDate, 1) : subWeeks(selectedDate, 1));
    else setSelectedDate(direction > 0 ? addMonths(selectedDate, 1) : subMonths(selectedDate, 1));
  };

  const getDateLabel = () => {
    if (viewMode === "day") return format(selectedDate, "EEEE d 'de' MMMM yyyy", { locale: es });
    if (viewMode === "week") return `${format(dateRange.start, "d MMM", { locale: es })} - ${format(dateRange.end, "d MMM yyyy", { locale: es })}`;
    return format(selectedDate, "MMMM yyyy", { locale: es });
  };

  const handleSlotToggle = (slotKey) => {
    setSelectedSlots(prev => prev.includes(slotKey) ? prev.filter(s => s !== slotKey) : [...prev, slotKey]);
  };

  const handleCreateFromSelected = () => {
    if (selectedSlots.length === 0) return;
    const sorted = [...selectedSlots].sort();
    const [date, startHour] = sorted[0].split('_');
    const endHour = parseInt(sorted[sorted.length - 1].split('_')[1]) + 1;
    setManualReservation({ ...manualReservation, date, start_hour: parseInt(startHour), duration_hours: selectedSlots.length });
    setShowManualReservationDialog(true);
  };

  const handleCreateManualReservation = () => {
    if (!selectedCourt) return;
    const endHour = manualReservation.start_hour + manualReservation.duration_hours;
    const pricePerHour = selectedCourt.night_price_enabled && manualReservation.start_hour >= 18 ? selectedCourt.night_price_per_hour : selectedCourt.price_per_hour;
    
    // Check for conflicts
    const hasConflict = allReservations.some(r => 
      r.court_id === selectedCourt.id &&
      r.date === manualReservation.date &&
      !["cancelled", "rejected", "auto_rejected"].includes(r.status) &&
      ((manualReservation.start_hour >= r.start_hour && manualReservation.start_hour < r.end_hour) ||
       (endHour > r.start_hour && endHour <= r.end_hour))
    );
    
    if (hasConflict) { toast.error("Conflicto de horario con otra reserva"); return; }

    createManualReservationMutation.mutate({
      court_id: selectedCourt.id, court_name: selectedCourt.name, user_name: manualReservation.user_name,
      user_phone: manualReservation.user_phone, date: manualReservation.date, start_hour: manualReservation.start_hour,
      end_hour: endHour, duration_hours: manualReservation.duration_hours, total_price: pricePerHour * manualReservation.duration_hours,
      payment_method: manualReservation.payment_method, owner_id: user.id, status: "accepted", is_manual: true, notes: manualReservation.notes
    });
  };

  const Sidebar = () => (
    <div className="flex flex-col h-full bg-slate-900 text-white">
      <div className="p-6 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-teal-500 to-teal-700 rounded-xl flex items-center justify-center">
            <span className="text-white font-bold text-lg">C</span>
          </div>
          <div><p className="font-bold">CanchApp</p><p className="text-xs text-slate-400">Panel Dueño</p></div>
        </div>
      </div>
      <nav className="flex-1 p-4 space-y-1">
        {[
          { id: "dashboard", icon: LayoutDashboard, label: "Dashboard" },
          { id: "calendar", icon: Calendar, label: "Calendario", badge: pendingReservations.length },
          { id: "courts", icon: Building2, label: "Mis Canchas" },
          { id: "collaborators", icon: Users, label: "Colaboradores" },
          { id: "products", icon: Package, label: "Productos" },
          { id: "sales", icon: ShoppingCart, label: "Ventas" },
          { id: "payments", icon: CreditCard, label: "Pagos" },
          { id: "reports", icon: BarChart3, label: "Reportes" },
        ].map(item => (
          <button key={item.id} onClick={() => { setActiveTab(item.id); setSidebarOpen(false); }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === item.id ? "bg-teal-600 text-white" : "text-slate-400 hover:bg-slate-800 hover:text-white"}`}>
            <item.icon className="h-5 w-5" />{item.label}
            {item.badge > 0 && <Badge className="ml-auto bg-amber-500">{item.badge}</Badge>}
          </button>
        ))}
      </nav>
      <div className="p-4 border-t border-slate-800">
        <Link to={createPageUrl("Home")}><Button variant="ghost" className="w-full justify-start text-slate-400 hover:text-white hover:bg-slate-800"><Home className="h-4 w-4 mr-2" />Volver al inicio</Button></Link>
        <Button variant="ghost" className="w-full justify-start text-slate-400 hover:text-white hover:bg-slate-800" onClick={() => base44.auth.logout()}><LogOut className="h-4 w-4 mr-2" />Cerrar sesión</Button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-100 flex">
      <aside className="hidden lg:block w-64 fixed inset-y-0 left-0"><Sidebar /></aside>
      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}><SheetContent side="left" className="p-0 w-64"><Sidebar /></SheetContent></Sheet>

      <main className="flex-1 lg:ml-64">
        <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
          <div className="flex items-center justify-between px-4 lg:px-8 h-16">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setSidebarOpen(true)}><Menu className="h-5 w-5" /></Button>
              <h1 className="text-lg font-semibold text-slate-800">
                {activeTab === "dashboard" && "Dashboard"}
                {activeTab === "calendar" && "Calendario de Reservas"}
                {activeTab === "courts" && "Mis Canchas"}
                {activeTab === "collaborators" && "Colaboradores"}
                {activeTab === "products" && "Productos"}
                {activeTab === "sales" && "Ventas"}
                {activeTab === "payments" && "Pagos y Configuración"}
                {activeTab === "reports" && "Reportes"}
              </h1>
            </div>
            <div className="flex items-center gap-3">
              <NotificationCenter
                notifications={notifications}
                onMarkAsRead={(id) => markNotificationReadMutation.mutate(id)}
                onMarkAllAsRead={() => markAllNotificationsReadMutation.mutate()}
                onDelete={(id) => deleteNotificationMutation.mutate(id)}
              />
              {pendingReservations.length > 0 && <Badge className="bg-amber-500">{pendingReservations.length} pendiente{pendingReservations.length > 1 ? 's' : ''}</Badge>}
              <Avatar><AvatarImage src={user.profile_photo} /><AvatarFallback>{user.full_name?.charAt(0)}</AvatarFallback></Avatar>
            </div>
          </div>
        </header>

        <div className="p-4 lg:p-8">
          {/* Dashboard */}
          {activeTab === "dashboard" && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card><CardContent className="p-6"><div className="flex items-center justify-between"><div><p className="text-sm text-slate-500">Reservas Hoy</p><p className="text-3xl font-bold text-slate-800">{todayReservations.length}</p></div><div className="p-3 bg-teal-100 rounded-xl"><Calendar className="h-6 w-6 text-teal-600" /></div></div></CardContent></Card>
                <Card><CardContent className="p-6"><div className="flex items-center justify-between"><div><p className="text-sm text-slate-500">Pendientes</p><p className="text-3xl font-bold text-amber-600">{pendingReservations.length}</p></div><div className="p-3 bg-amber-100 rounded-xl"><Clock className="h-6 w-6 text-amber-600" /></div></div></CardContent></Card>
                <Card><CardContent className="p-6"><div className="flex items-center justify-between"><div><p className="text-sm text-slate-500">Ingresos Reservas</p><p className="text-3xl font-bold text-green-600">S/ {totalIncome}</p></div><div className="p-3 bg-green-100 rounded-xl"><DollarSign className="h-6 w-6 text-green-600" /></div></div></CardContent></Card>
                <Card><CardContent className="p-6"><div className="flex items-center justify-between"><div><p className="text-sm text-slate-500">Ventas Productos</p><p className="text-3xl font-bold text-purple-600">S/ {totalSalesIncome}</p></div><div className="p-3 bg-purple-100 rounded-xl"><ShoppingCart className="h-6 w-6 text-purple-600" /></div></div></CardContent></Card>
              </div>
              {pendingReservations.length > 0 && (
                <Card>
                  <CardHeader><CardTitle className="flex items-center gap-2"><AlertCircle className="h-5 w-5 text-amber-500" />Reservas Pendientes</CardTitle></CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {pendingReservations.slice(0, 5).map(reservation => (
                        <div key={reservation.id} className="flex items-center justify-between p-4 bg-amber-50 rounded-xl border border-amber-100">
                          <div><p className="font-medium text-slate-800">{reservation.user_name}</p><p className="text-sm text-slate-500">{reservation.court_name} • {format(new Date(reservation.date), "d MMM", { locale: es })} • {reservation.start_hour}:00</p></div>
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline" className="text-red-600" onClick={() => updateReservationMutation.mutate({ id: reservation.id, data: { status: "rejected" }, reservation })}><X className="h-4 w-4" /></Button>
                                                                        <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={() => updateReservationMutation.mutate({ id: reservation.id, data: { status: "accepted" }, reservation })}><Check className="h-4 w-4" /></Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* Calendar */}
          {activeTab === "calendar" && (
            <div className="space-y-6">
              {courts.length === 0 ? (
                <EmptyState icon={Building2} title="No tienes canchas" description="Crea tu primera cancha" action={<Button onClick={() => setShowCreateCourtDialog(true)} className="bg-teal-600"><Plus className="h-4 w-4 mr-2" />Crear Cancha</Button>} />
              ) : (
                <>
                  <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
                    <div className="flex flex-col sm:flex-row gap-3">
                      <Select value={selectedCourt?.id} onValueChange={(id) => { setSelectedCourt(courts.find(c => c.id === id)); setSelectedSlots([]); }}>
                        <SelectTrigger className="w-full sm:w-64 bg-white"><SelectValue placeholder="Selecciona cancha" /></SelectTrigger>
                        <SelectContent>{courts.map(court => <SelectItem key={court.id} value={court.id}>{court.name}</SelectItem>)}</SelectContent>
                      </Select>
                      <Tabs value={viewMode} onValueChange={setViewMode} className="bg-white rounded-lg border">
                        <TabsList className="h-10">
                          <TabsTrigger value="day" className="px-4"><CalendarDays className="h-4 w-4 mr-1" />Día</TabsTrigger>
                          <TabsTrigger value="week" className="px-4"><CalendarRange className="h-4 w-4 mr-1" />Semana</TabsTrigger>
                          <TabsTrigger value="month" className="px-4"><Calendar className="h-4 w-4 mr-1" />Mes</TabsTrigger>
                        </TabsList>
                      </Tabs>
                    </div>
                    <div className="flex gap-2">
                      {selectedSlots.length > 0 && (
                        <Button onClick={handleCreateFromSelected} className="bg-teal-600 hover:bg-teal-700">
                          <Plus className="h-4 w-4 mr-2" />Crear Reserva ({selectedSlots.length}h)
                        </Button>
                      )}
                      <Dialog open={showManualReservationDialog} onOpenChange={setShowManualReservationDialog}>
                        <DialogTrigger asChild><Button className="bg-teal-600 hover:bg-teal-700"><Plus className="h-4 w-4 mr-2" />Reserva Manual</Button></DialogTrigger>
                        <DialogContent>
                          <DialogHeader><DialogTitle>Crear Reserva Manual</DialogTitle></DialogHeader>
                          <div className="space-y-4 py-4">
                            <div><Label>Cliente *</Label><Input value={manualReservation.user_name} onChange={(e) => setManualReservation({...manualReservation, user_name: e.target.value})} className="mt-1" /></div>
                            <div><Label>Teléfono</Label><Input value={manualReservation.user_phone} onChange={(e) => setManualReservation({...manualReservation, user_phone: e.target.value})} className="mt-1" /></div>
                            <div className="grid grid-cols-2 gap-4">
                              <div><Label>Fecha</Label><Input type="date" value={manualReservation.date} onChange={(e) => setManualReservation({...manualReservation, date: e.target.value})} className="mt-1" /></div>
                              <div><Label>Hora</Label><Select value={manualReservation.start_hour.toString()} onValueChange={(v) => setManualReservation({...manualReservation, start_hour: parseInt(v)})}><SelectTrigger className="mt-1"><SelectValue /></SelectTrigger><SelectContent>{hours.map(h => <SelectItem key={h} value={h.toString()}>{h}:00</SelectItem>)}</SelectContent></Select></div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                              <div><Label>Duración</Label><Select value={manualReservation.duration_hours.toString()} onValueChange={(v) => setManualReservation({...manualReservation, duration_hours: parseInt(v)})}><SelectTrigger className="mt-1"><SelectValue /></SelectTrigger><SelectContent>{[1,2,3,4].map(h => <SelectItem key={h} value={h.toString()}>{h}h</SelectItem>)}</SelectContent></Select></div>
                              <div><Label>Pago</Label><Select value={manualReservation.payment_method} onValueChange={(v) => setManualReservation({...manualReservation, payment_method: v})}><SelectTrigger className="mt-1"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="efectivo">Efectivo</SelectItem><SelectItem value="yape">Yape</SelectItem></SelectContent></Select></div>
                            </div>
                            <div><Label>Notas</Label><Textarea value={manualReservation.notes} onChange={(e) => setManualReservation({...manualReservation, notes: e.target.value})} className="mt-1" /></div>
                          </div>
                          <div className="flex gap-3">
                            <Button variant="outline" className="flex-1" onClick={() => setShowManualReservationDialog(false)}>Cancelar</Button>
                            <Button className="flex-1 bg-teal-600" onClick={handleCreateManualReservation} disabled={createManualReservationMutation.isPending}>{createManualReservationMutation.isPending ? "Creando..." : "Crear"}</Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </div>

                  <div className="flex items-center justify-center gap-4 bg-white rounded-xl border p-3">
                    <Button variant="ghost" size="icon" onClick={() => navigateDate(-1)}><ChevronLeft className="h-5 w-5" /></Button>
                    <span className="text-lg font-semibold text-slate-800 min-w-[280px] text-center capitalize">{getDateLabel()}</span>
                    <Button variant="ghost" size="icon" onClick={() => navigateDate(1)}><ChevronRight className="h-5 w-5" /></Button>
                    <Button variant="outline" size="sm" onClick={() => setSelectedDate(new Date())}>Hoy</Button>
                  </div>

                  <Card><CardContent className="p-6">
                    <CalendarMultiSelect
                      courts={courts}
                      selectedCourt={selectedCourt}
                      selectedDate={selectedDate}
                      viewMode={viewMode}
                      reservations={reservations}
                      selectedSlots={selectedSlots}
                      onSlotToggle={handleSlotToggle}
                      onSlotClick={(date) => { setSelectedDate(date); setViewMode("day"); }}
                      onReservationClick={setSelectedReservation}
                    />
                  </CardContent></Card>
                </>
              )}
            </div>
          )}

          {/* Courts */}
          {activeTab === "courts" && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <p className="text-slate-500">{courts.length} cancha{courts.length !== 1 ? 's' : ''}</p>
                <Dialog open={showCreateCourtDialog} onOpenChange={setShowCreateCourtDialog}>
                  <DialogTrigger asChild><Button className="bg-teal-600"><Plus className="h-4 w-4 mr-2" />Nueva Cancha</Button></DialogTrigger>
                  <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                    <DialogHeader><DialogTitle>Crear Cancha</DialogTitle></DialogHeader>
                    <div className="space-y-4 py-4">
                      <div><Label>Nombre *</Label><Input value={newCourt.name} onChange={(e) => setNewCourt({...newCourt, name: e.target.value})} className="mt-1" /></div>
                      <div><Label>Descripción</Label><Textarea value={newCourt.description} onChange={(e) => setNewCourt({...newCourt, description: e.target.value})} className="mt-1" /></div>
                      <div className="grid grid-cols-2 gap-4">
                        <div><Label>Deporte</Label><Select value={newCourt.sport_type} onValueChange={(v) => setNewCourt({...newCourt, sport_type: v})}><SelectTrigger className="mt-1"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="futbol">Fútbol</SelectItem><SelectItem value="voley">Vóley</SelectItem><SelectItem value="basquet">Básquet</SelectItem><SelectItem value="futsal">Futsal</SelectItem></SelectContent></Select></div>
                        <div><Label>Departamento</Label><Select value={newCourt.department} onValueChange={(v) => setNewCourt({...newCourt, department: v})}><SelectTrigger className="mt-1"><SelectValue /></SelectTrigger><SelectContent>{["Lima", "Arequipa", "Cusco"].map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent></Select></div>
                      </div>
                      <div><Label>Dirección *</Label><Input value={newCourt.address} onChange={(e) => setNewCourt({...newCourt, address: e.target.value})} className="mt-1" /></div>
                      <div><Label>Teléfono *</Label><Input value={newCourt.phone} onChange={(e) => setNewCourt({...newCourt, phone: e.target.value})} className="mt-1" /></div>
                      <div className="grid grid-cols-2 gap-4">
                        <div><Label>Precio/hora (S/)</Label><Input type="number" value={newCourt.price_per_hour} onChange={(e) => setNewCourt({...newCourt, price_per_hour: parseInt(e.target.value)})} className="mt-1" /></div>
                        <div><Label>Precio nocturno</Label><Input type="number" value={newCourt.night_price_per_hour} onChange={(e) => setNewCourt({...newCourt, night_price_per_hour: parseInt(e.target.value)})} className="mt-1" /></div>
                      </div>
                      <div className="flex items-center justify-between"><Label>Habilitar precio nocturno</Label><Switch checked={newCourt.night_price_enabled} onCheckedChange={(v) => setNewCourt({...newCourt, night_price_enabled: v})} /></div>
                      <CourtPhotoUploader 
                        photos={newCourt.photos} 
                        onPhotosChange={(photos) => setNewCourt({...newCourt, photos})} 
                      />
                    </div>
                    <div className="flex gap-3">
                      <Button variant="outline" className="flex-1" onClick={() => setShowCreateCourtDialog(false)}>Cancelar</Button>
                      <Button className="flex-1 bg-teal-600" onClick={() => createCourtMutation.mutate(newCourt)} disabled={createCourtMutation.isPending}>{createCourtMutation.isPending ? "Creando..." : "Crear"}</Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
              {courts.length === 0 ? <EmptyState icon={Building2} title="Sin canchas" description="Registra tu primera cancha" /> : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {courts.map(court => (
                    <Card key={court.id}><CardContent className="p-6">
                      <div className="flex items-start justify-between"><div><h3 className="font-semibold text-lg">{court.name}</h3><p className="text-sm text-slate-500">{court.address}</p></div>
                        <Badge className={court.status === "approved" ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}>{court.status === "approved" ? "Aprobada" : "Pendiente"}</Badge>
                      </div>
                      <div className="mt-4 flex items-center gap-4 text-sm text-slate-600"><span>S/ {court.price_per_hour}/h</span><span>{court.opening_hour || 6}:00 - {court.closing_hour || 23}:00</span></div>
                    </CardContent></Card>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Collaborators */}
          {activeTab === "collaborators" && (
            <CollaboratorManager
              collaborators={collaborators}
              courts={courts}
              onAdd={(data) => createCollaboratorMutation.mutate(data)}
              onUpdate={(id, data) => updateCollaboratorMutation.mutate({ id, data })}
              onDelete={(id) => deleteCollaboratorMutation.mutate(id)}
              isLoading={createCollaboratorMutation.isPending || updateCollaboratorMutation.isPending}
            />
          )}

          {/* Products */}
          {activeTab === "products" && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <p className="text-slate-500">{products.length} producto{products.length !== 1 ? 's' : ''}</p>
                <Dialog open={showProductDialog} onOpenChange={(open) => { setShowProductDialog(open); if (!open) { setEditingProduct(null); setNewProduct({ name: "", description: "", price: 0, stock: 0, category: "bebidas" }); } }}>
                  <DialogTrigger asChild><Button className="bg-teal-600"><Plus className="h-4 w-4 mr-2" />Nuevo Producto</Button></DialogTrigger>
                  <DialogContent>
                    <DialogHeader><DialogTitle>{editingProduct ? "Editar" : "Nuevo"} Producto</DialogTitle></DialogHeader>
                    <div className="space-y-4 py-4">
                      <div><Label>Nombre *</Label><Input value={newProduct.name} onChange={(e) => setNewProduct({...newProduct, name: e.target.value})} className="mt-1" /></div>
                      <div><Label>Descripción</Label><Textarea value={newProduct.description} onChange={(e) => setNewProduct({...newProduct, description: e.target.value})} className="mt-1" /></div>
                      <div className="grid grid-cols-2 gap-4">
                        <div><Label>Precio (S/)</Label><Input type="number" value={newProduct.price} onChange={(e) => setNewProduct({...newProduct, price: parseFloat(e.target.value)})} className="mt-1" /></div>
                        <div><Label>Stock</Label><Input type="number" value={newProduct.stock} onChange={(e) => setNewProduct({...newProduct, stock: parseInt(e.target.value)})} className="mt-1" /></div>
                      </div>
                      <div><Label>Categoría</Label><Select value={newProduct.category} onValueChange={(v) => setNewProduct({...newProduct, category: v})}><SelectTrigger className="mt-1"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="bebidas">Bebidas</SelectItem><SelectItem value="snacks">Snacks</SelectItem><SelectItem value="equipamiento">Equipamiento</SelectItem><SelectItem value="alquiler">Alquiler</SelectItem><SelectItem value="otros">Otros</SelectItem></SelectContent></Select></div>
                    </div>
                    <div className="flex gap-3">
                      <Button variant="outline" className="flex-1" onClick={() => setShowProductDialog(false)}>Cancelar</Button>
                      <Button className="flex-1 bg-teal-600" onClick={() => editingProduct ? updateProductMutation.mutate({ id: editingProduct.id, data: newProduct }) : createProductMutation.mutate(newProduct)}>{editingProduct ? "Guardar" : "Crear"}</Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
              {products.length === 0 ? <EmptyState icon={Package} title="Sin productos" description="Agrega productos" /> : (
                <Card><Table><TableHeader><TableRow><TableHead>Producto</TableHead><TableHead>Categoría</TableHead><TableHead>Precio</TableHead><TableHead>Stock</TableHead><TableHead>Acciones</TableHead></TableRow></TableHeader>
                  <TableBody>{products.map(product => (
                    <TableRow key={product.id}><TableCell className="font-medium">{product.name}</TableCell><TableCell><Badge variant="outline" className="capitalize">{product.category}</Badge></TableCell><TableCell>S/ {product.price}</TableCell><TableCell><span className={product.stock <= 5 ? "text-red-600 font-bold" : ""}>{product.stock}</span></TableCell>
                      <TableCell><div className="flex gap-2"><Button size="icon" variant="ghost" onClick={() => { setEditingProduct(product); setNewProduct({ name: product.name, description: product.description || "", price: product.price, stock: product.stock, category: product.category }); setShowProductDialog(true); }}><Edit className="h-4 w-4" /></Button>
                        <AlertDialog><AlertDialogTrigger asChild><Button size="icon" variant="ghost" className="text-red-500"><Trash2 className="h-4 w-4" /></Button></AlertDialogTrigger><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>¿Eliminar?</AlertDialogTitle></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={() => deleteProductMutation.mutate(product.id)} className="bg-red-600">Eliminar</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
                      </div></TableCell></TableRow>
                  ))}</TableBody></Table></Card>
              )}
            </div>
          )}

          {/* Sales */}
          {activeTab === "sales" && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-4"><p className="text-slate-500">{sales.length} venta{sales.length !== 1 ? 's' : ''}</p><Badge className="bg-green-100 text-green-700">Total: S/ {totalSalesIncome}</Badge></div>
                <Dialog open={showSaleDialog} onOpenChange={setShowSaleDialog}>
                  <DialogTrigger asChild><Button className="bg-teal-600"><ShoppingCart className="h-4 w-4 mr-2" />Nueva Venta</Button></DialogTrigger>
                  <DialogContent>
                    <DialogHeader><DialogTitle>Registrar Venta</DialogTitle></DialogHeader>
                    <div className="space-y-4 py-4">
                      <div><Label>Producto *</Label><Select value={newSale.product_id} onValueChange={(v) => setNewSale({...newSale, product_id: v})}><SelectTrigger className="mt-1"><SelectValue placeholder="Selecciona" /></SelectTrigger><SelectContent>{products.filter(p => p.stock > 0).map(p => <SelectItem key={p.id} value={p.id}>{p.name} - S/ {p.price} (Stock: {p.stock})</SelectItem>)}</SelectContent></Select></div>
                      <div className="grid grid-cols-2 gap-4">
                        <div><Label>Cantidad</Label><Input type="number" min={1} value={newSale.quantity} onChange={(e) => setNewSale({...newSale, quantity: parseInt(e.target.value)})} className="mt-1" /></div>
                        <div><Label>Pago</Label><Select value={newSale.payment_method} onValueChange={(v) => setNewSale({...newSale, payment_method: v})}><SelectTrigger className="mt-1"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="efectivo">Efectivo</SelectItem><SelectItem value="yape">Yape</SelectItem><SelectItem value="plin">Plin</SelectItem></SelectContent></Select></div>
                      </div>
                      {newSale.product_id && <div className="p-4 bg-teal-50 rounded-xl"><p className="text-sm text-teal-600">Total</p><p className="text-2xl font-bold text-teal-700">S/ {(products.find(p => p.id === newSale.product_id)?.price || 0) * newSale.quantity}</p></div>}
                    </div>
                    <div className="flex gap-3">
                      <Button variant="outline" className="flex-1" onClick={() => setShowSaleDialog(false)}>Cancelar</Button>
                      <Button className="flex-1 bg-teal-600" onClick={() => createSaleMutation.mutate(newSale)} disabled={!newSale.product_id || createSaleMutation.isPending}>{createSaleMutation.isPending ? "Registrando..." : "Registrar"}</Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
              {sales.length === 0 ? <EmptyState icon={ShoppingCart} title="Sin ventas" description="Registra tu primera venta" /> : (
                <Card><Table><TableHeader><TableRow><TableHead>Fecha</TableHead><TableHead>Producto</TableHead><TableHead>Cantidad</TableHead><TableHead>Total</TableHead><TableHead>Pago</TableHead></TableRow></TableHeader>
                  <TableBody>{sales.map(sale => (
                    <TableRow key={sale.id}><TableCell>{format(new Date(sale.created_date), "d MMM HH:mm", { locale: es })}</TableCell><TableCell className="font-medium">{sale.product_name}</TableCell><TableCell>{sale.quantity}</TableCell><TableCell className="font-bold text-green-600">S/ {sale.total_price}</TableCell><TableCell><Badge variant="outline" className="capitalize">{sale.payment_method}</Badge></TableCell></TableRow>
                  ))}</TableBody></Table></Card>
              )}
            </div>
          )}

          {/* Payments */}
          {activeTab === "payments" && (
            <div className="space-y-8">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    Configuración de Pagos
                  </CardTitle>
                  <CardDescription>Configura los métodos de pago para tus canchas</CardDescription>
                </CardHeader>
                <CardContent>
                  <PaymentConfigManager 
                    config={paymentConfig}
                    onSave={(data) => savePaymentConfigMutation.mutate(data)}
                    isLoading={savePaymentConfigMutation.isPending}
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5" />
                    Historial de Pagos
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <PaymentHistory 
                    payments={payments}
                    onUpdateStatus={(id, status) => updatePaymentStatusMutation.mutate({ id, status })}
                  />
                </CardContent>
              </Card>
            </div>
          )}

          {/* Reports */}
          {activeTab === "reports" && (
            <div className="space-y-6">
              <Card><CardHeader><CardTitle>Exportar Reportes</CardTitle></CardHeader><CardContent><div className="flex flex-wrap gap-3"><Button variant="outline"><FileSpreadsheet className="h-4 w-4 mr-2" />Reservas Semanal</Button><Button variant="outline"><FileSpreadsheet className="h-4 w-4 mr-2" />Reservas Mensual</Button><Button variant="outline"><FileSpreadsheet className="h-4 w-4 mr-2" />Ventas</Button></div></CardContent></Card>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card><CardHeader><CardTitle>Reservas</CardTitle></CardHeader><CardContent><div className="grid grid-cols-2 gap-4"><div className="p-4 bg-slate-50 rounded-xl"><p className="text-sm text-slate-500">Totales</p><p className="text-2xl font-bold">{allReservations.length}</p></div><div className="p-4 bg-slate-50 rounded-xl"><p className="text-sm text-slate-500">Confirmadas</p><p className="text-2xl font-bold text-green-600">{allReservations.filter(r => ["accepted", "completed"].includes(r.status)).length}</p></div><div className="p-4 bg-slate-50 rounded-xl"><p className="text-sm text-slate-500">Manuales</p><p className="text-2xl font-bold text-purple-600">{allReservations.filter(r => r.is_manual).length}</p></div><div className="p-4 bg-slate-50 rounded-xl"><p className="text-sm text-slate-500">Ingresos</p><p className="text-2xl font-bold text-teal-600">S/ {totalIncome}</p></div></div></CardContent></Card>
                <Card><CardHeader><CardTitle>Ventas</CardTitle></CardHeader><CardContent><div className="grid grid-cols-2 gap-4"><div className="p-4 bg-slate-50 rounded-xl"><p className="text-sm text-slate-500">Ventas</p><p className="text-2xl font-bold">{sales.length}</p></div><div className="p-4 bg-slate-50 rounded-xl"><p className="text-sm text-slate-500">Ingresos</p><p className="text-2xl font-bold text-green-600">S/ {totalSalesIncome}</p></div><div className="p-4 bg-slate-50 rounded-xl"><p className="text-sm text-slate-500">Productos</p><p className="text-2xl font-bold">{products.length}</p></div><div className="p-4 bg-slate-50 rounded-xl"><p className="text-sm text-slate-500">Stock Bajo</p><p className="text-2xl font-bold text-red-600">{products.filter(p => p.stock <= 5).length}</p></div></div></CardContent></Card>
              </div>
            </div>
          )}
        </div>
      </main>

      <ReservationDetailModal
        reservation={selectedReservation}
        courts={courts}
        existingReservations={allReservations}
        open={!!selectedReservation}
        onClose={() => setSelectedReservation(null)}
        onUpdate={(id, data) => updateReservationMutation.mutate({ id, data })}
        onDelete={(id) => deleteReservationMutation.mutate(id)}
        isUpdating={updateReservationMutation.isPending}
      />
    </div>
  );
}