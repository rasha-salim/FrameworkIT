import React from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';

export const ReadReplicaNode: React.FC<NodeProps> = ({ data }) => {
  const maxRPS = (data.maxRPS as number) || 0;
  const currentLoad = (data.currentLoad as number) || 0;
  const replicationLagMs = (data.replicationLagMs as number) || 0;
  const loadPercent = maxRPS > 0 ? Math.min(100, (currentLoad / maxRPS) * 100) : 0;

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
      background: 'linear-gradient(135deg, #0a1a24, #122430)',
      border: '2px dashed #66aacc',
      borderRadius: 8,
      padding: 16,
      minWidth: 180,
      color: '#e0e8f0',
      fontFamily: 'monospace',
      fontSize: 13,
    }}>
      <Handle type="target" position={Position.Left} style={{ background: '#66aacc', width: 10, height: 10 }} />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <div style={{ fontSize: 11, color: '#4488aa', textTransform: 'uppercase', letterSpacing: 1 }}>
          Read Replica
        </div>
        <div style={{
          background: 'rgba(102,170,204,0.15)',
          border: '1px solid #66aacc44',
          color: '#88ccee',
          padding: '2px 6px',
          fontSize: 9,
          borderRadius: 3,
          fontFamily: 'monospace',
        }}>
          R/O
        </div>
      </div>

      <div style={{ fontSize: 10, color: getLagColor(), marginBottom: 8 }}>
        Lag: {replicationLagMs}ms
      </div>

      <div style={{ background: '#0a150e', borderRadius: 3, height: 8, overflow: 'hidden', marginBottom: 4 }}>
        <div style={{
          width: `${loadPercent}%`,
          height: '100%',
          background: getLoadColor(),
          transition: 'width 0.1s, background 0.3s',
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
