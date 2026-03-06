import React from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';

export const WebServerNode: React.FC<NodeProps> = ({ data }) => {
  const maxRPS = (data.maxRPS as number) || 2000;
  const currentLoad = (data.currentLoad as number) || 0;
  const loadPercent = maxRPS > 0 ? Math.min(100, (currentLoad / maxRPS) * 100) : 0;

  const getHealthColor = () => {
    if (loadPercent < 60) return '#44cc66';
    if (loadPercent < 85) return '#ccaa44';
    return '#ff4444';
  };

  const getHealthLabel = () => {
    if (currentLoad === 0) return 'Idle';
    if (loadPercent < 60) return 'Healthy';
    if (loadPercent < 85) return 'Moderate';
    return 'Overloaded';
  };

  return (
    <div
      style={{
        background: 'linear-gradient(135deg, #142218, #1a2e1e)',
        border: `2px solid ${getHealthColor()}`,
        borderRadius: 10,
        padding: '14px 16px',
        minWidth: 175,
        color: '#e0e8f0',
        fontFamily: 'monospace',
        fontSize: 13,
        boxShadow: currentLoad > 0
          ? `0 0 16px ${getHealthColor()}33, inset 0 1px 0 rgba(255,255,255,0.05)`
          : 'inset 0 1px 0 rgba(255,255,255,0.05)',
        transition: 'box-shadow 0.3s, border-color 0.3s',
      }}
    >
      <Handle
        type="target"
        position={Position.Left}
        style={{ background: '#44cc66', width: 12, height: 12, border: '2px solid #142218' }}
      />

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{
            width: 28, height: 28, borderRadius: 6,
            background: 'rgba(68, 204, 102, 0.12)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 13, color: '#88cc88',
          }}>
            {'[ ]'}
          </div>
          <div style={{ fontSize: 11, color: '#669966', textTransform: 'uppercase', letterSpacing: 1 }}>
            Web Server
          </div>
        </div>
        <div style={{
          width: 10, height: 10, borderRadius: '50%',
          background: getHealthColor(),
          boxShadow: `0 0 6px ${getHealthColor()}88`,
          transition: 'background 0.3s, box-shadow 0.3s',
        }} />
      </div>

      <div style={{ fontSize: 14, fontWeight: 700, color: '#88cc88', marginBottom: 10 }}>
        {maxRPS.toLocaleString()} <span style={{ fontSize: 11, fontWeight: 400, color: '#669966' }}>req/s max</span>
      </div>

      {/* Load bar */}
      <div style={{
        background: '#0a150e',
        borderRadius: 4,
        height: 8,
        overflow: 'hidden',
        marginBottom: 6,
        border: '1px solid #1a2e1e',
      }}>
        <div style={{
          width: `${loadPercent}%`,
          height: '100%',
          background: `linear-gradient(90deg, ${getHealthColor()}, ${getHealthColor()}cc)`,
          transition: 'width 0.15s, background 0.3s',
          borderRadius: 3,
        }} />
      </div>

      <div style={{ fontSize: 10, color: '#8899aa', display: 'flex', justifyContent: 'space-between' }}>
        <span>{currentLoad > 0 ? `${currentLoad.toLocaleString()}/s` : '--'}</span>
        <span style={{ color: getHealthColor() }}>{getHealthLabel()}</span>
      </div>

      <Handle
        type="source"
        position={Position.Right}
        style={{ background: '#44cc66', width: 12, height: 12, border: '2px solid #142218' }}
      />
    </div>
  );
};
