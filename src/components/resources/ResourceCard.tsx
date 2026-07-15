import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Download, Lock } from 'lucide-react';
import { getResourceStyle, getFormatIcon, getResourceTypeStyle } from '@/lib/resourceCategory';

interface Resource {
  id: string;
  title: string;
  description: string;
  category: string;
  type: string;
  file_url: string;
  format: string;
  is_premium: boolean;
  created_at: string;
}

interface ResourceCardProps {
  resource: Resource;
  index: number;
  onDownload: (resource: Resource) => void;
}

export const ResourceCard = ({ resource, index, onDownload }: ResourceCardProps) => {
  const style = getResourceStyle(resource.category);
  const typeStyle = getResourceTypeStyle(resource.type);
  const FormatIcon = getFormatIcon(resource.format);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index, 8) * 0.05 }}
      whileHover={{ scale: 1.02 }}
      className="h-full"
    >
      <Card className="h-full flex flex-col overflow-hidden hover:shadow-lg transition-all duration-300 border-0 shadow-md">
        {/* Banda de categoría: color + icono + etiqueta (para distinguir de un vistazo) */}
        <div className={`${style.bg} px-4 py-2.5 flex items-center justify-between`}>
          <div className={`flex items-center gap-2 ${style.text}`}>
            <style.Icon className="h-4 w-4" />
            <span className="text-xs font-semibold uppercase tracking-wide">{style.label}</span>
          </div>
          {resource.is_premium ? (
            <Badge className="bg-background/70 text-foreground border-0 text-[10px] gap-1">
              <Lock className="h-3 w-3" />
              Premium
            </Badge>
          ) : (
            <Badge className="bg-background/70 text-foreground border-0 text-[10px]">
              Gratis
            </Badge>
          )}
        </div>

        <CardHeader className="pb-2">
          {/* Badge principal: el TIPO de recurso (plantilla, checklist, calculadora…) */}
          <div className="mb-2">
            <Badge variant="secondary" className="gap-1.5 text-xs font-medium">
              <typeStyle.Icon className="h-3.5 w-3.5" />
              {typeStyle.label}
            </Badge>
          </div>
          <CardTitle className="text-lg line-clamp-2">{resource.title}</CardTitle>
          <CardDescription className="line-clamp-3">{resource.description}</CardDescription>
        </CardHeader>

        <CardContent className="flex-1 flex items-end justify-between gap-2">
          <Badge variant="outline" className="text-xs gap-1">
            <FormatIcon className="h-3.5 w-3.5" />
            {(resource.format || 'pdf').toUpperCase()}
          </Badge>
          <Button
            onClick={() => onDownload(resource)}
            className="bg-primary text-primary-foreground hover:bg-primary/90 transition-all duration-300"
          >
            <Download className="h-4 w-4 mr-2" />
            Descargar
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  );
};
