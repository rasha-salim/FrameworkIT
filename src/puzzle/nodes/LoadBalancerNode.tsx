import React from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { usePuzzleStore } from '../PuzzleStore';

export const LoadBalancerNode: React.FC<NodeProps> = ({ id, data }) => {
  const algorithm = (data.algorithm as string) || 'round-robin';
  const currentLoad = (data.currentLoad as number) || 0;
  const running = usePuzzleStore((s) => s.simulationState.running);

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
        background: 'linear-gradient(135deg, #2a1a44, #352050)',
        border: '2px solid #aa66ff',
        borderRadius: 8,
        padding: 16,
        minWidth: 180,
        color: '#e0e8f0',
        fontFamily: 'monospace',
        fontSize: 13,
      }}
    >
      <Handle
        type="target"
        position={Position.Left}
        style={{ background: '#aa66ff', width: 10, height: 10 }}
      />

      <div
        style={{
          fontSize: 11,
          color: '#9966cc',
          textTransform: 'uppercase',
          letterSpacing: 1,
          marginBottom: 8,
        }}
      >
        Load Balancer
      </div>

      <select
        value={algorithm}
        onChange={handleAlgorithmChange}
        disabled={running}
        style={{
          width: '100%',
          background: '#1a1a2e',
          color: '#ccaaff',
          border: '1px solid #6644aa',
          borderRadius: 4,
          padding: '6px 8px',
          fontSize: 12,
          fontFamily: 'monospace',
          marginBottom: 8,
          cursor: running ? 'not-allowed' : 'pointer',
          opacity: running ? 0.6 : 1,
        }}
      >
        <option value="round-robin">Round Robin</option>
        <option value="least-connections">Least Connections</option>
      </select>

      {currentLoad > 0 && (
        <div style={{ fontSize: 11, color: '#8899aa' }}>
          Routing: {currentLoad.toLocaleString()}/s
        </div>
      )}

      <Handle
        type="source"
        position={Position.Right}
        style={{ background: '#aa66ff', width: 10, height: 10 }}
      />
    </div>
  );
};
