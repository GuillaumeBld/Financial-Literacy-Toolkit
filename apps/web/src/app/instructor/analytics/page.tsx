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
  Activity,
  AlertTriangle,
  GraduationCap,
  DollarSign,
  Brain,
  Heart,
  Wallet,
  UserCheck,
  ChevronDown,
  ChevronRight,
  MessageSquare
} from 'lucide-react';

type DistributionItem = {
  label: string;
  count: number;
  percentage: number;
};

type AnalyticsData = {
  summary: {
    totalStudents: number;
    submitted: number;
    inProgress: number;
    notStarted: number;
    avgScore: number;
    avgDuration: number;
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
  baselineCovariates?: {
    totalProfiles: number;
    demographics: {
      gender: DistributionItem[];
      raceEthnicity: DistributionItem[];
      ageRange: DistributionItem[];
      firstLanguage: DistributionItem[];
      workExperience: DistributionItem[];
    };
    financialBackground: {
      priorFinancialProducts: DistributionItem[];
      selfRatedKnowledge: DistributionItem[];
      financialStress: DistributionItem[];
      parentalEducation: DistributionItem[];
      firstGenerationCollege: DistributionItem[];
    };
    studentLoans: {
      hasDebt: DistributionItem[];
      interestRate: DistributionItem[];
      maturity: DistributionItem[];
      totalWithLoans: number;
    };
  };
  riskProfiles?: {
    overconfidence: {
      average: number | null;
      distribution: {
        underconfident: number;
        low: number;
        moderate: number;
        high: number;
      };
      totalMeasured: number;
    };
    financialStress: {
      highStressCount: number;
      highStressPercentage: number;
    };
    atRiskIndicators: {
      lowKnowledgeHighStress: number;
      firstGenWithLoans: number;
      highInterestLoans: number;
      totalAtRisk: number;
    };
    riskTolerance?: {
      conservative: number;
      moderate: number;
      aggressive: number;
      totalResponses: number;
    };
    behavioralIndicators?: {
      lossAversion: { high: number; moderate: number; low: number; totalResponses: number };
      herdingTendency: { high: number; moderate: number; low: number; totalResponses: number };
      emotionalControl: { high: number; moderate: number; low: number; totalResponses: number };
    };
    preferenceResponses?: Array<{
      questionId: string;
      questionText: string;
      category: string;
      options: { id: string; text: string }[];
      responses: Array<{ answer: string; answerText: string; count: number; percentage: number }>;
      totalResponses: number;
    }>;
  };
};

export default function InstructorAnalyticsPage() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [courses, setCourses] = useState<Array<{id: string, name: string}>>([]);
  const [selectedCourse, setSelectedCourse] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [instructorName, setInstructorName] = useState('');
  const [activeTab, setActiveTab] = useState<'performance' | 'baseline' | 'risk'>('performance');
  const [expandedSection, setExpandedSection] = useState<string | null>('demographics');
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

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section);
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6 mb-8">
              <StatCard
                icon={<Users className="w-6 h-6" />}
                title="Total Students"
                value={analytics.summary.totalStudents}
                color="blue"
              />
              <StatCard
                icon={<UserCheck className="w-6 h-6" />}
                title="Submitted"
                value={analytics.summary.submitted}
                color="green"
              />
              <StatCard
                icon={<Activity className="w-6 h-6" />}
                title="In Progress"
                value={analytics.summary.inProgress}
                color="amber"
              />
              <StatCard
                icon={<Clock className="w-6 h-6" />}
                title="Onboarded"
                value={analytics.summary.notStarted}
                color="purple"
              />
              <StatCard
                icon={<TrendingUp className="w-6 h-6" />}
                title="Average Score"
                value={`${analytics.summary.avgScore}%`}
                color="blue"
              />
              <StatCard
                icon={<BarChart3 className="w-6 h-6" />}
                title="Avg Duration"
                value={`${Math.floor(analytics.summary.avgDuration / 60)}m`}
                color="purple"
              />
            </div>

            {/* Tab Navigation */}
            <div className="flex gap-2 mb-6 border-b border-gray-200">
              <button
                onClick={() => setActiveTab('performance')}
                className={`px-6 py-3 font-medium transition-colors border-b-2 -mb-px ${
                  activeTab === 'performance'
                    ? 'text-loyola-maroon border-loyola-maroon'
                    : 'text-gray-500 border-transparent hover:text-gray-700'
                }`}
              >
                <span className="flex items-center gap-2">
                  <PieChart className="w-4 h-4" />
                  Performance
                </span>
              </button>
              <button
                onClick={() => setActiveTab('baseline')}
                className={`px-6 py-3 font-medium transition-colors border-b-2 -mb-px ${
                  activeTab === 'baseline'
                    ? 'text-loyola-maroon border-loyola-maroon'
                    : 'text-gray-500 border-transparent hover:text-gray-700'
                }`}
              >
                <span className="flex items-center gap-2">
                  <GraduationCap className="w-4 h-4" />
                  Baseline Covariates
                </span>
              </button>
              <button
                onClick={() => setActiveTab('risk')}
                className={`px-6 py-3 font-medium transition-colors border-b-2 -mb-px ${
                  activeTab === 'risk'
                    ? 'text-loyola-maroon border-loyola-maroon'
                    : 'text-gray-500 border-transparent hover:text-gray-700'
                }`}
              >
                <span className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  Risk Profiles
                </span>
              </button>
            </div>

            {/* Performance Tab */}
            {activeTab === 'performance' && (
              <>
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

                {/* Score Distribution & Confidence Calibration */}
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

                  {/* Confidence Calibration */}
                  <div className="bg-white rounded-xl shadow-md p-6">
                    <h3 className="text-lg font-bold text-loyola-gray-800 mb-2 flex items-center gap-2">
                      <Brain className="w-5 h-5 text-purple-600" />
                      Confidence Calibration
                    </h3>

                    {/* Legend/Explanation */}
                    <div className="bg-gray-50 rounded-lg p-3 mb-4 text-sm">
                      <p className="text-gray-700 mb-2">
                        <strong>What it measures:</strong> The gap between how confident students feel and how well they actually perform.
                      </p>
                      <p className="text-gray-600 text-xs">
                        <strong>Formula:</strong> OC = Avg(Confidence) − Avg(Correctness), where confidence is normalized from 1-3 scale to 0-1.
                      </p>
                    </div>

                    {analytics.riskProfiles ? (
                      <>
                        <div className="grid grid-cols-3 gap-3 mb-4">
                          <div className="p-3 bg-gray-50 rounded-lg border border-gray-200 text-center">
                            <div className="text-xl font-bold text-gray-700">
                              {analytics.riskProfiles.overconfidence.distribution.underconfident}
                            </div>
                            <div className="text-xs font-medium text-gray-600">Underconfident</div>
                            <div className="text-xs text-gray-500">OC &lt; -10%</div>
                          </div>
                          <div className="p-3 bg-green-50 rounded-lg border border-green-200 text-center">
                            <div className="text-xl font-bold text-green-700">
                              {analytics.riskProfiles.overconfidence.distribution.low}
                            </div>
                            <div className="text-xs font-medium text-green-600">Well-Calibrated</div>
                            <div className="text-xs text-green-500">|OC| &lt; 10%</div>
                          </div>
                          <div className="p-3 bg-red-50 rounded-lg border border-red-200 text-center">
                            <div className="text-xl font-bold text-red-700">
                              {analytics.riskProfiles.overconfidence.distribution.moderate +
                               analytics.riskProfiles.overconfidence.distribution.high}
                            </div>
                            <div className="text-xs font-medium text-red-600">Overconfident</div>
                            <div className="text-xs text-red-500">OC &gt; 10%</div>
                          </div>
                        </div>

                        {/* Color Legend */}
                        <div className="flex items-center gap-4 text-xs text-gray-500 mb-3 px-1">
                          <div className="flex items-center gap-1">
                            <div className="w-3 h-3 bg-green-500 rounded"></div>
                            <span>Good</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <div className="w-3 h-3 bg-gray-400 rounded"></div>
                            <span>Neutral</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <div className="w-3 h-3 bg-red-500 rounded"></div>
                            <span>Needs attention</span>
                          </div>
                        </div>

                        <div className="p-3 bg-gray-50 rounded-lg">
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">Average OC Index</span>
                            <span className={`text-lg font-bold ${
                              (analytics.riskProfiles.overconfidence.average ?? 0) > 10
                                ? 'text-red-600'
                                : (analytics.riskProfiles.overconfidence.average ?? 0) < -10
                                  ? 'text-gray-600'
                                  : 'text-green-600'
                            }`}>
                              {analytics.riskProfiles.overconfidence.average !== null
                                ? `${analytics.riskProfiles.overconfidence.average > 0 ? '+' : ''}${analytics.riskProfiles.overconfidence.average}%`
                                : 'N/A'}
                            </span>
                          </div>
                          <p className="text-xs text-gray-500 mt-1">
                            Based on {analytics.riskProfiles.overconfidence.totalMeasured} student submissions
                          </p>
                        </div>
                      </>
                    ) : (
                      <p className="text-sm text-gray-400 italic">No confidence data available</p>
                    )}
                  </div>
                </div>

                {/* Overconfidence Breakdown */}
                {analytics.riskProfiles && (
                  <div className="bg-white rounded-xl shadow-md p-6 mb-8">
                    <h3 className="text-lg font-bold text-loyola-gray-800 mb-2 flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5 text-amber-600" />
                      Overconfidence Detailed Breakdown
                    </h3>

                    {/* Legend/Explanation */}
                    <div className="bg-gray-50 rounded-lg p-3 mb-4 text-sm">
                      <p className="text-gray-700 mb-2">
                        <strong>Why it matters:</strong> Students with high overconfidence believe they understand material better than they actually do, leading to inadequate study habits and poor financial decisions.
                      </p>
                      <p className="text-gray-600 text-xs">
                        <strong>Interpretation:</strong> Green = confidence matches performance. Red = significant gap requiring intervention.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                      <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
                          <span className="font-medium text-gray-700">Underconfident</span>
                        </div>
                        <div className="text-2xl font-bold text-gray-700">
                          {analytics.riskProfiles.overconfidence.distribution.underconfident}
                        </div>
                        <p className="text-sm text-gray-600">OC &lt; -10%</p>
                        <p className="text-xs text-gray-500 mt-1">Performs better than they believe</p>
                      </div>
                      <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                          <span className="font-medium text-green-800">Well-Calibrated</span>
                        </div>
                        <div className="text-2xl font-bold text-green-700">
                          {analytics.riskProfiles.overconfidence.distribution.low}
                        </div>
                        <p className="text-sm text-green-600">|OC| &lt; 10%</p>
                        <p className="text-xs text-green-500 mt-1">Good self-awareness</p>
                      </div>
                      <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-3 h-3 bg-red-400 rounded-full"></div>
                          <span className="font-medium text-red-700">Moderate OC</span>
                        </div>
                        <div className="text-2xl font-bold text-red-600">
                          {analytics.riskProfiles.overconfidence.distribution.moderate}
                        </div>
                        <p className="text-sm text-red-500">OC 10-30%</p>
                        <p className="text-xs text-red-400 mt-1">Some miscalibration</p>
                      </div>
                      <div className="p-4 bg-red-100 rounded-lg border border-red-300">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-3 h-3 bg-red-600 rounded-full"></div>
                          <span className="font-medium text-red-800">High OC</span>
                        </div>
                        <div className="text-2xl font-bold text-red-700">
                          {analytics.riskProfiles.overconfidence.distribution.high}
                        </div>
                        <p className="text-sm text-red-600">OC &gt; 30%</p>
                        <p className="text-xs text-red-500 mt-1">Needs intervention</p>
                      </div>
                    </div>

                    {/* Visual Legend */}
                    <div className="flex items-center justify-center gap-6 text-xs text-gray-500 pt-2 border-t border-gray-100">
                      <div className="flex items-center gap-1">
                        <div className="w-3 h-3 bg-gray-400 rounded"></div>
                        <span>Underconfident (neutral)</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <div className="w-3 h-3 bg-green-500 rounded"></div>
                        <span>Well-Calibrated (ideal)</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <div className="w-3 h-3 bg-red-500 rounded"></div>
                        <span>Overconfident (concern)</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Methodology Explanation */}
                <div className="bg-white rounded-xl shadow-md overflow-hidden">
                  <button
                    onClick={() => toggleSection('methodology')}
                    className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition"
                  >
                    <div className="flex items-center gap-3">
                      <Activity className="w-5 h-5 text-gray-600" />
                      <span className="font-semibold text-gray-800">How Metrics Are Calculated</span>
                    </div>
                    {expandedSection === 'methodology' ? (
                      <ChevronDown className="w-5 h-5 text-gray-400" />
                    ) : (
                      <ChevronRight className="w-5 h-5 text-gray-400" />
                    )}
                  </button>
                  {expandedSection === 'methodology' && (
                    <div className="px-6 pb-6 space-y-6">
                      {/* Score Calculation */}
                      <div className="bg-gray-50 rounded-lg p-4">
                        <h4 className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
                          <TrendingUp className="w-4 h-4 text-gray-600" />
                          Score
                        </h4>
                        <p className="text-sm text-gray-600 mb-2">
                          The assessment score is calculated from <strong>26 anchor knowledge items</strong> (Q1-Q14, Q29-Q40).
                        </p>
                        <div className="bg-white rounded p-3 font-mono text-sm text-gray-700 border">
                          Score = (Correct Answers / 26) × 100%
                        </div>
                        <p className="text-xs text-gray-500 mt-2">
                          Note: Preference questions (Q15-Q28) and SDM adaptive items are not included in the score.
                        </p>
                      </div>

                      {/* Confidence Scale */}
                      <div className="bg-gray-50 rounded-lg p-4">
                        <h4 className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
                          <Brain className="w-4 h-4 text-gray-600" />
                          Confidence Rating
                        </h4>
                        <p className="text-sm text-gray-600 mb-2">
                          Students rate their confidence for each knowledge question on a 3-point scale:
                        </p>
                        <div className="grid grid-cols-3 gap-2 mt-2">
                          <div className="bg-white rounded p-2 text-center border">
                            <span className="text-lg font-bold text-gray-700">1</span>
                            <p className="text-xs text-gray-600">Low</p>
                          </div>
                          <div className="bg-white rounded p-2 text-center border">
                            <span className="text-lg font-bold text-gray-700">2</span>
                            <p className="text-xs text-gray-600">Medium</p>
                          </div>
                          <div className="bg-white rounded p-2 text-center border">
                            <span className="text-lg font-bold text-gray-700">3</span>
                            <p className="text-xs text-gray-600">High</p>
                          </div>
                        </div>
                      </div>

                      {/* OC Formula */}
                      <div className="bg-gray-50 rounded-lg p-4">
                        <h4 className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
                          <AlertTriangle className="w-4 h-4 text-gray-600" />
                          Overconfidence Index (OC)
                        </h4>
                        <p className="text-sm text-gray-600 mb-2">
                          Measures the gap between how confident students feel and how well they actually perform.
                        </p>
                        <div className="bg-white rounded p-3 font-mono text-sm text-gray-700 border mb-3">
                          OC = Avg(Normalized Confidence) − Avg(Actual Correctness)
                        </div>
                        <div className="space-y-2 text-sm text-gray-600">
                          <p><strong>Normalized Confidence</strong>: Maps 1-3 scale to 0-1 → <code className="bg-gray-200 px-1 rounded">(confidence - 1) / 2</code></p>
                          <p><strong>Actual Correctness</strong>: 1 if correct, 0 if incorrect</p>
                        </div>
                        <div className="mt-3 text-xs text-gray-500">
                          Example: A student with average confidence of 2.5 (normalized: 0.75) who scores 60% correct has OC = 0.75 - 0.60 = +15% (moderate overconfidence)
                        </div>
                      </div>

                      {/* OC Categories */}
                      <div className="bg-gray-50 rounded-lg p-4">
                        <h4 className="font-semibold text-gray-800 mb-2">Calibration Categories</h4>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                          <div className="bg-gray-100 rounded p-2 border border-gray-200">
                            <p className="text-sm font-medium text-gray-700">Underconfident</p>
                            <p className="text-xs text-gray-600">OC &lt; -10%</p>
                            <p className="text-xs text-gray-500 mt-1">Performs better than they believe</p>
                          </div>
                          <div className="bg-green-50 rounded p-2 border border-green-200">
                            <p className="text-sm font-medium text-green-800">Well-Calibrated</p>
                            <p className="text-xs text-green-600">|OC| &lt; 10%</p>
                            <p className="text-xs text-green-500 mt-1">Confidence matches performance</p>
                          </div>
                          <div className="bg-red-50 rounded p-2 border border-red-200">
                            <p className="text-sm font-medium text-red-700">Moderate OC</p>
                            <p className="text-xs text-red-600">OC 10-30%</p>
                            <p className="text-xs text-red-500 mt-1">Somewhat overestimates ability</p>
                          </div>
                          <div className="bg-red-100 rounded p-2 border border-red-300">
                            <p className="text-sm font-medium text-red-800">High OC</p>
                            <p className="text-xs text-red-600">OC &gt; 30%</p>
                            <p className="text-xs text-red-500 mt-1">Significantly overestimates ability</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4 text-xs text-gray-500 mt-3 pt-2 border-t border-gray-200">
                          <div className="flex items-center gap-1">
                            <div className="w-3 h-3 bg-green-500 rounded"></div>
                            <span>Good (target state)</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <div className="w-3 h-3 bg-gray-400 rounded"></div>
                            <span>Neutral</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <div className="w-3 h-3 bg-red-500 rounded"></div>
                            <span>Needs attention</span>
                          </div>
                        </div>
                      </div>

                      {/* Duration */}
                      <div className="bg-gray-50 rounded-lg p-4">
                        <h4 className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
                          <Clock className="w-4 h-4 text-gray-600" />
                          Duration
                        </h4>
                        <p className="text-sm text-gray-600">
                          Time elapsed from assessment start to final submission, measured in minutes.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}

            {/* Baseline Covariates Tab */}
            {activeTab === 'baseline' && analytics.baselineCovariates && (
              <div className="space-y-6">
                {/* Summary */}
                <div className="bg-white rounded-xl shadow-md p-6">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-bold text-loyola-gray-800 flex items-center gap-2">
                      <GraduationCap className="w-6 h-6 text-loyola-maroon" />
                      Baseline Covariates (B1-B13)
                    </h2>
                    <span className="text-sm text-gray-500">
                      {analytics.baselineCovariates.totalProfiles} student profiles
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mt-2">
                    Demographic and financial background data collected during onboarding, used for heterogeneity analysis.
                  </p>
                </div>

                {/* Demographics Section */}
                <div className="bg-white rounded-xl shadow-md overflow-hidden">
                  <button
                    onClick={() => toggleSection('demographics')}
                    className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition"
                  >
                    <div className="flex items-center gap-3">
                      <Users className="w-5 h-5 text-blue-600" />
                      <span className="font-semibold text-gray-800">Demographics (B1-B5)</span>
                    </div>
                    {expandedSection === 'demographics' ? (
                      <ChevronDown className="w-5 h-5 text-gray-400" />
                    ) : (
                      <ChevronRight className="w-5 h-5 text-gray-400" />
                    )}
                  </button>
                  {expandedSection === 'demographics' && (
                    <div className="px-6 pb-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      <DistributionCard
                        title="B1: Gender"
                        data={analytics.baselineCovariates.demographics.gender}
                        color="blue"
                      />
                      <DistributionCard
                        title="B2: Race/Ethnicity"
                        data={analytics.baselineCovariates.demographics.raceEthnicity}
                        color="purple"
                      />
                      <DistributionCard
                        title="B3: Age Range"
                        data={analytics.baselineCovariates.demographics.ageRange}
                        color="green"
                      />
                      <DistributionCard
                        title="B4: First Language"
                        data={analytics.baselineCovariates.demographics.firstLanguage}
                        color="orange"
                      />
                      <DistributionCard
                        title="B5: Work Experience"
                        data={analytics.baselineCovariates.demographics.workExperience}
                        color="red"
                      />
                    </div>
                  )}
                </div>

                {/* Financial Background Section */}
                <div className="bg-white rounded-xl shadow-md overflow-hidden">
                  <button
                    onClick={() => toggleSection('financial')}
                    className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition"
                  >
                    <div className="flex items-center gap-3">
                      <Wallet className="w-5 h-5 text-green-600" />
                      <span className="font-semibold text-gray-800">Financial Background (B6-B10)</span>
                    </div>
                    {expandedSection === 'financial' ? (
                      <ChevronDown className="w-5 h-5 text-gray-400" />
                    ) : (
                      <ChevronRight className="w-5 h-5 text-gray-400" />
                    )}
                  </button>
                  {expandedSection === 'financial' && (
                    <div className="px-6 pb-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      <DistributionCard
                        title="B6: Prior Financial Products"
                        data={analytics.baselineCovariates.financialBackground.priorFinancialProducts}
                        color="green"
                      />
                      <DistributionCard
                        title="B7: Self-Rated Knowledge"
                        data={analytics.baselineCovariates.financialBackground.selfRatedKnowledge}
                        color="blue"
                      />
                      <DistributionCard
                        title="B8: Financial Stress"
                        data={analytics.baselineCovariates.financialBackground.financialStress}
                        color="red"
                      />
                      <DistributionCard
                        title="B9: Parental Education"
                        data={analytics.baselineCovariates.financialBackground.parentalEducation}
                        color="purple"
                      />
                      <DistributionCard
                        title="B10: First-Gen College"
                        data={analytics.baselineCovariates.financialBackground.firstGenerationCollege}
                        color="orange"
                      />
                    </div>
                  )}
                </div>

                {/* Student Loans Section */}
                <div className="bg-white rounded-xl shadow-md overflow-hidden">
                  <button
                    onClick={() => toggleSection('loans')}
                    className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition"
                  >
                    <div className="flex items-center gap-3">
                      <DollarSign className="w-5 h-5 text-amber-600" />
                      <span className="font-semibold text-gray-800">Student Loans (B11-B13)</span>
                      <span className="text-sm text-gray-500">
                        ({analytics.baselineCovariates.studentLoans.totalWithLoans} with loans)
                      </span>
                    </div>
                    {expandedSection === 'loans' ? (
                      <ChevronDown className="w-5 h-5 text-gray-400" />
                    ) : (
                      <ChevronRight className="w-5 h-5 text-gray-400" />
                    )}
                  </button>
                  {expandedSection === 'loans' && (
                    <div className="px-6 pb-6 grid grid-cols-1 md:grid-cols-3 gap-6">
                      <DistributionCard
                        title="B11: Has Student Loan Debt"
                        data={analytics.baselineCovariates.studentLoans.hasDebt}
                        color="amber"
                      />
                      <DistributionCard
                        title="B12: Loan Interest Rate"
                        data={analytics.baselineCovariates.studentLoans.interestRate}
                        color="red"
                        subtitle="(among those with loans)"
                      />
                      <DistributionCard
                        title="B13: Loan Maturity"
                        data={analytics.baselineCovariates.studentLoans.maturity}
                        color="orange"
                        subtitle="(among those with loans)"
                      />
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Risk Profiles Tab */}
            {activeTab === 'risk' && analytics.riskProfiles && (
              <div className="space-y-6">
                {/* Risk Overview Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="bg-white rounded-xl shadow-md p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-3 bg-amber-100 rounded-lg">
                        <Brain className="w-6 h-6 text-amber-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-800">Overconfidence</h3>
                        <p className="text-sm text-gray-500">Avg index</p>
                      </div>
                    </div>
                    <p className="text-3xl font-bold text-gray-900">
                      {analytics.riskProfiles.overconfidence.average !== null
                        ? `${analytics.riskProfiles.overconfidence.average}%`
                        : 'N/A'}
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                      {analytics.riskProfiles.overconfidence.totalMeasured} students measured
                    </p>
                  </div>

                  <div className="bg-white rounded-xl shadow-md p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-3 bg-red-100 rounded-lg">
                        <Heart className="w-6 h-6 text-red-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-800">High Stress</h3>
                        <p className="text-sm text-gray-500">Often/Always</p>
                      </div>
                    </div>
                    <p className="text-3xl font-bold text-gray-900">
                      {analytics.riskProfiles.financialStress.highStressPercentage}%
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                      {analytics.riskProfiles.financialStress.highStressCount} students
                    </p>
                  </div>

                  <div className="bg-white rounded-xl shadow-md p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-3 bg-purple-100 rounded-lg">
                        <UserCheck className="w-6 h-6 text-purple-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-800">First-Gen + Loans</h3>
                        <p className="text-sm text-gray-500">Combined risk</p>
                      </div>
                    </div>
                    <p className="text-3xl font-bold text-gray-900">
                      {analytics.riskProfiles.atRiskIndicators.firstGenWithLoans}
                    </p>
                    <p className="text-sm text-gray-500 mt-1">students</p>
                  </div>

                  <div className="bg-white rounded-xl shadow-md p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-3 bg-orange-100 rounded-lg">
                        <AlertTriangle className="w-6 h-6 text-orange-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-800">High Interest Loans</h3>
                        <p className="text-sm text-gray-500">&gt;10% rate</p>
                      </div>
                    </div>
                    <p className="text-3xl font-bold text-gray-900">
                      {analytics.riskProfiles.atRiskIndicators.highInterestLoans}
                    </p>
                    <p className="text-sm text-gray-500 mt-1">students</p>
                  </div>
                </div>

                {/* Overconfidence Distribution */}
                <div className="bg-white rounded-xl shadow-md p-6">
                  <h3 className="text-lg font-bold text-gray-800 mb-2 flex items-center gap-2">
                    <Brain className="w-5 h-5 text-purple-600" />
                    Confidence Calibration Distribution
                  </h3>

                  {/* Legend/Explanation */}
                  <div className="bg-gray-50 rounded-lg p-3 mb-4 text-sm">
                    <p className="text-gray-700 mb-2">
                      <strong>What it measures:</strong> The Overconfidence Index (OC) = Average Confidence − Average Correctness
                    </p>
                    <p className="text-gray-600 text-xs">
                      <strong>Interpretation:</strong> Positive OC = overconfident (thinks they know more than they do). Negative OC = underconfident. Near zero = well-calibrated.
                    </p>
                  </div>

                  <div className="grid grid-cols-4 gap-4 mb-4">
                    <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                      <div className="text-2xl font-bold text-gray-700">
                        {analytics.riskProfiles.overconfidence.distribution.underconfident}
                      </div>
                      <div className="text-sm font-medium text-gray-600">Underconfident</div>
                      <div className="text-xs text-gray-500 mt-1">OC &lt; -10%</div>
                    </div>
                    <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                      <div className="text-2xl font-bold text-green-700">
                        {analytics.riskProfiles.overconfidence.distribution.low}
                      </div>
                      <div className="text-sm font-medium text-green-600">Well-Calibrated</div>
                      <div className="text-xs text-green-500 mt-1">|OC| &lt; 10%</div>
                    </div>
                    <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                      <div className="text-2xl font-bold text-red-600">
                        {analytics.riskProfiles.overconfidence.distribution.moderate}
                      </div>
                      <div className="text-sm font-medium text-red-600">Moderate OC</div>
                      <div className="text-xs text-red-500 mt-1">OC 10-30%</div>
                    </div>
                    <div className="p-4 bg-red-100 rounded-lg border border-red-300">
                      <div className="text-2xl font-bold text-red-700">
                        {analytics.riskProfiles.overconfidence.distribution.high}
                      </div>
                      <div className="text-sm font-medium text-red-700">High OC</div>
                      <div className="text-xs text-red-500 mt-1">OC &gt; 30%</div>
                    </div>
                  </div>

                  {/* Color Legend */}
                  <div className="flex items-center justify-center gap-6 text-xs text-gray-500 pt-2 border-t border-gray-100">
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-3 bg-gray-400 rounded"></div>
                      <span>Neutral</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-3 bg-green-500 rounded"></div>
                      <span>Good (target)</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-3 bg-red-500 rounded"></div>
                      <span>Needs attention</span>
                    </div>
                  </div>
                </div>

                {/* At-Risk Indicators */}
                <div className="bg-white rounded-xl shadow-md p-6">
                  <h3 className="text-lg font-bold text-gray-800 mb-2 flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-red-600" />
                    At-Risk Indicators
                  </h3>

                  {/* Legend/Explanation */}
                  <div className="bg-gray-50 rounded-lg p-3 mb-4 text-sm">
                    <p className="text-gray-700 mb-2">
                      <strong>What it shows:</strong> Students who may need additional support based on their baseline characteristics.
                    </p>
                    <p className="text-gray-600 text-xs">
                      <strong>Data source:</strong> Derived from onboarding questions (B1-B13). These are risk factors, not predictions.
                    </p>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg border border-red-200">
                      <div>
                        <h4 className="font-medium text-red-800">Low Knowledge + High Stress</h4>
                        <p className="text-sm text-red-600">
                          Students with low self-rated knowledge AND frequent financial stress
                        </p>
                      </div>
                      <div className="text-2xl font-bold text-red-700">
                        {analytics.riskProfiles.atRiskIndicators.lowKnowledgeHighStress}
                      </div>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-amber-50 rounded-lg border border-amber-200">
                      <div>
                        <h4 className="font-medium text-amber-800">First-Generation + Student Loans</h4>
                        <p className="text-sm text-amber-600">
                          First-generation college students with existing loan debt
                        </p>
                      </div>
                      <div className="text-2xl font-bold text-amber-700">
                        {analytics.riskProfiles.atRiskIndicators.firstGenWithLoans}
                      </div>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-amber-50 rounded-lg border border-amber-200">
                      <div>
                        <h4 className="font-medium text-amber-800">High Interest Rate Loans</h4>
                        <p className="text-sm text-amber-600">
                          Students with loan interest rates above 10%
                        </p>
                      </div>
                      <div className="text-2xl font-bold text-amber-700">
                        {analytics.riskProfiles.atRiskIndicators.highInterestLoans}
                      </div>
                    </div>
                  </div>

                  {/* Legend */}
                  <div className="flex items-center gap-4 text-xs text-gray-500 pt-3 mt-3 border-t border-gray-100">
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-3 bg-red-500 rounded"></div>
                      <span>High priority</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-3 bg-amber-500 rounded"></div>
                      <span>Monitor</span>
                    </div>
                  </div>
                </div>



                {/* Preference Question Responses */}
                {analytics.riskProfiles.preferenceResponses && analytics.riskProfiles.preferenceResponses.length > 0 && (
                  <div className="bg-white rounded-xl shadow-md p-6">
                    <h3 className="text-lg font-bold text-gray-800 mb-2 flex items-center gap-2">
                      <MessageSquare className="w-5 h-5 text-gray-600" />
                      Preference Question Responses (Q15-Q28)
                    </h3>

                    {/* Legend/Explanation */}
                    <div className="bg-gray-50 rounded-lg p-3 mb-4 text-sm">
                      <p className="text-gray-700 mb-2">
                        <strong>What it shows:</strong> Raw response distributions for each preference/attitude question.
                      </p>
                      <p className="text-gray-600 text-xs">
                        <strong>Data source:</strong> Questions Q15-Q28 measure financial attitudes and preferences. These are unscored items used to understand student mindsets, not assess knowledge.
                      </p>
                    </div>

                    <div className="space-y-6">
                      {analytics.riskProfiles.preferenceResponses.map((q) => (
                        <div key={q.questionId} className="border border-gray-200 rounded-lg p-4">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-bold text-gray-700 bg-gray-100 px-2 py-1 rounded">
                                {q.questionId}
                              </span>
                              <span className="text-xs text-gray-400">{q.totalResponses} responses</span>
                            </div>
                          </div>
                          <p className="text-sm text-gray-800 font-medium mb-4">
                            {q.questionText}
                          </p>
                          <div className="space-y-3">
                            {q.responses.map((r, idx) => (
                              <div key={idx} className="space-y-1">
                                <div className="flex items-start justify-between gap-2">
                                  <div className="flex items-start gap-2 flex-1">
                                    <span className="text-xs font-bold text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded min-w-[20px] text-center">
                                      {r.answer}
                                    </span>
                                    <span className="text-sm text-gray-600">{r.answerText}</span>
                                  </div>
                                  <span className="text-sm font-medium text-gray-700 whitespace-nowrap">
                                    {r.count} ({r.percentage}%)
                                  </span>
                                </div>
                                <div className="ml-7 bg-gray-200 rounded-full h-2">
                                  <div
                                    className="bg-gray-500 h-2 rounded-full"
                                    style={{ width: `${r.percentage}%` }}
                                  ></div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* No baseline data message */}
            {activeTab === 'baseline' && !analytics.baselineCovariates && (
              <div className="bg-white rounded-xl shadow-md p-12 text-center">
                <GraduationCap className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-700 mb-2">No Baseline Data Available</h3>
                <p className="text-gray-500">
                  Student profile data will appear here once students complete onboarding.
                </p>
              </div>
            )}

            {/* No risk data message */}
            {activeTab === 'risk' && !analytics.riskProfiles && (
              <div className="bg-white rounded-xl shadow-md p-12 text-center">
                <AlertTriangle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-700 mb-2">No Risk Profile Data Available</h3>
                <p className="text-gray-500">
                  Risk profile data will appear here once students complete assessments.
                </p>
              </div>
            )}
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
  const colorClasses: Record<string, string> = {
    blue: 'bg-blue-100 text-blue-600',
    green: 'bg-green-100 text-green-600',
    purple: 'bg-purple-100 text-purple-600',
    amber: 'bg-amber-100 text-amber-600',
    red: 'bg-red-100 text-red-600',
    gray: 'bg-gray-100 text-gray-600'
  };

  return (
    <div className="bg-white rounded-xl shadow-md p-6">
      <div className={`inline-flex p-3 rounded-lg ${colorClasses[color] || colorClasses.blue} mb-4`}>
        {icon}
      </div>
      <h3 className="text-sm font-medium text-loyola-gray-600 mb-1">{title}</h3>
      <p className="text-3xl font-bold text-loyola-gray-900">{value}</p>
    </div>
  );
}

// Distribution Card Component
function DistributionCard({
  title,
  data,
  color,
  subtitle
}: {
  title: string;
  data: DistributionItem[];
  color: string;
  subtitle?: string;
}) {
  const colorClasses: Record<string, string> = {
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    purple: 'bg-purple-500',
    amber: 'bg-amber-500',
    red: 'bg-red-500',
    indigo: 'bg-indigo-500'
  };

  const bgColor = colorClasses[color] || 'bg-blue-500';

  return (
    <div className="bg-gray-50 rounded-lg p-4">
      <h4 className="font-medium text-gray-800 mb-1">{title}</h4>
      {subtitle && <p className="text-xs text-gray-500 mb-3">{subtitle}</p>}
      <div className="space-y-2 mt-3">
        {data.slice(0, 5).map((item, idx) => (
          <div key={idx}>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-600 truncate" title={item.label}>
                {item.label.length > 25 ? item.label.substring(0, 25) + '...' : item.label}
              </span>
              <span className="text-gray-500 ml-2">
                {item.count} ({item.percentage}%)
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-1.5">
              <div
                className={`${bgColor} h-1.5 rounded-full transition-all`}
                style={{ width: `${Math.min(item.percentage, 100)}%` }}
              />
            </div>
          </div>
        ))}
        {data.length > 5 && (
          <p className="text-xs text-gray-400 mt-2">+{data.length - 5} more options</p>
        )}
        {data.length === 0 && (
          <p className="text-sm text-gray-400 italic">No data</p>
        )}
      </div>
    </div>
  );
}
