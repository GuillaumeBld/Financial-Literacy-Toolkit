'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Settings, User, Clock, Info, CheckCircle } from 'lucide-react';

type Course = {
  id: string;
  name: string;
  term: string;
  displayName: string;
};

export default function StartPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [courseCode, setCourseCode] = useState('QUINN 102');
  const [error, setError] = useState('');
  const [isValidating, setIsValidating] = useState(false);
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
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!courseCode) {
      setError('Please enter a course code.');
      return;
    }

    // Validate course code
    setIsValidating(true);
    try {
      const trimmedCode = courseCode.trim();
      console.log('Validating course code:', trimmedCode);
      
      const response = await fetch('/api/courses/validate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          courseCode: trimmedCode
        }),
      });

      const data = await response.json();
      console.log('Validation response:', data);

      if (!response.ok || !data.valid) {
        setError(data.error || 'Invalid course code. Please check your course code and try again.');
        setIsValidating(false);
        return;
      }

      // Redirect to login (Microsoft-only authentication)
      router.push(`/login?courseCode=${encodeURIComponent(trimmedCode)}`);
    } catch (err) {
      console.error('Error validating course:', err);
      setError('Unable to validate course code. Please try again.');
    } finally {
      setIsValidating(false);
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
          <p className="text-loyola-gray-600">Enter your course code to begin the onboarding process</p>
        </div>

        <div className="bg-white rounded-xl shadow-md p-8 mb-8 border border-loyola-gray-200">
          <form onSubmit={handleSubmit}>
            {error && (
              <div className="mb-6 bg-red-50 border-2 border-red-200 text-red-700 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}
            <div className="mb-6">
              <label htmlFor="course-code" className="block text-sm font-medium text-gray-700 mb-2">
                Course Code <span className="text-red-500">*</span>
              </label>
              <select
                id="course-code"
                value={courseCode}
                onChange={(e) => setCourseCode(e.target.value)}
                disabled={isLoadingCourses}
                className={`w-full px-4 py-3 border-2 border-loyola-gray-300 rounded-lg focus:ring-2 focus:ring-loyola-maroon focus:border-loyola-maroon transition ${
                  isLoadingCourses ? 'bg-loyola-gray-50 text-loyola-gray-600' : 'bg-white'
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
              {!isLoadingCourses && (
                <p className="mt-1 text-sm text-loyola-gray-500">
                  Select your course from the list
                </p>
              )}
            </div>

            <div className="bg-loyola-gold/10 border-2 border-loyola-gold/30 rounded-lg p-4 mb-6">
              <div className="flex items-start gap-3">
                <Info className="w-5 h-5 text-loyola-maroon flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-sm font-semibold text-loyola-maroon mb-2">What's Next?</h3>
                  <p className="text-sm text-loyola-gray-700">
                    After validating your course code, you'll complete a brief onboarding form that collects demographic and socio-economic information. This helps us ensure fair and equitable assessment practices.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <button
                type="submit"
                disabled={isValidating}
                className="bg-loyola-maroon hover:bg-loyola-maroon-dark text-white font-medium py-3 px-6 rounded-lg transition flex-1 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <CheckCircle className="w-5 h-5" />
                {isValidating ? 'Validating...' : 'Continue to Onboarding'}
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
          <p>© 2025 by Dr. Abol Jalilvand and Guillaume Bolivard. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
