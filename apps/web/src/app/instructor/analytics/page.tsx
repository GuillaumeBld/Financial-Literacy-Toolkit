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
  MessageSquare,
  Target,
  CheckCircle2,
  XCircle,
  Info
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
  learningGains?: {
    overall: {
      preMean: number;
      preSD: number;
      postMean: number;
      postSD: number;
      gain: number;
      gainCI: [number, number];
      cohensD: number;
      cohensInterpretation: 'negligible' | 'small' | 'medium' | 'large';
      pValue: number;
      sampleSize: number;
    };
    byDomain: Array<{
      domain: string;
      preMean: number;
      postMean: number;
      gain: number;
      cohensD: number;
      itemCount: number;
    }>;
    distribution: Array<{
      range: string;
      count: number;
      percentage: number;
    }>;
    cronbachAlpha: {
      borrowingCredit: { alpha: number; interpretation: string; itemCount: number };
      riskManagement: { alpha: number; interpretation: string; itemCount: number };
      investmentRisk: { alpha: number; interpretation: string; itemCount: number };
      overall: { alpha: number; interpretation: string; itemCount: number };
    };
    efa: {
      loadings: Array<{
        itemId: string;
        factor1: number;
        factor2: number;
        factor3: number;
        primaryFactor: number;
      }>;
      eigenvalues: number[];
      varianceExplained: number[];
      warnings: string[];
    };
    sur: {
      coefficients: Array<{
        covariate: string;
        borrowingCredit: { beta: number; se: number; pValue: number };
        riskManagement: { beta: number; se: number; pValue: number };
        investmentRisk: { beta: number; se: number; pValue: number };
      }>;
      residualCorrelation: number[][];
      rSquared: { borrowingCredit: number; riskManagement: number; investmentRisk: number };
      sampleSize: number;
      warnings: string[];
    };
    sampleWarnings: string[];
  };
};

export default function InstructorAnalyticsPage() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [courses, setCourses] = useState<Array<{id: string, name: string}>>([]);
  const [selectedCourse, setSelectedCourse] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [instructorName, setInstructorName] = useState('');
  const [activeTab, setActiveTab] = useState<'performance' | 'baseline' | 'risk' | 'learning'>('performance');
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
      <div className="min-h-screen bg-[#F7F8FA] flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-500">Loading analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F7F8FA]">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push('/instructor/dashboard')}
                className="flex items-center gap-2 text-gray-500 hover:text-blue-600 transition"
              >
                <ArrowLeft className="w-5 h-5" />
                <span>Back to Dashboard</span>
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Analytics & Reports
                </h1>
                <p className="text-sm text-gray-500">
                  Detailed statistical analysis and insights
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={handleRefresh}
                className="p-2 text-gray-500 hover:text-blue-600 transition"
                title="Refresh data"
              >
                <RefreshCw className="w-5 h-5" />
              </button>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-blue-600 transition"
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
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Select Course
            </label>
            <select
              value={selectedCourse}
              onChange={(e) => handleCourseChange(e.target.value)}
              className="px-4 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
            <p className="text-gray-500">No analytics data available</p>
          </div>
        ) : (
          <>
            {/* Summary Cards - All use primary blue for consistency */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6 mb-8">
              <StatCard
                icon={<Users className="w-6 h-6" />}
                title="Total Students"
                value={analytics.summary.totalStudents}
              />
              <StatCard
                icon={<UserCheck className="w-6 h-6" />}
                title="Submitted"
                value={analytics.summary.submitted}
              />
              <StatCard
                icon={<Activity className="w-6 h-6" />}
                title="In Progress"
                value={analytics.summary.inProgress}
              />
              <StatCard
                icon={<Clock className="w-6 h-6" />}
                title="Onboarded"
                value={analytics.summary.notStarted}
              />
              <StatCard
                icon={<TrendingUp className="w-6 h-6" />}
                title="Average Score"
                value={`${analytics.summary.avgScore}%`}
              />
              <StatCard
                icon={<BarChart3 className="w-6 h-6" />}
                title="Avg Duration"
                value={`${Math.floor(analytics.summary.avgDuration / 60)}m`}
              />
            </div>

            {/* Tab Navigation */}
            <div className="flex gap-2 mb-6 border-b border-gray-200">
              <button
                onClick={() => setActiveTab('performance')}
                className={`px-6 py-3 font-medium transition-colors border-b-2 -mb-px ${
                  activeTab === 'performance'
                    ? 'text-blue-600 border-blue-600'
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
                    ? 'text-blue-600 border-blue-600'
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
                    ? 'text-blue-600 border-blue-600'
                    : 'text-gray-500 border-transparent hover:text-gray-700'
                }`}
              >
                <span className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  Risk Profiles
                </span>
              </button>
              <button
                onClick={() => setActiveTab('learning')}
                className={`px-6 py-3 font-medium transition-colors border-b-2 -mb-px ${
                  activeTab === 'learning'
                    ? 'text-blue-600 border-blue-600'
                    : 'text-gray-500 border-transparent hover:text-gray-700'
                }`}
              >
                <span className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" />
                  Learning Gains
                </span>
              </button>
            </div>

            {/* Performance Tab */}
            {activeTab === 'performance' && (
              <>
                {/* Domain Performance */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-8">
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                      <PieChart className="w-6 h-6 text-blue-600" />
                      Domain Performance Analysis
                    </h2>
                    <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
                      <Download className="w-4 h-4" />
                      Export Report
                    </button>
                  </div>

                  <div className="space-y-4">
                    {analytics.domainPerformance.map((domain) => (
                      <div key={domain.domain}>
                        <div className="flex justify-between items-center mb-2">
                          <span className="font-medium text-gray-700">
                            {domain.domain}
                          </span>
                          <div className="flex items-center gap-4 text-sm text-gray-500">
                            <span>Score: {Math.round(domain.avgScore)}%</span>
                            <span>Attempts: {domain.attemptCount}</span>
                            <span className={`font-medium ${
                              domain.improvement > 0 ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {domain.improvement > 0 ? '+' : ''}{Math.round(domain.improvement)}%
                            </span>
                          </div>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-3">
                          <div
                            className="bg-blue-600 h-3 rounded-full transition-all duration-500"
                            style={{ width: `${domain.avgScore}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Score Distribution & Confidence Calibration */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                  <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-4">
                      Score Distribution
                    </h3>
                    <div className="space-y-3">
                      {analytics.scoreDistribution.map((range) => (
                        <div key={range.range}>
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-sm font-medium text-gray-700">
                              {range.range}
                            </span>
                            <span className="text-sm text-gray-500">
                              {range.count} ({range.percentage}%)
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                              style={{ width: `${range.percentage}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Confidence Calibration */}
                  <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-2 flex items-center gap-2">
                      <Brain className="w-5 h-5 text-blue-600" />
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
                          <div className="p-3 bg-sky-50 rounded-lg border border-sky-200 text-center">
                            <div className="text-xl font-bold text-sky-700">
                              {analytics.riskProfiles.overconfidence.distribution.underconfident}
                            </div>
                            <div className="text-xs font-medium text-sky-600">Underconfident</div>
                            <div className="text-xs text-sky-500">OC &lt; -10%</div>
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
                            <span>Success</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <div className="w-3 h-3 bg-sky-500 rounded"></div>
                            <span>Info</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <div className="w-3 h-3 bg-red-500 rounded"></div>
                            <span>Risk</span>
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
                  <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-8">
                    <h3 className="text-lg font-bold text-gray-900 mb-2 flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5 text-amber-600" />
                      Overconfidence Detailed Breakdown
                    </h3>

                    {/* Legend/Explanation */}
                    <div className="bg-gray-50 rounded-lg p-3 mb-4 text-sm">
                      <p className="text-gray-700 mb-2">
                        <strong>Why it matters:</strong> Students with high overconfidence believe they understand material better than they actually do, leading to inadequate study habits and poor financial decisions.
                      </p>
                      <p className="text-gray-600 text-xs">
                        <strong>Interpretation:</strong> Green = confidence matches performance. Orange/Red = gap requiring attention.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                      <div className="p-4 bg-sky-50 rounded-lg border border-sky-200">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-3 h-3 bg-sky-500 rounded-full"></div>
                          <span className="font-medium text-sky-700">Underconfident</span>
                        </div>
                        <div className="text-2xl font-bold text-sky-700">
                          {analytics.riskProfiles.overconfidence.distribution.underconfident}
                        </div>
                        <p className="text-sm text-sky-600">OC &lt; -10%</p>
                        <p className="text-xs text-sky-500 mt-1">Performs better than they believe</p>
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
                      <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-3 h-3 bg-amber-500 rounded-full"></div>
                          <span className="font-medium text-amber-700">Moderate OC</span>
                        </div>
                        <div className="text-2xl font-bold text-amber-700">
                          {analytics.riskProfiles.overconfidence.distribution.moderate}
                        </div>
                        <p className="text-sm text-amber-600">OC 10-30%</p>
                        <p className="text-xs text-amber-500 mt-1">Some miscalibration</p>
                      </div>
                      <div className="p-4 bg-red-50 rounded-lg border border-red-200">
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
                        <div className="w-3 h-3 bg-sky-500 rounded"></div>
                        <span>Info (underconfident)</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <div className="w-3 h-3 bg-green-500 rounded"></div>
                        <span>Success (calibrated)</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <div className="w-3 h-3 bg-amber-500 rounded"></div>
                        <span>Warning (moderate)</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <div className="w-3 h-3 bg-red-500 rounded"></div>
                        <span>Danger (high)</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Methodology Explanation */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
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
                          <div className="bg-sky-50 rounded p-2 border border-sky-200">
                            <p className="text-sm font-medium text-sky-700">Underconfident</p>
                            <p className="text-xs text-sky-600">OC &lt; -10%</p>
                            <p className="text-xs text-sky-500 mt-1">Performs better than they believe</p>
                          </div>
                          <div className="bg-green-50 rounded p-2 border border-green-200">
                            <p className="text-sm font-medium text-green-800">Well-Calibrated</p>
                            <p className="text-xs text-green-600">|OC| &lt; 10%</p>
                            <p className="text-xs text-green-500 mt-1">Confidence matches performance</p>
                          </div>
                          <div className="bg-amber-50 rounded p-2 border border-amber-200">
                            <p className="text-sm font-medium text-amber-700">Moderate OC</p>
                            <p className="text-xs text-amber-600">OC 10-30%</p>
                            <p className="text-xs text-amber-500 mt-1">Somewhat overestimates ability</p>
                          </div>
                          <div className="bg-red-50 rounded p-2 border border-red-200">
                            <p className="text-sm font-medium text-red-800">High OC</p>
                            <p className="text-xs text-red-600">OC &gt; 30%</p>
                            <p className="text-xs text-red-500 mt-1">Significantly overestimates ability</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4 text-xs text-gray-500 mt-3 pt-2 border-t border-gray-200">
                          <div className="flex items-center gap-1">
                            <div className="w-3 h-3 bg-sky-500 rounded"></div>
                            <span>Info (underconfident)</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <div className="w-3 h-3 bg-green-500 rounded"></div>
                            <span>Success (calibrated)</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <div className="w-3 h-3 bg-amber-500 rounded"></div>
                            <span>Warning (moderate)</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <div className="w-3 h-3 bg-red-500 rounded"></div>
                            <span>Danger (high)</span>
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
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                      <GraduationCap className="w-6 h-6 text-blue-600" />
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
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
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
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
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
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
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
                {/* Risk Overview Cards - All use primary blue for consistency */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-3 bg-blue-50 rounded-lg">
                        <Brain className="w-6 h-6 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">Overconfidence</h3>
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

                  <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-3 bg-blue-50 rounded-lg">
                        <Heart className="w-6 h-6 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">High Stress</h3>
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

                  <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-3 bg-blue-50 rounded-lg">
                        <UserCheck className="w-6 h-6 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">First-Gen + Loans</h3>
                        <p className="text-sm text-gray-500">Combined risk</p>
                      </div>
                    </div>
                    <p className="text-3xl font-bold text-gray-900">
                      {analytics.riskProfiles.atRiskIndicators.firstGenWithLoans}
                    </p>
                    <p className="text-sm text-gray-500 mt-1">students</p>
                  </div>

                  <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-3 bg-blue-50 rounded-lg">
                        <AlertTriangle className="w-6 h-6 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">High Interest Loans</h3>
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
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-2 flex items-center gap-2">
                    <Brain className="w-5 h-5 text-blue-600" />
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
                    <div className="p-4 bg-sky-50 rounded-lg border border-sky-200">
                      <div className="text-2xl font-bold text-sky-700">
                        {analytics.riskProfiles.overconfidence.distribution.underconfident}
                      </div>
                      <div className="text-sm font-medium text-sky-600">Underconfident</div>
                      <div className="text-xs text-sky-500 mt-1">OC &lt; -10%</div>
                    </div>
                    <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                      <div className="text-2xl font-bold text-green-700">
                        {analytics.riskProfiles.overconfidence.distribution.low}
                      </div>
                      <div className="text-sm font-medium text-green-600">Well-Calibrated</div>
                      <div className="text-xs text-green-500 mt-1">|OC| &lt; 10%</div>
                    </div>
                    <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
                      <div className="text-2xl font-bold text-amber-600">
                        {analytics.riskProfiles.overconfidence.distribution.moderate}
                      </div>
                      <div className="text-sm font-medium text-amber-600">Moderate OC</div>
                      <div className="text-xs text-amber-500 mt-1">OC 10-30%</div>
                    </div>
                    <div className="p-4 bg-red-50 rounded-lg border border-red-200">
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
                      <div className="w-3 h-3 bg-sky-500 rounded"></div>
                      <span>Info (underconfident)</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-3 bg-green-500 rounded"></div>
                      <span>Success (calibrated)</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-3 bg-amber-500 rounded"></div>
                      <span>Warning (moderate)</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-3 bg-red-500 rounded"></div>
                      <span>Danger (high)</span>
                    </div>
                  </div>
                </div>

                {/* At-Risk Indicators */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-2 flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-amber-600" />
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
                    <div className="flex items-center justify-between p-4 bg-red-50/50 rounded-lg border-l-4 border-red-500">
                      <div>
                        <h4 className="font-medium text-gray-900">Low Knowledge + High Stress</h4>
                        <p className="text-sm text-gray-600">
                          Students with low self-rated knowledge AND frequent financial stress
                        </p>
                      </div>
                      <div className="text-2xl font-bold text-red-600">
                        {analytics.riskProfiles.atRiskIndicators.lowKnowledgeHighStress}
                      </div>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-amber-50/50 rounded-lg border-l-4 border-amber-500">
                      <div>
                        <h4 className="font-medium text-gray-900">First-Generation + Student Loans</h4>
                        <p className="text-sm text-gray-600">
                          First-generation college students with existing loan debt
                        </p>
                      </div>
                      <div className="text-2xl font-bold text-amber-600">
                        {analytics.riskProfiles.atRiskIndicators.firstGenWithLoans}
                      </div>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-amber-50/50 rounded-lg border-l-4 border-amber-500">
                      <div>
                        <h4 className="font-medium text-gray-900">High Interest Rate Loans</h4>
                        <p className="text-sm text-gray-600">
                          Students with loan interest rates above 10%
                        </p>
                      </div>
                      <div className="text-2xl font-bold text-amber-600">
                        {analytics.riskProfiles.atRiskIndicators.highInterestLoans}
                      </div>
                    </div>
                  </div>

                  {/* Legend */}
                  <div className="flex items-center gap-4 text-xs text-gray-500 pt-3 mt-3 border-t border-gray-100">
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-3 bg-red-500 rounded"></div>
                      <span>Danger - high priority</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-3 bg-amber-500 rounded"></div>
                      <span>Warning - monitor</span>
                    </div>
                  </div>
                </div>



                {/* Preference Question Responses */}
                {analytics.riskProfiles.preferenceResponses && analytics.riskProfiles.preferenceResponses.length > 0 && (
                  <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-2 flex items-center gap-2">
                      <MessageSquare className="w-5 h-5 text-blue-600" />
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
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
                <GraduationCap className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-700 mb-2">No Baseline Data Available</h3>
                <p className="text-gray-500">
                  Student profile data will appear here once students complete onboarding.
                </p>
              </div>
            )}

            {/* No risk data message */}
            {activeTab === 'risk' && !analytics.riskProfiles && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
                <AlertTriangle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-700 mb-2">No Risk Profile Data Available</h3>
                <p className="text-gray-500">
                  Risk profile data will appear here once students complete assessments.
                </p>
              </div>
            )}

            {/* Learning Gains Tab */}
            {activeTab === 'learning' && analytics.learningGains && (
              <div className="space-y-6">
                {/* Introduction Panel */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6">
                  <h3 className="text-lg font-bold text-blue-900 mb-3 flex items-center gap-2">
                    <GraduationCap className="w-6 h-6" />
                    Understanding Learning Gains Analysis
                  </h3>
                  <div className="grid md:grid-cols-2 gap-6 text-sm text-blue-800">
                    <div>
                      <h4 className="font-semibold mb-2">What This Tab Shows</h4>
                      <p className="mb-2">
                        This analysis compares student performance <strong>before</strong> and <strong>after</strong> your
                        course intervention to measure learning effectiveness. It answers two research questions:
                      </p>
                      <ul className="list-disc list-inside space-y-1 text-blue-700">
                        <li><strong>RQ1:</strong> Did students improve their financial literacy?</li>
                        <li><strong>RQ2:</strong> Which student groups benefited most/least?</li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-2">How to Use This Data</h4>
                      <ul className="list-disc list-inside space-y-1 text-blue-700">
                        <li>Identify domains where students struggle most</li>
                        <li>Compare effect sizes across domains to prioritize curriculum changes</li>
                        <li>Use psychometric data to validate assessment quality</li>
                        <li>Identify at-risk student groups for targeted support</li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Sample Size Warnings */}
                {analytics.learningGains.sampleWarnings.length > 0 && (
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <Info className="w-5 h-5 text-amber-600 mt-0.5" />
                      <div>
                        <h4 className="font-medium text-amber-800">Sample Size Notice</h4>
                        <ul className="mt-1 text-sm text-amber-700 space-y-1">
                          {analytics.learningGains.sampleWarnings.map((warning, i) => (
                            <li key={i}>{warning}</li>
                          ))}
                        </ul>
                        <p className="mt-2 text-xs text-amber-600">
                          <strong>Why sample size matters:</strong> Statistical tests become unreliable with small samples.
                          Wait for more students to complete both pre and post assessments before drawing conclusions.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Section 1: Learning Gains Overview */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-3 bg-blue-50 rounded-lg">
                        <Users className="w-6 h-6 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">Sample Size</h3>
                        <p className="text-sm text-gray-500">Pre & Post</p>
                      </div>
                    </div>
                    <p className="text-3xl font-bold text-gray-900">
                      n = {analytics.learningGains.overall.sampleSize}
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                      students with both assessments
                    </p>
                    <div className="mt-3 pt-3 border-t border-gray-100">
                      <p className="text-xs text-gray-500">
                        <strong>Note:</strong> Only students who completed both pre-course and post-course
                        assessments are included. Minimum recommended: n≥30.
                      </p>
                    </div>
                  </div>

                  <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-3 bg-green-50 rounded-lg">
                        <TrendingUp className="w-6 h-6 text-green-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">Mean Gain</h3>
                        <p className="text-sm text-gray-500">Post - Pre</p>
                      </div>
                    </div>
                    <p className={`text-3xl font-bold ${analytics.learningGains.overall.gain >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {analytics.learningGains.overall.gain > 0 ? '+' : ''}{analytics.learningGains.overall.gain}%
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                      95% CI: [{analytics.learningGains.overall.gainCI[0]}, {analytics.learningGains.overall.gainCI[1]}]
                    </p>
                    <div className="mt-3 pt-3 border-t border-gray-100">
                      <p className="text-xs text-gray-500">
                        <strong>Calculation:</strong> Average of (post score − pre score) for each student.
                        The 95% CI shows the range where the true gain likely falls.
                      </p>
                    </div>
                  </div>

                  <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-3 bg-purple-50 rounded-lg">
                        <Target className="w-6 h-6 text-purple-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">Effect Size</h3>
                        <p className="text-sm text-gray-500">Cohen&apos;s d</p>
                      </div>
                    </div>
                    <p className="text-3xl font-bold text-gray-900">
                      d = {analytics.learningGains.overall.cohensD}
                    </p>
                    <span className={`inline-block mt-1 px-2 py-1 rounded text-xs font-medium ${
                      analytics.learningGains.overall.cohensInterpretation === 'large' ? 'bg-green-100 text-green-700' :
                      analytics.learningGains.overall.cohensInterpretation === 'medium' ? 'bg-blue-100 text-blue-700' :
                      analytics.learningGains.overall.cohensInterpretation === 'small' ? 'bg-amber-100 text-amber-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {analytics.learningGains.overall.cohensInterpretation}
                    </span>
                    <div className="mt-3 pt-3 border-t border-gray-100">
                      <p className="text-xs text-gray-500">
                        <strong>Why it matters:</strong> Unlike mean gain, effect size is standardized and
                        comparable across studies. d≥0.8 = strong intervention effect.
                      </p>
                    </div>
                  </div>

                  <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-3 bg-sky-50 rounded-lg">
                        <Activity className="w-6 h-6 text-sky-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">Significance</h3>
                        <p className="text-sm text-gray-500">p-value</p>
                      </div>
                    </div>
                    <p className="text-3xl font-bold text-gray-900">
                      p = {analytics.learningGains.overall.pValue < 0.001 ? '<0.001' : analytics.learningGains.overall.pValue}
                    </p>
                    <span className={`inline-block mt-1 px-2 py-1 rounded text-xs font-medium ${
                      analytics.learningGains.overall.pValue < 0.001 ? 'bg-green-100 text-green-700' :
                      analytics.learningGains.overall.pValue < 0.01 ? 'bg-green-100 text-green-700' :
                      analytics.learningGains.overall.pValue < 0.05 ? 'bg-blue-100 text-blue-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {analytics.learningGains.overall.pValue < 0.001 ? '***' :
                       analytics.learningGains.overall.pValue < 0.01 ? '**' :
                       analytics.learningGains.overall.pValue < 0.05 ? '*' : 'ns'}
                    </span>
                    <div className="mt-3 pt-3 border-t border-gray-100">
                      <p className="text-xs text-gray-500">
                        <strong>Interpretation:</strong> p&lt;0.05 means the gain is statistically
                        significant (unlikely due to chance). ns = not significant.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Methodology Note */}
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <details className="cursor-pointer">
                    <summary className="font-medium text-gray-700 text-sm">
                      📊 How are these statistics calculated? (click to expand)
                    </summary>
                    <div className="mt-3 text-xs text-gray-600 space-y-2">
                      <p>
                        <strong>Mean Gain:</strong> Σ(post_score - pre_score) / n. Represents the average
                        percentage point improvement across all students.
                      </p>
                      <p>
                        <strong>95% Confidence Interval:</strong> Mean ± (1.96 × SE), where SE = SD / √n.
                        If CI does not include 0, the gain is statistically significant.
                      </p>
                      <p>
                        <strong>Cohen&apos;s d (effect size):</strong> d = (M_post - M_pre) / SD_pooled.
                        Standardized measure: 0.2 = small, 0.5 = medium, 0.8 = large.
                      </p>
                      <p>
                        <strong>Paired t-test p-value:</strong> Tests whether the mean difference is
                        significantly different from zero. Uses two-tailed test.
                      </p>
                    </div>
                  </details>
                </div>

                {/* Pre vs Post Comparison */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-2 flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-blue-600" />
                    Pre vs Post Score Comparison
                  </h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Visual comparison of average scores before and after the course. SD (Standard Deviation)
                    indicates how spread out the scores are — lower SD after instruction may suggest
                    more consistent learning across students.
                  </p>
                  <div className="grid grid-cols-2 gap-8">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-gray-700">Pre-Course</span>
                        <span className="text-gray-600">
                          {analytics.learningGains.overall.preMean}% (SD: {analytics.learningGains.overall.preSD})
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-4">
                        <div
                          className="bg-gray-500 h-4 rounded-full transition-all duration-500"
                          style={{ width: `${analytics.learningGains.overall.preMean}%` }}
                        />
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-gray-700">Post-Course</span>
                        <span className="text-gray-600">
                          {analytics.learningGains.overall.postMean}% (SD: {analytics.learningGains.overall.postSD})
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-4">
                        <div
                          className="bg-blue-600 h-4 rounded-full transition-all duration-500"
                          style={{ width: `${analytics.learningGains.overall.postMean}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Section 2: Domain-Level Gains */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-2 flex items-center gap-2">
                    <PieChart className="w-5 h-5 text-blue-600" />
                    Learning Gains by Domain
                  </h3>
                  <div className="bg-green-50 rounded-lg p-3 mb-4 text-sm border border-green-100">
                    <p className="text-green-800">
                      <strong>What to look for:</strong> Compare gains and effect sizes (d) across domains.
                      Domains with lower gains may need curriculum reinforcement. Effect size provides a
                      standardized comparison — focus improvement efforts where d is smallest.
                    </p>
                  </div>
                  <div className="space-y-6">
                    {analytics.learningGains.byDomain.map((domain) => (
                      <div key={domain.domain} className="border-b border-gray-100 pb-4 last:border-0 last:pb-0">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <span className="font-medium text-gray-800">
                              {domain.domain.length > 50 ? domain.domain.substring(0, 50) + '...' : domain.domain}
                            </span>
                            <span className="text-sm text-gray-500 ml-2">({domain.itemCount} items)</span>
                          </div>
                          <div className="text-right">
                            <span className={`font-bold ${domain.gain >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {domain.gain > 0 ? '+' : ''}{domain.gain}%
                            </span>
                            <span className="text-sm text-gray-500 ml-2">d = {domain.cohensD}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                              <span>Pre: {domain.preMean}%</span>
                              <span className="text-gray-400">→</span>
                              <span>Post: {domain.postMean}%</span>
                            </div>
                            <div className="relative w-full bg-gray-200 rounded-full h-3">
                              <div
                                className="absolute bg-gray-400 h-3 rounded-full"
                                style={{ width: `${domain.preMean}%` }}
                              />
                              <div
                                className="absolute bg-blue-600 h-3 rounded-full opacity-80"
                                style={{ width: `${domain.postMean}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Section 3: Gains Distribution */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-2 flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-blue-600" />
                    Learning Gains Distribution
                  </h3>
                  <div className="bg-amber-50 rounded-lg p-3 mb-4 text-sm border border-amber-100">
                    <p className="text-amber-800">
                      <strong>How to interpret:</strong> This histogram shows how many students fall into each
                      gain bracket. Red bars indicate students who regressed (scored lower post-course).
                      A healthy distribution should skew right (most students in positive ranges).
                      Students showing regression may need individual follow-up.
                    </p>
                  </div>
                  <div className="flex items-end gap-2 h-40">
                    {analytics.learningGains.distribution.map((bucket) => (
                      <div key={bucket.range} className="flex-1 flex flex-col items-center">
                        <div
                          className={`w-full rounded-t transition-all ${
                            bucket.range.includes('-') && !bucket.range.includes('+')
                              ? 'bg-red-400'
                              : 'bg-green-500'
                          }`}
                          style={{ height: `${Math.max(bucket.percentage * 1.5, 4)}px` }}
                        />
                        <div className="text-xs text-gray-600 mt-2 text-center">
                          <div className="font-medium">{bucket.count}</div>
                          <div className="text-gray-400">{bucket.range}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center justify-center gap-4 mt-4 text-xs text-gray-500">
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-3 bg-red-400 rounded"></div>
                      <span>Regression</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-3 bg-green-500 rounded"></div>
                      <span>Improvement</span>
                    </div>
                  </div>
                </div>

                {/* Section 4: Internal Consistency (Cronbach's Alpha) */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-2 flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-blue-600" />
                    Internal Consistency (Cronbach&apos;s α)
                  </h3>
                  <div className="bg-blue-50 rounded-lg p-4 mb-4 text-sm border border-blue-100">
                    <h4 className="font-semibold text-blue-900 mb-2">What This Shows & Why It Matters</h4>
                    <div className="grid md:grid-cols-2 gap-4 text-blue-800">
                      <div>
                        <p className="mb-2">
                          <strong>Definition:</strong> Cronbach&apos;s alpha measures how well questions within a
                          domain correlate — whether they consistently measure the same underlying concept.
                        </p>
                        <p className="text-xs text-blue-700">
                          <strong>Formula:</strong> α = (k/(k-1)) × (1 - Σσᵢ²/σₜ²), where k = number of items,
                          σᵢ² = variance of each item, σₜ² = total score variance.
                        </p>
                      </div>
                      <div>
                        <p className="mb-2">
                          <strong>Practical implication:</strong> If α is low (&lt;0.7), the domain may be measuring
                          multiple distinct concepts, or some questions may be poorly worded or misaligned.
                        </p>
                        <p className="text-xs text-blue-700">
                          <strong>Action:</strong> Low α suggests reviewing item quality. Consider whether
                          questions truly measure the intended knowledge area.
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-200">
                          <th className="text-left py-3 px-4 font-semibold text-gray-700">Domain</th>
                          <th className="text-center py-3 px-4 font-semibold text-gray-700">Items</th>
                          <th className="text-center py-3 px-4 font-semibold text-gray-700">α</th>
                          <th className="text-center py-3 px-4 font-semibold text-gray-700">Interpretation</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="border-b border-gray-100">
                          <td className="py-3 px-4 text-gray-800">Borrowing & Credit</td>
                          <td className="py-3 px-4 text-center text-gray-600">{analytics.learningGains.cronbachAlpha.borrowingCredit.itemCount}</td>
                          <td className="py-3 px-4 text-center font-mono font-medium">{analytics.learningGains.cronbachAlpha.borrowingCredit.alpha}</td>
                          <td className="py-3 px-4 text-center">
                            <span className={`px-2 py-1 rounded text-xs font-medium ${
                              analytics.learningGains.cronbachAlpha.borrowingCredit.interpretation === 'excellent' ? 'bg-green-100 text-green-700' :
                              analytics.learningGains.cronbachAlpha.borrowingCredit.interpretation === 'good' ? 'bg-green-100 text-green-700' :
                              analytics.learningGains.cronbachAlpha.borrowingCredit.interpretation === 'acceptable' ? 'bg-blue-100 text-blue-700' :
                              analytics.learningGains.cronbachAlpha.borrowingCredit.interpretation === 'questionable' ? 'bg-amber-100 text-amber-700' :
                              'bg-red-100 text-red-700'
                            }`}>
                              {analytics.learningGains.cronbachAlpha.borrowingCredit.interpretation}
                            </span>
                          </td>
                        </tr>
                        <tr className="border-b border-gray-100">
                          <td className="py-3 px-4 text-gray-800">Risk Management</td>
                          <td className="py-3 px-4 text-center text-gray-600">{analytics.learningGains.cronbachAlpha.riskManagement.itemCount}</td>
                          <td className="py-3 px-4 text-center font-mono font-medium">{analytics.learningGains.cronbachAlpha.riskManagement.alpha}</td>
                          <td className="py-3 px-4 text-center">
                            <span className={`px-2 py-1 rounded text-xs font-medium ${
                              analytics.learningGains.cronbachAlpha.riskManagement.interpretation === 'excellent' ? 'bg-green-100 text-green-700' :
                              analytics.learningGains.cronbachAlpha.riskManagement.interpretation === 'good' ? 'bg-green-100 text-green-700' :
                              analytics.learningGains.cronbachAlpha.riskManagement.interpretation === 'acceptable' ? 'bg-blue-100 text-blue-700' :
                              analytics.learningGains.cronbachAlpha.riskManagement.interpretation === 'questionable' ? 'bg-amber-100 text-amber-700' :
                              'bg-red-100 text-red-700'
                            }`}>
                              {analytics.learningGains.cronbachAlpha.riskManagement.interpretation}
                            </span>
                          </td>
                        </tr>
                        <tr className="border-b border-gray-100">
                          <td className="py-3 px-4 text-gray-800">Investment & Risk</td>
                          <td className="py-3 px-4 text-center text-gray-600">{analytics.learningGains.cronbachAlpha.investmentRisk.itemCount}</td>
                          <td className="py-3 px-4 text-center font-mono font-medium">{analytics.learningGains.cronbachAlpha.investmentRisk.alpha}</td>
                          <td className="py-3 px-4 text-center">
                            <span className={`px-2 py-1 rounded text-xs font-medium ${
                              analytics.learningGains.cronbachAlpha.investmentRisk.interpretation === 'excellent' ? 'bg-green-100 text-green-700' :
                              analytics.learningGains.cronbachAlpha.investmentRisk.interpretation === 'good' ? 'bg-green-100 text-green-700' :
                              analytics.learningGains.cronbachAlpha.investmentRisk.interpretation === 'acceptable' ? 'bg-blue-100 text-blue-700' :
                              analytics.learningGains.cronbachAlpha.investmentRisk.interpretation === 'questionable' ? 'bg-amber-100 text-amber-700' :
                              'bg-red-100 text-red-700'
                            }`}>
                              {analytics.learningGains.cronbachAlpha.investmentRisk.interpretation}
                            </span>
                          </td>
                        </tr>
                        <tr className="bg-gray-50">
                          <td className="py-3 px-4 font-semibold text-gray-900">Overall</td>
                          <td className="py-3 px-4 text-center text-gray-600">{analytics.learningGains.cronbachAlpha.overall.itemCount}</td>
                          <td className="py-3 px-4 text-center font-mono font-bold">{analytics.learningGains.cronbachAlpha.overall.alpha}</td>
                          <td className="py-3 px-4 text-center">
                            <span className={`px-2 py-1 rounded text-xs font-medium ${
                              analytics.learningGains.cronbachAlpha.overall.interpretation === 'excellent' ? 'bg-green-100 text-green-700' :
                              analytics.learningGains.cronbachAlpha.overall.interpretation === 'good' ? 'bg-green-100 text-green-700' :
                              analytics.learningGains.cronbachAlpha.overall.interpretation === 'acceptable' ? 'bg-blue-100 text-blue-700' :
                              analytics.learningGains.cronbachAlpha.overall.interpretation === 'questionable' ? 'bg-amber-100 text-amber-700' :
                              'bg-red-100 text-red-700'
                            }`}>
                              {analytics.learningGains.cronbachAlpha.overall.interpretation}
                            </span>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                  <div className="mt-4 text-xs text-gray-500">
                    <strong>Interpretation guide:</strong> α ≥ 0.9 Excellent | 0.8-0.9 Good | 0.7-0.8 Acceptable | 0.6-0.7 Questionable | &lt;0.6 Poor
                  </div>
                </div>

                {/* Section 5: Factor Analysis (EFA) */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                  <button
                    onClick={() => toggleSection('efa')}
                    className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition"
                  >
                    <div className="flex items-center gap-3">
                      <Brain className="w-5 h-5 text-blue-600" />
                      <span className="font-semibold text-gray-800">Factor Analysis (EFA)</span>
                      {analytics.learningGains.efa.warnings.length > 0 && (
                        <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded">
                          {analytics.learningGains.efa.warnings.length} warning(s)
                        </span>
                      )}
                    </div>
                    {expandedSection === 'efa' ? (
                      <ChevronDown className="w-5 h-5 text-gray-400" />
                    ) : (
                      <ChevronRight className="w-5 h-5 text-gray-400" />
                    )}
                  </button>
                  {expandedSection === 'efa' && (
                    <div className="px-6 pb-6">
                      <div className="bg-indigo-50 rounded-lg p-4 mb-4 text-sm border border-indigo-100">
                        <h4 className="font-semibold text-indigo-900 mb-2">Understanding Factor Analysis</h4>
                        <div className="grid md:grid-cols-2 gap-4 text-indigo-800">
                          <div>
                            <p className="mb-2">
                              <strong>What it does:</strong> Exploratory Factor Analysis (EFA) examines whether
                              questions group together as expected. It tests if our 3-domain structure
                              (Borrowing, Risk Management, Investment) is supported by student response patterns.
                            </p>
                            <p className="text-xs text-indigo-700">
                              <strong>Method:</strong> Principal Component Analysis with Varimax rotation
                              to maximize interpretability of factor loadings.
                            </p>
                          </div>
                          <div>
                            <p className="mb-2">
                              <strong>How to interpret:</strong> Each item should have a high loading (≥0.4,
                              shown in bold) on exactly one factor. Cross-loadings (high on multiple factors)
                              suggest the item measures multiple concepts.
                            </p>
                            <p className="text-xs text-indigo-700">
                              <strong>Action:</strong> Items with low loadings (&lt;0.4) or cross-loadings may
                              need revision or reassignment to a different domain.
                            </p>
                          </div>
                        </div>
                      </div>

                      {analytics.learningGains.efa.warnings.length > 0 && (
                        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4">
                          <ul className="text-sm text-amber-700 space-y-1">
                            {analytics.learningGains.efa.warnings.map((warning, i) => (
                              <li key={i}>⚠ {warning}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {analytics.learningGains.efa.loadings.length > 0 ? (
                        <>
                          <div className="mb-4">
                            <h4 className="font-medium text-gray-800 mb-2">Variance Explained</h4>
                            <div className="flex gap-4">
                              {analytics.learningGains.efa.varianceExplained.map((v, i) => (
                                <div key={i} className="text-center">
                                  <div className="text-lg font-bold text-gray-900">{v}%</div>
                                  <div className="text-xs text-gray-500">Factor {i + 1}</div>
                                </div>
                              ))}
                            </div>
                          </div>

                          <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                              <thead>
                                <tr className="border-b border-gray-200">
                                  <th className="text-left py-2 px-3 font-semibold text-gray-700">Item</th>
                                  <th className="text-center py-2 px-3 font-semibold text-gray-700">Factor 1</th>
                                  <th className="text-center py-2 px-3 font-semibold text-gray-700">Factor 2</th>
                                  <th className="text-center py-2 px-3 font-semibold text-gray-700">Factor 3</th>
                                  <th className="text-center py-2 px-3 font-semibold text-gray-700">Primary</th>
                                </tr>
                              </thead>
                              <tbody>
                                {analytics.learningGains.efa.loadings.slice(0, 15).map((item) => (
                                  <tr key={item.itemId} className="border-b border-gray-100">
                                    <td className="py-2 px-3 font-mono text-gray-800">{item.itemId}</td>
                                    <td className={`py-2 px-3 text-center font-mono ${Math.abs(item.factor1) > 0.4 ? 'font-bold text-blue-600' : 'text-gray-500'}`}>
                                      {item.factor1.toFixed(2)}
                                    </td>
                                    <td className={`py-2 px-3 text-center font-mono ${Math.abs(item.factor2) > 0.4 ? 'font-bold text-green-600' : 'text-gray-500'}`}>
                                      {item.factor2.toFixed(2)}
                                    </td>
                                    <td className={`py-2 px-3 text-center font-mono ${Math.abs(item.factor3) > 0.4 ? 'font-bold text-purple-600' : 'text-gray-500'}`}>
                                      {item.factor3.toFixed(2)}
                                    </td>
                                    <td className="py-2 px-3 text-center">
                                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                                        item.primaryFactor === 1 ? 'bg-blue-100 text-blue-700' :
                                        item.primaryFactor === 2 ? 'bg-green-100 text-green-700' :
                                        'bg-purple-100 text-purple-700'
                                      }`}>
                                        F{item.primaryFactor}
                                      </span>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                            {analytics.learningGains.efa.loadings.length > 15 && (
                              <p className="text-sm text-gray-500 mt-2">
                                Showing first 15 of {analytics.learningGains.efa.loadings.length} items
                              </p>
                            )}
                          </div>
                        </>
                      ) : (
                        <p className="text-gray-500 italic">Insufficient data for factor analysis</p>
                      )}
                    </div>
                  )}
                </div>

                {/* Section 6: SUR Heterogeneity Analysis */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                  <button
                    onClick={() => toggleSection('sur')}
                    className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition"
                  >
                    <div className="flex items-center gap-3">
                      <Activity className="w-5 h-5 text-blue-600" />
                      <span className="font-semibold text-gray-800">Heterogeneity Analysis (SUR)</span>
                      {analytics.learningGains.sur.warnings.length > 0 && (
                        <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded">
                          {analytics.learningGains.sur.warnings.length} warning(s)
                        </span>
                      )}
                    </div>
                    {expandedSection === 'sur' ? (
                      <ChevronDown className="w-5 h-5 text-gray-400" />
                    ) : (
                      <ChevronRight className="w-5 h-5 text-gray-400" />
                    )}
                  </button>
                  {expandedSection === 'sur' && (
                    <div className="px-6 pb-6">
                      <div className="bg-purple-50 rounded-lg p-4 mb-4 text-sm border border-purple-100">
                        <h4 className="font-semibold text-purple-900 mb-2">Understanding Heterogeneity Analysis (SUR)</h4>
                        <div className="grid md:grid-cols-2 gap-4 text-purple-800">
                          <div>
                            <p className="mb-2">
                              <strong>What it answers:</strong> Do different student groups (by gender, first-gen
                              status, financial stress, etc.) experience different learning gains? This helps
                              identify equity gaps and target interventions.
                            </p>
                            <p className="text-xs text-purple-700">
                              <strong>Method:</strong> Seemingly Unrelated Regressions (SUR) models gains in all
                              domains simultaneously, accounting for the fact that a student&apos;s gains across
                              domains are correlated.
                            </p>
                          </div>
                          <div>
                            <p className="mb-2">
                              <strong>How to interpret coefficients:</strong> A coefficient of +2.3 for Female
                              means female students gained 2.3 percentage points more than male students in that
                              domain. Negative = lower gains.
                            </p>
                            <p className="text-xs text-purple-700">
                              <strong>Action:</strong> Significant negative coefficients identify groups needing
                              additional support. Consider targeted interventions for underperforming groups.
                            </p>
                          </div>
                        </div>
                      </div>

                      {analytics.learningGains.sur.warnings.length > 0 && (
                        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4">
                          <ul className="text-sm text-amber-700 space-y-1">
                            {analytics.learningGains.sur.warnings.map((warning, i) => (
                              <li key={i}>⚠ {warning}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {analytics.learningGains.sur.coefficients.length > 0 ? (
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="border-b border-gray-200">
                                <th className="text-left py-2 px-3 font-semibold text-gray-700">Covariate</th>
                                <th className="text-center py-2 px-3 font-semibold text-gray-700">Borrowing & Credit</th>
                                <th className="text-center py-2 px-3 font-semibold text-gray-700">Risk Mgmt</th>
                                <th className="text-center py-2 px-3 font-semibold text-gray-700">Investment & Risk</th>
                              </tr>
                            </thead>
                            <tbody>
                              {analytics.learningGains.sur.coefficients.map((row) => (
                                <tr key={row.covariate} className="border-b border-gray-100">
                                  <td className="py-2 px-3 text-gray-800">{row.covariate}</td>
                                  <td className="py-2 px-3 text-center">
                                    <span className={row.borrowingCredit.pValue < 0.05 ? 'font-bold' : ''}>
                                      {row.borrowingCredit.beta > 0 ? '+' : ''}{row.borrowingCredit.beta.toFixed(2)}
                                    </span>
                                    <span className="text-xs text-gray-500 ml-1">
                                      {row.borrowingCredit.pValue < 0.001 ? '***' :
                                       row.borrowingCredit.pValue < 0.01 ? '**' :
                                       row.borrowingCredit.pValue < 0.05 ? '*' : ''}
                                    </span>
                                  </td>
                                  <td className="py-2 px-3 text-center">
                                    <span className={row.riskManagement.pValue < 0.05 ? 'font-bold' : ''}>
                                      {row.riskManagement.beta > 0 ? '+' : ''}{row.riskManagement.beta.toFixed(2)}
                                    </span>
                                    <span className="text-xs text-gray-500 ml-1">
                                      {row.riskManagement.pValue < 0.001 ? '***' :
                                       row.riskManagement.pValue < 0.01 ? '**' :
                                       row.riskManagement.pValue < 0.05 ? '*' : ''}
                                    </span>
                                  </td>
                                  <td className="py-2 px-3 text-center">
                                    <span className={row.investmentRisk.pValue < 0.05 ? 'font-bold' : ''}>
                                      {row.investmentRisk.beta > 0 ? '+' : ''}{row.investmentRisk.beta.toFixed(2)}
                                    </span>
                                    <span className="text-xs text-gray-500 ml-1">
                                      {row.investmentRisk.pValue < 0.001 ? '***' :
                                       row.investmentRisk.pValue < 0.01 ? '**' :
                                       row.investmentRisk.pValue < 0.05 ? '*' : ''}
                                    </span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                          <p className="text-xs text-gray-500 mt-2">
                            * p&lt;0.05, ** p&lt;0.01, *** p&lt;0.001
                          </p>
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <XCircle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                          <p className="text-gray-500">
                            Heterogeneity analysis requires matched pre/post data with baseline covariates.
                          </p>
                          <p className="text-sm text-gray-400 mt-1">
                            Sample size: {analytics.learningGains.sur.sampleSize} students
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* No learning gains data message */}
            {activeTab === 'learning' && !analytics.learningGains && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
                <TrendingUp className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-700 mb-2">No Learning Gains Data Available</h3>
                <p className="text-gray-500">
                  Learning gains require students with both pre-course and post-course assessments.
                </p>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}

// Stat Card Component - Uses primary blue for all icons (consistent enterprise look)
function StatCard({
  icon,
  title,
  value
}: {
  icon: React.ReactNode;
  title: string;
  value: string | number;
}) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <div className="inline-flex p-3 rounded-lg bg-blue-50 text-blue-600 mb-4">
        {icon}
      </div>
      <h3 className="text-sm font-medium text-gray-500 mb-1">{title}</h3>
      <p className="text-3xl font-bold text-gray-900">{value}</p>
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
