import React from 'react';
import { usePuzzleStore } from './PuzzleStore';

interface PaletteItem {
  type: string;
  label: string;
  color: string;
  description: string;
}

const PALETTE_ITEMS: PaletteItem[] = [
  {
    type: 'load-balancer',
    label: 'Load Balancer',
    color: '#aa66ff',
    description: 'Distributes traffic across servers',
  },
  {
    type: 'web-server',
    label: 'Web Server',
    color: '#44cc66',
    description: '2,000 req/s capacity',
  },
  {
    type: 'cache',
    label: 'Cache',
    color: '#ff9933',
    description: 'In-memory cache with TTL',
  },
  {
    type: 'database',
    label: 'Database',
    color: '#33cccc',
    description: 'Primary DB (read/write)',
  },
  {
    type: 'read-replica',
    label: 'Read Replica',
    color: '#66aacc',
    description: 'Read-only DB replica',
  },
  {
    type: 'rate-limiter',
    label: 'Rate Limiter',
    color: '#ff4466',
    description: 'Filters excess traffic',
  },
  {
    type: 'session-store',
    label: 'Session Store',
    color: '#22ccaa',
    description: 'Shared session state (Redis)',
  },
  {
    type: 'shard-router',
    label: 'Shard Router',
    color: '#dd8844',
    description: 'Routes to database shards',
  },
];

export const ComponentPalette: React.FC = () => {
  const canAdd = usePuzzleStore((s) => s.canAddComponent);
  const addNode = usePuzzleStore((s) => s.addNode);
  const nodes = usePuzzleStore((s) => s.nodes);
  const running = usePuzzleStore((s) => s.simulationState.running);
  const puzzleData = usePuzzleStore((s) => s.puzzleData);
  const componentCounts = usePuzzleStore((s) => s.componentCounts);

  const handleAdd = (item: PaletteItem) => {
    if (!canAdd(item.type) || running) return;

    const id = `${item.type}-${Date.now()}`;
    const existingOfType = nodes.filter(
      (n) => n.data?.componentType === item.type
    );

    const yBase = 200;
    const yOffset = existingOfType.length * 120;

    const xPositions: Record<string, number> = {
      'load-balancer': 300,
      'web-server': 550,
      'cache': 650,
      'database': 850,
      'read-replica': 1050,
      'rate-limiter': 420,
      'session-store': 480,
      'shard-router': 550,
    };

    const defaults: Record<string, Record<string, unknown>> = {
      'load-balancer': { algorithm: 'round-robin' },
      'web-server': { maxRPS: 2000, baseLatencyMs: 20 },
      'cache': { strategy: 'cache-aside', evictionPolicy: 'LRU', ttlSeconds: 30, maxEntries: 1000, hitRate: 0 },
      'database': { maxRPS: 800, readLatencyMs: 50, writeLatencyMs: 100, maxConnections: 100, readCount: 0, writeCount: 0, currentConnections: 0 },
      'read-replica': { maxRPS: 800, readLatencyMs: 50, replicationLagMs: 100 },
      'rate-limiter': { maxTokens: 500, refillRate: 200 },
      'session-store': { maxSessions: 10000, lookupLatencyMs: 3, currentSessions: 0, consistencyRate: 0 },
      'shard-router': { numPartitions: 3, partitionStrategy: 'hash', shardBalance: 0, totalRouted: 0 },
    };

    const newNode = {
      id,
      type: item.type,
      position: { x: xPositions[item.type] || 550, y: yBase + yOffset },
      data: {
        componentType: item.type,
        label: item.label,
        currentLoad: 0,
        ...(defaults[item.type] || {}),
      },
    };

    addNode(newNode);
  };

  const getMaxCount = (type: string) => {
    if (!puzzleData) return 0;
    const ac = puzzleData.availableComponents.find((c) => c.type === type);
    return ac?.maxCount || 0;
  };

  const getAddedCount = (type: string) => {
    const total = componentCounts[type] || 0;
    const fixed = puzzleData?.fixedComponents.filter((f) => f.type === type).length || 0;
    return Math.max(0, total - fixed);
  };

  return (
    <div
      style={{
        background: 'rgba(15, 20, 35, 0.95)',
        borderRight: '1px solid #2a3355',
        padding: 16,
        width: 220,
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
      }}
    >
      <div
        style={{
          fontSize: 13,
          color: '#6688aa',
          textTransform: 'uppercase',
          letterSpacing: 1,
          fontFamily: 'monospace',
          marginBottom: 4,
        }}
      >
        Components
      </div>

      {PALETTE_ITEMS.map((item) => {
        const disabled = !canAdd(item.type) || running;
        const added = getAddedCount(item.type);
        const max = getMaxCount(item.type);

        return (
          <button
            key={item.type}
            onClick={() => handleAdd(item)}
            disabled={disabled}
            style={{
              background: disabled
                ? 'rgba(30, 35, 50, 0.5)'
                : `${item.color}18`,
              border: `1px solid ${disabled ? '#333' : item.color + '66'}`,
              borderRadius: 6,
              padding: 12,
              cursor: disabled ? 'not-allowed' : 'pointer',
              textAlign: 'left',
              opacity: disabled ? 0.4 : 1,
              transition: 'all 0.2s',
            }}
          >
            <div
              style={{
                fontSize: 13,
                fontWeight: 600,
                color: item.color,
                fontFamily: 'monospace',
                marginBottom: 4,
              }}
            >
              + {item.label}
            </div>
            <div style={{ fontSize: 11, color: '#778899' }}>{item.description}</div>
            <div style={{ fontSize: 10, color: '#556677', marginTop: 4 }}>
              {added}/{max} placed
            </div>
          </button>
        );
      })}

      <div style={{ marginTop: 'auto', fontSize: 11, color: '#445566', fontFamily: 'monospace' }}>
        Cost: ${usePuzzleStore.getState().getComponentCost()}
      </div>
    </div>
  );
};
