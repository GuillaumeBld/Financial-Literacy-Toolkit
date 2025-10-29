'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  BarChart3,
  TrendingUp,
  Users,
  Clock,
  Download,
  ArrowLeft,
  LogOut,
  RefreshCw,
  PieChart,
  Activity
} from 'lucide-react';

type AnalyticsData = {
  summary: {
    totalStudents: number;
    totalAttempts: number;
    avgScore: number;
    avgDuration: number;
    completionRate: number;
  };
  domainPerformance: Array<{
    domain: string;
    avgScore: number;
    attemptCount: number;
    improvement: number;
  }>;
  scoreDistribution: Array<{
    range: string;
    count: number;
    percentage: number;
  }>;
  timeAnalysis: Array<{
    period: string;
    attempts: number;
    avgScore: number;
  }>;
  studentProgress: Array<{
    studentId: string;
    preScore: number;
    postScore: number;
    improvement: number;
    attempts: number;
  }>;
};

export default function InstructorAnalyticsPage() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [courses, setCourses] = useState<Array<{id: string, name: string}>>([]);
  const [selectedCourse, setSelectedCourse] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [instructorName, setInstructorName] = useState('');
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('instructor-token');
    const name = localStorage.getItem('instructor-name');

    if (!token) {
      router.push('/instructor');
      return;
    }

    setInstructorName(name || 'Instructor');
    loadAnalytics(token);
  }, [router]);

  const loadAnalytics = async (token: string, courseId?: string) => {
    setIsLoading(true);
    try {
      const url = courseId
        ? `/api/instructor/analytics?courseId=${courseId}`
        : '/api/instructor/analytics';

      const response = await fetch(url, {
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
        throw new Error('Failed to load analytics');
      }

      const data = await response.json();
      setAnalytics(data.analytics);
      setCourses(data.courses || []);
      
      if (data.courses && data.courses.length > 0 && !selectedCourse) {
        setSelectedCourse(data.courses[0].id);
      }
    } catch (error) {
      console.error('Error loading analytics:', error);
      alert('Failed to load analytics data');
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
      loadAnalytics(token, selectedCourse);
    }
  };

  const handleCourseChange = (courseId: string) => {
    setSelectedCourse(courseId);
    const token = localStorage.getItem('instructor-token');
    if (token) {
      loadAnalytics(token, courseId);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-12 h-12 text-loyola-maroon animate-spin mx-auto mb-4" />
          <p className="text-loyola-gray-600">Loading analytics...</p>
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
                  Analytics & Reports
                </h1>
                <p className="text-sm text-loyola-gray-600">
                  Detailed statistical analysis and insights
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
        {/* Course Selector */}
        {courses.length > 0 && (
          <div className="mb-6">
            <label className="block text-sm font-semibold text-loyola-gray-700 mb-2">
              Select Course
            </label>
            <select
              value={selectedCourse}
              onChange={(e) => handleCourseChange(e.target.value)}
              className="px-4 py-2 border-2 border-loyola-gray-300 rounded-lg focus:ring-2 focus:ring-loyola-maroon focus:border-loyola-maroon"
            >
              {courses.map((course) => (
                <option key={course.id} value={course.id}>
                  {course.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {!analytics ? (
          <div className="text-center py-12">
            <p className="text-loyola-gray-600">No analytics data available</p>
          </div>
        ) : (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
              <StatCard
                icon={<Users className="w-6 h-6" />}
                title="Total Students"
                value={analytics.summary.totalStudents}
                color="blue"
              />
              <StatCard
                icon={<BarChart3 className="w-6 h-6" />}
                title="Total Attempts"
                value={analytics.summary.totalAttempts}
                color="green"
              />
              <StatCard
                icon={<TrendingUp className="w-6 h-6" />}
                title="Average Score"
                value={`${analytics.summary.avgScore}%`}
                color="purple"
              />
              <StatCard
                icon={<Clock className="w-6 h-6" />}
                title="Avg Duration"
                value={`${Math.floor(analytics.summary.avgDuration / 60)}m`}
                color="orange"
              />
              <StatCard
                icon={<Activity className="w-6 h-6" />}
                title="Completion Rate"
                value={`${analytics.summary.completionRate}%`}
                color="red"
              />
            </div>

            {/* Domain Performance */}
            <div className="bg-white rounded-xl shadow-md p-6 mb-8">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-loyola-gray-800 flex items-center gap-2">
                  <PieChart className="w-6 h-6 text-loyola-maroon" />
                  Domain Performance Analysis
                </h2>
                <button className="flex items-center gap-2 px-4 py-2 bg-loyola-maroon text-white rounded-lg hover:bg-loyola-maroon-dark transition">
                  <Download className="w-4 h-4" />
                  Export Report
                </button>
              </div>

              <div className="space-y-4">
                {analytics.domainPerformance.map((domain) => (
                  <div key={domain.domain}>
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-medium text-loyola-gray-700">
                        {domain.domain}
                      </span>
                      <div className="flex items-center gap-4 text-sm text-loyola-gray-600">
                        <span>Score: {Math.round(domain.avgScore)}%</span>
                        <span>Attempts: {domain.attemptCount}</span>
                        <span className={`font-medium ${
                          domain.improvement > 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {domain.improvement > 0 ? '+' : ''}{Math.round(domain.improvement)}%
                        </span>
                      </div>
                    </div>
                    <div className="w-full bg-loyola-gray-200 rounded-full h-3">
                      <div
                        className="bg-gradient-to-r from-loyola-maroon to-loyola-gold h-3 rounded-full transition-all duration-500"
                        style={{ width: `${domain.avgScore}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Score Distribution */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
              <div className="bg-white rounded-xl shadow-md p-6">
                <h3 className="text-lg font-bold text-loyola-gray-800 mb-4">
                  Score Distribution
                </h3>
                <div className="space-y-3">
                  {analytics.scoreDistribution.map((range) => (
                    <div key={range.range}>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm font-medium text-loyola-gray-700">
                          {range.range}
                        </span>
                        <span className="text-sm text-loyola-gray-600">
                          {range.count} ({range.percentage}%)
                        </span>
                      </div>
                      <div className="w-full bg-loyola-gray-200 rounded-full h-2">
                        <div
                          className="bg-loyola-maroon h-2 rounded-full transition-all duration-500"
                          style={{ width: `${range.percentage}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Student Progress */}
              <div className="bg-white rounded-xl shadow-md p-6">
                <h3 className="text-lg font-bold text-loyola-gray-800 mb-4">
                  Student Progress (Top 10)
                </h3>
                <div className="space-y-3 max-h-80 overflow-y-auto">
                  {analytics.studentProgress.slice(0, 10).map((student) => (
                    <div key={student.studentId} className="flex items-center justify-between p-3 bg-loyola-gray-50 rounded-lg">
                      <div>
                        <p className="text-sm font-medium text-loyola-gray-700">
                          {student.studentId}
                        </p>
                        <p className="text-xs text-loyola-gray-600">
                          {student.attempts} attempts
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-loyola-gray-700">
                          {Math.round(student.preScore)}% → {Math.round(student.postScore)}%
                        </p>
                        <p className={`text-xs font-medium ${
                          student.improvement > 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {student.improvement > 0 ? '+' : ''}{Math.round(student.improvement)}%
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Time Analysis */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <h3 className="text-lg font-bold text-loyola-gray-800 mb-4">
                Performance Over Time
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {analytics.timeAnalysis.map((period) => (
                  <div key={period.period} className="p-4 bg-loyola-gray-50 rounded-lg">
                    <h4 className="font-medium text-loyola-gray-700 mb-2">
                      {period.period}
                    </h4>
                    <p className="text-sm text-loyola-gray-600 mb-1">
                      Attempts: {period.attempts}
                    </p>
                    <p className="text-sm text-loyola-gray-600">
                      Avg Score: {Math.round(period.avgScore)}%
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}

// Stat Card Component
function StatCard({
  icon,
  title,
  value,
  color
}: {
  icon: React.ReactNode;
  title: string;
  value: string | number;
  color: string;
}) {
  const colorClasses = {
    blue: 'bg-blue-100 text-blue-600',
    green: 'bg-green-100 text-green-600',
    purple: 'bg-purple-100 text-purple-600',
    orange: 'bg-orange-100 text-orange-600',
    red: 'bg-red-100 text-red-600'
  };

  return (
    <div className="bg-white rounded-xl shadow-md p-6">
      <div className={`inline-flex p-3 rounded-lg ${colorClasses[color as keyof typeof colorClasses]} mb-4`}>
        {icon}
      </div>
      <h3 className="text-sm font-medium text-loyola-gray-600 mb-1">{title}</h3>
      <p className="text-3xl font-bold text-loyola-gray-900">{value}</p>
    </div>
  );
}
