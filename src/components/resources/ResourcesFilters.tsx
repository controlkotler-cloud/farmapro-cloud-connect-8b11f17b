import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowDownAZ, Clock } from 'lucide-react';
import { getResourceTypeStyle } from '@/lib/resourceCategory';

export type AccessFilter = 'todos' | 'gratis' | 'premium';
export type SortOrder = 'recientes' | 'alfabetico';

interface TypeOption {
  value: string;
  count: number;
}

interface ResourcesFiltersProps {
  // Chips de tipo: lista de tipos presentes (con su contador) + opción "todos".
  typeOptions: TypeOption[];
  totalCount: number;
  selectedType: string;
  onTypeChange: (type: string) => void;
  access: AccessFilter;
  onAccessChange: (access: AccessFilter) => void;
  sort: SortOrder;
  onSortChange: (sort: SortOrder) => void;
}

const ACCESS_OPTIONS: { value: AccessFilter; label: string }[] = [
  { value: 'todos', label: 'Todos' },
  { value: 'gratis', label: 'Gratis' },
  { value: 'premium', label: 'Premium' },
];

export const ResourcesFilters = ({
  typeOptions,
  totalCount,
  selectedType,
  onTypeChange,
  access,
  onAccessChange,
  sort,
  onSortChange,
}: ResourcesFiltersProps) => {
  return (
    <motion.div
      className="space-y-3"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      {/* Chips de filtro por tipo de recurso */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-medium uppercase tracking-wide text-gray-500 mr-1">Tipo</span>
        <button
          type="button"
          onClick={() => onTypeChange('todos')}
          className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
            selectedType === 'todos'
              ? 'border-transparent bg-gray-900 text-white'
              : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
          }`}
        >
          Todos ({totalCount})
        </button>
        {typeOptions.map(({ value, count }) => {
          const ts = getResourceTypeStyle(value);
          const active = selectedType === value;
          return (
            <button
              key={value}
              type="button"
              onClick={() => onTypeChange(value)}
              className={`flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                active
                  ? 'border-transparent bg-gray-900 text-white'
                  : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              <ts.Icon className="h-3.5 w-3.5" />
              {ts.label} ({count})
            </button>
          );
        })}
      </div>

      {/* Toggle de acceso (Gratis / Premium) + orden */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex rounded-lg border border-gray-200 bg-white p-0.5">
          {ACCESS_OPTIONS.map(opt => {
            const active = access === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => onAccessChange(opt.value)}
                className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                  active ? 'bg-gray-900 text-white shadow-sm' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {opt.label}
              </button>
            );
          })}
        </div>

        <Select value={sort} onValueChange={(v) => onSortChange(v as SortOrder)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="recientes">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Más recientes
              </div>
            </SelectItem>
            <SelectItem value="alfabetico">
              <div className="flex items-center gap-2">
                <ArrowDownAZ className="h-4 w-4" />
                Alfabético (A-Z)
              </div>
            </SelectItem>
          </SelectContent>
        </Select>
      </div>
    </motion.div>
  );
};
