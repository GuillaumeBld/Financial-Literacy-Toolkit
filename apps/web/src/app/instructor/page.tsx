'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Lock, Mail } from 'lucide-react';

export default function InstructorLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
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

      // Redirect to dashboard
      router.push('/instructor/dashboard');
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

        <form onSubmit={handleLogin} className="space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
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
                className="w-full pl-10 pr-4 py-3 border-2 border-loyola-gray-300 rounded-lg focus:ring-2 focus:ring-loyola-maroon focus:border-loyola-maroon transition"
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
                className="w-full pl-10 pr-4 py-3 border-2 border-loyola-gray-300 rounded-lg focus:ring-2 focus:ring-loyola-maroon focus:border-loyola-maroon transition"
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
            className="text-sm text-loyola-gray-600 hover:text-loyola-maroon transition"
          >
            ← Back to Student Assessment
          </a>
        </div>
      </div>
    </div>
  );
}
