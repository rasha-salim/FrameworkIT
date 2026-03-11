import React from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { usePuzzleStore } from '../PuzzleStore';

export const SessionStoreNode: React.FC<NodeProps> = ({ id, data }) => {
  const maxSessions = (data.maxSessions as number) || 10000;
  const lookupLatencyMs = (data.lookupLatencyMs as number) || 3;
  const currentSessions = (data.currentSessions as number) || 0;
  const consistencyRate = (data.consistencyRate as number) || 0;
  const running = usePuzzleStore((s) => s.simulationState.running);
  const setNodes = usePuzzleStore((s) => s.setNodes);
  const nodes = usePuzzleStore((s) => s.nodes);

  const handleMaxSessionsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Math.max(100, Math.min(50000, parseInt(e.target.value) || 100));
    const updated = nodes.map((n) =>
      n.id === id ? { ...n, data: { ...n.data, maxSessions: val } } : n
    );
    setNodes(updated);
  };

  const handleLatencyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Math.max(1, Math.min(50, parseInt(e.target.value) || 1));
    const updated = nodes.map((n) =>
      n.id === id ? { ...n, data: { ...n.data, lookupLatencyMs: val } } : n
    );
    setNodes(updated);
  };

  const sessionFillPct = maxSessions > 0 ? Math.min(100, (currentSessions / maxSessions) * 100) : 0;

  const inputStyle: React.CSSProperties = {
    width: 60,
    background: '#0a1a18',
    color: '#66ddbb',
    border: '1px solid #225544',
    borderRadius: 4,
    padding: '3px 5px',
    fontSize: 11,
    fontFamily: 'monospace',
    textAlign: 'center',
    cursor: running ? 'not-allowed' : 'text',
    opacity: running ? 0.5 : 1,
  };

  return (
    <div style={{
      background: 'linear-gradient(135deg, #0a1a18, #102420)',
      border: '2px solid #22ccaa',
      borderRadius: 10,
      padding: '14px 16px',
      minWidth: 195,
      color: '#e0e8f0',
      fontFamily: 'monospace',
      fontSize: 13,
      boxShadow: currentSessions > 0
        ? '0 0 16px rgba(34, 204, 170, 0.2), inset 0 1px 0 rgba(255,255,255,0.05)'
        : 'inset 0 1px 0 rgba(255,255,255,0.05)',
      transition: 'box-shadow 0.3s',
    }}>
      <Handle type="target" position={Position.Left}
        style={{ background: '#22ccaa', width: 12, height: 12, border: '2px solid #0a1a18' }} />

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        <div style={{
          width: 28, height: 28, borderRadius: 6,
          background: 'rgba(34, 204, 170, 0.12)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 14, color: '#44ddbb',
        }}>
          S
        </div>
        <div style={{ fontSize: 11, color: '#22aa88', textTransform: 'uppercase', letterSpacing: 1 }}>
          Session Store
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 11, color: '#8899aa', marginBottom: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{ color: '#22aa88' }}>Max</span>
          <input
            type="number"
            value={maxSessions}
            onChange={handleMaxSessionsChange}
            disabled={running}
            min={100}
            max={50000}
            style={inputStyle}
          />
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 11, color: '#8899aa', marginBottom: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{ color: '#22aa88' }}>Latency</span>
          <input
            type="number"
            value={lookupLatencyMs}
            onChange={handleLatencyChange}
            disabled={running}
            min={1}
            max={50}
            style={inputStyle}
          />
          <span style={{ color: '#556666', fontSize: 10 }}>ms</span>
        </div>
      </div>

      {/* Session fill bar */}
      <div style={{ background: '#0a1a18', borderRadius: 4, height: 8, overflow: 'hidden', marginBottom: 4, border: '1px solid #1a3330' }}>
        <div style={{
          width: `${sessionFillPct}%`,
          height: '100%',
          background: 'linear-gradient(90deg, #22ccaa88, #44ddbb)',
          transition: 'width 0.15s',
          borderRadius: 3,
        }} />
      </div>
      <div style={{ fontSize: 10, color: '#8899aa', marginBottom: 6, display: 'flex', justifyContent: 'space-between' }}>
        <span>Sessions</span>
        <span style={{ color: sessionFillPct > 80 ? '#ccaa44' : '#44ddbb', fontWeight: 700 }}>
          {currentSessions.toLocaleString()}/{maxSessions.toLocaleString()}
        </span>
      </div>

      {/* Consistency rate */}
      <div style={{ fontSize: 10, color: '#8899aa', display: 'flex', justifyContent: 'space-between' }}>
        <span>Consistency</span>
        <span style={{ color: consistencyRate >= 90 ? '#44cc66' : '#ccaa44', fontWeight: 700 }}>
          {Math.round(consistencyRate)}%
        </span>
      </div>

      <Handle type="source" position={Position.Right}
        style={{ background: '#22ccaa', width: 12, height: 12, border: '2px solid #0a1a18' }} />
    </div>
  );
};
