import React from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';

export const ReadReplicaNode: React.FC<NodeProps> = ({ data }) => {
  const maxRPS = (data.maxRPS as number) || 0;
  const currentLoad = (data.currentLoad as number) || 0;
  const replicationLagMs = (data.replicationLagMs as number) || 0;
  const loadPercent = maxRPS > 0 ? Math.min(100, (currentLoad / maxRPS) * 100) : 0;
  const active = currentLoad > 0;

  const getLagColor = () => {
    if (replicationLagMs < 100) return '#44cc66';
    if (replicationLagMs < 500) return '#ccaa44';
    return '#ff4444';
  };

  const getLoadColor = () => {
    if (loadPercent < 60) return '#66aacc';
    if (loadPercent < 85) return '#ccaa44';
    return '#ff4444';
  };

  return (
    <div style={{
      background: 'linear-gradient(135deg, #0a1620, #10202e)',
      border: '2px dashed #66aacc',
      borderRadius: 10,
      padding: '14px 16px',
      minWidth: 190,
      color: '#e0e8f0',
      fontFamily: 'monospace',
      fontSize: 13,
      boxShadow: active
        ? '0 0 16px rgba(102, 170, 204, 0.2), inset 0 1px 0 rgba(255,255,255,0.05)'
        : 'inset 0 1px 0 rgba(255,255,255,0.05)',
      transition: 'box-shadow 0.3s',
    }}>
      <Handle type="target" position={Position.Left}
        style={{ background: '#66aacc', width: 12, height: 12, border: '2px solid #0a1620' }} />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{
            width: 28, height: 28, borderRadius: 6,
            background: 'rgba(102, 170, 204, 0.12)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 12, color: '#88ccee',
          }}>
            {'|~|'}
          </div>
          <div style={{ fontSize: 11, color: '#4488aa', textTransform: 'uppercase', letterSpacing: 1 }}>
            Read Replica
          </div>
        </div>
        <div style={{
          background: 'rgba(102,170,204,0.12)',
          border: '1px solid #66aacc44',
          color: '#88ccee',
          padding: '2px 8px',
          fontSize: 9,
          borderRadius: 4,
          fontWeight: 700,
        }}>
          R/O
        </div>
      </div>

      <div style={{ fontSize: 10, color: getLagColor(), marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
        <div style={{ width: 6, height: 6, borderRadius: '50%', background: getLagColor(), boxShadow: `0 0 4px ${getLagColor()}88` }} />
        Lag: {replicationLagMs}ms
      </div>

      {/* Load bar */}
      <div style={{ background: '#061014', borderRadius: 4, height: 8, overflow: 'hidden', marginBottom: 4, border: '1px solid #10202e' }}>
        <div style={{
          width: `${loadPercent}%`,
          height: '100%',
          background: `linear-gradient(90deg, ${getLoadColor()}88, ${getLoadColor()})`,
          transition: 'width 0.15s, background 0.3s',
          borderRadius: 3,
        }} />
      </div>
      <div style={{ fontSize: 10, color: '#8899aa', display: 'flex', justifyContent: 'space-between' }}>
        <span>{currentLoad > 0 ? `${currentLoad.toLocaleString()}/s` : 'Idle'}</span>
        <span>{maxRPS > 0 ? `max ${maxRPS.toLocaleString()}/s` : ''}</span>
      </div>
    </div>
  );
};
