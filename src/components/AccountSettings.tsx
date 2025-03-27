import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Download, 
  Trash2, 
  AlertTriangle,
  Shield,
  Settings,
  X,
  Users,
  UserPlus,
  UserMinus,
  Edit2,
  Clock,
  CheckCircle
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { exportUserData, deleteUserData } from '../lib/dataRetention';
import ConsentManager from './ConsentManager';
import { 
  sendCollaborationInvite, 
  getCollaborators,
  revokeCollaboratorAccess,
  updateCollaboratorPermission
} from '../lib/permissions';
import { supabase } from '../lib/supabase';

interface AccountSettingsProps {
  isOpen: boolean;
  onClose: () => void;
}

type Collaborator = {
  collaborator_id: string;
  permission_level: 'full_access' | 'view_only';
  users: {
    email: string;
  };
};

type PendingInvite = {
  id: string;
  email: string;
  permission_level: 'full_access' | 'view_only';
  created_at: string;
};

export default function AccountSettings({ isOpen, onClose }: AccountSettingsProps) {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showConsentManager, setShowConsentManager] = useState(false);
  const [showCollaboratorForm, setShowCollaboratorForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [pendingInvites, setPendingInvites] = useState<PendingInvite[]>([]);
  const [inviteEmail, setInviteEmail] = useState('');
  const [invitePermission, setInvitePermission] = useState<'full_access' | 'view_only'>('view_only');
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      loadCollaborators();
      loadPendingInvites();
    }
  }, [isOpen]);

  const loadCollaborators = async () => {
    try {
      const data = await getCollaborators();
      setCollaborators(data);
    } catch (error) {
      console.error('Error loading collaborators:', error);
    }
  };

  const loadPendingInvites = async () => {
    try {
      const { data, error } = await supabase
        .from('collaboration_invites')
        .select('*')
        .is('accepted_at', null)
        .gt('expires_at', new Date().toISOString());

      if (error) throw error;
      setPendingInvites(data);
    } catch (error) {
      console.error('Error loading pending invites:', error);
    }
  };

  const handleExportData = async () => {
    setLoading(true);
    try {
      await exportUserData();
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!window.confirm('Are you absolutely sure you want to delete your account? This action cannot be undone.')) {
      return;
    }

    setLoading(true);
    try {
      const success = await deleteUserData();
      if (success) {
        await signOut();
        navigate('/');
      }
    } finally {
      setLoading(false);
      setShowDeleteConfirm(false);
    }
  };

  const handleInviteCollaborator = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await sendCollaborationInvite(inviteEmail, invitePermission);
      setShowCollaboratorForm(false);
      setInviteEmail('');
      setInvitePermission('view_only');
      await loadPendingInvites();
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRevokeAccess = async (collaboratorId: string) => {
    if (!window.confirm('Are you sure you want to revoke this collaborator\'s access?')) {
      return;
    }

    try {
      await revokeCollaboratorAccess(collaboratorId);
      await loadCollaborators();
    } catch (error: any) {
      setError(error.message);
    }
  };

  const handleCancelInvite = async (inviteId: string) => {
    if (!window.confirm('Are you sure you want to cancel this invitation?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('collaboration_invites')
        .delete()
        .eq('id', inviteId);

      if (error) throw error;
      await loadPendingInvites();
    } catch (error: any) {
      setError(error.message);
    }
  };

  const handleUpdatePermission = async (collaboratorId: string, newPermission: 'full_access' | 'view_only') => {
    try {
      await updateCollaboratorPermission(collaboratorId, newPermission);
      await loadCollaborators();
    } catch (error: any) {
      setError(error.message);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-dark-800 rounded-lg shadow-xl max-w-2xl w-full p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-dark-50">Account Settings</h2>
          <button 
            onClick={onClose}
            className="text-dark-400 hover:text-dark-200"
          >
            <X size={20} />
          </button>
        </div>

        <div className="space-y-6">
          {error && (
            <div className="bg-red-900/50 border border-red-700 text-red-200 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          <div className="p-4 bg-dark-900/50 rounded-lg">
            <h3 className="font-medium text-dark-50 mb-2 flex items-center gap-2">
              <Users size={20} className="text-indigo-400" />
              Collaborators
            </h3>
            <div className="space-y-3">
              {/* Active Collaborators */}
              {collaborators.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-dark-200 flex items-center gap-2">
                    <CheckCircle size={16} className="text-green-400" />
                    Active Collaborators
                  </h4>
                  {collaborators.map((collaborator) => (
                    <div 
                      key={collaborator.collaborator_id}
                      className="flex items-center justify-between p-3 bg-dark-800/50 rounded-lg border border-dark-700"
                    >
                      <div>
                        <p className="font-medium text-dark-100">{collaborator.users.email}</p>
                        <p className="text-sm text-dark-400 capitalize">
                          {collaborator.permission_level.replace('_', ' ')}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <select
                          value={collaborator.permission_level}
                          onChange={(e) => handleUpdatePermission(
                            collaborator.collaborator_id,
                            e.target.value as 'full_access' | 'view_only'
                          )}
                          className="text-sm bg-dark-900 border border-dark-700 rounded-md text-dark-100"
                        >
                          <option value="view_only">View Only</option>
                          <option value="full_access">Full Access</option>
                        </select>
                        <button
                          onClick={() => handleRevokeAccess(collaborator.collaborator_id)}
                          className="text-red-400 hover:text-red-300"
                        >
                          <UserMinus size={18} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Pending Invites */}
              {pendingInvites.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-dark-200 flex items-center gap-2">
                    <Clock size={16} className="text-yellow-400" />
                    Pending Invitations
                  </h4>
                  {pendingInvites.map((invite) => (
                    <div 
                      key={invite.id}
                      className="flex items-center justify-between p-3 bg-yellow-900/20 rounded-lg border border-yellow-900/30"
                    >
                      <div>
                        <p className="font-medium text-dark-100">{invite.email}</p>
                        <p className="text-sm text-dark-400 capitalize">
                          {invite.permission_level.replace('_', ' ')} (Invited)
                        </p>
                      </div>
                      <button
                        onClick={() => handleCancelInvite(invite.id)}
                        className="text-red-400 hover:text-red-300"
                      >
                        <X size={18} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {!showCollaboratorForm ? (
                <button
                  onClick={() => setShowCollaboratorForm(true)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 text-indigo-400 hover:bg-dark-700 rounded-md transition-colors"
                >
                  <UserPlus size={18} />
                  Invite Collaborator
                </button>
              ) : (
                <form onSubmit={handleInviteCollaborator} className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-dark-200 mb-1">
                      Email Address
                    </label>
                    <input
                      type="email"
                      required
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      className="w-full px-3 py-2 bg-dark-900 border border-dark-700 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500 text-dark-100 placeholder-dark-400"
                      placeholder="Enter email address"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-dark-200 mb-1">
                      Permission Level
                    </label>
                    <select
                      value={invitePermission}
                      onChange={(e) => setInvitePermission(e.target.value as 'full_access' | 'view_only')}
                      className="w-full px-3 py-2 bg-dark-900 border border-dark-700 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500 text-dark-100"
                    >
                      <option value="view_only">View Only</option>
                      <option value="full_access">Full Access</option>
                    </select>
                  </div>
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setShowCollaboratorForm(false)}
                      className="px-3 py-1 text-dark-300 hover:text-dark-100"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="px-3 py-1 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
                    >
                      {loading ? 'Sending...' : 'Send Invite'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>

          <div className="p-4 bg-dark-900/50 rounded-lg">
            <h3 className="font-medium text-dark-50 mb-2 flex items-center gap-2">
              <Shield size={20} className="text-indigo-400" />
              Privacy & Data
            </h3>
            <div className="space-y-3">
              <button
                onClick={() => setShowConsentManager(true)}
                className="w-full text-left px-4 py-2 text-sm text-dark-200 hover:bg-dark-700 rounded-md transition-colors"
              >
                Manage Privacy Settings
              </button>
              <button
                onClick={handleExportData}
                disabled={loading}
                className="w-full text-left px-4 py-2 text-sm text-dark-200 hover:bg-dark-700 rounded-md transition-colors flex items-center gap-2"
              >
                <Download size={16} />
                Export My Data
              </button>
            </div>
          </div>

          <div className="p-4 bg-red-900/20 rounded-lg">
            <h3 className="font-medium text-red-200 mb-2 flex items-center gap-2">
              <AlertTriangle size={20} className="text-red-400" />
              Danger Zone
            </h3>
            <p className="text-sm text-red-300 mb-3">
              Once you delete your account, there is no going back. Please be certain.
            </p>
            {!showDeleteConfirm ? (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="w-full px-4 py-2 text-sm text-red-400 hover:bg-red-900/30 rounded-md transition-colors flex items-center gap-2"
              >
                <Trash2 size={16} />
                Delete Account
              </button>
            ) : (
              <div className="space-y-2">
                <p className="text-sm font-medium text-red-200">
                  Are you absolutely sure?
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowDeleteConfirm(false)}
                    className="flex-1 px-4 py-2 text-sm text-dark-200 bg-dark-700 hover:bg-dark-600 rounded-md transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDeleteAccount}
                    disabled={loading}
                    className="flex-1 px-4 py-2 text-sm text-white bg-red-600 hover:bg-red-700 rounded-md transition-colors disabled:opacity-50"
                  >
                    {loading ? 'Deleting...' : 'Yes, Delete Account'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {showConsentManager && (
          <ConsentManager onClose={() => setShowConsentManager(false)} />
        )}
      </div>
    </div>
  );
}