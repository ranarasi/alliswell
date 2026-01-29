'use client';

import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { usePDM } from '@/lib/pdmContext';
import { api } from '@/lib/api';
import Logo from './Logo';

interface PDM {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface NavbarProps {
  mode?: 'delivery' | 'admin';
}

export default function Navbar({ mode = 'delivery' }: NavbarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { selectedPDM, setSelectedPDM } = usePDM();
  const [pdms, setPdms] = useState<PDM[]>([]);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (mode === 'delivery') {
      fetchPDMs();
    }
  }, [mode]);

  const fetchPDMs = async () => {
    try {
      const response = await api.get<PDM[]>('/auth/users?role=PDM');
      setPdms(response.data);
    } catch (error) {
      console.error('Failed to fetch PDMs:', error);
    }
  };

  const handlePDMChange = (pdmId: string) => {
    const pdm = pdms.find(p => p.id === pdmId);
    if (pdm) {
      setSelectedPDM(pdm);
      // Stay on current page, just update the context
    }
  };

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="flex items-center gap-2 text-lg sm:text-xl font-bold text-primary">
              <Logo size={28} />
              <span className="hidden sm:inline">AllIsWell</span>
              <span className="sm:hidden">AIW</span>
            </Link>
            {/* Desktop Menu */}
            <div className="hidden lg:ml-10 lg:flex lg:space-x-8">
              {mode === 'delivery' && (
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
              {mode === 'admin' && (
                <>
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
                </>
              )}
            </div>
          </div>
          {/* Desktop Right Side */}
          <div className="hidden lg:flex items-center space-x-4">
            {mode === 'delivery' && selectedPDM && (
              <>
                <select
                  value={selectedPDM.id}
                  onChange={(e) => handlePDMChange(e.target.value)}
                  className="px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  {pdms.map((pdm) => (
                    <option key={pdm.id} value={pdm.id}>
                      {pdm.name}
                    </option>
                  ))}
                </select>
                <Link
                  href="/admin/projects"
                  className="px-4 py-2 text-sm font-medium text-primary hover:text-blue-600 transition-colors"
                >
                  Admin →
                </Link>
              </>
            )}
            {mode === 'admin' && (
              <Link
                href="/pdm"
                className="px-4 py-2 text-sm font-medium text-primary hover:text-blue-600 transition-colors"
              >
                ← Delivery
              </Link>
            )}
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
            {mode === 'delivery' && (
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
            {mode === 'admin' && (
              <>
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
              </>
            )}
          </div>
          <div className="pt-4 pb-3 border-t border-gray-200">
            {mode === 'delivery' && selectedPDM && (
              <div className="px-4 mb-3">
                <select
                  value={selectedPDM.id}
                  onChange={(e) => handlePDMChange(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  {pdms.map((pdm) => (
                    <option key={pdm.id} value={pdm.id}>
                      {pdm.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
            <div className="px-2">
              {mode === 'delivery' && (
                <Link
                  href="/admin/projects"
                  onClick={closeMobileMenu}
                  className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-primary hover:bg-gray-100"
                >
                  Go to Admin →
                </Link>
              )}
              {mode === 'admin' && (
                <Link
                  href="/pdm"
                  onClick={closeMobileMenu}
                  className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-primary hover:bg-gray-100"
                >
                  ← Back to Delivery
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
