'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Mail, AlertCircle, CheckCircle, Info } from 'lucide-react';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [courseCode, setCourseCode] = useState('');
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Pre-fill course code from URL if provided, otherwise default to QUINN 102
  useEffect(() => {
    const urlCourseCode = searchParams.get('courseCode');
    if (urlCourseCode) {
      setCourseCode(urlCourseCode);
    } else {
      setCourseCode('QUINN 102');
    }
  }, [searchParams]);

  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!courseCode.trim() || !email.trim()) {
      setError('Please fill in all fields');
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setError('Please enter a valid email address');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/student/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          courseCode: courseCode.trim(),
          email: email.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to request password reset');
      }

      // Show success message
      setSuccess('If an account exists with this email, a password reset link has been sent. Please check your email.');
    } catch (err: any) {
      console.error('Reset request error:', err);
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
          <h1 className="text-3xl font-bold text-loyola-gray-900 mb-2">Password Recovery</h1>
          <p className="text-loyola-gray-600">
            Enter your email address and we'll send you a password reset link
          </p>
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

          <form onSubmit={handleRequestReset}>
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
              {!searchParams.get('courseCode') && (
                <p className="mt-1 text-sm text-loyola-gray-500">
                  Default: QUINN 102 (Financial Literacy)
                </p>
              )}
            </div>

            <div className="mb-6">
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email Address <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-loyola-gray-400" />
                </div>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border-2 border-loyola-gray-300 rounded-lg focus:ring-2 focus:ring-loyola-maroon focus:border-loyola-maroon transition"
                  placeholder="Enter your email address"
                  required
                />
              </div>
              <p className="mt-1 text-sm text-loyola-gray-500">
                We'll send a password reset link to this email address
              </p>
            </div>

            <button
              type="submit"
              disabled={isLoading || !!success}
              className="w-full bg-loyola-maroon hover:bg-loyola-maroon-dark text-white font-medium py-3 px-6 rounded-lg transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Sending reset link...
                </>
              ) : success ? (
                <>
                  <CheckCircle className="w-5 h-5" />
                  Email Sent
                </>
              ) : (
                <>
                  <Mail className="w-5 h-5" />
                  Send Reset Link
                </>
              )}
            </button>
          </form>

          {success && (
            <div className="mt-6 bg-loyola-gold/10 border-2 border-loyola-gold/30 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <Info className="w-5 h-5 text-loyola-maroon flex-shrink-0 mt-0.5" />
                <div className="text-sm text-loyola-gray-700">
                  <p className="font-semibold mb-1">Check your email</p>
                  <p>Click the link in the email to reset your password. The link will expire in 1 hour.</p>
                  <p className="mt-2 text-xs text-loyola-gray-600">
                    Didn't receive an email? Check your spam folder or contact your instructor.
                  </p>
                </div>
              </div>
            </div>
          )}
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

