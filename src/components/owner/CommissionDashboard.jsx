import React from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { 
  TrendingUp, 
  DollarSign, 
  Award, 
  Calendar,
  ArrowRight,
  CheckCircle2,
  Clock,
  Wallet,
  Building2
} from "lucide-react";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

const TIER_INFO = {
  bronze: { name: "Bronze", color: "bg-amber-700", icon: "🥉", rate: "10%" },
  silver: { name: "Silver", color: "bg-slate-400", icon: "🥈", rate: "7%" },
  gold: { name: "Gold", color: "bg-yellow-500", icon: "🥇", rate: "5%" },
  platinum: { name: "Platinum", color: "bg-purple-600", icon: "💎", rate: "3%" }
};

export default function CommissionDashboard({ user }) {
  const { data: ownerTier, isLoading: tierLoading } = useQuery({
    queryKey: ['owner-tier', user?.id],
    queryFn: async () => {
      const tiers = await base44.entities.OwnerTier.filter({ owner_id: user.id });
      return tiers[0];
    },
    enabled: !!user?.id
  });

  const { data: commissions = [], isLoading: commissionsLoading } = useQuery({
    queryKey: ['owner-commissions', user?.id],
    queryFn: () => base44.entities.Commission.filter({ owner_id: user.id }, '-created_date', 50),
    enabled: !!user?.id
  });

  const handleUpdateBankAccount = async (e) => {
    e.preventDefault();
    // Implementation for bank account update
  };

  if (tierLoading || commissionsLoading) {
    return <LoadingSpinner className="py-12" />;
  }

  const currentTierInfo = TIER_INFO[ownerTier?.current_tier || 'bronze'];
  const nextTierInfo = ownerTier?.next_tier ? TIER_INFO[ownerTier.next_tier] : null;
  const progressToNext = nextTierInfo 
    ? ((ownerTier.total_reservations / (ownerTier.total_reservations + ownerTier.reservations_to_next_tier)) * 100)
    : 100;

  const thisMonthCommissions = commissions.filter(c => {
    const created = new Date(c.created_date);
    const now = new Date();
    return created.getMonth() === now.getMonth() && created.getFullYear() === now.getFullYear();
  });

  const totalCommissionsPaid = commissions
    .filter(c => c.status === 'released' || c.payout_status === 'completed')
    .reduce((sum, c) => sum + c.commission_amount, 0);

  const pendingRelease = commissions
    .filter(c => c.status === 'held')
    .reduce((sum, c) => sum + c.owner_payout, 0);

  return (
    <div className="space-y-6">
      {/* Current Tier */}
      <Card className={`border-2 ${currentTierInfo.color} border-opacity-20`}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-16 h-16 ${currentTierInfo.color} rounded-2xl flex items-center justify-center text-3xl`}>
                {currentTierInfo.icon}
              </div>
              <div>
                <CardTitle>Tier {currentTierInfo.name}</CardTitle>
                <CardDescription>Comisión: {currentTierInfo.rate} por reserva</CardDescription>
              </div>
            </div>
            <Badge variant="secondary" className="text-lg px-4 py-2">
              {ownerTier?.total_reservations || 0} reservas
            </Badge>
          </div>
        </CardHeader>

        {nextTierInfo && (
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-600">Progreso a {nextTierInfo.name}</span>
                <span className="font-medium">{ownerTier.reservations_to_next_tier} reservas restantes</span>
              </div>
              <Progress value={progressToNext} className="h-2" />
              <p className="text-xs text-slate-500">
                Alcanza el tier {nextTierInfo.name} y paga solo {nextTierInfo.rate} de comisión
              </p>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Stats Grid */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <Wallet className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Balance disponible</p>
                <p className="text-2xl font-bold text-slate-800">
                  S/ {ownerTier?.pending_payout?.toFixed(2) || '0.00'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <Clock className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">En retención</p>
                <p className="text-2xl font-bold text-slate-800">
                  S/ {pendingRelease.toFixed(2)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Este mes</p>
                <p className="text-2xl font-bold text-slate-800">
                  {ownerTier?.monthly_reservations || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                <DollarSign className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Comisiones pagadas</p>
                <p className="text-2xl font-bold text-slate-800">
                  S/ {totalCommissionsPaid.toFixed(2)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bank Account */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Cuenta Bancaria
          </CardTitle>
          <CardDescription>
            Los pagos se transfieren cada lunes si tienes S/ 100 o más disponible
          </CardDescription>
        </CardHeader>
        <CardContent>
          {ownerTier?.bank_account_verified ? (
            <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-200">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                <div>
                  <p className="font-medium text-green-800">{ownerTier.bank_name}</p>
                  <p className="text-sm text-green-600">
                    {ownerTier.account_holder_name} - ***{ownerTier.bank_account?.slice(-4)}
                  </p>
                </div>
              </div>
              <Badge variant="secondary" className="bg-green-100 text-green-700">Verificada</Badge>
            </div>
          ) : (
            <form onSubmit={handleUpdateBankAccount} className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label>Banco</Label>
                  <Input placeholder="BCP, BBVA, Interbank..." />
                </div>
                <div>
                  <Label>Número de cuenta</Label>
                  <Input placeholder="1234567890" />
                </div>
              </div>
              <div>
                <Label>Titular de la cuenta</Label>
                <Input placeholder="Juan Pérez" />
              </div>
              <Button type="submit" className="bg-teal-600 hover:bg-teal-700">
                Guardar cuenta
              </Button>
            </form>
          )}
        </CardContent>
      </Card>

      {/* Recent Commissions */}
      <Card>
        <CardHeader>
          <CardTitle>Últimas Comisiones</CardTitle>
          <CardDescription>Historial de comisiones y pagos</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {commissions.slice(0, 10).map((commission) => (
              <div key={commission.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex-1">
                  <p className="font-medium">Reserva #{commission.reservation_id.slice(0, 8)}</p>
                  <p className="text-sm text-slate-500">
                    {new Date(commission.created_date).toLocaleDateString('es-PE')}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-semibold">S/ {commission.owner_payout.toFixed(2)}</p>
                  <p className="text-xs text-slate-500">
                    Comisión: S/ {commission.commission_amount.toFixed(2)} ({(commission.final_rate * 100).toFixed(1)}%)
                  </p>
                </div>
                <div className="ml-4">
                  <Badge variant={
                    commission.payout_status === 'completed' ? 'default' :
                    commission.status === 'released' ? 'secondary' :
                    'outline'
                  }>
                    {commission.payout_status === 'completed' ? 'Pagado' :
                     commission.status === 'released' ? 'Pendiente' :
                     'Retenido'}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}