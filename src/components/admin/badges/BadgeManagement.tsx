
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Plus, Pencil, Trash2 } from 'lucide-react';

interface BadgeData {
  id: string;
  name: string;
  description: string | null;
  icon: string;
  category: string;
  requirement_type: string;
  requirement_value: number;
  is_active: boolean;
  created_at: string;
}

const CATEGORIES = ['formacion', 'comunidad', 'constancia', 'especial'];
const REQUIREMENT_TYPES = ['courses_completed', 'quizzes_passed', 'forum_posts', 'forum_replies', 'resources_downloaded', 'streak_days', 'points_total', 'level_reached', 'manual'];

const REQUIREMENT_LABELS: Record<string, string> = {
  courses_completed: 'Cursos completados',
  quizzes_passed: 'Quizzes aprobados (100%)',
  forum_posts: 'Hilos en foro',
  forum_replies: 'Respuestas en foro',
  resources_downloaded: 'Recursos descargados',
  streak_days: 'Días de racha',
  points_total: 'Puntos totales',
  level_reached: 'Nivel alcanzado',
  manual: 'Asignación manual',
};

export const BadgeManagement = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<BadgeData | null>(null);

  const [form, setForm] = useState({
    name: '',
    description: '',
    icon: '🏆',
    category: 'especial',
    requirement_type: 'manual',
    requirement_value: 1,
    is_active: true,
  });

  const { data: badges = [], isLoading } = useQuery({
    queryKey: ['admin-badges'],
    queryFn: async () => {
      const { data, error } = await supabase.from('badges').select('*').order('category').order('requirement_value');
      if (error) throw error;
      return data as BadgeData[];
    },
  });

  // Get user counts per badge
  const { data: userBadgeCounts = {} } = useQuery({
    queryKey: ['admin-badge-counts'],
    queryFn: async () => {
      const { data } = await supabase.from('user_badges').select('badge_id');
      const counts: Record<string, number> = {};
      (data || []).forEach(ub => { counts[ub.badge_id] = (counts[ub.badge_id] || 0) + 1; });
      return counts;
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (data: typeof form & { id?: string }) => {
      if (data.id) {
        const { id, ...rest } = data;
        const { error } = await supabase.from('badges').update(rest).eq('id', id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('badges').insert(data);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-badges'] });
      toast({ title: 'Éxito', description: editing ? 'Insignia actualizada' : 'Insignia creada' });
      setDialogOpen(false);
      setEditing(null);
    },
    onError: () => {
      toast({ title: 'Error', description: 'No se pudo guardar la insignia', variant: 'destructive' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('badges').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-badges'] });
      toast({ title: 'Éxito', description: 'Insignia eliminada' });
    },
  });

  const openCreate = () => {
    setEditing(null);
    setForm({ name: '', description: '', icon: '🏆', category: 'especial', requirement_type: 'manual', requirement_value: 1, is_active: true });
    setDialogOpen(true);
  };

  const openEdit = (badge: BadgeData) => {
    setEditing(badge);
    setForm({
      name: badge.name,
      description: badge.description || '',
      icon: badge.icon,
      category: badge.category,
      requirement_type: badge.requirement_type,
      requirement_value: badge.requirement_value,
      is_active: badge.is_active,
    });
    setDialogOpen(true);
  };

  const handleSave = () => {
    saveMutation.mutate(editing ? { ...form, id: editing.id } : form);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Gestión de Insignias</h2>
        <Button onClick={openCreate}><Plus className="h-4 w-4 mr-2" />Nueva Insignia</Button>
      </div>

      {isLoading ? (
        <div className="space-y-3">{[...Array(4)].map((_, i) => <div key={i} className="animate-pulse bg-muted h-16 rounded-lg" />)}</div>
      ) : (
        <div className="grid gap-3">
          {badges.map(badge => (
            <Card key={badge.id}>
              <CardContent className="p-4 flex items-center gap-4">
                <span className="text-3xl">{badge.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold">{badge.name}</p>
                    <Badge variant="outline" className="text-xs">{badge.category}</Badge>
                    {!badge.is_active && <Badge variant="secondary" className="text-xs">Inactivo</Badge>}
                  </div>
                  <p className="text-sm text-muted-foreground">{badge.description}</p>
                  <p className="text-xs text-muted-foreground">
                    {REQUIREMENT_LABELS[badge.requirement_type]}: {badge.requirement_value} · {userBadgeCounts[badge.id] || 0} usuarios
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button variant="ghost" size="icon" onClick={() => openEdit(badge)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => deleteMutation.mutate(badge.id)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? 'Editar Insignia' : 'Nueva Insignia'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-[60px_1fr] gap-3">
              <div>
                <Label>Icono</Label>
                <Input value={form.icon} onChange={e => setForm(f => ({ ...f, icon: e.target.value }))} className="text-center text-2xl" />
              </div>
              <div>
                <Label>Nombre</Label>
                <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
              </div>
            </div>
            <div>
              <Label>Descripción</Label>
              <Input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Categoría</Label>
                <Select value={form.category} onValueChange={v => setForm(f => ({ ...f, category: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Tipo de Requisito</Label>
                <Select value={form.requirement_type} onValueChange={v => setForm(f => ({ ...f, requirement_type: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {REQUIREMENT_TYPES.map(t => <SelectItem key={t} value={t}>{REQUIREMENT_LABELS[t]}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 items-end">
              <div>
                <Label>Valor Requerido</Label>
                <Input type="number" min={1} value={form.requirement_value} onChange={e => setForm(f => ({ ...f, requirement_value: parseInt(e.target.value) || 1 }))} />
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={form.is_active} onCheckedChange={v => setForm(f => ({ ...f, is_active: v }))} />
                <Label>Activo</Label>
              </div>
            </div>
            <Button onClick={handleSave} disabled={saveMutation.isPending || !form.name} className="w-full">
              {saveMutation.isPending ? 'Guardando...' : 'Guardar'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
