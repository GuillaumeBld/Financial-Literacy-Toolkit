'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  Map,
  RefreshCw,
  LogOut,
  Trophy,
  ScrollText,
  AlertTriangle,
  UserCheck,
  Users,
  Activity,
  Clock,
  X,
  Eye,
  ArrowLeft,
} from 'lucide-react';
import type {
  StudentPosition,
  TileData,
  QuestLogItem,
  GameboardStatusResponse,
} from '@/lib/gameboard-types';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const POLL_INTERVAL = 30_000; // 30 seconds
const TILES_PER_ROW = 5;
const TOTAL_TILES = 50;

// Stale-level dot colors: cold → warm progression
const STALE_COLORS: Record<string, string> = {
  active: '#3b82f6',  // blue — cold, all good
  yellow: '#22c55e',  // green — mild staleness
  amber:  '#f59e0b',  // amber — warming up
  red:    '#ef4444',  // red — hot, needs attention
};

function staleColor(level: string): string {
  return STALE_COLORS[level] || STALE_COLORS.active;
}

function tileLabel(n: number): string {
  if (n <= 40) return `Q${n}`;
  return `SDM ${n - 40}`;
}

function formatStaleDuration(mins: number): string {
  if (mins < 60) return `${mins}m`;
  if (mins < 1440) return `${Math.floor(mins / 60)}h ${mins % 60}m`;
  const days = Math.floor(mins / 1440);
  const hours = Math.floor((mins % 1440) / 60);
  return `${days}d ${hours}h`;
}

type Course = { id: string; name: string };

// ---------------------------------------------------------------------------
// Main Page
// ---------------------------------------------------------------------------

export default function GameboardStatusPage() {
  const [data, setData] = useState<GameboardStatusResponse | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourse, setSelectedCourse] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [secondsAgo, setSecondsAgo] = useState(0);
  const [selectedTile, setSelectedTile] = useState<number | null>(null);
  const [instructorName, setInstructorName] = useState('');
  const [dashboardPath, setDashboardPath] = useState('/instructor/dashboard');
  const router = useRouter();
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchData = useCallback(async (courseId?: string) => {
    const token = localStorage.getItem('instructor-token');
    if (!token) { router.push('/instructor'); return; }

    try {
      const url = courseId
        ? `/api/instructor/status?courseId=${courseId}`
        : '/api/instructor/status';
      const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) {
        if (res.status === 401) { localStorage.removeItem('instructor-token'); router.push('/instructor'); return; }
        throw new Error('Failed to fetch');
      }
      const json = await res.json();
      setData(json.data);
      setCourses(json.courses || []);
      if (json.courses?.length && !courseId) {
        setSelectedCourse(json.courses[0].id);
      }
      setLastUpdated(new Date());
      setSecondsAgo(0);
    } catch (err) {
      console.error('Status fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  // Initial load
  useEffect(() => {
    const token = localStorage.getItem('instructor-token');
    const name = localStorage.getItem('instructor-name');
    if (!token) { router.push('/instructor'); return; }
    setInstructorName(name || 'Instructor');
    setDashboardPath(localStorage.getItem('active-portal') === 'admin' ? '/admin' : '/instructor/dashboard');
    fetchData();
  }, [router, fetchData]);

  // Polling
  useEffect(() => {
    pollRef.current = setInterval(() => {
      fetchData(selectedCourse || undefined);
    }, POLL_INTERVAL);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [fetchData, selectedCourse]);

  // Seconds-ago ticker
  useEffect(() => {
    tickRef.current = setInterval(() => {
      if (lastUpdated) setSecondsAgo(Math.floor((Date.now() - lastUpdated.getTime()) / 1000));
    }, 1000);
    return () => { if (tickRef.current) clearInterval(tickRef.current); };
  }, [lastUpdated]);

  const handleCourseChange = (id: string) => {
    setSelectedCourse(id);
    setIsLoading(true);
    fetchData(id);
  };

  const handleRefresh = () => {
    setIsLoading(true);
    fetchData(selectedCourse || undefined);
  };

  const handleLogout = () => {
    localStorage.removeItem('instructor-token');
    localStorage.removeItem('instructor-name');
    router.push('/instructor');
  };

  // Loading state
  if (isLoading && !data) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-12 h-12 text-ink animate-spin mx-auto mb-4" />
          <p className="text-loyola-gray-600">Loading gameboard...</p>
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
              <h1 className="text-2xl font-bold text-ink flex items-center gap-2">
                <Map className="w-6 h-6" />
                Gameboard Status
              </h1>
              <p className="text-sm text-loyola-gray-600">
                Real-time student activity &middot; Updated {secondsAgo}s ago
              </p>
            </div>
            <div className="flex items-center gap-4">
              <button onClick={() => router.push(dashboardPath as any)} className="p-2 text-loyola-gray-600 hover:text-ink transition" title="Back to Dashboard">
                <ArrowLeft className="w-5 h-5" />
              </button>
              <button onClick={handleRefresh} className="p-2 text-loyola-gray-600 hover:text-ink transition" title="Refresh">
                <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
              </button>
              <button onClick={handleLogout} className="flex items-center gap-2 px-4 py-2 text-loyola-gray-700 hover:text-ink transition">
                <LogOut className="w-5 h-5" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        {/* Course selector */}
        {courses.length > 0 && (
          <div className="mb-6">
            <select
              value={selectedCourse}
              onChange={e => handleCourseChange(e.target.value)}
              className="px-4 py-2 border-2 border-loyola-gray-300 rounded-lg focus:ring-2 focus:ring-ink/20 focus:border-ink text-sm"
            >
              {courses.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
        )}

        {!data ? (
          <div className="text-center py-12"><p className="text-loyola-gray-600">No data available</p></div>
        ) : (
          <div className="flex gap-6 items-start">
            {/* Left: Gameboard Map (65%) */}
            <div className="w-[65%] space-y-4">
              {/* Onboarded Queue */}
              <ZoneBox
                icon={<UserCheck className="w-4 h-4" />}
                label="Onboarded"
                count={data.onboarded.length}
                borderClass="border-dashed border-loyola-gray-300"
                bgClass="bg-gray-50"
              >
                <DotCluster students={data.onboarded} onClickTile={() => setSelectedTile(0)} maxDots={12} />
              </ZoneBox>

              {/* Snake path */}
              <div className="bg-white rounded-xl shadow-md p-4">
                <SnakePath tiles={data.tiles} onSelectTile={setSelectedTile} />
              </div>

              {/* Submitted Goal */}
              <ZoneBox
                icon={<Trophy className="w-4 h-4 text-status-success" />}
                label="Submitted"
                count={data.submitted.length}
                borderClass="border-status-success/30"
                bgClass="bg-status-success-tint"
              >
                <DotCluster students={data.submitted} onClickTile={() => setSelectedTile(51)} maxDots={12} />
              </ZoneBox>
            </div>

            {/* Right: Quest Log (35%) */}
            <div className="w-[35%] space-y-4">
              {/* Summary cards */}
              <div className="grid grid-cols-2 gap-3">
                <SummaryCard icon={<Activity className="w-4 h-4 text-status-success" />} label="Active" value={data.summary.active} />
                <SummaryCard icon={<Clock className="w-4 h-4 text-status-warning" />} label="Stale" value={data.summary.stale} />
                <SummaryCard icon={<Trophy className="w-4 h-4 text-status-success" />} label="Submitted" value={data.summary.submitted} />
                <SummaryCard icon={<Users className="w-4 h-4 text-loyola-gray-500" />} label="Onboarded" value={data.summary.onboarded} />
              </div>

              {/* Quest Log */}
              <div className="bg-white rounded-xl shadow-md p-4">
                <h3 className="text-sm font-bold text-ink flex items-center gap-2 mb-3">
                  <ScrollText className="w-4 h-4" />
                  Quest Log
                  <span className="text-loyola-gray-500 font-normal">
                    &mdash; Attention Required ({data.questLog.length})
                  </span>
                </h3>
                {data.questLog.length === 0 ? (
                  <p className="text-sm text-loyola-gray-500 italic">No students require attention</p>
                ) : (
                  <div className="space-y-2 max-h-[500px] overflow-y-auto">
                    {data.questLog.map(q => (
                      <QuestLogRow key={q.userId} item={q} />
                    ))}
                  </div>
                )}
              </div>

              {/* Legend */}
              <div className="bg-white rounded-xl shadow-md p-4">
                <h3 className="text-sm font-bold text-ink mb-2">Legend</h3>
                <div className="space-y-1.5 text-xs text-loyola-gray-600">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-blue-500 inline-block" /> Active (&lt;15 min)
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-green-500 inline-block" /> Stale 15 min&ndash;3h
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-amber-500 inline-block" /> Stale 3h&ndash;24h
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-red-500 inline-block animate-pulse" /> Stale 24h+ (Quest Log)
                  </div>
                  <div className="flex items-center gap-2 pt-1 border-t border-loyola-gray-100 mt-1">
                    <span className="text-[10px] font-mono bg-loyola-gray-100 rounded px-1">Q1–Q40</span> Anchor items
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono bg-loyola-gray-100 rounded px-1">SDM 1–10</span> Adaptive items
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Tile Roster Modal */}
      {selectedTile !== null && data && (
        <TileRosterModal
          tile={selectedTile}
          data={data}
          onClose={() => setSelectedTile(null)}
        />
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Snake Path Grid
// ---------------------------------------------------------------------------

function SnakePath({
  tiles,
  onSelectTile,
}: {
  tiles: Record<number, TileData>;
  onSelectTile: (n: number) => void;
}) {
  const rows: number[][] = [];
  for (let row = 0; row < TOTAL_TILES / TILES_PER_ROW; row++) {
    const start = row * TILES_PER_ROW + 1;
    const rowTiles = Array.from({ length: TILES_PER_ROW }, (_, i) => start + i);
    // Even rows left-to-right, odd rows right-to-left (snake)
    if (row % 2 === 1) rowTiles.reverse();
    rows.push(rowTiles);
  }

  return (
    <div className="space-y-1">
      {rows.map((row, rowIdx) => (
        <div key={rowIdx} className="flex gap-1">
          {row.map(tileNum => {
            const tile = tiles[tileNum];
            const total = tile?.totalCount || 0;
            const hasStale = (tile?.staleCount || 0) > 0;
            const isSDM = tileNum > 40;
            return (
              <button
                key={tileNum}
                onClick={() => total > 0 ? onSelectTile(tileNum) : undefined}
                className={`
                  relative flex-1 min-h-[60px] rounded-lg border-2 p-1 transition-all
                  ${total > 0 ? 'cursor-pointer hover:shadow-md hover:border-ink/30' : 'cursor-default'}
                  ${isSDM ? 'border-indigo-200 bg-indigo-50/50' : 'border-loyola-gray-200 bg-white'}
                  ${hasStale ? 'border-amber-300' : ''}
                `}
              >
                {/* Tile label */}
                <div className={`text-[10px] font-mono leading-none mb-1 ${isSDM ? 'text-indigo-500' : 'text-loyola-gray-400'}`}>
                  {tileLabel(tileNum)}
                </div>

                {/* Student dots or count badge */}
                {total > 0 && total <= 8 ? (
                  <div className="flex flex-wrap gap-0.5 justify-center">
                    {tile!.students.map(s => (
                      <StudentDot key={s.userId} student={s} size="sm" />
                    ))}
                  </div>
                ) : total > 8 ? (
                  <div className="flex items-center justify-center gap-1 mt-1">
                    <span className="text-[10px] font-bold text-status-success bg-status-success-tint rounded px-1">
                      {tile!.activeCount}
                    </span>
                    {tile!.staleCount > 0 && (
                      <span className="text-[10px] font-bold text-status-warning bg-status-warning-tint rounded px-1">
                        {tile!.staleCount}
                      </span>
                    )}
                  </div>
                ) : null}
              </button>
            );
          })}
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Student Dot
// ---------------------------------------------------------------------------

function StudentDot({
  student,
  size = 'sm',
}: {
  student: StudentPosition;
  size?: 'sm' | 'md';
}) {
  const [showTooltip, setShowTooltip] = useState(false);
  const color = staleColor(student.staleLevel);
  const dim = size === 'sm' ? 'w-3 h-3' : 'w-4 h-4';
  const pulseClass = student.staleLevel === 'red' ? 'animate-pulse' : '';

  return (
    <div
      className="relative"
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      <div
        className={`${dim} rounded-full ${pulseClass} transition-all`}
        style={{ backgroundColor: color }}
      />
      {showTooltip && (
        <div className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 bg-gray-900 text-white text-[11px] rounded-lg px-3 py-2 whitespace-nowrap shadow-lg pointer-events-none">
          <div className="font-mono font-bold">{student.hashedKey}</div>
          <div>Position: {student.position === 0 ? 'Onboarded' : student.position === 51 ? 'Submitted' : tileLabel(student.position)}</div>
          <div>Last active: {formatStaleDuration(student.staleDurationMin)} ago</div>
          {student.tabSwitches > 0 && <div>Tab switches: {student.tabSwitches}</div>}
          <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900" />
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Zone Box (Onboarded / Submitted)
// ---------------------------------------------------------------------------

function ZoneBox({
  icon,
  label,
  count,
  borderClass,
  bgClass,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  count: number;
  borderClass: string;
  bgClass: string;
  children: React.ReactNode;
}) {
  return (
    <div className={`rounded-xl border-2 ${borderClass} ${bgClass} p-3`}>
      <div className="flex items-center gap-2 mb-2">
        {icon}
        <span className="text-sm font-semibold text-ink">{label}</span>
        <span className="text-xs text-loyola-gray-500">({count})</span>
      </div>
      {children}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Dot Cluster (for Onboarded / Submitted zones)
// ---------------------------------------------------------------------------

function DotCluster({
  students,
  onClickTile,
  maxDots,
}: {
  students: StudentPosition[];
  onClickTile: () => void;
  maxDots: number;
}) {
  if (students.length === 0) {
    return <p className="text-xs text-loyola-gray-400 italic">None</p>;
  }

  const visible = students.slice(0, maxDots);
  const overflow = students.length - maxDots;

  return (
    <button onClick={onClickTile} className="flex flex-wrap gap-1 items-center cursor-pointer">
      {visible.map(s => (
        <StudentDot key={s.userId} student={s} size="md" />
      ))}
      {overflow > 0 && (
        <span className="text-xs text-loyola-gray-500 font-semibold ml-1">+{overflow} more</span>
      )}
    </button>
  );
}

// ---------------------------------------------------------------------------
// Summary Card
// ---------------------------------------------------------------------------

function SummaryCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
}) {
  return (
    <div className="bg-white rounded-xl shadow-md p-3 flex items-center gap-3">
      <div className="p-2 rounded-lg bg-gray-100">{icon}</div>
      <div>
        <div className="text-2xl font-bold text-ink">{value}</div>
        <div className="text-xs text-loyola-gray-500">{label}</div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Quest Log Row
// ---------------------------------------------------------------------------

function QuestLogRow({ item }: { item: QuestLogItem }) {
  const color = staleColor(item.staleLevel);
  return (
    <div className="flex items-center gap-3 p-2 rounded-lg bg-red-50/60 border border-red-100">
      <div className="w-3 h-3 rounded-full animate-pulse flex-shrink-0" style={{ backgroundColor: color }} />
      <div className="flex-1 min-w-0">
        <div className="text-xs font-mono font-bold text-ink truncate">{item.hashedKey}</div>
        <div className="text-[11px] text-loyola-gray-600">
          {tileLabel(item.position)} &middot; {formatStaleDuration(item.staleDurationMin)} stale
          {item.tabSwitches > 0 && <span className="text-status-warning ml-1">&middot; {item.tabSwitches} tab switches</span>}
        </div>
      </div>
      <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0" />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tile Roster Modal
// ---------------------------------------------------------------------------

function TileRosterModal({
  tile,
  data,
  onClose,
}: {
  tile: number;
  data: GameboardStatusResponse;
  onClose: () => void;
}) {
  let students: StudentPosition[] = [];
  let title = '';

  if (tile === 0) {
    students = data.onboarded;
    title = 'Onboarded Queue';
  } else if (tile === 51) {
    students = data.submitted;
    title = 'Submitted';
  } else {
    students = data.tiles[tile]?.students || [];
    title = `Tile ${tileLabel(tile)}`;
  }

  // Sort by stale duration descending
  const sorted = [...students].sort((a, b) => b.staleDurationMin - a.staleDurationMin);

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full max-h-[80vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b border-loyola-gray-200">
          <h2 className="text-lg font-bold text-ink flex items-center gap-2">
            <Eye className="w-5 h-5" />
            {title}
            <span className="text-sm font-normal text-loyola-gray-500">({sorted.length} students)</span>
          </h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg transition">
            <X className="w-5 h-5 text-loyola-gray-500" />
          </button>
        </div>
        <div className="overflow-y-auto p-4">
          {sorted.length === 0 ? (
            <p className="text-sm text-loyola-gray-500 italic text-center py-8">No students on this tile</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b-2 border-loyola-gray-200 text-left">
                  <th className="py-2 px-2 font-semibold text-loyola-gray-700">Student</th>
                  <th className="py-2 px-2 font-semibold text-loyola-gray-700 text-right">Stale</th>
                  <th className="py-2 px-2 font-semibold text-loyola-gray-700 text-right">Tabs</th>
                  <th className="py-2 px-2 font-semibold text-loyola-gray-700">Status</th>
                </tr>
              </thead>
              <tbody>
                {sorted.map(s => {
                  const color = staleColor(s.staleLevel);
                  return (
                    <tr key={s.userId} className="border-b border-loyola-gray-100">
                      <td className="py-2 px-2">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
                          <span className="font-mono text-xs">{s.hashedKey}</span>
                        </div>
                      </td>
                      <td className="py-2 px-2 text-right text-xs">
                        {formatStaleDuration(s.staleDurationMin)}
                      </td>
                      <td className="py-2 px-2 text-right text-xs">
                        {s.tabSwitches > 0 ? (
                          <span className="text-status-warning font-semibold">{s.tabSwitches}</span>
                        ) : '—'}
                      </td>
                      <td className="py-2 px-2">
                        <StaleIndicator level={s.staleLevel} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Stale Indicator Badge
// ---------------------------------------------------------------------------

function StaleIndicator({ level }: { level: string }) {
  switch (level) {
    case 'active':
      return <span className="text-[11px] font-semibold text-status-success bg-status-success-tint rounded px-1.5 py-0.5">Active</span>;
    case 'yellow':
      return <span className="text-[11px] font-semibold text-yellow-700 bg-yellow-100 rounded px-1.5 py-0.5">15m+</span>;
    case 'amber':
      return <span className="text-[11px] font-semibold text-amber-700 bg-amber-100 rounded px-1.5 py-0.5">3h+</span>;
    case 'red':
      return <span className="text-[11px] font-semibold text-red-700 bg-red-100 rounded px-1.5 py-0.5 animate-pulse">24h+</span>;
    default:
      return null;
  }
}
