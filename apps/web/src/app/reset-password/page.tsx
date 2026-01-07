'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Key, Lock, AlertCircle, CheckCircle } from 'lucide-react';

export default function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [token, setToken] = useState('');
  const [courseCode, setCourseCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Pre-fill from URL parameters
  useEffect(() => {
    const urlToken = searchParams.get('token');
    const urlCourseCode = searchParams.get('courseCode');
    if (urlToken) setToken(urlToken);
    if (urlCourseCode) setCourseCode(urlCourseCode);
  }, [searchParams]);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!token.trim() || !courseCode.trim() || !newPassword.trim() || !confirmPassword.trim()) {
      setError('Please fill in all fields');
      return;
    }

    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/student/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          courseCode: courseCode.trim(),
          token: token.trim(),
          newPassword: newPassword.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to reset password');
      }

      setSuccess('Password reset successfully! Redirecting to login...');
      setTimeout(() => {
        router.push(`/login?courseCode=${encodeURIComponent(courseCode.trim())}`);
      }, 2000);
    } catch (err: any) {
      console.error('Password reset error:', err);
      setError(err.message || 'An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen">
      <header className="bg-white shadow-sm border-b border-loyola-gray-200">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <Link href="/" className="flex items-center">
            <span className="text-xl font-bold gradient-text">Financial Literacy Toolkit</span>
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12 max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-loyola-gray-900 mb-2">Reset Your Password</h1>
          <p className="text-loyola-gray-600">Enter your new password below</p>
        </div>

        <div className="bg-white rounded-xl shadow-md p-8 border border-loyola-gray-200">
          {error && (
            <div className="mb-6 bg-red-50 border-2 border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-start gap-2">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="mb-6 bg-green-50 border-2 border-green-200 text-green-700 px-4 py-3 rounded-lg flex items-start gap-2">
              <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <span>{success}</span>
            </div>
          )}

          <form onSubmit={handleResetPassword}>
            <div className="mb-6">
              <label htmlFor="course-code" className="block text-sm font-medium text-gray-700 mb-2">
                Course Code <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="course-code"
                value={courseCode}
                onChange={(e) => setCourseCode(e.target.value)}
                readOnly={!!searchParams.get('courseCode')}
                className={`w-full px-4 py-3 border-2 border-loyola-gray-300 rounded-lg focus:ring-2 focus:ring-loyola-maroon focus:border-loyola-maroon transition ${
                  searchParams.get('courseCode') ? 'bg-loyola-gray-50 text-loyola-gray-600' : ''
                }`}
                placeholder="QUINN 102"
                required
              />
            </div>

            <div className="mb-6">
              <label htmlFor="token" className="block text-sm font-medium text-gray-700 mb-2">
                Reset Token <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="token"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                readOnly={!!searchParams.get('token')}
                className={`w-full px-4 py-3 border-2 border-loyola-gray-300 rounded-lg focus:ring-2 focus:ring-loyola-maroon focus:border-loyola-maroon transition font-mono text-sm ${
                  searchParams.get('token') ? 'bg-loyola-gray-50 text-loyola-gray-600' : ''
                }`}
                placeholder="Paste your reset token from email"
                required
              />
              <p className="mt-1 text-sm text-loyola-gray-500">
                This token was sent to your email address
              </p>
            </div>

            <div className="mb-6">
              <label htmlFor="new-password" className="block text-sm font-medium text-gray-700 mb-2">
                New Password <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-loyola-gray-400" />
                </div>
                <input
                  type="password"
                  id="new-password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border-2 border-loyola-gray-300 rounded-lg focus:ring-2 focus:ring-loyola-maroon focus:border-loyola-maroon transition"
                  placeholder="Enter new password (min 8 characters)"
                  required
                />
              </div>
              <p className="mt-1 text-sm text-loyola-gray-500">
                Password must be at least 8 characters long
              </p>
            </div>

            <div className="mb-6">
              <label htmlFor="confirm-password" className="block text-sm font-medium text-gray-700 mb-2">
                Confirm New Password <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-loyola-gray-400" />
                </div>
                <input
                  type="password"
                  id="confirm-password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border-2 border-loyola-gray-300 rounded-lg focus:ring-2 focus:ring-loyola-maroon focus:border-loyola-maroon transition"
                  placeholder="Confirm new password"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-loyola-maroon hover:bg-loyola-maroon-dark text-white font-medium py-3 px-6 rounded-lg transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Resetting...
                </>
              ) : (
                <>
                  <Key className="w-5 h-5" />
                  Reset Password
                </>
              )}
            </button>
          </form>
        </div>

        <div className="mt-6 text-center">
          <Link href={`/login?courseCode=${encodeURIComponent(courseCode || '')}`} className="text-loyola-maroon hover:text-loyola-maroon-dark text-sm font-medium">
            ← Back to Login
          </Link>
        </div>
      </main>

      <footer className="bg-white border-t border-loyola-gray-200 py-6 mt-12">
        <div className="container mx-auto px-4 text-center text-sm text-loyola-gray-600">
          <p>© 2025 L. University. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

