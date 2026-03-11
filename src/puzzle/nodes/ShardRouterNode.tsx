import React from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { usePuzzleStore } from '../PuzzleStore';

export const ShardRouterNode: React.FC<NodeProps> = ({ id, data }) => {
  const numPartitions = (data.numPartitions as number) || 3;
  const partitionStrategy = (data.partitionStrategy as string) || 'hash';
  const shardBalance = (data.shardBalance as number) || 0;
  const totalRouted = (data.totalRouted as number) || 0;
  const running = usePuzzleStore((s) => s.simulationState.running);
  const setNodes = usePuzzleStore((s) => s.setNodes);
  const nodes = usePuzzleStore((s) => s.nodes);

  const handlePartitionsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Math.max(2, Math.min(8, parseInt(e.target.value) || 2));
    const updated = nodes.map((n) =>
      n.id === id ? { ...n, data: { ...n.data, numPartitions: val } } : n
    );
    setNodes(updated);
  };

  const handleStrategyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const updated = nodes.map((n) =>
      n.id === id ? { ...n, data: { ...n.data, partitionStrategy: e.target.value } } : n
    );
    setNodes(updated);
  };

  const getBalanceColor = () => {
    if (shardBalance >= 85) return '#44cc66';
    if (shardBalance >= 60) return '#ccaa44';
    return '#ff6644';
  };

  const inputStyle: React.CSSProperties = {
    width: 50,
    background: '#1a1408',
    color: '#ddaa66',
    border: '1px solid #554422',
    borderRadius: 4,
    padding: '3px 5px',
    fontSize: 11,
    fontFamily: 'monospace',
    textAlign: 'center',
    cursor: running ? 'not-allowed' : 'text',
    opacity: running ? 0.5 : 1,
  };

  const selectStyle: React.CSSProperties = {
    width: 80,
    background: '#1a1408',
    color: '#ddaa66',
    border: '1px solid #554422',
    borderRadius: 4,
    padding: '3px 5px',
    fontSize: 11,
    fontFamily: 'monospace',
    cursor: running ? 'not-allowed' : 'pointer',
    opacity: running ? 0.5 : 1,
  };

  return (
    <div style={{
      background: 'linear-gradient(135deg, #1a1408, #241c10)',
      border: '2px solid #dd8844',
      borderRadius: 10,
      padding: '14px 16px',
      minWidth: 195,
      color: '#e0e8f0',
      fontFamily: 'monospace',
      fontSize: 13,
      boxShadow: totalRouted > 0
        ? '0 0 16px rgba(221, 136, 68, 0.2), inset 0 1px 0 rgba(255,255,255,0.05)'
        : 'inset 0 1px 0 rgba(255,255,255,0.05)',
      transition: 'box-shadow 0.3s',
    }}>
      <Handle type="target" position={Position.Left}
        style={{ background: '#dd8844', width: 12, height: 12, border: '2px solid #1a1408' }} />

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        <div style={{
          width: 28, height: 28, borderRadius: 6,
          background: 'rgba(221, 136, 68, 0.12)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 13, color: '#ddaa66',
        }}>
          {'#'}
        </div>
        <div style={{ fontSize: 11, color: '#cc7733', textTransform: 'uppercase', letterSpacing: 1 }}>
          Shard Router
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 11, color: '#8899aa', marginBottom: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{ color: '#cc7733' }}>Shards</span>
          <input
            type="number"
            value={numPartitions}
            onChange={handlePartitionsChange}
            disabled={running}
            min={2}
            max={8}
            style={inputStyle}
          />
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 11, color: '#8899aa', marginBottom: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{ color: '#cc7733' }}>Strategy</span>
          <select
            value={partitionStrategy}
            onChange={handleStrategyChange}
            disabled={running}
            style={selectStyle}
          >
            <option value="hash">Hash</option>
            <option value="geographic">Geo</option>
          </select>
        </div>
      </div>

      {/* Balance bar */}
      <div style={{ background: '#1a1408', borderRadius: 4, height: 8, overflow: 'hidden', marginBottom: 4, border: '1px solid #332810' }}>
        <div style={{
          width: `${shardBalance}%`,
          height: '100%',
          background: `linear-gradient(90deg, #dd884488, ${getBalanceColor()})`,
          transition: 'width 0.15s',
          borderRadius: 3,
        }} />
      </div>
      <div style={{ fontSize: 10, color: '#8899aa', marginBottom: 6, display: 'flex', justifyContent: 'space-between' }}>
        <span>Balance</span>
        <span style={{ color: getBalanceColor(), fontWeight: 700 }}>
          {Math.round(shardBalance)}%
        </span>
      </div>

      {/* Total routed */}
      <div style={{ fontSize: 10, color: '#8899aa', display: 'flex', justifyContent: 'space-between' }}>
        <span>Routed</span>
        <span style={{ color: '#ddaa66', fontWeight: 700 }}>{totalRouted.toLocaleString()}</span>
      </div>

      <Handle type="source" position={Position.Right}
        style={{ background: '#dd8844', width: 12, height: 12, border: '2px solid #1a1408' }} />
    </div>
  );
};
