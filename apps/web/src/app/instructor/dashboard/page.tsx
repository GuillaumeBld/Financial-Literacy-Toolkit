'use client';

import { useState, useEffect } from 'react';
import type { Route } from 'next';
import { useRouter } from 'next/navigation';
import {
  Users,
  UserCheck,
  Activity,
  TrendingUp,
  Clock,
  BarChart3,
  Download,
  LogOut,
  RefreshCw
} from 'lucide-react';

type DashboardStats = {
  totalStudents: number;
  submitted: number;
  inProgress: number;
  notStarted: number;
  avgScore: number;
  avgDuration: number;
  domainAverages: Array<{
    domain: string;
    average: number;
    count: number;
  }>;
  studentStatus: Array<{
    status: string;
    count: number;
    avg_score: number | null;
    avg_responses: number;
    max_hours_stale: number | null;
  }>;
};

type Course = {
  id: string;
  name: string;
  term: string;
  accessLevel: string;
};

export default function InstructorDashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
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
    loadDashboardData(token);
  }, [router]);

  const loadDashboardData = async (token: string, courseId?: string) => {
    setIsLoading(true);
    try {
      const url = courseId
        ? `/api/instructor/dashboard?courseId=${courseId}`
        : '/api/instructor/dashboard';

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
        throw new Error('Failed to load dashboard data');
      }

      const data = await response.json();
      setStats(data.stats);
      setCourses(data.courses || []);
      if (data.courses && data.courses.length > 0 && !selectedCourse) {
        setSelectedCourse(data.courses[0].id);
      }
    } catch (error) {
      console.error('Error loading dashboard:', error);
      alert('Failed to load dashboard data');
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
      loadDashboardData(token, selectedCourse);
    }
  };

  const handleCourseChange = (courseId: string) => {
    setSelectedCourse(courseId);
    const token = localStorage.getItem('instructor-token');
    if (token) {
      loadDashboardData(token, courseId);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-12 h-12 text-loyola-maroon animate-spin mx-auto mb-4" />
          <p className="text-loyola-gray-600">Loading dashboard...</p>
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
            <div>
              <h1 className="text-2xl font-bold text-loyola-maroon">
                Instructor Dashboard
              </h1>
              <p className="text-sm text-loyola-gray-600">
                Welcome back, {instructorName}
              </p>
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
                  {course.name} ({course.term})
                </option>
              ))}
            </select>
          </div>
        )}

        {!stats ? (
          <div className="text-center py-12">
            <p className="text-loyola-gray-600">No data available</p>
          </div>
        ) : (
          <>
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6 mb-8">
              <StatCard
                icon={<Users className="w-6 h-6" />}
                title="Total Students"
                value={stats.totalStudents}
                color="blue"
              />
              <StatCard
                icon={<UserCheck className="w-6 h-6" />}
                title="Submitted"
                value={stats.submitted}
                color="green"
              />
              <StatCard
                icon={<Activity className="w-6 h-6" />}
                title="In Progress"
                value={stats.inProgress}
                color="orange"
              />
              <StatCard
                icon={<Clock className="w-6 h-6" />}
                title="Not Started"
                value={stats.notStarted}
                color="red"
              />
              <StatCard
                icon={<TrendingUp className="w-6 h-6" />}
                title="Average Score"
                value={`${stats.avgScore}%`}
                color="purple"
              />
              <StatCard
                icon={<BarChart3 className="w-6 h-6" />}
                title="Avg Duration"
                value={`${Math.floor(stats.avgDuration / 60)}m`}
                color="blue"
              />
            </div>

            {/* Student Status Table */}
            {stats.studentStatus && stats.studentStatus.length > 0 && (
              <StatusTable data={stats.studentStatus} />
            )}

            {/* Domain Breakdown */}
            <div className="bg-white rounded-xl shadow-md p-6 mb-8">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-loyola-gray-800 flex items-center gap-2">
                  <BarChart3 className="w-6 h-6 text-loyola-maroon" />
                  Performance by Domain
                </h2>
                <button
                  className="flex items-center gap-2 px-4 py-2 bg-loyola-maroon text-white rounded-lg hover:bg-loyola-maroon-dark transition"
                >
                  <Download className="w-4 h-4" />
                  Export Data
                </button>
              </div>

              <div className="space-y-4">
                {stats.domainAverages.map((domain) => (
                  <div key={domain.domain}>
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-medium text-loyola-gray-700">
                        {domain.domain}
                      </span>
                      <span className="text-sm text-loyola-gray-600">
                        {Math.round(domain.average)}% ({domain.count} responses)
                      </span>
                    </div>
                    <div className="w-full bg-loyola-gray-200 rounded-full h-3">
                      <div
                        className="bg-gradient-to-r from-loyola-maroon to-loyola-gold h-3 rounded-full transition-all duration-500"
                        style={{ width: `${domain.average}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <ActionCard
                title="View All Submissions"
                description="Review individual student responses"
                href="/instructor/submissions"
              />
              <ActionCard
                title="Manage Questions"
                description="Add, edit, or remove assessment items"
                href="/instructor/questions"
              />
              <ActionCard
                title="Analytics & Reports"
                description="Detailed statistical analysis"
                href="/instructor/analytics"
              />
              <ActionCard
                title="Plan B Settings"
                description="Configure Google Forms fallback"
                href="/instructor/plan-b"
              />
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
  subtitle,
  color
}: {
  icon: React.ReactNode;
  title: string;
  value: string | number;
  subtitle?: string;
  color: string;
}) {
  const colorClasses = {
    blue: 'bg-blue-100 text-blue-600',
    green: 'bg-green-100 text-green-600',
    purple: 'bg-purple-100 text-purple-600',
    orange: 'bg-orange-100 text-orange-600'
  };

  return (
    <div className="bg-white rounded-xl shadow-md p-6">
      <div className={`inline-flex p-3 rounded-lg ${colorClasses[color as keyof typeof colorClasses]} mb-4`}>
        {icon}
      </div>
      <h3 className="text-sm font-medium text-loyola-gray-600 mb-1">{title}</h3>
      <p className="text-3xl font-bold text-loyola-gray-900">{value}</p>
      {subtitle && (
        <p className="text-sm text-loyola-gray-500 mt-1">{subtitle}</p>
      )}
    </div>
  );
}

// Action Card Component
function ActionCard({
  title,
  description,
  href
}: {
  title: string;
  description: string;
  href: Route;
}) {
  const router = useRouter();

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    router.push(href);
  };

  return (
    <button
      onClick={handleClick}
      className="w-full text-left bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition border-2 border-transparent hover:border-loyola-maroon"
    >
      <h3 className="text-lg font-bold text-loyola-gray-800 mb-2">{title}</h3>
      <p className="text-sm text-loyola-gray-600">{description}</p>
    </button>
  );
}

// Status Table Component
function StatusTable({ data }: { data: DashboardStats['studentStatus'] }) {
  const submittedRows = data.filter(r => r.status.startsWith('Submitted'));
  const inProgressRows = data.filter(r => r.status.startsWith('In Progress'));
  const onboardedRows = data.filter(r => r.status.startsWith('Onboarded'));
  const totalSubmitted = submittedRows.reduce((sum, r) => sum + r.count, 0);
  const totalInProgress = inProgressRows.reduce((sum, r) => sum + r.count, 0);
  const totalOnboarded = onboardedRows.reduce((sum, r) => sum + r.count, 0);

  // Format hours stale for display
  const formatHoursStale = (hours: number | null) => {
    if (hours === null) return '—';
    if (hours < 1) return `${Math.round(hours * 60)}m`;
    if (hours < 24) return `${Math.round(hours)}h`;
    const days = Math.floor(hours / 24);
    const remainingHours = Math.round(hours % 24);
    return `${days}d ${remainingHours}h`;
  };

  // Determine if hours stale is concerning (>24h for in-progress, >48h for onboarded)
  const isStaleWarning = (status: string, hours: number | null) => {
    if (hours === null) return false;
    if (status.startsWith('In Progress')) return hours > 24;
    if (status.startsWith('Onboarded')) return hours > 48;
    return false;
  };

  return (
    <div className="bg-white rounded-xl shadow-md p-6 mb-8">
      <h2 className="text-xl font-bold text-loyola-gray-800 flex items-center gap-2 mb-6">
        <Users className="w-6 h-6 text-loyola-maroon" />
        Student Progress Status
      </h2>
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b-2 border-loyola-gray-200">
              <th className="py-3 px-4 font-semibold text-loyola-gray-700">Status</th>
              <th className="py-3 px-4 font-semibold text-loyola-gray-700 text-right">Students</th>
              <th className="py-3 px-4 font-semibold text-loyola-gray-700 text-right">Avg Score</th>
              <th className="py-3 px-4 font-semibold text-loyola-gray-700 text-right">Avg Responses</th>
              <th className="py-3 px-4 font-semibold text-loyola-gray-700 text-right">Max Stale</th>
            </tr>
          </thead>
          <tbody>
            {data.map((row, idx) => (
              <tr key={idx} className={`border-b border-loyola-gray-100 ${
                row.status.startsWith('Submitted') ? 'bg-green-50' :
                row.status.startsWith('Onboarded') ? 'bg-blue-50' : 'bg-amber-50'
              }`}>
                <td className="py-3 px-4 font-medium">{row.status}</td>
                <td className="py-3 px-4 text-right">{row.count}</td>
                <td className="py-3 px-4 text-right">
                  {row.avg_score ? `${row.avg_score}%` : '—'}
                </td>
                <td className="py-3 px-4 text-right">{row.avg_responses}</td>
                <td className={`py-3 px-4 text-right ${
                  isStaleWarning(row.status, row.max_hours_stale) ? 'text-red-600 font-semibold' : ''
                }`}>
                  {formatHoursStale(row.max_hours_stale)}
                </td>
              </tr>
            ))}
            <tr className="border-t-2 border-loyola-gray-300 font-bold bg-loyola-gray-50">
              <td className="py-3 px-4">Total</td>
              <td className="py-3 px-4 text-right">{totalSubmitted + totalInProgress + totalOnboarded}</td>
              <td className="py-3 px-4 text-right" colSpan={3}>
                <span className="text-green-600">{totalSubmitted} submitted</span>
                {' / '}
                <span className="text-amber-600">{totalInProgress} in progress</span>
                {totalOnboarded > 0 && (
                  <>
                    {' / '}
                    <span className="text-blue-600">{totalOnboarded} onboarded</span>
                  </>
                )}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
