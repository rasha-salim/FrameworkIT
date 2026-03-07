export type GamePhase = 'track-select' | 'exploring' | 'dialogue' | 'puzzle' | 'results' | 'debrief';

export type TrackId = 'system-design' | 'software-design';

export interface DebriefQuestion {
  id: string;
  question: string;
  hint?: string;
}

export interface ChapterMeta {
  id: string;
  title: string;
  description: string;
  npc: string;
  puzzles: string[];
}

export interface DialogueNode {
  id: string;
  speaker: string;
  text: string;
  choices?: DialogueChoice[];
  next?: string;
  action?: string;
}

export interface DialogueChoice {
  text: string;
  next: string;
  action?: string;
}

export interface DialogueData {
  id: string;
  nodes: Record<string, DialogueNode>;
  startNode: string;
}

export interface ComponentConfig {
  maxRPS?: number;
  baseLatencyMs?: number;
  requestsPerSecond?: number;
  distribution?: string;
  algorithm?: string;
  // Cache config
  strategy?: string;
  ttlSeconds?: number;
  maxEntries?: number;
  evictionPolicy?: string;
  // Database config
  readLatencyMs?: number;
  writeLatencyMs?: number;
  maxConnections?: number;
  // Read ratio
  readWriteRatio?: number;
  // Replication
  replicationLagMs?: number;
  // Rate limiter config
  rateLimitStrategy?: string;
  maxTokens?: number;
  refillRate?: number;
}

export interface FixedComponent {
  id: string;
  type: string;
  position: { x: number; y: number };
  config: ComponentConfig;
}

export interface AvailableComponent {
  type: string;
  maxCount: number;
  costPerUnit: number;
}

export interface ObjectiveCondition {
  metric: string;
  operator: string;
  value: number;
}

export interface PuzzleData {
  id: string;
  title: string;
  chapter: string;
  difficulty: number;
  briefing: {
    npc: string;
    text: string;
  };
  fixedComponents: FixedComponent[];
  availableComponents: AvailableComponent[];
  objectives: {
    bronze: ObjectiveCondition[];
    silver: ObjectiveCondition[];
    gold: ObjectiveCondition[];
  };
  simulation: {
    durationSeconds: number;
    tickRateMs: number;
  };
  debrief?: DebriefQuestion[];
}

export interface SimulationMetrics {
  throughput: number;
  p50Latency: number;
  p95Latency: number;
  p99Latency: number;
  errorRate: number;
  totalRequests: number;
  successfulRequests: number;
  droppedRequests: number;
  totalCost: number;
  // Ch 2: Caching metrics
  cacheHitRate?: number;
  stalenessRate?: number;
  cacheEvictions?: number;
  // Ch 3: Database metrics
  dbReadThroughput?: number;
  dbWriteThroughput?: number;
  replicationLag?: number;
  // Ch 4: Rate limiting metrics
  rejectionRate?: number;
}

export interface TickMetrics {
  tick: number;
  requestsGenerated: number;
  requestsProcessed: number;
  requestsDropped: number;
  avgLatency: number;
}

export type Grade = 'none' | 'bronze' | 'silver' | 'gold';

export interface SimulationState {
  running: boolean;
  completed: boolean;
  currentTick: number;
  totalTicks: number;
  tickMetrics: TickMetrics[];
  finalMetrics: SimulationMetrics | null;
  grade: Grade;
}
