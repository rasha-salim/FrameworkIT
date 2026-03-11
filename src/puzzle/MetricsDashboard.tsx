import React from 'react';
import { usePuzzleStore } from './PuzzleStore';

export const MetricsDashboard: React.FC = () => {
  const simState = usePuzzleStore((s) => s.simulationState);
  const { running, completed, currentTick, totalTicks, tickMetrics, finalMetrics } = simState;

  if (!running && !completed) {
    return (
      <div
        style={{
          background: 'rgba(15, 20, 35, 0.95)',
          borderTop: '1px solid #2a3355',
          padding: '12px 24px',
          height: 80,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#445566',
          fontSize: 13,
          fontFamily: 'monospace',
        }}
      >
        Deploy your system to see live metrics
      </div>
    );
  }

  const latestTick = tickMetrics[tickMetrics.length - 1];
  const progress = totalTicks > 0 ? (currentTick / totalTicks) * 100 : 0;

  const throughput = finalMetrics?.throughput ?? (latestTick?.requestsProcessed ?? 0) * 10;
  const errorRate = finalMetrics?.errorRate ?? (latestTick ? (latestTick.requestsDropped / Math.max(1, latestTick.requestsGenerated)) * 100 : 0);
  const p99 = finalMetrics?.p99Latency ?? (latestTick?.avgLatency ?? 0);

  const cacheHitRate = finalMetrics?.cacheHitRate;
  const stalenessRate = finalMetrics?.stalenessRate;
  const dbReadThroughput = finalMetrics?.dbReadThroughput;
  const replicationLag = finalMetrics?.replicationLag;
  const rejectionRate = finalMetrics?.rejectionRate;
  const sessionConsistency = finalMetrics?.sessionConsistency;
  const shardBalance = finalMetrics?.shardBalance;

  const metrics: { label: string; value: string; color: string }[] = [
    {
      label: 'Throughput',
      value: `${Math.round(throughput).toLocaleString()}/s`,
      color: throughput >= 10000 ? '#44cc66' : '#ccaa44',
    },
    {
      label: 'P99 Latency',
      value: `${Math.round(p99)}ms`,
      color: p99 <= 200 ? '#44cc66' : '#ff6644',
    },
    {
      label: 'Error Rate',
      value: `${errorRate.toFixed(1)}%`,
      color: errorRate <= 5 ? '#44cc66' : '#ff4444',
    },
  ];

  // Add cache metrics if present
  if (cacheHitRate !== undefined) {
    metrics.push({
      label: 'Cache Hit',
      value: `${Math.round(cacheHitRate)}%`,
      color: cacheHitRate >= 70 ? '#44cc66' : cacheHitRate >= 50 ? '#ccaa44' : '#ff6644',
    });
  }
  if (stalenessRate !== undefined && cacheHitRate !== undefined) {
    metrics.push({
      label: 'Stale',
      value: `${stalenessRate.toFixed(1)}%`,
      color: stalenessRate <= 5 ? '#44cc66' : stalenessRate <= 10 ? '#ccaa44' : '#ff4444',
    });
  }

  // Add database metrics if present
  if (dbReadThroughput !== undefined) {
    metrics.push({
      label: 'DB Reads',
      value: `${Math.round(dbReadThroughput).toLocaleString()}/s`,
      color: '#33cccc',
    });
  }
  // Add rejection rate metric if present
  if (rejectionRate !== undefined) {
    metrics.push({
      label: 'Reject Rate',
      value: `${rejectionRate.toFixed(1)}%`,
      color: rejectionRate >= 40 && rejectionRate <= 80 ? '#44cc66' : rejectionRate > 80 ? '#ff4444' : '#ccaa44',
    });
  }

  // Add session consistency metric if present
  if (sessionConsistency !== undefined) {
    metrics.push({
      label: 'Sessions',
      value: `${sessionConsistency.toFixed(1)}%`,
      color: sessionConsistency >= 90 ? '#44cc66' : sessionConsistency >= 70 ? '#ccaa44' : '#ff4444',
    });
  }

  // Add shard balance metric if present
  if (shardBalance !== undefined) {
    metrics.push({
      label: 'Shard Bal.',
      value: `${shardBalance.toFixed(1)}%`,
      color: shardBalance >= 85 ? '#44cc66' : shardBalance >= 60 ? '#ccaa44' : '#ff6644',
    });
  }

  if (replicationLag !== undefined) {
    metrics.push({
      label: 'Rep. Lag',
      value: `${Math.round(replicationLag)}ms`,
      color: replicationLag <= 100 ? '#44cc66' : replicationLag <= 200 ? '#ccaa44' : '#ff4444',
    });
  }

  return (
    <div
      style={{
        background: 'rgba(15, 20, 35, 0.95)',
        borderTop: '1px solid #2a3355',
        padding: '12px 24px',
        height: 80,
      }}
    >
      {/* Progress bar */}
      {running && (
        <div
          style={{
            background: '#1a1a2e',
            borderRadius: 2,
            height: 4,
            marginBottom: 10,
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              width: `${progress}%`,
              height: '100%',
              background: '#4488ff',
              transition: 'width 0.1s',
            }}
          />
        </div>
      )}

      <div style={{ display: 'flex', gap: 48, alignItems: 'center' }}>
        {metrics.map((m) => (
          <div key={m.label} style={{ fontFamily: 'monospace' }}>
            <div style={{ fontSize: 10, color: '#556688', textTransform: 'uppercase', letterSpacing: 1 }}>
              {m.label}
            </div>
            <div style={{ fontSize: 20, fontWeight: 700, color: m.color }}>
              {m.value}
            </div>
          </div>
        ))}

        {running && (
          <div style={{ marginLeft: 'auto', fontSize: 12, color: '#6688aa', fontFamily: 'monospace' }}>
            Simulating... {Math.round(progress)}%
          </div>
        )}
      </div>
    </div>
  );
};
