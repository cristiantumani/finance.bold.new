import React from 'react';
import { Link } from 'react-router-dom';

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
      </div>
    </footer>
  );
}