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
    if (loadPercent < 60) return 'Healthy';
    if (loadPercent < 85) return 'Moderate';
    return 'Overloaded';
  };

  return (
    <div
      style={{
        background: 'linear-gradient(135deg, #1a2a1e, #1e3520)',
        border: `2px solid ${getHealthColor()}`,
        borderRadius: 8,
        padding: 16,
        minWidth: 160,
        color: '#e0e8f0',
        fontFamily: 'monospace',
        fontSize: 13,
      }}
    >
      <Handle
        type="target"
        position={Position.Left}
        style={{ background: '#44cc66', width: 10, height: 10 }}
      />

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 8,
        }}
      >
        <div
          style={{
            fontSize: 11,
            color: '#669966',
            textTransform: 'uppercase',
            letterSpacing: 1,
          }}
        >
          Web Server
        </div>
        <div
          style={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            background: getHealthColor(),
          }}
        />
      </div>

      <div style={{ fontSize: 14, fontWeight: 700, color: '#88cc88', marginBottom: 8 }}>
        {maxRPS.toLocaleString()} req/s max
      </div>

      {/* Load bar */}
      <div
        style={{
          background: '#0a150e',
          borderRadius: 3,
          height: 8,
          overflow: 'hidden',
          marginBottom: 4,
        }}
      >
        <div
          style={{
            width: `${loadPercent}%`,
            height: '100%',
            background: getHealthColor(),
            transition: 'width 0.1s, background 0.3s',
            borderRadius: 3,
          }}
        />
      </div>

      <div style={{ fontSize: 10, color: '#8899aa', display: 'flex', justifyContent: 'space-between' }}>
        <span>{currentLoad > 0 ? `${currentLoad.toLocaleString()}/s` : 'Idle'}</span>
        <span style={{ color: getHealthColor() }}>{currentLoad > 0 ? getHealthLabel() : ''}</span>
      </div>

      <Handle
        type="source"
        position={Position.Right}
        style={{ background: '#44cc66', width: 10, height: 10 }}
      />
    </div>
  );
};
