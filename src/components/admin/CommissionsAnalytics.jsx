import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  DollarSign, 
  TrendingUp, 
  Users, 
  Clock,
  RefreshCw,
  Download,
  Calendar
} from "lucide-react";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { toast } from "sonner";

const TIER_COLORS = {
  bronze: "bg-amber-700 text-white",
  silver: "bg-slate-400 text-white",
  gold: "bg-yellow-500 text-white",
  platinum: "bg-purple-600 text-white"
};

export default function CommissionsAnalytics() {
  const [processing, setProcessing] = useState(false);
  const queryClient = useQueryClient();

  const { data: commissions = [], isLoading } = useQuery({
    queryKey: ['all-commissions'],
    queryFn: () => base44.entities.Commission.list('-created_date', 500)
  });

  const { data: ownerTiers = [] } = useQuery({
    queryKey: ['all-owner-tiers'],
    queryFn: () => base44.entities.OwnerTier.list()
  });

  const releasePaymentsMutation = useMutation({
    mutationFn: () => base44.functions.invoke('releaseHeldPayments', {}),
    onSuccess: () => {
      queryClient.invalidateQueries(['all-commissions']);
      toast.success('Pagos liberados exitosamente');
    }
  });

  const processPayoutsMutation = useMutation({
    mutationFn: () => base44.functions.invoke('processPayouts', {}),
    onSuccess: (response) => {
      queryClient.invalidateQueries(['all-commissions']);
      queryClient.invalidateQueries(['all-owner-tiers']);
      toast.success(`${response.data.processed} payouts procesados`);
    }
  });

  const handleReleasePayments = async () => {
    setProcessing(true);
    try {
      await releasePaymentsMutation.mutateAsync();
    } finally {
      setProcessing(false);
    }
  };

  const handleProcessPayouts = async () => {
    setProcessing(true);
    try {
      await processPayoutsMutation.mutateAsync();
    } finally {
      setProcessing(false);
    }
  };

  if (isLoading) {
    return <LoadingSpinner className="py-12" />;
  }

  // Calculate stats
  const totalCommissions = commissions.reduce((sum, c) => sum + c.commission_amount, 0);
  const totalPayouts = commissions
    .filter(c => c.payout_status === 'completed')
    .reduce((sum, c) => sum + c.owner_payout, 0);
  const heldAmount = commissions
    .filter(c => c.status === 'held')
    .reduce((sum, c) => sum + c.owner_payout, 0);
  const pendingPayouts = ownerTiers.reduce((sum, t) => sum + (t.pending_payout || 0), 0);

  const tierDistribution = ownerTiers.reduce((acc, t) => {
    acc[t.current_tier] = (acc[t.current_tier] || 0) + 1;
    return acc;
  }, {});

  const thisMonth = commissions.filter(c => {
    const created = new Date(c.created_date);
    const now = new Date();
    return created.getMonth() === now.getMonth() && created.getFullYear() === now.getFullYear();
  });

  const monthlyRevenue = thisMonth.reduce((sum, c) => sum + c.commission_amount, 0);

  return (
    <div className="space-y-6">
      {/* Actions */}
      <div className="flex gap-3">
        <Button 
          onClick={handleReleasePayments}
          disabled={processing}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Clock className="h-4 w-4 mr-2" />
          Liberar pagos retenidos
        </Button>
        <Button 
          onClick={handleProcessPayouts}
          disabled={processing}
          className="bg-green-600 hover:bg-green-700"
        >
          <DollarSign className="h-4 w-4 mr-2" />
          Procesar payouts
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-teal-100 rounded-xl flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-teal-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Comisiones totales</p>
                <p className="text-2xl font-bold text-slate-800">
                  S/ {totalCommissions.toFixed(2)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <DollarSign className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Este mes</p>
                <p className="text-2xl font-bold text-slate-800">
                  S/ {monthlyRevenue.toFixed(2)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                <Clock className="h-6 w-6 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">En retención</p>
                <p className="text-2xl font-bold text-slate-800">
                  S/ {heldAmount.toFixed(2)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                <Users className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Payouts pendientes</p>
                <p className="text-2xl font-bold text-slate-800">
                  S/ {pendingPayouts.toFixed(2)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tier Distribution */}
      <Card>
        <CardHeader>
          <CardTitle>Distribución por Tier</CardTitle>
          <CardDescription>Dueños activos por nivel de comisión</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(tierDistribution).map(([tier, count]) => (
              <div key={tier} className="text-center">
                <div className={`w-full py-8 rounded-xl ${TIER_COLORS[tier]} mb-2`}>
                  <p className="text-4xl font-bold">{count}</p>
                </div>
                <p className="text-sm font-medium capitalize">{tier}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Commissions */}
      <Card>
        <CardHeader>
          <CardTitle>Comisiones Recientes</CardTitle>
          <CardDescription>Últimas 20 transacciones</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {commissions.slice(0, 20).map((commission) => (
              <div key={commission.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Badge className={TIER_COLORS[commission.tier]}>
                      {commission.tier}
                    </Badge>
                    <span className="text-sm text-slate-500">
                      Reserva #{commission.reservation_id.slice(0, 8)}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    {new Date(commission.created_date).toLocaleDateString('es-PE')}
                  </p>
                </div>
                <div className="text-right mr-4">
                  <p className="font-semibold">S/ {commission.commission_amount.toFixed(2)}</p>
                  <p className="text-xs text-slate-500">{(commission.final_rate * 100).toFixed(1)}% comisión</p>
                </div>
                <Badge variant={
                  commission.payout_status === 'completed' ? 'default' :
                  commission.status === 'released' ? 'secondary' :
                  'outline'
                }>
                  {commission.payout_status === 'completed' ? 'Pagado' :
                   commission.status === 'released' ? 'Pendiente' :
                   commission.status === 'held' ? 'Retenido' :
                   'Cancelado'}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}