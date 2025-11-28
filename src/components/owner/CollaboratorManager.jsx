import React, { useState } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Users, Plus, Edit, Trash2, Mail, Phone, Shield, Check, X, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { Checkbox } from "@/components/ui/checkbox";
import EmptyState from "@/components/ui/EmptyState";

const PERMISSIONS = [
  { id: "view_calendar", label: "Ver calendario" },
  { id: "manage_reservations", label: "Gestionar reservas" },
  { id: "create_manual_reservations", label: "Crear reservas manuales" },
  { id: "manage_products", label: "Gestionar productos" },
  { id: "register_sales", label: "Registrar ventas" },
  { id: "view_reports", label: "Ver reportes" },
];

const ROLE_PRESETS = {
  admin: PERMISSIONS.map(p => p.id),
  manager: ["view_calendar", "manage_reservations", "create_manual_reservations", "manage_products", "register_sales"],
  staff: ["view_calendar", "create_manual_reservations", "register_sales"],
};

export default function CollaboratorManager({
  collaborators,
  courts,
  onAdd,
  onUpdate,
  onDelete,
  isLoading
}) {
  const [showDialog, setShowDialog] = useState(false);
  const [editingCollab, setEditingCollab] = useState(null);
  const [formData, setFormData] = useState({
    user_email: "",
    user_name: "",
    phone: "",
    role: "staff",
    permissions: ROLE_PRESETS.staff,
    courts_access: []
  });

  const resetForm = () => {
    setFormData({
      user_email: "",
      user_name: "",
      phone: "",
      role: "staff",
      permissions: ROLE_PRESETS.staff,
      courts_access: []
    });
    setEditingCollab(null);
  };

  const handleRoleChange = (role) => {
    setFormData({
      ...formData,
      role,
      permissions: ROLE_PRESETS[role] || []
    });
  };

  const togglePermission = (permissionId) => {
    const current = formData.permissions || [];
    if (current.includes(permissionId)) {
      setFormData({ ...formData, permissions: current.filter(p => p !== permissionId) });
    } else {
      setFormData({ ...formData, permissions: [...current, permissionId] });
    }
  };

  const toggleCourtAccess = (courtId) => {
    const current = formData.courts_access || [];
    if (current.includes(courtId)) {
      setFormData({ ...formData, courts_access: current.filter(c => c !== courtId) });
    } else {
      setFormData({ ...formData, courts_access: [...current, courtId] });
    }
  };

  const handleSubmit = () => {
    if (editingCollab) {
      onUpdate(editingCollab.id, formData);
    } else {
      onAdd(formData);
    }
    setShowDialog(false);
    resetForm();
  };

  const startEdit = (collab) => {
    setEditingCollab(collab);
    setFormData({
      user_email: collab.user_email,
      user_name: collab.user_name || "",
      phone: collab.phone || "",
      role: collab.role,
      permissions: collab.permissions || ROLE_PRESETS[collab.role] || [],
      courts_access: collab.courts_access || []
    });
    setShowDialog(true);
  };

  const roleLabels = {
    admin: { label: "Administrador", color: "bg-purple-100 text-purple-700" },
    manager: { label: "Gerente", color: "bg-blue-100 text-blue-700" },
    staff: { label: "Personal", color: "bg-slate-100 text-slate-700" },
  };

  const statusLabels = {
    pending: { label: "Pendiente", color: "bg-amber-100 text-amber-700" },
    active: { label: "Activo", color: "bg-green-100 text-green-700" },
    inactive: { label: "Inactivo", color: "bg-slate-100 text-slate-700" },
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-lg font-semibold">Colaboradores</h2>
          <p className="text-sm text-slate-500">Gestiona el acceso de tu equipo</p>
        </div>
        <Dialog open={showDialog} onOpenChange={(open) => { setShowDialog(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button className="bg-teal-600 hover:bg-teal-700">
              <UserPlus className="h-4 w-4 mr-2" />
              Agregar Colaborador
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingCollab ? "Editar Colaborador" : "Nuevo Colaborador"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label>Email *</Label>
                <Input
                  type="email"
                  value={formData.user_email}
                  onChange={(e) => setFormData({...formData, user_email: e.target.value})}
                  placeholder="colaborador@email.com"
                  className="mt-1"
                  disabled={!!editingCollab}
                />
              </div>

              <div>
                <Label>Nombre</Label>
                <Input
                  value={formData.user_name}
                  onChange={(e) => setFormData({...formData, user_name: e.target.value})}
                  placeholder="Nombre del colaborador"
                  className="mt-1"
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
                <Label>Rol</Label>
                <Select value={formData.role} onValueChange={handleRoleChange}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Administrador - Acceso total</SelectItem>
                    <SelectItem value="manager">Gerente - Gestión completa</SelectItem>
                    <SelectItem value="staff">Personal - Acceso básico</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="mb-2 block">Permisos</Label>
                <div className="space-y-2 p-3 bg-slate-50 rounded-lg">
                  {PERMISSIONS.map((perm) => (
                    <div key={perm.id} className="flex items-center gap-2">
                      <Checkbox
                        id={perm.id}
                        checked={formData.permissions?.includes(perm.id)}
                        onCheckedChange={() => togglePermission(perm.id)}
                      />
                      <label htmlFor={perm.id} className="text-sm cursor-pointer">{perm.label}</label>
                    </div>
                  ))}
                </div>
              </div>

              {courts.length > 0 && (
                <div>
                  <Label className="mb-2 block">Acceso a Canchas</Label>
                  <div className="space-y-2 p-3 bg-slate-50 rounded-lg">
                    {courts.map((court) => (
                      <div key={court.id} className="flex items-center gap-2">
                        <Checkbox
                          id={`court-${court.id}`}
                          checked={formData.courts_access?.includes(court.id)}
                          onCheckedChange={() => toggleCourtAccess(court.id)}
                        />
                        <label htmlFor={`court-${court.id}`} className="text-sm cursor-pointer">{court.name}</label>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-slate-500 mt-1">Sin selección = acceso a todas</p>
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => { setShowDialog(false); resetForm(); }}>
                Cancelar
              </Button>
              <Button
                className="flex-1 bg-teal-600 hover:bg-teal-700"
                onClick={handleSubmit}
                disabled={!formData.user_email || isLoading}
              >
                {isLoading ? "Guardando..." : editingCollab ? "Guardar" : "Agregar"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {collaborators.length === 0 ? (
        <EmptyState
          icon={Users}
          title="Sin colaboradores"
          description="Agrega colaboradores para que te ayuden a gestionar tus canchas"
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {collaborators.map((collab) => {
            const role = roleLabels[collab.role] || roleLabels.staff;
            const status = statusLabels[collab.status] || statusLabels.pending;

            return (
              <Card key={collab.id}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <Avatar className="h-12 w-12">
                      <AvatarFallback className="bg-teal-100 text-teal-700">
                        {collab.user_name?.charAt(0) || collab.user_email?.charAt(0)?.toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold truncate">{collab.user_name || "Sin nombre"}</h3>
                        <Badge className={role.color}>{role.label}</Badge>
                        <Badge className={status.color}>{status.label}</Badge>
                      </div>
                      <p className="text-sm text-slate-500 truncate">{collab.user_email}</p>
                      {collab.phone && (
                        <p className="text-sm text-slate-500">{collab.phone}</p>
                      )}
                      <div className="flex gap-2 mt-3">
                        <Button size="sm" variant="outline" onClick={() => startEdit(collab)}>
                          <Edit className="h-3 w-3 mr-1" />
                          Editar
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button size="sm" variant="outline" className="text-red-600">
                              <Trash2 className="h-3 w-3 mr-1" />
                              Eliminar
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>¿Eliminar colaborador?</AlertDialogTitle>
                              <AlertDialogDescription>
                                {collab.user_name || collab.user_email} ya no tendrá acceso al sistema.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction onClick={() => onDelete(collab.id)} className="bg-red-600">
                                Eliminar
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}