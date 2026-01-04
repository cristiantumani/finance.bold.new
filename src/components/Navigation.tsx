import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Receipt,
  FolderOpen,
  Wallet,
  BarChart3,
  Upload,
  Settings,
  LogOut,
  Menu,
  X,
} from 'lucide-react';
import { useState } from 'react';

type NavLinkItem = {
  name: string;
  path: string;
  icon: React.ReactNode;
  description?: string;
};

type NavProps = {
  onSignOut: () => void;
  onSettingsClick: () => void;
};

const navigationItems: NavLinkItem[] = [
  {
    name: 'Dashboard',
    path: '/dashboard',
    icon: <LayoutDashboard size={20} />,
    description: 'Overview & quick actions',
  },
  {
    name: 'Transactions',
    path: '/transactions',
    icon: <Receipt size={20} />,
    description: 'View & manage all transactions',
  },
  {
    name: 'Categories',
    path: '/categories',
    icon: <FolderOpen size={20} />,
    description: 'Organize your spending',
  },
  {
    name: 'Budgets',
    path: '/budgets',
    icon: <Wallet size={20} />,
    description: 'Set & track budgets',
  },
  {
    name: 'Reports',
    path: '/reports',
    icon: <BarChart3 size={20} />,
    description: 'Insights & analytics',
  },
  {
    name: 'Import',
    path: '/upload',
    icon: <Upload size={20} />,
    description: 'Upload CSV/Excel',
  },
];

export default function Navigation({ onSignOut, onSettingsClick }: NavProps) {
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const isActive = (path: string) => location.pathname === path;

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex lg:flex-col lg:fixed lg:inset-y-0 lg:w-64 lg:bg-dark-900 lg:border-r lg:border-dark-800">
        <div className="flex flex-col h-full">
          {/* Logo/Brand */}
          <div className="p-6 border-b border-dark-800">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
              Opsia
            </h1>
            <p className="text-sm text-dark-400 mt-1">Personal Finance</p>
          </div>

          {/* Navigation Links */}
          <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
            {navigationItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                  isActive(item.path)
                    ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-lg'
                    : 'text-dark-300 hover:bg-dark-800 hover:text-dark-100'
                }`}
                title={item.description}
              >
                {item.icon}
                <span className="font-medium">{item.name}</span>
              </Link>
            ))}
          </nav>

          {/* Bottom Actions */}
          <div className="p-4 border-t border-dark-800 space-y-2">
            <button
              onClick={onSettingsClick}
              className="flex items-center gap-3 px-4 py-3 w-full text-dark-300 hover:bg-dark-800 hover:text-dark-100 rounded-lg transition-all"
            >
              <Settings size={20} />
              <span className="font-medium">Settings</span>
            </button>
            <button
              onClick={onSignOut}
              className="flex items-center gap-3 px-4 py-3 w-full text-red-400 hover:bg-dark-800 rounded-lg transition-all"
            >
              <LogOut size={20} />
              <span className="font-medium">Sign Out</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile Header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-dark-900 border-b border-dark-800">
        <div className="flex items-center justify-between p-4">
          <h1 className="text-xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
            Opsia
          </h1>
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 text-dark-200 hover:text-dark-100 hover:bg-dark-800 rounded-lg transition-all"
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="border-t border-dark-800 bg-dark-900">
            <nav className="p-4 space-y-2 max-h-[calc(100vh-80px)] overflow-y-auto">
              {navigationItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                    isActive(item.path)
                      ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-lg'
                      : 'text-dark-300 hover:bg-dark-800 hover:text-dark-100'
                  }`}
                >
                  {item.icon}
                  <div className="flex-1">
                    <div className="font-medium">{item.name}</div>
                    {item.description && (
                      <div className="text-xs opacity-75">{item.description}</div>
                    )}
                  </div>
                </Link>
              ))}

              {/* Mobile Bottom Actions */}
              <div className="pt-4 mt-4 border-t border-dark-800 space-y-2">
                <button
                  onClick={() => {
                    onSettingsClick();
                    setIsMobileMenuOpen(false);
                  }}
                  className="flex items-center gap-3 px-4 py-3 w-full text-dark-300 hover:bg-dark-800 hover:text-dark-100 rounded-lg transition-all"
                >
                  <Settings size={20} />
                  <span className="font-medium">Settings</span>
                </button>
                <button
                  onClick={() => {
                    onSignOut();
                    setIsMobileMenuOpen(false);
                  }}
                  className="flex items-center gap-3 px-4 py-3 w-full text-red-400 hover:bg-dark-800 rounded-lg transition-all"
                >
                  <LogOut size={20} />
                  <span className="font-medium">Sign Out</span>
                </button>
              </div>
            </nav>
          </div>
        )}
      </header>

      {/* Mobile Spacer */}
      <div className="lg:hidden h-16" />
    </>
  );
}
