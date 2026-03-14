import React from 'react';
import type { ScenarioResult } from '../SDPuzzleStore';

interface ScenarioResultsPanelProps {
  results: ScenarioResult[];
}

export const ScenarioResultsPanel: React.FC<ScenarioResultsPanelProps> = ({ results }) => {
  if (results.length === 0) return null;

  return (
    <div
      style={{
        background: 'rgba(15, 20, 35, 0.95)',
        border: '1px solid #2a3355',
        borderRadius: 8,
        padding: '12px 16px',
        fontFamily: 'monospace',
      }}
    >
      <div style={{ fontSize: 12, fontWeight: 700, color: '#88bbff', marginBottom: 8 }}>
        Change Propagation Results
      </div>
      {results.map((r) => (
        <div
          key={r.scenarioId}
          style={{
            padding: '6px 0',
            borderBottom: '1px solid #1a2040',
          }}
        >
          <div style={{ fontSize: 11, color: '#ccddeeff', marginBottom: 2 }}>
            {r.description}
          </div>
          <div style={{ fontSize: 10, display: 'flex', gap: 12 }}>
            <span style={{ color: r.changeCount <= 2 ? '#44cc66' : r.changeCount <= 3 ? '#ccaa44' : '#ff6644' }}>
              {r.changeCount} class{r.changeCount !== 1 ? 'es' : ''} affected
            </span>
            <span style={{ color: '#556677' }}>
              [{r.classesAffected.join(', ')}]
            </span>
          </div>
        </div>
      ))}
    </div>
  );
};
