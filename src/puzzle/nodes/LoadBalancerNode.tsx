import React from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { usePuzzleStore } from '../PuzzleStore';

export const LoadBalancerNode: React.FC<NodeProps> = ({ id, data }) => {
  const algorithm = (data.algorithm as string) || 'round-robin';
  const currentLoad = (data.currentLoad as number) || 0;
  const running = usePuzzleStore((s) => s.simulationState.running);
  const active = currentLoad > 0;

  const setNodes = usePuzzleStore((s) => s.setNodes);
  const nodes = usePuzzleStore((s) => s.nodes);

  const handleAlgorithmChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const updated = nodes.map((n) =>
      n.id === id ? { ...n, data: { ...n.data, algorithm: e.target.value } } : n
    );
    setNodes(updated);
  };

  return (
    <div
      style={{
        background: 'linear-gradient(135deg, #221740, #2d1f50)',
        border: '2px solid #aa66ff',
        borderRadius: 10,
        padding: '14px 16px',
        minWidth: 190,
        color: '#e0e8f0',
        fontFamily: 'monospace',
        fontSize: 13,
        boxShadow: active
          ? '0 0 20px rgba(170, 102, 255, 0.25), inset 0 1px 0 rgba(255,255,255,0.05)'
          : 'inset 0 1px 0 rgba(255,255,255,0.05)',
        transition: 'box-shadow 0.3s',
      }}
    >
      <Handle
        type="target"
        position={Position.Left}
        style={{ background: '#aa66ff', width: 12, height: 12, border: '2px solid #221740' }}
      />

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        <div style={{
          width: 28, height: 28, borderRadius: 6,
          background: 'rgba(170, 102, 255, 0.15)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 14, color: '#cc99ff',
        }}>
          {'/\\'}
        </div>
        <div style={{ fontSize: 11, color: '#9966cc', textTransform: 'uppercase', letterSpacing: 1 }}>
          Load Balancer
        </div>
      </div>

      <select
        value={algorithm}
        onChange={handleAlgorithmChange}
        disabled={running}
        style={{
          width: '100%',
          background: '#15112a',
          color: '#ccaaff',
          border: '1px solid #6644aa',
          borderRadius: 6,
          padding: '7px 10px',
          fontSize: 12,
          fontFamily: 'monospace',
          marginBottom: 8,
          cursor: running ? 'not-allowed' : 'pointer',
          opacity: running ? 0.5 : 1,
        }}
      >
        <option value="round-robin">Round Robin</option>
        <option value="least-connections">Least Connections</option>
      </select>

      {active && (
        <div style={{ fontSize: 11, color: '#8899aa', display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#aa66ff' }} />
          Routing: {currentLoad.toLocaleString()}/s
        </div>
      )}

      <Handle
        type="source"
        position={Position.Right}
        style={{ background: '#aa66ff', width: 12, height: 12, border: '2px solid #221740' }}
      />
    </div>
  );
};
