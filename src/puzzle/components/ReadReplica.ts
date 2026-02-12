import type { SimRequest, ComponentState, SimComponent } from './types';

interface ReadReplicaState extends ComponentState {
  replicationLagTicks: number;
  staleReadsServed: number;
}

export class ReadReplicaComponent implements SimComponent {
  id: string;
  type = 'read-replica';
  state: ReadReplicaState;
  private maxPerTick: number;
  private readLatencyMs: number;
  private replicationLagTicks: number;
  private connectedTargets: string[] = [];

  constructor(
    id: string,
    maxRPS: number = 800,
    readLatencyMs: number = 50,
    replicationLagTicks: number = 10,
    tickRateMs: number = 100
  ) {
    this.id = id;
    this.maxPerTick = Math.round(maxRPS * (tickRateMs / 1000));
    this.readLatencyMs = readLatencyMs;
    this.replicationLagTicks = replicationLagTicks;
    this.state = {
      id,
      type: 'read-replica',
      activeConnections: 0,
      processedThisTick: 0,
      droppedThisTick: 0,
      totalProcessed: 0,
      totalDropped: 0,
      replicationLagTicks,
      staleReadsServed: 0,
    };
  }

  process(requests: SimRequest[], _tick: number): SimRequest[] {
    const processed: SimRequest[] = [];
    let processedCount = 0;
    let droppedCount = 0;

    for (const req of requests) {
      if (req.dropped) {
        processed.push(req);
        continue;
      }

      // Read replicas reject write requests
      if (req.requestType === 'write') {
        req.dropped = true;
        droppedCount++;
        processed.push(req);
        continue;
      }

      if (processedCount < this.maxPerTick) {
        const loadFactor = processedCount / this.maxPerTick;
        req.latencyMs += this.readLatencyMs * (1 + loadFactor * 2);
        req.processedBy = this.id;

        // Staleness probability based on replication lag
        if (Math.random() < (this.replicationLagTicks / 100)) {
          req.stale = true;
          this.state.staleReadsServed++;
        }

        processedCount++;
      } else {
        req.dropped = true;
        droppedCount++;
      }

      processed.push(req);
    }

    this.state.processedThisTick = processedCount;
    this.state.droppedThisTick = droppedCount;
    this.state.totalProcessed += processedCount;
    this.state.totalDropped += droppedCount;
    this.state.activeConnections = processedCount;

    return processed;
  }

  getConnectedTargets(): string[] {
    return this.connectedTargets;
  }

  setConnectedTargets(targets: string[]): void {
    this.connectedTargets = targets;
  }

  reset(): void {
    this.state.processedThisTick = 0;
    this.state.droppedThisTick = 0;
    this.state.totalProcessed = 0;
    this.state.totalDropped = 0;
    this.state.activeConnections = 0;
    this.state.staleReadsServed = 0;
  }
}
