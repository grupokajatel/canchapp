import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createPageUrl } from "@/utils";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
  LayoutDashboard, Building2, Megaphone, DollarSign, FileText, Settings,
  Users, BarChart3, Shield, Plus, Check, X, Eye, Edit, Trash2,
  Menu, LogOut, Home, TrendingUp, MapPin, AlertCircle, Search,
  FileSpreadsheet, Clock
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import EmptyState from "@/components/ui/EmptyState";
import { toast } from "sonner";

export default function AdminDashboard() {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [showAdDialog, setShowAdDialog] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [newAd, setNewAd] = useState({
    title: "", description: "", image_url: "", link_url: "",
    location: "home", is_active: true
  });

  const queryClient = useQueryClient();

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const currentUser = await base44.auth.me();
      if (currentUser.user_type !== "admin" && currentUser.role !== "admin") {
        // Skip redirect on localhost for development
        if (window.location.hostname !== 'localhost') {
          window.location.href = createPageUrl("Home");
        }
        return;
      }
      setUser(currentUser);
    } catch (error) {
      // Skip auth redirect on localhost for development
      if (window.location.hostname !== 'localhost') {
        base44.auth.redirectToLogin(window.location.href);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const { data: courts = [] } = useQuery({
    queryKey: ['admin-courts'],
    queryFn: () => base44.entities.Court.list('-created_date'),
    enabled: !!user,
  });

  const { data: reservations = [] } = useQuery({
    queryKey: ['admin-reservations'],
    queryFn: () => base44.entities.Reservation.list('-created_date', 100),
    enabled: !!user,
  });

  const { data: users = [] } = useQuery({
    queryKey: ['admin-users'],
    queryFn: () => base44.entities.User.list('-created_date'),
    enabled: !!user,
  });

  const { data: ads = [] } = useQuery({
    queryKey: ['admin-ads'],
    queryFn: () => base44.entities.Advertisement.list('-created_date'),
    enabled: !!user,
  });

  const { data: commissions = [] } = useQuery({
    queryKey: ['admin-commissions'],
    queryFn: () => base44.entities.Commission.list('-created_date'),
    enabled: !!user,
  });

  const updateCourtMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Court.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-courts']);
      toast.success("Cancha actualizada");
    },
    onError: () => toast.error("Error al actualizar")
  });

  const createAdMutation = useMutation({
    mutationFn: (data) => base44.entities.Advertisement.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-ads']);
      setShowAdDialog(false);
      setNewAd({ title: "", description: "", image_url: "", link_url: "", location: "home", is_active: true });
      toast.success("Anuncio creado");
    },
    onError: () => toast.error("Error al crear anuncio")
  });

  const deleteAdMutation = useMutation({
    mutationFn: (id) => base44.entities.Advertisement.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-ads']);
      toast.success("Anuncio eliminado");
    }
  });

  if (isLoading) return <LoadingSpinner className="min-h-screen" />;
  if (!user) return null;

  const pendingCourts = courts.filter(c => c.status === "pending");
  const totalRevenue = reservations
    .filter(r => r.status === "accepted" || r.status === "completed")
    .reduce((sum, r) => sum + (r.total_price || 0), 0);
  const totalCommissions = commissions.reduce((sum, c) => sum + (c.commission_amount || 0), 0);

  const filteredCourts = courts.filter(c => 
    c.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.address?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const Sidebar = () => (
    <div className="flex flex-col h-full bg-slate-900 text-white">
      <div className="p-6 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-700 rounded-xl flex items-center justify-center">
            <Shield className="h-5 w-5 text-white" />
          </div>
          <div>
            <p className="font-bold">CanchApp</p>
            <p className="text-xs text-slate-400">Panel Admin</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {[
          { id: "dashboard", icon: LayoutDashboard, label: "Dashboard" },
          { id: "courts", icon: Building2, label: "Canchas", badge: pendingCourts.length },
          { id: "ads", icon: Megaphone, label: "Anuncios" },
          { id: "commissions", icon: DollarSign, label: "Comisiones" },
          { id: "reports", icon: BarChart3, label: "Reportes" },
          { id: "users", icon: Users, label: "Usuarios" },
        ].map(item => (
          <button
            key={item.id}
            onClick={() => { setActiveTab(item.id); setSidebarOpen(false); }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
              activeTab === item.id 
                ? "bg-purple-600 text-white" 
                : "text-slate-400 hover:bg-slate-800 hover:text-white"
            }`}
          >
            <item.icon className="h-5 w-5" />
            {item.label}
            {item.badge > 0 && (
              <Badge className="ml-auto bg-amber-500">{item.badge}</Badge>
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
                Panel de Administrador
              </h1>
            </div>
            <Avatar>
              <AvatarImage src={user.profile_photo} />
              <AvatarFallback>{user.full_name?.charAt(0)}</AvatarFallback>
            </Avatar>
          </div>
        </header>

        <div className="p-4 lg:p-8">
          {/* Dashboard */}
          {activeTab === "dashboard" && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-slate-500">Canchas Totales</p>
                        <p className="text-3xl font-bold text-slate-800">{courts.length}</p>
                      </div>
                      <div className="p-3 bg-teal-100 rounded-xl">
                        <Building2 className="h-6 w-6 text-teal-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-slate-500">Pendientes</p>
                        <p className="text-3xl font-bold text-amber-600">{pendingCourts.length}</p>
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
                        <p className="text-sm text-slate-500">Usuarios</p>
                        <p className="text-3xl font-bold text-blue-600">{users.length}</p>
                      </div>
                      <div className="p-3 bg-blue-100 rounded-xl">
                        <Users className="h-6 w-6 text-blue-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-slate-500">Ingresos Totales</p>
                        <p className="text-3xl font-bold text-green-600">S/ {totalRevenue}</p>
                      </div>
                      <div className="p-3 bg-green-100 rounded-xl">
                        <TrendingUp className="h-6 w-6 text-green-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Pending Courts Alert */}
              {pendingCourts.length > 0 && (
                <Card className="border-amber-200 bg-amber-50">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-amber-800">
                      <AlertCircle className="h-5 w-5" />
                      Canchas Pendientes de Aprobación
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {pendingCourts.slice(0, 5).map(court => (
                        <div key={court.id} className="flex items-center justify-between p-3 bg-white rounded-lg">
                          <div>
                            <p className="font-medium">{court.name}</p>
                            <p className="text-sm text-slate-500">{court.address}</p>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-red-600"
                              onClick={() => updateCourtMutation.mutate({ id: court.id, data: { status: "rejected" } })}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              className="bg-green-600 hover:bg-green-700"
                              onClick={() => updateCourtMutation.mutate({ id: court.id, data: { status: "approved" } })}
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

          {/* Courts Management */}
          {activeTab === "courts" && (
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    placeholder="Buscar canchas..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <Tabs defaultValue="pending">
                <TabsList>
                  <TabsTrigger value="pending">
                    Pendientes ({pendingCourts.length})
                  </TabsTrigger>
                  <TabsTrigger value="all">
                    Todas ({courts.length})
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="pending" className="mt-4">
                  {pendingCourts.length === 0 ? (
                    <EmptyState
                      icon={Check}
                      title="Sin canchas pendientes"
                      description="Todas las canchas han sido revisadas"
                    />
                  ) : (
                    <Card>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Nombre</TableHead>
                            <TableHead>Dirección</TableHead>
                            <TableHead>Precio</TableHead>
                            <TableHead>Fecha</TableHead>
                            <TableHead>Acciones</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {pendingCourts.map(court => (
                            <TableRow key={court.id}>
                              <TableCell className="font-medium">{court.name}</TableCell>
                              <TableCell>{court.address}</TableCell>
                              <TableCell>S/ {court.price_per_hour}</TableCell>
                              <TableCell>{format(new Date(court.created_date), "d MMM yyyy", { locale: es })}</TableCell>
                              <TableCell>
                                <div className="flex gap-2">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="text-red-600"
                                    onClick={() => updateCourtMutation.mutate({ id: court.id, data: { status: "rejected" } })}
                                  >
                                    Rechazar
                                  </Button>
                                  <Button
                                    size="sm"
                                    className="bg-green-600 hover:bg-green-700"
                                    onClick={() => updateCourtMutation.mutate({ id: court.id, data: { status: "approved" } })}
                                  >
                                    Aprobar
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </Card>
                  )}
                </TabsContent>

                <TabsContent value="all" className="mt-4">
                  <Card>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Nombre</TableHead>
                          <TableHead>Departamento</TableHead>
                          <TableHead>Precio</TableHead>
                          <TableHead>Estado</TableHead>
                          <TableHead>Rating</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredCourts.map(court => (
                          <TableRow key={court.id}>
                            <TableCell className="font-medium">{court.name}</TableCell>
                            <TableCell>{court.department}</TableCell>
                            <TableCell>S/ {court.price_per_hour}</TableCell>
                            <TableCell>
                              <Badge className={
                                court.status === "approved" ? "bg-green-100 text-green-700" :
                                court.status === "rejected" ? "bg-red-100 text-red-700" :
                                "bg-amber-100 text-amber-700"
                              }>
                                {court.status === "approved" ? "Aprobada" : court.status === "rejected" ? "Rechazada" : "Pendiente"}
                              </Badge>
                            </TableCell>
                            <TableCell>{court.average_rating?.toFixed(1) || "-"}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          )}

          {/* Ads Management */}
          {activeTab === "ads" && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <p className="text-slate-500">{ads.length} anuncio{ads.length !== 1 ? 's' : ''}</p>
                <Dialog open={showAdDialog} onOpenChange={setShowAdDialog}>
                  <DialogTrigger asChild>
                    <Button className="bg-purple-600 hover:bg-purple-700">
                      <Plus className="h-4 w-4 mr-2" />
                      Nuevo Anuncio
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Crear Anuncio</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div>
                        <Label>Título *</Label>
                        <Input
                          value={newAd.title}
                          onChange={(e) => setNewAd({...newAd, title: e.target.value})}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label>Descripción</Label>
                        <Textarea
                          value={newAd.description}
                          onChange={(e) => setNewAd({...newAd, description: e.target.value})}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label>URL de imagen</Label>
                        <Input
                          value={newAd.image_url}
                          onChange={(e) => setNewAd({...newAd, image_url: e.target.value})}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label>URL de destino</Label>
                        <Input
                          value={newAd.link_url}
                          onChange={(e) => setNewAd({...newAd, link_url: e.target.value})}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label>Ubicación</Label>
                        <Select value={newAd.location} onValueChange={(v) => setNewAd({...newAd, location: v})}>
                          <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="home">Home</SelectItem>
                            <SelectItem value="court_detail">Detalle Cancha</SelectItem>
                            <SelectItem value="community">Comunidad</SelectItem>
                            <SelectItem value="search">Búsqueda</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex items-center justify-between">
                        <Label>Activo</Label>
                        <Switch
                          checked={newAd.is_active}
                          onCheckedChange={(v) => setNewAd({...newAd, is_active: v})}
                        />
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <Button variant="outline" className="flex-1" onClick={() => setShowAdDialog(false)}>
                        Cancelar
                      </Button>
                      <Button 
                        className="flex-1 bg-purple-600 hover:bg-purple-700"
                        onClick={() => createAdMutation.mutate(newAd)}
                      >
                        Crear
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>

              {ads.length === 0 ? (
                <EmptyState
                  icon={Megaphone}
                  title="Sin anuncios"
                  description="Crea tu primer anuncio publicitario"
                />
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {ads.map(ad => (
                    <Card key={ad.id}>
                      <CardContent className="p-4">
                        {ad.image_url && (
                          <img src={ad.image_url} alt={ad.title} className="w-full h-32 object-cover rounded-lg mb-3" />
                        )}
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="font-semibold">{ad.title}</h3>
                            <Badge className={ad.is_active ? "bg-green-100 text-green-700 mt-1" : "bg-slate-100 text-slate-700 mt-1"}>
                              {ad.is_active ? "Activo" : "Inactivo"}
                            </Badge>
                          </div>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button size="icon" variant="ghost" className="text-red-500">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>¿Eliminar anuncio?</AlertDialogTitle>
                                <AlertDialogDescription>Esta acción no se puede deshacer.</AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction onClick={() => deleteAdMutation.mutate(ad.id)} className="bg-red-600">
                                  Eliminar
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                        <div className="mt-3 flex gap-4 text-sm text-slate-500">
                          <span>{ad.clicks || 0} clics</span>
                          <span>{ad.impressions || 0} impresiones</span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Commissions */}
          {activeTab === "commissions" && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Resumen de Comisiones</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 bg-green-50 rounded-xl">
                      <p className="text-sm text-green-600">Comisiones Totales</p>
                      <p className="text-2xl font-bold text-green-700">S/ {totalCommissions}</p>
                    </div>
                    <div className="p-4 bg-amber-50 rounded-xl">
                      <p className="text-sm text-amber-600">Pendientes de Pago</p>
                      <p className="text-2xl font-bold text-amber-700">
                        S/ {commissions.filter(c => c.status === "pending").reduce((s, c) => s + (c.commission_amount || 0), 0)}
                      </p>
                    </div>
                    <div className="p-4 bg-blue-50 rounded-xl">
                      <p className="text-sm text-blue-600">Tasa Actual</p>
                      <p className="text-2xl font-bold text-blue-700">5%</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Reports */}
          {activeTab === "reports" && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Exportar Reportes</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Button variant="outline" className="w-full justify-start">
                      <FileSpreadsheet className="h-4 w-4 mr-2" />
                      Reservas por día/semana/mes
                    </Button>
                    <Button variant="outline" className="w-full justify-start">
                      <FileSpreadsheet className="h-4 w-4 mr-2" />
                      Reporte por departamento
                    </Button>
                    <Button variant="outline" className="w-full justify-start">
                      <FileSpreadsheet className="h-4 w-4 mr-2" />
                      Canchas más alquiladas
                    </Button>
                    <Button variant="outline" className="w-full justify-start">
                      <FileSpreadsheet className="h-4 w-4 mr-2" />
                      Actividad global del sistema
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Estadísticas Globales</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Reservas Totales</span>
                        <span className="font-bold">{reservations.length}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Canchas Aprobadas</span>
                        <span className="font-bold">{courts.filter(c => c.status === "approved").length}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Usuarios Registrados</span>
                        <span className="font-bold">{users.length}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Ingresos Totales</span>
                        <span className="font-bold text-green-600">S/ {totalRevenue}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {/* Users */}
          {activeTab === "users" && (
            <div className="space-y-6">
              <Card>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Usuario</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Registro</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map(u => (
                      <TableRow key={u.id}>
                        <TableCell className="font-medium">{u.full_name}</TableCell>
                        <TableCell>{u.email}</TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {u.user_type === "admin" ? "Admin" : u.user_type === "dueno" ? "Dueño" : "Cliente"}
                          </Badge>
                        </TableCell>
                        <TableCell>{format(new Date(u.created_date), "d MMM yyyy", { locale: es })}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Card>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}