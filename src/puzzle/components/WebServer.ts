import type { SimRequest, ComponentState, SimComponent } from './types';

export class WebServerComponent implements SimComponent {
  id: string;
  type = 'web-server';
  state: ComponentState;
  private maxRPS: number;
  private maxPerTick: number;
  private baseLatencyMs: number;
  private connectedTargets: string[] = [];

  constructor(id: string, maxRPS: number, baseLatencyMs: number, tickRateMs: number) {
    this.id = id;
    this.maxRPS = maxRPS;
    this.maxPerTick = Math.round(maxRPS * (tickRateMs / 1000));
    this.baseLatencyMs = baseLatencyMs;
    this.state = {
      id,
      type: 'web-server',
      activeConnections: 0,
      processedThisTick: 0,
      droppedThisTick: 0,
      totalProcessed: 0,
      totalDropped: 0,
    };
  }

  process(requests: SimRequest[], _tick: number): SimRequest[] {
    const processed: SimRequest[] = [];
    let count = 0;

    for (const req of requests) {
      if (req.dropped) {
        processed.push(req);
        continue;
      }

      if (count < this.maxPerTick) {
        // Process successfully
        const loadFactor = count / this.maxPerTick;
        // Latency increases as load increases
        const latencyMultiplier = 1 + loadFactor * 2;
        req.latencyMs += this.baseLatencyMs * latencyMultiplier;
        req.processedBy = this.id;
        count++;
      } else {
        // Over capacity: drop
        req.dropped = true;
        req.latencyMs += this.baseLatencyMs * 5; // Timeout
      }

      processed.push(req);
    }

    const dropped = requests.filter((r) => r.dropped).length;
    this.state.processedThisTick = count;
    this.state.droppedThisTick = dropped;
    this.state.totalProcessed += count;
    this.state.totalDropped += dropped;
    this.state.activeConnections = count;

    return processed;
  }

  getMaxRPS(): number {
    return this.maxRPS;
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
  }
}
