// Gameboard Status Page types

export type StaleLevel = 'active' | 'yellow' | 'amber' | 'red';

export type StudentPosition = {
  userId: string;
  hashedKey: string;
  position: number; // 0 = onboarded (no responses), 1-50 = tile number, 51 = submitted
  status: 'onboarded' | 'in_progress' | 'submitted';
  lastActivity: string; // ISO timestamp
  staleDurationMin: number;
  staleLevel: StaleLevel;
  tabSwitches: number;
};

export type TileData = {
  tileNumber: number;
  students: StudentPosition[];
  activeCount: number;
  staleCount: number;
  totalCount: number;
};

export type QuestLogItem = {
  userId: string;
  hashedKey: string;
  position: number;
  staleDurationMin: number;
  staleLevel: StaleLevel;
  tabSwitches: number;
};

export type GameboardStatusResponse = {
  tiles: Record<number, TileData>;
  onboarded: StudentPosition[];
  submitted: StudentPosition[];
  questLog: QuestLogItem[];
  summary: {
    active: number;
    stale: number;
    submitted: number;
    onboarded: number;
    total: number;
  };
};
