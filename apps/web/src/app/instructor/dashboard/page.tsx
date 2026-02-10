'use client';

import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
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
  Target,
  Zap,
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

// ── Hardcoded Test 1 Data ──────────────────────────────────
const DATA = {
  overall: { students: 421, meanScore: 66.6, medianScore: 68.0, totalDiagnose: 556, totalConfirm: 336, scoreDist: [1,7,10,12,24,70,123,79,61,34] },
  domains: [
    { name: "Borrowing & Credit", pctCorrect: 69.3, totalConfErrors: 327, itemCount: 10 },
    { name: "Risk Management", pctCorrect: 73.5, totalConfErrors: 79, itemCount: 4 },
    { name: "Investment & Risk", pctCorrect: 64.0, totalConfErrors: 407, itemCount: 12 },
  ],
  items: [
    { id:"Q1", subdomain:"Compound Interest", domain:"Borrowing & Credit", total:421, correct:385, incorrect:36, pctCorrect:91.4, pctIncorrect:8.6, confidentErrors:7, pctConfErrors:1.7, uncertainCorrect:13, diagnoseN:5, confirmN:11, distractors:{B:20,C:13,D:3} as Record<string,number>, confDist:{low:12,med:17,high:7}, misconceptions:[] as {tag:string;label:string;pct:number;n:number}[] },
    { id:"Q2", subdomain:"Mortgages", domain:"Borrowing & Credit", total:421, correct:307, incorrect:114, pctCorrect:72.9, pctIncorrect:27.1, confidentErrors:26, pctConfErrors:6.2, uncertainCorrect:31, diagnoseN:26, confirmN:31, distractors:{B:61,C:53} as Record<string,number>, confDist:{low:27,med:61,high:26}, misconceptions:[] as {tag:string;label:string;pct:number;n:number}[] },
    { id:"Q3", subdomain:"Inflation (Definition)", domain:"Borrowing & Credit", total:421, correct:361, incorrect:60, pctCorrect:85.7, pctIncorrect:14.3, confidentErrors:16, pctConfErrors:3.8, uncertainCorrect:18, diagnoseN:16, confirmN:18, distractors:{B:34,C:26} as Record<string,number>, confDist:{low:15,med:29,high:16}, misconceptions:[] as {tag:string;label:string;pct:number;n:number}[] },
    { id:"Q4", subdomain:"Interest on Loans", domain:"Borrowing & Credit", total:421, correct:399, incorrect:22, pctCorrect:94.8, pctIncorrect:5.2, confidentErrors:3, pctConfErrors:0.7, uncertainCorrect:5, diagnoseN:3, confirmN:5, distractors:{A:15,C:7} as Record<string,number>, confDist:{low:5,med:14,high:3}, misconceptions:[] as {tag:string;label:string;pct:number;n:number}[] },
    { id:"Q5", subdomain:"Emergency Fund", domain:"Borrowing & Credit", total:421, correct:306, incorrect:115, pctCorrect:72.7, pctIncorrect:27.3, confidentErrors:36, pctConfErrors:8.6, uncertainCorrect:16, diagnoseN:30, confirmN:16, distractors:{A:10,B:74,D:31} as Record<string,number>, confDist:{low:25,med:54,high:36}, misconceptions:[] as {tag:string;label:string;pct:number;n:number}[] },
    { id:"Q6", subdomain:"Inflation (Lowering)", domain:"Borrowing & Credit", total:421, correct:138, incorrect:283, pctCorrect:32.8, pctIncorrect:67.2, confidentErrors:88, pctConfErrors:20.9, uncertainCorrect:16, diagnoseN:64, confirmN:4, distractors:{A:215,C:32,D:36} as Record<string,number>, confDist:{low:56,med:139,high:88}, misconceptions:[
      {tag:"lower_inflation_means_lower_prices",label:"Lower inflation = falling prices",pct:78,n:50},
      {tag:"employment_link",label:"Links to employment changes",pct:8,n:5},
      {tag:"KG-idk",label:"Knowledge gap (IDK/blank)",pct:6,n:4}
    ]},
    { id:"Q7", subdomain:"Inflation & Fixed Income", domain:"Borrowing & Credit", total:421, correct:255, incorrect:166, pctCorrect:60.6, pctIncorrect:39.4, confidentErrors:50, pctConfErrors:11.9, uncertainCorrect:24, diagnoseN:54, confirmN:16, distractors:{A:53,B:67,D:46} as Record<string,number>, confDist:{low:39,med:77,high:50}, misconceptions:[
      {tag:"young_couples_worst",label:"Young couples suffer most",pct:35,n:19},
      {tag:"older_workers_worst",label:"Older workers suffer most",pct:30,n:16},
      {tag:"fixed_income_misunderstood",label:'Does not understand "fixed income"',pct:19,n:10},
      {tag:"KG-idk",label:"Knowledge gap",pct:6,n:3}
    ]},
    { id:"Q8", subdomain:"Auto Loans", domain:"Borrowing & Credit", total:421, correct:264, incorrect:157, pctCorrect:62.7, pctIncorrect:37.3, confidentErrors:42, pctConfErrors:10.0, uncertainCorrect:16, diagnoseN:34, confirmN:15, distractors:{A:42,B:57,D:12,E:46} as Record<string,number>, confDist:{low:34,med:81,high:42}, misconceptions:[
      {tag:"down_payment_only",label:"Only down payment negotiable",pct:44,n:15},
      {tag:"interest_rate_fixed_by_fed",label:"Fed sets rates, not negotiable",pct:18,n:6},
      {tag:"SE-reversal",label:"Selection error",pct:15,n:5},
      {tag:"KG-idk",label:"Knowledge gap",pct:12,n:4}
    ]},
    { id:"Q9", subdomain:"Budgeting", domain:"Borrowing & Credit", total:421, correct:363, incorrect:58, pctCorrect:86.2, pctIncorrect:13.8, confidentErrors:13, pctConfErrors:3.1, uncertainCorrect:7, diagnoseN:7, confirmN:6, distractors:{B:12,C:32,D:14} as Record<string,number>, confDist:{low:10,med:35,high:13}, misconceptions:[] as {tag:string;label:string;pct:number;n:number}[] },
    { id:"Q10", subdomain:"Credit Reports", domain:"Borrowing & Credit", total:421, correct:222, incorrect:199, pctCorrect:52.7, pctIncorrect:47.3, confidentErrors:52, pctConfErrors:12.4, uncertainCorrect:22, diagnoseN:48, confirmN:17, distractors:{A:79,B:64,D:56} as Record<string,number>, confDist:{low:54,med:93,high:52}, misconceptions:[
      {tag:"employer_use_confusion",label:"Employers can't check credit",pct:33,n:16},
      {tag:"SE-reversal",label:"Selection error (understood C)",pct:29,n:14},
      {tag:"credit_score_confusion",label:"Credit report vs. score confusion",pct:19,n:9},
      {tag:"KG-idk",label:"Knowledge gap",pct:10,n:5}
    ]},
    { id:"Q11", subdomain:"Stock vs. Mutual Fund", domain:"Risk Management", total:421, correct:298, incorrect:123, pctCorrect:70.8, pctIncorrect:29.2, confidentErrors:25, pctConfErrors:5.9, uncertainCorrect:33, diagnoseN:14, confirmN:32, distractors:{A:52,C:71} as Record<string,number>, confDist:{low:32,med:66,high:25}, misconceptions:[] as {tag:string;label:string;pct:number;n:number}[] },
    { id:"Q12", subdomain:"Health Insurance", domain:"Risk Management", total:421, correct:276, incorrect:145, pctCorrect:65.6, pctIncorrect:34.4, confidentErrors:33, pctConfErrors:7.8, uncertainCorrect:14, diagnoseN:33, confirmN:14, distractors:{B:102,C:18,D:25} as Record<string,number>, confDist:{low:29,med:83,high:33}, misconceptions:[
      {tag:"routine_care_primary",label:"Insurance is for routine care",pct:64,n:21},
      {tag:"frequency_over_severity",label:"Used often = primary function",pct:18,n:6},
      {tag:"KG-idk",label:"Knowledge gap",pct:9,n:3}
    ]},
    { id:"Q13", subdomain:"Insurance Deductible", domain:"Risk Management", total:421, correct:290, incorrect:131, pctCorrect:68.9, pctIncorrect:31.1, confidentErrors:15, pctConfErrors:3.6, uncertainCorrect:30, diagnoseN:20, confirmN:29, distractors:{B:37,C:40,D:54} as Record<string,number>, confDist:{low:34,med:82,high:15}, misconceptions:[] as {tag:string;label:string;pct:number;n:number}[] },
    { id:"Q14", subdomain:"Diversification", domain:"Risk Management", total:421, correct:371, incorrect:50, pctCorrect:88.1, pctIncorrect:11.9, confidentErrors:6, pctConfErrors:1.4, uncertainCorrect:11, diagnoseN:5, confirmN:11, distractors:{A:21,C:17,D:12} as Record<string,number>, confDist:{low:12,med:32,high:6}, misconceptions:[] as {tag:string;label:string;pct:number;n:number}[] },
    { id:"Q29", subdomain:"Bonds & Interest Rates", domain:"Investment & Risk", total:421, correct:143, incorrect:278, pctCorrect:34.0, pctIncorrect:66.0, confidentErrors:29, pctConfErrors:6.9, uncertainCorrect:34, diagnoseN:29, confirmN:17, distractors:{A:68,C:42,D:60,E:108} as Record<string,number>, confDist:{low:67,med:107,high:29}, misconceptions:[
      {tag:"positive_correlation_belief",label:"Rates up = prices up",pct:38,n:11},
      {tag:"KG-idk",label:"Knowledge gap (unfamiliar)",pct:45,n:13},
      {tag:"SE-selfcorrect",label:"Selection error",pct:10,n:3}
    ]},
    { id:"Q30", subdomain:"Risk-Return Tradeoff", domain:"Investment & Risk", total:421, correct:312, incorrect:109, pctCorrect:74.1, pctIncorrect:25.9, confidentErrors:21, pctConfErrors:5.0, uncertainCorrect:19, diagnoseN:21, confirmN:13, distractors:{B:68,C:41} as Record<string,number>, confDist:{low:20,med:68,high:21}, misconceptions:[
      {tag:"exceptions_disprove_rule",label:"Exceptions invalidate the rule",pct:67,n:14},
      {tag:"time_horizon_negates_risk",label:"Long time = no risk",pct:14,n:3},
      {tag:"KG-idk",label:"Knowledge gap",pct:10,n:2}
    ]},
    { id:"Q31", subdomain:"Stock Market Function", domain:"Investment & Risk", total:421, correct:280, incorrect:141, pctCorrect:66.5, pctIncorrect:33.5, confidentErrors:27, pctConfErrors:6.4, uncertainCorrect:20, diagnoseN:14, confirmN:10, distractors:{A:85,B:22,D:34} as Record<string,number>, confDist:{low:30,med:84,high:27}, misconceptions:[] as {tag:string;label:string;pct:number;n:number}[] },
    { id:"Q32", subdomain:"Long-Term Returns", domain:"Investment & Risk", total:421, correct:262, incorrect:159, pctCorrect:62.2, pctIncorrect:37.8, confidentErrors:22, pctConfErrors:5.2, uncertainCorrect:19, diagnoseN:13, confirmN:11, distractors:{A:51,B:61,D:47} as Record<string,number>, confDist:{low:34,med:103,high:22}, misconceptions:[] as {tag:string;label:string;pct:number;n:number}[] },
    { id:"Q33", subdomain:"Probability", domain:"Investment & Risk", total:421, correct:299, incorrect:122, pctCorrect:71.0, pctIncorrect:29.0, confidentErrors:22, pctConfErrors:5.2, uncertainCorrect:9, diagnoseN:5, confirmN:5, distractors:{A:30,B:26,D:31,E:35} as Record<string,number>, confDist:{low:23,med:77,high:22}, misconceptions:[] as {tag:string;label:string;pct:number;n:number}[] },
    { id:"Q34", subdomain:"Diversification Effect", domain:"Investment & Risk", total:421, correct:370, incorrect:51, pctCorrect:87.9, pctIncorrect:12.1, confidentErrors:7, pctConfErrors:1.7, uncertainCorrect:12, diagnoseN:4, confirmN:8, distractors:{A:21,C:17,D:13} as Record<string,number>, confDist:{low:14,med:30,high:7}, misconceptions:[] as {tag:string;label:string;pct:number;n:number}[] },
    { id:"Q35", subdomain:"Risk-Return", domain:"Investment & Risk", total:421, correct:368, incorrect:53, pctCorrect:87.4, pctIncorrect:12.6, confidentErrors:9, pctConfErrors:2.1, uncertainCorrect:11, diagnoseN:9, confirmN:11, distractors:{B:33,C:20} as Record<string,number>, confDist:{low:14,med:30,high:9}, misconceptions:[] as {tag:string;label:string;pct:number;n:number}[] },
    { id:"Q36", subdomain:"Diversification (Savings)", domain:"Investment & Risk", total:421, correct:273, incorrect:148, pctCorrect:64.8, pctIncorrect:35.2, confidentErrors:74, pctConfErrors:17.6, uncertainCorrect:16, diagnoseN:50, confirmN:6, distractors:{B:130,C:18} as Record<string,number>, confDist:{low:15,med:59,high:74}, misconceptions:[
      {tag:"SE-reversal",label:"Selection error (understood, chose wrong)",pct:62,n:31},
      {tag:"all_places_can_fail",label:"All places can fail simultaneously",pct:20,n:10},
      {tag:"not_guaranteed",label:"Doesn't completely eliminate risk",pct:10,n:5},
      {tag:"KG-idk",label:"Knowledge gap",pct:4,n:2}
    ]},
    { id:"Q37", subdomain:"Insurance Types", domain:"Investment & Risk", total:421, correct:320, incorrect:101, pctCorrect:76.0, pctIncorrect:24.0, confidentErrors:18, pctConfErrors:4.3, uncertainCorrect:11, diagnoseN:18, confirmN:10, distractors:{A:64,B:17,D:20} as Record<string,number>, confDist:{low:23,med:60,high:18}, misconceptions:[] as {tag:string;label:string;pct:number;n:number}[] },
    { id:"Q38", subdomain:"Inflation Protection", domain:"Investment & Risk", total:421, correct:101, incorrect:320, pctCorrect:24.0, pctIncorrect:76.0, confidentErrors:51, pctConfErrors:12.1, uncertainCorrect:25, diagnoseN:19, confirmN:9, distractors:{A:80,B:73,C:38,E:129} as Record<string,number>, confDist:{low:63,med:122,high:51}, misconceptions:[] as {tag:string;label:string;pct:number;n:number}[] },
    { id:"Q39", subdomain:"Stocks vs. Bonds Risk", domain:"Investment & Risk", total:421, correct:340, incorrect:81, pctCorrect:80.8, pctIncorrect:19.2, confidentErrors:14, pctConfErrors:3.3, uncertainCorrect:19, diagnoseN:10, confirmN:10, distractors:{B:46,C:35} as Record<string,number>, confDist:{low:19,med:48,high:14}, misconceptions:[] as {tag:string;label:string;pct:number;n:number}[] },
    { id:"Q40", subdomain:"2008 Financial Crisis", domain:"Investment & Risk", total:421, correct:207, incorrect:214, pctCorrect:49.2, pctIncorrect:50.8, confidentErrors:36, pctConfErrors:8.6, uncertainCorrect:27, diagnoseN:17, confirmN:23, distractors:{A:79,C:35,D:100} as Record<string,number>, confDist:{low:47,med:131,high:36}, misconceptions:[] as {tag:string;label:string;pct:number;n:number}[] },
  ],
};

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
  const [view, setView] = useState<'overview' | 'items' | 'misconceptions'>('overview');
  const [selectedDomain, setSelectedDomain] = useState('All');
  const [selectedItem, setSelectedItem] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'confidentErrors' | 'pctIncorrect' | 'pctConfErrors'>('confidentErrors');
  const [instructorName, setInstructorName] = useState('');
  const router = useRouter();

  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('instructor-token');
    const name = localStorage.getItem('instructor-name');
    if (!token) {
      router.push('/instructor');
      return;
    }
    setInstructorName(name || 'Instructor');
    setIsAdmin(name === 'gbolivard');
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('instructor-token');
    localStorage.removeItem('instructor-name');
    router.push('/instructor');
  };

  const filteredItems = useMemo(() => {
    let items = DATA.items;
    if (selectedDomain !== 'All') items = items.filter(i => i.domain === selectedDomain);
    return [...items].sort((a, b) => b[sortBy] - a[sortBy]);
  }, [selectedDomain, sortBy]);

  const topConcerns = useMemo(() =>
    DATA.items.filter(i => i.pctIncorrect >= 25).sort((a, b) => b.confidentErrors - a.confidentErrors).slice(0, 6),
  []);

  const scoreDistData = DATA.overall.scoreDist.map((count, i) => ({
    range: `${i * 10}-${i * 10 + 9}%`,
    count,
  }));

  const totalConfidentErrors = DATA.items.reduce((s, i) => s + i.confidentErrors, 0);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div>
              <div className="text-xs font-semibold text-loyola-maroon uppercase tracking-wider">QUIN 102 / SDM-10 Diagnostic</div>
              <h1 className="text-2xl font-bold text-gray-900">Instructor Dashboard</h1>
              <p className="text-sm text-gray-500">Test 1 Results, Spring 2026 &middot; {DATA.overall.students} students</p>
            </div>
            <div className="flex items-center gap-3">
              {/* Tab navigation */}
              <div className="hidden sm:flex bg-gray-100 rounded-lg p-1">
                {(['overview', 'items', 'misconceptions'] as const).map(v => (
                  <button
                    key={v}
                    onClick={() => setView(v)}
                    className={`px-4 py-1.5 rounded-md text-sm font-medium transition ${
                      view === v
                        ? 'bg-white text-loyola-maroon shadow-sm'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    {v === 'overview' ? 'Overview' : v === 'items' ? 'Item Analysis' : 'Misconceptions'}
                  </button>
                ))}
              </div>
              {isAdmin && (
                <Link
                  href="/admin"
                  className="p-2 text-gray-400 hover:text-gray-600 transition"
                  title="Admin Dashboard"
                >
                  <Settings className="w-5 h-5" />
                </Link>
              )}
              <button onClick={handleLogout} className="flex items-center gap-2 px-3 py-1.5 text-gray-500 hover:text-gray-700 transition text-sm">
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          </div>
          {/* Mobile tab nav */}
          <div className="flex sm:hidden mt-3 bg-gray-100 rounded-lg p-1">
            {(['overview', 'items', 'misconceptions'] as const).map(v => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={`flex-1 px-2 py-1.5 rounded-md text-xs font-medium transition ${
                  view === v
                    ? 'bg-white text-loyola-maroon shadow-sm'
                    : 'text-gray-500'
                }`}
              >
                {v === 'overview' ? 'Overview' : v === 'items' ? 'Items' : 'Misconceptions'}
              </button>
            ))}
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-7xl">

        {/* ── OVERVIEW TAB ── */}
        {view === 'overview' && (
          <>
            {/* KPI Row */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <div className="bg-white rounded-xl p-5 border border-gray-200">
                <div className="flex items-center gap-2 text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                  <TrendingUp className="w-3.5 h-3.5" /> Mean Score
                </div>
                <div className="text-3xl font-bold text-loyola-maroon">{DATA.overall.meanScore}%</div>
                <div className="text-xs text-gray-400 mt-0.5">Median: {DATA.overall.medianScore}%</div>
              </div>
              <div className="bg-white rounded-xl p-5 border border-gray-200">
                <div className="flex items-center gap-2 text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                  <Users className="w-3.5 h-3.5" /> Students
                </div>
                <div className="text-3xl font-bold text-gray-900">{DATA.overall.students}</div>
                <div className="text-xs text-gray-400 mt-0.5">Completed Test 1</div>
              </div>
              <div className="bg-white rounded-xl p-5 border border-gray-200">
                <div className="flex items-center gap-2 text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                  <AlertTriangle className="w-3.5 h-3.5" /> Confident Errors
                </div>
                <div className="text-3xl font-bold text-red-600">{totalConfidentErrors}</div>
                <div className="text-xs text-gray-400 mt-0.5">Incorrect + high confidence</div>
              </div>
              <div className="bg-white rounded-xl p-5 border border-gray-200">
                <div className="flex items-center gap-2 text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                  <Target className="w-3.5 h-3.5" /> Diagnostic Responses
                </div>
                <div className="text-3xl font-bold text-green-600">{DATA.overall.totalDiagnose + DATA.overall.totalConfirm}</div>
                <div className="text-xs text-gray-400 mt-0.5">{DATA.overall.totalDiagnose} diagnose / {DATA.overall.totalConfirm} confirm</div>
              </div>
            </div>

            {/* Score Distribution + Domain Performance */}
            <div className="grid lg:grid-cols-3 gap-4 mb-6">
              <div className="lg:col-span-2 bg-white rounded-xl p-5 border border-gray-200">
                <h3 className="text-sm font-semibold text-gray-700 mb-4">Score Distribution</h3>
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
                <h3 className="text-sm font-semibold text-gray-700 mb-4">Domain Performance</h3>
                <div className="space-y-5">
                  {DATA.domains.map((d, i) => (
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
                                      <h4 className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-3">Error Confidence Distribution</h4>
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
                                      <h4 className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-3">Distractor Distribution</h4>
                                      <div className="flex flex-wrap gap-2">
                                        {Object.entries(item.distractors).sort((a, b) => b[1] - a[1]).map(([opt, n]) => (
                                          <div key={opt} className="px-3 py-1.5 rounded-lg bg-white border border-gray-200 text-xs">
                                            <strong>{opt}</strong>: {n} <span className="text-gray-400">({(n / item.incorrect * 100).toFixed(0)}%)</span>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                    {/* SDM Coverage */}
                                    <div>
                                      <h4 className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-3">SDM Coverage</h4>
                                      <div className="text-xs text-gray-600 space-y-1">
                                        <div>Diagnose: {item.diagnoseN} / {item.confidentErrors} eligible ({item.confidentErrors > 0 ? (item.diagnoseN / item.confidentErrors * 100).toFixed(0) : 0}%)</div>
                                        <div>Confirm: {item.confirmN} / {item.uncertainCorrect} eligible ({item.uncertainCorrect > 0 ? (item.confirmN / item.uncertainCorrect * 100).toFixed(0) : 0}%)</div>
                                      </div>
                                    </div>
                                  </div>
                                  {/* Misconceptions */}
                                  <h4 className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">Misconception Breakdown</h4>
                                  {item.misconceptions.length === 0 ? (
                                    <p className="text-xs text-gray-400 italic">No misconception data for this item yet.</p>
                                  ) : (
                                    <div className="space-y-1">
                                      {item.misconceptions.map((m, mi) => (
                                        <div key={mi} className="flex items-center gap-3 py-1.5">
                                          <div className="w-40 shrink-0">
                                            <div className={`text-xs font-semibold ${m.tag.startsWith('SE') ? 'text-purple-600' : m.tag.startsWith('KG') ? 'text-gray-500' : 'text-red-600'}`}>
                                              {m.label}
                                            </div>
                                            <div className="text-[10px] text-gray-400 font-mono">{m.tag}</div>
                                          </div>
                                          <ProgressBar
                                            pct={m.pct}
                                            color={m.tag.startsWith('SE') ? 'bg-purple-500' : m.tag.startsWith('KG') ? 'bg-gray-400' : 'bg-red-500'}
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
            {/* Class-wide misconceptions */}
            <div className="bg-white rounded-xl p-5 border border-gray-200 mb-6">
              <h3 className="text-sm font-semibold text-gray-700 mb-1">Class-Wide Misconception Prevalence</h3>
              <p className="text-xs text-gray-400 mb-5">
                Top misconceptions from SDM-10 diagnostic responses. <span className="text-red-500 font-medium">Red</span> = active misconception. <span className="text-purple-500 font-medium">Purple</span> = selection error. <span className="text-gray-500 font-medium">Gray</span> = knowledge gap.
              </p>
              <div className="space-y-0.5">
                {(() => {
                  const allMisc: { tag: string; label: string; pct: number; n: number; itemId: string; subdomain: string }[] = [];
                  DATA.items.forEach(item => {
                    item.misconceptions?.forEach(m => {
                      if (!m.tag.startsWith('KG')) {
                        allMisc.push({ ...m, itemId: item.id, subdomain: item.subdomain });
                      }
                    });
                  });
                  allMisc.sort((a, b) => b.n - a.n);
                  return allMisc.map((m, i) => (
                    <div key={i} className="flex items-center gap-4 py-3 px-4 border-b border-gray-50 hover:bg-gray-50 rounded-lg transition">
                      <span className="text-sm font-bold text-loyola-maroon w-10">{m.itemId}</span>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold text-gray-800 truncate">{m.label}</div>
                        <div className="text-xs text-gray-400">{m.subdomain}</div>
                      </div>
                      <div className="w-48">
                        <ProgressBar
                          pct={m.n / 421 * 100}
                          color={m.tag.startsWith('SE') ? 'bg-purple-500' : 'bg-red-500'}
                        />
                      </div>
                      <span className="text-xs font-semibold text-gray-600 w-14 text-right">n = {m.n}</span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                        m.tag.startsWith('SE')
                          ? 'bg-purple-50 text-purple-600 border border-purple-200'
                          : 'bg-red-50 text-red-600 border border-red-200'
                      }`}>
                        {m.tag.startsWith('SE') ? 'Selection Error' : 'Misconception'}
                      </span>
                    </div>
                  ));
                })()}
              </div>
            </div>

            {/* Instructional Recommendations */}
            <div className="bg-white rounded-xl p-5 border border-gray-200">
              <h3 className="text-sm font-semibold text-gray-700 mb-1">Instructional Recommendations</h3>
              <p className="text-xs text-gray-400 mb-5">Generated from diagnostic data. Focus teaching time on items with high misconception rates.</p>

              {[
                { priority: 'Critical', dot: 'bg-red-500', title: 'text-red-600', card: 'bg-red-50 border-red-200', items: [
                  { q: 'Q6', topic: 'Inflation (Lowering)', issue: '78% of diagnosed students believe lower inflation means falling prices. Students confuse the rate of price change with the price level itself.', action: 'Use a concrete example: if prices rose 8% last year and 3% this year, prices are still higher, just rising more slowly. A visual timeline of price levels vs. inflation rate would help.' },
                ]},
                { priority: 'High', dot: 'bg-amber-500', title: 'text-amber-600', card: 'bg-amber-50 border-amber-200', items: [
                  { q: 'Q36', topic: 'Diversification (Savings)', issue: '62% of diagnosed students actually understood the concept but chose the wrong answer. The True/False negative phrasing confused them.', action: 'This is a question design issue, not a knowledge gap. Consider rewording for Test 2. No additional teaching needed.' },
                  { q: 'Q10', topic: 'Credit Reports', issue: '33% did not know employers can check credit reports. 29% were selection errors due to "which is FALSE" framing.', action: 'Brief lesson on credit report access rights. Also consider adjusting the question framing.' },
                  { q: 'Q12', topic: 'Health Insurance', issue: '64% believe insurance is primarily for routine care. Students confuse frequency of use with primary purpose.', action: 'Teach the catastrophic protection model. Use example: $200 checkup vs. $200,000 surgery. Which one would bankrupt you without insurance?' },
                ]},
                { priority: 'Monitor', dot: 'bg-blue-500', title: 'text-blue-600', card: 'bg-blue-50 border-blue-200', items: [
                  { q: 'Q30', topic: 'Risk-Return Tradeoff', issue: '67% argue that because exceptions exist, the general principle is false.', action: 'Teach the difference between general principles and universal rules. Use: "Taller people are likely heavier. Is this always true? No. Is it generally true? Yes."' },
                  { q: 'Q7', topic: 'Inflation & Fixed Income', issue: 'Students split between empathy-driven reasoning and not understanding "fixed income."', action: 'Define "fixed income" explicitly before discussing inflation impact on different groups.' },
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
      </main>
    </div>
  );
}
