import React from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';

export const DatabaseNode: React.FC<NodeProps> = ({ data }) => {
  const currentConnections = (data.currentConnections as number) || 0;
  const maxConnections = (data.maxConnections as number) || 100;
  const readCount = (data.readCount as number) || 0;
  const writeCount = (data.writeCount as number) || 0;
  const connPercent = maxConnections > 0 ? Math.min(100, (currentConnections / maxConnections) * 100) : 0;

  const getConnColor = () => {
    if (connPercent < 75) return '#33cccc';
    if (connPercent < 90) return '#ccaa44';
    return '#ff4444';
  };

  return (
    <div style={{
      background: 'linear-gradient(135deg, #0a2424, #123030)',
      border: '2px solid #33cccc',
      borderRadius: 8,
      padding: 16,
      minWidth: 180,
      color: '#e0e8f0',
      fontFamily: 'monospace',
      fontSize: 13,
    }}>
      <Handle type="target" position={Position.Left} style={{ background: '#33cccc', width: 10, height: 10 }} />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <div style={{ fontSize: 11, color: '#1a6666', textTransform: 'uppercase', letterSpacing: 1 }}>
          Primary DB
        </div>
        <div style={{
          background: 'rgba(51,204,204,0.15)',
          border: '1px solid #33cccc44',
          color: '#66eedd',
          padding: '2px 6px',
          fontSize: 9,
          borderRadius: 3,
          fontFamily: 'monospace',
        }}>
          R/W
        </div>
      </div>

      <div style={{ background: '#0a150e', borderRadius: 3, height: 8, overflow: 'hidden', marginBottom: 4 }}>
        <div style={{
          width: `${connPercent}%`,
          height: '100%',
          background: getConnColor(),
          transition: 'width 0.1s, background 0.3s',
          borderRadius: 3,
        }} />
      </div>
      <div style={{ fontSize: 10, color: '#8899aa', marginBottom: 8 }}>
        Connections: {currentConnections}/{maxConnections}
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11 }}>
        <span style={{ color: '#cc6633' }}>Writes: {writeCount}/s</span>
        <span style={{ color: '#33cccc' }}>Reads: {readCount}/s</span>
      </div>

      <Handle type="source" position={Position.Right} style={{ background: '#33cccc', width: 10, height: 10 }} />
    </div>
  );
};
