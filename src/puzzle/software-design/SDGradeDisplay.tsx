import React from 'react';
import { useSDPuzzleStore } from './SDPuzzleStore';
import { useGameStore } from '../../core/GameStore';
import { EventBus } from '../../core/EventBus';
import { ScenarioResultsPanel } from './components/ScenarioResultsPanel';
import type { Grade, SoftwareDesignMetrics } from '../../types';

const GRADE_CONFIG: Record<Grade, { label: string; color: string; message: string }> = {
  none: {
    label: 'Failed',
    color: '#ff4444',
    message: 'Your design did not meet the minimum requirements. Review the violations panel and restructure your code.',
  },
  bronze: {
    label: 'Bronze',
    color: '#cd7f32',
    message: 'Your design is functional. Classes have single responsibilities and changes propagate reasonably well.',
  },
  silver: {
    label: 'Silver',
    color: '#c0c0c0',
    message: 'Strong design. Low coupling, good use of abstractions. Can you achieve full interface segregation?',
  },
  gold: {
    label: 'Gold',
    color: '#ffd700',
    message: 'Excellent. Clean architecture with minimal change propagation and maximum testability.',
  },
};

const SD_METRIC_LABELS: Record<string, string> = {
  class_responsibility_score: 'Responsibility Score',
  coupling_index: 'Coupling Index',
  change_impact_radius: 'Change Impact',
  interface_segregation_score: 'ISP Score',
  dependency_direction: 'Dep. Direction',
  testability_score: 'Testability',
};

function getSDMetricValue(metrics: SoftwareDesignMetrics, metric: string): number {
  switch (metric) {
    case 'class_responsibility_score': return metrics.classResponsibilityScore;
    case 'coupling_index': return metrics.couplingIndex;
    case 'change_impact_radius': return metrics.changeImpactRadius;
    case 'interface_segregation_score': return metrics.interfaceSegregationScore;
    case 'dependency_direction': return metrics.dependencyDirection;
    case 'testability_score': return metrics.testabilityScore;
    default: return 0;
  }
}

function formatSDMetric(metric: string, value: number): string {
  switch (metric) {
    case 'coupling_index': return `${value}`;
    case 'change_impact_radius': return `${value} classes`;
    case 'class_responsibility_score':
    case 'interface_segregation_score':
    case 'dependency_direction':
    case 'testability_score':
      return `${value}%`;
    default: return `${value}`;
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

export const SDGradeDisplay: React.FC = () => {
  const simState = useSDPuzzleStore((s) => s.simulationState);
  const puzzleData = useSDPuzzleStore((s) => s.puzzleData);
  const { finalMetrics, grade, scenarioResults } = simState;
  const config = GRADE_CONFIG[grade];

  const currentChapter = useGameStore((s) => s.currentChapter);

  const handleBackToWorld = () => {
    const passed = grade !== 'none';
    if (passed) {
      useGameStore.getState().saveGrade(currentChapter, grade);
      useGameStore.getState().setPhase('debrief');
    } else {
      useGameStore.getState().setPuzzleCompleted(false);
      useGameStore.getState().setPhase('exploring');
      useGameStore.getState().setCurrentPuzzleId(null);
      EventBus.emit('puzzle:back-to-world');
    }
  };

  const handleTryAgain = () => {
    useGameStore.getState().setPhase('puzzle');
    useSDPuzzleStore.getState().resetSimulation();
    useSDPuzzleStore.getState().resetPuzzle();
  };

  if (!finalMetrics) return null;

  // Build metric rows from objectives
  const bronzeConditions = puzzleData?.objectives?.bronze || [];
  const seenMetrics = new Set<string>();
  const rows: { metric: string; value: number; pass: boolean }[] = [];

  for (const cond of bronzeConditions) {
    if (seenMetrics.has(cond.metric)) continue;
    seenMetrics.add(cond.metric);
    const value = getSDMetricValue(finalMetrics, cond.metric);
    const pass = checkCondition(value, cond.operator, cond.value);
    rows.push({ metric: cond.metric, value, pass });
  }

  const allConditions = [
    ...(puzzleData?.objectives?.silver || []),
    ...(puzzleData?.objectives?.gold || []),
  ];
  for (const cond of allConditions) {
    if (seenMetrics.has(cond.metric)) continue;
    seenMetrics.add(cond.metric);
    const value = getSDMetricValue(finalMetrics, cond.metric);
    const pass = checkCondition(value, cond.operator, cond.value);
    rows.push({ metric: cond.metric, value, pass });
  }

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
        overflowY: 'auto',
      }}
    >
      <div
        style={{
          background: 'linear-gradient(135deg, #0f1428, #141a30)',
          border: `2px solid ${config.color}44`,
          borderRadius: 16,
          padding: '48px 64px',
          maxWidth: 600,
          fontFamily: 'monospace',
          margin: '24px 0',
        }}
      >
        {/* Grade badge */}
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
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
          <div style={{ fontSize: 14, color: '#8899aa', lineHeight: 1.6 }}>
            {config.message}
          </div>
        </div>

        {/* Scenario results */}
        {scenarioResults.length > 0 && (
          <div style={{ marginBottom: 24 }}>
            <ScenarioResultsPanel results={scenarioResults} />
          </div>
        )}

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
          {rows.map((row) => (
            <div key={row.metric} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 12, color: '#667788' }}>
                {SD_METRIC_LABELS[row.metric] || row.metric}
              </span>
              <span style={{ fontSize: 14, fontWeight: 700, color: row.pass ? '#44cc66' : '#ff6644' }}>
                {formatSDMetric(row.metric, row.value)} {row.pass ? '[OK]' : '[X]'}
              </span>
            </div>
          ))}
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
            {grade !== 'none' ? 'Continue to Debrief' : 'Back to World'}
          </button>
        </div>
      </div>
    </div>
  );
};
