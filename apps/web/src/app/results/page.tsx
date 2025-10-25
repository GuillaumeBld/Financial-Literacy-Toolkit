'use client';

import Link from 'next/link';
import { CheckCircle, Home, RotateCcw, Award, Clock } from 'lucide-react';

export default function ResultsPage() {
  // Mock completion data - in production this would come from API/database
  const completionData = {
    totalQuestions: 3,
    answeredQuestions: 3,
    timeTaken: "8:45", // Mock time
    completedAt: new Date().toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-loyola-gray-200">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <Link href="/" className="flex items-center">
            <span className="text-xl font-bold gradient-text">Financial Literacy Toolkit</span>
          </Link>
          <div className="flex items-center space-x-4">
            <Link
              href="/start"
              className="bg-loyola-maroon text-white px-4 py-2 rounded-lg hover:bg-loyola-maroon-dark transition flex items-center gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              New Assessment
            </Link>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12 max-w-4xl">
        {/* Success Message */}
        <div className="text-center mb-12">
          <div className="w-20 h-20 bg-loyola-gold/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-12 h-12 text-loyola-gold" />
          </div>
          <h1 className="text-4xl font-bold text-loyola-gray-900 mb-4">
            Assessment Completed!
          </h1>
          <p className="text-xl text-loyola-gray-600 max-w-2xl mx-auto">
            Thank you for completing your Financial Literacy Assessment.
            Your responses have been submitted successfully.
          </p>
        </div>

        {/* Completion Summary */}
        <div className="bg-white rounded-xl shadow-md p-8 mb-8 border border-loyola-gray-200">
          <h2 className="text-2xl font-semibold text-loyola-gray-900 mb-6 flex items-center gap-3">
            <Award className="w-6 h-6 text-loyola-maroon" />
            Completion Summary
          </h2>

          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-loyola-gold/10 rounded-lg p-6 border border-loyola-gold/30">
              <div className="flex items-center gap-3 mb-2">
                <CheckCircle className="w-5 h-5 text-loyola-maroon" />
                <span className="font-semibold text-loyola-gray-900">Questions Completed</span>
              </div>
              <p className="text-3xl font-bold text-loyola-maroon">
                {completionData.answeredQuestions}/{completionData.totalQuestions}
              </p>
            </div>

            <div className="bg-loyola-maroon/10 rounded-lg p-6 border border-loyola-maroon/30">
              <div className="flex items-center gap-3 mb-2">
                <Clock className="w-5 h-5 text-loyola-maroon" />
                <span className="font-semibold text-loyola-gray-900">Time Taken</span>
              </div>
              <p className="text-3xl font-bold text-loyola-maroon">
                {completionData.timeTaken}
              </p>
            </div>

            <div className="bg-loyola-gray-50 rounded-lg p-6 border border-loyola-gray-200">
              <div className="flex items-center gap-3 mb-2">
                <Award className="w-5 h-5 text-loyola-maroon" />
                <span className="font-semibold text-loyola-gray-900">Status</span>
              </div>
              <p className="text-lg font-bold text-loyola-maroon">
                Submitted Successfully
              </p>
            </div>
          </div>

          <div className="mt-6 p-4 bg-loyola-gold/10 rounded-lg border border-loyola-gold/30">
            <p className="text-sm text-loyola-gray-700">
              <strong>Completed on:</strong> {completionData.completedAt}
            </p>
          </div>
        </div>

        {/* Next Steps */}
        <div className="bg-white rounded-xl shadow-md p-8 mb-8 border border-loyola-gray-200">
          <h2 className="text-2xl font-semibold text-loyola-gray-900 mb-6">
            What&apos;s Next?
          </h2>

          <div className="space-y-4">
            <div className="flex items-start gap-4 p-4 bg-loyola-gray-50 rounded-lg border border-loyola-gray-200">
              <div className="w-8 h-8 bg-loyola-maroon rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-white font-bold text-sm">1</span>
              </div>
              <div>
                <h3 className="font-semibold text-loyola-gray-900 mb-1">
                  Results Processing
                </h3>
                <p className="text-loyola-gray-600">
                  Your assessment is being scored. Multiple choice questions are automatically graded,
                  while short answer responses are being evaluated by our AI system.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-4 bg-loyola-gray-50 rounded-lg border border-loyola-gray-200">
              <div className="w-8 h-8 bg-loyola-maroon rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-white font-bold text-sm">2</span>
              </div>
              <div>
                <h3 className="font-semibold text-loyola-gray-900 mb-1">
                  Instructor Review
                </h3>
                <p className="text-loyola-gray-600">
                  Your instructor will review your results and may provide personalized feedback.
                  Results will be available in your course dashboard within 24-48 hours.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-4 bg-loyola-gold/10 rounded-lg border border-loyola-gold/30">
              <div className="w-8 h-8 bg-loyola-gold rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <Award className="w-4 h-4 text-loyola-maroon" />
              </div>
              <div>
                <h3 className="font-semibold text-loyola-gray-900 mb-1">
                  Learning Continues
                </h3>
                <p className="text-loyola-gray-600">
                  Financial literacy is a journey. Use this assessment as a foundation to build
                  stronger financial knowledge and decision-making skills.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/"
            className="bg-loyola-maroon hover:bg-loyola-maroon-dark text-white font-medium py-3 px-8 rounded-lg transition flex items-center justify-center gap-2"
          >
            <Home className="w-5 h-5" />
            Return to Home
          </Link>
          <Link
            href="/start"
            className="border-2 border-loyola-maroon text-loyola-maroon hover:bg-loyola-maroon hover:text-white font-medium py-3 px-8 rounded-lg transition flex items-center justify-center gap-2"
          >
            <RotateCcw className="w-5 h-5" />
            Take Another Assessment
          </Link>
        </div>

        {/* Footer */}
        <div className="mt-12 text-center">
          <p className="text-sm text-loyola-gray-600">
            Questions about your results? Contact your instructor or visit the
            <a href="#" className="text-loyola-maroon hover:text-loyola-maroon-dark ml-1">
              Quinlan School of Business support page
            </a>.
          </p>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-loyola-maroon text-white py-8 mt-16">
        <div className="container mx-auto px-4 text-center">
          <p className="text-white/80">
            © 2025 Loyola University Chicago. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
