import type { SimRequest, ComponentState, SimComponent } from './types';

export class ClientPoolComponent implements SimComponent {
  id: string;
  type = 'client-pool';
  state: ComponentState;
  private requestsPerSecond: number;
  private tickRateMs: number;
  private readWriteRatio: number;
  private connectedTargets: string[] = [];
  private requestCounter = 0;

  constructor(id: string, requestsPerSecond: number, tickRateMs: number, readWriteRatio: number = 1.0) {
    this.id = id;
    this.requestsPerSecond = requestsPerSecond;
    this.tickRateMs = tickRateMs;
    this.readWriteRatio = readWriteRatio;
    this.state = {
      id,
      type: 'client-pool',
      activeConnections: 0,
      processedThisTick: 0,
      droppedThisTick: 0,
      totalProcessed: 0,
      totalDropped: 0,
    };
  }

  process(_requests: SimRequest[], tick: number): SimRequest[] {
    const requestsPerTick = Math.round(
      this.requestsPerSecond * (this.tickRateMs / 1000)
    );

    const generated: SimRequest[] = [];
    for (let i = 0; i < requestsPerTick; i++) {
      const isRead = Math.random() < this.readWriteRatio;
      generated.push({
        id: this.requestCounter++,
        sourceId: this.id,
        createdAtTick: tick,
        latencyMs: 0,
        dropped: false,
        processedBy: null,
        requestType: isRead ? 'read' : 'write',
      });
    }

    this.state.processedThisTick = requestsPerTick;
    this.state.totalProcessed += requestsPerTick;

    return generated;
  }

  getConnectedTargets(): string[] {
    return this.connectedTargets;
  }

  setConnectedTargets(targets: string[]): void {
    this.connectedTargets = targets;
  }

  reset(): void {
    this.requestCounter = 0;
    this.state.processedThisTick = 0;
    this.state.droppedThisTick = 0;
    this.state.totalProcessed = 0;
    this.state.totalDropped = 0;
    this.state.activeConnections = 0;
  }
}
