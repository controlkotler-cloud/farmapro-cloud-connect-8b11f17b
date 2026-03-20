
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Users, Mail, UserCheck, UserX, Plus, Crown } from 'lucide-react';
import { useTeamManagement } from '@/hooks/useTeamManagement';
import { toast } from 'sonner';

export const TeamManagementTab = () => {
  const { 
    teamSubscription, 
    teamMembers, 
    loading, 
    isTeamOwner, 
    inviteMember, 
    removeMember,
    getTeamStats 
  } = useTeamManagement();
  
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [inviting, setInviting] = useState(false);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-32 bg-gray-200 rounded"></div>
          <div className="h-48 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (!isTeamOwner || !teamSubscription) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Gestión de Equipo
          </CardTitle>
          <CardDescription>
            No tienes un plan de equipo activo
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600 mb-4">
            Para gestionar un equipo, necesitas suscribirte al Plan Team desde la sección de suscripciones.
          </p>
          <Button variant="outline">
            Ver Planes de Suscripción
          </Button>
        </CardContent>
      </Card>
    );
  }

  const stats = getTeamStats();

  const handleInviteMember = async () => {
    if (!newMemberEmail.trim() || !newMemberEmail.includes('@')) {
      toast.error('Por favor ingresa un email válido');
      return;
    }

    if (stats.availableSlots <= 0) {
      toast.error('No tienes slots disponibles en tu equipo');
      return;
    }

    setInviting(true);
    try {
      await inviteMember(newMemberEmail.trim(), teamSubscription.id);
      setNewMemberEmail('');
    } catch (error) {
      // Error handled in hook
    } finally {
      setInviting(false);
    }
  };

  const handleRemoveMember = async (email: string) => {
    if (confirm('¿Estás seguro de que quieres remover este miembro del equipo?')) {
      await removeMember(email, teamSubscription.id);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="default">Activo</Badge>;
      case 'pending':
        return <Badge variant="secondary">Pendiente</Badge>;
      case 'inactive':
        return <Badge variant="destructive">Inactivo</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Información del equipo */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Crown className="h-5 w-5 text-amber-600" />
            {teamSubscription.team_name}
          </CardTitle>
          <CardDescription>
            Plan Team activo desde {new Date(teamSubscription.created_at).toLocaleDateString('es-ES')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{stats.activeMembers}</div>
              <div className="text-sm text-gray-600">Miembros Activos</div>
            </div>
            <div className="text-center p-4 bg-yellow-50 rounded-lg">
              <div className="text-2xl font-bold text-yellow-600">{stats.pendingMembers}</div>
              <div className="text-sm text-gray-600">Invitaciones Pendientes</div>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{stats.availableSlots}</div>
              <div className="text-sm text-gray-600">Slots Disponibles</div>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-gray-600">{stats.totalSlots}</div>
              <div className="text-sm text-gray-600">Total Slots</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Invitar nuevo miembro */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Invitar Nuevo Miembro
          </CardTitle>
          <CardDescription>
            Los miembros tendrán acceso al plan Profesional
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3">
            <Input
              placeholder="email@ejemplo.com"
              value={newMemberEmail}
              onChange={(e) => setNewMemberEmail(e.target.value)}
              disabled={inviting || stats.availableSlots <= 0}
            />
            <Button 
              onClick={handleInviteMember}
              disabled={inviting || stats.availableSlots <= 0}
            >
              {inviting ? 'Enviando...' : 'Invitar'}
            </Button>
          </div>
          {stats.availableSlots <= 0 && (
            <p className="text-sm text-red-600 mt-2">
              No tienes slots disponibles. Contacta con soporte para ampliar tu equipo.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Lista de miembros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Miembros del Equipo
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {teamMembers.length === 0 ? (
              <p className="text-center text-gray-500 py-8">
                No hay miembros en el equipo todavía. ¡Invita a tus colegas!
              </p>
            ) : (
              teamMembers.map((member) => (
                <div key={member.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                      {member.status === 'active' ? (
                        <UserCheck className="h-5 w-5 text-green-600" />
                      ) : (
                        <Mail className="h-5 w-5 text-gray-600" />
                      )}
                    </div>
                    <div>
                      <div className="font-medium">{member.email}</div>
                      <div className="text-sm text-gray-500">
                        {member.status === 'active' && member.joined_at
                          ? `Se unió ${new Date(member.joined_at).toLocaleDateString('es-ES')}`
                          : `Invitado ${new Date(member.invited_at).toLocaleDateString('es-ES')}`
                        }
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {getStatusBadge(member.status)}
                    {member.status !== 'inactive' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRemoveMember(member.email)}
                      >
                        <UserX className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
