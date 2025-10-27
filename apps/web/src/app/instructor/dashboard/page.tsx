'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Users,
  FileText,
  TrendingUp,
  Clock,
  BarChart3,
  Download,
  LogOut,
  RefreshCw
} from 'lucide-react';

type DashboardStats = {
  totalAttempts: number;
  preAttempts: number;
  postAttempts: number;
  completedAttempts: number;
  uniqueStudents: number;
  avgScore: number;
  avgDuration: number;
  domainAverages: Array<{
    domain: string;
    average: number;
    count: number;
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <StatCard
                icon={<Users className="w-6 h-6" />}
                title="Total Students"
                value={stats.uniqueStudents}
                color="blue"
              />
              <StatCard
                icon={<FileText className="w-6 h-6" />}
                title="Total Attempts"
                value={stats.totalAttempts}
                subtitle={`${stats.preAttempts} pre, ${stats.postAttempts} post`}
                color="green"
              />
              <StatCard
                icon={<TrendingUp className="w-6 h-6" />}
                title="Average Score"
                value={`${stats.avgScore}%`}
                color="purple"
              />
              <StatCard
                icon={<Clock className="w-6 h-6" />}
                title="Avg Duration"
                value={`${Math.floor(stats.avgDuration / 60)}m`}
                subtitle={`${stats.avgDuration % 60}s`}
                color="orange"
              />
            </div>

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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
  href: string;
}) {
  return (
    <a
      href={href}
      className="block bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition border-2 border-transparent hover:border-loyola-maroon"
    >
      <h3 className="text-lg font-bold text-loyola-gray-800 mb-2">{title}</h3>
      <p className="text-sm text-loyola-gray-600">{description}</p>
    </a>
  );
}
