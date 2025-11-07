'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { setAuth } from '@/lib/auth';
import Logo from '@/components/Logo';

export default function AuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleCallback = () => {
      const token = searchParams.get('token');
      const userParam = searchParams.get('user');
      const errorParam = searchParams.get('error');

      if (errorParam) {
        // Handle error from backend
        const errorMessages: { [key: string]: string } = {
          no_code: 'Authentication failed: No authorization code received',
          no_email: 'Unable to retrieve email from your Microsoft account',
          account_inactive: 'Your account is inactive. Please contact an administrator',
          auth_failed: 'Authentication failed. Please try again',
        };

        setError(errorMessages[errorParam] || 'Authentication failed');
        setTimeout(() => router.push('/login'), 3000);
        return;
      }

      if (!token || !userParam) {
        setError('Invalid authentication response');
        setTimeout(() => router.push('/login'), 3000);
        return;
      }

      try {
        const user = JSON.parse(decodeURIComponent(userParam));

        // Store authentication data
        setAuth(token, user);

        // Redirect based on role
        if (user.role === 'Admin' || user.role === 'Practice Head') {
          router.push('/dashboard');
        } else if (user.role === 'PDM') {
          router.push('/pdm');
        } else {
          router.push('/');
        }
      } catch (err) {
        console.error('Error parsing user data:', err);
        setError('Failed to process authentication data');
        setTimeout(() => router.push('/login'), 3000);
      }
    };

    handleCallback();
  }, [searchParams, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md text-center">
        <div className="flex flex-col items-center mb-6">
          <Logo size={64} />
          <h1 className="text-2xl font-bold mt-4">
            {error ? 'Authentication Failed' : 'Signing you in...'}
          </h1>
        </div>

        {error ? (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded">
            {error}
            <p className="text-sm mt-2">Redirecting to login page...</p>
          </div>
        ) : (
          <div className="flex flex-col items-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
            <p className="text-secondary">Please wait while we sign you in...</p>
          </div>
        )}
      </div>
    </div>
  );
}
