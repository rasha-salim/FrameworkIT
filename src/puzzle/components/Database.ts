import type { SimRequest, ComponentState, SimComponent } from './types';

interface DatabaseState extends ComponentState {
  readCount: number;
  writeCount: number;
  currentConnections: number;
}

export class DatabaseComponent implements SimComponent {
  id: string;
  type = 'database';
  state: DatabaseState;
  private maxPerTick: number;
  private readLatencyMs: number;
  private writeLatencyMs: number;
  private maxConnections: number;
  private connectedTargets: string[] = [];

  constructor(
    id: string,
    maxRPS: number = 800,
    readLatencyMs: number = 50,
    writeLatencyMs: number = 100,
    maxConnections: number = 100,
    tickRateMs: number = 100
  ) {
    this.id = id;
    this.maxPerTick = Math.round(maxRPS * (tickRateMs / 1000));
    this.readLatencyMs = readLatencyMs;
    this.writeLatencyMs = writeLatencyMs;
    this.maxConnections = maxConnections;
    this.state = {
      id,
      type: 'database',
      activeConnections: 0,
      processedThisTick: 0,
      droppedThisTick: 0,
      totalProcessed: 0,
      totalDropped: 0,
      readCount: 0,
      writeCount: 0,
      currentConnections: 0,
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

      if (processedCount < this.maxPerTick) {
        const loadFactor = processedCount / this.maxPerTick;
        const latencyMultiplier = 1 + (loadFactor * 3);

        if (req.requestType === 'write') {
          req.latencyMs += this.writeLatencyMs * latencyMultiplier;
          this.state.writeCount++;
        } else {
          req.latencyMs += this.readLatencyMs * latencyMultiplier;
          this.state.readCount++;
        }
        req.processedBy = this.id;
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
    this.state.currentConnections = processedCount;

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
    this.state.readCount = 0;
    this.state.writeCount = 0;
    this.state.currentConnections = 0;
  }
}
