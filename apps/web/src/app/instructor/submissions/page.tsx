'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Search,
  Filter,
  Download,
  Eye,
  Clock,
  User,
  FileText,
  ArrowLeft,
  LogOut,
  RefreshCw
} from 'lucide-react';

type Submission = {
  attempt_id: string;
  user_id: string;
  hashed_student_key: string;
  course_id: string;
  course_name: string;
  attempt_type: 'pre' | 'post';
  submitted_at: string;
  duration_s: number;
  overall_score: number;
  overconfidence_index: number;
  domain_scores: Record<string, number>;
};

type FilterOptions = {
  courseId: string;
  attemptType: string;
  dateRange: string;
  searchTerm: string;
};

export default function InstructorSubmissionsPage() {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [courses, setCourses] = useState<Array<{id: string, name: string}>>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [instructorName, setInstructorName] = useState('');
  const [filters, setFilters] = useState<FilterOptions>({
    courseId: '',
    attemptType: '',
    dateRange: '',
    searchTerm: ''
  });
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('instructor-token');
    const name = localStorage.getItem('instructor-name');

    if (!token) {
      router.push('/instructor');
      return;
    }

    setInstructorName(name || 'Instructor');
    loadSubmissions(token);
  }, [router]);

  const loadSubmissions = async (token: string) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/instructor/submissions', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem('instructor-token');
          router.push('/instructor');
          return;
        }
        throw new Error('Failed to load submissions');
      }

      const data = await response.json();
      setSubmissions(data.submissions || []);
      setCourses(data.courses || []);
      
      // Set default course filter
      if (data.courses && data.courses.length > 0 && !filters.courseId) {
        setFilters(prev => ({ ...prev, courseId: data.courses[0].id }));
      }
    } catch (error) {
      console.error('Error loading submissions:', error);
      alert('Failed to load submissions data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('instructor-token');
    localStorage.removeItem('instructor-name');
    router.push('/instructor');
  };

  const handleRefresh = () => {
    const token = localStorage.getItem('instructor-token');
    if (token) {
      loadSubmissions(token);
    }
  };

  const filteredSubmissions = submissions.filter(submission => {
    if (filters.courseId && submission.course_id !== filters.courseId) return false;
    if (filters.attemptType && submission.attempt_type !== filters.attemptType) return false;
    if (filters.searchTerm && !submission.hashed_student_key.toLowerCase().includes(filters.searchTerm.toLowerCase())) return false;
    
    if (filters.dateRange) {
      const submissionDate = new Date(submission.submitted_at);
      const now = new Date();
      const daysAgo = parseInt(filters.dateRange);
      const cutoffDate = new Date(now.getTime() - (daysAgo * 24 * 60 * 60 * 1000));
      if (submissionDate < cutoffDate) return false;
    }
    
    return true;
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-12 h-12 text-loyola-maroon animate-spin mx-auto mb-4" />
          <p className="text-loyola-gray-600">Loading submissions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-loyola-gray-200">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push('/instructor/dashboard')}
                className="flex items-center gap-2 text-loyola-gray-600 hover:text-loyola-maroon transition"
              >
                <ArrowLeft className="w-5 h-5" />
                <span>Back to Dashboard</span>
              </button>
              <div>
                <h1 className="text-2xl font-bold text-loyola-maroon">
                  Student Submissions
                </h1>
                <p className="text-sm text-loyola-gray-600">
                  Review individual student responses
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={handleRefresh}
                className="p-2 text-loyola-gray-600 hover:text-loyola-maroon transition"
                title="Refresh data"
              >
                <RefreshCw className="w-5 h-5" />
              </button>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 text-loyola-gray-700 hover:text-loyola-maroon transition"
              >
                <LogOut className="w-5 h-5" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Filters */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Course Filter */}
            <div>
              <label className="block text-sm font-semibold text-loyola-gray-700 mb-2">
                Course
              </label>
              <select
                value={filters.courseId}
                onChange={(e) => setFilters(prev => ({ ...prev, courseId: e.target.value }))}
                className="w-full px-3 py-2 border-2 border-loyola-gray-300 rounded-lg focus:ring-2 focus:ring-loyola-maroon focus:border-loyola-maroon"
              >
                <option value="">All Courses</option>
                {courses.map((course) => (
                  <option key={course.id} value={course.id}>
                    {course.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Attempt Type Filter */}
            <div>
              <label className="block text-sm font-semibold text-loyola-gray-700 mb-2">
                Attempt Type
              </label>
              <select
                value={filters.attemptType}
                onChange={(e) => setFilters(prev => ({ ...prev, attemptType: e.target.value }))}
                className="w-full px-3 py-2 border-2 border-loyola-gray-300 rounded-lg focus:ring-2 focus:ring-loyola-maroon focus:border-loyola-maroon"
              >
                <option value="">All Types</option>
                <option value="pre">Pre-Assessment</option>
                <option value="post">Post-Assessment</option>
              </select>
            </div>

            {/* Date Range Filter */}
            <div>
              <label className="block text-sm font-semibold text-loyola-gray-700 mb-2">
                Date Range
              </label>
              <select
                value={filters.dateRange}
                onChange={(e) => setFilters(prev => ({ ...prev, dateRange: e.target.value }))}
                className="w-full px-3 py-2 border-2 border-loyola-gray-300 rounded-lg focus:ring-2 focus:ring-loyola-maroon focus:border-loyola-maroon"
              >
                <option value="">All Time</option>
                <option value="1">Last 24 hours</option>
                <option value="7">Last 7 days</option>
                <option value="30">Last 30 days</option>
                <option value="90">Last 90 days</option>
              </select>
            </div>

            {/* Search */}
            <div>
              <label className="block text-sm font-semibold text-loyola-gray-700 mb-2">
                Search Student ID
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-loyola-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search by student ID..."
                  value={filters.searchTerm}
                  onChange={(e) => setFilters(prev => ({ ...prev, searchTerm: e.target.value }))}
                  className="w-full pl-10 pr-3 py-2 border-2 border-loyola-gray-300 rounded-lg focus:ring-2 focus:ring-loyola-maroon focus:border-loyola-maroon"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Results Summary */}
        <div className="mb-6">
          <p className="text-loyola-gray-600">
            Showing {filteredSubmissions.length} of {submissions.length} submissions
          </p>
        </div>

        {/* Submissions Table */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-loyola-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-loyola-gray-500 uppercase tracking-wider">
                    Student ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-loyola-gray-500 uppercase tracking-wider">
                    Course
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-loyola-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-loyola-gray-500 uppercase tracking-wider">
                    Score
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-loyola-gray-500 uppercase tracking-wider">
                    Duration
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-loyola-gray-500 uppercase tracking-wider">
                    Submitted
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-loyola-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-loyola-gray-200">
                {filteredSubmissions.map((submission) => (
                  <tr key={submission.attempt_id} className="hover:bg-loyola-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-loyola-gray-900">
                      {submission.hashed_student_key}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-loyola-gray-600">
                      {submission.course_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        submission.attempt_type === 'pre' 
                          ? 'bg-blue-100 text-blue-800' 
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {submission.attempt_type === 'pre' ? 'Pre' : 'Post'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-loyola-gray-900">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">
                          {Math.round(submission.overall_score * 100)}%
                        </span>
                        <span className="text-xs text-loyola-gray-500">
                          (OC: {submission.overconfidence_index.toFixed(2)})
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-loyola-gray-600">
                      {formatDuration(submission.duration_s)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-loyola-gray-600">
                      {formatDate(submission.submitted_at)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => setSelectedSubmission(submission)}
                        className="text-loyola-maroon hover:text-loyola-maroon-dark transition"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Export Button */}
        <div className="mt-6 text-center">
          <button className="flex items-center gap-2 px-6 py-3 bg-loyola-maroon text-white rounded-lg hover:bg-loyola-maroon-dark transition mx-auto">
            <Download className="w-5 h-5" />
            Export to CSV
          </button>
        </div>
      </main>

      {/* Submission Detail Modal */}
      {selectedSubmission && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-loyola-gray-200">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-loyola-gray-800">
                  Submission Details
                </h2>
                <button
                  onClick={() => setSelectedSubmission(null)}
                  className="text-loyola-gray-400 hover:text-loyola-gray-600"
                >
                  ×
                </button>
              </div>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <h3 className="font-semibold text-loyola-gray-700 mb-2">Student Information</h3>
                  <p className="text-sm text-loyola-gray-600">
                    Student ID: {selectedSubmission.hashed_student_key}
                  </p>
                  <p className="text-sm text-loyola-gray-600">
                    Course: {selectedSubmission.course_name}
                  </p>
                  <p className="text-sm text-loyola-gray-600">
                    Attempt Type: {selectedSubmission.attempt_type}
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold text-loyola-gray-700 mb-2">Performance</h3>
                  <p className="text-sm text-loyola-gray-600">
                    Overall Score: {Math.round(selectedSubmission.overall_score * 100)}%
                  </p>
                  <p className="text-sm text-loyola-gray-600">
                    Duration: {formatDuration(selectedSubmission.duration_s)}
                  </p>
                  <p className="text-sm text-loyola-gray-600">
                    Overconfidence Index: {selectedSubmission.overconfidence_index.toFixed(2)}
                  </p>
                </div>
              </div>
              
              <div>
                <h3 className="font-semibold text-loyola-gray-700 mb-4">Domain Performance</h3>
                <div className="space-y-3">
                  {Object.entries(selectedSubmission.domain_scores).map(([domain, score]) => (
                    <div key={domain}>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm font-medium text-loyola-gray-700">
                          {domain}
                        </span>
                        <span className="text-sm text-loyola-gray-600">
                          {Math.round(score * 100)}%
                        </span>
                      </div>
                      <div className="w-full bg-loyola-gray-200 rounded-full h-2">
                        <div
                          className="bg-gradient-to-r from-loyola-maroon to-loyola-gold h-2 rounded-full transition-all duration-500"
                          style={{ width: `${score * 100}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
