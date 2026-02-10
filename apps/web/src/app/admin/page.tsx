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
  LogOut,
  RefreshCw,
  ChevronDown,
  ChevronRight,
  Map,
  ArrowRightLeft,
} from 'lucide-react';

type DashboardStats = {
  totalStudents: number;
  submitted: number;
  inProgress: number;
  activeNow: number;
  notStarted: number;
  avgScore: number;
  avgDuration: number;
  domainAverages: Array<{
    domain: string;
    shortName: string;
    average: number;
    count: number;
    correctRate: number;
    subdomains: Array<{
      name: string;
      avgScore: number;
      count: number;
    }>;
  }>;
  studentStatus: Array<{
    status: string;
    count: number;
    active_count: number;
    avg_score: number | null;
    avg_responses: number;
    min_hours_stale: number | null;
    max_hours_stale: number | null;
  }>;
};

type Course = {
  id: string;
  name: string;
  term: string;
  accessLevel: string;
};

const ADMIN_USER = 'gbolivard';

export default function AdminDashboardPage() {
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

    if (name !== ADMIN_USER) {
      router.push('/instructor/dashboard');
      return;
    }

    setInstructorName(name || 'Instructor');
    localStorage.setItem('active-portal', 'admin');
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
    localStorage.removeItem('active-portal');
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
          <RefreshCw className="w-12 h-12 text-ink animate-spin mx-auto mb-4" />
          <p className="text-loyola-gray-600">Loading admin dashboard...</p>
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
              <div className="flex items-center gap-2 mb-1">
                <h1 className="text-2xl font-bold text-ink">
                  Admin Dashboard
                </h1>
              </div>
              <p className="text-sm text-loyola-gray-600">
                Welcome back, {instructorName}
              </p>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={() => {
                  localStorage.setItem('active-portal', 'instructor');
                  router.push('/instructor/dashboard');
                }}
                className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-loyola-gray-600 hover:text-ink border border-loyola-gray-300 rounded-lg hover:border-ink transition"
                title="Switch to Instructor Portal"
              >
                <ArrowRightLeft className="w-4 h-4" />
                <span className="hidden sm:inline">Instructor Portal</span>
              </button>
              <button
                onClick={() => router.push('/instructor/status' as any)}
                className="p-2 text-loyola-gray-600 hover:text-ink transition"
                title="Gameboard Status"
              >
                <Map className="w-5 h-5" />
              </button>
              <button
                onClick={handleRefresh}
                className="p-2 text-loyola-gray-600 hover:text-ink transition"
                title="Refresh data"
              >
                <RefreshCw className="w-5 h-5" />
              </button>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 text-loyola-gray-700 hover:text-ink transition"
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
              className="px-4 py-2 border-2 border-loyola-gray-300 rounded-lg focus:ring-2 focus:ring-ink/20 focus:border-ink"
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
              />
              <StatCard
                icon={<UserCheck className="w-6 h-6" />}
                title="Submitted"
                value={stats.submitted}
              />
              <StatCard
                icon={<Activity className="w-6 h-6" />}
                title="In Progress"
                value={stats.inProgress}
                subtitle={`${stats.activeNow} active now`}
              />
              <StatCard
                icon={<Clock className="w-6 h-6" />}
                title="Onboarded"
                value={stats.notStarted}
              />
              <StatCard
                icon={<TrendingUp className="w-6 h-6" />}
                title="Average Score"
                value={`${stats.avgScore}%`}
              />
              <StatCard
                icon={<BarChart3 className="w-6 h-6" />}
                title="Avg Duration"
                value={`${Math.floor(stats.avgDuration / 60)}m`}
              />
            </div>

            {/* Student Status Table */}
            {stats.studentStatus && stats.studentStatus.length > 0 && (
              <StatusTable data={stats.studentStatus} />
            )}

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
              <ActionCard
                title="Documents"
                description="Shared files for download"
                href="/admin/documents"
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
}: {
  icon: React.ReactNode;
  title: string;
  value: string | number;
  subtitle?: string;
}) {
  return (
    <div className="bg-white rounded-xl shadow-md p-6">
      <div className="inline-flex p-3 rounded-lg bg-gray-100 text-gray-600 mb-4">
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
      className="w-full text-left bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition border-2 border-transparent hover:border-ink"
    >
      <h3 className="text-lg font-bold text-loyola-gray-800 mb-2">{title}</h3>
      <p className="text-sm text-loyola-gray-600">{description}</p>
    </button>
  );
}

// Status Table Component
function StatusTable({ data }: { data: DashboardStats['studentStatus'] }) {
  const [showSubmittedDetails, setShowSubmittedDetails] = useState(false);

  const submittedRows = data.filter(r => r.status.startsWith('Submitted'));
  const inProgressRows = data.filter(r => r.status.startsWith('In Progress'));
  const onboardedRows = data.filter(r => r.status.startsWith('Onboarded'));
  const totalSubmitted = submittedRows.reduce((sum, r) => sum + r.count, 0);
  const totalInProgress = inProgressRows.reduce((sum, r) => sum + r.count, 0);
  const totalOnboarded = onboardedRows.reduce((sum, r) => sum + r.count, 0);

  const submittedSummary = submittedRows.length > 0 ? {
    count: totalSubmitted,
    avg_score: totalSubmitted > 0
      ? Math.round(submittedRows.reduce((sum, r) => sum + (r.avg_score || 0) * r.count, 0) / totalSubmitted * 10) / 10
      : null,
    avg_responses: totalSubmitted > 0
      ? Math.round(submittedRows.reduce((sum, r) => sum + r.avg_responses * r.count, 0) / totalSubmitted)
      : 0
  } : null;

  const formatHoursStale = (hours: number | null) => {
    if (hours === null) return '—';
    if (hours < 1) return `${Math.round(hours * 60)}m`;
    if (hours < 24) return `${Math.round(hours)}h`;
    const days = Math.floor(hours / 24);
    const remainingHours = Math.round(hours % 24);
    return `${days}d ${remainingHours}h`;
  };

  const isStaleWarning = (status: string, hours: number | null) => {
    if (hours === null) return false;
    if (status.startsWith('In Progress')) return hours > 24;
    if (status.startsWith('Onboarded')) return hours > 48;
    return false;
  };

  return (
    <div className="bg-white rounded-xl shadow-md p-6 mb-8">
      <h2 className="text-xl font-bold text-loyola-gray-800 flex items-center gap-2 mb-6">
        <Users className="w-6 h-6 text-ink" />
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
              <th className="py-3 px-4 font-semibold text-loyola-gray-700 text-right">Min Stale</th>
              <th className="py-3 px-4 font-semibold text-loyola-gray-700 text-right">Max Stale</th>
            </tr>
          </thead>
          <tbody>
            {submittedSummary && (
              <>
                <tr
                  className="border-b border-loyola-gray-100 bg-green-50 cursor-pointer hover:bg-green-100 transition-colors"
                  onClick={() => setShowSubmittedDetails(!showSubmittedDetails)}
                >
                  <td className="py-3 px-4 font-medium">
                    <div className="flex items-center gap-2">
                      {showSubmittedDetails ? (
                        <ChevronDown className="w-4 h-4 text-gray-500" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-gray-500" />
                      )}
                      <span className="text-green-600">✓</span>
                      <span>Submitted</span>
                      {submittedRows.length > 1 && (
                        <span className="text-gray-500 text-sm">({submittedRows.length} types)</span>
                      )}
                    </div>
                  </td>
                  <td className="py-3 px-4 text-right font-semibold">{submittedSummary.count}</td>
                  <td className="py-3 px-4 text-right">{submittedSummary.avg_score ? `${submittedSummary.avg_score}%` : '—'}</td>
                  <td className="py-3 px-4 text-right">—</td>
                  <td className="py-3 px-4 text-right">—</td>
                  <td className="py-3 px-4 text-right">—</td>
                </tr>

                {showSubmittedDetails && submittedRows.map((row, idx) => (
                  <tr key={`sub-${idx}`} className="border-b border-loyola-gray-100 bg-gray-50 text-sm">
                    <td className="py-2 px-4 pl-12 text-gray-600">
                      ↳ {row.status.replace('Submitted ', '')}
                    </td>
                    <td className="py-2 px-4 text-right text-gray-600">{row.count}</td>
                    <td className="py-2 px-4 text-right text-gray-600">{row.avg_score ? `${row.avg_score}%` : '—'}</td>
                    <td className="py-2 px-4 text-right text-gray-600">—</td>
                    <td className="py-2 px-4 text-right text-gray-600">—</td>
                    <td className="py-2 px-4 text-right text-gray-600">—</td>
                  </tr>
                ))}
              </>
            )}

            {inProgressRows.map((row, idx) => (
              <tr key={`prog-${idx}`} className="border-b border-loyola-gray-100 bg-white severity-border-warning">
                <td className="py-3 px-4 font-medium">
                  <span className="status-badge status-badge--warning mr-2">●</span>
                  {row.status}
                </td>
                <td className="py-3 px-4 text-right">
                  {row.count}
                  {row.active_count > 0 && (
                    <span className="text-status-success text-xs ml-1">({row.active_count} active)</span>
                  )}
                </td>
                <td className="py-3 px-4 text-right">
                  {row.avg_score ? `${row.avg_score}%` : '—'}
                </td>
                <td className="py-3 px-4 text-right">{row.avg_responses}</td>
                <td className="py-3 px-4 text-right">
                  {formatHoursStale(row.min_hours_stale)}
                </td>
                <td className={`py-3 px-4 text-right ${
                  isStaleWarning(row.status, row.max_hours_stale) ? 'text-status-danger font-semibold' : ''
                }`}>
                  {formatHoursStale(row.max_hours_stale)}
                </td>
              </tr>
            ))}

            {onboardedRows.map((row, idx) => (
              <tr key={`onb-${idx}`} className="border-b border-loyola-gray-100 bg-white">
                <td className="py-3 px-4 font-medium">
                  <span className="status-badge bg-gray-100 text-gray-600 mr-2">○</span>
                  {row.status}
                </td>
                <td className="py-3 px-4 text-right">{row.count}</td>
                <td className="py-3 px-4 text-right">
                  {row.avg_score ? `${row.avg_score}%` : '—'}
                </td>
                <td className="py-3 px-4 text-right">{row.avg_responses}</td>
                <td className="py-3 px-4 text-right">
                  {formatHoursStale(row.min_hours_stale)}
                </td>
                <td className={`py-3 px-4 text-right ${
                  isStaleWarning(row.status, row.max_hours_stale) ? 'text-status-danger font-semibold' : ''
                }`}>
                  {formatHoursStale(row.max_hours_stale)}
                </td>
              </tr>
            ))}

            <tr className="border-t-2 border-loyola-gray-300 font-bold bg-loyola-gray-50">
              <td className="py-3 px-4">Total</td>
              <td className="py-3 px-4 text-right">{totalSubmitted + totalInProgress + totalOnboarded}</td>
              <td className="py-3 px-4 text-right" colSpan={4}>
                <span className="text-status-success">{totalSubmitted} submitted</span>
                {' / '}
                <span className="text-status-warning">{totalInProgress} in progress</span>
                {totalOnboarded > 0 && (
                  <>
                    {' / '}
                    <span className="text-gray-600">{totalOnboarded} onboarded</span>
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
