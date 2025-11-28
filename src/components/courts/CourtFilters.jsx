import React from "react";
import { Search, MapPin, SlidersHorizontal, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
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

export default function CourtFilters({ filters, onFilterChange, onClearFilters }) {
  const activeFiltersCount = Object.values(filters).filter(v => v && v !== "all").length;

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

        {/* More Filters - Mobile */}
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" className="h-12 border-slate-200 lg:hidden">
              <SlidersHorizontal className="h-4 w-4 mr-2" />
              Filtros
              {activeFiltersCount > 0 && (
                <Badge className="ml-2 bg-teal-600">{activeFiltersCount}</Badge>
              )}
            </Button>
          </SheetTrigger>
          <SheetContent side="bottom" className="h-[80vh] rounded-t-3xl">
            <SheetHeader>
              <SheetTitle>Filtros Avanzados</SheetTitle>
            </SheetHeader>
            <div className="py-6 space-y-6">
              <div>
                <label className="text-sm font-medium text-slate-700 mb-3 block">
                  Precio Máximo: S/ {filters.maxPrice || 100}
                </label>
                <Slider
                  value={[filters.maxPrice || 100]}
                  onValueChange={([value]) => onFilterChange({ ...filters, maxPrice: value })}
                  max={200}
                  min={10}
                  step={10}
                  className="py-4"
                />
              </div>
              <Button 
                variant="outline" 
                className="w-full"
                onClick={onClearFilters}
              >
                <X className="h-4 w-4 mr-2" />
                Limpiar Filtros
              </Button>
            </div>
          </SheetContent>
        </Sheet>

        {/* Price Filter - Desktop */}
        <div className="hidden lg:flex items-center gap-3">
          <Select
            value={filters.maxPrice?.toString() || "all"}
            onValueChange={(value) => onFilterChange({ ...filters, maxPrice: value === "all" ? null : parseInt(value) })}
          >
            <SelectTrigger className="w-40 h-12 border-slate-200">
              <SelectValue placeholder="Precio máx." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Sin límite</SelectItem>
              <SelectItem value="30">Hasta S/ 30</SelectItem>
              <SelectItem value="50">Hasta S/ 50</SelectItem>
              <SelectItem value="80">Hasta S/ 80</SelectItem>
              <SelectItem value="100">Hasta S/ 100</SelectItem>
              <SelectItem value="150">Hasta S/ 150</SelectItem>
            </SelectContent>
          </Select>

          {activeFiltersCount > 0 && (
            <Button 
              variant="ghost" 
              size="sm"
              onClick={onClearFilters}
              className="text-slate-500"
            >
              <X className="h-4 w-4 mr-1" />
              Limpiar
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}