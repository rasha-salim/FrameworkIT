import React from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { usePuzzleStore } from '../PuzzleStore';

export const RateLimiterNode: React.FC<NodeProps> = ({ id, data }) => {
  const maxTokens = (data.maxTokens as number) || 500;
  const refillRate = (data.refillRate as number) || 200;
  const currentTokens = (data.currentTokens as number) || 0;
  const rejectRate = (data.rejectRate as number) || 0;
  const running = usePuzzleStore((s) => s.simulationState.running);
  const setNodes = usePuzzleStore((s) => s.setNodes);
  const nodes = usePuzzleStore((s) => s.nodes);

  const handleMaxTokensChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Math.max(10, Math.min(5000, parseInt(e.target.value) || 10));
    const updated = nodes.map((n) =>
      n.id === id ? { ...n, data: { ...n.data, maxTokens: val } } : n
    );
    setNodes(updated);
  };

  const handleRefillRateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Math.max(10, Math.min(5000, parseInt(e.target.value) || 10));
    const updated = nodes.map((n) =>
      n.id === id ? { ...n, data: { ...n.data, refillRate: val } } : n
    );
    setNodes(updated);
  };

  const getRejectColor = () => {
    if (rejectRate <= 30) return '#44cc66';
    if (rejectRate <= 60) return '#ccaa44';
    return '#ff6644';
  };

  const tokenFillPct = maxTokens > 0 ? Math.min(100, (currentTokens / maxTokens) * 100) : 0;

  const inputStyle: React.CSSProperties = {
    width: 60,
    background: '#1a0a0e',
    color: '#ff8899',
    border: '1px solid #662233',
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
      background: 'linear-gradient(135deg, #240a10, #301015)',
      border: '2px solid #ff4466',
      borderRadius: 10,
      padding: '14px 16px',
      minWidth: 195,
      color: '#e0e8f0',
      fontFamily: 'monospace',
      fontSize: 13,
      boxShadow: rejectRate > 0
        ? '0 0 16px rgba(255, 68, 102, 0.2), inset 0 1px 0 rgba(255,255,255,0.05)'
        : 'inset 0 1px 0 rgba(255,255,255,0.05)',
      transition: 'box-shadow 0.3s',
    }}>
      <Handle type="target" position={Position.Left}
        style={{ background: '#ff4466', width: 12, height: 12, border: '2px solid #240a10' }} />

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        <div style={{
          width: 28, height: 28, borderRadius: 6,
          background: 'rgba(255, 68, 102, 0.12)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 13, color: '#ff8899',
        }}>
          {'>|'}
        </div>
        <div style={{ fontSize: 11, color: '#cc3355', textTransform: 'uppercase', letterSpacing: 1 }}>
          Rate Limiter
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 11, color: '#8899aa', marginBottom: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{ color: '#cc3355' }}>Tokens</span>
          <input
            type="number"
            value={maxTokens}
            onChange={handleMaxTokensChange}
            disabled={running}
            min={10}
            max={5000}
            style={inputStyle}
          />
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 11, color: '#8899aa', marginBottom: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{ color: '#cc3355' }}>Refill/s</span>
          <input
            type="number"
            value={refillRate}
            onChange={handleRefillRateChange}
            disabled={running}
            min={10}
            max={5000}
            style={inputStyle}
          />
        </div>
      </div>

      {/* Token fill bar */}
      <div style={{ background: '#1a0a0e', borderRadius: 4, height: 8, overflow: 'hidden', marginBottom: 4, border: '1px solid #301015' }}>
        <div style={{
          width: `${tokenFillPct}%`,
          height: '100%',
          background: `linear-gradient(90deg, #ff446688, #44cc66)`,
          transition: 'width 0.15s',
          borderRadius: 3,
        }} />
      </div>
      <div style={{ fontSize: 10, color: '#8899aa', marginBottom: 6, display: 'flex', justifyContent: 'space-between' }}>
        <span>Bucket</span>
        <span style={{ color: tokenFillPct > 20 ? '#44cc66' : '#ff6644', fontWeight: 700 }}>
          {Math.round(currentTokens)}/{maxTokens}
        </span>
      </div>

      {/* Reject rate */}
      <div style={{ fontSize: 10, color: '#8899aa', display: 'flex', justifyContent: 'space-between' }}>
        <span>Reject Rate</span>
        <span style={{ color: getRejectColor(), fontWeight: 700 }}>{Math.round(rejectRate)}%</span>
      </div>

      <Handle type="source" position={Position.Right}
        style={{ background: '#ff4466', width: 12, height: 12, border: '2px solid #240a10' }} />
    </div>
  );
};
