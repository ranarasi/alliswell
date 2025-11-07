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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    setUser(getUser());
  }, []);

  const handleLogout = () => {
    clearAuth();
    setMobileMenuOpen(false);
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

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  if (!user) return null;

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href={getHomePage()} className="flex items-center gap-2 text-lg sm:text-xl font-bold text-primary">
              <Logo size={28} />
              <span className="hidden sm:inline">AllIsWell</span>
              <span className="sm:hidden">AIW</span>
            </Link>
            {/* Desktop Menu */}
            <div className="hidden lg:ml-10 lg:flex lg:space-x-8">
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
                    My Dashboard
                  </Link>
                  <Link
                    href="/pdm/my-projects"
                    className={`transition-colors font-medium ${
                      pathname === '/pdm/my-projects'
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
          {/* Desktop User Info & Logout */}
          <div className="hidden lg:flex items-center space-x-4">
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

          {/* Mobile menu button */}
          <div className="lg:hidden flex items-center">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-700 hover:text-primary hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary"
              aria-expanded={mobileMenuOpen}
            >
              <span className="sr-only">Open main menu</span>
              {!mobileMenuOpen ? (
                <svg className="block h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                </svg>
              ) : (
                <svg className="block h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-gray-200">
          <div className="px-2 pt-2 pb-3 space-y-1">
            {(user.role === 'Admin' || user.role === 'Practice Head') && (
              <Link
                href="/dashboard"
                onClick={closeMobileMenu}
                className={`block px-3 py-2 rounded-md text-base font-medium ${
                  pathname === '/dashboard'
                    ? 'bg-primary text-white'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                Dashboard
              </Link>
            )}
            {user.role === 'PDM' && (
              <>
                <Link
                  href="/pdm"
                  onClick={closeMobileMenu}
                  className={`block px-3 py-2 rounded-md text-base font-medium ${
                    pathname === '/pdm'
                      ? 'bg-primary text-white'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  My Dashboard
                </Link>
                <Link
                  href="/pdm/my-projects"
                  onClick={closeMobileMenu}
                  className={`block px-3 py-2 rounded-md text-base font-medium ${
                    pathname === '/pdm/my-projects'
                      ? 'bg-primary text-white'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  My Projects
                </Link>
                <Link
                  href="/submit"
                  onClick={closeMobileMenu}
                  className={`block px-3 py-2 rounded-md text-base font-medium ${
                    pathname === '/submit'
                      ? 'bg-primary text-white'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  Submit Status
                </Link>
                <Link
                  href="/weekly-summary"
                  onClick={closeMobileMenu}
                  className={`block px-3 py-2 rounded-md text-base font-medium ${
                    pathname === '/weekly-summary'
                      ? 'bg-primary text-white'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  Weekly Summary
                </Link>
              </>
            )}
            {user.role === 'Admin' && (
              <Link
                href="/admin/projects"
                onClick={closeMobileMenu}
                className={`block px-3 py-2 rounded-md text-base font-medium ${
                  pathname === '/admin/projects'
                    ? 'bg-primary text-white'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                Manage Projects
              </Link>
            )}
          </div>
          <div className="pt-4 pb-3 border-t border-gray-200">
            <div className="px-4 mb-3">
              <div className="text-base font-medium text-gray-800">{user.name}</div>
              <div className="text-sm text-gray-500">{user.role === 'PDM' ? 'DD' : user.role}</div>
            </div>
            <div className="px-2">
              <button
                onClick={handleLogout}
                className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:bg-gray-100"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
