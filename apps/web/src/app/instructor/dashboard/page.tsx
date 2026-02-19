'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  LogOut,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  Settings,
  AlertTriangle,
  CheckCircle,
  Eye,
  TrendingUp,
  Users,
  Zap,
  RefreshCw,
  X,
  Info,
  Download,
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
  stem: string;
  options: Array<{ id: string; text: string }>;
  key: string;
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

interface DashboardCourse {
  id: string;
  name: string;
  accessLevel: string;
}

// ── Static recommendation map (curated per-item teaching suggestions) ──
const ITEM_RECOMMENDATIONS: Record<string, string> = {
  Q1: 'Walk through a compound interest calculation step by step. Show the difference between simple and compound interest using a $1,000 deposit over 5, 10, and 20 years.',
  Q2: 'Compare two mortgage scenarios side-by-side: 15-year vs 30-year on the same home. Show total interest paid for each. Students often focus on monthly payment without considering total cost.',
  Q3: 'Show a price index graph over 20 years. Point out that "2% inflation" doesn\'t mean prices stay the same -it means they rise 2% per year, compounding over time.',
  Q4: 'Use a simple loan amortization table to show how each payment splits between principal and interest. Highlight how the ratio changes over the life of a loan.',
  Q5: 'Have students calculate their own monthly expenses, then multiply by 3-6 months. Emphasize that emergency funds should be based on expenses, not income or an arbitrary dollar amount.',
  Q6: 'Use a concrete example: if prices rose 8% last year and 3% this year, prices are still higher -just rising more slowly. A visual timeline of price levels vs. inflation rate clarifies the distinction.',
  Q7: 'Define "fixed income" explicitly before discussing inflation impact on different groups. Retirees on fixed pensions lose purchasing power when prices rise, while workers can negotiate raises.',
  Q8: 'Walk through a real auto loan negotiation scenario. Show that price, interest rate, trade-in value, and loan term are all negotiable -not just one element.',
  Q9: 'Teach the 50/30/20 budgeting framework. Clarify that insurance is a risk management tool within a budget, not a savings or investment vehicle.',
  Q10: 'Brief lesson on credit report access rights. Explain who can check your credit report (employers, landlords, lenders) and the difference between a credit report and credit score.',
  Q11: 'Use a visual comparison: show returns of a single stock vs. a diversified portfolio over 10 years. The single stock has higher highs but also devastating lows.',
  Q12: 'Teach the catastrophic protection model. Use this comparison: a $200 checkup vs. a $200,000 surgery. Which one would bankrupt you without insurance?',
  Q13: 'Create a simple insurance claim walkthrough showing premium, deductible, copay, and out-of-pocket maximum. Use a real medical bill example.',
  Q14: 'Explain diversification with a simple analogy: "Don\'t put all your eggs in one basket." More variety in a portfolio reduces overall risk, not increases it.',
  Q29: 'Draw the inverse relationship on the board: when interest rates go up, existing bond prices go down (and vice versa). Use a seesaw analogy.',
  Q30: 'Teach the difference between general principles and universal rules. Use: "Taller people are generally heavier. Always true? No. Generally true? Yes." Risk-return works the same way.',
  Q31: 'Explain that the stock market\'s primary function is price discovery and liquidity -allowing buyers and sellers to trade ownership. Wealth creation is a consequence, not the purpose.',
  Q32: 'Show a historical returns chart (1926-present) comparing stocks, bonds, and savings. Over 20+ year periods, stocks have consistently outperformed despite short-term volatility.',
  Q33: 'Practice converting between percentages and counts: "If 10% of 200 students skip breakfast, how many is that?" Build intuition before applying to financial contexts.',
  Q34: 'Use a portfolio simulation: show that adding different asset types (stocks, bonds, real estate) reduces overall portfolio risk even though each individual asset carries risk.',
  Q35: 'Discuss why higher-risk investments must offer higher expected returns to attract investors. If they didn\'t, no one would take the extra risk.',
  Q36: 'This question had a high selection error rate due to True/False negative phrasing. Consider rewording for future tests. For genuine misconceptions, review why diversification reduces risk.',
  Q37: 'Review the major types of insurance (health, auto liability, homeowner\'s, life) and what each covers. Create a matching exercise linking scenarios to insurance types.',
  Q38: 'Explain that real assets (real estate, stocks) tend to rise with inflation, while fixed-rate instruments (bonds, CDs) lose purchasing power. TIPS and I-bonds are designed for inflation protection.',
  Q39: 'Compare stock and bond risk profiles: stocks represent ownership (higher risk/return), bonds represent lending (lower risk/return). Use a risk spectrum visual.',
  Q40: 'Walk through the 2008 crisis timeline: excessive/risky lending → housing bubble → bank failures → recession. Emphasize that too much borrowing (not too little) was the root cause.',
};

// ── Helpers ────────────────────────────────────────────────
type SeverityLevel = 'critical' | 'concern' | 'monitor' | 'ok';

const getSeverity = (pct: number): SeverityLevel =>
  pct >= 50 ? 'critical' : pct >= 25 ? 'concern' : pct >= 10 ? 'monitor' : 'ok';

const severityConfig: Record<SeverityLevel, { label: string; bg: string; text: string; border: string }> = {
  critical: { label: 'Priority', bg: 'bg-red-50', text: 'text-loyola-maroon', border: 'border-red-200' },
  concern:  { label: 'Needs Attention', bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200' },
  monitor:  { label: 'Monitor', bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
  ok:       { label: 'Strong', bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200' },
};

const barColors = ['#8B0015', '#8B0015', '#8B0015', '#EA580C', '#EA580C', '#6366F1', '#6366F1', '#10b981', '#10b981', '#10b981'];

// ── Components ────────────────────────────────────────────
function QuestionPreview({ item }: { item: DashboardItem }) {
  return (
    <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 mb-3">
      <p className="text-sm text-gray-800 font-medium mb-2">{item.stem}</p>
      <div className="grid grid-cols-2 gap-1.5">
        {item.options.map(opt => (
          <div
            key={opt.id}
            className={`text-xs px-2.5 py-1.5 rounded ${
              opt.id === item.key
                ? 'bg-green-100 text-green-800 border border-green-300 font-semibold'
                : 'bg-white text-gray-600 border border-gray-200'
            }`}
          >
            <span className="font-bold mr-1">{opt.id}.</span>{opt.text}
            {opt.id === item.key && <span className="ml-1 text-green-600">&check;</span>}
          </div>
        ))}
      </div>
    </div>
  );
}

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
  const [showAllEvidence, setShowAllEvidence] = useState<Set<string>>(new Set());
  const [guideDismissed, setGuideDismissed] = useState(() => typeof window !== 'undefined' && localStorage.getItem('dashboard-guide-dismissed') === '1');
  const [expandedKpi, setExpandedKpi] = useState<string | null>(null);
  const [showItemGuide, setShowItemGuide] = useState(false);
  const [showMiscGuide, setShowMiscGuide] = useState(false);
  const [showGapGuide, setShowGapGuide] = useState(false);
  const [showErrorGuide, setShowErrorGuide] = useState(false);
  const [selectedSeverity, setSelectedSeverity] = useState<SeverityLevel | null>(null);
  const router = useRouter();

  const [data, setData] = useState<DashboardData | null>(null);
  const [courses, setCourses] = useState<DashboardCourse[]>([]);
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
      setCourses(json.courses || []);
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

  const handleDownloadReport = async () => {
    const token = localStorage.getItem('instructor-token');
    if (!token) return;
    try {
      const res = await fetch('/api/instructor/report', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Download failed');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'QUIN102_Pretest_Results_Report.docx';
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch {
      alert('Report download failed. Please try again.');
    }
  };

  const filteredItems = useMemo(() => {
    if (!data) return [];
    let items = data.items;
    if (selectedDomain !== 'All') items = items.filter(i => i.domain === selectedDomain);
    if (selectedSeverity) items = items.filter(i => getSeverity(i.pctIncorrect) === selectedSeverity);
    return [...items].sort((a, b) => b[sortBy] - a[sortBy]);
  }, [data, selectedDomain, selectedSeverity, sortBy]);

  const topConcerns = useMemo(() => {
    if (!data) return [];
    return data.items.filter(i => i.pctIncorrect >= 25).sort((a, b) => b.confidentErrors - a.confidentErrors).slice(0, 6);
  }, [data]);

  const scoreDistData = useMemo(() => {
    if (!data) return [];
    return data.overall.scoreDist.map((count, i) => ({
      range: i === 9 ? '90-100%' : `${i * 10}-${i * 10 + 9}%`,
      count,
    }));
  }, [data]);

  const itemMap = useMemo(() => {
    if (!data) return {} as Record<string, DashboardItem>;
    return Object.fromEntries(data.items.map(i => [i.id, i]));
  }, [data]);

  const isAdmin = useMemo(() => courses.some(c => c.accessLevel === 'admin'), [courses]);
  const courseName = courses.length > 0 ? courses[0].name : 'Course';

  const totalConfidentErrors = useMemo(() => data ? data.items.reduce((s, i) => s + i.confidentErrors, 0) : 0, [data]);
  const totalIncorrect = useMemo(() => data ? data.items.reduce((s, i) => s + i.incorrect, 0) : 0, [data]);
  const overconfidenceRate = totalIncorrect > 0 ? (totalConfidentErrors / totalIncorrect * 100).toFixed(1) : '0';
  const itemsWithMisconceptions = useMemo(() => {
    if (!data) return 0;
    return data.items.filter(i => i.misconceptions.some(m => m.diagnosisType === 'misconception')).length;
  }, [data]);

  // Generate dynamic instructional recommendations from data
  const dynamicRecommendations = useMemo(() => {
    if (!data) return [];
    // For each item, compute total misconception students and summarize
    const itemSummaries = data.items
      .map(item => {
        const miscs = item.misconceptions.filter(m => m.diagnosisType === 'misconception');
        const ses = item.misconceptions.filter(m => m.diagnosisType === 'selection_error');
        const totalMiscN = miscs.reduce((s, m) => s + m.n, 0);
        const totalSEN = ses.reduce((s, m) => s + m.n, 0);
        return { item, miscs, ses, totalMiscN, totalSEN };
      })
      .filter(s => s.totalMiscN > 0 || (s.totalSEN > 5 && s.totalMiscN === 0))
      .sort((a, b) => b.totalMiscN - a.totalMiscN);

    // Assign priorities: top items by misconception prevalence
    type RecItem = { q: string; topic: string; issue: string; action: string };
    const critical: RecItem[] = [];
    const high: RecItem[] = [];
    const monitor: RecItem[] = [];

    for (const s of itemSummaries) {
      const { item, miscs, ses, totalMiscN, totalSEN } = s;
      if (totalMiscN === 0 && totalSEN === 0) continue;

      // Build finding text
      const topMisc = miscs[0];
      let finding = '';
      if (topMisc) {
        finding = `${topMisc.pct}% of diagnosed students (n=${topMisc.n}) ${topMisc.label.toLowerCase()}.`;
        if (miscs.length > 1) {
          const second = miscs[1];
          finding += ` An additional ${second.pct}% (n=${second.n}) ${second.label.toLowerCase()}.`;
        }
        if (totalSEN > 0) {
          finding += ` ${totalSEN} student${totalSEN > 1 ? 's' : ''} made selection errors (not a knowledge issue).`;
        }
      } else if (totalSEN > 0) {
        finding = `${totalSEN} students made selection errors on this question. Most understood the concept but chose incorrectly due to question wording or careless mistakes.`;
      }

      const action = ITEM_RECOMMENDATIONS[item.id] || 'Review this topic with targeted examples that address the specific reasoning errors identified above.';
      const rec: RecItem = { q: item.id, topic: item.subdomain, issue: finding, action };

      if (totalMiscN >= 15) critical.push(rec);
      else if (totalMiscN >= 5) high.push(rec);
      else if (totalMiscN >= 2) monitor.push(rec);
    }

    const sections: { priority: string; dot: string; title: string; card: string; items: RecItem[] }[] = [];
    if (critical.length > 0) sections.push({ priority: 'Critical', dot: 'bg-loyola-maroon', title: 'text-loyola-maroon', card: 'bg-red-50 border-red-200', items: critical });
    if (high.length > 0) sections.push({ priority: 'High', dot: 'bg-orange-500', title: 'text-orange-600', card: 'bg-orange-50 border-orange-200', items: high });
    if (monitor.length > 0) sections.push({ priority: 'Monitor', dot: 'bg-blue-500', title: 'text-blue-600', card: 'bg-blue-50 border-blue-200', items: monitor });
    return sections;
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
              <div className="text-xs font-semibold text-loyola-maroon uppercase tracking-wider">{courseName} / SDM-10 Diagnostic</div>
              <h1 className="text-2xl font-bold text-gray-900">Instructor Dashboard</h1>
              <p className="text-sm text-gray-500">Pre-Assessment Results &middot; {data.overall.students} students</p>
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
              <button
                onClick={handleDownloadReport}
                className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-white bg-loyola-maroon rounded-lg hover:bg-red-900 transition"
                title="Download Pre-Test Report"
              >
                <Download className="w-4 h-4" />
                <span className="hidden sm:inline">Report</span>
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
            {/* Guide Banner - dismissible */}
            {!guideDismissed && (
              <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-3 mb-4 flex items-start gap-3">
                <Info className="w-4 h-4 text-indigo-600 mt-0.5 shrink-0" />
                <p className="text-xs text-indigo-700 leading-relaxed flex-1">
                  Use <strong>Overview</strong> for class-level performance, <strong>Item Analysis</strong> for per-question diagnostics,
                  <strong> Misconceptions</strong> / <strong>Knowledge Gaps</strong> / <strong>Selection Errors</strong> for targeted teaching actions.
                </p>
                <button
                  onClick={() => { setGuideDismissed(true); localStorage.setItem('dashboard-guide-dismissed', '1'); }}
                  className="text-indigo-400 hover:text-indigo-600 transition shrink-0"
                  title="Dismiss"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* KPI Row */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
              {[
                { key: 'mean', icon: <TrendingUp className="w-3.5 h-3.5" />, label: 'Mean Score', value: <span className="text-loyola-maroon">{data.overall.meanScore}%</span>, sub: `Median: ${data.overall.medianScore}%`, tip: 'Average percentage of the 26 scored knowledge questions answered correctly. This is a baseline before your course instruction.' },
                { key: 'students', icon: <Users className="w-3.5 h-3.5" />, label: 'Students', value: <span className="text-gray-900">{data.overall.students}</span>, sub: 'Completed Test 1', tip: 'Total students who completed the full pre-assessment (26 knowledge items + optional SDM-10 follow-up).' },
                { key: 'overconf', icon: <AlertTriangle className="w-3.5 h-3.5" />, label: 'Overconfidence', value: <span className={Number(overconfidenceRate) > 20 ? 'text-orange-600' : Number(overconfidenceRate) > 10 ? 'text-orange-500' : 'text-green-600'}>{overconfidenceRate}%</span>, sub: `${totalConfidentErrors} of ${totalIncorrect} wrong answers`, tip: 'Percentage of wrong answers where the student reported high confidence. Above 15% signals significant overconfidence.' },
                { key: 'miscon', icon: <Zap className="w-3.5 h-3.5" />, label: 'Misconceptions', value: <span className="text-orange-600">{data.misconceptionSummary.detected}</span>, sub: `across ${itemsWithMisconceptions} questions`, tip: 'Distinct wrong beliefs identified through SDM-10 diagnostic follow-ups. See the Misconceptions tab for details.' },
              ].map(kpi => (
                <div key={kpi.key} className="bg-white rounded-lg p-3 border border-gray-200">
                  <div className="flex items-center gap-1.5 text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                    {kpi.icon} {kpi.label}
                    <button onClick={() => setExpandedKpi(expandedKpi === kpi.key ? null : kpi.key)} className="ml-auto text-gray-300 hover:text-gray-500 transition">
                      <Info className="w-3 h-3" />
                    </button>
                  </div>
                  <div className="text-2xl font-bold">{kpi.value}</div>
                  <div className="text-xs text-gray-500 mt-0.5">{kpi.sub}</div>
                  {expandedKpi === kpi.key && (
                    <p className="text-xs text-gray-500 mt-2 leading-snug border-t border-gray-100 pt-2">{kpi.tip}</p>
                  )}
                </div>
              ))}
            </div>

            {/* Score Distribution + Domain Performance */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
              <div className="bg-white rounded-lg p-4 border border-gray-200 flex flex-col">
                <h3 className="text-sm font-semibold text-gray-700 mb-1">Score Distribution</h3>
                <p className="text-xs text-gray-500 mb-3">Maroon = below average. Orange = developing. Indigo = typical range. Green = strong.</p>
                <div className="flex-1 min-h-0">
                  <ResponsiveContainer width="100%" height={260}>
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
              </div>
              <div className="bg-white rounded-lg p-4 border border-gray-200 flex flex-col">
                <h3 className="text-sm font-semibold text-gray-700 mb-1">Domain Performance</h3>
                <p className="text-xs text-gray-500 mb-3">
                  <span className="text-orange-600">Orange</span> (&lt;65%) = focus area.{' '}
                  <span className="text-blue-600">Blue</span> (65-74%) = developing.{' '}
                  <span className="text-green-600">Green</span> (75%+) = strong.
                </p>
                <div className="flex-1 space-y-5 flex flex-col justify-center">
                  {data.domains.map((d, i) => (
                    <div key={i}>
                      <div className="flex justify-between text-sm mb-1.5">
                        <span className="font-medium text-gray-700">{d.name}</span>
                        <span className={`font-bold ${d.pctCorrect < 65 ? 'text-orange-600' : d.pctCorrect < 75 ? 'text-blue-600' : 'text-green-600'}`}>
                          {d.pctCorrect}%
                        </span>
                      </div>
                      <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-700 ${
                            d.pctCorrect < 65 ? 'bg-orange-500' : d.pctCorrect < 75 ? 'bg-blue-500' : 'bg-green-500'
                          }`}
                          style={{ width: `${d.pctCorrect}%` }}
                        />
                      </div>
                      <div className="text-xs text-gray-500 mt-1">{d.totalConfErrors} confident errors across {d.itemCount} items</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Priority Items */}
            <div className="bg-white rounded-xl p-5 border border-gray-200">
              <h3 className="text-sm font-semibold text-gray-700 mb-1">Priority Items for Instruction</h3>
              <p className="text-xs text-gray-500 mb-3">Top items with 25%+ incorrect, sorted by confident errors. Click to jump to details.</p>
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
                        <span><strong className="text-gray-700">{item.pctIncorrect}%</strong> incorrect</span>
                        <span><strong className="text-gray-800">{item.confidentErrors}</strong> confident errors</span>
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
            {/* Compact Guide */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 mb-3 flex items-center gap-2">
              <Info className="w-4 h-4 text-gray-400 shrink-0" />
              <span className="text-xs text-gray-600 flex-1">Each row is one question. Click to expand diagnostics.</span>
              <button onClick={() => setShowItemGuide(!showItemGuide)} className="text-xs text-indigo-600 hover:text-indigo-800 font-medium whitespace-nowrap flex items-center gap-1">
                {showItemGuide ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                {showItemGuide ? 'Hide guide' : 'Show guide'}
              </button>
            </div>
            {showItemGuide && (
              <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-3 mb-3 grid grid-cols-2 lg:grid-cols-4 gap-3 text-xs text-indigo-700">
                <div><strong>Status badges:</strong> <span className="text-loyola-maroon">Priority</span> (50%+), <span className="text-orange-600">Needs Attention</span> (25-49%), <span className="text-blue-600">Monitor</span> (10-24%), <span className="text-green-600">Strong</span> (&lt;10%).</div>
                <div><strong>Conf. Errors:</strong> Wrong + high confidence. These reflect misconceptions that simple review won&apos;t fix.</div>
                <div><strong>Diagnose:</strong> Follow-up questions to identify <em>why</em> they answered incorrectly.</div>
                <div><strong>Confirm:</strong> Follow-up for correct-but-uncertain students to verify understanding.</div>
              </div>
            )}

            {/* Filters */}
            <div className="flex flex-wrap gap-2 mb-3 items-center">
              <span className="text-xs font-semibold text-gray-500 uppercase">Domain:</span>
              {['All', 'Borrowing & Credit', 'Risk Management', 'Investment & Risk'].map(d => (
                <button
                  key={d}
                  onClick={() => setSelectedDomain(d)}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold border transition ${
                    selectedDomain === d
                      ? 'bg-loyola-maroon text-white border-loyola-maroon shadow-sm'
                      : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400 hover:text-gray-800'
                  }`}
                >
                  {d}
                </button>
              ))}
              {selectedDomain !== 'All' && (
                <button
                  onClick={() => setSelectedDomain('All')}
                  className="text-xs text-loyola-maroon hover:text-red-800 font-medium ml-1"
                >
                  Reset
                </button>
              )}
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

            {/* Severity Filter Badges */}
            <div className="flex flex-wrap gap-2 mb-3">
              {([
                { sev: 'critical' as SeverityLevel, label: 'Priority', bg: 'bg-red-50 border-red-200 text-loyola-maroon', ring: 'ring-2 ring-red-400' },
                { sev: 'concern' as SeverityLevel, label: 'Needs Attention', bg: 'bg-orange-50 border-orange-200 text-orange-700', ring: 'ring-2 ring-orange-400' },
                { sev: 'monitor' as SeverityLevel, label: 'Monitor', bg: 'bg-blue-50 border-blue-200 text-blue-700', ring: 'ring-2 ring-blue-400' },
                { sev: 'ok' as SeverityLevel, label: 'Strong', bg: 'bg-green-50 border-green-200 text-green-700', ring: 'ring-2 ring-green-400' },
              ]).map(s => {
                const count = data.items.filter(i =>
                  (selectedDomain === 'All' || i.domain === selectedDomain) && getSeverity(i.pctIncorrect) === s.sev
                ).length;
                const isActive = selectedSeverity === s.sev;
                return (
                  <button
                    key={s.label}
                    onClick={() => setSelectedSeverity(isActive ? null : s.sev)}
                    className={`px-3 py-1.5 rounded-lg border text-xs font-semibold cursor-pointer transition ${s.bg} ${isActive ? s.ring : 'hover:shadow-sm'}`}
                  >
                    {count} {s.label}
                  </button>
                );
              })}
              {selectedSeverity && (
                <button
                  onClick={() => setSelectedSeverity(null)}
                  className="text-xs text-loyola-maroon hover:text-red-800 font-medium self-center ml-1"
                >
                  Clear
                </button>
              )}
              <span className="text-xs text-gray-500 self-center ml-auto">{filteredItems.length} items</span>
            </div>

            {/* Item Table */}
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto max-h-[65vh] overflow-y-auto">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 z-10">
                    <tr className="bg-gray-50 border-b border-gray-200">
                      <th className="px-3 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Item</th>
                      <th className="px-3 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Subdomain</th>
                      <th className="px-3 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                      <th className="px-3 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">% Incorrect</th>
                      <th className="px-3 py-2.5 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide">Conf. Errors</th>
                      <th className="px-3 py-2.5 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide">Diagnose</th>
                      <th className="px-3 py-2.5 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide">Confirm</th>
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
                            className={`cursor-pointer border-b border-gray-100 transition group ${
                              isSelected ? 'bg-indigo-50' : i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'
                            } hover:bg-gray-100`}
                          >
                            <td className="px-3 py-2 font-bold text-gray-900 flex items-center gap-1.5">
                              {isSelected
                                ? <ChevronDown className="w-4 h-4 text-loyola-maroon transition-transform" />
                                : <ChevronRight className="w-4 h-4 text-loyola-maroon group-hover:translate-x-0.5 transition-transform" />
                              }
                              {item.id}
                            </td>
                            <td className="px-3 py-2 text-gray-600">{item.subdomain}</td>
                            <td className="px-3 py-2"><SeverityBadge level={sev} /></td>
                            <td className="px-3 py-2">
                              <ProgressBar
                                pct={item.pctIncorrect}
                                color={sev === 'critical' ? 'bg-loyola-maroon' : sev === 'concern' ? 'bg-orange-500' : sev === 'monitor' ? 'bg-blue-500' : 'bg-green-500'}
                              />
                            </td>
                            <td className={`px-3 py-2 text-right font-bold tabular-nums ${item.confidentErrors >= 30 ? 'text-orange-600' : 'text-gray-700'}`}>{item.confidentErrors}</td>
                            <td className="px-3 py-2 text-right text-gray-500 tabular-nums">{item.diagnoseN}</td>
                            <td className="px-3 py-2 text-right text-gray-500 tabular-nums">{item.confirmN}</td>
                          </tr>
                          {isSelected && (
                            <tr key={`${item.id}-detail`}>
                              <td colSpan={7} className="px-0 py-0 bg-indigo-50/50 border-b-2 border-indigo-200">
                                <div className="p-5">
                                  <QuestionPreview item={item} />
                                  <div className="grid md:grid-cols-3 gap-5 mb-4">
                                    {/* Error Confidence */}
                                    <div>
                                      <h4 className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">Error Confidence Distribution</h4>
                                      <p className="text-xs text-gray-500 mb-2">High-confidence errors indicate misconceptions; low-confidence may self-correct.</p>
                                      <div className="flex gap-4">
                                        {[
                                          { label: 'Low', val: item.confDist.low, color: 'text-green-600' },
                                          { label: 'Medium', val: item.confDist.med, color: 'text-blue-500' },
                                          { label: 'High', val: item.confDist.high, color: 'text-orange-600' },
                                        ].map(c => (
                                          <div key={c.label} className="text-center flex-1">
                                            <div className={`text-2xl font-bold ${c.color}`}>{c.val}</div>
                                            <div className="text-xs text-gray-500">{c.label} conf.</div>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                    {/* Distractors */}
                                    <div>
                                      <h4 className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">Distractor Distribution</h4>
                                      <p className="text-xs text-gray-500 mb-2">Most popular distractor often reveals a common reasoning pattern.</p>
                                      <div className="flex flex-wrap gap-2">
                                        {Object.entries(item.distractors).sort((a, b) => b[1] - a[1]).map(([opt, n]) => (
                                          <div key={opt} className="px-3 py-1.5 rounded-lg bg-white border border-gray-200 text-xs">
                                            <strong>{opt}</strong>: {n} <span className="text-gray-500">({item.incorrect > 0 ? (n / item.incorrect * 100).toFixed(0) : 0}%)</span>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                    {/* SDM Follow-up Coverage */}
                                    <div>
                                      <h4 className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">Diagnostic Follow-ups</h4>
                                      <p className="text-xs text-gray-500 mb-2">More follow-ups = more reliable diagnostic data.</p>
                                      <div className="text-xs text-gray-600 space-y-1.5">
                                        <div><strong className="text-loyola-maroon">{item.diagnoseN}</strong> students asked <em>why they chose wrong</em> (of {item.incorrect} who answered incorrectly)</div>
                                        <div><strong className="text-blue-600">{item.confirmN}</strong> students asked <em>to confirm understanding</em> (of {item.uncertainCorrect} who were correct but unsure)</div>
                                      </div>
                                    </div>
                                  </div>
                                  {/* Misconceptions */}
                                  <h4 className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">Misconception Breakdown</h4>
                                  <p className="text-xs text-gray-500 mb-2"><span className="text-loyola-maroon font-medium">Maroon</span> = misconception. <span className="text-purple-500 font-medium">Purple</span> = selection error. <span className="text-gray-600 font-medium">Gray</span> = knowledge gap.</p>
                                  {item.misconceptions.length === 0 ? (
                                    <p className="text-xs text-gray-500 italic">No diagnostic follow-up data for this item.</p>
                                  ) : (
                                    <div className="space-y-1">
                                      {item.misconceptions.map((m, mi) => (
                                        <div key={mi} className="flex items-center gap-3 py-1.5">
                                          <div className="w-40 shrink-0">
                                            <div className={`text-xs font-semibold ${m.diagnosisType === 'selection_error' ? 'text-purple-600' : m.diagnosisType === 'knowledge_gap' ? 'text-gray-500' : 'text-loyola-maroon'}`}>
                                              {m.label}
                                            </div>
                                            <div className="text-xs text-gray-500 font-mono">{m.tag}</div>
                                          </div>
                                          <ProgressBar
                                            pct={m.pct}
                                            color={m.diagnosisType === 'selection_error' ? 'bg-purple-500' : m.diagnosisType === 'knowledge_gap' ? 'bg-gray-400' : 'bg-loyola-maroon'}
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
            {/* Compact Guide */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 mb-3 flex items-center gap-2">
              <Info className="w-4 h-4 text-gray-400 shrink-0" />
              <span className="text-xs text-gray-600 flex-1">Wrong beliefs your students hold, ranked by prevalence. Click any row to see student responses.</span>
              <button onClick={() => setShowMiscGuide(!showMiscGuide)} className="text-xs text-indigo-600 hover:text-indigo-800 font-medium whitespace-nowrap flex items-center gap-1">
                {showMiscGuide ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                {showMiscGuide ? 'Hide' : 'More info'}
              </button>
            </div>
            {showMiscGuide && (
              <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-3 mb-3 text-xs text-indigo-700 leading-relaxed">
                Unlike a simple &quot;% incorrect&quot; metric, these reveal <em>why</em> students are getting questions wrong, so you can tailor instruction to directly address those beliefs.
                Only true misconceptions are shown below. Selection errors and knowledge gaps are filtered out - see the Item Analysis tab for the full breakdown per question.
              </div>
            )}

            {/* Class-wide misconceptions */}
            <div className="bg-white rounded-lg p-4 border border-gray-200 mb-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-1">Class-Wide Misconception Prevalence</h3>
              <p className="text-xs text-gray-500 mb-3">Ranked by students affected. Focus on items near the top for maximum impact.</p>
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
                          className="w-full flex items-center gap-3 py-2.5 px-3 border-b border-gray-100 hover:bg-gray-100 rounded-lg transition text-left"
                        >
                          <span className="text-sm font-bold text-loyola-maroon w-10">{m.itemId}</span>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-semibold text-gray-800 truncate">{m.label}</div>
                            <div className="text-xs text-gray-600">{m.subdomain}</div>
                          </div>
                          <div className="w-48">
                            <ProgressBar pct={m.pct} color="bg-loyola-maroon" />
                          </div>
                          <span className="text-xs font-semibold text-gray-600 w-14 text-right tabular-nums">n = {m.n}</span>
                          <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-orange-50 text-orange-700 border border-orange-200">
                            Misconception
                          </span>
                          {isExpanded
                            ? <ChevronDown className="w-5 h-5 text-gray-500 shrink-0" />
                            : <ChevronRight className="w-5 h-5 text-gray-500 shrink-0" />
                          }
                        </button>
                        {isExpanded && (() => {
                          const allShown = showAllEvidence.has(key);
                          const visible = m.evidence && m.evidence.length > 0
                            ? (allShown ? m.evidence : m.evidence.slice(0, 5))
                            : [];
                          const hasMore = m.evidence && m.evidence.length > 5;
                          return (
                            <div className="ml-14 mr-4 mb-3 mt-1 space-y-2 border-l-2 border-orange-200 pl-4">
                              {itemMap[m.itemId] && <QuestionPreview item={itemMap[m.itemId]} />}
                              {visible.length > 0 && (
                                <>
                                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Student Responses ({m.evidence.length})</p>
                                  {visible.map((e, j) => (
                                    <div key={j} className="bg-gray-50 rounded-lg p-3 text-xs">
                                      <p className="text-gray-700 italic">&ldquo;{e.studentAnswer}&rdquo;</p>
                                      {e.reasoning && (
                                        <p className="text-gray-500 mt-1.5"><span className="font-medium text-gray-600">AI Analysis:</span> {e.reasoning}</p>
                                      )}
                                    </div>
                                  ))}
                                  {hasMore && (
                                    <button
                                      onClick={(ev) => { ev.stopPropagation(); setShowAllEvidence(prev => { const next = new Set(prev); if (allShown) next.delete(key); else next.add(key); return next; }); }}
                                      className="flex items-center gap-1 text-xs text-loyola-maroon hover:text-red-900 font-medium py-1"
                                    >
                                      {allShown ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                                      {allShown ? 'Show fewer' : `Show all ${m.evidence.length} responses`}
                                    </button>
                                  )}
                                </>
                              )}
                            </div>
                          );
                        })()}
                      </div>
                    );
                  });
                })()}
              </div>
            </div>

            {/* Instructional Recommendations */}
            {dynamicRecommendations.length > 0 && (
              <div className="bg-white rounded-xl p-5 border border-gray-200">
                <h3 className="text-sm font-semibold text-gray-700 mb-1">Instructional Recommendations</h3>
                <p className="text-xs text-gray-500 mb-2">Teaching suggestions based on diagnostic data, prioritized by students affected.</p>
                <div className="text-xs text-gray-500 mb-4 flex flex-wrap gap-4">
                  <span><span className="inline-block w-2 h-2 rounded-full bg-loyola-maroon mr-1" />Critical = 15+ students affected, address first</span>
                  <span><span className="inline-block w-2 h-2 rounded-full bg-orange-500 mr-1" />High = 5-14 students affected, plan a lesson segment</span>
                  <span><span className="inline-block w-2 h-2 rounded-full bg-blue-500 mr-1" />Monitor = 2-4 students affected, brief mention may suffice</span>
                </div>

                {dynamicRecommendations.map(section => (
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
            )}
          </>
        )}
        {/* ── KNOWLEDGE GAPS TAB ── */}
        {view === 'knowledge-gaps' && (
          <>
            <div className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 mb-3 flex items-center gap-2">
              <Info className="w-4 h-4 text-gray-400 shrink-0" />
              <span className="text-xs text-gray-600 flex-1">Topics where students had no prior knowledge. Easier to address than misconceptions. Click rows to see responses.</span>
              <button onClick={() => setShowGapGuide(!showGapGuide)} className="text-xs text-indigo-600 hover:text-indigo-800 font-medium whitespace-nowrap flex items-center gap-1">
                {showGapGuide ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                {showGapGuide ? 'Hide' : 'More info'}
              </button>
            </div>
            {showGapGuide && (
              <div className="bg-gray-100 border border-gray-300 rounded-lg p-3 mb-3 text-xs text-gray-600 leading-relaxed">
                Knowledge gaps represent cases where students left it blank, said &quot;I don&apos;t know,&quot; or gave a vague response with no existing belief to correct.
                Unlike misconceptions, these are easier to address - students are starting from zero, not from a wrong foundation.
              </div>
            )}

            <div className="bg-white rounded-lg p-4 border border-gray-200 mb-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-1">Knowledge Gap Prevalence</h3>
              <p className="text-xs text-gray-500 mb-3">Ranked by students affected. These students need foundational instruction.</p>
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
                    return <p className="text-sm text-gray-500 italic py-4">No knowledge gaps identified in the diagnostic data.</p>;
                  }
                  return allGaps.map((m, i) => {
                    const key = `kg-${m.itemId}-${m.tag}`;
                    const isExpanded = expandedMisc === key;
                    return (
                      <div key={i}>
                        <button
                          onClick={() => setExpandedMisc(isExpanded ? null : key)}
                          className="w-full flex items-center gap-3 py-2.5 px-3 border-b border-gray-100 hover:bg-gray-100 rounded-lg transition text-left"
                        >
                          <span className="text-sm font-bold text-loyola-maroon w-10">{m.itemId}</span>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-semibold text-gray-800 truncate">{m.label}</div>
                            <div className="text-xs text-gray-600">{m.subdomain}</div>
                          </div>
                          <div className="w-48">
                            <ProgressBar pct={m.pct} color="bg-gray-400" />
                          </div>
                          <span className="text-xs font-semibold text-gray-600 w-14 text-right tabular-nums">n = {m.n}</span>
                          <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-600 border border-gray-300">
                            Knowledge Gap
                          </span>
                          {isExpanded
                            ? <ChevronDown className="w-5 h-5 text-gray-500 shrink-0" />
                            : <ChevronRight className="w-5 h-5 text-gray-500 shrink-0" />
                          }
                        </button>
                        {isExpanded && (() => {
                          const allShown = showAllEvidence.has(key);
                          const visible = m.evidence && m.evidence.length > 0
                            ? (allShown ? m.evidence : m.evidence.slice(0, 5))
                            : [];
                          const hasMore = m.evidence && m.evidence.length > 5;
                          return (
                            <div className="ml-14 mr-4 mb-3 mt-1 space-y-2 border-l-2 border-gray-300 pl-4">
                              {itemMap[m.itemId] && <QuestionPreview item={itemMap[m.itemId]} />}
                              {visible.length > 0 && (
                                <>
                                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Student Responses ({m.evidence.length})</p>
                                  {visible.map((e, j) => (
                                    <div key={j} className="bg-gray-50 rounded-lg p-3 text-xs">
                                      <p className="text-gray-700 italic">&ldquo;{e.studentAnswer}&rdquo;</p>
                                      {e.reasoning && (
                                        <p className="text-gray-500 mt-1.5"><span className="font-medium text-gray-600">AI Analysis:</span> {e.reasoning}</p>
                                      )}
                                    </div>
                                  ))}
                                  {hasMore && (
                                    <button
                                      onClick={(ev) => { ev.stopPropagation(); setShowAllEvidence(prev => { const next = new Set(prev); if (allShown) next.delete(key); else next.add(key); return next; }); }}
                                      className="flex items-center gap-1 text-xs text-gray-600 hover:text-gray-800 font-medium py-1"
                                    >
                                      {allShown ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                                      {allShown ? 'Show fewer' : `Show all ${m.evidence.length} responses`}
                                    </button>
                                  )}
                                </>
                              )}
                            </div>
                          );
                        })()}
                      </div>
                    );
                  });
                })()}
              </div>
            </div>

            {/* Knowledge Gap Guidance */}
            {(() => {
              const allGaps: { itemId: string; subdomain: string; totalN: number }[] = [];
              const seen = new Set<string>();
              data.items.forEach(item => {
                const gaps = item.misconceptions.filter(m => m.diagnosisType === 'knowledge_gap');
                const totalN = gaps.reduce((s, m) => s + m.n, 0);
                if (totalN > 0 && !seen.has(item.id)) {
                  seen.add(item.id);
                  allGaps.push({ itemId: item.id, subdomain: item.subdomain, totalN });
                }
              });
              allGaps.sort((a, b) => b.totalN - a.totalN);
              if (allGaps.length === 0) return null;
              const topGaps = allGaps.slice(0, 5);
              const totalStudents = allGaps.reduce((s, g) => s + g.totalN, 0);
              return (
                <div className="bg-white rounded-lg p-4 border border-gray-200">
                  <h3 className="text-sm font-semibold text-gray-700 mb-1">Teaching Guidance</h3>
                  <p className="text-xs text-gray-500 mb-3">Focus on introducing these concepts clearly rather than correcting existing beliefs.</p>
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <p className="text-sm text-gray-700 mb-2">
                      <strong>{totalStudents} total knowledge gap instances</strong> across {allGaps.length} questions.
                      The topics with the most gaps are:
                    </p>
                    <ul className="text-sm text-gray-600 space-y-1 ml-4 list-disc">
                      {topGaps.map(g => (
                        <li key={g.itemId}><strong>{g.itemId}</strong> {g.subdomain} · {g.totalN} student{g.totalN > 1 ? 's' : ''} had no prior knowledge</li>
                      ))}
                    </ul>
                    <p className="text-sm text-gray-700 mt-3">
                      <strong>Strategy:</strong> For these topics, start with foundational definitions and real-world examples before introducing complexity.
                      Students with knowledge gaps respond well to direct instruction since they have no prior beliefs to unlearn.
                    </p>
                  </div>
                </div>
              );
            })()}
          </>
        )}

        {/* ── SELECTION ERRORS TAB ── */}
        {view === 'selection-errors' && (
          <>
            <div className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 mb-3 flex items-center gap-2">
              <Info className="w-4 h-4 text-gray-400 shrink-0" />
              <span className="text-xs text-gray-600 flex-1">Students who understood the concept but chose wrong due to mechanical mistakes. Not knowledge deficits.</span>
              <button onClick={() => setShowErrorGuide(!showErrorGuide)} className="text-xs text-indigo-600 hover:text-indigo-800 font-medium whitespace-nowrap flex items-center gap-1">
                {showErrorGuide ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                {showErrorGuide ? 'Hide' : 'More info'}
              </button>
            </div>
            {showErrorGuide && (
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 mb-3 text-xs text-purple-700 leading-relaxed">
                Selection errors occur when students misread the question, reversed their choice, or self-corrected during the diagnostic follow-up.
                High selection error rates on a question may indicate confusing wording that should be revised for future tests.
              </div>
            )}

            <div className="bg-white rounded-lg p-4 border border-gray-200 mb-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-1">Selection Error Prevalence</h3>
              <p className="text-xs text-gray-500 mb-3">Ranked by students affected. High counts suggest question wording may need improvement.</p>
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
                    return <p className="text-sm text-gray-500 italic py-4">No selection errors identified in the diagnostic data.</p>;
                  }
                  return allSE.map((m, i) => {
                    const key = `se-${m.itemId}-${m.tag}`;
                    const isExpanded = expandedMisc === key;
                    return (
                      <div key={i}>
                        <button
                          onClick={() => setExpandedMisc(isExpanded ? null : key)}
                          className="w-full flex items-center gap-3 py-2.5 px-3 border-b border-gray-100 hover:bg-gray-100 rounded-lg transition text-left"
                        >
                          <span className="text-sm font-bold text-loyola-maroon w-10">{m.itemId}</span>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-semibold text-gray-800 truncate">{m.label}</div>
                            <div className="text-xs text-gray-600">{m.subdomain}</div>
                          </div>
                          <div className="w-48">
                            <ProgressBar pct={m.pct} color="bg-purple-500" />
                          </div>
                          <span className="text-xs font-semibold text-gray-600 w-14 text-right tabular-nums">n = {m.n}</span>
                          <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-purple-50 text-purple-600 border border-purple-200">
                            Selection Error
                          </span>
                          {isExpanded
                            ? <ChevronDown className="w-5 h-5 text-gray-500 shrink-0" />
                            : <ChevronRight className="w-5 h-5 text-gray-500 shrink-0" />
                          }
                        </button>
                        {isExpanded && (() => {
                          const allShown = showAllEvidence.has(key);
                          const visible = m.evidence && m.evidence.length > 0
                            ? (allShown ? m.evidence : m.evidence.slice(0, 5))
                            : [];
                          const hasMore = m.evidence && m.evidence.length > 5;
                          return (
                            <div className="ml-14 mr-4 mb-3 mt-1 space-y-2 border-l-2 border-purple-200 pl-4">
                              {itemMap[m.itemId] && <QuestionPreview item={itemMap[m.itemId]} />}
                              {visible.length > 0 && (
                                <>
                                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Student Responses ({m.evidence.length})</p>
                                  {visible.map((e, j) => (
                                    <div key={j} className="bg-gray-50 rounded-lg p-3 text-xs">
                                      <p className="text-gray-700 italic">&ldquo;{e.studentAnswer}&rdquo;</p>
                                      {e.reasoning && (
                                        <p className="text-gray-500 mt-1.5"><span className="font-medium text-gray-600">AI Analysis:</span> {e.reasoning}</p>
                                      )}
                                    </div>
                                  ))}
                                  {hasMore && (
                                    <button
                                      onClick={(ev) => { ev.stopPropagation(); setShowAllEvidence(prev => { const next = new Set(prev); if (allShown) next.delete(key); else next.add(key); return next; }); }}
                                      className="flex items-center gap-1 text-xs text-purple-600 hover:text-purple-800 font-medium py-1"
                                    >
                                      {allShown ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                                      {allShown ? 'Show fewer' : `Show all ${m.evidence.length} responses`}
                                    </button>
                                  )}
                                </>
                              )}
                            </div>
                          );
                        })()}
                      </div>
                    );
                  });
                })()}
              </div>
            </div>

            {/* Selection Error Guidance */}
            {(() => {
              const allSE: { itemId: string; subdomain: string; totalN: number }[] = [];
              const seen = new Set<string>();
              data.items.forEach(item => {
                const ses = item.misconceptions.filter(m => m.diagnosisType === 'selection_error');
                const totalN = ses.reduce((s, m) => s + m.n, 0);
                if (totalN > 0 && !seen.has(item.id)) {
                  seen.add(item.id);
                  allSE.push({ itemId: item.id, subdomain: item.subdomain, totalN });
                }
              });
              allSE.sort((a, b) => b.totalN - a.totalN);
              if (allSE.length === 0) return null;
              const topSE = allSE.slice(0, 5);
              const totalStudents = allSE.reduce((s, e) => s + e.totalN, 0);
              return (
                <div className="bg-white rounded-lg p-4 border border-gray-200">
                  <h3 className="text-sm font-semibold text-gray-700 mb-1">Question Design Insights</h3>
                  <p className="text-xs text-gray-500 mb-3">Selection errors are a question design signal, not a knowledge signal.</p>
                  <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                    <p className="text-sm text-gray-700 mb-2">
                      <strong>{totalStudents} total selection errors</strong> across {allSE.length} questions.
                      The questions with the most selection errors are:
                    </p>
                    <ul className="text-sm text-gray-600 space-y-1 ml-4 list-disc">
                      {topSE.map(s => (
                        <li key={s.itemId}><strong>{s.itemId}</strong> {s.subdomain} · {s.totalN} student{s.totalN > 1 ? 's' : ''} understood but chose wrong</li>
                      ))}
                    </ul>
                    <p className="text-sm text-gray-700 mt-3">
                      <strong>Action items:</strong> Review questions with high selection error rates for confusing wording, double negatives, or ambiguous answer choices.
                      These students do <em>not</em> need additional instruction - they already understand the material.
                    </p>
                  </div>
                </div>
              );
            })()}
          </>
        )}
      </main>
    </div>
  );
}
