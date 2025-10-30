'use client';

import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { getUser, clearAuth } from '@/lib/auth';
import { useEffect, useState } from 'react';
import { User } from '@/types';
import Logo from './Logo';

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    setUser(getUser());
  }, []);

  const handleLogout = () => {
    clearAuth();
    router.push('/login');
  };

  const getHomePage = () => {
    if (user?.role === 'Admin' || user?.role === 'Practice Head') {
      return '/dashboard';
    } else if (user?.role === 'PDM') {
      return '/pdm';
    }
    return '/';
  };

  if (!user) return null;

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href={getHomePage()} className="flex items-center gap-2 text-xl font-bold text-primary">
              <Logo size={32} />
              <span>AllIsWell</span>
            </Link>
            <div className="ml-10 flex space-x-8">
              {(user.role === 'Admin' || user.role === 'Practice Head') && (
                <Link
                  href="/dashboard"
                  className={`transition-colors font-medium ${
                    pathname === '/dashboard'
                      ? 'text-primary border-b-2 border-primary'
                      : 'text-secondary hover:text-text'
                  }`}
                >
                  Dashboard
                </Link>
              )}
              {user.role === 'PDM' && (
                <>
                  <Link
                    href="/pdm"
                    className={`transition-colors font-medium ${
                      pathname === '/pdm'
                        ? 'text-primary border-b-2 border-primary'
                        : 'text-secondary hover:text-text'
                    }`}
                  >
                    My Projects
                  </Link>
                  <Link
                    href="/submit"
                    className={`transition-colors font-medium ${
                      pathname === '/submit'
                        ? 'text-primary border-b-2 border-primary'
                        : 'text-secondary hover:text-text'
                    }`}
                  >
                    Submit Status
                  </Link>
                  <Link
                    href="/weekly-summary"
                    className={`transition-colors font-medium ${
                      pathname === '/weekly-summary'
                        ? 'text-primary border-b-2 border-primary'
                        : 'text-secondary hover:text-text'
                    }`}
                  >
                    Weekly Summary
                  </Link>
                </>
              )}
              {user.role === 'Admin' && (
                <Link
                  href="/admin/projects"
                  className={`transition-colors font-medium ${
                    pathname === '/admin/projects'
                      ? 'text-primary border-b-2 border-primary'
                      : 'text-secondary hover:text-text'
                  }`}
                >
                  Manage Projects
                </Link>
              )}
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-secondary">
              {user.name} ({user.role === 'PDM' ? 'DD' : user.role})
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
