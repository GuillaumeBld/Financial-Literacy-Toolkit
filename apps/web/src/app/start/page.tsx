'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Settings, User, Clock, Info, CheckCircle } from 'lucide-react';

export default function StartPage() {
  const [courseCode, setCourseCode] = useState('');
  const [studentId, setStudentId] = useState('');
  const [consent, setConsent] = useState(false);
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (courseCode && studentId && consent) {
      // Store session data for assessment
      const sessionData = {
        courseCode: courseCode.trim(),
        studentId: studentId.trim(),
        attemptType: 'pre', // Default to pre-assessment
        startedAt: new Date().toISOString()
      };

      if (typeof window !== 'undefined') {
        localStorage.setItem('assessment-session', JSON.stringify(sessionData));
      }

      router.push('/assessment');
    }
  };

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
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-loyola-gray-900 mb-2">Start Your Assessment</h1>
          <p className="text-loyola-gray-600">Enter your course code to begin</p>
        </div>

        <div className="bg-white rounded-xl shadow-md p-8 mb-8 border border-loyola-gray-200">
          <form onSubmit={handleSubmit}>
            <div className="mb-6">
              <label htmlFor="course-code" className="block text-sm font-medium text-gray-700 mb-2">
                Course Code
              </label>
              <input
                type="text"
                id="course-code"
                value={courseCode}
                onChange={(e) => setCourseCode(e.target.value)}
                className="w-full px-4 py-3 border-2 border-loyola-gray-300 rounded-lg focus:ring-2 focus:ring-loyola-maroon focus:border-loyola-maroon transition"
                placeholder="Enter your course code"
                required
              />
            </div>

            <div className="mb-6">
              <label htmlFor="student-id" className="block text-sm font-medium text-gray-700 mb-2">
                Student ID
              </label>
              <input
                type="text"
                id="student-id"
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
                className="w-full px-4 py-3 border-2 border-loyola-gray-300 rounded-lg focus:ring-2 focus:ring-loyola-maroon focus:border-loyola-maroon transition"
                placeholder="Enter your student ID"
                required
              />
            </div>

            <div className="mb-6">
              <div className="flex items-start">
                <div className="flex items-center h-5">
                  <input
                    id="consent"
                    name="consent"
                    type="checkbox"
                    checked={consent}
                    onChange={(e) => setConsent(e.target.checked)}
                    className="focus:ring-loyola-maroon h-5 w-5 text-loyola-maroon accent-loyola-maroon border-loyola-gray-300 rounded"
                    required
                  />
                </div>
                <div className="ml-3 text-sm">
                  <label htmlFor="consent" className="font-medium text-gray-700">
                    I consent to participate
                  </label>
                  <p className="text-gray-500">
                    Your assessment data will be anonymized and used for learning improvement purposes.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <button
                type="submit"
                className="bg-loyola-maroon hover:bg-loyola-maroon-dark text-white font-medium py-3 px-6 rounded-lg transition flex-1 flex items-center justify-center gap-2"
              >
                <CheckCircle className="w-5 h-5" />
                Start Assessment
              </button>
              <a
                href="#"
                className="border-2 border-loyola-gray-300 text-loyola-gray-700 hover:bg-loyola-gray-50 font-medium py-3 px-6 rounded-lg transition flex-1 text-center"
              >
                Resume Previous
              </a>
            </div>
          </form>
        </div>

        <div className="mb-8">
          <h2 className="text-xl font-semibold text-loyola-gray-900 mb-4">Available Assessments</h2>
          <div className="grid gap-4">
            <div className="bg-white rounded-lg shadow-sm p-6 border-2 border-loyola-gray-200 transition duration-300 hover:shadow-md hover:border-loyola-maroon/30">
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-bold text-lg text-loyola-gray-900">Pre-Course Knowledge Check</h3>
                <span className="bg-green-100 text-green-800 text-xs px-3 py-1 rounded-full font-medium">Active</span>
              </div>
              <p className="text-loyola-gray-600 mb-4 flex items-center gap-2">
                <Clock className="w-4 h-4" />
                36 items • 20 minutes
              </p>
              <div className="flex items-center justify-between">
                <div className="flex items-center text-sm text-loyola-gray-500">
                  <span>Not started</span>
                </div>
                <button className="text-loyola-maroon hover:text-loyola-maroon-dark font-medium">View Details</button>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6 border-2 border-loyola-gray-200 transition duration-300 hover:shadow-md hover:border-loyola-maroon/30">
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-bold text-lg text-loyola-gray-900">Post-Course Evaluation</h3>
                <span className="bg-loyola-gold/30 text-loyola-maroon text-xs px-3 py-1 rounded-full font-medium">Upcoming</span>
              </div>
              <p className="text-loyola-gray-600 mb-4 flex items-center gap-2">
                <Clock className="w-4 h-4" />
                36 items • 20 minutes
              </p>
              <div className="flex items-center justify-between">
                <div className="flex items-center text-sm text-loyola-gray-500">
                  <span>Not available yet</span>
                </div>
                <button className="text-loyola-maroon hover:text-loyola-maroon-dark font-medium">View Details</button>
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
                <p>• Timer will be visible during the assessment</p>
                <p>• Internet connection required for submission</p>
              </div>
            </div>
          </div>
        </div>
      </main>

      <footer className="bg-white border-t border-loyola-gray-200 py-6">
        <div className="container mx-auto px-4 text-center text-sm text-loyola-gray-600">
          <p>© 2025 L. University. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
