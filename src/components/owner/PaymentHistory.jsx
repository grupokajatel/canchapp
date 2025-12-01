import React, { useState } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { CreditCard, Smartphone, DollarSign, Wallet, Search, Filter, Eye, Download, CheckCircle, Clock, XCircle, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import EmptyState from "@/components/ui/EmptyState";

const METHOD_ICONS = {
  yape: Smartphone,
  plin: Smartphone,
  mercadopago: Wallet,
  stripe: CreditCard,
  efectivo: DollarSign
};

const STATUS_CONFIG = {
  pending: { label: "Pendiente", color: "bg-amber-100 text-amber-700", icon: Clock },
  completed: { label: "Completado", color: "bg-green-100 text-green-700", icon: CheckCircle },
  failed: { label: "Fallido", color: "bg-red-100 text-red-700", icon: XCircle },
  refunded: { label: "Reembolsado", color: "bg-purple-100 text-purple-700", icon: RotateCcw }
};

export default function PaymentHistory({ payments = [], onUpdateStatus }) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [methodFilter, setMethodFilter] = useState("all");
  const [selectedPayment, setSelectedPayment] = useState(null);

  const filteredPayments = payments.filter(payment => {
    const matchesSearch = !search || 
      payment.user_name?.toLowerCase().includes(search.toLowerCase()) ||
      payment.court_name?.toLowerCase().includes(search.toLowerCase()) ||
      payment.transaction_id?.toLowerCase().includes(search.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || payment.status === statusFilter;
    const matchesMethod = methodFilter === "all" || payment.payment_method === methodFilter;

    return matchesSearch && matchesStatus && matchesMethod;
  });

  const totalCompleted = payments.filter(p => p.status === "completed").reduce((sum, p) => sum + p.amount, 0);
  const totalPending = payments.filter(p => p.status === "pending").reduce((sum, p) => sum + p.amount, 0);

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-slate-500">Total Pagos</p>
            <p className="text-2xl font-bold text-slate-800">{payments.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-slate-500">Ingresos Confirmados</p>
            <p className="text-2xl font-bold text-green-600">S/ {totalCompleted.toFixed(2)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-slate-500">Pagos Pendientes</p>
            <p className="text-2xl font-bold text-amber-600">S/ {totalPending.toFixed(2)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Buscar por cliente, cancha o ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder="Estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="completed">Completados</SelectItem>
            <SelectItem value="pending">Pendientes</SelectItem>
            <SelectItem value="failed">Fallidos</SelectItem>
            <SelectItem value="refunded">Reembolsados</SelectItem>
          </SelectContent>
        </Select>
        <Select value={methodFilter} onValueChange={setMethodFilter}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder="Método" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="yape">Yape</SelectItem>
            <SelectItem value="plin">Plin</SelectItem>
            <SelectItem value="mercadopago">Mercado Pago</SelectItem>
            <SelectItem value="stripe">Stripe</SelectItem>
            <SelectItem value="efectivo">Efectivo</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      {filteredPayments.length === 0 ? (
        <EmptyState
          icon={CreditCard}
          title="Sin pagos"
          description="No hay pagos que coincidan con los filtros"
        />
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fecha</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Cancha</TableHead>
                <TableHead>Método</TableHead>
                <TableHead>Monto</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPayments.map((payment) => {
                const MethodIcon = METHOD_ICONS[payment.payment_method] || CreditCard;
                const statusConfig = STATUS_CONFIG[payment.status] || STATUS_CONFIG.pending;
                const StatusIcon = statusConfig.icon;

                return (
                  <TableRow key={payment.id}>
                    <TableCell className="text-sm">
                      {format(new Date(payment.created_date), "d MMM HH:mm", { locale: es })}
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{payment.user_name || "—"}</p>
                        <p className="text-xs text-slate-500">{payment.user_email}</p>
                      </div>
                    </TableCell>
                    <TableCell>{payment.court_name}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <MethodIcon className="h-4 w-4 text-slate-500" />
                        <span className="capitalize text-sm">{payment.payment_method}</span>
                      </div>
                    </TableCell>
                    <TableCell className="font-semibold">S/ {payment.amount}</TableCell>
                    <TableCell>
                      <Badge className={statusConfig.color}>
                        <StatusIcon className="h-3 w-3 mr-1" />
                        {statusConfig.label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button 
                        size="sm" 
                        variant="ghost"
                        onClick={() => setSelectedPayment(payment)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Card>
      )}

      {/* Payment Detail Modal */}
      <Dialog open={!!selectedPayment} onOpenChange={() => setSelectedPayment(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Detalle del Pago</DialogTitle>
          </DialogHeader>
          {selectedPayment && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-slate-500">ID Transacción</p>
                  <p className="font-mono text-sm">{selectedPayment.transaction_id || selectedPayment.id}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Fecha</p>
                  <p className="text-sm">{format(new Date(selectedPayment.created_date), "d MMM yyyy HH:mm", { locale: es })}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Cliente</p>
                  <p className="text-sm font-medium">{selectedPayment.user_name}</p>
                  <p className="text-xs text-slate-500">{selectedPayment.user_email}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Cancha</p>
                  <p className="text-sm">{selectedPayment.court_name}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Método</p>
                  <p className="text-sm capitalize">{selectedPayment.payment_method}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Monto</p>
                  <p className="text-lg font-bold text-teal-600">S/ {selectedPayment.amount}</p>
                </div>
              </div>

              {selectedPayment.payment_proof_url && (
                <div>
                  <p className="text-xs text-slate-500 mb-2">Comprobante</p>
                  <img 
                    src={selectedPayment.payment_proof_url} 
                    alt="Comprobante" 
                    className="w-full max-h-60 object-contain rounded-lg border"
                  />
                </div>
              )}

              {selectedPayment.status === "pending" && onUpdateStatus && (
                <div className="flex gap-2 pt-4 border-t">
                  <Button
                    variant="outline"
                    className="flex-1 text-red-600"
                    onClick={() => {
                      onUpdateStatus(selectedPayment.id, "failed");
                      setSelectedPayment(null);
                    }}
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Rechazar
                  </Button>
                  <Button
                    className="flex-1 bg-green-600 hover:bg-green-700"
                    onClick={() => {
                      onUpdateStatus(selectedPayment.id, "completed");
                      setSelectedPayment(null);
                    }}
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Confirmar
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}