import type { SimRequest, ComponentState, SimComponent } from './types';

export class LoadBalancerComponent implements SimComponent {
  id: string;
  type = 'load-balancer';
  state: ComponentState;
  private algorithm: string;
  private connectedTargets: string[] = [];
  private roundRobinIndex = 0;
  private overheadMs = 2;

  // Track active connections per target for least-connections
  private targetConnections: Map<string, number> = new Map();

  constructor(id: string, algorithm: string = 'round-robin') {
    this.id = id;
    this.algorithm = algorithm;
    this.state = {
      id,
      type: 'load-balancer',
      activeConnections: 0,
      processedThisTick: 0,
      droppedThisTick: 0,
      totalProcessed: 0,
      totalDropped: 0,
    };
  }

  process(requests: SimRequest[], _tick: number): SimRequest[] {
    if (this.connectedTargets.length === 0) {
      // No backends: drop all
      requests.forEach((r) => {
        r.dropped = true;
      });
      this.state.droppedThisTick = requests.length;
      this.state.totalDropped += requests.length;
      return requests;
    }

    const distributed: Map<string, SimRequest[]> = new Map();
    this.connectedTargets.forEach((t) => distributed.set(t, []));

    for (const req of requests) {
      req.latencyMs += this.overheadMs;
      const target = this.selectTarget();
      req.processedBy = target;

      const bucket = distributed.get(target);
      if (bucket) {
        bucket.push(req);
        this.targetConnections.set(
          target,
          (this.targetConnections.get(target) || 0) + 1
        );
      }
    }

    this.state.processedThisTick = requests.length;
    this.state.totalProcessed += requests.length;
    this.state.activeConnections = requests.length;

    return requests;
  }

  private selectTarget(): string {
    if (this.algorithm === 'least-connections') {
      return this.leastConnections();
    }
    return this.roundRobin();
  }

  private roundRobin(): string {
    const target = this.connectedTargets[this.roundRobinIndex % this.connectedTargets.length];
    this.roundRobinIndex++;
    return target;
  }

  private leastConnections(): string {
    let minConn = Infinity;
    let selected = this.connectedTargets[0];

    for (const target of this.connectedTargets) {
      const conn = this.targetConnections.get(target) || 0;
      if (conn < minConn) {
        minConn = conn;
        selected = target;
      }
    }

    return selected;
  }

  getConnectedTargets(): string[] {
    return this.connectedTargets;
  }

  setConnectedTargets(targets: string[]): void {
    this.connectedTargets = targets;
    targets.forEach((t) => {
      if (!this.targetConnections.has(t)) {
        this.targetConnections.set(t, 0);
      }
    });
  }

  setAlgorithm(algo: string): void {
    this.algorithm = algo;
  }

  reset(): void {
    this.roundRobinIndex = 0;
    this.targetConnections.clear();
    this.state.processedThisTick = 0;
    this.state.droppedThisTick = 0;
    this.state.totalProcessed = 0;
    this.state.totalDropped = 0;
    this.state.activeConnections = 0;
  }
}
