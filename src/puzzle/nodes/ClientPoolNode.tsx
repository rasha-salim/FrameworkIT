import React from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';

export const ClientPoolNode: React.FC<NodeProps> = ({ data }) => {
  const rps = (data.requestsPerSecond as number) || 10000;
  const currentLoad = (data.currentLoad as number) || 0;

  return (
    <div
      style={{
        background: 'linear-gradient(135deg, #1a2744, #1e3050)',
        border: '2px solid #4488ff',
        borderRadius: 8,
        padding: 16,
        minWidth: 160,
        color: '#e0e8f0',
        fontFamily: 'monospace',
        fontSize: 13,
      }}
    >
      <div
        style={{
          fontSize: 11,
          color: '#6699cc',
          textTransform: 'uppercase',
          letterSpacing: 1,
          marginBottom: 8,
        }}
      >
        Client Pool
      </div>

      <div style={{ fontSize: 20, fontWeight: 700, color: '#88bbff', marginBottom: 4 }}>
        {rps.toLocaleString()} req/s
      </div>

      {currentLoad > 0 && (
        <div style={{ fontSize: 11, color: '#8899aa' }}>
          Sending: {currentLoad.toLocaleString()}/s
        </div>
      )}

      <Handle
        type="source"
        position={Position.Right}
        style={{ background: '#4488ff', width: 10, height: 10 }}
      />
    </div>
  );
};
