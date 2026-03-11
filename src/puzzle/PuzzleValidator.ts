import type { SimulationMetrics, ObjectiveCondition, Grade } from '../types';

export class PuzzleValidator {
  static evaluate(
    metrics: SimulationMetrics,
    objectives: { bronze: ObjectiveCondition[]; silver: ObjectiveCondition[]; gold: ObjectiveCondition[] }
  ): Grade {
    // Check from highest to lowest
    if (this.meetsObjectives(metrics, objectives.gold) &&
        this.meetsObjectives(metrics, objectives.silver) &&
        this.meetsObjectives(metrics, objectives.bronze)) {
      return 'gold';
    }

    if (this.meetsObjectives(metrics, objectives.silver) &&
        this.meetsObjectives(metrics, objectives.bronze)) {
      return 'silver';
    }

    if (this.meetsObjectives(metrics, objectives.bronze)) {
      return 'bronze';
    }

    return 'none';
  }

  private static meetsObjectives(
    metrics: SimulationMetrics,
    conditions: ObjectiveCondition[]
  ): boolean {
    return conditions.every((cond) => this.checkCondition(metrics, cond));
  }

  private static checkCondition(
    metrics: SimulationMetrics,
    condition: ObjectiveCondition
  ): boolean {
    const value = this.getMetricValue(metrics, condition.metric);

    switch (condition.operator) {
      case '>=':
        return value >= condition.value;
      case '<=':
        return value <= condition.value;
      case '>':
        return value > condition.value;
      case '<':
        return value < condition.value;
      case '==':
        return value === condition.value;
      default:
        return false;
    }
  }

  private static getMetricValue(metrics: SimulationMetrics, metric: string): number {
    switch (metric) {
      case 'throughput':
        return metrics.throughput;
      case 'p50_latency':
        return metrics.p50Latency;
      case 'p95_latency':
        return metrics.p95Latency;
      case 'p99_latency':
        return metrics.p99Latency;
      case 'error_rate':
        return metrics.errorRate;
      case 'total_cost':
        return metrics.totalCost;
      case 'cache_hit_rate':
        return metrics.cacheHitRate ?? 0;
      case 'staleness_rate':
        return metrics.stalenessRate ?? 0;
      case 'cache_evictions':
        return metrics.cacheEvictions ?? 0;
      case 'db_read_throughput':
        return metrics.dbReadThroughput ?? 0;
      case 'db_write_throughput':
        return metrics.dbWriteThroughput ?? 0;
      case 'replication_lag':
        return metrics.replicationLag ?? 0;
      case 'rejection_rate':
        return metrics.rejectionRate ?? 0;
      case 'session_consistency':
        return metrics.sessionConsistency ?? 0;
      case 'shard_balance':
        return metrics.shardBalance ?? 0;
      default:
        return 0;
    }
  }
}
