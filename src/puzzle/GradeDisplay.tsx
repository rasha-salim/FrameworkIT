// Grade display component - shows simulation results
import React from 'react';
import { usePuzzleStore } from './PuzzleStore';
import { useGameStore } from '../core/GameStore';
import { EventBus } from '../core/EventBus';
import type { Grade } from '../types';

const GRADE_CONFIG: Record<Grade, { label: string; color: string; message: string }> = {
  none: {
    label: 'Failed',
    color: '#ff4444',
    message: 'Your system could not handle the load. Try adding more servers or a load balancer.',
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

export const GradeDisplay: React.FC = () => {
  const simState = usePuzzleStore((s) => s.simulationState);
  const { finalMetrics, grade } = simState;
  const config = GRADE_CONFIG[grade];

  const handleBackToWorld = () => {
    const passed = grade !== 'none';
    useGameStore.getState().setPuzzleCompleted(passed);
    useGameStore.getState().setPhase('exploring');
    useGameStore.getState().setCurrentPuzzleId(null);

    // Only save grade if the player actually passed
    if (passed) {
      const bestGrade = localStorage.getItem('puzzle-best-grade');
      const gradeRank = { none: 0, bronze: 1, silver: 2, gold: 3 };
      if (!bestGrade || gradeRank[grade] > gradeRank[bestGrade as Grade]) {
        localStorage.setItem('puzzle-best-grade', grade);
      }
    }

    EventBus.emit('puzzle:back-to-world');
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

        {/* Metrics breakdown */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '16px',
            marginBottom: 32,
            textAlign: 'left',
          }}
        >
          <MetricRow
            label="Throughput"
            value={`${Math.round(finalMetrics.throughput).toLocaleString()}/s`}
            pass={finalMetrics.throughput >= 10000}
          />
          <MetricRow
            label="Error Rate"
            value={`${finalMetrics.errorRate.toFixed(1)}%`}
            pass={finalMetrics.errorRate <= 5}
          />
          <MetricRow
            label="P99 Latency"
            value={`${Math.round(finalMetrics.p99Latency)}ms`}
            pass={finalMetrics.p99Latency <= 200}
          />
          <MetricRow
            label="Total Cost"
            value={`$${finalMetrics.totalCost}`}
            pass={finalMetrics.totalCost <= 800}
          />
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
