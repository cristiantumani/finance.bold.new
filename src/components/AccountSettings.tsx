import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Download, 
  Trash2, 
  AlertTriangle,
  Shield,
  Settings,
  X
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { exportUserData, deleteUserData } from '../lib/dataRetention';
import ConsentManager from './ConsentManager';

interface AccountSettingsProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AccountSettings({ isOpen, onClose }: AccountSettingsProps) {
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showConsentManager, setShowConsentManager] = useState(false);
  const [loading, setLoading] = useState(false);

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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-800">Account Settings</h2>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X size={20} />
          </button>
        </div>

        <div className="space-y-6">
          <div className="p-4 bg-gray-50 rounded-lg">
            <h3 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
              <Shield size={20} className="text-indigo-600" />
              Privacy & Data
            </h3>
            <div className="space-y-3">
              <button
                onClick={() => setShowConsentManager(true)}
                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
              >
                Manage Privacy Settings
              </button>
              <button
                onClick={handleExportData}
                disabled={loading}
                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md transition-colors flex items-center gap-2"
              >
                <Download size={16} />
                Export My Data
              </button>
            </div>
          </div>

          <div className="p-4 bg-red-50 rounded-lg">
            <h3 className="font-medium text-red-900 mb-2 flex items-center gap-2">
              <AlertTriangle size={20} className="text-red-600" />
              Danger Zone
            </h3>
            <p className="text-sm text-red-700 mb-3">
              Once you delete your account, there is no going back. Please be certain.
            </p>
            {!showDeleteConfirm ? (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="w-full px-4 py-2 text-sm text-red-600 hover:bg-red-100 rounded-md transition-colors flex items-center gap-2"
              >
                <Trash2 size={16} />
                Delete Account
              </button>
            ) : (
              <div className="space-y-2">
                <p className="text-sm font-medium text-red-800">
                  Are you absolutely sure?
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowDeleteConfirm(false)}
                    className="flex-1 px-4 py-2 text-sm text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
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