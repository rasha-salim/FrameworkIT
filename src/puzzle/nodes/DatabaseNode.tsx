import React from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';

export const DatabaseNode: React.FC<NodeProps> = ({ data }) => {
  const currentConnections = (data.currentConnections as number) || 0;
  const maxConnections = (data.maxConnections as number) || 100;
  const readCount = (data.readCount as number) || 0;
  const writeCount = (data.writeCount as number) || 0;
  const connPercent = maxConnections > 0 ? Math.min(100, (currentConnections / maxConnections) * 100) : 0;
  const active = currentConnections > 0;

  const getConnColor = () => {
    if (connPercent < 75) return '#33cccc';
    if (connPercent < 90) return '#ccaa44';
    return '#ff4444';
  };

  return (
    <div style={{
      background: 'linear-gradient(135deg, #0a2020, #102828)',
      border: '2px solid #33cccc',
      borderRadius: 10,
      padding: '14px 16px',
      minWidth: 190,
      color: '#e0e8f0',
      fontFamily: 'monospace',
      fontSize: 13,
      boxShadow: active
        ? '0 0 16px rgba(51, 204, 204, 0.2), inset 0 1px 0 rgba(255,255,255,0.05)'
        : 'inset 0 1px 0 rgba(255,255,255,0.05)',
      transition: 'box-shadow 0.3s',
    }}>
      <Handle type="target" position={Position.Left}
        style={{ background: '#33cccc', width: 12, height: 12, border: '2px solid #0a2020' }} />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{
            width: 28, height: 28, borderRadius: 6,
            background: 'rgba(51, 204, 204, 0.12)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 12, color: '#66eedd',
          }}>
            {'|=|'}
          </div>
          <div style={{ fontSize: 11, color: '#339999', textTransform: 'uppercase', letterSpacing: 1 }}>
            Primary DB
          </div>
        </div>
        <div style={{
          background: 'rgba(51,204,204,0.12)',
          border: '1px solid #33cccc44',
          color: '#66eedd',
          padding: '2px 8px',
          fontSize: 9,
          borderRadius: 4,
          fontWeight: 700,
        }}>
          R/W
        </div>
      </div>

      {/* Connection bar */}
      <div style={{ background: '#061414', borderRadius: 4, height: 8, overflow: 'hidden', marginBottom: 4, border: '1px solid #102828' }}>
        <div style={{
          width: `${connPercent}%`,
          height: '100%',
          background: `linear-gradient(90deg, ${getConnColor()}88, ${getConnColor()})`,
          transition: 'width 0.15s, background 0.3s',
          borderRadius: 3,
        }} />
      </div>
      <div style={{ fontSize: 10, color: '#8899aa', marginBottom: 10, display: 'flex', justifyContent: 'space-between' }}>
        <span>Connections</span>
        <span style={{ color: getConnColor() }}>{currentConnections}/{maxConnections}</span>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11 }}>
        <span style={{ color: '#cc8855' }}>W: {writeCount}/s</span>
        <span style={{ color: '#33cccc' }}>R: {readCount}/s</span>
      </div>

      <Handle type="source" position={Position.Right}
        style={{ background: '#33cccc', width: 12, height: 12, border: '2px solid #0a2020' }} />
    </div>
  );
};
