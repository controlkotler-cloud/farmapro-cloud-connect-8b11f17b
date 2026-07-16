
import { Card, CardContent } from '@/components/ui/card';

export const LoadingSkeleton = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {[...Array(6)].map((_, i) => (
        <Card key={i} className="animate-pulse">
          <div className="h-48 rounded-t-lg bg-muted"></div>
          <CardContent className="p-4">
            <div className="mb-2 h-4 rounded bg-muted"></div>
            <div className="h-3 rounded bg-muted"></div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
