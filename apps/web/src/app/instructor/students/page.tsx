'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Search,
  Key,
  Mail,
  User,
  RefreshCw,
  LogOut,
  AlertCircle,
  CheckCircle,
  ArrowLeft,
} from 'lucide-react';
import Link from 'next/link';

type Student = {
  userId: string;
  email: string;
  hasPassword: boolean;
};

export default function InstructorStudentsPage() {
  const router = useRouter();
  const [students, setStudents] = useState<Student[]>([]);
  const [courses, setCourses] = useState<Array<{ id: string; name: string }>>([]);
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('instructor-token');
    if (!token) {
      router.push('/instructor');
      return;
    }

    loadCourses(token);
  }, [router]);

  const loadCourses = async (token: string) => {
    try {
      const response = await fetch('/api/instructor/dashboard', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem('instructor-token');
          router.push('/instructor');
          return;
        }
        throw new Error('Failed to load courses');
      }

      const data = await response.json();
      setCourses(data.courses || []);
      if (data.courses && data.courses.length > 0) {
        setSelectedCourseId(data.courses[0].id);
        loadStudents(data.courses[0].id);
      }
    } catch (error) {
      console.error('Error loading courses:', error);
      setError('Failed to load courses');
    }
  };

  const loadStudents = async (courseId: string) => {
    if (!courseId) return;

    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      const token = localStorage.getItem('instructor-token');
      if (!token) {
        router.push('/instructor');
        return;
      }

      const response = await fetch(
        `/api/instructor/reset-student-password?courseId=${courseId}&search=${encodeURIComponent(searchTerm)}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to search students');
      }

      const data = await response.json();
      setStudents(data.students || []);
    } catch (error: any) {
      console.error('Error searching students:', error);
      setError(error.message || 'Failed to search students');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedCourseId) {
      loadStudents(selectedCourseId);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!selectedStudent || !newPassword || !confirmPassword) {
      setError('Please fill in all fields');
      return;
    }

    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setIsResetting(true);

    try {
      const token = localStorage.getItem('instructor-token');
      if (!token) {
        router.push('/instructor');
        return;
      }

      const response = await fetch('/api/instructor/reset-student-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          courseId: selectedCourseId,
          studentEmail: selectedStudent.email,
          newPassword: newPassword.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to reset password');
      }

      setSuccess(`Password reset successfully for ${selectedStudent.email}`);
      setSelectedStudent(null);
      setNewPassword('');
      setConfirmPassword('');
      
      // Refresh student list
      setTimeout(() => {
        loadStudents(selectedCourseId);
      }, 1000);
    } catch (error: any) {
      console.error('Password reset error:', error);
      setError(error.message || 'Failed to reset password');
    } finally {
      setIsResetting(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('instructor-token');
    localStorage.removeItem('instructor-name');
    router.push('/instructor');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-loyola-gray-200">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <Link
                href="/instructor/dashboard"
                className="p-2 text-loyola-gray-600 hover:text-loyola-maroon transition"
              >
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-loyola-maroon">Student Password Management</h1>
                <p className="text-sm text-loyola-gray-600">Reset student passwords for your courses</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 text-loyola-gray-700 hover:text-loyola-maroon transition"
            >
              <LogOut className="w-5 h-5" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-6xl">
        {error && (
          <div className="mb-6 bg-red-50 border-2 border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-start gap-2">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="mb-6 bg-green-50 border-2 border-green-200 text-green-700 px-4 py-3 rounded-lg flex items-start gap-2">
            <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <span>{success}</span>
          </div>
        )}

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Left: Search and Student List */}
          <div className="bg-white rounded-xl shadow-md p-6 border border-loyola-gray-200">
            <h2 className="text-xl font-bold text-loyola-gray-900 mb-4">Find Student</h2>

            <div className="mb-4">
              <label htmlFor="course-select" className="block text-sm font-medium text-gray-700 mb-2">
                Course
              </label>
              <select
                id="course-select"
                value={selectedCourseId}
                onChange={(e) => {
                  setSelectedCourseId(e.target.value);
                  setStudents([]);
                  setSearchTerm('');
                }}
                className="w-full px-4 py-3 border-2 border-loyola-gray-300 rounded-lg focus:ring-2 focus:ring-loyola-maroon focus:border-loyola-maroon transition"
              >
                <option value="">Select a course</option>
                {courses.map((course) => (
                  <option key={course.id} value={course.id}>
                    {course.name}
                  </option>
                ))}
              </select>
            </div>

            <form onSubmit={handleSearch} className="mb-4">
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-5 w-5 text-loyola-gray-400" />
                  </div>
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border-2 border-loyola-gray-300 rounded-lg focus:ring-2 focus:ring-loyola-maroon focus:border-loyola-maroon transition"
                    placeholder="Search by email address"
                  />
                </div>
                <button
                  type="submit"
                  disabled={!selectedCourseId || isLoading}
                  className="bg-loyola-maroon hover:bg-loyola-maroon-dark text-white font-medium px-6 py-3 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <RefreshCw className="w-5 h-5 animate-spin" />
                  ) : (
                    <Search className="w-5 h-5" />
                  )}
                </button>
              </div>
            </form>

            {students.length > 0 && (
              <div className="border-t border-loyola-gray-200 pt-4">
                <h3 className="text-sm font-semibold text-loyola-gray-700 mb-2">Search Results</h3>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {students.map((student) => (
                    <button
                      key={student.userId}
                      onClick={() => setSelectedStudent(student)}
                      className={`w-full text-left p-3 rounded-lg border-2 transition ${
                        selectedStudent?.userId === student.userId
                          ? 'border-loyola-maroon bg-loyola-maroon/5'
                          : 'border-loyola-gray-200 hover:border-loyola-maroon/30'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Mail className="w-4 h-4 text-loyola-gray-500" />
                          <span className="font-medium text-loyola-gray-900">{student.email}</span>
                        </div>
                        {student.hasPassword ? (
                          <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                            Has Password
                          </span>
                        ) : (
                          <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">
                            No Password
                          </span>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {searchTerm && students.length === 0 && !isLoading && (
              <div className="text-center py-8 text-loyola-gray-500">
                <User className="w-12 h-12 mx-auto mb-2 text-loyola-gray-400" />
                <p>No students found matching "{searchTerm}"</p>
              </div>
            )}
          </div>

          {/* Right: Reset Password Form */}
          <div className="bg-white rounded-xl shadow-md p-6 border border-loyola-gray-200">
            <h2 className="text-xl font-bold text-loyola-gray-900 mb-4">Reset Password</h2>

            {selectedStudent ? (
              <form onSubmit={handleResetPassword}>
                <div className="mb-4 p-4 bg-loyola-gold/10 border-2 border-loyola-gold/30 rounded-lg">
                  <p className="text-sm font-semibold text-loyola-gray-700 mb-1">Selected Student</p>
                  <p className="text-loyola-gray-900">{selectedStudent.email}</p>
                </div>

                <div className="mb-4">
                  <label htmlFor="new-password" className="block text-sm font-medium text-gray-700 mb-2">
                    New Password <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Key className="h-5 w-5 text-loyola-gray-400" />
                    </div>
                    <input
                      type="password"
                      id="new-password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 border-2 border-loyola-gray-300 rounded-lg focus:ring-2 focus:ring-loyola-maroon focus:border-loyola-maroon transition"
                      placeholder="Enter new password (min 8 characters)"
                      required
                    />
                  </div>
                  <p className="mt-1 text-sm text-loyola-gray-500">
                    Password must be at least 8 characters long
                  </p>
                </div>

                <div className="mb-6">
                  <label htmlFor="confirm-password" className="block text-sm font-medium text-gray-700 mb-2">
                    Confirm Password <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Key className="h-5 w-5 text-loyola-gray-400" />
                    </div>
                    <input
                      type="password"
                      id="confirm-password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 border-2 border-loyola-gray-300 rounded-lg focus:ring-2 focus:ring-loyola-maroon focus:border-loyola-maroon transition"
                      placeholder="Confirm new password"
                      required
                    />
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    type="submit"
                    disabled={isResetting}
                    className="flex-1 bg-loyola-maroon hover:bg-loyola-maroon-dark text-white font-medium py-3 px-6 rounded-lg transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isResetting ? (
                      <>
                        <RefreshCw className="w-5 h-5 animate-spin" />
                        Resetting...
                      </>
                    ) : (
                      <>
                        <Key className="w-5 h-5" />
                        Reset Password
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedStudent(null);
                      setNewPassword('');
                      setConfirmPassword('');
                    }}
                    className="border-2 border-loyola-gray-300 text-loyola-gray-700 hover:bg-loyola-gray-50 font-medium py-3 px-6 rounded-lg transition"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <div className="text-center py-12 text-loyola-gray-500">
                <Key className="w-16 h-16 mx-auto mb-4 text-loyola-gray-400" />
                <p className="font-medium mb-2">No student selected</p>
                <p className="text-sm">Search and select a student from the list to reset their password</p>
              </div>
            )}

            <div className="mt-6 pt-6 border-t border-loyola-gray-200">
              <div className="bg-loyola-gold/10 border-2 border-loyola-gold/30 rounded-lg p-4">
                <p className="text-sm text-loyola-gray-700">
                  <strong>Note:</strong> After resetting a password, provide the new password to the student securely (in person or via secure communication). The student can change their password after logging in.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

