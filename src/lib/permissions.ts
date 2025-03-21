import { supabase } from './supabase';

export type PermissionLevel = 'owner' | 'full_access' | 'view_only';

export async function sendCollaborationInvite(email: string, permissionLevel: 'full_access' | 'view_only') {
  try {
    const { data, error } = await supabase
      .rpc('send_collaboration_invite', {
        p_email: email,
        p_permission_level: permissionLevel
      });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error sending collaboration invite:', error);
    throw error;
  }
}

export async function acceptCollaborationInvite(token: string) {
  try {
    const { error } = await supabase
      .rpc('accept_collaboration_invite', {
        p_token: token
      });

    if (error) throw error;
  } catch (error) {
    console.error('Error accepting collaboration invite:', error);
    throw error;
  }
}

export async function getUserPermissions(accountOwnerId: string): Promise<PermissionLevel | null> {
  try {
    const { data, error } = await supabase
      .rpc('get_user_permissions', {
        p_account_owner_id: accountOwnerId
      });

    if (error) throw error;
    return data[0]?.permission_level || null;
  } catch (error) {
    console.error('Error getting user permissions:', error);
    throw error;
  }
}

export async function revokeCollaboratorAccess(collaboratorId: string) {
  try {
    const { error } = await supabase
      .rpc('revoke_collaborator_access', {
        p_collaborator_id: collaboratorId
      });

    if (error) throw error;
  } catch (error) {
    console.error('Error revoking collaborator access:', error);
    throw error;
  }
}

export async function updateCollaboratorPermission(
  collaboratorId: string,
  permissionLevel: 'full_access' | 'view_only'
) {
  try {
    const { error } = await supabase
      .rpc('update_collaborator_permission', {
        p_collaborator_id: collaboratorId,
        p_permission_level: permissionLevel
      });

    if (error) throw error;
  } catch (error) {
    console.error('Error updating collaborator permission:', error);
    throw error;
  }
}

export async function getCollaborators() {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('No authenticated user');

    const { data, error } = await supabase
      .from('account_permissions')
      .select(`
        collaborator_id,
        permission_level,
        users:collaborator_id (
          email
        )
      `)
      .eq('account_owner_id', user.id);

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error getting collaborators:', error);
    throw error;
  }
}