import React, { useState } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Calendar, Clock, MapPin, DollarSign, User, CreditCard,
  Smartphone, AlertCircle, Navigation
} from "lucide-react";
import { toast } from "sonner";

const PAYMENT_METHODS = [
  { id: "yape", name: "Yape", icon: Smartphone, color: "text-purple-600" },
  { id: "plin", name: "Plin", icon: Smartphone, color: "text-teal-600" },
  { id: "efectivo", name: "Efectivo (en cancha)", icon: DollarSign, color: "text-green-600" },
];

export default function JoinMatchModal({ 
  match, 
  open, 
  onClose, 
  onJoin, 
  isJoining,
  user 
}) {
  const [nickname, setNickname] = useState(user?.nickname || user?.full_name?.split(' ')[0] || "");
  const [paymentMethod, setPaymentMethod] = useState("yape");
  const [step, setStep] = useState(1); // 1: info, 2: payment

  if (!match) return null;

  const handleContinue = () => {
    if (!nickname.trim()) {
      toast.error("Ingresa un nickname");
      return;
    }
    setStep(2);
  };

  const handleJoin = () => {
    if (match.price_per_person > 0 && !paymentMethod) {
      toast.error("Selecciona un método de pago");
      return;
    }
    onJoin(match, paymentMethod, nickname);
  };

  const handleViewLocation = () => {
    if (match.court_latitude && match.court_longitude) {
      window.open(
        `https://www.google.com/maps/dir/?api=1&destination=${match.court_latitude},${match.court_longitude}`,
        '_blank'
      );
    } else if (match.court_address) {
      window.open(
        `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(match.court_address)}`,
        '_blank'
      );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {step === 1 ? "Unirse al Partido" : "Confirmar Pago"}
          </DialogTitle>
          <DialogDescription>
            {step === 1 
              ? "Completa tus datos para unirte" 
              : "Realiza el pago para confirmar tu lugar"
            }
          </DialogDescription>
        </DialogHeader>

        {step === 1 ? (
          <div className="space-y-4 py-4">
            {/* Match Info */}
            <div className="p-4 bg-slate-50 rounded-xl space-y-2">
              <h3 className="font-semibold text-slate-800">{match.title}</h3>
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <Calendar className="h-4 w-4 text-teal-500" />
                {format(new Date(match.date + 'T00:00:00'), "EEE d MMM", { locale: es })} - {match.time}
              </div>
              {match.court_name && (
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <MapPin className="h-4 w-4 text-teal-500" />
                  {match.court_name}
                </div>
              )}
            </div>

            {/* Nickname Input */}
            <div>
              <Label>Tu nickname para este partido *</Label>
              <Input
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder="Ej: ElCrack10, Messi"
                className="mt-1"
                maxLength={20}
              />
              <p className="text-xs text-slate-500 mt-1">
                Este nombre aparecerá en la lista de jugadores
              </p>
            </div>

            {/* Price Info */}
            {match.price_per_person > 0 && (
              <div className="p-4 bg-teal-50 rounded-xl">
                <div className="flex items-center justify-between">
                  <span className="text-teal-700">Monto a pagar</span>
                  <span className="text-2xl font-bold text-teal-700">
                    S/ {match.price_per_person}
                  </span>
                </div>
                <p className="text-xs text-teal-600 mt-1">
                  Debes realizar el pago para confirmar tu lugar
                </p>
              </div>
            )}

            <div className="flex gap-3 pt-4">
              <Button variant="outline" className="flex-1" onClick={onClose}>
                Cancelar
              </Button>
              <Button 
                className="flex-1 bg-teal-600 hover:bg-teal-700"
                onClick={handleContinue}
              >
                Continuar
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4 py-4">
            {match.price_per_person > 0 ? (
              <>
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Realiza el pago de S/ {match.price_per_person} al organizador
                  </AlertDescription>
                </Alert>

                <div>
                  <Label>Método de pago</Label>
                  <RadioGroup
                    value={paymentMethod}
                    onValueChange={setPaymentMethod}
                    className="mt-2 space-y-2"
                  >
                    {PAYMENT_METHODS.map((method) => (
                      <div
                        key={method.id}
                        className={`flex items-center space-x-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                          paymentMethod === method.id
                            ? "border-teal-500 bg-teal-50"
                            : "border-slate-200 hover:bg-slate-50"
                        }`}
                        onClick={() => setPaymentMethod(method.id)}
                      >
                        <RadioGroupItem value={method.id} />
                        <method.icon className={`h-5 w-5 ${method.color}`} />
                        <span className="flex-1">{method.name}</span>
                      </div>
                    ))}
                  </RadioGroup>
                </div>

                <p className="text-sm text-slate-500">
                  El organizador confirmará tu pago y podrás ver la ubicación del partido.
                </p>
              </>
            ) : (
              <div className="text-center py-4">
                <Badge className="bg-green-100 text-green-700 mb-3">
                  ¡Partido gratuito!
                </Badge>
                <p className="text-slate-600">No requiere pago previo</p>
              </div>
            )}

            {/* Location Button */}
            {(match.court_address || (match.court_latitude && match.court_longitude)) && (
              <Button
                variant="outline"
                className="w-full"
                onClick={handleViewLocation}
              >
                <Navigation className="h-4 w-4 mr-2" />
                Ver ubicación de la cancha
              </Button>
            )}

            <div className="flex gap-3 pt-4">
              <Button variant="outline" className="flex-1" onClick={() => setStep(1)}>
                Atrás
              </Button>
              <Button 
                className="flex-1 bg-teal-600 hover:bg-teal-700"
                onClick={handleJoin}
                disabled={isJoining}
              >
                {isJoining ? "Uniéndose..." : "Confirmar"}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}