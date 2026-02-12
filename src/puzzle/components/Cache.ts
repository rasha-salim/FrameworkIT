import type { SimRequest, ComponentState, SimComponent } from './types';

interface CacheEntry {
  insertedAtTick: number;
  accessCount: number;
  lastAccessTick: number;
}

interface CacheState extends ComponentState {
  hitCount: number;
  missCount: number;
  staleCount: number;
  evictionCount: number;
  currentEntries: number;
}

export class CacheComponent implements SimComponent {
  id: string;
  type = 'cache';
  state: CacheState;
  private strategy: string;
  private ttlTicks: number;
  private maxEntries: number;
  private evictionPolicy: string;
  private cache: Map<number, CacheEntry> = new Map();
  private connectedTargets: string[] = [];

  constructor(
    id: string,
    strategy: string = 'cache-aside',
    ttlTicks: number = 100,
    maxEntries: number = 1000,
    evictionPolicy: string = 'lru'
  ) {
    this.id = id;
    this.strategy = strategy;
    this.ttlTicks = ttlTicks;
    this.maxEntries = maxEntries;
    this.evictionPolicy = evictionPolicy;
    this.state = {
      id,
      type: 'cache',
      activeConnections: 0,
      processedThisTick: 0,
      droppedThisTick: 0,
      totalProcessed: 0,
      totalDropped: 0,
      hitCount: 0,
      missCount: 0,
      staleCount: 0,
      evictionCount: 0,
      currentEntries: 0,
    };
  }

  process(requests: SimRequest[], tick: number): SimRequest[] {
    const processed: SimRequest[] = [];
    let processedCount = 0;

    for (const req of requests) {
      if (req.dropped) {
        processed.push(req);
        continue;
      }

      if (req.cacheKey === undefined) {
        req.cacheKey = req.id % (this.maxEntries * 2);
      }

      const key = req.cacheKey;

      // Write requests: invalidate or update cache
      if (req.requestType === 'write') {
        if (this.strategy === 'cache-aside') {
          this.cache.delete(key);
          req.cached = false;
        } else if (this.strategy === 'write-through') {
          this.evictIfNeeded();
          this.cache.set(key, {
            insertedAtTick: tick,
            accessCount: 1,
            lastAccessTick: tick,
          });
        }
        processed.push(req);
        processedCount++;
        continue;
      }

      // Read requests: check cache
      const entry = this.cache.get(key);

      if (entry) {
        if (tick - entry.insertedAtTick < this.ttlTicks) {
          // Fresh cache hit
          req.cached = true;
          req.latencyMs += 3;
          req.processedBy = this.id;
          entry.accessCount++;
          entry.lastAccessTick = tick;
          this.state.hitCount++;
          processedCount++;
        } else {
          // Stale cache hit
          req.cached = true;
          req.stale = true;
          req.latencyMs += 3;
          req.processedBy = this.id;
          entry.accessCount++;
          entry.lastAccessTick = tick;
          this.state.hitCount++;
          this.state.staleCount++;
          processedCount++;
        }
      } else {
        // Cache miss - populate cache for next time
        this.state.missCount++;
        this.evictIfNeeded();
        this.cache.set(key, {
          insertedAtTick: tick,
          accessCount: 0,
          lastAccessTick: tick,
        });
      }

      processed.push(req);
    }

    this.state.currentEntries = this.cache.size;
    this.state.processedThisTick = processedCount;
    this.state.totalProcessed += processedCount;
    this.state.activeConnections = processedCount;

    return processed;
  }

  private evictIfNeeded(): void {
    if (this.cache.size < this.maxEntries) return;

    let evictKey: number | null = null;

    if (this.evictionPolicy === 'lru') {
      let oldestAccess = Infinity;
      for (const [key, entry] of this.cache) {
        if (entry.lastAccessTick < oldestAccess) {
          oldestAccess = entry.lastAccessTick;
          evictKey = key;
        }
      }
    } else if (this.evictionPolicy === 'lfu') {
      let lowestCount = Infinity;
      for (const [key, entry] of this.cache) {
        if (entry.accessCount < lowestCount) {
          lowestCount = entry.accessCount;
          evictKey = key;
        }
      }
    } else if (this.evictionPolicy === 'fifo') {
      let oldestInsert = Infinity;
      for (const [key, entry] of this.cache) {
        if (entry.insertedAtTick < oldestInsert) {
          oldestInsert = entry.insertedAtTick;
          evictKey = key;
        }
      }
    }

    if (evictKey !== null) {
      this.cache.delete(evictKey);
      this.state.evictionCount++;
    }
  }

  getConnectedTargets(): string[] {
    return this.connectedTargets;
  }

  setConnectedTargets(targets: string[]): void {
    this.connectedTargets = targets;
  }

  reset(): void {
    this.cache.clear();
    this.state.processedThisTick = 0;
    this.state.droppedThisTick = 0;
    this.state.totalProcessed = 0;
    this.state.totalDropped = 0;
    this.state.activeConnections = 0;
    this.state.hitCount = 0;
    this.state.missCount = 0;
    this.state.staleCount = 0;
    this.state.evictionCount = 0;
    this.state.currentEntries = 0;
  }
}
