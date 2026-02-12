import React from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { usePuzzleStore } from '../PuzzleStore';

export const CacheNode: React.FC<NodeProps> = ({ id, data }) => {
  const strategy = (data.strategy as string) || 'cache-aside';
  const evictionPolicy = (data.evictionPolicy as string) || 'LRU';
  const hitRate = (data.hitRate as number) || 0;
  const ttlSeconds = (data.ttlSeconds as number) || 0;
  const maxEntries = (data.maxEntries as number) || 0;
  const running = usePuzzleStore((s) => s.simulationState.running);
  const setNodes = usePuzzleStore((s) => s.setNodes);
  const nodes = usePuzzleStore((s) => s.nodes);

  const handleStrategyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const updated = nodes.map((n) =>
      n.id === id ? { ...n, data: { ...n.data, strategy: e.target.value } } : n
    );
    setNodes(updated);
  };

  const handleEvictionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const updated = nodes.map((n) =>
      n.id === id ? { ...n, data: { ...n.data, evictionPolicy: e.target.value } } : n
    );
    setNodes(updated);
  };

  return (
    <div style={{
      background: 'linear-gradient(135deg, #2a1f0a, #352a12)',
      border: '2px solid #ff9933',
      borderRadius: 8,
      padding: 16,
      minWidth: 180,
      color: '#e0e8f0',
      fontFamily: 'monospace',
      fontSize: 13,
    }}>
      <Handle type="target" position={Position.Left} style={{ background: '#ff9933', width: 10, height: 10 }} />

      <div style={{ fontSize: 11, color: '#996622', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>
        Cache
      </div>

      <select
        value={strategy}
        onChange={handleStrategyChange}
        disabled={running}
        style={{
          width: '100%', background: '#1a1a2e', color: '#ffbb66',
          border: '1px solid #996622', borderRadius: 4, padding: '6px 8px',
          fontSize: 12, fontFamily: 'monospace', marginBottom: 8,
          cursor: running ? 'not-allowed' : 'pointer',
          opacity: running ? 0.6 : 1,
        }}
      >
        <option value="cache-aside">Cache-Aside</option>
        <option value="write-through">Write-Through</option>
        <option value="read-through">Read-Through</option>
      </select>

      <select
        value={evictionPolicy}
        onChange={handleEvictionChange}
        disabled={running}
        style={{
          width: '100%', background: '#1a1a2e', color: '#ffbb66',
          border: '1px solid #996622', borderRadius: 4, padding: '6px 8px',
          fontSize: 12, fontFamily: 'monospace', marginBottom: 8,
          cursor: running ? 'not-allowed' : 'pointer',
          opacity: running ? 0.6 : 1,
        }}
      >
        <option value="LRU">LRU</option>
        <option value="LFU">LFU</option>
        <option value="FIFO">FIFO</option>
      </select>

      <div style={{ background: '#1a1a2e', borderRadius: 3, height: 8, overflow: 'hidden', marginBottom: 4 }}>
        <div style={{
          width: `${Math.min(100, hitRate)}%`,
          height: '100%',
          background: 'linear-gradient(90deg, #ff4466, #44cc66)',
          transition: 'width 0.1s',
          borderRadius: 3,
        }} />
      </div>
      <div style={{ fontSize: 10, color: '#8899aa', marginBottom: 8 }}>
        Hit: {Math.round(hitRate)}%
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#8899aa' }}>
        <span>TTL: {ttlSeconds}s</span>
        <span>Size: {maxEntries}</span>
      </div>

      <Handle type="source" position={Position.Right} style={{ background: '#ff9933', width: 10, height: 10 }} />
    </div>
  );
};
