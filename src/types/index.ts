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
  // Session store config
  maxSessions?: number;
  lookupLatencyMs?: number;
  // Shard router config
  partitionStrategy?: string;
  numPartitions?: number;
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
  // Ch 5: Session metrics
  sessionConsistency?: number;
  // Ch 6: Partitioning metrics
  shardBalance?: number;
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

// ─── Software Design Track Types ───────────────────────────────

export interface SDMethod {
  id: string;
  name: string;
  responsibilityGroup?: string;
}

export interface SDClass {
  id: string;
  name: string;
  methods: SDMethod[];
  dependencies: string[];       // IDs of classes/interfaces this depends on
  implementsInterfaces: string[]; // IDs of interfaces this implements
  responsibilityLabel?: string;
  position: { x: number; y: number };
}

export interface SDInterface {
  id: string;
  name: string;
  methods: Pick<SDMethod, 'id' | 'name'>[];
  position: { x: number; y: number };
}

export interface SDDependency {
  id: string;
  source: string;  // class/interface ID
  target: string;  // class/interface ID
  type: 'depends-on' | 'implements' | 'creates' | 'wraps' | 'delegates-to';
}

export interface ChangeScenario {
  id: string;
  description: string;
  tests: string;  // which SOLID principle(s) it tests
  affectedMethodGroups: string[];  // which responsibility groups are impacted
}

export interface SDPuzzleObjectives {
  bronze: ObjectiveCondition[];
  silver: ObjectiveCondition[];
  gold: ObjectiveCondition[];
}

export interface SDPuzzleData {
  id: string;
  title: string;
  chapter: string;
  difficulty: number;
  type: 'software-design';
  briefing: {
    npc: string;
    text: string;
  };
  initialCodebase: {
    classes: SDClass[];
    interfaces: SDInterface[];
  };
  changeScenarios: ChangeScenario[];
  objectives: SDPuzzleObjectives;
  debrief?: DebriefQuestion[];
  diagnoseChallenge?: {
    description: string;
    badDesignClasses: SDClass[];
    correctAnswer: string;
    explanation: string;
  };
}

export interface SoftwareDesignMetrics {
  classResponsibilityScore: number;
  couplingIndex: number;
  changeImpactRadius: number;
  interfaceSegregationScore: number;
  dependencyDirection: number;
  testabilityScore: number;
}
