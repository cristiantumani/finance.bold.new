import React from 'react';
import { Link } from 'react-router-dom';
import { Coffee } from 'lucide-react';

export default function Footer() {
  const links = [
    { to: '/docs?doc=user-guide', label: 'User Guide' },
    { to: '/docs?doc=privacy-policy', label: 'Privacy Policy' },
    { to: '/docs?doc=terms-of-service', label: 'Terms of Service' },
    { to: '/docs?doc=api-documentation', label: 'API Documentation' }
  ];

  return (
    <footer className="bg-white border-t border-gray-100 py-4 fixed bottom-0 left-0 right-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center gap-4">
          <nav className="flex justify-center space-x-8">
            {links.map(({ to, label }) => (
              <Link
                key={to}
                to={to}
                className="text-gray-600 hover:text-indigo-600 transition-colors text-sm font-medium"
              >
                {label}
              </Link>
            ))}
          </nav>
          <a
            href="https://buymeacoffee.com/cristian_tumani"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors text-sm"
          >
            <Coffee size={16} />
            <span>Buy me a coffee</span>
          </a>
        </div>
      </div>
    </footer>
  );
}