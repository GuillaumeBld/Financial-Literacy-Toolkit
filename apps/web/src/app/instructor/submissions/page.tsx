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
  submitted_at: string | null;
  duration_s: number | null;
  overall_score: number | null;
  overconfidence_index: number | null;
  domain_scores: Record<string, number> | null;
};

type ResponseDetail = {
  item_id: string;
  question: string;
  type: string;
  domain: string;
  answer: string;
  correct_answer: string;
  options: any;
  score: number | null;
  confidence: number;
  is_scored: boolean;
  answered_at: string;
};

type StudentProfile = {
  gender: string | null;
  race_ethnicity: string | null;
  age_range: string | null;
  first_language: string | null;
  work_experience: string | null;
  prior_financial_products: string[] | null;
  self_rated_financial_knowledge: string | null;
  financial_stress_frequency: string | null;
  parental_education: string | null;
  first_generation_college: string | null;
  has_student_loan_debt: string | null;
  research_consent: boolean | null;
};

type SubmissionDetail = {
  submission: Submission & { metadata: any; started_at: string };
  responses: ResponseDetail[];
  profile: StudentProfile | null;
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
  const [submissionDetail, setSubmissionDetail] = useState<SubmissionDetail | null>(null);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [activeTab, setActiveTab] = useState<'responses' | 'profile' | 'metadata'>('responses');
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

  const loadSubmissionDetail = async (submission: Submission) => {
    setSelectedSubmission(submission);
    setSubmissionDetail(null);
    setIsLoadingDetail(true);
    setActiveTab('responses');

    try {
      const token = localStorage.getItem('instructor-token');
      const response = await fetch(`/api/instructor/submissions?attemptId=${submission.attempt_id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to load submission details');
      }

      const data = await response.json();
      setSubmissionDetail(data);
    } catch (error) {
      console.error('Error loading submission detail:', error);
      alert('Failed to load submission details');
    } finally {
      setIsLoadingDetail(false);
    }
  };

  const handleExportCSV = () => {
    if (filteredSubmissions.length === 0) {
      alert('No submissions to export');
      return;
    }

    // Build CSV header
    const headers = [
      'Student ID', 'Course', 'Attempt Type', 'Submitted At', 'Duration (s)',
      'Overall Score (%)', 'Overconfidence Index'
    ];

    // Build CSV rows
    const rows = filteredSubmissions.map(sub => [
      sub.hashed_student_key,
      sub.course_name,
      sub.attempt_type,
      sub.submitted_at || '',
      sub.duration_s?.toString() || '0',
      Math.round(sub.overall_score ?? 0).toString(),
      Number(sub.overconfidence_index ?? 0).toFixed(2)
    ]);

    // Create CSV content
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    // Download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `submissions_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const handleExportDetailedCSV = async () => {
    if (filteredSubmissions.length === 0) {
      alert('No submissions to export');
      return;
    }

    // Show loading state
    const exportButton = document.getElementById('export-detailed-btn');
    if (exportButton) exportButton.textContent = 'Exporting...';

    try {
      const token = localStorage.getItem('instructor-token');
      const allDetails: any[] = [];

      // Fetch details for each submission
      for (const sub of filteredSubmissions) {
        const response = await fetch(`/api/instructor/submissions?attemptId=${sub.attempt_id}`, {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        if (response.ok) {
          const data = await response.json();
          allDetails.push(data);
        }
      }

      // Get all unique question IDs
      const allQuestionIds = new Set<string>();
      allDetails.forEach(d => d.responses?.forEach((r: any) => allQuestionIds.add(r.item_id)));
      const sortedQuestionIds = Array.from(allQuestionIds).sort();

      // Build headers
      const headers = [
        'Student ID', 'Course', 'Attempt Type', 'Submitted At', 'Duration (s)',
        'Overall Score (%)', 'Overconfidence Index', 'Tab Switches',
        // Question columns
        ...sortedQuestionIds.flatMap(qid => [`${qid}_answer`, `${qid}_score`, `${qid}_confidence`]),
        // Profile columns
        'Gender', 'Age Range', 'Race/Ethnicity', 'First Language', 'Work Experience',
        'Financial Knowledge', 'Financial Stress', 'Parental Education',
        'First Gen College', 'Has Student Loans', 'Research Consent'
      ];

      // Build rows
      const rows = allDetails.map(d => {
        const sub = d.submission;
        const profile = d.profile || {};
        const responseMap = new Map(d.responses?.map((r: any) => [r.item_id, r]) || []);

        const row = [
          sub.hashed_student_key,
          sub.course_name,
          sub.attempt_type,
          sub.submitted_at || '',
          sub.duration_s?.toString() || '0',
          Math.round(sub.overall_score ?? 0).toString(),
          Number(sub.overconfidence_index ?? 0).toFixed(2),
          sub.metadata?.tabSwitches?.toString() || '0',
          // Question answers
          ...sortedQuestionIds.flatMap(qid => {
            const r = responseMap.get(qid) as any;
            return [
              r?.answer || '',
              r?.score?.toString() || '',
              r?.confidence?.toString() || ''
            ];
          }),
          // Profile data
          profile.gender || '',
          profile.age_range || '',
          profile.race_ethnicity || '',
          profile.first_language || '',
          profile.work_experience || '',
          profile.self_rated_financial_knowledge || '',
          profile.financial_stress_frequency || '',
          profile.parental_education || '',
          profile.first_generation_college || '',
          profile.has_student_loan_debt || '',
          profile.research_consent?.toString() || ''
        ];

        return row;
      });

      // Create CSV
      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      ].join('\n');

      // Download
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `submissions_detailed_${new Date().toISOString().split('T')[0]}.csv`;
      link.click();

    } catch (error) {
      console.error('Error exporting detailed CSV:', error);
      alert('Failed to export detailed CSV');
    } finally {
      if (exportButton) exportButton.textContent = 'Export Detailed CSV';
    }
  };

  const filteredSubmissions = submissions.filter(submission => {
    if (filters.courseId && submission.course_id !== filters.courseId) return false;
    if (filters.attemptType && submission.attempt_type !== filters.attemptType) return false;
    if (filters.searchTerm && !(submission.hashed_student_key ?? '').toLowerCase().includes(filters.searchTerm.toLowerCase())) return false;

    if (filters.dateRange && submission.submitted_at) {
      const submissionDate = new Date(submission.submitted_at);
      const now = new Date();
      const daysAgo = parseInt(filters.dateRange);
      const cutoffDate = new Date(now.getTime() - (daysAgo * 24 * 60 * 60 * 1000));
      if (submissionDate < cutoffDate) return false;
    }

    return true;
  });

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'Invalid date';
    }
  };

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
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
                      {submission.hashed_student_key ?? 'Unknown'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-loyola-gray-600">
                      {submission.course_name ?? 'Unknown'}
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
                          {Math.round(submission.overall_score ?? 0)}%
                        </span>
                        <span className="text-xs text-loyola-gray-500">
                          (OC: {Number(submission.overconfidence_index ?? 0).toFixed(2)})
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-loyola-gray-600">
                      {formatDuration(submission.duration_s ?? 0)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-loyola-gray-600">
                      {formatDate(submission.submitted_at)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => loadSubmissionDetail(submission)}
                        className="text-loyola-maroon hover:text-loyola-maroon-dark transition"
                        title="View details"
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

        {/* Export Buttons */}
        <div className="mt-6 flex justify-center gap-4">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-6 py-3 bg-loyola-gray-600 text-white rounded-lg hover:bg-loyola-gray-700 transition"
          >
            <Download className="w-5 h-5" />
            Export Summary CSV
          </button>
          <button
            id="export-detailed-btn"
            onClick={handleExportDetailedCSV}
            className="flex items-center gap-2 px-6 py-3 bg-loyola-maroon text-white rounded-lg hover:bg-loyola-maroon-dark transition"
          >
            <Download className="w-5 h-5" />
            Export Detailed CSV
          </button>
        </div>
      </main>

      {/* Submission Detail Modal */}
      {selectedSubmission && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="p-6 border-b border-loyola-gray-200 flex-shrink-0">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-bold text-loyola-gray-800">
                    Submission Details
                  </h2>
                  <p className="text-sm text-loyola-gray-500">
                    {selectedSubmission.hashed_student_key?.slice(0, 12)}... | {selectedSubmission.course_name} | {selectedSubmission.attempt_type}
                  </p>
                </div>
                <button
                  onClick={() => { setSelectedSubmission(null); setSubmissionDetail(null); }}
                  className="text-loyola-gray-400 hover:text-loyola-gray-600 text-2xl"
                >
                  ×
                </button>
              </div>

              {/* Summary Stats */}
              <div className="mt-4 grid grid-cols-4 gap-4">
                <div className="bg-loyola-gray-50 p-3 rounded-lg">
                  <p className="text-xs text-loyola-gray-500">Score</p>
                  <p className="text-lg font-bold text-loyola-maroon">{Math.round(selectedSubmission.overall_score ?? 0)}%</p>
                </div>
                <div className="bg-loyola-gray-50 p-3 rounded-lg">
                  <p className="text-xs text-loyola-gray-500">Duration</p>
                  <p className="text-lg font-bold text-loyola-gray-800">{formatDuration(selectedSubmission.duration_s ?? 0)}</p>
                </div>
                <div className="bg-loyola-gray-50 p-3 rounded-lg">
                  <p className="text-xs text-loyola-gray-500">Overconfidence</p>
                  <p className="text-lg font-bold text-loyola-gray-800">{Number(selectedSubmission.overconfidence_index ?? 0).toFixed(2)}</p>
                </div>
                <div className="bg-loyola-gray-50 p-3 rounded-lg">
                  <p className="text-xs text-loyola-gray-500">Questions</p>
                  <p className="text-lg font-bold text-loyola-gray-800">{submissionDetail?.responses?.length || '...'}</p>
                </div>
              </div>

              {/* Tabs */}
              <div className="mt-4 flex gap-2">
                {['responses', 'profile', 'metadata'].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab as any)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                      activeTab === tab
                        ? 'bg-loyola-maroon text-white'
                        : 'bg-loyola-gray-100 text-loyola-gray-600 hover:bg-loyola-gray-200'
                    }`}
                  >
                    {tab.charAt(0).toUpperCase() + tab.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {isLoadingDetail ? (
                <div className="flex items-center justify-center py-12">
                  <RefreshCw className="w-8 h-8 text-loyola-maroon animate-spin" />
                </div>
              ) : (
                <>
                  {/* Responses Tab */}
                  {activeTab === 'responses' && submissionDetail && (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-loyola-gray-50">
                          <tr>
                            <th className="px-3 py-2 text-left">Q#</th>
                            <th className="px-3 py-2 text-left">Question</th>
                            <th className="px-3 py-2 text-left">Domain</th>
                            <th className="px-3 py-2 text-center">Answer</th>
                            <th className="px-3 py-2 text-center">Correct</th>
                            <th className="px-3 py-2 text-center">Score</th>
                            <th className="px-3 py-2 text-center">Confidence</th>
                          </tr>
                        </thead>
                        <tbody>
                          {submissionDetail.responses.map((r, idx) => (
                            <tr key={r.item_id} className={idx % 2 === 0 ? 'bg-white' : 'bg-loyola-gray-50'}>
                              <td className="px-3 py-2 font-medium">{r.item_id}</td>
                              <td className="px-3 py-2 max-w-xs truncate" title={r.question}>{r.question}</td>
                              <td className="px-3 py-2 text-xs">{r.domain || '-'}</td>
                              <td className="px-3 py-2 text-center font-mono">{String(r.answer).replace(/"/g, '')}</td>
                              <td className="px-3 py-2 text-center font-mono text-loyola-gray-500">{r.correct_answer || '-'}</td>
                              <td className={`px-3 py-2 text-center ${r.score === 100 ? 'text-green-600' : r.score === 0 ? 'text-red-600' : 'text-loyola-gray-500'}`}>
                                {r.is_scored ? (r.score !== null ? `${r.score}%` : '-') : 'N/A'}
                              </td>
                              <td className="px-3 py-2 text-center">{r.confidence || '-'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* Profile Tab */}
                  {activeTab === 'profile' && submissionDetail && (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {submissionDetail.profile ? (
                        <>
                          <div className="bg-loyola-gray-50 p-4 rounded-lg">
                            <p className="text-xs text-loyola-gray-500 mb-1">Gender</p>
                            <p className="font-medium">{submissionDetail.profile.gender || 'Not provided'}</p>
                          </div>
                          <div className="bg-loyola-gray-50 p-4 rounded-lg">
                            <p className="text-xs text-loyola-gray-500 mb-1">Age Range</p>
                            <p className="font-medium">{submissionDetail.profile.age_range || 'Not provided'}</p>
                          </div>
                          <div className="bg-loyola-gray-50 p-4 rounded-lg">
                            <p className="text-xs text-loyola-gray-500 mb-1">Race/Ethnicity</p>
                            <p className="font-medium">{submissionDetail.profile.race_ethnicity || 'Not provided'}</p>
                          </div>
                          <div className="bg-loyola-gray-50 p-4 rounded-lg">
                            <p className="text-xs text-loyola-gray-500 mb-1">First Language</p>
                            <p className="font-medium">{submissionDetail.profile.first_language || 'Not provided'}</p>
                          </div>
                          <div className="bg-loyola-gray-50 p-4 rounded-lg">
                            <p className="text-xs text-loyola-gray-500 mb-1">Work Experience</p>
                            <p className="font-medium">{submissionDetail.profile.work_experience || 'Not provided'}</p>
                          </div>
                          <div className="bg-loyola-gray-50 p-4 rounded-lg">
                            <p className="text-xs text-loyola-gray-500 mb-1">Financial Knowledge</p>
                            <p className="font-medium">{submissionDetail.profile.self_rated_financial_knowledge || 'Not provided'}</p>
                          </div>
                          <div className="bg-loyola-gray-50 p-4 rounded-lg">
                            <p className="text-xs text-loyola-gray-500 mb-1">Financial Stress</p>
                            <p className="font-medium">{submissionDetail.profile.financial_stress_frequency || 'Not provided'}</p>
                          </div>
                          <div className="bg-loyola-gray-50 p-4 rounded-lg">
                            <p className="text-xs text-loyola-gray-500 mb-1">Parental Education</p>
                            <p className="font-medium">{submissionDetail.profile.parental_education || 'Not provided'}</p>
                          </div>
                          <div className="bg-loyola-gray-50 p-4 rounded-lg">
                            <p className="text-xs text-loyola-gray-500 mb-1">First Gen College</p>
                            <p className="font-medium">{submissionDetail.profile.first_generation_college || 'Not provided'}</p>
                          </div>
                          <div className="bg-loyola-gray-50 p-4 rounded-lg">
                            <p className="text-xs text-loyola-gray-500 mb-1">Student Loans</p>
                            <p className="font-medium">{submissionDetail.profile.has_student_loan_debt || 'Not provided'}</p>
                          </div>
                          <div className="bg-loyola-gray-50 p-4 rounded-lg">
                            <p className="text-xs text-loyola-gray-500 mb-1">Research Consent</p>
                            <p className="font-medium">{submissionDetail.profile.research_consent ? 'Yes' : 'No'}</p>
                          </div>
                        </>
                      ) : (
                        <div className="col-span-3 text-center py-8 text-loyola-gray-500">
                          No profile data available for this student
                        </div>
                      )}
                    </div>
                  )}

                  {/* Metadata Tab */}
                  {activeTab === 'metadata' && submissionDetail && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="bg-loyola-gray-50 p-4 rounded-lg">
                          <p className="text-xs text-loyola-gray-500 mb-1">Started At</p>
                          <p className="font-medium text-sm">{formatDate(submissionDetail.submission.started_at)}</p>
                        </div>
                        <div className="bg-loyola-gray-50 p-4 rounded-lg">
                          <p className="text-xs text-loyola-gray-500 mb-1">Submitted At</p>
                          <p className="font-medium text-sm">{formatDate(submissionDetail.submission.submitted_at)}</p>
                        </div>
                        <div className="bg-loyola-gray-50 p-4 rounded-lg">
                          <p className="text-xs text-loyola-gray-500 mb-1">Tab Switches</p>
                          <p className="font-medium">{submissionDetail.submission.metadata?.tabSwitches ?? 0}</p>
                        </div>
                        <div className="bg-loyola-gray-50 p-4 rounded-lg">
                          <p className="text-xs text-loyola-gray-500 mb-1">Duration</p>
                          <p className="font-medium">{formatDuration(submissionDetail.submission.duration_s ?? 0)}</p>
                        </div>
                      </div>

                      {/* Domain Scores */}
                      <div>
                        <h4 className="font-semibold text-loyola-gray-700 mb-3">Domain Performance</h4>
                        <div className="space-y-3">
                          {Object.entries(selectedSubmission.domain_scores ?? {}).map(([domain, score]) => (
                            <div key={domain}>
                              <div className="flex justify-between items-center mb-1">
                                <span className="text-sm font-medium text-loyola-gray-700">{domain}</span>
                                <span className="text-sm text-loyola-gray-600">{Math.round((score ?? 0) * 100)}%</span>
                              </div>
                              <div className="w-full bg-loyola-gray-200 rounded-full h-2">
                                <div
                                  className="bg-gradient-to-r from-loyola-maroon to-loyola-gold h-2 rounded-full"
                                  style={{ width: `${(score ?? 0) * 100}%` }}
                                />
                              </div>
                            </div>
                          ))}
                          {Object.keys(selectedSubmission.domain_scores ?? {}).length === 0 && (
                            <p className="text-loyola-gray-500 text-sm">No domain scores available</p>
                          )}
                        </div>
                      </div>

                      {/* Raw Metadata */}
                      {submissionDetail.submission.metadata && Object.keys(submissionDetail.submission.metadata).length > 0 && (
                        <div>
                          <h4 className="font-semibold text-loyola-gray-700 mb-2">Raw Metadata</h4>
                          <pre className="bg-loyola-gray-50 p-4 rounded-lg text-xs overflow-x-auto">
                            {JSON.stringify(submissionDetail.submission.metadata, null, 2)}
                          </pre>
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
