
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface TeamSubscription {
  id: string;
  team_name: string;
  max_members: number;
  status: string;
  created_at: string;
}

interface TeamMember {
  id: string;
  email: string;
  status: 'pending' | 'active' | 'inactive';
  invited_at: string;
  joined_at?: string;
  user_id?: string;
}

export const useTeamManagement = () => {
  const { user, profile } = useAuth();
  const [teamSubscription, setTeamSubscription] = useState<TeamSubscription | null>(null);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [isTeamOwner, setIsTeamOwner] = useState(false);
  const [isTeamMember, setIsTeamMember] = useState(false);

  useEffect(() => {
    if (user) {
      loadTeamData();
    }
  }, [user]);

  // Force reload when component mounts
  useEffect(() => {
    if (user) {
      const timer = setTimeout(() => {
        loadTeamData();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  const loadTeamData = async () => {
    if (!user) return;

    setLoading(true);
    try {
      // Check if user owns a team using RPC function
      const { data: ownerCheck, error: ownerError } = await supabase.rpc('is_team_owner', { 
        user_id_param: user.id 
      });

      if (ownerError) {
        console.error('Error checking team ownership:', ownerError);
        setIsTeamOwner(false);
      } else {
        setIsTeamOwner(!!ownerCheck);
        
        if (ownerCheck) {
          // Load team subscription details (most recent one)
          const { data: ownedTeams, error: teamError } = await supabase
            .from('team_subscriptions')
            .select('*')
            .eq('owner_id', user.id)
            .eq('status', 'active')
            .order('created_at', { ascending: false });

          const ownedTeam = ownedTeams?.[0]; // Take the most recent team

          if (teamError && teamError.code !== 'PGRST116') {
            console.error('Error loading team:', teamError);
          } else if (ownedTeam) {
            setTeamSubscription(ownedTeam);
            
            // Load team members
            const { data: members, error: membersError } = await supabase
              .from('team_members')
              .select('*')
              .eq('team_id', ownedTeam.id)
              .order('invited_at', { ascending: true });

            if (membersError) {
              console.error('Error loading team members:', membersError);
            } else {
              const typedMembers = members?.map(member => ({
                ...member,
                status: member.status as 'pending' | 'active' | 'inactive'
              })) || [];
              setTeamMembers(typedMembers);
            }
          }
        }
      }

      // Check if user is a team member using RPC function
      const { data: memberCheck, error: memberError } = await supabase.rpc('is_team_member', { 
        user_id_param: user.id 
      });

      if (memberError) {
        console.error('Error checking team membership:', memberError);
        setIsTeamMember(false);
      } else {
        setIsTeamMember(!!memberCheck);
      }

    } catch (error) {
      console.error('Error in loadTeamData:', error);
    } finally {
      setLoading(false);
    }
  };

  const inviteMember = async (email: string, teamId: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('manage-team', {
        body: {
          action: 'invite_member',
          email,
          teamId
        }
      });

      if (error) throw error;

      toast.success('Invitación enviada exitosamente');
      loadTeamData(); // Reload team data
      return data.invitationToken;
    } catch (error) {
      console.error('Error inviting member:', error);
      toast.error('No se pudo enviar la invitación');
      throw error;
    }
  };

  const removeMember = async (email: string, teamId: string) => {
    try {
      const { error } = await supabase.functions.invoke('manage-team', {
        body: {
          action: 'remove_member',
          email,
          teamId
        }
      });

      if (error) throw error;

      toast.success('Miembro removido del equipo');
      loadTeamData(); // Reload team data
    } catch (error) {
      console.error('Error removing member:', error);
      toast.error('No se pudo remover el miembro');
    }
  };

  const acceptInvitation = async (invitationToken: string) => {
    try {
      const { error } = await supabase.functions.invoke('manage-team', {
        body: {
          action: 'accept_invitation',
          invitationToken
        }
      });

      if (error) throw error;

      toast.success('¡Te has unido al equipo exitosamente!');
      // Reload user profile to reflect new role
      window.location.reload();
    } catch (error) {
      console.error('Error accepting invitation:', error);
      toast.error('No se pudo aceptar la invitación');
    }
  };

  const getTeamStats = () => {
    const activeMembers = teamMembers.filter(m => m.status === 'active').length;
    const pendingMembers = teamMembers.filter(m => m.status === 'pending').length;
    const totalSlots = teamSubscription?.max_members || 0;

    return {
      activeMembers,
      pendingMembers,
      totalMembers: activeMembers + pendingMembers,
      availableSlots: totalSlots - (activeMembers + pendingMembers),
      totalSlots
    };
  };

  return {
    teamSubscription,
    teamMembers,
    loading,
    isTeamOwner,
    isTeamMember,
    inviteMember,
    removeMember,
    acceptInvitation,
    loadTeamData,
    getTeamStats
  };
};
