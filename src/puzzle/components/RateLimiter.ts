import type { SimRequest, ComponentState, SimComponent } from './types';

interface RateLimiterState extends ComponentState {
  allowedCount: number;
  rejectedCount: number;
  currentTokens: number;
}

export class RateLimiterComponent implements SimComponent {
  id: string;
  type = 'rate-limiter';
  state: RateLimiterState;
  private maxTokens: number;
  private refillRate: number;
  private tokensPerTick: number;
  private connectedTargets: string[] = [];

  constructor(
    id: string,
    maxTokens: number = 500,
    refillRate: number = 200,
    tickRateMs: number = 100
  ) {
    this.id = id;
    this.maxTokens = maxTokens;
    this.refillRate = refillRate;
    this.tokensPerTick = (refillRate * tickRateMs) / 1000;
    this.state = {
      id,
      type: 'rate-limiter',
      activeConnections: 0,
      processedThisTick: 0,
      droppedThisTick: 0,
      totalProcessed: 0,
      totalDropped: 0,
      allowedCount: 0,
      rejectedCount: 0,
      currentTokens: maxTokens,
    };
  }

  process(requests: SimRequest[], _tick: number): SimRequest[] {
    // Refill tokens
    this.state.currentTokens = Math.min(
      this.maxTokens,
      this.state.currentTokens + this.tokensPerTick
    );

    const processed: SimRequest[] = [];
    let allowed = 0;
    let rejected = 0;

    for (const req of requests) {
      if (req.dropped) {
        processed.push(req);
        continue;
      }

      if (this.state.currentTokens >= 1) {
        // Allow: consume a token, add 1ms overhead
        this.state.currentTokens -= 1;
        req.latencyMs += 1;
        req.processedBy = this.id;
        allowed++;
      } else {
        // Reject: mark as rate limited and dropped
        req.rateLimited = true;
        req.dropped = true;
        rejected++;
      }

      processed.push(req);
    }

    this.state.processedThisTick = allowed;
    this.state.droppedThisTick = rejected;
    this.state.totalProcessed += allowed;
    this.state.totalDropped += rejected;
    this.state.allowedCount += allowed;
    this.state.rejectedCount += rejected;
    this.state.activeConnections = allowed;

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
    this.state.allowedCount = 0;
    this.state.rejectedCount = 0;
    this.state.currentTokens = this.maxTokens;
  }
}
