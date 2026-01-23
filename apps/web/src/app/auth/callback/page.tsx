'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

// SSO is no longer used - redirect to login page
export default function AuthCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    // SSO has been deprecated - redirect to login
    router.push('/login');
  }, [router]);

  return (
    <div className="bg-gray-50 min-h-screen flex items-center justify-center px-4">
      <div className="bg-white rounded-xl shadow-md p-8 border border-loyola-gray-200 w-full max-w-md">
        <div className="text-loyola-gray-700">Redirecting to login...</div>
      </div>
    </div>
  );
}
