
import { motion } from 'framer-motion';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';

interface ResourcesSearchProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
}

export const ResourcesSearch = ({ searchTerm, onSearchChange }: ResourcesSearchProps) => {
  return (
    <motion.div 
      className="flex flex-col lg:flex-row gap-4"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
        <Input
          placeholder="Buscar recursos..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10"
        />
      </div>
    </motion.div>
  );
};
