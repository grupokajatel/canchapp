import React, { useState, useEffect } from "react";
import { CreditCard, Smartphone, Wallet, DollarSign, Save, Settings, Check, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

const PAYMENT_METHODS = [
  { 
    id: "yape", 
    name: "Yape", 
    icon: Smartphone, 
    color: "bg-purple-500",
    fields: [
      { key: "yape_phone", label: "Número Yape", placeholder: "999 999 999" },
      { key: "yape_name", label: "Nombre del titular", placeholder: "Juan Pérez" }
    ]
  },
  { 
    id: "plin", 
    name: "Plin", 
    icon: Smartphone, 
    color: "bg-green-500",
    fields: [
      { key: "plin_phone", label: "Número Plin", placeholder: "999 999 999" },
      { key: "plin_name", label: "Nombre del titular", placeholder: "Juan Pérez" }
    ]
  },
  { 
    id: "mercadopago", 
    name: "Mercado Pago", 
    icon: Wallet, 
    color: "bg-blue-500",
    fields: [
      { key: "mercadopago_public_key", label: "Public Key", placeholder: "APP_USR-..." },
      { key: "mercadopago_access_token", label: "Access Token", placeholder: "APP_USR-...", secret: true }
    ]
  },
  { 
    id: "stripe", 
    name: "Stripe", 
    icon: CreditCard, 
    color: "bg-indigo-500",
    fields: [
      { key: "stripe_public_key", label: "Public Key", placeholder: "pk_live_..." },
      { key: "stripe_secret_key", label: "Secret Key", placeholder: "sk_live_...", secret: true }
    ]
  },
  { 
    id: "cash", 
    name: "Efectivo", 
    icon: DollarSign, 
    color: "bg-amber-500",
    fields: []
  }
];

export default function PaymentConfigManager({ config, onSave, isLoading }) {
  const [localConfig, setLocalConfig] = useState({
    yape_enabled: false,
    yape_phone: "",
    yape_name: "",
    plin_enabled: false,
    plin_phone: "",
    plin_name: "",
    mercadopago_enabled: false,
    mercadopago_public_key: "",
    mercadopago_access_token: "",
    stripe_enabled: false,
    stripe_public_key: "",
    stripe_secret_key: "",
    cash_enabled: true,
    require_payment_upfront: false,
    ...config
  });

  useEffect(() => {
    if (config) {
      setLocalConfig(prev => ({ ...prev, ...config }));
    }
  }, [config]);

  const handleToggle = (methodId) => {
    setLocalConfig(prev => ({
      ...prev,
      [`${methodId}_enabled`]: !prev[`${methodId}_enabled`]
    }));
  };

  const handleFieldChange = (key, value) => {
    setLocalConfig(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = () => {
    onSave(localConfig);
  };

  const enabledCount = PAYMENT_METHODS.filter(m => localConfig[`${m.id}_enabled`]).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-800">Métodos de Pago</h2>
          <p className="text-sm text-slate-500">{enabledCount} método{enabledCount !== 1 ? 's' : ''} activo{enabledCount !== 1 ? 's' : ''}</p>
        </div>
        <Button onClick={handleSave} disabled={isLoading} className="bg-teal-600 hover:bg-teal-700">
          <Save className="h-4 w-4 mr-2" />
          {isLoading ? "Guardando..." : "Guardar"}
        </Button>
      </div>

      {/* Require Payment Upfront */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-slate-800">Requerir pago anticipado</p>
              <p className="text-sm text-slate-500">Los clientes deben pagar para confirmar la reserva</p>
            </div>
            <Switch
              checked={localConfig.require_payment_upfront}
              onCheckedChange={(v) => handleFieldChange('require_payment_upfront', v)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Payment Methods */}
      <div className="grid gap-4">
        {PAYMENT_METHODS.map((method) => {
          const isEnabled = localConfig[`${method.id}_enabled`];
          const Icon = method.icon;

          return (
            <Card key={method.id} className={isEnabled ? "border-teal-200 bg-teal-50/30" : ""}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg ${method.color} flex items-center justify-center`}>
                      <Icon className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-base">{method.name}</CardTitle>
                      {isEnabled && <Badge variant="secondary" className="text-xs bg-teal-100 text-teal-700">Activo</Badge>}
                    </div>
                  </div>
                  <Switch
                    checked={isEnabled}
                    onCheckedChange={() => handleToggle(method.id)}
                  />
                </div>
              </CardHeader>

              {isEnabled && method.fields.length > 0 && (
                <CardContent className="pt-0">
                  <div className="grid gap-3 pt-3 border-t">
                    {method.fields.map((field) => (
                      <div key={field.key}>
                        <Label className="text-sm">{field.label}</Label>
                        <Input
                          type={field.secret ? "password" : "text"}
                          value={localConfig[field.key] || ""}
                          onChange={(e) => handleFieldChange(field.key, e.target.value)}
                          placeholder={field.placeholder}
                          className="mt-1"
                        />
                      </div>
                    ))}
                  </div>
                </CardContent>
              )}
            </Card>
          );
        })}
      </div>

      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Los pagos con Yape y Plin requieren que el cliente suba un comprobante. 
          Mercado Pago y Stripe procesan pagos automáticamente.
        </AlertDescription>
      </Alert>
    </div>
  );
}