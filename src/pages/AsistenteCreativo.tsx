import { CreativeHeader } from '@/components/creative/CreativeHeader';
import { CreativeWorkspace } from '@/components/creative/CreativeWorkspace';

export default function AsistenteCreativo() {
  return (
    <div className="min-h-full bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50">
      <CreativeHeader />
      <CreativeWorkspace />
    </div>
  );
}
