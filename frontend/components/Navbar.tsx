'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { getUser, clearAuth } from '@/lib/auth';
import { useEffect, useState } from 'react';
import { User } from '@/types';

export default function Navbar() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    setUser(getUser());
  }, []);

  const handleLogout = () => {
    clearAuth();
    router.push('/login');
  };

  if (!user) return null;

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="text-xl font-bold text-primary">
              AllIsWell
            </Link>
            <div className="ml-10 flex space-x-8">
              {(user.role === 'Admin' || user.role === 'Practice Head') && (
                <Link
                  href="/dashboard"
                  className="text-secondary hover:text-text transition-colors"
                >
                  Dashboard
                </Link>
              )}
              {user.role === 'PDM' && (
                <Link
                  href="/submit"
                  className="text-secondary hover:text-text transition-colors"
                >
                  Submit Status
                </Link>
              )}
              {user.role === 'Admin' && (
                <Link
                  href="/admin/projects"
                  className="text-secondary hover:text-text transition-colors"
                >
                  Manage Projects
                </Link>
              )}
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-secondary">
              {user.name} ({user.role})
            </span>
            <button
              onClick={handleLogout}
              className="px-4 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
