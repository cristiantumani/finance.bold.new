import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useDemo } from '../contexts/DemoContext';
import { Info, X } from 'lucide-react';
import Navigation from './Navigation';
import AccountSettings from './AccountSettings';

type LayoutProps = {
  children: React.ReactNode;
};

export default function Layout({ children }: LayoutProps) {
  const { signOut } = useAuth();
  const { isDemoMode, exitDemoMode } = useDemo();
  const navigate = useNavigate();
  const [showAccountSettings, setShowAccountSettings] = useState(false);

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const handleExitDemo = () => {
    exitDemoMode();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-dark-950">
      <Navigation
        onSignOut={handleSignOut}
        onSettingsClick={() => setShowAccountSettings(true)}
      />

      {/* Demo Mode Banner */}
      {isDemoMode && (
        <div className="lg:pl-64 bg-indigo-500/10 border-b border-indigo-500/30 px-4 py-3 sticky top-0 z-40">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-indigo-300">
              <Info size={16} className="flex-shrink-0" />
              <span>
                You're viewing demo data. All forms are read-only.
                {' '}
                <a href="/signup" className="underline hover:text-indigo-200">
                  Sign up
                </a>
                {' '}to manage your own finances.
              </span>
            </div>
            <button
              onClick={handleExitDemo}
              className="flex items-center gap-1 text-sm text-indigo-400 hover:text-indigo-300 transition-colors"
              aria-label="Exit demo mode"
            >
              <span className="hidden sm:inline">Exit Demo</span>
              <X size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="lg:pl-64">
        {children}
      </main>

      {/* Account Settings Modal */}
      {showAccountSettings && (
        <AccountSettings onClose={() => setShowAccountSettings(false)} />
      )}
    </div>
  );
}
