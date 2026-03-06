// Grade display component - shows simulation results
import React from 'react';
import { usePuzzleStore } from './PuzzleStore';
import { useGameStore } from '../core/GameStore';
import { EventBus } from '../core/EventBus';

import type { Grade, SimulationMetrics } from '../types';

const GRADE_CONFIG: Record<Grade, { label: string; color: string; message: string }> = {
  none: {
    label: 'Failed',
    color: '#ff4444',
    message: 'Your system did not meet the minimum requirements. Check the metrics below and try a different approach.',
  },
  bronze: {
    label: 'Bronze',
    color: '#cd7f32',
    message: 'System is functional! All requests are being handled, but there is room for improvement.',
  },
  silver: {
    label: 'Silver',
    color: '#c0c0c0',
    message: 'Excellent performance! Low latency and high throughput. Can you optimize the cost?',
  },
  gold: {
    label: 'Gold',
    color: '#ffd700',
    message: 'Perfect score! Optimal performance with minimal cost. You are a system design master.',
  },
};

const METRIC_LABELS: Record<string, string> = {
  throughput: 'Throughput',
  error_rate: 'Error Rate',
  p99_latency: 'P99 Latency',
  p50_latency: 'P50 Latency',
  p95_latency: 'P95 Latency',
  total_cost: 'Total Cost',
  cache_hit_rate: 'Cache Hit Rate',
  staleness_rate: 'Stale Rate',
  cache_evictions: 'Evictions',
  db_read_throughput: 'DB Reads',
  db_write_throughput: 'DB Writes',
  replication_lag: 'Rep. Lag',
};

function getMetricValue(metrics: SimulationMetrics, metric: string): number {
  switch (metric) {
    case 'throughput': return metrics.throughput;
    case 'p50_latency': return metrics.p50Latency;
    case 'p95_latency': return metrics.p95Latency;
    case 'p99_latency': return metrics.p99Latency;
    case 'error_rate': return metrics.errorRate;
    case 'total_cost': return metrics.totalCost;
    case 'cache_hit_rate': return metrics.cacheHitRate ?? 0;
    case 'staleness_rate': return metrics.stalenessRate ?? 0;
    case 'cache_evictions': return metrics.cacheEvictions ?? 0;
    case 'db_read_throughput': return metrics.dbReadThroughput ?? 0;
    case 'db_write_throughput': return metrics.dbWriteThroughput ?? 0;
    case 'replication_lag': return metrics.replicationLag ?? 0;
    default: return 0;
  }
}

function formatMetric(metric: string, value: number): string {
  switch (metric) {
    case 'throughput':
    case 'db_read_throughput':
    case 'db_write_throughput':
      return `${Math.round(value).toLocaleString()}/s`;
    case 'error_rate':
    case 'cache_hit_rate':
    case 'staleness_rate':
      return `${value.toFixed(1)}%`;
    case 'p50_latency':
    case 'p95_latency':
    case 'p99_latency':
    case 'replication_lag':
      return `${Math.round(value)}ms`;
    case 'total_cost':
      return `$${value}`;
    case 'cache_evictions':
      return `${Math.round(value)}`;
    default:
      return `${value}`;
  }
}

function checkCondition(value: number, operator: string, target: number): boolean {
  switch (operator) {
    case '>=': return value >= target;
    case '<=': return value <= target;
    case '>': return value > target;
    case '<': return value < target;
    case '==': return value === target;
    default: return false;
  }
}

export const GradeDisplay: React.FC = () => {
  const simState = usePuzzleStore((s) => s.simulationState);
  const puzzleData = usePuzzleStore((s) => s.puzzleData);
  const { finalMetrics, grade } = simState;
  const config = GRADE_CONFIG[grade];

  const handleBackToWorld = () => {
    const passed = grade !== 'none';

    if (passed) {
      // Go to debrief step before returning to world
      useGameStore.getState().setPhase('debrief');
    } else {
      // Failed -- go straight back to exploring
      useGameStore.getState().setPuzzleCompleted(false);
      useGameStore.getState().setPhase('exploring');
      useGameStore.getState().setCurrentPuzzleId(null);
      EventBus.emit('puzzle:back-to-world');
    }
  };

  const handleTryAgain = () => {
    useGameStore.getState().setPhase('puzzle');
    usePuzzleStore.getState().resetSimulation();
    usePuzzleStore.getState().resetPuzzle();
  };

  if (!finalMetrics) return null;

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background: 'rgba(5, 8, 18, 0.92)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        pointerEvents: 'auto',
      }}
    >
      <div
        style={{
          background: 'linear-gradient(135deg, #0f1428, #141a30)',
          border: `2px solid ${config.color}44`,
          borderRadius: 16,
          padding: '48px 64px',
          maxWidth: 520,
          textAlign: 'center',
          fontFamily: 'monospace',
        }}
      >
        {/* Grade badge */}
        <div
          style={{
            fontSize: 48,
            fontWeight: 900,
            color: config.color,
            textShadow: `0 0 30px ${config.color}44`,
            marginBottom: 8,
          }}
        >
          {config.label}
        </div>

        <div style={{ fontSize: 14, color: '#8899aa', marginBottom: 32, lineHeight: 1.6 }}>
          {config.message}
        </div>

        {/* Metrics breakdown - driven by puzzle objectives */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '16px',
            marginBottom: 32,
            textAlign: 'left',
          }}
        >
          {(() => {
            // Collect unique metrics from bronze objectives (the minimum required)
            const bronzeConditions = puzzleData?.objectives?.bronze || [];
            const seenMetrics = new Set<string>();
            const rows: { metric: string; value: number; pass: boolean }[] = [];

            for (const cond of bronzeConditions) {
              if (seenMetrics.has(cond.metric)) continue;
              seenMetrics.add(cond.metric);
              const value = getMetricValue(finalMetrics, cond.metric);
              const pass = checkCondition(value, cond.operator, cond.value);
              rows.push({ metric: cond.metric, value, pass });
            }

            // Also add metrics from silver/gold that aren't in bronze
            const allConditions = [
              ...(puzzleData?.objectives?.silver || []),
              ...(puzzleData?.objectives?.gold || []),
            ];
            for (const cond of allConditions) {
              if (seenMetrics.has(cond.metric)) continue;
              seenMetrics.add(cond.metric);
              const value = getMetricValue(finalMetrics, cond.metric);
              const pass = checkCondition(value, cond.operator, cond.value);
              rows.push({ metric: cond.metric, value, pass });
            }

            // Fallback: if no puzzle data, show basic metrics
            if (rows.length === 0) {
              return (
                <>
                  <MetricRow label="Throughput" value={`${Math.round(finalMetrics.throughput).toLocaleString()}/s`} pass={finalMetrics.throughput > 0} />
                  <MetricRow label="Error Rate" value={`${finalMetrics.errorRate.toFixed(1)}%`} pass={finalMetrics.errorRate <= 5} />
                  <MetricRow label="P99 Latency" value={`${Math.round(finalMetrics.p99Latency)}ms`} pass={finalMetrics.p99Latency <= 200} />
                  <MetricRow label="Total Cost" value={`$${finalMetrics.totalCost}`} pass={finalMetrics.totalCost <= 800} />
                </>
              );
            }

            return rows.map((row) => (
              <MetricRow
                key={row.metric}
                label={METRIC_LABELS[row.metric] || row.metric}
                value={formatMetric(row.metric, row.value)}
                pass={row.pass}
              />
            ));
          })()}
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 16, justifyContent: 'center' }}>
          <button
            onClick={handleTryAgain}
            style={{
              background: 'rgba(68, 136, 255, 0.15)',
              border: '1px solid #4488ff44',
              color: '#88bbff',
              padding: '12px 28px',
              borderRadius: 8,
              cursor: 'pointer',
              fontSize: 14,
              fontFamily: 'monospace',
            }}
          >
            Try Again
          </button>

          <button
            onClick={handleBackToWorld}
            style={{
              background: 'linear-gradient(135deg, #2255aa, #3366cc)',
              border: '1px solid #4488ff66',
              color: '#ffffff',
              padding: '12px 28px',
              borderRadius: 8,
              cursor: 'pointer',
              fontSize: 14,
              fontWeight: 700,
              fontFamily: 'monospace',
            }}
          >
            Back to World
          </button>
        </div>
      </div>
    </div>
  );
};

const MetricRow: React.FC<{ label: string; value: string; pass: boolean }> = ({
  label,
  value,
  pass,
}) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
    <span style={{ fontSize: 12, color: '#667788' }}>{label}</span>
    <span style={{ fontSize: 14, fontWeight: 700, color: pass ? '#44cc66' : '#ff6644' }}>
      {value} {pass ? '[OK]' : '[X]'}
    </span>
  </div>
);
