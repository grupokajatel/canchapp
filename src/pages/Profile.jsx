import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation } from "@tanstack/react-query";
import { createPageUrl } from "@/utils";
import { Link } from "react-router-dom";
import {
  User, Phone, Mail, MapPin, Camera, Save, 
  LayoutDashboard, LogOut, Shield, Building2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { toast } from "sonner";

const DEPARTMENTS = [
  "Lima", "Arequipa", "Cusco", "Trujillo", "Chiclayo", "Piura", "Iquitos", 
  "Tacna", "Huancayo", "Puno", "Cajamarca", "Ayacucho", "Ica", "Tumbes", 
  "Lambayeque", "Ancash", "Loreto", "San Martin", "Ucayali", "Madre de Dios",
  "Apurimac", "Amazonas", "Huanuco", "Pasco", "Junin", "Moquegua"
];

export default function Profile() {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [formData, setFormData] = useState({
    phone: "",
    department: "",
    user_type: "cliente"
  });

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);
      setFormData({
        phone: currentUser.phone || "",
        department: currentUser.department || "",
        user_type: currentUser.user_type || "cliente"
      });
    } catch (error) {
      base44.auth.redirectToLogin(window.location.href);
    } finally {
      setIsLoading(false);
    }
  };

  const updateProfileMutation = useMutation({
    mutationFn: (data) => base44.auth.updateMe(data),
    onSuccess: () => {
      toast.success("Perfil actualizado correctamente");
      loadUser();
    },
    onError: () => {
      toast.error("Error al actualizar el perfil");
    }
  });

  const handleSave = () => {
    updateProfileMutation.mutate(formData);
  };

  const handleLogout = () => {
    base44.auth.logout();
  };

  if (isLoading) {
    return <LoadingSpinner className="min-h-screen" />;
  }

  if (!user) {
    return null;
  }

  const userTypeLabels = {
    cliente: "Cliente",
    dueno: "Dueño de Cancha",
    admin: "Administrador"
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white pb-20">
      {/* Header */}
      <div className="bg-gradient-to-r from-teal-600 to-teal-700 text-white py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <Avatar className="w-24 h-24 mx-auto border-4 border-white shadow-xl">
            <AvatarImage src={user.profile_photo} alt={user.full_name} />
            <AvatarFallback className="text-3xl bg-teal-800">
              {user.full_name?.charAt(0) || "U"}
            </AvatarFallback>
          </Avatar>
          <h1 className="text-2xl font-bold mt-4">{user.full_name}</h1>
          <p className="text-teal-100 mt-1">{user.email}</p>
          <Badge className="mt-3 bg-white/20 text-white border-white/30">
            {userTypeLabels[user.user_type] || "Cliente"}
          </Badge>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 -mt-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Profile Form */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Información Personal</CardTitle>
                <CardDescription>Actualiza tu información de perfil</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Nombre completo</Label>
                  <Input 
                    value={user.full_name || ""} 
                    disabled 
                    className="mt-1 bg-slate-50"
                  />
                  <p className="text-xs text-slate-500 mt-1">No se puede modificar</p>
                </div>

                <div>
                  <Label>Correo electrónico</Label>
                  <Input 
                    value={user.email || ""} 
                    disabled 
                    className="mt-1 bg-slate-50"
                  />
                </div>

                <div>
                  <Label>Teléfono</Label>
                  <Input
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    placeholder="999 999 999"
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label>Departamento</Label>
                  <Select
                    value={formData.department}
                    onValueChange={(value) => setFormData({...formData, department: value})}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Selecciona tu departamento" />
                    </SelectTrigger>
                    <SelectContent>
                      {DEPARTMENTS.map(dept => (
                        <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Tipo de cuenta</Label>
                  <Select
                    value={formData.user_type}
                    onValueChange={(value) => setFormData({...formData, user_type: value})}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cliente">Cliente - Quiero reservar canchas</SelectItem>
                      <SelectItem value="dueno">Dueño - Tengo canchas para alquilar</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-slate-500 mt-1">
                    Si eres dueño de cancha, podrás acceder al panel de administración
                  </p>
                </div>

                <Button 
                  onClick={handleSave}
                  disabled={updateProfileMutation.isPending}
                  className="w-full bg-teal-600 hover:bg-teal-700"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {updateProfileMutation.isPending ? "Guardando..." : "Guardar cambios"}
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <div className="space-y-4">
            {(formData.user_type === "dueno" || user.user_type === "dueno") && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Panel de Dueño</CardTitle>
                </CardHeader>
                <CardContent>
                  <Link to={createPageUrl("OwnerDashboard")}>
                    <Button variant="outline" className="w-full justify-start">
                      <LayoutDashboard className="h-4 w-4 mr-2" />
                      Ir al Panel de Dueño
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            )}

            {(user.user_type === "admin" || user.role === "admin") && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Administración</CardTitle>
                </CardHeader>
                <CardContent>
                  <Link to={createPageUrl("AdminDashboard")}>
                    <Button variant="outline" className="w-full justify-start">
                      <Building2 className="h-4 w-4 mr-2" />
                      Panel de Administrador
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Cuenta</CardTitle>
              </CardHeader>
              <CardContent>
                <Button 
                  variant="outline" 
                  className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
                  onClick={handleLogout}
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Cerrar sesión
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}