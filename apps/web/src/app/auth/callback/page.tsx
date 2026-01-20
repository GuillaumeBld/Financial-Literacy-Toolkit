'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabaseBrowser } from '@/lib/supabase-browser';

export default function AuthCallbackPage() {
  const router = useRouter();
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const run = async () => {
      try {
        const { data, error: sessionError } = await supabaseBrowser.auth.getSession();
        if (sessionError) throw sessionError;

        const session = data.session;
        if (!session?.access_token) {
          throw new Error('Missing authentication session. Please try signing in again.');
        }

        const courseCode = sessionStorage.getItem('pendingCourseCode') || '';
        const studentId = sessionStorage.getItem('pendingStudentId') || '';

        if (!courseCode || !studentId) {
          throw new Error('Missing Course ID or Student ID. Please return to login and try again.');
        }

        const response = await fetch('/api/student/login-sso', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            courseCode,
            studentId,
          }),
        });

        const result = await response.json();
        if (!response.ok) {
          throw new Error(result.error || 'SSO login failed');
        }

        const sessionData = {
          courseCode: courseCode.trim(),
          studentId: studentId.trim(),
          userId: result.userId,
          courseId: result.courseId,
          hasCompletedOnboarding: result.hasCompletedOnboarding,
          loginTime: new Date().toISOString(),
        };

        localStorage.setItem('student-session', JSON.stringify(sessionData));

        sessionStorage.removeItem('pendingCourseCode');
        sessionStorage.removeItem('pendingStudentId');

        if (!result.hasCompletedOnboarding) {
          router.push(`/onboarding?courseCode=${encodeURIComponent(courseCode.trim())}`);
        } else {
          router.push('/assessment');
        }
      } catch (e: any) {
        setError(e?.message || 'Authentication failed.');
      }
    };

    run();
  }, [router]);

  return (
    <div className="bg-gray-50 min-h-screen flex items-center justify-center px-4">
      <div className="bg-white rounded-xl shadow-md p-8 border border-loyola-gray-200 w-full max-w-md">
        {!error ? (
          <div className="text-loyola-gray-700">Completing sign-in…</div>
        ) : (
          <div className="text-red-700">{error}</div>
        )}
      </div>
    </div>
  );
}
