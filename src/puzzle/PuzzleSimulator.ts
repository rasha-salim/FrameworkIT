import type { Node, Edge } from '@xyflow/react';
import type { PuzzleData, SimulationMetrics, TickMetrics } from '../types';
import type { SimRequest, SimComponent } from './components/types';
import { ClientPoolComponent } from './components/ClientPool';
import { LoadBalancerComponent } from './components/LoadBalancer';
import { WebServerComponent } from './components/WebServer';
import { CacheComponent } from './components/Cache';
import { DatabaseComponent } from './components/Database';
import { ReadReplicaComponent } from './components/ReadReplica';
import { RateLimiterComponent } from './components/RateLimiter';
import { SessionStoreComponent } from './components/SessionStore';
import { ShardRouterComponent } from './components/ShardRouter';
import { usePuzzleStore } from './PuzzleStore';
import { PuzzleValidator } from './PuzzleValidator';

export class PuzzleSimulator {
  static run(nodes: Node[], edges: Edge[], puzzleData: PuzzleData): void {
    const store = usePuzzleStore.getState();
    const tickRateMs = puzzleData.simulation.tickRateMs;
    const totalTicks = Math.round(
      (puzzleData.simulation.durationSeconds * 1000) / tickRateMs
    );

    // Validate the graph before running
    const validationError = this.validateGraph(nodes, edges);
    if (validationError) {
      // Show error as a failed simulation
      store.startSimulation(1);
      const errorMetrics: SimulationMetrics = {
        throughput: 0,
        p50Latency: 0,
        p95Latency: 0,
        p99Latency: 0,
        errorRate: 100,
        totalRequests: 0,
        successfulRequests: 0,
        droppedRequests: 0,
        totalCost: store.getComponentCost(),
      };
      store.completeSimulation(errorMetrics, 'none');
      return;
    }

    // Build simulation components from the React Flow graph
    const components = this.buildComponents(nodes, edges, tickRateMs);

    store.startSimulation(totalTicks);

    const allLatencies: number[] = [];
    let totalGenerated = 0;
    let totalProcessed = 0;
    let totalDropped = 0;
    let currentTick = 0;

    const runTick = () => {
      if (currentTick >= totalTicks) {
        // Calculate final metrics
        allLatencies.sort((a, b) => a - b);
        const p50 = allLatencies[Math.floor(allLatencies.length * 0.5)] || 0;
        const p95 = allLatencies[Math.floor(allLatencies.length * 0.95)] || 0;
        const p99 = allLatencies[Math.floor(allLatencies.length * 0.99)] || 0;

        // Calculate cache and database metrics from components
        let cacheHitRate: number | undefined;
        let stalenessRate: number | undefined;
        let cacheEvictions: number | undefined;
        let dbReadThroughput: number | undefined;
        let dbWriteThroughput: number | undefined;
        let replicationLag: number | undefined;
        let rejectionRate: number | undefined;
        let sessionConsistency: number | undefined;
        let shardBalance: number | undefined;

        for (const comp of components) {
          if (comp.type === 'cache') {
            const cs = comp.state as typeof comp.state & {
              hitCount: number; missCount: number; staleCount: number; evictionCount: number;
            };
            const totalAccess = cs.hitCount + cs.missCount;
            cacheHitRate = totalAccess > 0 ? (cs.hitCount / totalAccess) * 100 : 0;
            stalenessRate = cs.hitCount > 0 ? (cs.staleCount / cs.hitCount) * 100 : 0;
            cacheEvictions = cs.evictionCount;
          }
          if (comp.type === 'database') {
            const ds = comp.state as typeof comp.state & {
              readCount: number; writeCount: number;
            };
            dbReadThroughput = ds.readCount / puzzleData.simulation.durationSeconds;
            dbWriteThroughput = ds.writeCount / puzzleData.simulation.durationSeconds;
          }
          if (comp.type === 'rate-limiter') {
            const rls = comp.state as typeof comp.state & {
              allowedCount: number; rejectedCount: number;
            };
            const totalRl = rls.allowedCount + rls.rejectedCount;
            rejectionRate = totalRl > 0 ? (rls.rejectedCount / totalRl) * 100 : 0;
          }
          if (comp.type === 'read-replica') {
            const rs = comp.state as typeof comp.state & {
              replicationLagTicks: number;
            };
            replicationLag = rs.replicationLagTicks * puzzleData.simulation.tickRateMs;
          }
          if (comp.type === 'session-store') {
            const ss = comp.state as typeof comp.state & {
              consistentRequests: number; totalTracked: number;
            };
            sessionConsistency = ss.totalTracked > 0
              ? (ss.consistentRequests / ss.totalTracked) * 100
              : 0;
          }
          if (comp.type === 'shard-router') {
            const sr = comp as unknown as { getShardBalance(): number };
            shardBalance = sr.getShardBalance();
          }
        }

        const finalMetrics: SimulationMetrics = {
          throughput: totalProcessed / puzzleData.simulation.durationSeconds,
          p50Latency: p50,
          p95Latency: p95,
          p99Latency: p99,
          errorRate: totalGenerated > 0 ? (totalDropped / totalGenerated) * 100 : 100,
          totalRequests: totalGenerated,
          successfulRequests: totalProcessed,
          droppedRequests: totalDropped,
          totalCost: store.getComponentCost(),
          cacheHitRate,
          stalenessRate,
          cacheEvictions,
          dbReadThroughput,
          dbWriteThroughput,
          replicationLag,
          rejectionRate,
          sessionConsistency,
          shardBalance,
        };

        const grade = PuzzleValidator.evaluate(finalMetrics, puzzleData.objectives);
        store.completeSimulation(finalMetrics, grade);

        // Update node visuals with final state
        this.updateNodeVisuals(components, nodes);

        return;
      }

      // 1. Generate requests from client pools
      let requests: SimRequest[] = [];
      const clientPools = components.filter((c) => c.type === 'client-pool');
      for (const pool of clientPools) {
        requests = requests.concat(pool.process([], currentTick));
      }

      totalGenerated += requests.length;

      // 2. Route through the graph
      const processedRequests = this.routeRequests(
        requests,
        components,
        edges,
        currentTick
      );

      // 3. Collect metrics
      let tickProcessed = 0;
      let tickDropped = 0;
      let tickLatencySum = 0;

      for (const req of processedRequests) {
        if (req.dropped) {
          tickDropped++;
          totalDropped++;
        } else {
          tickProcessed++;
          totalProcessed++;
          allLatencies.push(req.latencyMs);
          tickLatencySum += req.latencyMs;
        }
      }

      const tickMetrics: TickMetrics = {
        tick: currentTick,
        requestsGenerated: requests.length,
        requestsProcessed: tickProcessed,
        requestsDropped: tickDropped,
        avgLatency: tickProcessed > 0 ? tickLatencySum / tickProcessed : 0,
      };

      store.updateTick(currentTick, tickMetrics);

      // Update node data for live visualization
      if (currentTick % 5 === 0) {
        this.updateNodeVisuals(components, nodes);
      }

      currentTick++;
      requestAnimationFrame(runTick);
    };

    requestAnimationFrame(runTick);
  }

  private static validateGraph(nodes: Node[], edges: Edge[]): string | null {
    const hasClientPool = nodes.some((n) => n.type === 'client-pool');
    if (!hasClientPool) return 'No client pool found';

    const clientPool = nodes.find((n) => n.type === 'client-pool');
    if (!clientPool) return 'No client pool found';

    const clientEdges = edges.filter((e) => e.source === clientPool.id);
    if (clientEdges.length === 0) return 'Client pool is not connected to anything';

    return null;
  }

  private static buildComponents(
    nodes: Node[],
    edges: Edge[],
    tickRateMs: number
  ): SimComponent[] {
    const components: SimComponent[] = [];

    for (const node of nodes) {
      let component: SimComponent;

      switch (node.type) {
        case 'client-pool':
          component = new ClientPoolComponent(
            node.id,
            (node.data.requestsPerSecond as number) || 10000,
            tickRateMs,
            (node.data.readWriteRatio as number) ?? 1.0
          );
          break;

        case 'load-balancer':
          component = new LoadBalancerComponent(
            node.id,
            (node.data.algorithm as string) || 'round-robin'
          );
          break;

        case 'web-server':
          component = new WebServerComponent(
            node.id,
            (node.data.maxRPS as number) || 2000,
            (node.data.baseLatencyMs as number) || 20,
            tickRateMs
          );
          break;

        case 'cache': {
          const ttlSeconds = (node.data.ttlSeconds as number) || 30;
          const ttlTicks = Math.round((ttlSeconds * 1000) / tickRateMs);
          component = new CacheComponent(
            node.id,
            (node.data.strategy as string) || 'cache-aside',
            ttlTicks,
            (node.data.maxEntries as number) || 1000,
            ((node.data.evictionPolicy as string) || 'LRU').toLowerCase()
          );
          break;
        }

        case 'database':
          component = new DatabaseComponent(
            node.id,
            (node.data.maxRPS as number) || 800,
            (node.data.readLatencyMs as number) || 50,
            (node.data.writeLatencyMs as number) || 100,
            (node.data.maxConnections as number) || 100,
            tickRateMs
          );
          break;

        case 'read-replica': {
          const lagMs = (node.data.replicationLagMs as number) || 100;
          const lagTicks = Math.round(lagMs / tickRateMs);
          component = new ReadReplicaComponent(
            node.id,
            (node.data.maxRPS as number) || 800,
            (node.data.readLatencyMs as number) || 50,
            lagTicks,
            tickRateMs
          );
          break;
        }

        case 'rate-limiter':
          component = new RateLimiterComponent(
            node.id,
            (node.data.maxTokens as number) || 500,
            (node.data.refillRate as number) || 200,
            tickRateMs
          );
          break;

        case 'session-store':
          component = new SessionStoreComponent(
            node.id,
            (node.data.maxSessions as number) || 10000,
            (node.data.lookupLatencyMs as number) || 3,
          );
          break;

        case 'shard-router':
          component = new ShardRouterComponent(
            node.id,
            (node.data.numPartitions as number) || 3,
            (node.data.partitionStrategy as string) || 'hash',
          );
          break;

        default:
          continue;
      }

      // Set connected targets based on edges
      const outEdges = edges.filter((e) => e.source === node.id);
      component.setConnectedTargets(outEdges.map((e) => e.target));

      components.push(component);
    }

    return components;
  }

  private static routeRequests(
    requests: SimRequest[],
    components: SimComponent[],
    edges: Edge[],
    tick: number
  ): SimRequest[] {
    const componentMap = new Map<string, SimComponent>();
    components.forEach((c) => componentMap.set(c.id, c));

    // Find where client pool connects to
    const clientPools = components.filter((c) => c.type === 'client-pool');
    let allResults: SimRequest[] = [];

    for (const pool of clientPools) {
      const targets = pool.getConnectedTargets();

      if (targets.length === 0) {
        // No connections: all requests dropped
        requests.forEach((r) => { r.dropped = true; });
        allResults = allResults.concat(requests);
        continue;
      }

      // Route requests to first-hop targets
      for (const targetId of targets) {
        const target = componentMap.get(targetId);
        if (!target) {
          requests.forEach((r) => { r.dropped = true; });
          allResults = allResults.concat(requests);
          continue;
        }

        const results = this.processComponent(target, requests, tick, componentMap, edges);
        allResults = allResults.concat(results);
      }
    }

    return allResults;
  }

  private static processComponent(
    component: SimComponent,
    requests: SimRequest[],
    tick: number,
    componentMap: Map<string, SimComponent>,
    edges: Edge[]
  ): SimRequest[] {
    if (component.type === 'load-balancer') {
      // LB distributes to its connected servers
      const processed = component.process(requests, tick);

      // Group by target server
      const serverBuckets = new Map<string, SimRequest[]>();
      for (const req of processed) {
        if (req.processedBy && req.processedBy !== component.id) {
          if (!serverBuckets.has(req.processedBy)) {
            serverBuckets.set(req.processedBy, []);
          }
          serverBuckets.get(req.processedBy)!.push(req);
        }
      }

      let results: SimRequest[] = [];

      // Process at each downstream component (recursively)
      for (const [targetId, targetRequests] of serverBuckets) {
        const target = componentMap.get(targetId);
        if (target) {
          const targetResults = this.processComponent(target, targetRequests, tick, componentMap, edges);
          results = results.concat(targetResults);
        } else {
          targetRequests.forEach((r) => { r.dropped = true; });
          results = results.concat(targetRequests);
        }
      }

      // Handle requests that weren't assigned to a server
      const unassigned = processed.filter(
        (r) => !r.processedBy || r.processedBy === component.id
      );
      if (unassigned.length > 0) {
        unassigned.forEach((r) => { r.dropped = true; });
        results = results.concat(unassigned);
      }

      return results;
    }

    if (component.type === 'cache') {
      const processed = component.process(requests, tick);

      // Requests that were cache hits (processedBy = cache id) are done
      // Requests that were cache misses (processedBy is null) need to go downstream
      const hits = processed.filter((r) => r.cached && r.processedBy === component.id);
      const misses = processed.filter((r) => !r.cached || r.processedBy !== component.id);

      let results = [...hits];

      if (misses.length > 0) {
        // Route misses to connected downstream components
        const downstreamTargets = component.getConnectedTargets();
        if (downstreamTargets.length > 0) {
          for (const targetId of downstreamTargets) {
            const target = componentMap.get(targetId);
            if (target) {
              const downstream = this.processComponent(target, misses, tick, componentMap, edges);
              results = results.concat(downstream);
            } else {
              misses.forEach((r) => { r.dropped = true; });
              results = results.concat(misses);
            }
          }
        } else {
          // No downstream: misses are dropped
          misses.forEach((r) => { r.dropped = true; });
          results = results.concat(misses);
        }
      }

      return results;
    }

    if (component.type === 'rate-limiter') {
      const processed = component.process(requests, tick);

      // Split: allowed requests go downstream, rejected are done (already marked dropped)
      const allowed = processed.filter((r) => !r.dropped);
      const rejected = processed.filter((r) => r.dropped);

      let results = [...rejected];

      if (allowed.length > 0) {
        const downstreamTargets = component.getConnectedTargets();
        if (downstreamTargets.length > 0) {
          for (const targetId of downstreamTargets) {
            const target = componentMap.get(targetId);
            if (target) {
              const downstream = this.processComponent(target, allowed, tick, componentMap, edges);
              results = results.concat(downstream);
            } else {
              allowed.forEach((r) => { r.dropped = true; });
              results = results.concat(allowed);
            }
          }
        } else {
          allowed.forEach((r) => { r.dropped = true; });
          results = results.concat(allowed);
        }
      }

      return results;
    }

    if (component.type === 'session-store') {
      // Pipeline: process all requests (adds latency, tracks sessions), then forward downstream
      const processed = component.process(requests, tick);
      const forwarded = processed.filter((r) => !r.dropped);
      const dropped = processed.filter((r) => r.dropped);

      let results = [...dropped];

      if (forwarded.length > 0) {
        const downstreamTargets = component.getConnectedTargets();
        if (downstreamTargets.length > 0) {
          for (const targetId of downstreamTargets) {
            const target = componentMap.get(targetId);
            if (target) {
              const downstream = this.processComponent(target, forwarded, tick, componentMap, edges);
              results = results.concat(downstream);
            } else {
              forwarded.forEach((r) => { r.dropped = true; });
              results = results.concat(forwarded);
            }
          }
        } else {
          forwarded.forEach((r) => { r.dropped = true; });
          results = results.concat(forwarded);
        }
      }

      return results;
    }

    if (component.type === 'shard-router') {
      // Distributes to downstream shards (like load balancer pattern)
      const processed = component.process(requests, tick);

      // Group by target shard
      const shardBuckets = new Map<string, SimRequest[]>();
      for (const req of processed) {
        if (req.processedBy && req.processedBy !== component.id) {
          if (!shardBuckets.has(req.processedBy)) {
            shardBuckets.set(req.processedBy, []);
          }
          shardBuckets.get(req.processedBy)!.push(req);
        }
      }

      let results: SimRequest[] = [];

      for (const [targetId, targetRequests] of shardBuckets) {
        const target = componentMap.get(targetId);
        if (target) {
          const targetResults = this.processComponent(target, targetRequests, tick, componentMap, edges);
          results = results.concat(targetResults);
        } else {
          targetRequests.forEach((r) => { r.dropped = true; });
          results = results.concat(targetRequests);
        }
      }

      // Handle unassigned requests
      const unassigned = processed.filter(
        (r) => !r.processedBy || r.processedBy === component.id
      );
      if (unassigned.length > 0) {
        unassigned.forEach((r) => { r.dropped = true; });
        results = results.concat(unassigned);
      }

      return results;
    }

    if (component.type === 'web-server' || component.type === 'database' || component.type === 'read-replica') {
      const processed = component.process(requests, tick);

      // Check if this component has downstream connections
      const downstreamTargets = component.getConnectedTargets();
      if (downstreamTargets.length > 0) {
        // Route non-dropped requests downstream
        const forwarded = processed.filter((r) => !r.dropped);
        const dropped = processed.filter((r) => r.dropped);

        let results = [...dropped];

        for (const targetId of downstreamTargets) {
          const target = componentMap.get(targetId);
          if (target) {
            const downstream = this.processComponent(target, forwarded, tick, componentMap, edges);
            results = results.concat(downstream);
          } else {
            forwarded.forEach((r) => { r.dropped = true; });
            results = results.concat(forwarded);
          }
        }

        return results;
      }

      return processed;
    }

    // Unknown component type - pass through
    return component.process(requests, tick);
  }

  private static updateNodeVisuals(components: SimComponent[], nodes: Node[]): void {
    const store = usePuzzleStore.getState();
    const updated = nodes.map((node) => {
      const comp = components.find((c) => c.id === node.id);
      if (!comp) return node;

      const extraData: Record<string, unknown> = {
        currentLoad: comp.state.processedThisTick * 10, // Scale to per-second
      };

      // Cache-specific visuals
      if (comp.type === 'cache') {
        const cacheState = comp.state as typeof comp.state & {
          hitCount: number; missCount: number; staleCount: number;
          evictionCount: number; currentEntries: number;
        };
        const totalAccess = cacheState.hitCount + cacheState.missCount;
        extraData.hitRate = totalAccess > 0 ? (cacheState.hitCount / totalAccess) * 100 : 0;
        extraData.currentEntries = cacheState.currentEntries;
      }

      // Database-specific visuals
      if (comp.type === 'database') {
        const dbState = comp.state as typeof comp.state & {
          readCount: number; writeCount: number; currentConnections: number;
        };
        extraData.readCount = dbState.readCount;
        extraData.writeCount = dbState.writeCount;
        extraData.currentConnections = dbState.currentConnections;
      }

      // Rate limiter-specific visuals
      if (comp.type === 'rate-limiter') {
        const rlState = comp.state as typeof comp.state & {
          allowedCount: number; rejectedCount: number; currentTokens: number;
        };
        const totalRl = rlState.allowedCount + rlState.rejectedCount;
        extraData.rejectRate = totalRl > 0 ? (rlState.rejectedCount / totalRl) * 100 : 0;
        extraData.currentTokens = rlState.currentTokens;
      }

      // Session store-specific visuals
      if (comp.type === 'session-store') {
        const ssState = comp.state as typeof comp.state & {
          sessionHits: number; sessionMisses: number;
          currentSessions: number; consistentRequests: number; totalTracked: number;
        };
        extraData.currentSessions = ssState.currentSessions;
        extraData.consistencyRate = ssState.totalTracked > 0
          ? (ssState.consistentRequests / ssState.totalTracked) * 100
          : 0;
      }

      // Shard router-specific visuals
      if (comp.type === 'shard-router') {
        const srComp = comp as unknown as { getShardBalance(): number; state: { totalRouted: number } };
        extraData.shardBalance = srComp.getShardBalance();
        extraData.totalRouted = srComp.state.totalRouted;
      }

      // Read replica-specific visuals
      if (comp.type === 'read-replica') {
        const replicaState = comp.state as typeof comp.state & {
          replicationLagTicks: number; staleReadsServed: number;
        };
        extraData.replicationLagMs = replicaState.replicationLagTicks * 100;
      }

      return {
        ...node,
        data: {
          ...node.data,
          ...extraData,
        },
      };
    });

    store.setNodes(updated);
  }
}
