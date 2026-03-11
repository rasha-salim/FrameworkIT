import type { SimRequest, ComponentState, SimComponent } from './types';

interface ShardRouterState extends ComponentState {
  shardCounts: number[];
  totalRouted: number;
}

/**
 * ShardRouter distributes database requests across multiple database shards
 * based on a partition strategy (hash or geographic).
 *
 * Like a LoadBalancer but for database partitioning. Routes requests to
 * different downstream database nodes to distribute data load.
 * Tracks per-shard distribution for balance metrics.
 */
export class ShardRouterComponent implements SimComponent {
  id: string;
  type = 'shard-router';
  state: ShardRouterState;
  private numPartitions: number;
  private partitionStrategy: string;
  private connectedTargets: string[] = [];
  private overheadMs = 2;
  private roundRobinIndex = 0;

  constructor(
    id: string,
    numPartitions: number = 3,
    partitionStrategy: string = 'hash',
  ) {
    this.id = id;
    this.numPartitions = numPartitions;
    this.partitionStrategy = partitionStrategy;
    this.state = {
      id,
      type: 'shard-router',
      activeConnections: 0,
      processedThisTick: 0,
      droppedThisTick: 0,
      totalProcessed: 0,
      totalDropped: 0,
      shardCounts: new Array(numPartitions).fill(0),
      totalRouted: 0,
    };
  }

  process(requests: SimRequest[], _tick: number): SimRequest[] {
    if (this.connectedTargets.length === 0) {
      requests.forEach((r) => { r.dropped = true; });
      this.state.droppedThisTick = requests.length;
      this.state.totalDropped += requests.length;
      return requests;
    }

    for (const req of requests) {
      if (req.dropped) continue;

      req.latencyMs += this.overheadMs;
      const shardIndex = this.selectShard(req);
      const targetIndex = shardIndex % this.connectedTargets.length;
      req.processedBy = this.connectedTargets[targetIndex];
      req.shardKey = `shard-${shardIndex}`;

      // Track per-shard distribution
      if (shardIndex < this.state.shardCounts.length) {
        this.state.shardCounts[shardIndex]++;
      }
      this.state.totalRouted++;
    }

    this.state.processedThisTick = requests.length;
    this.state.totalProcessed += requests.length;
    this.state.activeConnections = requests.length;

    return requests;
  }

  private selectShard(req: SimRequest): number {
    if (this.partitionStrategy === 'geographic' && req.userId !== undefined) {
      // Geographic: partition by userId ranges (simulates region-based routing)
      return req.userId % this.numPartitions;
    }

    // Hash: distribute evenly using request id
    if (this.partitionStrategy === 'hash') {
      return req.id % this.numPartitions;
    }

    // Round-robin fallback
    const idx = this.roundRobinIndex % this.numPartitions;
    this.roundRobinIndex++;
    return idx;
  }

  /**
   * Calculate shard balance as a percentage (100% = perfectly even).
   * Uses coefficient of variation: lower is more balanced.
   */
  getShardBalance(): number {
    if (this.state.totalRouted === 0) return 100;

    const counts = this.state.shardCounts;
    const avg = this.state.totalRouted / counts.length;
    if (avg === 0) return 100;

    const variance = counts.reduce((sum, c) => sum + Math.pow(c - avg, 2), 0) / counts.length;
    const stdDev = Math.sqrt(variance);
    const cv = stdDev / avg;

    // Convert to balance %: cv=0 means 100% balanced, cv=1 means 0%
    return Math.max(0, Math.min(100, (1 - cv) * 100));
  }

  getConnectedTargets(): string[] {
    return this.connectedTargets;
  }

  setConnectedTargets(targets: string[]): void {
    this.connectedTargets = targets;
  }

  reset(): void {
    this.roundRobinIndex = 0;
    this.state.processedThisTick = 0;
    this.state.droppedThisTick = 0;
    this.state.totalProcessed = 0;
    this.state.totalDropped = 0;
    this.state.activeConnections = 0;
    this.state.shardCounts = new Array(this.numPartitions).fill(0);
    this.state.totalRouted = 0;
  }
}
