'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  LogOut,
  ChevronDown,
  ChevronRight,
  Settings,
  AlertTriangle,
  CheckCircle,
  Eye,
  TrendingUp,
  Users,
  Zap,
  RefreshCw,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';

// ── Types ────────────────────────────────────────────────────
interface MisconceptionEvidence {
  studentAnswer: string;
  reasoning: string;
  evidenceQuote: string;
}

interface Misconception {
  tag: string;
  label: string;
  diagnosisType: string;
  pct: number;
  n: number;
  evidence: MisconceptionEvidence[];
}

interface DashboardItem {
  id: string;
  subdomain: string;
  domain: string;
  total: number;
  correct: number;
  incorrect: number;
  pctCorrect: number;
  pctIncorrect: number;
  confidentErrors: number;
  pctConfErrors: number;
  uncertainCorrect: number;
  diagnoseN: number;
  confirmN: number;
  distractors: Record<string, number>;
  confDist: { low: number; med: number; high: number };
  misconceptions: Misconception[];
}

interface DashboardData {
  overall: {
    students: number;
    meanScore: number;
    medianScore: number;
    totalDiagnose: number;
    totalConfirm: number;
    scoreDist: number[];
  };
  domains: Array<{ name: string; pctCorrect: number; totalConfErrors: number; itemCount: number }>;
  items: DashboardItem[];
  misconceptionSummary: { detected: number; possible: number };
}

// ── Helpers ────────────────────────────────────────────────
type SeverityLevel = 'critical' | 'concern' | 'monitor' | 'ok';

const getSeverity = (pct: number): SeverityLevel =>
  pct >= 50 ? 'critical' : pct >= 25 ? 'concern' : pct >= 10 ? 'monitor' : 'ok';

const severityConfig: Record<SeverityLevel, { label: string; bg: string; text: string; border: string }> = {
  critical: { label: 'Critical', bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200' },
  concern:  { label: 'Needs Attention', bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
  monitor:  { label: 'Monitor', bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
  ok:       { label: 'Strong', bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200' },
};

const barColors = ['#ef4444', '#ef4444', '#ef4444', '#f59e0b', '#f59e0b', '#6366f1', '#6366f1', '#10b981', '#10b981', '#10b981'];

// ── Components ────────────────────────────────────────────
function SeverityBadge({ level }: { level: SeverityLevel }) {
  const config = severityConfig[level];
  return (
    <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold ${config.bg} ${config.text} border ${config.border}`}>
      {config.label}
    </span>
  );
}

function ProgressBar({ pct, color = 'bg-loyola-maroon' }: { pct: number; color?: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className="w-24 h-2 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color} transition-all duration-500`} style={{ width: `${Math.min(pct, 100)}%` }} />
      </div>
      <span className="text-xs font-semibold text-gray-700 w-12">{pct.toFixed(1)}%</span>
    </div>
  );
}

// ── Main Dashboard ────────────────────────────────────────
export default function InstructorDashboardPage() {
  const [view, setView] = useState<'overview' | 'items' | 'misconceptions' | 'knowledge-gaps' | 'selection-errors'>('overview');
  const [selectedDomain, setSelectedDomain] = useState('All');
  const [selectedItem, setSelectedItem] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'confidentErrors' | 'pctIncorrect' | 'pctConfErrors'>('confidentErrors');
  const [instructorName, setInstructorName] = useState('');
  const [expandedMisc, setExpandedMisc] = useState<string | null>(null);
  const router = useRouter();

  const [isAdmin, setIsAdmin] = useState(false);
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async (token: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/instructor/dashboard', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      if (!json.success) throw new Error(json.error || 'Failed to load dashboard data');
      setData(json.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('instructor-token');
    const name = localStorage.getItem('instructor-name');
    if (!token) {
      router.push('/instructor');
      return;
    }
    setInstructorName(name || 'Instructor');
    setIsAdmin(name === 'gbolivard' || name === 'ajalilv');
    localStorage.setItem('active-portal', 'instructor');
    fetchData(token);
  }, [router, fetchData]);

  const handleLogout = () => {
    localStorage.removeItem('instructor-token');
    localStorage.removeItem('instructor-name');
    localStorage.removeItem('active-portal');
    router.push('/instructor');
  };

  const handleRefresh = () => {
    const token = localStorage.getItem('instructor-token');
    if (token) fetchData(token);
  };

  const filteredItems = useMemo(() => {
    if (!data) return [];
    let items = data.items;
    if (selectedDomain !== 'All') items = items.filter(i => i.domain === selectedDomain);
    return [...items].sort((a, b) => b[sortBy] - a[sortBy]);
  }, [data, selectedDomain, sortBy]);

  const topConcerns = useMemo(() => {
    if (!data) return [];
    return data.items.filter(i => i.pctIncorrect >= 25).sort((a, b) => b.confidentErrors - a.confidentErrors).slice(0, 6);
  }, [data]);

  const scoreDistData = useMemo(() => {
    if (!data) return [];
    return data.overall.scoreDist.map((count, i) => ({
      range: `${i * 10}-${i * 10 + 9}%`,
      count,
    }));
  }, [data]);

  const totalConfidentErrors = useMemo(() => data ? data.items.reduce((s, i) => s + i.confidentErrors, 0) : 0, [data]);
  const totalIncorrect = useMemo(() => data ? data.items.reduce((s, i) => s + i.incorrect, 0) : 0, [data]);
  const overconfidenceRate = totalIncorrect > 0 ? (totalConfidentErrors / totalIncorrect * 100).toFixed(1) : '0';
  const itemsWithMisconceptions = useMemo(() => {
    if (!data) return 0;
    return data.items.filter(i => i.misconceptions.some(m => m.diagnosisType === 'misconception')).length;
  }, [data]);

  // ── Loading State ──
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 text-loyola-maroon animate-spin mx-auto mb-3" />
          <p className="text-gray-500 text-sm">Loading dashboard data...</p>
        </div>
      </div>
    );
  }

  // ── Error State ──
  if (error || !data) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center bg-white p-8 rounded-xl border border-red-200 max-w-md">
          <AlertTriangle className="w-8 h-8 text-red-500 mx-auto mb-3" />
          <h2 className="text-lg font-bold text-gray-900 mb-2">Failed to Load Dashboard</h2>
          <p className="text-sm text-gray-500 mb-4">{error || 'No data available'}</p>
          <button
            onClick={handleRefresh}
            className="px-4 py-2 bg-loyola-maroon text-white rounded-lg text-sm hover:bg-red-900 transition"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div>
              <div className="text-xs font-semibold text-loyola-maroon uppercase tracking-wider">QUIN 102 / SDM-10 Diagnostic</div>
              <h1 className="text-2xl font-bold text-gray-900">Instructor Dashboard</h1>
              <p className="text-sm text-gray-500">Test 1 Results, Spring 2026 &middot; {data.overall.students} students</p>
            </div>
            <div className="flex items-center gap-3">
              {/* Tab navigation */}
              <div className="hidden sm:flex bg-gray-100 rounded-lg p-1">
                {(['overview', 'items', 'misconceptions', 'knowledge-gaps', 'selection-errors'] as const).map(v => (
                  <button
                    key={v}
                    onClick={() => setView(v)}
                    className={`px-3 py-1.5 rounded-md text-sm font-medium transition ${
                      view === v
                        ? 'bg-white text-loyola-maroon shadow-sm'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    {v === 'overview' ? 'Overview' : v === 'items' ? 'Item Analysis' : v === 'misconceptions' ? 'Misconceptions' : v === 'knowledge-gaps' ? 'Knowledge Gaps' : 'Selection Errors'}
                  </button>
                ))}
              </div>
              <button
                onClick={handleRefresh}
                className="p-2 text-gray-500 hover:text-gray-700 transition"
                title="Refresh"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
              {isAdmin && (
                <button
                  onClick={() => {
                    localStorage.setItem('active-portal', 'admin');
                    router.push('/admin');
                  }}
                  className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-500 hover:text-loyola-maroon border border-gray-200 rounded-lg hover:border-loyola-maroon transition"
                  title="Switch to Admin Portal"
                >
                  <Settings className="w-4 h-4" />
                  <span className="hidden sm:inline">Admin Portal</span>
                </button>
              )}
              <button onClick={handleLogout} className="flex items-center gap-2 px-3 py-1.5 text-gray-500 hover:text-gray-700 transition text-sm">
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          </div>
          {/* Mobile tab nav */}
          <div className="flex sm:hidden mt-3 bg-gray-100 rounded-lg p-1 overflow-x-auto">
            {(['overview', 'items', 'misconceptions', 'knowledge-gaps', 'selection-errors'] as const).map(v => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={`flex-1 px-2 py-1.5 rounded-md text-xs font-medium transition whitespace-nowrap ${
                  view === v
                    ? 'bg-white text-loyola-maroon shadow-sm'
                    : 'text-gray-500'
                }`}
              >
                {v === 'overview' ? 'Overview' : v === 'items' ? 'Items' : v === 'misconceptions' ? 'Miscon.' : v === 'knowledge-gaps' ? 'Gaps' : 'Errors'}
              </button>
            ))}
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-7xl">

        {/* ── OVERVIEW TAB ── */}
        {view === 'overview' && (
          <>
            {/* Guide Banner */}
            <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4 mb-6">
              <h2 className="text-sm font-bold text-indigo-900 mb-1">How to Use This Dashboard</h2>
              <p className="text-xs text-indigo-700 leading-relaxed">
                This dashboard summarizes your students&apos; performance on the pre-assessment, powered by the SDM-10 diagnostic model.
                Use <strong>Overview</strong> to see where your class stands overall.
                Use <strong>Item Analysis</strong> to drill into specific questions and see which answer choices students picked and why.
                Use <strong>Misconceptions</strong> to identify wrong beliefs, <strong>Knowledge Gaps</strong> to see where students lack foundational knowledge,
                and <strong>Selection Errors</strong> to find questions where students understood the concept but made a mechanical mistake.
              </p>
            </div>

            {/* KPI Row */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <div className="bg-white rounded-xl p-5 border border-gray-200">
                <div className="flex items-center gap-2 text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                  <TrendingUp className="w-3.5 h-3.5" /> Mean Score
                </div>
                <div className="text-3xl font-bold text-loyola-maroon">{data.overall.meanScore}%</div>
                <div className="text-xs text-gray-400 mt-0.5">Median: {data.overall.medianScore}%</div>
                <p className="text-[10px] text-gray-400 mt-2 leading-snug">Average percentage of the 26 scored knowledge questions answered correctly. This is a baseline before your course instruction.</p>
              </div>
              <div className="bg-white rounded-xl p-5 border border-gray-200">
                <div className="flex items-center gap-2 text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                  <Users className="w-3.5 h-3.5" /> Students
                </div>
                <div className="text-3xl font-bold text-gray-900">{data.overall.students}</div>
                <div className="text-xs text-gray-400 mt-0.5">Completed Test 1</div>
                <p className="text-[10px] text-gray-400 mt-2 leading-snug">Total students who completed the full pre-assessment (26 knowledge items + optional SDM-10 follow-up).</p>
              </div>
              <div className="bg-white rounded-xl p-5 border border-gray-200">
                <div className="flex items-center gap-2 text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                  <AlertTriangle className="w-3.5 h-3.5" /> Overconfidence Rate
                </div>
                <div className={`text-3xl font-bold ${Number(overconfidenceRate) > 20 ? 'text-red-600' : Number(overconfidenceRate) > 10 ? 'text-amber-600' : 'text-green-600'}`}>{overconfidenceRate}%</div>
                <div className="text-xs text-gray-400 mt-0.5">{totalConfidentErrors} of {totalIncorrect} wrong answers</div>
                <p className="text-[10px] text-gray-400 mt-2 leading-snug">Percentage of wrong answers where the student reported high confidence. These are the hardest misconceptions to correct &mdash; students don&apos;t know what they don&apos;t know. Above 15% signals significant overconfidence.</p>
              </div>
              <div className="bg-white rounded-xl p-5 border border-gray-200">
                <div className="flex items-center gap-2 text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                  <Zap className="w-3.5 h-3.5" /> Misconceptions Detected
                </div>
                <div className="text-3xl font-bold text-green-600">{data.misconceptionSummary.detected}</div>
                <div className="text-xs text-gray-400 mt-0.5">of {data.misconceptionSummary.possible} possible types, across {itemsWithMisconceptions} questions</div>
                <p className="text-[10px] text-gray-400 mt-2 leading-snug">Unique misconception types identified through SDM-10 diagnostic follow-ups. These are specific wrong beliefs your students hold &mdash; not just wrong answers. See the Misconceptions tab for details and teaching strategies.</p>
              </div>
            </div>

            {/* Score Distribution + Domain Performance */}
            <div className="grid lg:grid-cols-3 gap-4 mb-6">
              <div className="lg:col-span-2 bg-white rounded-xl p-5 border border-gray-200">
                <h3 className="text-sm font-semibold text-gray-700 mb-1">Score Distribution</h3>
                <p className="text-xs text-gray-400 mb-4">How student scores are spread across the class. Red bars (left) indicate students who may need the most support. Green bars (right) indicate strong performers. A left-skewed distribution suggests the class may need more foundational review.</p>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={scoreDistData}>
                    <XAxis dataKey="range" tick={{ fontSize: 11, fill: '#6b7280' }} />
                    <YAxis tick={{ fontSize: 11, fill: '#6b7280' }} />
                    <Tooltip
                      content={({ active, payload }) => active && payload?.length ? (
                        <div className="bg-gray-900 text-white px-3 py-2 rounded-lg text-xs shadow-lg">
                          {payload[0].payload.range}: <strong>{payload[0].value} students</strong>
                        </div>
                      ) : null}
                    />
                    <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                      {scoreDistData.map((_d, i) => (
                        <Cell key={i} fill={barColors[i]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="bg-white rounded-xl p-5 border border-gray-200">
                <h3 className="text-sm font-semibold text-gray-700 mb-1">Domain Performance</h3>
                <p className="text-xs text-gray-400 mb-4">Average correct rate for each content domain. Red (&lt;65%) = significant gaps to address. Amber (65-74%) = room for improvement. Green (75%+) = generally well understood. Focus your teaching time on red and amber domains.</p>
                <div className="space-y-5">
                  {data.domains.map((d, i) => (
                    <div key={i}>
                      <div className="flex justify-between text-sm mb-1.5">
                        <span className="font-medium text-gray-700">{d.name}</span>
                        <span className={`font-bold ${d.pctCorrect < 65 ? 'text-red-600' : d.pctCorrect < 75 ? 'text-amber-600' : 'text-green-600'}`}>
                          {d.pctCorrect}%
                        </span>
                      </div>
                      <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-700 ${
                            d.pctCorrect < 65 ? 'bg-red-500' : d.pctCorrect < 75 ? 'bg-amber-500' : 'bg-green-500'
                          }`}
                          style={{ width: `${d.pctCorrect}%` }}
                        />
                      </div>
                      <div className="text-xs text-gray-400 mt-1">{d.totalConfErrors} confident errors across {d.itemCount} items</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Priority Items */}
            <div className="bg-white rounded-xl p-5 border border-gray-200">
              <h3 className="text-sm font-semibold text-gray-700 mb-1">Priority Items for Instruction</h3>
              <p className="text-xs text-gray-400 mb-4">Sorted by confident errors. These represent the strongest misconceptions to address in class.</p>
              <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-3">
                {topConcerns.map(item => {
                  const sev = getSeverity(item.pctIncorrect);
                  const config = severityConfig[sev];
                  return (
                    <button
                      key={item.id}
                      onClick={() => { setSelectedItem(item.id); setView('items'); }}
                      className={`text-left p-4 rounded-lg border ${config.border} ${config.bg} hover:shadow-md transition-all`}
                    >
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-base font-bold text-gray-900">{item.id}</span>
                        <SeverityBadge level={sev} />
                      </div>
                      <div className="text-sm font-medium text-gray-700 mb-2">{item.subdomain}</div>
                      <div className="flex gap-4 text-xs text-gray-500">
                        <span><strong className="text-red-600">{item.pctIncorrect}%</strong> incorrect</span>
                        <span><strong className="text-red-800">{item.confidentErrors}</strong> confident errors</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </>
        )}

        {/* ── ITEMS TAB ── */}
        {view === 'items' && (
          <>
            {/* Guide */}
            <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4 mb-4">
              <h2 className="text-sm font-bold text-indigo-900 mb-1">Item Analysis Guide</h2>
              <p className="text-xs text-indigo-700 leading-relaxed mb-2">
                Each row is one assessment question. Click any row to expand it and see detailed diagnostics.
              </p>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 text-[11px] text-indigo-700">
                <div><strong>Status badges:</strong> Based on % incorrect. <span className="text-red-600">Critical</span> (50%+), <span className="text-amber-600">Needs Attention</span> (25-49%), <span className="text-blue-600">Monitor</span> (10-24%), <span className="text-green-600">Strong</span> (&lt;10%).</div>
                <div><strong>Conf. Errors:</strong> Students who got it wrong AND were confident they were right. These reflect deep-seated misconceptions that simple review won&apos;t fix.</div>
                <div><strong>Diagnose:</strong> Number of students who received a follow-up question to identify <em>why</em> they answered incorrectly. Higher = more diagnostic data available.</div>
                <div><strong>Confirm:</strong> Number of students who were correct but uncertain, and received a follow-up to verify their understanding. Helps distinguish lucky guesses from true knowledge.</div>
              </div>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-3 mb-4 items-center">
              <span className="text-xs font-semibold text-gray-500 uppercase">Domain:</span>
              {['All', 'Borrowing & Credit', 'Risk Management', 'Investment & Risk'].map(d => (
                <button
                  key={d}
                  onClick={() => setSelectedDomain(d)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition ${
                    selectedDomain === d
                      ? 'bg-loyola-maroon text-white border-loyola-maroon'
                      : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
                  }`}
                >
                  {d}
                </button>
              ))}
              <div className="ml-auto flex items-center gap-2">
                <span className="text-xs font-semibold text-gray-500 uppercase">Sort:</span>
                <select
                  value={sortBy}
                  onChange={e => setSortBy(e.target.value as typeof sortBy)}
                  className="px-2 py-1.5 rounded-lg text-xs border border-gray-200 bg-white"
                >
                  <option value="confidentErrors">Confident Errors</option>
                  <option value="pctIncorrect">% Incorrect</option>
                  <option value="pctConfErrors">% Confident Errors</option>
                </select>
              </div>
            </div>

            {/* Item Table */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      {['Item', 'Subdomain', 'Status', '% Incorrect', 'Conf. Errors', 'Diagnose', 'Confirm'].map(h => (
                        <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredItems.map((item, i) => {
                      const sev = getSeverity(item.pctIncorrect);
                      const isSelected = selectedItem === item.id;
                      return (
                        <>{/* eslint-disable-next-line react/jsx-key */}
                          <tr
                            key={item.id}
                            onClick={() => setSelectedItem(isSelected ? null : item.id)}
                            className={`cursor-pointer border-b border-gray-100 transition ${
                              isSelected ? 'bg-indigo-50' : i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'
                            } hover:bg-indigo-50/50`}
                          >
                            <td className="px-4 py-3 font-bold text-gray-900 flex items-center gap-1.5">
                              {isSelected ? <ChevronDown className="w-3.5 h-3.5 text-gray-400" /> : <ChevronRight className="w-3.5 h-3.5 text-gray-400" />}
                              {item.id}
                            </td>
                            <td className="px-4 py-3 text-gray-600">{item.subdomain}</td>
                            <td className="px-4 py-3"><SeverityBadge level={sev} /></td>
                            <td className="px-4 py-3">
                              <ProgressBar
                                pct={item.pctIncorrect}
                                color={sev === 'critical' ? 'bg-red-500' : sev === 'concern' ? 'bg-amber-500' : sev === 'monitor' ? 'bg-blue-500' : 'bg-green-500'}
                              />
                            </td>
                            <td className={`px-4 py-3 font-bold ${item.confidentErrors >= 30 ? 'text-red-600' : 'text-gray-700'}`}>{item.confidentErrors}</td>
                            <td className="px-4 py-3 text-gray-500">{item.diagnoseN}</td>
                            <td className="px-4 py-3 text-gray-500">{item.confirmN}</td>
                          </tr>
                          {isSelected && (
                            <tr key={`${item.id}-detail`}>
                              <td colSpan={7} className="px-0 py-0 bg-indigo-50/50 border-b-2 border-indigo-200">
                                <div className="p-5">
                                  <div className="grid md:grid-cols-3 gap-5 mb-4">
                                    {/* Error Confidence */}
                                    <div>
                                      <h4 className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">Error Confidence Distribution</h4>
                                      <p className="text-[10px] text-gray-400 mb-2">How confident were students who got this wrong? High-confidence errors indicate misconceptions; low-confidence errors may self-correct with review.</p>
                                      <div className="flex gap-4">
                                        {[
                                          { label: 'Low', val: item.confDist.low, color: 'text-green-600' },
                                          { label: 'Medium', val: item.confDist.med, color: 'text-amber-600' },
                                          { label: 'High', val: item.confDist.high, color: 'text-red-600' },
                                        ].map(c => (
                                          <div key={c.label} className="text-center flex-1">
                                            <div className={`text-2xl font-bold ${c.color}`}>{c.val}</div>
                                            <div className="text-xs text-gray-400">{c.label} conf.</div>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                    {/* Distractors */}
                                    <div>
                                      <h4 className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">Distractor Distribution</h4>
                                      <p className="text-[10px] text-gray-400 mb-2">Which wrong answers did students choose? The most popular distractor often reveals a common reasoning pattern or misconception you can address in class.</p>
                                      <div className="flex flex-wrap gap-2">
                                        {Object.entries(item.distractors).sort((a, b) => b[1] - a[1]).map(([opt, n]) => (
                                          <div key={opt} className="px-3 py-1.5 rounded-lg bg-white border border-gray-200 text-xs">
                                            <strong>{opt}</strong>: {n} <span className="text-gray-400">({item.incorrect > 0 ? (n / item.incorrect * 100).toFixed(0) : 0}%)</span>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                    {/* SDM Coverage */}
                                    <div>
                                      <h4 className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">SDM Coverage</h4>
                                      <p className="text-[10px] text-gray-400 mb-2">How many eligible students received a diagnostic follow-up? Higher coverage = more reliable misconception data for this item.</p>
                                      <div className="text-xs text-gray-600 space-y-1">
                                        <div>Diagnose: {item.diagnoseN} / {item.confidentErrors} eligible ({item.confidentErrors > 0 ? (item.diagnoseN / item.confidentErrors * 100).toFixed(0) : 0}%)</div>
                                        <div>Confirm: {item.confirmN} / {item.uncertainCorrect} eligible ({item.uncertainCorrect > 0 ? (item.confirmN / item.uncertainCorrect * 100).toFixed(0) : 0}%)</div>
                                      </div>
                                    </div>
                                  </div>
                                  {/* Misconceptions */}
                                  <h4 className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">Misconception Breakdown</h4>
                                  <p className="text-[10px] text-gray-400 mb-2">Specific wrong beliefs identified through diagnostic follow-ups. <span className="text-red-500 font-medium">Red</span> = active misconception (student holds a wrong belief). <span className="text-purple-500 font-medium">Purple</span> = selection error (student understood but chose wrong). <span className="text-gray-500 font-medium">Gray</span> = knowledge gap (student didn&apos;t know).</p>
                                  {item.misconceptions.length === 0 ? (
                                    <p className="text-xs text-gray-400 italic">No diagnostic follow-up data for this item. This means few students were flagged for follow-up, so the error rate is likely low or confidence was low.</p>
                                  ) : (
                                    <div className="space-y-1">
                                      {item.misconceptions.map((m, mi) => (
                                        <div key={mi} className="flex items-center gap-3 py-1.5">
                                          <div className="w-40 shrink-0">
                                            <div className={`text-xs font-semibold ${m.diagnosisType === 'selection_error' ? 'text-purple-600' : m.diagnosisType === 'knowledge_gap' ? 'text-gray-500' : 'text-red-600'}`}>
                                              {m.label}
                                            </div>
                                            <div className="text-[10px] text-gray-400 font-mono">{m.tag}</div>
                                          </div>
                                          <ProgressBar
                                            pct={m.pct}
                                            color={m.diagnosisType === 'selection_error' ? 'bg-purple-500' : m.diagnosisType === 'knowledge_gap' ? 'bg-gray-400' : 'bg-red-500'}
                                          />
                                          <span className="text-xs text-gray-500">n={m.n}</span>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              </td>
                            </tr>
                          )}
                        </>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {/* ── MISCONCEPTIONS TAB ── */}
        {view === 'misconceptions' && (
          <>
            {/* Guide */}
            <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4 mb-6">
              <h2 className="text-sm font-bold text-indigo-900 mb-1">Understanding Misconceptions</h2>
              <p className="text-xs text-indigo-700 leading-relaxed mb-2">
                This tab shows the specific wrong beliefs your students hold, identified through SDM-10 diagnostic follow-up questions.
                Unlike a simple &quot;% incorrect&quot; metric, these reveal <em>why</em> students are getting questions wrong, so you can tailor your instruction to directly address those beliefs.
                Click any row to see the actual student responses that led to this classification.
              </p>
              <p className="text-[11px] text-indigo-600 mt-1">
                Only true misconceptions are shown below. Selection errors and knowledge gaps are filtered out &mdash; see the Item Analysis tab for the full breakdown per question.
              </p>
            </div>

            {/* Class-wide misconceptions */}
            <div className="bg-white rounded-xl p-5 border border-gray-200 mb-6">
              <h3 className="text-sm font-semibold text-gray-700 mb-1">Class-Wide Misconception Prevalence</h3>
              <p className="text-xs text-gray-400 mb-5">
                Ranked by number of students affected. The progress bar shows what fraction of diagnosed students hold each belief. Focus your teaching on items near the top of this list for maximum impact.
              </p>
              <div className="space-y-0.5">
                {(() => {
                  const allMisc: (Misconception & { itemId: string; subdomain: string })[] = [];
                  data.items.forEach(item => {
                    item.misconceptions?.forEach(m => {
                      if (m.diagnosisType === 'misconception') {
                        allMisc.push({ ...m, itemId: item.id, subdomain: item.subdomain });
                      }
                    });
                  });
                  allMisc.sort((a, b) => b.n - a.n);
                  return allMisc.map((m, i) => {
                    const key = `${m.itemId}-${m.tag}`;
                    const isExpanded = expandedMisc === key;
                    return (
                      <div key={i}>
                        <button
                          onClick={() => setExpandedMisc(isExpanded ? null : key)}
                          className="w-full flex items-center gap-4 py-3 px-4 border-b border-gray-50 hover:bg-gray-50 rounded-lg transition text-left"
                        >
                          <span className="text-sm font-bold text-loyola-maroon w-10">{m.itemId}</span>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-semibold text-gray-800 truncate">{m.label}</div>
                            <div className="text-xs text-gray-400">{m.subdomain}</div>
                          </div>
                          <div className="w-48">
                            <ProgressBar
                              pct={m.pct}
                              color="bg-red-500"
                            />
                          </div>
                          <span className="text-xs font-semibold text-gray-600 w-14 text-right">n = {m.n}</span>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-red-50 text-red-600 border border-red-200">
                            Misconception
                          </span>
                          {m.evidence && m.evidence.length > 0 && (
                            isExpanded
                              ? <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" />
                              : <ChevronRight className="w-4 h-4 text-gray-400 shrink-0" />
                          )}
                        </button>
                        {isExpanded && m.evidence && m.evidence.length > 0 && (
                          <div className="ml-14 mr-4 mb-3 mt-1 space-y-2 border-l-2 border-red-200 pl-4">
                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Student Responses ({m.evidence.length})</p>
                            {m.evidence.map((e, j) => (
                              <div key={j} className="bg-gray-50 rounded-lg p-3 text-xs">
                                <p className="text-gray-700 italic">&ldquo;{e.studentAnswer}&rdquo;</p>
                                {e.reasoning && (
                                  <p className="text-gray-400 mt-1.5"><span className="font-medium text-gray-500">AI Analysis:</span> {e.reasoning}</p>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  });
                })()}
              </div>
            </div>

            {/* Instructional Recommendations */}
            <div className="bg-white rounded-xl p-5 border border-gray-200">
              <h3 className="text-sm font-semibold text-gray-700 mb-1">Instructional Recommendations</h3>
              <p className="text-xs text-gray-400 mb-2">Actionable teaching suggestions generated from the diagnostic data. Each recommendation includes what the data shows and a concrete strategy you can use in class.</p>
              <div className="text-[11px] text-gray-400 mb-5 flex flex-wrap gap-4">
                <span><span className="inline-block w-2 h-2 rounded-full bg-red-500 mr-1" />Critical = widespread misconception, address immediately</span>
                <span><span className="inline-block w-2 h-2 rounded-full bg-amber-500 mr-1" />High = significant issue, plan a lesson segment</span>
                <span><span className="inline-block w-2 h-2 rounded-full bg-blue-500 mr-1" />Monitor = worth watching, brief mention may suffice</span>
              </div>

              {[
                { priority: 'Critical', dot: 'bg-red-500', title: 'text-red-600', card: 'bg-red-50 border-red-200', items: [
                  { q: 'Q6', topic: 'Inflation (Lowering)', issue: '55% of diagnosed students (n=36) believe lower inflation means falling prices. An additional 22% (n=14) incorrectly link inflation to employment changes. Students confuse the rate of price change with the price level itself.', action: 'Use a concrete example: if prices rose 8% last year and 3% this year, prices are still higher, just rising more slowly. A visual timeline of price levels vs. inflation rate would help.' },
                ]},
                { priority: 'High', dot: 'bg-amber-500', title: 'text-amber-600', card: 'bg-amber-50 border-amber-200', items: [
                  { q: 'Q36', topic: 'Diversification (Savings)', issue: '38% of diagnosed students (n=20) made selection errors (reversal), and 28% (n=15) had correct reasoning but chose the wrong answer. The True/False negative phrasing confused them.', action: 'This is largely a question design issue, not a knowledge gap. Consider rewording for Test 2. No additional teaching needed for most of these students.' },
                  { q: 'Q10', topic: 'Credit Reports', issue: '33% (n=17) did not know employers can check credit reports. 31% (n=16) were selection errors (self-corrected during SDM follow-up).', action: 'Brief lesson on credit report access rights. The high self-correction rate suggests partial knowledge — a quick review may be sufficient.' },
                  { q: 'Q12', topic: 'Health Insurance', issue: '56% of diagnosed students (n=19) believe insurance is primarily for routine care. 18% (n=6) judge by frequency of use rather than severity of need.', action: 'Teach the catastrophic protection model. Use example: $200 checkup vs. $200,000 surgery. Which one would bankrupt you without insurance?' },
                ]},
                { priority: 'Monitor', dot: 'bg-blue-500', title: 'text-blue-600', card: 'bg-blue-50 border-blue-200', items: [
                  { q: 'Q30', topic: 'Risk-Return Tradeoff', issue: '67% of diagnosed students (n=14) argue that because exceptions exist, the general principle is false.', action: 'Teach the difference between general principles and universal rules. Use: "Taller people are likely heavier. Is this always true? No. Is it generally true? Yes."' },
                  { q: 'Q7', topic: 'Inflation & Fixed Income', issue: '27% (n=16) believe older workers suffer most from inflation, 25% (n=15) believe young couples suffer most. Students split between empathy-driven reasoning and not understanding "fixed income."', action: 'Define "fixed income" explicitly before discussing inflation impact on different groups.' },
                ]},
              ].map(section => (
                <div key={section.priority} className="mb-6 last:mb-0">
                  <div className="flex items-center gap-2 mb-3">
                    <div className={`w-2.5 h-2.5 rounded-full ${section.dot}`} />
                    <span className={`text-sm font-bold ${section.title}`}>{section.priority} Priority</span>
                  </div>
                  <div className="space-y-2">
                    {section.items.map((item, i) => (
                      <div key={i} className={`p-4 rounded-lg border ${section.card}`}>
                        <div className="flex gap-2 items-center mb-1.5">
                          <span className="font-bold text-gray-900">{item.q}</span>
                          <span className="text-xs text-gray-500">{item.topic}</span>
                        </div>
                        <p className="text-sm text-gray-700 mb-1"><strong>Finding:</strong> {item.issue}</p>
                        <p className="text-sm text-gray-800"><strong>Recommendation:</strong> {item.action}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
        {/* ── KNOWLEDGE GAPS TAB ── */}
        {view === 'knowledge-gaps' && (
          <>
            <div className="bg-gray-100 border border-gray-300 rounded-xl p-4 mb-6">
              <h2 className="text-sm font-bold text-gray-800 mb-1">Understanding Knowledge Gaps</h2>
              <p className="text-xs text-gray-600 leading-relaxed mb-2">
                Knowledge gaps represent cases where students simply did not know the answer &mdash; they left it blank, said &quot;I don&apos;t know,&quot; or gave a vague response
                that showed no existing belief to correct. Unlike misconceptions (wrong beliefs), knowledge gaps are easier to address: students are starting from zero, not from a wrong foundation.
              </p>
              <p className="text-[11px] text-gray-500 mt-1">
                Click any row to see the actual student responses classified as knowledge gaps.
              </p>
            </div>

            <div className="bg-white rounded-xl p-5 border border-gray-200 mb-6">
              <h3 className="text-sm font-semibold text-gray-700 mb-1">Knowledge Gap Prevalence</h3>
              <p className="text-xs text-gray-400 mb-5">
                Ranked by number of students affected. These students need foundational instruction &mdash; they lack the knowledge entirely rather than holding wrong beliefs.
              </p>
              <div className="space-y-0.5">
                {(() => {
                  const allGaps: (Misconception & { itemId: string; subdomain: string })[] = [];
                  data.items.forEach(item => {
                    item.misconceptions?.forEach(m => {
                      if (m.diagnosisType === 'knowledge_gap') {
                        allGaps.push({ ...m, itemId: item.id, subdomain: item.subdomain });
                      }
                    });
                  });
                  allGaps.sort((a, b) => b.n - a.n);
                  if (allGaps.length === 0) {
                    return <p className="text-sm text-gray-400 italic py-4">No knowledge gaps identified in the diagnostic data.</p>;
                  }
                  return allGaps.map((m, i) => {
                    const key = `kg-${m.itemId}-${m.tag}`;
                    const isExpanded = expandedMisc === key;
                    return (
                      <div key={i}>
                        <button
                          onClick={() => setExpandedMisc(isExpanded ? null : key)}
                          className="w-full flex items-center gap-4 py-3 px-4 border-b border-gray-50 hover:bg-gray-50 rounded-lg transition text-left"
                        >
                          <span className="text-sm font-bold text-loyola-maroon w-10">{m.itemId}</span>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-semibold text-gray-800 truncate">{m.label}</div>
                            <div className="text-xs text-gray-400">{m.subdomain}</div>
                          </div>
                          <div className="w-48">
                            <ProgressBar pct={m.pct} color="bg-gray-400" />
                          </div>
                          <span className="text-xs font-semibold text-gray-600 w-14 text-right">n = {m.n}</span>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-gray-100 text-gray-600 border border-gray-300">
                            Knowledge Gap
                          </span>
                          {m.evidence && m.evidence.length > 0 && (
                            isExpanded
                              ? <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" />
                              : <ChevronRight className="w-4 h-4 text-gray-400 shrink-0" />
                          )}
                        </button>
                        {isExpanded && m.evidence && m.evidence.length > 0 && (
                          <div className="ml-14 mr-4 mb-3 mt-1 space-y-2 border-l-2 border-gray-300 pl-4">
                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Student Responses ({m.evidence.length})</p>
                            {m.evidence.map((e, j) => (
                              <div key={j} className="bg-gray-50 rounded-lg p-3 text-xs">
                                <p className="text-gray-700 italic">&ldquo;{e.studentAnswer}&rdquo;</p>
                                {e.reasoning && (
                                  <p className="text-gray-400 mt-1.5"><span className="font-medium text-gray-500">AI Analysis:</span> {e.reasoning}</p>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  });
                })()}
              </div>
            </div>
          </>
        )}

        {/* ── SELECTION ERRORS TAB ── */}
        {view === 'selection-errors' && (
          <>
            <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 mb-6">
              <h2 className="text-sm font-bold text-purple-900 mb-1">Understanding Selection Errors</h2>
              <p className="text-xs text-purple-700 leading-relaxed mb-2">
                Selection errors occur when students understood the concept but chose the wrong answer due to a mechanical mistake &mdash; misreading the question,
                reversing their intended choice, or self-correcting during the diagnostic follow-up. These are <strong>not</strong> knowledge deficits: the student
                already knows the material, they just made an error in execution.
              </p>
              <p className="text-[11px] text-purple-600 mt-1">
                Click any row to see the actual student responses. High selection error rates on a question may indicate confusing wording that should be revised for future tests.
              </p>
            </div>

            <div className="bg-white rounded-xl p-5 border border-gray-200 mb-6">
              <h3 className="text-sm font-semibold text-gray-700 mb-1">Selection Error Prevalence</h3>
              <p className="text-xs text-gray-400 mb-5">
                Ranked by number of students affected. Unlike misconceptions, these typically do not require additional teaching &mdash; but high counts on a single question suggest the question wording may need improvement.
              </p>
              <div className="space-y-0.5">
                {(() => {
                  const allSE: (Misconception & { itemId: string; subdomain: string })[] = [];
                  data.items.forEach(item => {
                    item.misconceptions?.forEach(m => {
                      if (m.diagnosisType === 'selection_error') {
                        allSE.push({ ...m, itemId: item.id, subdomain: item.subdomain });
                      }
                    });
                  });
                  allSE.sort((a, b) => b.n - a.n);
                  if (allSE.length === 0) {
                    return <p className="text-sm text-gray-400 italic py-4">No selection errors identified in the diagnostic data.</p>;
                  }
                  return allSE.map((m, i) => {
                    const key = `se-${m.itemId}-${m.tag}`;
                    const isExpanded = expandedMisc === key;
                    return (
                      <div key={i}>
                        <button
                          onClick={() => setExpandedMisc(isExpanded ? null : key)}
                          className="w-full flex items-center gap-4 py-3 px-4 border-b border-gray-50 hover:bg-gray-50 rounded-lg transition text-left"
                        >
                          <span className="text-sm font-bold text-loyola-maroon w-10">{m.itemId}</span>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-semibold text-gray-800 truncate">{m.label}</div>
                            <div className="text-xs text-gray-400">{m.subdomain}</div>
                          </div>
                          <div className="w-48">
                            <ProgressBar pct={m.pct} color="bg-purple-500" />
                          </div>
                          <span className="text-xs font-semibold text-gray-600 w-14 text-right">n = {m.n}</span>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-purple-50 text-purple-600 border border-purple-200">
                            Selection Error
                          </span>
                          {m.evidence && m.evidence.length > 0 && (
                            isExpanded
                              ? <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" />
                              : <ChevronRight className="w-4 h-4 text-gray-400 shrink-0" />
                          )}
                        </button>
                        {isExpanded && m.evidence && m.evidence.length > 0 && (
                          <div className="ml-14 mr-4 mb-3 mt-1 space-y-2 border-l-2 border-purple-200 pl-4">
                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Student Responses ({m.evidence.length})</p>
                            {m.evidence.map((e, j) => (
                              <div key={j} className="bg-gray-50 rounded-lg p-3 text-xs">
                                <p className="text-gray-700 italic">&ldquo;{e.studentAnswer}&rdquo;</p>
                                {e.reasoning && (
                                  <p className="text-gray-400 mt-1.5"><span className="font-medium text-gray-500">AI Analysis:</span> {e.reasoning}</p>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  });
                })()}
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
