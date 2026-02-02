'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  LogOut,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  ExternalLink,
  Save,
} from 'lucide-react';

type PlanBSetting = {
  course_id: string;
  course_name: string;
  is_active: boolean;
  active_level: string | null;
  url_full: string | null;
  url_assessment_only: string | null;
  url_minimal: string | null;
  updated_at: string | null;
};

const LEVEL_OPTIONS = [
  {
    value: 'full',
    label: 'Full Flow',
    description: 'Onboarding + 40 questions + confidence ratings',
  },
  {
    value: 'assessment_only',
    label: 'Assessment Only',
    description: '40 questions + confidence ratings',
  },
  {
    value: 'minimal',
    label: 'Minimal',
    description: '40 questions only, no confidence or demographics',
  },
];

export default function PlanBSettingsPage() {
  const [settings, setSettings] = useState<PlanBSetting[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [instructorName, setInstructorName] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  // Local edits keyed by course_id
  const [edits, setEdits] = useState<Record<string, Partial<PlanBSetting>>>({});
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('instructor-token');
    const name = localStorage.getItem('instructor-name');

    if (!token) {
      router.push('/instructor');
      return;
    }

    setInstructorName(name || 'Instructor');
    loadSettings(token);
  }, [router]);

  const loadSettings = async (token: string) => {
    setIsLoading(true);
    setError('');
    try {
      const response = await fetch('/api/instructor/plan-b', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem('instructor-token');
          router.push('/instructor');
          return;
        }
        throw new Error('Failed to load settings');
      }

      const data = await response.json();
      setSettings(data.settings || []);
      setEdits({});
    } catch (err: any) {
      setError(err.message || 'Failed to load Plan B settings');
    } finally {
      setIsLoading(false);
    }
  };

  const getEditedSetting = (setting: PlanBSetting): PlanBSetting => {
    const edit = edits[setting.course_id];
    if (!edit) return setting;
    return { ...setting, ...edit };
  };

  const updateEdit = (courseId: string, changes: Partial<PlanBSetting>) => {
    setEdits((prev) => ({
      ...prev,
      [courseId]: { ...prev[courseId], ...changes },
    }));
    setSuccess('');
  };

  const handleSave = async (courseId: string) => {
    const token = localStorage.getItem('instructor-token');
    if (!token) return;

    const setting = settings.find((s) => s.course_id === courseId);
    if (!setting) return;

    const edited = getEditedSetting(setting);

    setIsSaving(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch('/api/instructor/plan-b', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          courseId,
          isActive: edited.is_active,
          activeLevel: edited.active_level,
          urlFull: edited.url_full,
          urlAssessmentOnly: edited.url_assessment_only,
          urlMinimal: edited.url_minimal,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to save settings');
      }

      setSuccess(`Plan B settings saved for ${edited.course_name}`);
      // Reload to get fresh data
      await loadSettings(token);
    } catch (err: any) {
      setError(err.message || 'Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('instructor-token');
    localStorage.removeItem('instructor-name');
    router.push('/instructor');
  };

  const handleRefresh = () => {
    const token = localStorage.getItem('instructor-token');
    if (token) loadSettings(token);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-12 h-12 text-loyola-maroon animate-spin mx-auto mb-4" />
          <p className="text-loyola-gray-600">Loading Plan B settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-loyola-gray-200 sticky top-0 z-20">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push('/instructor/dashboard')}
                className="flex items-center gap-1 text-loyola-gray-600 hover:text-loyola-maroon transition"
              >
                <ArrowLeft className="w-5 h-5" />
                <span className="text-sm">Dashboard</span>
              </button>
              <div>
                <h1 className="text-2xl font-bold text-loyola-maroon">Plan B Settings</h1>
                <p className="text-sm text-loyola-gray-600">
                  Configure Google Forms fallback for your courses
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

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Info banner */}
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-amber-800">
              When Plan B is active, students will be redirected to your Google Form instead of using
              the platform.
            </p>
            <p className="text-sm text-amber-700 mt-1">
              Only enable this if the assessment platform is experiencing issues.
            </p>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-6 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl mb-6 flex items-start gap-3">
            <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <span>{success}</span>
          </div>
        )}

        {settings.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-loyola-gray-600">No courses assigned to your account.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {settings.map((setting) => {
              const edited = getEditedSetting(setting);
              const hasChanges = !!edits[setting.course_id];

              return (
                <div
                  key={setting.course_id}
                  className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden"
                >
                  {/* Course header */}
                  <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <h2 className="text-lg font-bold text-loyola-gray-800">
                        {setting.course_name}
                      </h2>
                      {edited.is_active ? (
                        <span className="px-2.5 py-1 text-xs font-semibold bg-red-100 text-red-700 rounded-full">
                          Plan B Active
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 text-xs font-semibold bg-gray-100 text-gray-500 rounded-full">
                          Plan B Inactive
                        </span>
                      )}
                    </div>
                    {setting.updated_at && (
                      <span className="text-xs text-loyola-gray-500">
                        Last updated: {new Date(setting.updated_at).toLocaleDateString()}
                      </span>
                    )}
                  </div>

                  <div className="p-6 space-y-6">
                    {/* Toggle */}
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-loyola-gray-800">Enable Plan B</p>
                        <p className="text-sm text-loyola-gray-500">
                          Redirect students to a Google Form
                        </p>
                      </div>
                      <button
                        onClick={() =>
                          updateEdit(setting.course_id, { is_active: !edited.is_active })
                        }
                        className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${
                          edited.is_active ? 'bg-red-500' : 'bg-gray-300'
                        }`}
                      >
                        <span
                          className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
                            edited.is_active ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>

                    {/* Level selector */}
                    <div>
                      <p className="font-medium text-loyola-gray-800 mb-3">Fallback Level</p>
                      <div className="space-y-3">
                        {LEVEL_OPTIONS.map((level) => {
                          const urlKey = `url_${level.value}` as keyof PlanBSetting;
                          const currentUrl = (edited[urlKey] as string) || '';

                          return (
                            <div
                              key={level.value}
                              className={`border rounded-xl p-4 transition-all ${
                                edited.active_level === level.value
                                  ? 'border-loyola-maroon bg-loyola-maroon/5'
                                  : 'border-gray-200'
                              }`}
                            >
                              <label className="flex items-start gap-3 cursor-pointer">
                                <input
                                  type="radio"
                                  name={`level-${setting.course_id}`}
                                  checked={edited.active_level === level.value}
                                  onChange={() =>
                                    updateEdit(setting.course_id, { active_level: level.value })
                                  }
                                  className="mt-1 accent-loyola-maroon"
                                />
                                <div className="flex-1">
                                  <p className="font-medium text-loyola-gray-800">{level.label}</p>
                                  <p className="text-sm text-loyola-gray-500">{level.description}</p>

                                  {/* URL input */}
                                  <div className="mt-3">
                                    <div className="flex items-center gap-2">
                                      <input
                                        type="url"
                                        value={currentUrl}
                                        onChange={(e) =>
                                          updateEdit(setting.course_id, {
                                            [urlKey]: e.target.value,
                                          } as any)
                                        }
                                        className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-loyola-maroon/20 focus:border-loyola-maroon transition-all"
                                        placeholder="https://docs.google.com/forms/d/e/..."
                                      />
                                      {currentUrl && (
                                        <a
                                          href={currentUrl}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="p-2 text-loyola-gray-500 hover:text-loyola-maroon transition"
                                          title="Open form in new tab"
                                        >
                                          <ExternalLink className="w-4 h-4" />
                                        </a>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </label>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Save button */}
                    <div className="flex justify-end pt-2">
                      <button
                        onClick={() => handleSave(setting.course_id)}
                        disabled={isSaving || !hasChanges}
                        className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-semibold transition-all ${
                          hasChanges
                            ? 'bg-loyola-maroon hover:bg-loyola-maroon-dark text-white shadow-lg shadow-loyola-maroon/20'
                            : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                        }`}
                      >
                        {isSaving ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            Saving...
                          </>
                        ) : (
                          <>
                            <Save className="w-4 h-4" />
                            Save Settings
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
