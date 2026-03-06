import React from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';

export const ClientPoolNode: React.FC<NodeProps> = ({ data }) => {
  const rps = (data.requestsPerSecond as number) || 10000;
  const currentLoad = (data.currentLoad as number) || 0;
  const active = currentLoad > 0;

  return (
    <div
      style={{
        background: 'linear-gradient(135deg, #141e33, #1a2844)',
        border: '2px solid #4488ff',
        borderRadius: 10,
        padding: '14px 16px',
        minWidth: 170,
        color: '#e0e8f0',
        fontFamily: 'monospace',
        fontSize: 13,
        boxShadow: active
          ? '0 0 20px rgba(68, 136, 255, 0.25), inset 0 1px 0 rgba(255,255,255,0.05)'
          : 'inset 0 1px 0 rgba(255,255,255,0.05)',
        transition: 'box-shadow 0.3s',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        <div style={{
          width: 28, height: 28, borderRadius: 6,
          background: 'rgba(68, 136, 255, 0.15)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 14, color: '#88bbff',
        }}>
          {'>>'}
        </div>
        <div>
          <div style={{ fontSize: 11, color: '#6699cc', textTransform: 'uppercase', letterSpacing: 1 }}>
            Client Pool
          </div>
        </div>
      </div>

      <div style={{ fontSize: 20, fontWeight: 700, color: '#88bbff', marginBottom: 4 }}>
        {rps.toLocaleString()} <span style={{ fontSize: 12, fontWeight: 400, color: '#6699cc' }}>req/s</span>
      </div>

      {active && (
        <div style={{ fontSize: 11, color: '#8899aa', display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#4488ff', animation: 'pulse 1s infinite' }} />
          Sending: {currentLoad.toLocaleString()}/s
        </div>
      )}

      <Handle
        type="source"
        position={Position.Right}
        style={{ background: '#4488ff', width: 12, height: 12, border: '2px solid #1a2844' }}
      />
    </div>
  );
};
