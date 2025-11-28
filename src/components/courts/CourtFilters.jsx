import React, { useState } from "react";
import { Search, MapPin, SlidersHorizontal, X, Clock, Wifi, Car, ShowerHead, Coffee, Shirt, Users, Dumbbell, Lightbulb, Check } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetClose,
} from "@/components/ui/sheet";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";

const DEPARTMENTS = [
  "Lima", "Arequipa", "Cusco", "Trujillo", "Chiclayo", "Piura", "Iquitos", 
  "Tacna", "Huancayo", "Puno", "Cajamarca", "Ayacucho", "Ica", "Tumbes", 
  "Lambayeque", "Ancash", "Loreto", "San Martin", "Ucayali", "Madre de Dios",
  "Apurimac", "Amazonas", "Huanuco", "Pasco", "Junin", "Moquegua"
];

const SPORT_TYPES = [
  { value: "futbol", label: "Fútbol" },
  { value: "voley", label: "Vóley" },
  { value: "basquet", label: "Básquet" },
  { value: "futsal", label: "Futsal" },
  { value: "tenis", label: "Tenis" },
  { value: "otro", label: "Otro" },
];

const AMENITIES = [
  { value: "Wifi", label: "WiFi", icon: Wifi },
  { value: "Estacionamiento", label: "Estacionamiento", icon: Car },
  { value: "Duchas", label: "Duchas", icon: ShowerHead },
  { value: "Cafetería", label: "Cafetería", icon: Coffee },
  { value: "Vestuarios", label: "Vestuarios", icon: Shirt },
  { value: "Tribuna", label: "Tribuna", icon: Users },
  { value: "Iluminación", label: "Iluminación", icon: Lightbulb },
];

const HOURS = Array.from({ length: 18 }, (_, i) => i + 6);

export default function CourtFilters({ filters, onFilterChange, onClearFilters }) {
  const [sheetOpen, setSheetOpen] = useState(false);
  
  const activeFiltersCount = [
    filters.search,
    filters.department !== "all" && filters.department,
    filters.sport_type !== "all" && filters.sport_type,
    filters.maxPrice,
    filters.minPrice,
    filters.availableHour,
    filters.amenities?.length > 0
  ].filter(Boolean).length;

  const handleAmenityToggle = (amenity) => {
    const current = filters.amenities || [];
    const updated = current.includes(amenity)
      ? current.filter(a => a !== amenity)
      : [...current, amenity];
    onFilterChange({ ...filters, amenities: updated });
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4">
      <div className="flex flex-col lg:flex-row gap-3">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
          <Input
            placeholder="Buscar por nombre de cancha..."
            value={filters.search || ""}
            onChange={(e) => onFilterChange({ ...filters, search: e.target.value })}
            className="pl-10 h-12 border-slate-200 focus:border-teal-500 focus:ring-teal-500"
          />
        </div>

        {/* Department Select */}
        <Select
          value={filters.department || "all"}
          onValueChange={(value) => onFilterChange({ ...filters, department: value })}
        >
          <SelectTrigger className="w-full lg:w-48 h-12 border-slate-200">
            <MapPin className="h-4 w-4 mr-2 text-slate-400" />
            <SelectValue placeholder="Departamento" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            {DEPARTMENTS.map((dept) => (
              <SelectItem key={dept} value={dept}>{dept}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Sport Type Select */}
        <Select
          value={filters.sport_type || "all"}
          onValueChange={(value) => onFilterChange({ ...filters, sport_type: value })}
        >
          <SelectTrigger className="w-full lg:w-40 h-12 border-slate-200">
            <SelectValue placeholder="Deporte" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            {SPORT_TYPES.map((sport) => (
              <SelectItem key={sport.value} value={sport.value}>{sport.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Advanced Filters Button */}
        <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" className="h-12 border-slate-200">
              <SlidersHorizontal className="h-4 w-4 mr-2" />
              Filtros Avanzados
              {activeFiltersCount > 0 && (
                <Badge className="ml-2 bg-teal-600">{activeFiltersCount}</Badge>
              )}
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
            <SheetHeader>
              <SheetTitle>Filtros Avanzados</SheetTitle>
            </SheetHeader>
            <div className="py-6 space-y-8">
              {/* Price Range */}
              <div>
                <Label className="text-sm font-semibold text-slate-800 mb-4 block">
                  Rango de Precio (S/ por hora)
                </Label>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs text-slate-500">Mínimo</Label>
                    <Select
                      value={filters.minPrice?.toString() || "all"}
                      onValueChange={(value) => onFilterChange({ ...filters, minPrice: value === "all" ? null : parseInt(value) })}
                    >
                      <SelectTrigger className="mt-1"><SelectValue placeholder="Sin mín." /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Sin mínimo</SelectItem>
                        {[10, 20, 30, 40, 50, 60, 80, 100].map(p => (
                          <SelectItem key={p} value={p.toString()}>S/ {p}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs text-slate-500">Máximo</Label>
                    <Select
                      value={filters.maxPrice?.toString() || "all"}
                      onValueChange={(value) => onFilterChange({ ...filters, maxPrice: value === "all" ? null : parseInt(value) })}
                    >
                      <SelectTrigger className="mt-1"><SelectValue placeholder="Sin máx." /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Sin máximo</SelectItem>
                        {[30, 50, 80, 100, 120, 150, 200].map(p => (
                          <SelectItem key={p} value={p.toString()}>S/ {p}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Available Hour */}
              <div>
                <Label className="text-sm font-semibold text-slate-800 mb-4 flex items-center gap-2">
                  <Clock className="h-4 w-4 text-teal-600" />
                  Disponibilidad Horaria
                </Label>
                <Select
                  value={filters.availableHour?.toString() || "all"}
                  onValueChange={(value) => onFilterChange({ ...filters, availableHour: value === "all" ? null : parseInt(value) })}
                >
                  <SelectTrigger><SelectValue placeholder="Cualquier hora" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Cualquier hora</SelectItem>
                    {HOURS.map(hour => (
                      <SelectItem key={hour} value={hour.toString()}>
                        {hour}:00 {hour < 12 ? 'AM' : 'PM'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-slate-500 mt-2">
                  Muestra canchas abiertas a esta hora
                </p>
              </div>

              {/* Amenities */}
              <div>
                <Label className="text-sm font-semibold text-slate-800 mb-4 block">
                  Servicios Disponibles
                </Label>
                <div className="grid grid-cols-2 gap-2">
                  {AMENITIES.map((amenity) => {
                    const isSelected = filters.amenities?.includes(amenity.value);
                    return (
                      <button
                        key={amenity.value}
                        onClick={() => handleAmenityToggle(amenity.value)}
                        className={`flex items-center gap-2 p-3 rounded-xl border transition-all ${
                          isSelected 
                            ? 'bg-teal-50 border-teal-500 text-teal-700' 
                            : 'bg-white border-slate-200 hover:border-slate-300 text-slate-600'
                        }`}
                      >
                        <amenity.icon className="h-4 w-4" />
                        <span className="text-sm">{amenity.label}</span>
                        {isSelected && <Check className="h-3 w-3 ml-auto" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4 border-t">
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => {
                    onClearFilters();
                    setSheetOpen(false);
                  }}
                >
                  <X className="h-4 w-4 mr-2" />
                  Limpiar
                </Button>
                <SheetClose asChild>
                  <Button className="flex-1 bg-teal-600 hover:bg-teal-700">
                    Aplicar Filtros
                  </Button>
                </SheetClose>
              </div>
            </div>
          </SheetContent>
        </Sheet>

        {/* Quick Clear - Desktop */}
        {activeFiltersCount > 0 && (
          <Button 
            variant="ghost" 
            size="sm"
            onClick={onClearFilters}
            className="text-slate-500 hidden lg:flex"
          >
            <X className="h-4 w-4 mr-1" />
            Limpiar
          </Button>
        )}
      </div>

      {/* Active Filters Display */}
      {(filters.amenities?.length > 0 || filters.availableHour || filters.minPrice || filters.maxPrice) && (
        <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-slate-100">
          {filters.minPrice && (
            <Badge variant="secondary" className="bg-teal-50 text-teal-700">
              Desde S/ {filters.minPrice}
              <button onClick={() => onFilterChange({ ...filters, minPrice: null })} className="ml-1">
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {filters.maxPrice && (
            <Badge variant="secondary" className="bg-teal-50 text-teal-700">
              Hasta S/ {filters.maxPrice}
              <button onClick={() => onFilterChange({ ...filters, maxPrice: null })} className="ml-1">
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {filters.availableHour && (
            <Badge variant="secondary" className="bg-blue-50 text-blue-700">
              <Clock className="h-3 w-3 mr-1" />
              {filters.availableHour}:00
              <button onClick={() => onFilterChange({ ...filters, availableHour: null })} className="ml-1">
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {filters.amenities?.map(amenity => (
            <Badge key={amenity} variant="secondary" className="bg-purple-50 text-purple-700">
              {amenity}
              <button onClick={() => handleAmenityToggle(amenity)} className="ml-1">
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}