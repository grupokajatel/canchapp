import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "./utils";
import { base44 } from "@/api/base44Client";
import { 
    Home, 
    Search, 
    Users, 
    Calendar, 
    User, 
    Menu, 
    X, 
    LogOut,
    LayoutDashboard,
    Building2,
    Settings,
    Bell,
    Trophy
  } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import UserNotificationCenter from "@/components/notifications/UserNotificationCenter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export default function Layout({ children, currentPageName }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const queryClient = useQueryClient();

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);
    } catch (error) {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  // User notifications
  const { data: userNotifications = [] } = useQuery({
    queryKey: ['user-notifications', user?.email],
    queryFn: () => base44.entities.Notification.filter({ user_email: user.email }, '-created_date', 50),
    enabled: !!user?.email,
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const markNotificationReadMutation = useMutation({
    mutationFn: (id) => base44.entities.Notification.update(id, { is_read: true }),
    onSuccess: () => queryClient.invalidateQueries(['user-notifications'])
  });

  const markAllNotificationsReadMutation = useMutation({
    mutationFn: async () => {
      const unread = userNotifications.filter(n => !n.is_read);
      await Promise.all(unread.map(n => base44.entities.Notification.update(n.id, { is_read: true })));
    },
    onSuccess: () => queryClient.invalidateQueries(['user-notifications'])
  });

  const deleteNotificationMutation = useMutation({
    mutationFn: (id) => base44.entities.Notification.delete(id),
    onSuccess: () => queryClient.invalidateQueries(['user-notifications'])
  });

  const handleLogout = () => {
    base44.auth.logout();
  };

  const handleLogin = () => {
    base44.auth.redirectToLogin();
  };

  // Pages that don't need the standard layout
  const fullScreenPages = ["OwnerDashboard", "AdminDashboard"];
  const isFullScreen = fullScreenPages.includes(currentPageName);

  const clientNavItems = [
        { name: "Inicio", icon: Home, page: "Home" },
        { name: "Buscar", icon: Search, page: "SearchCourts" },
        { name: "Comunidad", icon: Users, page: "Community" },
        { name: "Torneos", icon: Trophy, page: "Tournaments" },
        { name: "Reservas", icon: Calendar, page: "MyReservations" },
      ];

  const getUserTypeLabel = () => {
    if (!user) return "";
    switch (user.user_type) {
      case "admin": return "Administrador";
      case "dueno": return "Dueño de Cancha";
      default: return "Cliente";
    }
  };

  if (isFullScreen) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <style>{`
        :root {
          --primary: #0F766E;
          --primary-light: #14B8A6;
          --primary-dark: #0D9488;
          --accent: #F59E0B;
          --success: #22C55E;
          --error: #EF4444;
        }
      `}</style>

      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-lg border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
                            <Link to={createPageUrl("Home")} className="flex items-center gap-2">
                              <div className="w-10 h-10 bg-gradient-to-br from-teal-500 to-teal-700 rounded-xl flex items-center justify-center shadow-lg shadow-teal-500/20">
                                <span className="text-white font-bold text-lg">C</span>
                              </div>
                              <span className="text-xl font-bold bg-gradient-to-r from-teal-600 to-teal-800 bg-clip-text text-transparent">
                                CanchApp
                              </span>
                            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-1">
              {clientNavItems.map((item) => (
                <Link
                  key={item.page}
                  to={createPageUrl(item.page)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    currentPageName === item.page
                      ? "bg-teal-50 text-teal-700"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  }`}
                >
                  {item.name}
                </Link>
              ))}
            </nav>

            {/* User Menu */}
                            <div className="flex items-center gap-3">
                              {!isLoading && user && (
                                <UserNotificationCenter
                                  notifications={userNotifications}
                                  onMarkAsRead={(id) => markNotificationReadMutation.mutate(id)}
                                  onMarkAllAsRead={() => markAllNotificationsReadMutation.mutate()}
                                  onDelete={(id) => deleteNotificationMutation.mutate(id)}
                                />
                              )}
                              {!isLoading && (
                                <>
                                  {user ? (
                                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                          <Avatar className="h-10 w-10 border-2 border-teal-100">
                            <AvatarImage src={user.profile_photo} alt={user.full_name} />
                            <AvatarFallback className="bg-gradient-to-br from-teal-500 to-teal-700 text-white">
                              {user.full_name?.charAt(0) || "U"}
                            </AvatarFallback>
                          </Avatar>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent className="w-56" align="end">
                        <div className="px-3 py-2">
                          <p className="text-sm font-medium">{user.full_name}</p>
                          <p className="text-xs text-slate-500">{user.email}</p>
                          <Badge variant="secondary" className="mt-1 text-xs">
                            {getUserTypeLabel()}
                          </Badge>
                        </div>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem asChild>
                          <Link to={createPageUrl("Profile")} className="cursor-pointer">
                            <User className="mr-2 h-4 w-4" />
                            Mi Perfil
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link to={createPageUrl("MyReservations")} className="cursor-pointer">
                            <Calendar className="mr-2 h-4 w-4" />
                            Mis Reservas
                          </Link>
                        </DropdownMenuItem>
                        {(user.user_type === "dueno" || user.role === "admin") && (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem asChild>
                              <Link to={createPageUrl("OwnerDashboard")} className="cursor-pointer">
                                <LayoutDashboard className="mr-2 h-4 w-4" />
                                Panel Dueño
                              </Link>
                            </DropdownMenuItem>
                          </>
                        )}
                        {(user.user_type === "admin" || user.role === "admin") && (
                          <DropdownMenuItem asChild>
                            <Link to={createPageUrl("AdminDashboard")} className="cursor-pointer">
                              <Building2 className="mr-2 h-4 w-4" />
                              Panel Admin
                            </Link>
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={handleLogout} className="text-red-600 cursor-pointer">
                          <LogOut className="mr-2 h-4 w-4" />
                          Cerrar Sesión
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  ) : (
                    <Button 
                      onClick={handleLogin}
                      className="bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-700 hover:to-teal-800 text-white shadow-lg shadow-teal-500/20"
                    >
                      Iniciar Sesión
                    </Button>
                  )}
                </>
              )}

              {/* Mobile Menu */}
              <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                <SheetTrigger asChild className="md:hidden">
                  <Button variant="ghost" size="icon">
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-72">
                  <nav className="flex flex-col gap-2 mt-8">
                    {clientNavItems.map((item) => (
                      <Link
                        key={item.page}
                        to={createPageUrl(item.page)}
                        onClick={() => setMobileMenuOpen(false)}
                        className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                          currentPageName === item.page
                            ? "bg-teal-50 text-teal-700"
                            : "text-slate-600 hover:bg-slate-50"
                        }`}
                      >
                        <item.icon className="h-5 w-5" />
                        {item.name}
                      </Link>
                    ))}
                  </nav>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        {children}
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 z-50">
        <div className="flex items-center justify-around h-16 px-2">
          {clientNavItems.map((item) => (
            <Link
              key={item.page}
              to={createPageUrl(item.page)}
              className={`flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-all ${
                currentPageName === item.page
                  ? "text-teal-600"
                  : "text-slate-400"
              }`}
            >
              <item.icon className="h-5 w-5" />
              <span className="text-xs font-medium">{item.name}</span>
            </Link>
          ))}
        </div>
      </nav>

      {/* Bottom padding for mobile nav */}
      <div className="h-16 md:hidden" />
    </div>
  );
}