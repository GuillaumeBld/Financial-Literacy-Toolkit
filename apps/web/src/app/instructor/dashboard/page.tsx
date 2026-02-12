'use client';

import { useState, useMemo, useEffect } from 'react';
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

// ── Hardcoded Test 1 Data ──────────────────────────────────
const DATA = {
  overall: { students: 431, meanScore: 66.44, medianScore: 68.06, totalDiagnose: 603, totalConfirm: 353, scoreDist: [1,8,10,12,24,75,125,82,60,34] },
  domains: [
    { name: "Borrowing & Credit", pctCorrect: 69.2, totalConfErrors: 397, itemCount: 10 },
    { name: "Risk Management", pctCorrect: 73.3, totalConfErrors: 97, itemCount: 4 },
    { name: "Investment & Risk", pctCorrect: 63.8, totalConfErrors: 558, itemCount: 12 },
  ],
  items: [
    { id:"Q1", subdomain:"Compound Interest", domain:"Borrowing & Credit", total:431, correct:394, incorrect:37, pctCorrect:91.4, pctIncorrect:8.6, confidentErrors:8, pctConfErrors:1.9, uncertainCorrect:132, diagnoseN:6, confirmN:11, distractors:{B:20,C:13,D:4} as Record<string,number>, confDist:{low:12,med:17,high:8}, misconceptions:[] as {tag:string;label:string;pct:number;n:number}[] },
    { id:"Q2", subdomain:"Borrowing/Mortgages", domain:"Borrowing & Credit", total:431, correct:313, incorrect:118, pctCorrect:72.6, pctIncorrect:27.4, confidentErrors:27, pctConfErrors:6.3, uncertainCorrect:136, diagnoseN:28, confirmN:32, distractors:{B:63,C:55} as Record<string,number>, confDist:{low:28,med:63,high:27}, misconceptions:[
      {tag:"KG-idk",label:"Knowledge gap",pct:37,n:10},
      {tag:"SE-reversal",label:"Selection error (reversal)",pct:22,n:6},
      {tag:"monthly_vs_total_confusion",label:"Monthly vs total payment confusion",pct:19,n:5}
    ]},
    { id:"Q3", subdomain:"Inflation", domain:"Borrowing & Credit", total:431, correct:370, incorrect:61, pctCorrect:85.8, pctIncorrect:14.2, confidentErrors:16, pctConfErrors:3.7, uncertainCorrect:170, diagnoseN:17, confirmN:19, distractors:{B:34,C:27} as Record<string,number>, confDist:{low:16,med:29,high:16}, misconceptions:[] as {tag:string;label:string;pct:number;n:number}[] },
    { id:"Q4", subdomain:"Borrowing/Interest", domain:"Borrowing & Credit", total:431, correct:400, incorrect:31, pctCorrect:92.8, pctIncorrect:7.2, confidentErrors:7, pctConfErrors:1.6, uncertainCorrect:95, diagnoseN:4, confirmN:5, distractors:{A:20,C:11} as Record<string,number>, confDist:{low:10,med:14,high:7}, misconceptions:[] as {tag:string;label:string;pct:number;n:number}[] },
    { id:"Q5", subdomain:"Emergency Fund", domain:"Borrowing & Credit", total:431, correct:309, incorrect:122, pctCorrect:71.7, pctIncorrect:28.3, confidentErrors:38, pctConfErrors:8.8, uncertainCorrect:138, diagnoseN:35, confirmN:16, distractors:{B:82,D:24,A:16} as Record<string,number>, confDist:{low:28,med:56,high:38}, misconceptions:[
      {tag:"one_month_sufficient",label:"One month emergency fund sufficient",pct:31,n:11},
      {tag:"SE-selfcorrect",label:"Selection error (self-corrected)",pct:23,n:8},
      {tag:"fixed_dollar_amount",label:"Fixed dollar amount (not expense-based)",pct:14,n:5}
    ]},
    { id:"Q6", subdomain:"Inflation (Lowering)", domain:"Borrowing & Credit", total:431, correct:142, incorrect:289, pctCorrect:32.9, pctIncorrect:67.1, confidentErrors:102, pctConfErrors:23.7, uncertainCorrect:82, diagnoseN:66, confirmN:5, distractors:{A:163,C:82,D:44} as Record<string,number>, confDist:{low:54,med:133,high:102}, misconceptions:[
      {tag:"lower_inflation_means_lower_prices",label:"Lower inflation = falling prices",pct:55,n:36},
      {tag:"employment_link",label:"Links to employment changes",pct:22,n:14},
      {tag:"SE-selfcorrect",label:"Selection error (self-corrected)",pct:12,n:8},
      {tag:"KG-idk",label:"Knowledge gap",pct:6,n:4}
    ]},
    { id:"Q7", subdomain:"Inflation (Fixed Income)", domain:"Borrowing & Credit", total:431, correct:259, incorrect:172, pctCorrect:60.1, pctIncorrect:39.9, confidentErrors:62, pctConfErrors:14.4, uncertainCorrect:118, diagnoseN:60, confirmN:16, distractors:{B:93,A:48,D:31} as Record<string,number>, confDist:{low:32,med:78,high:62}, misconceptions:[
      {tag:"older_workers_worst",label:"Older workers suffer most",pct:27,n:16},
      {tag:"young_couples_worst",label:"Young couples suffer most",pct:25,n:15},
      {tag:"SE-selfcorrect",label:"Selection error (self-corrected)",pct:23,n:14},
      {tag:"young_because_building",label:"Young because building wealth",pct:8,n:5},
      {tag:"fixed_income_misunderstood",label:'Does not understand "fixed income"',pct:3,n:2}
    ]},
    { id:"Q8", subdomain:"Auto Loans", domain:"Borrowing & Credit", total:431, correct:248, incorrect:183, pctCorrect:57.5, pctIncorrect:42.5, confidentErrors:52, pctConfErrors:12.1, uncertainCorrect:129, diagnoseN:40, confirmN:17, distractors:{B:89,E:39,A:38,D:17} as Record<string,number>, confDist:{low:44,med:87,high:52}, misconceptions:[
      {tag:"down_payment_only",label:"Only down payment negotiable",pct:35,n:14},
      {tag:"SE-selfcorrect",label:"Selection error (self-corrected)",pct:23,n:9},
      {tag:"KG-idk",label:"Knowledge gap",pct:15,n:6},
      {tag:"interest_rate_only",label:"Only interest rate negotiable",pct:13,n:5},
      {tag:"interest_rate_fixed_by_fed",label:"Fed sets rates, not negotiable",pct:8,n:3}
    ]},
    { id:"Q9", subdomain:"Budgeting", domain:"Borrowing & Credit", total:431, correct:323, incorrect:108, pctCorrect:74.9, pctIncorrect:25.1, confidentErrors:28, pctConfErrors:6.5, uncertainCorrect:121, diagnoseN:7, confirmN:8, distractors:{D:49,C:39,B:20} as Record<string,number>, confDist:{low:35,med:45,high:28}, misconceptions:[] as {tag:string;label:string;pct:number;n:number}[] },
    { id:"Q10", subdomain:"Credit Reports", domain:"Borrowing & Credit", total:431, correct:226, incorrect:205, pctCorrect:52.4, pctIncorrect:47.6, confidentErrors:57, pctConfErrors:13.2, uncertainCorrect:134, diagnoseN:51, confirmN:18, distractors:{B:89,A:87,D:29} as Record<string,number>, confDist:{low:38,med:110,high:57}, misconceptions:[
      {tag:"employer_use_confusion",label:"Employers can't check credit",pct:33,n:17},
      {tag:"SE-selfcorrect",label:"Selection error (self-corrected)",pct:31,n:16},
      {tag:"credit_score_confusion",label:"Credit report vs. score confusion",pct:8,n:4},
      {tag:"SE-reversal",label:"Selection error (reversal)",pct:6,n:3}
    ]},
    { id:"Q11", subdomain:"Risk Diversification", domain:"Risk Management", total:431, correct:325, incorrect:106, pctCorrect:75.4, pctIncorrect:24.6, confidentErrors:17, pctConfErrors:3.9, uncertainCorrect:161, diagnoseN:17, confirmN:34, distractors:{C:71,A:35} as Record<string,number>, confDist:{low:43,med:46,high:17}, misconceptions:[
      {tag:"KG-idk",label:"Knowledge gap",pct:41,n:7},
      {tag:"single_stock_safer_belief",label:"Single stock is safer",pct:24,n:4}
    ]},
    { id:"Q12", subdomain:"Insurance", domain:"Risk Management", total:431, correct:305, incorrect:126, pctCorrect:70.8, pctIncorrect:29.2, confidentErrors:38, pctConfErrors:8.8, uncertainCorrect:156, diagnoseN:34, confirmN:7, distractors:{B:116,C:9,D:1} as Record<string,number>, confDist:{low:17,med:71,high:38}, misconceptions:[
      {tag:"routine_care_primary",label:"Insurance is for routine care",pct:56,n:19},
      {tag:"frequency_over_severity",label:"Used often = primary function",pct:18,n:6},
      {tag:"SE-selfcorrect",label:"Selection error (self-corrected)",pct:15,n:5},
      {tag:"insurance_doesnt_cover_large_bills",label:"Insurance doesn't cover large bills",pct:9,n:3}
    ]},
    { id:"Q13", subdomain:"Insurance", domain:"Risk Management", total:431, correct:269, incorrect:162, pctCorrect:62.4, pctIncorrect:37.6, confidentErrors:31, pctConfErrors:7.2, uncertainCorrect:149, diagnoseN:20, confirmN:31, distractors:{B:64,C:52,D:46} as Record<string,number>, confDist:{low:60,med:71,high:31}, misconceptions:[
      {tag:"deductible_is_max_payout",label:"Deductible is max payout",pct:30,n:6},
      {tag:"KG-idk",label:"Knowledge gap",pct:30,n:6},
      {tag:"deductible_is_premium",label:"Confuses deductible with premium",pct:20,n:4},
      {tag:"SE-selfcorrect",label:"Selection error (self-corrected)",pct:15,n:3}
    ]},
    { id:"Q14", subdomain:"Risk Diversification", domain:"Risk Management", total:431, correct:364, incorrect:67, pctCorrect:84.5, pctIncorrect:15.5, confidentErrors:11, pctConfErrors:2.6, uncertainCorrect:151, diagnoseN:8, confirmN:18, distractors:{A:35,C:18,D:14} as Record<string,number>, confDist:{low:21,med:35,high:11}, misconceptions:[
      {tag:"SE-selfcorrect",label:"Selection error (self-corrected)",pct:50,n:4},
      {tag:"more_assets_more_risk",label:"More assets = more risk",pct:38,n:3}
    ]},
    { id:"Q29", subdomain:"Interest Rates & Bonds", domain:"Investment & Risk", total:431, correct:156, incorrect:275, pctCorrect:36.2, pctIncorrect:63.8, confidentErrors:84, pctConfErrors:19.5, uncertainCorrect:76, diagnoseN:31, confirmN:12, distractors:{E:129,A:108,D:24,C:14} as Record<string,number>, confDist:{low:83,med:108,high:84}, misconceptions:[
      {tag:"positive_correlation_belief",label:"Rates up = prices up",pct:35,n:11},
      {tag:"KG-idk",label:"Knowledge gap",pct:23,n:7},
      {tag:"SE-selfcorrect",label:"Selection error (self-corrected)",pct:19,n:6},
      {tag:"no_relationship_belief",label:"No relationship between rates and prices",pct:6,n:2}
    ]},
    { id:"Q30", subdomain:"Risk-Return Tradeoff", domain:"Investment & Risk", total:431, correct:333, incorrect:98, pctCorrect:77.3, pctIncorrect:22.7, confidentErrors:27, pctConfErrors:6.3, uncertainCorrect:142, diagnoseN:21, confirmN:11, distractors:{B:62,C:36} as Record<string,number>, confDist:{low:21,med:50,high:27}, misconceptions:[
      {tag:"exceptions_disprove_rule",label:"Exceptions invalidate the rule",pct:67,n:14},
      {tag:"prediction_negates_risk",label:"Predictions eliminate risk",pct:10,n:2}
    ]},
    { id:"Q31", subdomain:"Stock Market Function", domain:"Investment & Risk", total:431, correct:268, incorrect:163, pctCorrect:62.2, pctIncorrect:37.8, confidentErrors:43, pctConfErrors:10.0, uncertainCorrect:140, diagnoseN:14, confirmN:8, distractors:{B:76,A:55,D:32} as Record<string,number>, confDist:{low:32,med:88,high:43}, misconceptions:[
      {tag:"wealth_creation_primary",label:"Wealth creation is primary function",pct:29,n:4},
      {tag:"SE-reversal",label:"Selection error (reversal)",pct:21,n:3},
      {tag:"SE-selfcorrect",label:"Selection error (self-corrected)",pct:14,n:2}
    ]},
    { id:"Q32", subdomain:"Long-Term Asset Returns", domain:"Investment & Risk", total:431, correct:227, incorrect:204, pctCorrect:52.7, pctIncorrect:47.3, confidentErrors:60, pctConfErrors:13.9, uncertainCorrect:125, diagnoseN:14, confirmN:3, distractors:{B:96,A:57,D:51} as Record<string,number>, confDist:{low:56,med:88,high:60}, misconceptions:[
      {tag:"bonds_safest_therefore_best",label:"Bonds safest = best returns",pct:43,n:6},
      {tag:"SE-selfcorrect",label:"Selection error (self-corrected)",pct:29,n:4},
      {tag:"savings_safest_therefore_best",label:"Savings safest = best returns",pct:14,n:2}
    ]},
    { id:"Q33", subdomain:"Probability (% to Count)", domain:"Investment & Risk", total:431, correct:340, incorrect:91, pctCorrect:78.9, pctIncorrect:21.1, confidentErrors:20, pctConfErrors:4.6, uncertainCorrect:141, diagnoseN:2, confirmN:9, distractors:{A:36,E:32,B:20,D:3} as Record<string,number>, confDist:{low:34,med:37,high:20}, misconceptions:[] as {tag:string;label:string;pct:number;n:number}[] },
    { id:"Q34", subdomain:"Diversification Effect", domain:"Investment & Risk", total:431, correct:322, incorrect:109, pctCorrect:74.7, pctIncorrect:25.3, confidentErrors:34, pctConfErrors:7.9, uncertainCorrect:141, diagnoseN:5, confirmN:4, distractors:{A:40,C:38,D:31} as Record<string,number>, confDist:{low:26,med:49,high:34}, misconceptions:[] as {tag:string;label:string;pct:number;n:number}[] },
    { id:"Q35", subdomain:"Risk-Return Relationship", domain:"Investment & Risk", total:431, correct:337, incorrect:94, pctCorrect:78.2, pctIncorrect:21.8, confidentErrors:25, pctConfErrors:5.8, uncertainCorrect:152, diagnoseN:10, confirmN:11, distractors:{B:63,C:31} as Record<string,number>, confDist:{low:26,med:43,high:25}, misconceptions:[
      {tag:"real_world_counterexample",label:"Real-world counterexample",pct:50,n:5},
      {tag:"exceptions_disprove_rule",label:"Exceptions invalidate the rule",pct:20,n:2},
      {tag:"SE-selfcorrect",label:"Selection error (self-corrected)",pct:20,n:2}
    ]},
    { id:"Q36", subdomain:"Diversification Principle", domain:"Investment & Risk", total:431, correct:279, incorrect:152, pctCorrect:64.7, pctIncorrect:35.3, confidentErrors:77, pctConfErrors:17.9, uncertainCorrect:105, diagnoseN:53, confirmN:7, distractors:{B:120,C:32} as Record<string,number>, confDist:{low:22,med:53,high:77}, misconceptions:[
      {tag:"SE-reversal",label:"Selection error (reversal)",pct:38,n:20},
      {tag:"correct_reasoning_wrong_answer",label:"Correct reasoning, wrong answer",pct:28,n:15},
      {tag:"all_places_can_fail",label:"All places can fail simultaneously",pct:8,n:4},
      {tag:"SE-misread",label:"Selection error (misread)",pct:8,n:4},
      {tag:"KG-idk",label:"Knowledge gap",pct:4,n:2}
    ]},
    { id:"Q37", subdomain:"Insurance Types", domain:"Investment & Risk", total:431, correct:329, incorrect:102, pctCorrect:76.3, pctIncorrect:23.7, confidentErrors:47, pctConfErrors:10.9, uncertainCorrect:164, diagnoseN:21, confirmN:11, distractors:{A:62,B:21,D:19} as Record<string,number>, confDist:{low:18,med:37,high:47}, misconceptions:[
      {tag:"SE-selfcorrect",label:"Selection error (self-corrected)",pct:38,n:8},
      {tag:"health_insurance_for_injuries",label:"Health insurance for injuries only",pct:33,n:7},
      {tag:"auto_liability_for_self",label:"Auto liability covers self",pct:14,n:3}
    ]},
    { id:"Q38", subdomain:"Inflation Protection", domain:"Investment & Risk", total:431, correct:102, incorrect:329, pctCorrect:23.7, pctIncorrect:76.3, confidentErrors:81, pctConfErrors:18.8, uncertainCorrect:65, diagnoseN:19, confirmN:10, distractors:{A:122,E:112,C:63,B:32} as Record<string,number>, confDist:{low:109,med:139,high:81}, misconceptions:[
      {tag:"fixed_bond_best",label:"Fixed bonds best for inflation",pct:26,n:5},
      {tag:"KG-idk",label:"Knowledge gap",pct:21,n:4},
      {tag:"SE-reversal",label:"Selection error (reversal)",pct:16,n:3},
      {tag:"SE-selfcorrect",label:"Selection error (self-corrected)",pct:16,n:3},
      {tag:"mortgage_not_house",label:"Mortgage, not house value",pct:11,n:2}
    ]},
    { id:"Q39", subdomain:"Stocks vs Bonds Risk", domain:"Investment & Risk", total:431, correct:310, incorrect:121, pctCorrect:71.9, pctIncorrect:28.1, confidentErrors:32, pctConfErrors:7.4, uncertainCorrect:145, diagnoseN:11, confirmN:6, distractors:{C:73,B:48} as Record<string,number>, confDist:{low:47,med:42,high:32}, misconceptions:[
      {tag:"some_bonds_risky_too",label:"Some bonds risky too",pct:27,n:3},
      {tag:"bonds_contain_stocks",label:"Bonds contain stocks",pct:18,n:2},
      {tag:"SE-reversal",label:"Selection error (reversal)",pct:18,n:2}
    ]},
    { id:"Q40", subdomain:"2008 Financial Crisis", domain:"Investment & Risk", total:431, correct:299, incorrect:132, pctCorrect:69.4, pctIncorrect:30.6, confidentErrors:28, pctConfErrors:6.5, uncertainCorrect:182, diagnoseN:9, confirmN:24, distractors:{D:46,A:44,C:42} as Record<string,number>, confDist:{low:48,med:56,high:28}, misconceptions:[
      {tag:"SE-reversal",label:"Selection error (reversal)",pct:44,n:4},
      {tag:"high_savings_risk",label:"High savings = high risk",pct:22,n:2}
    ]},
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
    setIsAdmin(name === 'gbolivard' || name === 'ajalilv');
    localStorage.setItem('active-portal', 'instructor');
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('instructor-token');
    localStorage.removeItem('instructor-name');
    localStorage.removeItem('active-portal');
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
  const totalIncorrect = DATA.items.reduce((s, i) => s + i.incorrect, 0);
  const overconfidenceRate = totalIncorrect > 0
    ? (totalConfidentErrors / totalIncorrect * 100).toFixed(1)
    : '0';
  const uniqueMisconceptions = new Set(
    DATA.items.flatMap(i => i.misconceptions.map(m => m.tag))
  ).size;
  const itemsWithMisconceptions = DATA.items.filter(i => i.misconceptions.length > 0).length;

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
              <button
                onClick={() => window.location.reload()}
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
            {/* Guide Banner */}
            <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4 mb-6">
              <h2 className="text-sm font-bold text-indigo-900 mb-1">How to Use This Dashboard</h2>
              <p className="text-xs text-indigo-700 leading-relaxed">
                This dashboard summarizes your students&apos; performance on the pre-assessment, powered by the SDM-10 diagnostic model.
                Use <strong>Overview</strong> to see where your class stands overall.
                Use <strong>Item Analysis</strong> to drill into specific questions and see which answer choices students picked and why.
                Use <strong>Misconceptions</strong> to identify the specific wrong beliefs your students hold so you can address them directly in your teaching.
              </p>
            </div>

            {/* KPI Row */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <div className="bg-white rounded-xl p-5 border border-gray-200">
                <div className="flex items-center gap-2 text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                  <TrendingUp className="w-3.5 h-3.5" /> Mean Score
                </div>
                <div className="text-3xl font-bold text-loyola-maroon">{DATA.overall.meanScore}%</div>
                <div className="text-xs text-gray-400 mt-0.5">Median: {DATA.overall.medianScore}%</div>
                <p className="text-[10px] text-gray-400 mt-2 leading-snug">Average percentage of the 26 scored knowledge questions answered correctly. This is a baseline before your course instruction.</p>
              </div>
              <div className="bg-white rounded-xl p-5 border border-gray-200">
                <div className="flex items-center gap-2 text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                  <Users className="w-3.5 h-3.5" /> Students
                </div>
                <div className="text-3xl font-bold text-gray-900">{DATA.overall.students}</div>
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
                <div className="text-3xl font-bold text-green-600">{uniqueMisconceptions}</div>
                <div className="text-xs text-gray-400 mt-0.5">across {itemsWithMisconceptions} questions</div>
                <p className="text-[10px] text-gray-400 mt-2 leading-snug">Unique misconceptions identified through SDM-10 diagnostic follow-ups. These are specific wrong beliefs your students hold &mdash; not just wrong answers. See the Misconceptions tab for details and teaching strategies.</p>
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
                                            <strong>{opt}</strong>: {n} <span className="text-gray-400">({(n / item.incorrect * 100).toFixed(0)}%)</span>
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
            {/* Guide */}
            <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4 mb-6">
              <h2 className="text-sm font-bold text-indigo-900 mb-1">Understanding Misconceptions</h2>
              <p className="text-xs text-indigo-700 leading-relaxed mb-2">
                This tab shows the specific wrong beliefs your students hold, identified through SDM-10 diagnostic follow-up questions.
                Unlike a simple &quot;% incorrect&quot; metric, these reveal <em>why</em> students are getting questions wrong, so you can tailor your instruction to directly address those beliefs.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-[11px]">
                <div className="flex items-start gap-2">
                  <span className="inline-block w-2.5 h-2.5 rounded-full bg-red-500 mt-0.5 shrink-0" />
                  <span className="text-indigo-700"><strong>Misconception</strong> &mdash; The student holds an active wrong belief (e.g., &quot;lower inflation means prices fall&quot;). These require targeted instruction to correct.</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="inline-block w-2.5 h-2.5 rounded-full bg-purple-500 mt-0.5 shrink-0" />
                  <span className="text-indigo-700"><strong>Selection Error</strong> &mdash; The student understood the concept but chose the wrong answer (e.g., confused by negative phrasing). May indicate a question design issue rather than a knowledge gap.</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="inline-block w-2.5 h-2.5 rounded-full bg-gray-400 mt-0.5 shrink-0" />
                  <span className="text-indigo-700"><strong>Knowledge Gap</strong> &mdash; The student simply didn&apos;t know the answer (e.g., &quot;I don&apos;t know&quot;). These respond well to standard instruction and are filtered from the list below.</span>
                </div>
              </div>
            </div>

            {/* Class-wide misconceptions */}
            <div className="bg-white rounded-xl p-5 border border-gray-200 mb-6">
              <h3 className="text-sm font-semibold text-gray-700 mb-1">Class-Wide Misconception Prevalence</h3>
              <p className="text-xs text-gray-400 mb-5">
                Ranked by number of students affected. The progress bar shows what fraction of the class holds each belief. Focus your teaching on items near the top of this list for maximum impact.
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
      </main>
    </div>
  );
}
