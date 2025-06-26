
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Download } from 'lucide-react';

interface Resource {
  id: string;
  title: string;
  description: string;
  category: string;
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
  return (
    <motion.div
      key={resource.id}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      whileHover={{ scale: 1.02 }}
      className="h-full"
    >
      <Card className="h-full flex flex-col hover:shadow-lg transition-all duration-300 border-0 shadow-md">
        <CardHeader className="relative">
          <div className="flex items-start justify-between">
            <CardTitle className="text-lg line-clamp-2 flex-1">{resource.title}</CardTitle>
            {resource.is_premium && (
              <Badge className="bg-gradient-to-r from-yellow-400 to-orange-500 text-xs ml-2">
                Premium
              </Badge>
            )}
          </div>
          <CardDescription className="line-clamp-3">{resource.description}</CardDescription>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col justify-end">
          <div className="flex items-center justify-between">
            <Badge variant="outline" className="text-xs">
              {resource.format.toUpperCase()}
            </Badge>
            <Button
              onClick={() => onDownload(resource)}
              className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 transition-all duration-300"
            >
              <Download className="h-4 w-4 mr-2" />
              Descargar
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};
