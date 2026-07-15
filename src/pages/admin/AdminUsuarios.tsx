
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Search, User, Mail, Calendar, Plus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { logSecurityEvent } from '@/lib/securityLogger';
import type { Database } from '@/integrations/supabase/types';

type UserRole = Database['public']['Enums']['user_role'];

interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  pharmacy_name: string;
  position: string;
  subscription_role: UserRole;
  subscription_status: string;
  trial_ends_at: string;
  created_at: string;
}

const AdminUsuarios = () => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState<string>('all');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [createFormData, setCreateFormData] = useState({
    email: '',
    password: '',
    fullName: ''
  });
  const [creatingUser, setCreatingUser] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading users:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los usuarios",
        variant: "destructive",
      });
    } else {
      setUsers(data || []);
    }
    setLoading(false);
  };

  const updateUserRole = async (userId: string, newRole: UserRole) => {
    console.log('Attempting to update user role:', { userId, newRole });
    
    // Client-side audit logging
    await logSecurityEvent({
      event_type: 'admin_action',
      details: {
        description: 'Admin attempting to change user role',
        metadata: {
          targetUserId: userId,
          newRole: newRole,
          timestamp: new Date().toISOString()
        },
        severity: 'medium'
      }
    });
    
    // Determine subscription status based on role
    const subscriptionStatus: Database['public']['Enums']['subscription_status'] =
      ['premium', 'profesional', 'estudiante', 'admin'].includes(newRole)
        ? 'active'
        : 'trialing';

    try {
      // Use the secure RPC function
      const { data, error } = await supabase.rpc('update_user_role_admin', {
        target_user_id: userId,
        new_role: newRole,
        new_status: subscriptionStatus
      });

      if (error) {
        console.error('Error updating user role:', error);
        
        // Log failed attempt
        await logSecurityEvent({
          event_type: 'admin_action',
          details: {
            description: 'Failed admin user role update',
            metadata: {
              targetUserId: userId,
              newRole: newRole,
              error: error.message,
              timestamp: new Date().toISOString()
            },
            severity: 'high'
          }
        });
        
        toast({
          title: "Error",
          description: `No se pudo actualizar el rol del usuario: ${error.message}`,
          variant: "destructive",
        });
        return;
      }

      if (data && typeof data === 'object' && 'success' in data && data.success) {
        console.log('User role updated successfully:', data);
        
        // Log successful update
        await logSecurityEvent({
          event_type: 'admin_action',
          details: {
            description: 'Successful admin user role update',
            metadata: {
              targetUserId: userId,
              newRole: newRole,
              newStatus: subscriptionStatus,
              timestamp: new Date().toISOString()
            },
            severity: 'medium'
          }
        });

        toast({
          title: "Éxito",
          description: "Rol de usuario actualizado correctamente",
        });
        
        // Refresh data from database to ensure consistency
        await loadUsers();
      }
    } catch (error: any) {
      console.error('Unexpected error updating user role:', error);
      
      // Log unexpected error
      await logSecurityEvent({
        event_type: 'admin_action',
        details: {
          description: 'Unexpected error during admin user role update',
          metadata: {
            targetUserId: userId,
            newRole: newRole,
            error: error.message,
            timestamp: new Date().toISOString()
          },
          severity: 'high'
        }
      });
      
      toast({
        title: "Error",
        description: "Error inesperado al actualizar el rol del usuario",
        variant: "destructive",
      });
    }
  };

  const createAdminUser = async () => {
    if (!createFormData.email || !createFormData.password || !createFormData.fullName) {
      toast({
        title: "Error",
        description: "Todos los campos son obligatorios",
        variant: "destructive",
      });
      return;
    }

    setCreatingUser(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('provision-admin-user', {
        body: {
          email: createFormData.email,
          password: createFormData.password,
          fullName: createFormData.fullName
        }
      });

      if (error) {
        console.error('Error creating admin user:', error);
        toast({
          title: "Error",
          description: `Error al crear usuario admin: ${error.message}`,
          variant: "destructive",
        });
        return;
      }

      if (data && data.success) {
        // Log successful creation
        await logSecurityEvent({
          event_type: 'admin_action',
          details: {
            description: 'New admin user created successfully',
            metadata: {
              adminEmail: createFormData.email,
              createdUserId: data.user_id,
              timestamp: new Date().toISOString()
            },
            severity: 'medium'
          }
        });

        toast({
          title: "Éxito",
          description: `Usuario admin ${createFormData.email} creado correctamente`,
        });

        // Reset form and close dialog
        setCreateFormData({ email: '', password: '', fullName: '' });
        setShowCreateDialog(false);
        
        // Refresh users list
        await loadUsers();
      }
    } catch (error: any) {
      console.error('Error calling provision-admin-user:', error);
      
      // Log failed attempt
      await logSecurityEvent({
        event_type: 'admin_action',
        details: {
          description: 'Failed admin user creation attempt',
          metadata: {
            adminEmail: createFormData.email,
            error: error.message,
            timestamp: new Date().toISOString()
          },
          severity: 'high'
        }
      });
      
      toast({
        title: "Error",
        description: "Error inesperado al crear usuario admin",
        variant: "destructive",
      });
    } finally {
      setCreatingUser(false);
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.pharmacy_name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRole = filterRole === 'all' || user.subscription_role === filterRole;
    
    return matchesSearch && matchesRole;
  });

  const getRoleBadgeColor = (role: UserRole) => {
    switch (role) {
      case 'admin': return 'bg-info/10 text-info';
      case 'premium': return 'bg-secondary text-secondary-foreground';
      case 'profesional': return 'bg-secondary text-secondary-foreground';
      case 'estudiante': return 'bg-secondary text-secondary-foreground';
      case 'freemium':
      default: return 'bg-secondary text-secondary-foreground';
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <div>
          <h1 className="text-3xl font-bold text-foreground">Gestión de Usuarios</h1>
          <p className="text-muted-foreground">Administra perfiles de usuario y suscripciones</p>
        </div>
      </div>

      {/* Filters and Actions */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Buscar por nombre, email o farmacia..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={filterRole} onValueChange={setFilterRole}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Filtrar por rol" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los roles</SelectItem>
            <SelectItem value="freemium">Freemium</SelectItem>
            <SelectItem value="estudiante">Estudiante</SelectItem>
            <SelectItem value="profesional">Profesional</SelectItem>
            <SelectItem value="premium">Premium</SelectItem>
            <SelectItem value="admin">Administrador</SelectItem>
          </SelectContent>
        </Select>
        
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2 whitespace-nowrap">
              <Plus className="h-4 w-4" />
              Crear Admin
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Crear Usuario Administrador</DialogTitle>
              <DialogDescription>
                Crea un nuevo usuario con permisos de administrador.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@farmapro.es"
                  value={createFormData.email}
                  onChange={(e) => setCreateFormData(prev => ({ ...prev, email: e.target.value }))}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="password">Contraseña</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Contraseña segura"
                  value={createFormData.password}
                  onChange={(e) => setCreateFormData(prev => ({ ...prev, password: e.target.value }))}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="fullName">Nombre Completo</Label>
                <Input
                  id="fullName"
                  placeholder="Nombre completo"
                  value={createFormData.fullName}
                  onChange={(e) => setCreateFormData(prev => ({ ...prev, fullName: e.target.value }))}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowCreateDialog(false)}
                disabled={creatingUser}
              >
                Cancelar
              </Button>
              <Button
                onClick={createAdminUser}
                disabled={creatingUser}
              >
                {creatingUser ? 'Creando...' : 'Crear Usuario'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Users Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-muted rounded mb-2"></div>
                <div className="h-3 bg-muted rounded mb-4"></div>
                <div className="h-8 bg-muted rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredUsers.map((user) => (
            <Card key={user.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="bg-muted p-2 rounded-full">
                      <User className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{user.full_name || 'Sin nombre'}</CardTitle>
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Mail className="h-3 w-3 mr-1" />
                        {user.email}
                      </div>
                    </div>
                  </div>
                  <Badge className={getRoleBadgeColor(user.subscription_role)}>
                    {user.subscription_role}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Farmacia</p>
                    <p className="text-sm text-muted-foreground">{user.pharmacy_name || 'No especificada'}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Posición</p>
                    <p className="text-sm text-muted-foreground">{user.position || 'No especificada'}</p>
                  </div>
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Calendar className="h-3 w-3 mr-1" />
                    Registrado: {new Date(user.created_at).toLocaleDateString()}
                  </div>
                  <div className="pt-2">
                    <Select
                      value={user.subscription_role}
                      onValueChange={(value: UserRole) => {
                        if (value === user.subscription_role) return;
                        const userLabel = user.full_name || user.email;
                        if (window.confirm(`¿Seguro que quieres cambiar el rol de ${userLabel} a ${value}?`)) {
                          updateUserRole(user.id, value);
                        }
                      }}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="freemium">Freemium</SelectItem>
                        <SelectItem value="estudiante">Estudiante</SelectItem>
                        <SelectItem value="profesional">Profesional</SelectItem>
                        <SelectItem value="premium">Premium</SelectItem>
                        <SelectItem value="admin">Administrador</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {filteredUsers.length === 0 && !loading && (
        <Card>
          <CardContent className="p-12 text-center">
            <User className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No se encontraron usuarios con los filtros aplicados</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AdminUsuarios;
