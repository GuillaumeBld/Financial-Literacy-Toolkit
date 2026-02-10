'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Settings, User, Info, Calendar, ShieldCheck } from 'lucide-react';

type Course = {
  id: string;
  name: string;
  term: string;
  displayName: string;
};

type SessionData = {
  userId?: string;
  courseId?: string;
  studentId?: string;
  courseCode?: string;
  hasCompletedOnboarding?: boolean;
  isTestUser?: boolean;
};

type AttemptStatus = {
  hasAttempt: boolean;
  answeredCount: number;
  totalQuestions: number;
  isSubmitted: boolean;
};

// Assessment window configuration
// Monday 12:01 AM through Sunday 11:59 PM
const ASSESSMENT_WINDOW = {
  start: new Date('2026-02-01T00:01:00'), // Saturday, February 1, 2026 at 12:01 AM (opened early for early access)
  end: new Date('2026-02-09T23:59:59'),   // Monday, February 9, 2026 at 11:59 PM (1-day extension)
};

function isWithinAssessmentWindow(): { isOpen: boolean; message: string } {
  const now = new Date();

  if (now < ASSESSMENT_WINDOW.start) {
    const diff = ASSESSMENT_WINDOW.start.getTime() - now.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    return {
      isOpen: false,
      message: `Assessment opens in ${days > 0 ? `${days} day${days > 1 ? 's' : ''} and ` : ''}${hours} hour${hours !== 1 ? 's' : ''}`,
    };
  }

  if (now > ASSESSMENT_WINDOW.end) {
    return {
      isOpen: false,
      message: 'Assessment window has closed',
    };
  }

  return {
    isOpen: true,
    message: 'Assessment is open',
  };
}

export default function StartPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [courseCode, setCourseCode] = useState('QUIN 102');
  const [isLoadingCourses, setIsLoadingCourses] = useState(true);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [sessionData, setSessionData] = useState<SessionData | null>(null);
  const [attemptStatus, setAttemptStatus] = useState<AttemptStatus | null>(null);
  const [isLoadingAttempt, setIsLoadingAttempt] = useState(true);
  const [windowStatus, setWindowStatus] = useState(isWithinAssessmentWindow());
  const [planBRedirect, setPlanBRedirect] = useState<string | null>(null);
  const [researchConsent, setResearchConsent] = useState<boolean | null>(null);
  const [isLoadingConsent, setIsLoadingConsent] = useState(true);
  const [isUpdatingConsent, setIsUpdatingConsent] = useState(false);
  const [showConsentConfirm, setShowConsentConfirm] = useState(false);
  const router = useRouter();

  // Update window status every minute
  useEffect(() => {
    const interval = setInterval(() => {
      setWindowStatus(isWithinAssessmentWindow());
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  // Check for authentication
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const session = localStorage.getItem('student-session');
    if (!session) {
      // No session - redirect to login
      router.replace('/login');
      return;
    }

    try {
      const parsed = JSON.parse(session) as SessionData;
      // Verify session has required data (user has completed onboarding)
      if (!parsed.hasCompletedOnboarding) {
        // User hasn't completed onboarding, redirect to login
        router.replace('/login');
        return;
      }
      setSessionData(parsed);
      setIsCheckingAuth(false);
    } catch {
      // Invalid session data
      router.replace('/login');
    }
  }, [router]);

  // Load available courses
  useEffect(() => {
    if (isCheckingAuth) return; // Don't load courses until auth is verified

    const loadCourses = async () => {
      try {
        const response = await fetch('/api/courses/list');
        const data = await response.json();

        if (data.success && data.courses && data.courses.length > 0) {
          setCourses(data.courses);
          // Use the course from session if available
          if (sessionData?.courseCode) {
            setCourseCode(sessionData.courseCode);
          } else {
            setCourseCode(data.courses[0].name);
          }
        } else {
          // No courses found or API returned empty - use fallback
          setCourses([{ id: '', name: 'QUIN 102', term: '', displayName: 'QUIN 102 (Financial Literacy)' }]);
          setCourseCode(sessionData?.courseCode || 'QUIN 102');
        }
      } catch (err) {
        console.error('Error loading courses:', err);
        // Fallback to QUIN 102 if API fails
        setCourses([{ id: '', name: 'QUIN 102', term: '', displayName: 'QUIN 102 (Financial Literacy)' }]);
        setCourseCode(sessionData?.courseCode || 'QUIN 102');
      } finally {
        setIsLoadingCourses(false);
      }
    };

    loadCourses();
  }, [isCheckingAuth, sessionData?.courseCode]);

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

  // Fetch current research consent status
  useEffect(() => {
    if (isCheckingAuth || !sessionData?.userId || !sessionData?.courseId) {
      setIsLoadingConsent(false);
      return;
    }

    const fetchConsent = async () => {
      try {
        const params = new URLSearchParams({
          userId: sessionData.userId!,
          courseId: sessionData.courseId!,
        });
        const response = await fetch(`/api/student/research-consent?${params}`);
        const data = await response.json();
        if (data.success) {
          setResearchConsent(data.research_consent);
        }
      } catch (err) {
        console.error('Error fetching consent status:', err);
      } finally {
        setIsLoadingConsent(false);
      }
    };

    fetchConsent();
  }, [isCheckingAuth, sessionData?.userId, sessionData?.courseId]);

  // Handle consent update
  const handleConsentUpdate = async (newConsent: boolean) => {
    if (!sessionData?.userId || !sessionData?.courseId) return;
    setIsUpdatingConsent(true);
    try {
      const response = await fetch('/api/student/research-consent', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: sessionData.userId,
          courseId: sessionData.courseId,
          research_consent: newConsent,
        }),
      });
      const data = await response.json();
      if (data.success) {
        setResearchConsent(data.research_consent);
      }
    } catch (err) {
      console.error('Error updating consent:', err);
    } finally {
      setIsUpdatingConsent(false);
      setShowConsentConfirm(false);
    }
  };

  // Check for in-progress attempt
  useEffect(() => {
    if (isCheckingAuth || !sessionData?.userId || !sessionData?.courseId) {
      setIsLoadingAttempt(false);
      return;
    }

    const checkAttemptStatus = async () => {
      try {
        const params = new URLSearchParams({
          userId: sessionData.userId!,
          courseId: sessionData.courseId!,
        });
        const response = await fetch(`/api/assessment/resume?${params}`);
        const data = await response.json();

        if (data.success) {
          setAttemptStatus({
            hasAttempt: data.hasAttempt,
            answeredCount: data.responses?.length || 0,
            totalQuestions: 50, // Total questions in assessment
            isSubmitted: data.attempt?.isSubmitted || false,
          });
        }
      } catch (err) {
        console.error('Error checking attempt status:', err);
      } finally {
        setIsLoadingAttempt(false);
      }
    };

    checkAttemptStatus();
  }, [isCheckingAuth, sessionData?.userId, sessionData?.courseId]);

  // Handler to start assessment
  const handleStartAssessment = () => {
    // Ensure assessment-session exists for the assessment page
    const existingAssessmentSession = localStorage.getItem('assessment-session');
    if (!existingAssessmentSession && sessionData) {
      const assessmentSession = {
        courseCode: sessionData.courseCode,
        studentId: sessionData.studentId,
        userId: sessionData.userId,
        courseId: sessionData.courseId,
        attemptType: 'pre' as const,
        startedAt: new Date().toISOString(),
        isTestUser: sessionData.isTestUser || false,
        attemptId: null,
      };
      localStorage.setItem('assessment-session', JSON.stringify(assessmentSession));
    }
    router.push('/assessment');
  };

  // Show loading while checking authentication
  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-loyola-maroon border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      <header className="bg-white shadow-sm border-b border-loyola-gray-200">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <Link href="/" className="flex items-center">
            <span className="text-xl font-bold gradient-text">Financial Literacy Toolkit</span>
          </Link>
          <div className="flex items-center space-x-4">
            <button className="text-loyola-gray-600 hover:text-loyola-maroon transition p-2">
              <Settings className="w-5 h-5" />
            </button>
            <div className="w-10 h-10 rounded-full bg-loyola-maroon/10 flex items-center justify-center">
              <User className="w-5 h-5 text-loyola-maroon" />
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12 max-w-3xl">
        {planBRedirect && (
          <div className="mb-6 bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 rounded-xl">
            <p className="text-sm font-medium mb-2">Your instructor has enabled an alternative assessment.</p>
            <a
              href={planBRedirect}
              className="inline-flex items-center gap-2 px-4 py-2 bg-amber-600 text-white text-sm font-semibold rounded-lg hover:bg-amber-700 transition"
            >
              Go to Google Form
            </a>
          </div>
        )}

        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-loyola-gray-900">Select Assessment</h1>
        </div>

        <div className="bg-white rounded-xl shadow-md p-8 mb-8 border border-loyola-gray-200">
          <div>
            <label htmlFor="course-code" className="block text-sm font-medium text-gray-700 mb-2">
              Course Code
            </label>
            <select
              id="course-code"
              value={courseCode}
              onChange={(e) => setCourseCode(e.target.value)}
              disabled={isLoadingCourses || !!sessionData?.courseCode}
              className={`w-full px-4 py-3 border-2 border-loyola-gray-300 rounded-lg focus:ring-2 focus:ring-loyola-maroon focus:border-loyola-maroon transition ${
                isLoadingCourses || sessionData?.courseCode ? 'bg-loyola-gray-50 text-loyola-gray-600' : 'bg-white'
              }`}
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
        </div>

        <div className="mb-8">
          <h2 className="text-xl font-semibold text-loyola-gray-900 mb-4">Available Assessments</h2>
          <div className="grid gap-4">
            <div className={`bg-white rounded-lg shadow-sm p-6 border-2 transition duration-300 ${
              windowStatus.isOpen && !attemptStatus?.isSubmitted
                ? 'border-loyola-gray-200 hover:shadow-md hover:border-loyola-maroon/30'
                : 'border-loyola-gray-200 opacity-75'
            }`}>
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-bold text-lg text-loyola-gray-900">Pre-Course Knowledge Check</h3>
                <span className={`text-xs px-3 py-1 rounded-full font-medium ${
                  attemptStatus?.isSubmitted
                    ? 'bg-green-100 text-green-800'
                    : windowStatus.isOpen
                      ? 'bg-green-100 text-green-800'
                      : new Date() < ASSESSMENT_WINDOW.start
                        ? 'bg-loyola-gold/30 text-loyola-maroon'
                        : 'bg-red-100 text-red-800'
                }`}>
                  {attemptStatus?.isSubmitted ? 'Completed' : windowStatus.isOpen ? 'Active' : new Date() < ASSESSMENT_WINDOW.start ? 'Upcoming' : 'Closed'}
                </span>
              </div>
              <p className="text-loyola-gray-600 mb-2">
                50 questions
              </p>
              <p className="text-loyola-gray-600 mb-4 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-loyola-maroon" />
                <span>Available: <strong>February 2 - February 9, 2026</strong></span>
              </p>
              {!windowStatus.isOpen && !attemptStatus?.isSubmitted && (
                <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <p className="text-sm text-amber-800">{windowStatus.message}</p>
                </div>
              )}
              <div className="flex justify-between items-center">
                <span className="text-sm text-loyola-gray-500">
                  {isLoadingAttempt ? (
                    'Loading...'
                  ) : attemptStatus?.isSubmitted ? (
                    <span className="text-green-600 font-medium">Completed</span>
                  ) : attemptStatus?.hasAttempt ? (
                    <span className="text-amber-600 font-medium">
                      In progress ({attemptStatus.answeredCount}/{attemptStatus.totalQuestions} answered)
                    </span>
                  ) : !windowStatus.isOpen && new Date() < ASSESSMENT_WINDOW.start ? (
                    'Not available yet'
                  ) : (
                    'Not started'
                  )}
                </span>
                <button
                  onClick={handleStartAssessment}
                  disabled={attemptStatus?.isSubmitted || (!windowStatus.isOpen && !sessionData?.isTestUser)}
                  className={`font-medium py-2 px-6 rounded-lg transition ${
                    attemptStatus?.isSubmitted || (!windowStatus.isOpen && !sessionData?.isTestUser)
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-loyola-maroon hover:bg-loyola-maroon-dark text-white'
                  }`}
                >
                  {attemptStatus?.isSubmitted ? 'Completed' : attemptStatus?.hasAttempt ? 'Resume' : 'Start'}
                </button>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6 border-2 border-loyola-gray-200 transition duration-300 hover:shadow-md hover:border-loyola-maroon/30">
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-bold text-lg text-loyola-gray-900">Post-Course Evaluation</h3>
                <span className="bg-loyola-gold/30 text-loyola-maroon text-xs px-3 py-1 rounded-full font-medium">Upcoming</span>
              </div>
              <p className="text-loyola-gray-600 mb-2">
                50 questions
              </p>
              <p className="text-loyola-gray-600 mb-4 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-loyola-maroon" />
                <span>Available: <strong>TBD</strong></span>
              </p>
              <div className="flex justify-between items-center">
                <span className="text-sm text-loyola-gray-500">Not available yet</span>
                <button
                  disabled
                  className="bg-gray-300 text-gray-500 font-medium py-2 px-6 rounded-lg cursor-not-allowed"
                >
                  Start
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-loyola-gold/10 border-2 border-loyola-gold/30 rounded-lg p-6">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0">
              <Info className="w-5 h-5 text-loyola-maroon" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-loyola-maroon mb-2">Assessment Information</h3>
              <div className="space-y-1 text-sm text-loyola-gray-700">
                <p>• No back navigation on scored items</p>
                <p>• Your student ID is hashed for privacy</p>
                <p>• Internet connection required for submission</p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 bg-white rounded-lg shadow-sm p-6 border border-loyola-gray-200">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0">
              <ShieldCheck className="w-5 h-5 text-loyola-maroon" />
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-loyola-gray-900 mb-1">Research Consent</h3>
              <p className="text-sm text-loyola-gray-600 mb-3">
                Your assessment is a required course assignment regardless of this choice. Research consent only controls whether your anonymized responses are included in academic research.
              </p>
              {isLoadingConsent ? (
                <p className="text-sm text-loyola-gray-500">Loading...</p>
              ) : (
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">
                    Status:{' '}
                    <span className={researchConsent ? 'text-green-700' : 'text-red-700'}>
                      {researchConsent ? 'Consented' : 'Declined'}
                    </span>
                  </span>
                  {!showConsentConfirm ? (
                    <button
                      onClick={() => setShowConsentConfirm(true)}
                      className="text-sm text-loyola-maroon hover:text-loyola-maroon-dark underline transition"
                    >
                      Change
                    </button>
                  ) : (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleConsentUpdate(!researchConsent)}
                        disabled={isUpdatingConsent}
                        className="text-sm px-3 py-1 bg-loyola-maroon text-white rounded-md hover:bg-loyola-maroon-dark transition disabled:opacity-50"
                      >
                        {isUpdatingConsent
                          ? 'Updating...'
                          : researchConsent
                            ? 'Withdraw Consent'
                            : 'Give Consent'}
                      </button>
                      <button
                        onClick={() => setShowConsentConfirm(false)}
                        disabled={isUpdatingConsent}
                        className="text-sm px-3 py-1 border border-loyola-gray-300 text-loyola-gray-700 rounded-md hover:bg-loyola-gray-50 transition disabled:opacity-50"
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      <footer className="bg-white border-t border-loyola-gray-200 py-6">
        <div className="container mx-auto px-4 text-center text-sm text-loyola-gray-600">
          <p>© 2025 by Dr. Abol Jalilvand and Guillaume Bolivard. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
