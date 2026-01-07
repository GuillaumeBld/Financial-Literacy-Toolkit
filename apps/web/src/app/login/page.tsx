'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { User, Lock, Info, AlertCircle } from 'lucide-react';

type Course = {
  id: string;
  name: string;
  term: string;
  displayName: string;
};

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [courses, setCourses] = useState<Course[]>([]);
  const [studentId, setStudentId] = useState('');
  const [password, setPassword] = useState('');
  const [courseCode, setCourseCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingCourses, setIsLoadingCourses] = useState(true);
  const [error, setError] = useState('');

  // Load available courses
  useEffect(() => {
    const loadCourses = async () => {
      try {
        const response = await fetch('/api/courses/list');
        const data = await response.json();
        
        if (data.success && data.courses && data.courses.length > 0) {
          setCourses(data.courses);
          // Pre-fill course code from URL or default to first course
          const urlCourseCode = searchParams.get('courseCode');
          if (urlCourseCode) {
            setCourseCode(urlCourseCode);
          } else {
            setCourseCode(data.courses[0].name);
          }
        } else {
          // No courses found or API returned empty - use fallback
          setCourses([{ id: '', name: 'QUINN 102', term: '', displayName: 'QUINN 102 (Financial Literacy)' }]);
          setCourseCode('QUINN 102');
        }
      } catch (err) {
        console.error('Error loading courses:', err);
        // Fallback to QUINN 102 if API fails
        setCourses([{ id: '', name: 'QUINN 102', term: '', displayName: 'QUINN 102 (Financial Literacy)' }]);
        setCourseCode('QUINN 102');
      } finally {
        setIsLoadingCourses(false);
      }
    };

    loadCourses();
  }, [searchParams]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!studentId.trim() || !password.trim() || !courseCode.trim()) {
      setError('Please fill in all fields');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/student/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          courseCode: courseCode.trim(),
          studentId: studentId.trim(),
          password: password.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Login failed. Please check your credentials.');
        setIsLoading(false);
        return;
      }

      // Store session data
      const sessionData = {
        courseCode: courseCode.trim(),
        studentId: studentId.trim(),
        userId: data.userId,
        courseId: data.courseId,
        hasCompletedOnboarding: data.hasCompletedOnboarding,
        loginTime: new Date().toISOString(),
      };

      if (typeof window !== 'undefined') {
        localStorage.setItem('student-session', JSON.stringify(sessionData));
      }

      // Redirect based on onboarding status
      if (!data.hasCompletedOnboarding) {
        // First time - redirect to onboarding
        router.push(`/onboarding?courseCode=${encodeURIComponent(courseCode.trim())}`);
      } else {
        // Already onboarded - check if pre or post assessment
        // For now, default to pre-assessment selection
        router.push('/assessment');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('An error occurred. Please try again.');
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
          <h1 className="text-3xl font-bold text-loyola-gray-900 mb-2">Student Login</h1>
          <p className="text-loyola-gray-600">Sign in to access your assessments</p>
        </div>

        <div className="bg-white rounded-xl shadow-md p-8 border border-loyola-gray-200">
          {error && (
            <div className="mb-6 bg-red-50 border-2 border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-start gap-2">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin}>
            <div className="mb-6">
              <label htmlFor="course-code" className="block text-sm font-medium text-gray-700 mb-2">
                Course Code <span className="text-red-500">*</span>
              </label>
              <select
                id="course-code"
                value={courseCode}
                onChange={(e) => setCourseCode(e.target.value)}
                disabled={isLoadingCourses || !!searchParams.get('courseCode')}
                className={`w-full px-4 py-3 border-2 border-loyola-gray-300 rounded-lg focus:ring-2 focus:ring-loyola-maroon focus:border-loyola-maroon transition ${
                  searchParams.get('courseCode') || isLoadingCourses ? 'bg-loyola-gray-50 text-loyola-gray-600' : 'bg-white'
                }`}
                required
              >
                {isLoadingCourses ? (
                  <option value="">Loading courses...</option>
                ) : courses.length > 0 ? (
                  courses.map((course) => (
                    <option key={course.id} value={course.name}>
                      {course.displayName}
                    </option>
                  ))
                ) : (
                  <option value="QUINN 102">QUINN 102 (Financial Literacy)</option>
                )}
              </select>
              {!searchParams.get('courseCode') && !isLoadingCourses && (
                <p className="mt-1 text-sm text-loyola-gray-500">
                  Select your course from the list
                </p>
              )}
            </div>

            <div className="mb-6">
              <label htmlFor="student-id" className="block text-sm font-medium text-gray-700 mb-2">
                Student ID <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-loyola-gray-400" />
                </div>
                <input
                  type="text"
                  id="student-id"
                  value={studentId}
                  onChange={(e) => setStudentId(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border-2 border-loyola-gray-300 rounded-lg focus:ring-2 focus:ring-loyola-maroon focus:border-loyola-maroon transition"
                  placeholder="Enter your student ID"
                  required
                />
              </div>
            </div>

            <div className="mb-6">
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Password <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-loyola-gray-400" />
                </div>
                <input
                  type="password"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border-2 border-loyola-gray-300 rounded-lg focus:ring-2 focus:ring-loyola-maroon focus:border-loyola-maroon transition"
                  placeholder="Enter your password"
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
                  Signing in...
                </>
              ) : (
                <>
                  <Lock className="w-5 h-5" />
                  Sign In
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <Link
              href={`/forgot-password?courseCode=${encodeURIComponent(courseCode || '')}`}
              className="text-sm text-loyola-maroon hover:text-loyola-maroon-dark font-medium"
            >
              Forgot your password?
            </Link>
          </div>

          <div className="mt-6 pt-6 border-t border-loyola-gray-200">
            <div className="bg-loyola-gold/10 border-2 border-loyola-gold/30 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <Info className="w-5 h-5 text-loyola-maroon flex-shrink-0 mt-0.5" />
                <div className="text-sm text-loyola-gray-700">
                  <p className="font-semibold mb-1">First time here?</p>
                  <p>If this is your first time accessing the assessment, you'll be asked to complete an onboarding form after logging in.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 text-center">
          <Link href="/" className="text-loyola-maroon hover:text-loyola-maroon-dark text-sm font-medium">
            ← Back to Home
          </Link>
        </div>
      </main>

      <footer className="bg-white border-t border-loyola-gray-200 py-6 mt-12">
        <div className="container mx-auto px-4 text-center text-sm text-loyola-gray-600">
          <p>© 2025 by Dr. Abol Jalilvand and Guillaume Bolivard. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

