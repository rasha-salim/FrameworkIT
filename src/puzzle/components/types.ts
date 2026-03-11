export interface SimRequest {
  id: number;
  sourceId: string;
  createdAtTick: number;
  latencyMs: number;
  dropped: boolean;
  processedBy: string | null;
  // Ch 2-3: cache and database behavior
  requestType?: 'read' | 'write';
  cached?: boolean;
  stale?: boolean;
  cacheKey?: number;
  // Ch 4: rate limiting
  rateLimited?: boolean;
  // Ch 5: sessions
  userId?: number;
  sessionConsistent?: boolean;
  // Ch 6: partitioning
  shardKey?: string;
}

export interface ComponentState {
  id: string;
  type: string;
  activeConnections: number;
  processedThisTick: number;
  droppedThisTick: number;
  totalProcessed: number;
  totalDropped: number;
}

export interface SimComponent {
  id: string;
  type: string;
  state: ComponentState;
  process(requests: SimRequest[], tick: number): SimRequest[];
  getConnectedTargets(): string[];
  setConnectedTargets(targets: string[]): void;
  reset(): void;
}
