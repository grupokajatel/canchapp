import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { CreditCard, Smartphone, Wallet, DollarSign, Upload, Loader2, Check, Copy, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";

const METHOD_ICONS = {
  yape: Smartphone,
  plin: Smartphone,
  mercadopago: Wallet,
  stripe: CreditCard,
  efectivo: DollarSign
};

const METHOD_COLORS = {
  yape: "bg-purple-100 text-purple-700 border-purple-200",
  plin: "bg-green-100 text-green-700 border-green-200",
  mercadopago: "bg-blue-100 text-blue-700 border-blue-200",
  stripe: "bg-indigo-100 text-indigo-700 border-indigo-200",
  efectivo: "bg-amber-100 text-amber-700 border-amber-200"
};

export default function PaymentModal({ 
  open, 
  onClose, 
  reservation, 
  paymentConfig, 
  onPaymentComplete 
}) {
  const [selectedMethod, setSelectedMethod] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [proofUrl, setProofUrl] = useState("");

  const availableMethods = [];
  if (paymentConfig?.yape_enabled) availableMethods.push({ id: "yape", name: "Yape", phone: paymentConfig.yape_phone, holder: paymentConfig.yape_name });
  if (paymentConfig?.plin_enabled) availableMethods.push({ id: "plin", name: "Plin", phone: paymentConfig.plin_phone, holder: paymentConfig.plin_name });
  if (paymentConfig?.mercadopago_enabled) availableMethods.push({ id: "mercadopago", name: "Mercado Pago" });
  if (paymentConfig?.stripe_enabled) availableMethods.push({ id: "stripe", name: "Stripe" });
  if (paymentConfig?.cash_enabled) availableMethods.push({ id: "efectivo", name: "Pagar en cancha" });

  const handleProofUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setProofUrl(file_url);
      toast.success("Comprobante subido");
    } catch (error) {
      toast.error("Error al subir comprobante");
    } finally {
      setUploading(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success("Copiado al portapapeles");
  };

  const handleSubmit = async () => {
    if (!selectedMethod) {
      toast.error("Selecciona un método de pago");
      return;
    }

    const method = availableMethods.find(m => m.id === selectedMethod);
    
    // For Yape/Plin require proof
    if ((selectedMethod === "yape" || selectedMethod === "plin") && !proofUrl) {
      toast.error("Sube el comprobante de pago");
      return;
    }

    setProcessing(true);
    try {
      // Determine payment status based on method
      let paymentStatus = "pending";
      let reservationStatus = reservation.status;

      if (selectedMethod === "efectivo") {
        // Cash payment - reservation stays pending, no actual payment yet
        paymentStatus = "pending";
      } else if (selectedMethod === "yape" || selectedMethod === "plin") {
        // Mobile payment with proof - mark as completed and confirm reservation
        paymentStatus = "completed";
        reservationStatus = "accepted";
      } else {
        // Card payments would go through external processor
        // For now, mark as completed for demo
        paymentStatus = "completed";
        reservationStatus = "accepted";
      }

      onPaymentComplete({
        method: selectedMethod,
        proofUrl,
        paymentStatus,
        reservationStatus
      });

      onClose();
    } catch (error) {
      toast.error("Error al procesar el pago");
    } finally {
      setProcessing(false);
    }
  };

  const selectedMethodData = availableMethods.find(m => m.id === selectedMethod);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Método de Pago</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Amount Display */}
          <div className="bg-teal-50 rounded-xl p-4 text-center">
            <p className="text-sm text-teal-600">Total a pagar</p>
            <p className="text-3xl font-bold text-teal-700">S/ {reservation?.total_price}</p>
          </div>

          {/* Payment Methods */}
          <RadioGroup value={selectedMethod} onValueChange={setSelectedMethod}>
            <div className="space-y-2">
              {availableMethods.map((method) => {
                const Icon = METHOD_ICONS[method.id];
                return (
                  <label
                    key={method.id}
                    className={`flex items-center gap-3 p-4 border-2 rounded-xl cursor-pointer transition-all ${
                      selectedMethod === method.id 
                        ? METHOD_COLORS[method.id] + " border-current"
                        : "border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <RadioGroupItem value={method.id} className="sr-only" />
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      selectedMethod === method.id ? "bg-current/20" : "bg-slate-100"
                    }`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{method.name}</p>
                      {method.phone && (
                        <p className="text-xs opacity-70">{method.holder}</p>
                      )}
                    </div>
                    {selectedMethod === method.id && (
                      <Check className="h-5 w-5" />
                    )}
                  </label>
                );
              })}
            </div>
          </RadioGroup>

          {/* Yape/Plin Instructions */}
          {(selectedMethod === "yape" || selectedMethod === "plin") && selectedMethodData && (
            <div className="bg-slate-50 rounded-xl p-4 space-y-3">
              <p className="text-sm font-medium text-slate-700">Instrucciones de pago:</p>
              <div className="flex items-center justify-between p-3 bg-white rounded-lg border">
                <div>
                  <p className="text-xs text-slate-500">Número</p>
                  <p className="font-mono font-semibold">{selectedMethodData.phone}</p>
                </div>
                <Button 
                  size="sm" 
                  variant="ghost"
                  onClick={() => copyToClipboard(selectedMethodData.phone)}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
              <div className="p-3 bg-white rounded-lg border">
                <p className="text-xs text-slate-500">A nombre de</p>
                <p className="font-semibold">{selectedMethodData.holder}</p>
              </div>

              {/* Upload Proof */}
              <div>
                <Label className="text-sm">Comprobante de pago *</Label>
                {proofUrl ? (
                  <div className="mt-2 relative">
                    <img src={proofUrl} alt="Comprobante" className="w-full h-40 object-cover rounded-lg" />
                    <Button 
                      size="sm" 
                      variant="secondary" 
                      className="absolute top-2 right-2"
                      onClick={() => setProofUrl("")}
                    >
                      Cambiar
                    </Button>
                  </div>
                ) : (
                  <label className="mt-2 flex flex-col items-center justify-center h-32 border-2 border-dashed rounded-xl cursor-pointer hover:border-teal-500 transition-colors">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleProofUpload}
                      disabled={uploading}
                      className="hidden"
                    />
                    {uploading ? (
                      <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
                    ) : (
                      <>
                        <Upload className="h-6 w-6 text-slate-400 mb-2" />
                        <p className="text-sm text-slate-500">Subir captura</p>
                      </>
                    )}
                  </label>
                )}
              </div>
            </div>
          )}

          {/* Cash Notice */}
          {selectedMethod === "efectivo" && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Deberás pagar al llegar a la cancha. El dueño confirmará tu reserva.
              </AlertDescription>
            </Alert>
          )}

          {/* Card Payments Notice */}
          {(selectedMethod === "mercadopago" || selectedMethod === "stripe") && (
            <Alert>
              <CreditCard className="h-4 w-4" />
              <AlertDescription>
                Serás redirigido para completar el pago de forma segura.
              </AlertDescription>
            </Alert>
          )}
        </div>

        <div className="flex gap-3">
          <Button variant="outline" className="flex-1" onClick={onClose}>
            Cancelar
          </Button>
          <Button 
            className="flex-1 bg-teal-600 hover:bg-teal-700"
            onClick={handleSubmit}
            disabled={!selectedMethod || processing}
          >
            {processing ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : null}
            {selectedMethod === "efectivo" ? "Confirmar Reserva" : "Pagar S/ " + reservation?.total_price}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}