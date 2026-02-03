'use client';

import Link from 'next/link';
import { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { BookOpen, Play, ChevronRight, CheckCircle } from 'lucide-react';

function IntroVideoContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const courseCode = searchParams.get('courseCode') || '';
  const videoRef = useRef<HTMLVideoElement>(null);

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

  // Cross-browser fullscreen exit function
  const exitFullscreen = () => {
    const doc = document as Document & {
      webkitExitFullscreen?: () => Promise<void>;
      msExitFullscreen?: () => Promise<void>;
      webkitFullscreenElement?: Element;
      msFullscreenElement?: Element;
    };

    const video = videoRef.current as HTMLVideoElement & {
      webkitExitFullscreen?: () => void;
      webkitDisplayingFullscreen?: boolean;
    };

    // Check if document is in fullscreen (standard + prefixed)
    const isDocFullscreen = doc.fullscreenElement || doc.webkitFullscreenElement || doc.msFullscreenElement;

    // Check if video is in fullscreen (iOS Safari uses different API)
    const isVideoFullscreen = video?.webkitDisplayingFullscreen;

    if (isDocFullscreen) {
      if (doc.exitFullscreen) {
        doc.exitFullscreen().catch(() => {});
      } else if (doc.webkitExitFullscreen) {
        doc.webkitExitFullscreen();
      } else if (doc.msExitFullscreen) {
        doc.msExitFullscreen();
      }
    }

    // iOS Safari: video has its own fullscreen API
    if (isVideoFullscreen && video?.webkitExitFullscreen) {
      video.webkitExitFullscreen();
    }
  };

  const handleVideoEnd = () => {
    setHasWatchedVideo(true);
    // Exit fullscreen when video ends
    exitFullscreen();
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
              ref={videoRef}
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
