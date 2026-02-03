'use client';
export const dynamic = 'force-dynamic';

import Link from 'next/link';
import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { User, AlertCircle, UserPlus, LogIn, BookOpen, ArrowRight } from 'lucide-react';

type Course = {
  id: string;
  name: string;
  term: string;
  displayName: string;
};

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [courses, setCourses] = useState<Course[]>([]);
  const [studentId, setStudentId] = useState('');
  const [courseCode, setCourseCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingCourses, setIsLoadingCourses] = useState(true);
  const [error, setError] = useState('');
  const [planBRedirect, setPlanBRedirect] = useState<string | null>(null);

  // Load available courses
  useEffect(() => {
    const loadCourses = async () => {
      try {
        const response = await fetch('/api/courses/list');
        const data = await response.json();

        if (data.success && data.courses && data.courses.length > 0) {
          setCourses(data.courses);
          const urlCourseCode = searchParams.get('courseCode');
          if (urlCourseCode) {
            setCourseCode(urlCourseCode);
          } else {
            setCourseCode(data.courses[0].name);
          }
        } else {
          setCourses([{ id: '', name: 'QUIN 102', term: '', displayName: 'QUIN 102 (Financial Literacy)' }]);
          setCourseCode('QUIN 102');
        }
      } catch (err) {
        console.error('Error loading courses:', err);
        setCourses([{ id: '', name: 'QUIN 102', term: '', displayName: 'QUIN 102 (Financial Literacy)' }]);
        setCourseCode('QUIN 102');
      } finally {
        setIsLoadingCourses(false);
      }
    };

    loadCourses();
  }, [searchParams]);

  // Check Plan B status when course code changes
  useEffect(() => {
    if (!courseCode) return;
    setPlanBRedirect(null);
    fetch(`/api/plan-b/status?courseCode=${encodeURIComponent(courseCode)}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.active && data.redirectUrl) {
          setPlanBRedirect(data.redirectUrl);
        }
      })
      .catch(() => {});
  }, [courseCode]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!studentId.trim() || !courseCode.trim()) {
      setError('Please fill in all fields');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/student/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courseCode: courseCode.trim(),
          studentId: studentId.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Login failed');
      }

      // Check if user has completed onboarding BEFORE storing session
      if (!data.hasCompletedOnboarding) {
        // User hasn't completed onboarding - they should use the Register flow
        throw new Error('You have not completed onboarding yet. Please use the "Start Onboarding" button to register first.');
      }

      // Only store session data for users who have completed onboarding
      const sessionData = {
        userId: data.userId,
        courseId: data.courseId,
        studentId: studentId.trim(),
        courseCode: courseCode.trim(),
        isTestUser: data.isTestUser || false,
        hasInProgressAttempt: data.hasInProgressAttempt || false,
        attemptId: data.attemptId || null,
        attemptType: data.attemptType || 'pre',
        hasCompletedOnboarding: true,
      };

      localStorage.setItem('student-session', JSON.stringify(sessionData));

      // Also store assessment session for the assessment page
      const assessmentSession = {
        courseCode: courseCode.trim(),
        studentId: studentId.trim(),
        userId: data.userId,
        courseId: data.courseId,
        attemptType: data.attemptType || 'pre',
        startedAt: new Date().toISOString(),
        isTestUser: data.isTestUser || false,
        attemptId: data.attemptId || null,
        sessionToken: data.sessionToken || null, // Server-side multi-tab prevention token
      };
      localStorage.setItem('assessment-session', JSON.stringify(assessmentSession));

      // Clear any orphaned global progress key (legacy cleanup for cross-user contamination fix)
      localStorage.removeItem('assessment-progress');

      // Returning users go to start page to select assessment
      router.push('/start');
    } catch (err: any) {
      console.error('Login error:', err);
      setError(err?.message || 'An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex justify-center items-center">
          <Link href="/" className="flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-loyola-maroon" />
            <span className="text-xl font-bold gradient-text">Financial Literacy Toolkit</span>
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 lg:py-16">
        <div className="max-w-5xl mx-auto">
          {/* Two Column Layout */}
          <div className="grid lg:grid-cols-2 gap-8 items-stretch">
            {/* Login Card - RIGHT side */}
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8 order-2 lg:order-2">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-loyola-maroon/10 rounded-xl flex items-center justify-center">
                  <LogIn className="w-5 h-5 text-loyola-maroon" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">Student Login</h2>
                  <p className="text-sm text-gray-500">Access your assessments</p>
                </div>
              </div>

              {planBRedirect && (
                <div className="mb-6 bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 rounded-xl">
                  <p className="text-sm font-medium mb-2">Your instructor has enabled an alternative assessment.</p>
                  <a
                    href={planBRedirect}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-amber-600 text-white text-sm font-semibold rounded-lg hover:bg-amber-700 transition"
                  >
                    Go to Google Form
                    <ArrowRight className="w-4 h-4" />
                  </a>
                </div>
              )}

              {error && (
                <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  <span className="text-sm">{error}</span>
                </div>
              )}

              <form onSubmit={handleLogin} className="space-y-5">
                <div>
                  <label htmlFor="course-code" className="block text-sm font-medium text-gray-700 mb-2">
                    Course
                  </label>
                  <select
                    id="course-code"
                    value={courseCode}
                    onChange={(e) => setCourseCode(e.target.value)}
                    disabled={isLoadingCourses || !!searchParams.get('courseCode')}
                    className={`w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-loyola-maroon/20 focus:border-loyola-maroon transition-all ${
                      searchParams.get('courseCode') || isLoadingCourses ? 'bg-gray-50 text-gray-500' : 'bg-white'
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
                      <option value="QUIN 102">QUIN 102 (Financial Literacy)</option>
                    )}
                  </select>
                </div>

                <div>
                  <label htmlFor="student-id" className="block text-sm font-medium text-gray-700 mb-2">
                    Student ID
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <User className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      id="student-id"
                      value={studentId}
                      onChange={(e) => setStudentId(e.target.value)}
                      className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-loyola-maroon/20 focus:border-loyola-maroon transition-all"
                      placeholder="Enter your student ID"
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-loyola-maroon hover:bg-loyola-maroon-dark text-white font-semibold py-3.5 px-6 rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-loyola-maroon/20 hover:shadow-xl hover:shadow-loyola-maroon/30"
                >
                  {isLoading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Signing in...
                    </>
                  ) : (
                    <>
                      Sign in
                      <ArrowRight className="w-5 h-5" />
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* Register Card - LEFT side */}
            <div className="bg-gradient-to-br from-loyola-maroon to-loyola-maroon-dark rounded-2xl shadow-xl p-8 text-white order-1 lg:order-1 flex flex-col">
              <div className="flex-1">
                <div className="w-14 h-14 bg-white/20 backdrop-blur rounded-2xl flex items-center justify-center mb-6">
                  <UserPlus className="w-7 h-7 text-white" />
                </div>
                <h2 className="text-2xl lg:text-3xl font-bold mb-4">Register to Answer Questionnaire</h2>
                <p className="text-white/90 text-lg leading-relaxed mb-8">
                  Complete a quick onboarding survey to set up your profile and begin your financial literacy assessment.
                </p>
              </div>

              <Link
                href="/onboarding"
                className="inline-flex items-center justify-center gap-2 bg-white text-loyola-maroon font-semibold py-3.5 px-6 rounded-xl transition-all hover:bg-gray-100 shadow-lg hover:shadow-xl w-full"
              >
                <UserPlus className="w-5 h-5" />
                Start Onboarding
                <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
          </div>

          {/* Back to Home */}
          <div className="mt-8 text-center">
            <Link href="/" className="inline-flex items-center gap-2 text-gray-500 hover:text-loyola-maroon text-sm font-medium transition-colors">
              <ArrowRight className="w-4 h-4 rotate-180" />
              Back to Home
            </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 py-6 mt-auto">
        <div className="container mx-auto px-4 text-center text-sm text-gray-500">
          <p>&copy; 2025 by Dr. Abol Jalilvand and Guillaume Bolivard. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-loyola-maroon border-t-transparent rounded-full animate-spin"></div>
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}
