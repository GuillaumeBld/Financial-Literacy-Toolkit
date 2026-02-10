'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Lock, Mail } from 'lucide-react';

export default function InstructorLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [dashboardMode, setDashboardMode] = useState<'instructor' | 'admin'>('instructor');
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/instructor/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Login failed');
        setIsLoading(false);
        return;
      }

      // Store token in localStorage
      localStorage.setItem('instructor-token', data.token);
      localStorage.setItem('instructor-name', data.instructor.name);

      // Redirect based on mode — admin only for gbolivard
      const isAdmin = dashboardMode === 'admin' && data.instructor.name === 'gbolivard';
      router.push(isAdmin ? '/admin' : '/instructor/dashboard');
    } catch (err) {
      setError('An error occurred. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-loyola-maroon to-loyola-gray-800 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-loyola-maroon mb-2">
            Instructor Portal
          </h1>
          <p className="text-loyola-gray-600">
            Financial Literacy Assessment Dashboard
          </p>
        </div>

        {/* Dashboard mode toggle */}
        <div className="flex justify-center mb-6">
          <div className="bg-loyola-gray-100 rounded-lg p-1 flex">
            <button
              type="button"
              onClick={() => setDashboardMode('instructor')}
              className={`px-5 py-2 rounded-md text-sm font-medium transition ${
                dashboardMode === 'instructor'
                  ? 'bg-white text-loyola-maroon shadow-sm'
                  : 'text-loyola-gray-500 hover:text-loyola-gray-700'
              }`}
            >
              Instructor
            </button>
            <button
              type="button"
              onClick={() => setDashboardMode('admin')}
              className={`px-5 py-2 rounded-md text-sm font-medium transition ${
                dashboardMode === 'admin'
                  ? 'bg-white text-loyola-maroon shadow-sm'
                  : 'text-loyola-gray-500 hover:text-loyola-gray-700'
              }`}
            >
              Admin
            </button>
          </div>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          {error && (
            <div className="bg-status-danger-tint border border-status-danger/30 text-status-danger px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-semibold text-loyola-gray-700 mb-2">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-loyola-gray-400 w-5 h-5" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border-2 border-loyola-gray-300 rounded-lg focus:ring-2 focus:ring-ink/20 focus:border-ink transition"
                placeholder="instructor@university.edu"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-loyola-gray-700 mb-2">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-loyola-gray-400 w-5 h-5" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border-2 border-loyola-gray-300 rounded-lg focus:ring-2 focus:ring-ink/20 focus:border-ink transition"
                placeholder="••••••••"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-loyola-maroon text-white py-3 rounded-lg font-semibold hover:bg-loyola-maroon-dark disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            {isLoading ? 'Signing In...' : 'Sign In'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <a
            href="/"
            className="text-sm text-loyola-gray-600 hover:text-ink transition"
          >
            ← Back to Student Assessment
          </a>
        </div>
      </div>
    </div>
  );
}
