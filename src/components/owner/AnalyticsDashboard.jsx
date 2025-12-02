import React, { useState, useMemo } from "react";
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, subDays, subMonths, eachDayOfInterval, getDay } from "date-fns";
import { es } from "date-fns/locale";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { TrendingUp, TrendingDown, Calendar, DollarSign, Clock, Users, BarChart3, Percent } from "lucide-react";

const DAY_NAMES = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

export default function AnalyticsDashboard({ reservations, courts }) {
  const [period, setPeriod] = useState("month");
  const [selectedCourt, setSelectedCourt] = useState("all");

  const analytics = useMemo(() => {
    const now = new Date();
    let startDate, endDate, prevStartDate, prevEndDate;

    if (period === "week") {
      startDate = startOfWeek(now, { weekStartsOn: 1 });
      endDate = endOfWeek(now, { weekStartsOn: 1 });
      prevStartDate = subDays(startDate, 7);
      prevEndDate = subDays(endDate, 7);
    } else if (period === "month") {
      startDate = startOfMonth(now);
      endDate = endOfMonth(now);
      prevStartDate = startOfMonth(subMonths(now, 1));
      prevEndDate = endOfMonth(subMonths(now, 1));
    } else {
      startDate = subDays(now, 7);
      endDate = now;
      prevStartDate = subDays(now, 14);
      prevEndDate = subDays(now, 7);
    }

    const startStr = format(startDate, 'yyyy-MM-dd');
    const endStr = format(endDate, 'yyyy-MM-dd');
    const prevStartStr = format(prevStartDate, 'yyyy-MM-dd');
    const prevEndStr = format(prevEndDate, 'yyyy-MM-dd');

    // Filter reservations
    let filtered = reservations.filter(r => 
      ["accepted", "completed"].includes(r.status) &&
      (selectedCourt === "all" || r.court_id === selectedCourt)
    );

    const currentPeriod = filtered.filter(r => r.date >= startStr && r.date <= endStr);
    const prevPeriod = filtered.filter(r => r.date >= prevStartStr && r.date <= prevEndStr);

    // Current stats
    const currentRevenue = currentPeriod.reduce((sum, r) => sum + (r.total_price || 0), 0);
    const currentCount = currentPeriod.length;
    const currentHours = currentPeriod.reduce((sum, r) => sum + (r.duration_hours || 1), 0);

    // Previous stats
    const prevRevenue = prevPeriod.reduce((sum, r) => sum + (r.total_price || 0), 0);
    const prevCount = prevPeriod.length;

    // Growth
    const revenueGrowth = prevRevenue > 0 ? ((currentRevenue - prevRevenue) / prevRevenue) * 100 : 0;
    const countGrowth = prevCount > 0 ? ((currentCount - prevCount) / prevCount) * 100 : 0;

    // Occupancy calculation
    const days = eachDayOfInterval({ start: startDate, end: endDate });
    const selectedCourtData = selectedCourt === "all" ? courts : courts.filter(c => c.id === selectedCourt);
    const totalSlots = days.length * selectedCourtData.reduce((sum, c) => 
      sum + ((c.closing_hour || 23) - (c.opening_hour || 6)), 0
    );
    const occupiedSlots = currentHours;
    const occupancyRate = totalSlots > 0 ? (occupiedSlots / totalSlots) * 100 : 0;

    // By day of week
    const byDayOfWeek = [0, 0, 0, 0, 0, 0, 0];
    const revenueByDayOfWeek = [0, 0, 0, 0, 0, 0, 0];
    currentPeriod.forEach(r => {
      const dayIdx = getDay(new Date(r.date + 'T00:00:00'));
      byDayOfWeek[dayIdx]++;
      revenueByDayOfWeek[dayIdx] += r.total_price || 0;
    });

    // By hour
    const byHour = {};
    currentPeriod.forEach(r => {
      const hour = r.start_hour;
      byHour[hour] = (byHour[hour] || 0) + 1;
    });

    // Peak hours
    const peakHour = Object.entries(byHour).sort((a, b) => b[1] - a[1])[0];
    const bestDay = byDayOfWeek.indexOf(Math.max(...byDayOfWeek));

    // Average per reservation
    const avgPerReservation = currentCount > 0 ? currentRevenue / currentCount : 0;

    return {
      currentRevenue,
      currentCount,
      currentHours,
      revenueGrowth,
      countGrowth,
      occupancyRate,
      byDayOfWeek,
      revenueByDayOfWeek,
      byHour,
      peakHour: peakHour ? parseInt(peakHour[0]) : null,
      bestDay,
      avgPerReservation,
      startDate,
      endDate
    };
  }, [reservations, courts, period, selectedCourt]);

  const maxDayCount = Math.max(...analytics.byDayOfWeek);

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="week">Esta semana</SelectItem>
            <SelectItem value="month">Este mes</SelectItem>
            <SelectItem value="last7">Últimos 7 días</SelectItem>
          </SelectContent>
        </Select>
        <Select value={selectedCourt} onValueChange={setSelectedCourt}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Todas las canchas" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas las canchas</SelectItem>
            {courts.map(c => (
              <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Main Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Ingresos</p>
                <p className="text-2xl font-bold text-slate-800">S/ {analytics.currentRevenue.toLocaleString()}</p>
                <div className={`flex items-center gap-1 text-sm mt-1 ${analytics.revenueGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {analytics.revenueGrowth >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                  {Math.abs(analytics.revenueGrowth).toFixed(1)}% vs período anterior
                </div>
              </div>
              <div className="p-3 bg-green-100 rounded-xl">
                <DollarSign className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Reservas</p>
                <p className="text-2xl font-bold text-slate-800">{analytics.currentCount}</p>
                <div className={`flex items-center gap-1 text-sm mt-1 ${analytics.countGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {analytics.countGrowth >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                  {Math.abs(analytics.countGrowth).toFixed(1)}% vs período anterior
                </div>
              </div>
              <div className="p-3 bg-blue-100 rounded-xl">
                <Calendar className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Ocupación</p>
                <p className="text-2xl font-bold text-slate-800">{analytics.occupancyRate.toFixed(1)}%</p>
                <Progress value={analytics.occupancyRate} className="h-2 mt-2 w-24" />
              </div>
              <div className="p-3 bg-purple-100 rounded-xl">
                <Percent className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Promedio/Reserva</p>
                <p className="text-2xl font-bold text-slate-800">S/ {analytics.avgPerReservation.toFixed(0)}</p>
                <p className="text-xs text-slate-400 mt-1">{analytics.currentHours}h totales</p>
              </div>
              <div className="p-3 bg-amber-100 rounded-xl">
                <BarChart3 className="h-6 w-6 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* By Day of Week */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Reservas por día de la semana</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {DAY_NAMES.map((day, idx) => (
                <div key={day} className="flex items-center gap-3">
                  <span className="w-10 text-sm text-slate-600">{day}</span>
                  <div className="flex-1 bg-slate-100 rounded-full h-6 overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all ${idx === analytics.bestDay ? 'bg-teal-500' : 'bg-teal-300'}`}
                      style={{ width: `${maxDayCount > 0 ? (analytics.byDayOfWeek[idx] / maxDayCount) * 100 : 0}%` }}
                    />
                  </div>
                  <span className="w-8 text-sm font-medium text-right">{analytics.byDayOfWeek[idx]}</span>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t flex items-center gap-2 text-sm text-slate-600">
              <Badge className="bg-teal-100 text-teal-700">Mejor día: {DAY_NAMES[analytics.bestDay]}</Badge>
            </div>
          </CardContent>
        </Card>

        {/* Revenue by Day */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Ingresos por día de la semana</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {DAY_NAMES.map((day, idx) => {
                const maxRevenue = Math.max(...analytics.revenueByDayOfWeek);
                return (
                  <div key={day} className="flex items-center gap-3">
                    <span className="w-10 text-sm text-slate-600">{day}</span>
                    <div className="flex-1 bg-slate-100 rounded-full h-6 overflow-hidden">
                      <div 
                        className="h-full bg-green-400 rounded-full transition-all"
                        style={{ width: `${maxRevenue > 0 ? (analytics.revenueByDayOfWeek[idx] / maxRevenue) * 100 : 0}%` }}
                      />
                    </div>
                    <span className="w-16 text-sm font-medium text-right">S/ {analytics.revenueByDayOfWeek[idx]}</span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Peak Hours */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Distribución por hora</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-1 items-end h-32">
            {Array.from({ length: 17 }, (_, i) => i + 6).map(hour => {
              const count = analytics.byHour[hour] || 0;
              const maxCount = Math.max(...Object.values(analytics.byHour), 1);
              const height = (count / maxCount) * 100;
              const isPeak = hour === analytics.peakHour;
              return (
                <div key={hour} className="flex-1 flex flex-col items-center gap-1">
                  <div 
                    className={`w-full rounded-t transition-all ${isPeak ? 'bg-teal-500' : 'bg-teal-200'}`}
                    style={{ height: `${height}%`, minHeight: count > 0 ? '4px' : '0' }}
                  />
                  <span className="text-[10px] text-slate-500">{hour}</span>
                </div>
              );
            })}
          </div>
          {analytics.peakHour && (
            <div className="mt-4 pt-4 border-t flex items-center gap-2 text-sm text-slate-600">
              <Clock className="h-4 w-4" />
              Hora pico: <Badge className="bg-teal-100 text-teal-700">{analytics.peakHour}:00</Badge>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}