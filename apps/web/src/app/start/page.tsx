'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Settings, User, Info, Calendar } from 'lucide-react';

type Course = {
  id: string;
  name: string;
  term: string;
  displayName: string;
};

export default function StartPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [courseCode, setCourseCode] = useState('QUIN 102');
  const [isLoadingCourses, setIsLoadingCourses] = useState(true);
  const router = useRouter();

  // Load available courses
  useEffect(() => {
    const loadCourses = async () => {
      try {
        const response = await fetch('/api/courses/list');
        const data = await response.json();
        
        if (data.success && data.courses && data.courses.length > 0) {
          setCourses(data.courses);
          setCourseCode(data.courses[0].name);
        } else {
          // No courses found or API returned empty - use fallback
          setCourses([{ id: '', name: 'QUIN 102', term: '', displayName: 'QUIN 102 (Financial Literacy)' }]);
          setCourseCode('QUIN 102');
        }
      } catch (err) {
        console.error('Error loading courses:', err);
        // Fallback to QUIN 102 if API fails
        setCourses([{ id: '', name: 'QUIN 102', term: '', displayName: 'QUIN 102 (Financial Literacy)' }]);
        setCourseCode('QUIN 102');
      } finally {
        setIsLoadingCourses(false);
      }
    };

    loadCourses();
  }, []);

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
          <h1 className="text-3xl font-bold text-loyola-gray-900">Select Assessment</h1>
        </div>

        <div className="bg-white rounded-xl shadow-md p-8 mb-8 border border-loyola-gray-200">
          <div>
            <label htmlFor="course-code" className="block text-sm font-medium text-gray-700 mb-2">
              Course Code <span className="text-red-500">*</span>
            </label>
            <select
              id="course-code"
              value={courseCode}
              onChange={(e) => {
                const selectedCode = e.target.value;
                setCourseCode(selectedCode);
                // Auto-navigate to login when course is selected
                if (selectedCode) {
                  router.push(`/login?courseCode=${encodeURIComponent(selectedCode)}`);
                }
              }}
              disabled={isLoadingCourses}
              className={`w-full px-4 py-3 border-2 border-loyola-gray-300 rounded-lg focus:ring-2 focus:ring-loyola-maroon focus:border-loyola-maroon transition ${
                isLoadingCourses ? 'bg-loyola-gray-50 text-loyola-gray-600' : 'bg-white'
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
            <div className="bg-white rounded-lg shadow-sm p-6 border-2 border-loyola-gray-200 transition duration-300 hover:shadow-md hover:border-loyola-maroon/30">
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-bold text-lg text-loyola-gray-900">Pre-Course Knowledge Check</h3>
                <span className="bg-green-100 text-green-800 text-xs px-3 py-1 rounded-full font-medium">Active</span>
              </div>
              <p className="text-loyola-gray-600 mb-2">
                50 questions
              </p>
              <p className="text-loyola-gray-600 mb-4 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-loyola-maroon" />
                <span>Available: <strong>February 2 - February 8, 2026</strong></span>
              </p>
              <div className="flex justify-between items-center">
                <span className="text-sm text-loyola-gray-500">Not started</span>
                <button
                  onClick={() => router.push(`/login?courseCode=${encodeURIComponent(courseCode)}`)}
                  className="bg-loyola-maroon hover:bg-loyola-maroon-dark text-white font-medium py-2 px-6 rounded-lg transition"
                >
                  Start
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
      </main>

      <footer className="bg-white border-t border-loyola-gray-200 py-6">
        <div className="container mx-auto px-4 text-center text-sm text-loyola-gray-600">
          <p>© 2025 by Dr. Abol Jalilvand and Guillaume Bolivard. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
