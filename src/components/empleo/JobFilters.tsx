import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Filter } from 'lucide-react';

interface JobFiltersProps {
  jobType: string;
  province: string;
  onJobTypeChange: (value: string) => void;
  onProvinceChange: (value: string) => void;
}

const JOB_TYPES = [
  { value: 'all', label: 'Todos los puestos' },
  { value: 'adjunto_farmaceutico', label: 'Adjunto/a Farmacéutico/a' },
  { value: 'tecnico', label: 'Técnico' },
  { value: 'auxiliar', label: 'Auxiliar' },
  { value: 'otros', label: 'Otros' }
];

const PROVINCES = [
  { value: 'all', label: 'Todas las provincias' },
  { value: 'A Coruña', label: 'A Coruña' },
  { value: 'Álava', label: 'Álava' },
  { value: 'Albacete', label: 'Albacete' },
  { value: 'Alicante', label: 'Alicante' },
  { value: 'Almería', label: 'Almería' },
  { value: 'Asturias', label: 'Asturias' },
  { value: 'Ávila', label: 'Ávila' },
  { value: 'Badajoz', label: 'Badajoz' },
  { value: 'Barcelona', label: 'Barcelona' },
  { value: 'Burgos', label: 'Burgos' },
  { value: 'Cáceres', label: 'Cáceres' },
  { value: 'Cádiz', label: 'Cádiz' },
  { value: 'Cantabria', label: 'Cantabria' },
  { value: 'Castellón', label: 'Castellón' },
  { value: 'Ciudad Real', label: 'Ciudad Real' },
  { value: 'Córdoba', label: 'Córdoba' },
  { value: 'Cuenca', label: 'Cuenca' },
  { value: 'Girona', label: 'Girona' },
  { value: 'Granada', label: 'Granada' },
  { value: 'Guadalajara', label: 'Guadalajara' },
  { value: 'Guipúzcoa', label: 'Guipúzcoa' },
  { value: 'Huelva', label: 'Huelva' },
  { value: 'Huesca', label: 'Huesca' },
  { value: 'Islas Baleares', label: 'Islas Baleares' },
  { value: 'Jaén', label: 'Jaén' },
  { value: 'La Rioja', label: 'La Rioja' },
  { value: 'Las Palmas', label: 'Las Palmas' },
  { value: 'León', label: 'León' },
  { value: 'Lleida', label: 'Lleida' },
  { value: 'Lugo', label: 'Lugo' },
  { value: 'Madrid', label: 'Madrid' },
  { value: 'Málaga', label: 'Málaga' },
  { value: 'Murcia', label: 'Murcia' },
  { value: 'Navarra', label: 'Navarra' },
  { value: 'Ourense', label: 'Ourense' },
  { value: 'Palencia', label: 'Palencia' },
  { value: 'Pontevedra', label: 'Pontevedra' },
  { value: 'Salamanca', label: 'Salamanca' },
  { value: 'Santa Cruz de Tenerife', label: 'Santa Cruz de Tenerife' },
  { value: 'Segovia', label: 'Segovia' },
  { value: 'Sevilla', label: 'Sevilla' },
  { value: 'Soria', label: 'Soria' },
  { value: 'Tarragona', label: 'Tarragona' },
  { value: 'Teruel', label: 'Teruel' },
  { value: 'Toledo', label: 'Toledo' },
  { value: 'Valencia', label: 'Valencia' },
  { value: 'Valladolid', label: 'Valladolid' },
  { value: 'Vizcaya', label: 'Vizcaya' },
  { value: 'Zamora', label: 'Zamora' },
  { value: 'Zaragoza', label: 'Zaragoza' }
];

export const JobFilters = ({ jobType, province, onJobTypeChange, onProvinceChange }: JobFiltersProps) => {
  return (
    <Card className="shadow-md">
      <CardContent className="p-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium text-muted-foreground">Filtros:</span>
          </div>
          
          <div className="flex gap-4 flex-1">
            <div className="flex-1">
              <Select value={jobType} onValueChange={onJobTypeChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Tipo de puesto" />
                </SelectTrigger>
                <SelectContent>
                  {JOB_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex-1">
              <Select value={province} onValueChange={onProvinceChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Provincia" />
                </SelectTrigger>
                <SelectContent>
                  {PROVINCES.map((prov) => (
                    <SelectItem key={prov.value} value={prov.value}>
                      {prov.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};