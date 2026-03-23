
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Plus, Zap, Calendar, Users, CheckCircle } from 'lucide-react';

interface Template {
  id: string;
  name: string;
  description: string | null;
  type: string;
  target_count: number;
  points_reward: number;
  is_active: boolean;
}

export const WeeklyTemplatesManagement = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [newTemplate, setNewTemplate] = useState({
    name: '', description: '', type: 'daily', target_count: 1, points_reward: 100,
  });

  const { data: templates = [], isLoading } = useQuery({
    queryKey: ['weekly-templates'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('weekly_challenge_templates')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as Template[];
    },
  });

  // Active weekly challenges
  const { data: activeChallenges = [] } = useQuery({
    queryKey: ['active-weekly-challenges'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('challenges')
        .select('id, name, week_start, week_end, target_count, points_reward')
        .eq('is_weekly', true)
        .eq('is_active', true)
        .order('week_start', { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  // Weekly stats
  const { data: weeklyStats = [] } = useQuery({
    queryKey: ['weekly-challenge-stats'],
    queryFn: async () => {
      const weeklyIds = activeChallenges.map(c => c.id);
      if (weeklyIds.length === 0) return [];
      const { data, error } = await supabase
        .from('user_challenge_progress')
        .select('challenge_id, completed_at')
        .in('challenge_id', weeklyIds);
      if (error) throw error;
      return data || [];
    },
    enabled: activeChallenges.length > 0,
  });

  const activateMutation = useMutation({
    mutationFn: async (template: Template) => {
      const now = new Date();
      const day = now.getDay();
      const monday = new Date(now);
      monday.setDate(now.getDate() - (day === 0 ? 6 : day - 1));
      const sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 6);

      const weekStart = monday.toISOString().split('T')[0];
      const weekEnd = sunday.toISOString().split('T')[0];

      const { error } = await supabase.from('challenges').insert({
        title: template.name,
        name: template.name,
        description: template.description,
        type: template.type as any,
        target_count: template.target_count,
        points_reward: template.points_reward,
        points: template.points_reward,
        is_active: true,
        is_weekly: true,
        week_start: weekStart,
        week_end: weekEnd,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['active-weekly-challenges'] });
      toast({ title: 'Éxito', description: 'Reto semanal activado' });
    },
    onError: () => {
      toast({ title: 'Error', description: 'No se pudo activar el reto', variant: 'destructive' });
    },
  });

  const createTemplateMutation = useMutation({
    mutationFn: async (data: typeof newTemplate) => {
      const { error } = await supabase.from('weekly_challenge_templates').insert(data as any);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['weekly-templates'] });
      setShowCreate(false);
      setNewTemplate({ name: '', description: '', type: 'daily', target_count: 1, points_reward: 100 });
      toast({ title: 'Éxito', description: 'Plantilla creada' });
    },
  });

  const getStatsForChallenge = (challengeId: string) => {
    const items = weeklyStats.filter(s => s.challenge_id === challengeId);
    const participants = items.length;
    const completed = items.filter(s => s.completed_at).length;
    const rate = participants > 0 ? Math.round((completed / participants) * 100) : 0;
    return { participants, completed, rate };
  };

  return (
    <div className="space-y-6">
      {/* Active weekly challenges */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Retos Semanales Activos
          </CardTitle>
        </CardHeader>
        <CardContent>
          {activeChallenges.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">No hay retos semanales activos</p>
          ) : (
            <div className="space-y-3">
              {activeChallenges.map(c => {
                const stats = getStatsForChallenge(c.id);
                return (
                  <div key={c.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">{c.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {c.week_start} → {c.week_end}
                      </p>
                    </div>
                    <div className="flex items-center gap-4 text-sm">
                      <div className="flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        <span>{stats.participants}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span>{stats.completed}</span>
                      </div>
                      <Badge variant="outline">{stats.rate}%</Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Templates */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Plantillas de Retos Semanales</CardTitle>
          <Dialog open={showCreate} onOpenChange={setShowCreate}>
            <DialogTrigger asChild>
              <Button size="sm"><Plus className="h-4 w-4 mr-1" /> Nueva plantilla</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Nueva Plantilla</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Nombre</Label>
                  <Input value={newTemplate.name} onChange={e => setNewTemplate({ ...newTemplate, name: e.target.value })} />
                </div>
                <div>
                  <Label>Descripción</Label>
                  <Textarea value={newTemplate.description} onChange={e => setNewTemplate({ ...newTemplate, description: e.target.value })} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Tipo</Label>
                    <Select value={newTemplate.type} onValueChange={v => setNewTemplate({ ...newTemplate, type: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="daily">Diario</SelectItem>
                        <SelectItem value="course_completed">Curso</SelectItem>
                        <SelectItem value="forum_post">Foro</SelectItem>
                        <SelectItem value="forum_reply">Respuesta</SelectItem>
                        <SelectItem value="resource_downloaded">Recurso</SelectItem>
                        <SelectItem value="quiz_completed">Quiz</SelectItem>
                        <SelectItem value="community_engagement">Comunidad</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Objetivo</Label>
                    <Input type="number" value={newTemplate.target_count} onChange={e => setNewTemplate({ ...newTemplate, target_count: parseInt(e.target.value) || 1 })} />
                  </div>
                </div>
                <div>
                  <Label>Puntos</Label>
                  <Input type="number" value={newTemplate.points_reward} onChange={e => setNewTemplate({ ...newTemplate, points_reward: parseInt(e.target.value) || 100 })} />
                </div>
                <Button onClick={() => createTemplateMutation.mutate(newTemplate)} disabled={!newTemplate.name || createTemplateMutation.isPending}>
                  Crear plantilla
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-center py-4 text-muted-foreground">Cargando...</p>
          ) : (
            <div className="space-y-3">
              {templates.map(t => (
                <div key={t.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">{t.name}</p>
                    <p className="text-xs text-muted-foreground">{t.description}</p>
                    <div className="flex gap-2 mt-1">
                      <Badge variant="outline">{t.type}</Badge>
                      <Badge variant="outline">Meta: {t.target_count}</Badge>
                      <Badge variant="outline">{t.points_reward} pts</Badge>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => activateMutation.mutate(t)}
                    disabled={activateMutation.isPending}
                  >
                    <Zap className="h-4 w-4 mr-1" />
                    Activar esta semana
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
