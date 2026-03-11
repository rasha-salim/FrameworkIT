import type { SimRequest, ComponentState, SimComponent } from './types';

interface SessionStoreState extends ComponentState {
  sessionHits: number;
  sessionMisses: number;
  currentSessions: number;
  consistentRequests: number;
  totalTracked: number;
}

/**
 * SessionStore simulates a shared session store (like Redis for sessions).
 * Without it, users hitting different servers lose their session state.
 * With it, all servers share session data at the cost of a small lookup latency.
 *
 * Tracks which userId was last seen on which server. If the same userId
 * hits a different server and there's no session store, the session is "lost"
 * (inconsistent). With a session store, lookup adds latency but ensures consistency.
 */
export class SessionStoreComponent implements SimComponent {
  id: string;
  type = 'session-store';
  state: SessionStoreState;
  private maxSessions: number;
  private lookupLatencyMs: number;
  private connectedTargets: string[] = [];
  private sessions: Map<number, string> = new Map(); // userId -> last serverId

  constructor(
    id: string,
    maxSessions: number = 10000,
    lookupLatencyMs: number = 3,
  ) {
    this.id = id;
    this.maxSessions = maxSessions;
    this.lookupLatencyMs = lookupLatencyMs;
    this.state = {
      id,
      type: 'session-store',
      activeConnections: 0,
      processedThisTick: 0,
      droppedThisTick: 0,
      totalProcessed: 0,
      totalDropped: 0,
      sessionHits: 0,
      sessionMisses: 0,
      currentSessions: 0,
      consistentRequests: 0,
      totalTracked: 0,
    };
  }

  process(requests: SimRequest[], _tick: number): SimRequest[] {
    const processed: SimRequest[] = [];

    for (const req of requests) {
      if (req.dropped) {
        processed.push(req);
        continue;
      }

      const userId = req.userId;
      if (userId !== undefined) {
        // Add lookup latency for session resolution
        req.latencyMs += this.lookupLatencyMs;

        if (this.sessions.has(userId)) {
          // Session found - consistent
          this.state.sessionHits++;
          req.sessionConsistent = true;
        } else {
          // New session
          this.state.sessionMisses++;
          if (this.sessions.size >= this.maxSessions) {
            // Evict oldest (simple: delete first entry)
            const firstKey = this.sessions.keys().next().value;
            if (firstKey !== undefined) {
              this.sessions.delete(firstKey);
            }
          }
          this.sessions.set(userId, this.id);
          req.sessionConsistent = true;
        }

        this.state.consistentRequests++;
        this.state.totalTracked++;
      }

      req.processedBy = this.id;
      processed.push(req);
    }

    this.state.currentSessions = this.sessions.size;
    this.state.processedThisTick = requests.filter((r) => !r.dropped).length;
    this.state.totalProcessed += this.state.processedThisTick;
    this.state.activeConnections = this.state.processedThisTick;

    return processed;
  }

  getConnectedTargets(): string[] {
    return this.connectedTargets;
  }

  setConnectedTargets(targets: string[]): void {
    this.connectedTargets = targets;
  }

  reset(): void {
    this.sessions.clear();
    this.state.processedThisTick = 0;
    this.state.droppedThisTick = 0;
    this.state.totalProcessed = 0;
    this.state.totalDropped = 0;
    this.state.activeConnections = 0;
    this.state.sessionHits = 0;
    this.state.sessionMisses = 0;
    this.state.currentSessions = 0;
    this.state.consistentRequests = 0;
    this.state.totalTracked = 0;
  }
}
