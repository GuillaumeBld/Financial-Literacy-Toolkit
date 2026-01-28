'use client';

import Link from 'next/link';
import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { BookOpen, Play, ChevronRight, CheckCircle } from 'lucide-react';

function IntroVideoContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const courseCode = searchParams.get('courseCode') || '';

  const [hasWatchedVideo, setHasWatchedVideo] = useState(false);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);

  // Check if user has already seen this intro
  useEffect(() => {
    const session = localStorage.getItem('student-session');
    if (session) {
      const parsed = JSON.parse(session);
      if (parsed.hasSeenIntroVideo) {
        // Already seen, redirect to onboarding
        router.push(`/onboarding${courseCode ? `?courseCode=${encodeURIComponent(courseCode)}` : ''}`);
      }
    }
  }, [router, courseCode]);

  const handleVideoEnd = () => {
    setHasWatchedVideo(true);
  };

  const handleContinue = () => {
    // Mark intro as seen in session
    const session = localStorage.getItem('student-session');
    if (session) {
      const parsed = JSON.parse(session);
      parsed.hasSeenIntroVideo = true;
      localStorage.setItem('student-session', JSON.stringify(parsed));
    } else {
      // Create minimal session if none exists
      localStorage.setItem('student-session', JSON.stringify({ hasSeenIntroVideo: true }));
    }

    // Navigate to onboarding
    router.push(`/onboarding${courseCode ? `?courseCode=${encodeURIComponent(courseCode)}` : ''}`);
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
      <main className="container mx-auto px-4 py-8 lg:py-12 max-w-4xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-3">
            Welcome to the Financial Literacy Assessment
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Please watch this short video to learn about the assessment before you begin.
          </p>
        </div>

        {/* Video Container */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden mb-8">
          <div className="relative aspect-video bg-gray-900">
            {/* Video placeholder - will be replaced with actual video */}
            <video
              className="w-full h-full object-cover"
              controls
              onPlay={() => setIsVideoPlaying(true)}
              onEnded={handleVideoEnd}
              poster="/video-poster.jpg"
            >
              {/* Video source will be added here */}
              <source src="/intro-video.mp4" type="video/mp4" />
              Your browser does not support the video tag.
            </video>

            {/* Play overlay (shown when video hasn't started) */}
            {!isVideoPlaying && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                <div className="text-center text-white">
                  <div className="w-20 h-20 rounded-full bg-white/20 backdrop-blur flex items-center justify-center mx-auto mb-4 hover:bg-white/30 transition-colors cursor-pointer">
                    <Play className="w-10 h-10 text-white ml-1" />
                  </div>
                  <p className="text-lg font-medium">Click to play introduction video</p>
                </div>
              </div>
            )}
          </div>

          {/* Video info bar */}
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {hasWatchedVideo ? (
                  <>
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <span className="text-sm font-medium text-green-700">Video completed</span>
                  </>
                ) : (
                  <>
                    <Play className="w-5 h-5 text-gray-500" />
                    <span className="text-sm text-gray-600">Watch the video to continue</span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Continue Button */}
        <div className="text-center">
          <button
            onClick={handleContinue}
            className="bg-loyola-maroon hover:bg-loyola-maroon-dark text-white font-semibold py-4 px-8 rounded-xl transition-all flex items-center gap-2 mx-auto shadow-lg shadow-loyola-maroon/20 hover:shadow-xl hover:shadow-loyola-maroon/30"
          >
            Continue to Onboarding
            <ChevronRight className="w-5 h-5" />
          </button>
          <p className="text-sm text-gray-500 mt-4">
            You can proceed after watching the introduction video.
          </p>
        </div>

        {/* Info Box */}
        <div className="mt-12 bg-loyola-gold/10 border border-loyola-gold/30 rounded-xl p-6">
          <h3 className="font-semibold text-loyola-maroon mb-3">What to expect:</h3>
          <ul className="space-y-2 text-gray-700">
            <li className="flex items-start gap-2">
              <CheckCircle className="w-5 h-5 text-loyola-maroon flex-shrink-0 mt-0.5" />
              <span>A brief onboarding survey to set up your profile</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="w-5 h-5 text-loyola-maroon flex-shrink-0 mt-0.5" />
              <span>40 questions assessing your financial literacy</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="w-5 h-5 text-loyola-maroon flex-shrink-0 mt-0.5" />
              <span>Approximately 20-25 minutes to complete</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="w-5 h-5 text-loyola-maroon flex-shrink-0 mt-0.5" />
              <span>Your responses help measure learning outcomes</span>
            </li>
          </ul>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 py-6 mt-12">
        <div className="container mx-auto px-4 text-center text-sm text-gray-500">
          <p>&copy; 2025 by Dr. Abol Jalilvand and Guillaume Bolivard. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

export default function IntroVideoPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-loyola-maroon border-t-transparent rounded-full animate-spin"></div>
      </div>
    }>
      <IntroVideoContent />
    </Suspense>
  );
}
