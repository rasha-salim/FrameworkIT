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

  const handleTTLChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Math.max(1, Math.min(300, parseInt(e.target.value) || 1));
    const updated = nodes.map((n) =>
      n.id === id ? { ...n, data: { ...n.data, ttlSeconds: val } } : n
    );
    setNodes(updated);
  };

  const getHitColor = () => {
    if (hitRate >= 70) return '#44cc66';
    if (hitRate >= 40) return '#ccaa44';
    return '#ff6644';
  };

  const selectStyle: React.CSSProperties = {
    width: '100%',
    background: '#1a150a',
    color: '#ffbb66',
    border: '1px solid #664422',
    borderRadius: 6,
    padding: '7px 10px',
    fontSize: 12,
    fontFamily: 'monospace',
    marginBottom: 8,
    cursor: running ? 'not-allowed' : 'pointer',
    opacity: running ? 0.5 : 1,
  };

  return (
    <div style={{
      background: 'linear-gradient(135deg, #241c0a, #302410)',
      border: '2px solid #ff9933',
      borderRadius: 10,
      padding: '14px 16px',
      minWidth: 195,
      color: '#e0e8f0',
      fontFamily: 'monospace',
      fontSize: 13,
      boxShadow: hitRate > 0
        ? '0 0 16px rgba(255, 153, 51, 0.2), inset 0 1px 0 rgba(255,255,255,0.05)'
        : 'inset 0 1px 0 rgba(255,255,255,0.05)',
      transition: 'box-shadow 0.3s',
    }}>
      <Handle type="target" position={Position.Left}
        style={{ background: '#ff9933', width: 12, height: 12, border: '2px solid #241c0a' }} />

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        <div style={{
          width: 28, height: 28, borderRadius: 6,
          background: 'rgba(255, 153, 51, 0.12)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 13, color: '#ffbb66',
        }}>
          {'{ }'}
        </div>
        <div style={{ fontSize: 11, color: '#aa7733', textTransform: 'uppercase', letterSpacing: 1 }}>
          Cache
        </div>
      </div>

      <select value={strategy} onChange={handleStrategyChange} disabled={running} style={selectStyle}>
        <option value="cache-aside">Cache-Aside</option>
        <option value="write-through">Write-Through</option>
        <option value="read-through">Read-Through</option>
      </select>

      <select value={evictionPolicy} onChange={handleEvictionChange} disabled={running} style={selectStyle}>
        <option value="LRU">LRU</option>
        <option value="LFU">LFU</option>
        <option value="FIFO">FIFO</option>
      </select>

      {/* Hit rate bar */}
      <div style={{ background: '#1a150a', borderRadius: 4, height: 8, overflow: 'hidden', marginBottom: 4, border: '1px solid #302410' }}>
        <div style={{
          width: `${Math.min(100, hitRate)}%`,
          height: '100%',
          background: `linear-gradient(90deg, #ff664488, ${getHitColor()})`,
          transition: 'width 0.15s',
          borderRadius: 3,
        }} />
      </div>
      <div style={{ fontSize: 10, color: '#8899aa', marginBottom: 10, display: 'flex', justifyContent: 'space-between' }}>
        <span>Hit Rate</span>
        <span style={{ color: getHitColor(), fontWeight: 700 }}>{Math.round(hitRate)}%</span>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 11, color: '#8899aa', gap: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{ color: '#aa7733' }}>TTL</span>
          <input
            type="number"
            value={ttlSeconds}
            onChange={handleTTLChange}
            disabled={running}
            min={1}
            max={300}
            style={{
              width: 48,
              background: '#1a150a',
              color: '#ffbb66',
              border: '1px solid #664422',
              borderRadius: 4,
              padding: '3px 5px',
              fontSize: 11,
              fontFamily: 'monospace',
              textAlign: 'center',
              cursor: running ? 'not-allowed' : 'text',
              opacity: running ? 0.5 : 1,
            }}
          />
          <span>s</span>
        </div>
        <span style={{ color: '#aa7733' }}>{maxEntries} slots</span>
      </div>

      <Handle type="source" position={Position.Right}
        style={{ background: '#ff9933', width: 12, height: 12, border: '2px solid #241c0a' }} />
    </div>
  );
};
