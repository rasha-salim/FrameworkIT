import React, { useEffect, useCallback, useMemo } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  addEdge,
  applyNodeChanges,
  applyEdgeChanges,
  type OnNodesChange,
  type OnEdgesChange,
  type OnConnect,
  type NodeTypes,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { usePuzzleStore } from './PuzzleStore';
import { ComponentPalette } from './ComponentPalette';
import { MetricsDashboard } from './MetricsDashboard';
import { PuzzleSimulator } from './PuzzleSimulator';
import { loadPuzzle } from '../core/ContentLoader';
import { useGameStore } from '../core/GameStore';
import { ClientPoolNode } from './nodes/ClientPoolNode';
import { LoadBalancerNode } from './nodes/LoadBalancerNode';
import { WebServerNode } from './nodes/WebServerNode';
import { CacheNode } from './nodes/CacheNode';
import { DatabaseNode } from './nodes/DatabaseNode';
import { ReadReplicaNode } from './nodes/ReadReplicaNode';

const COMPONENT_LABELS: Record<string, string> = {
  'client-pool': 'Clients',
  'load-balancer': 'Load Balancer',
  'web-server': 'Web Server',
  'cache': 'Cache',
  'database': 'Primary DB',
  'read-replica': 'Read Replica',
};

function getComponentLabel(type: string): string {
  return COMPONENT_LABELS[type] || type;
}

export const PuzzleWorkspace: React.FC = () => {
  const nodes = usePuzzleStore((s) => s.nodes);
  const edges = usePuzzleStore((s) => s.edges);
  const setNodes = usePuzzleStore((s) => s.setNodes);
  const setEdges = usePuzzleStore((s) => s.setEdges);
  const simulationState = usePuzzleStore((s) => s.simulationState);
  const puzzleData = usePuzzleStore((s) => s.puzzleData);
  const setPuzzleData = usePuzzleStore((s) => s.setPuzzleData);
  const resetPuzzle = usePuzzleStore((s) => s.resetPuzzle);
  const resetSimulation = usePuzzleStore((s) => s.resetSimulation);

  const currentChapter = useGameStore((s) => s.currentChapter);
  const currentPuzzleId = useGameStore((s) => s.currentPuzzleId);
  const setPhase = useGameStore((s) => s.setPhase);

  // Reset simulation state when entering puzzle phase with a new puzzle
  // This must run BEFORE the completion-detection effect
  const puzzleLoadedRef = React.useRef(false);

  useEffect(() => {
    if (!currentPuzzleId) return;

    // Reset stale simulation state before loading new puzzle
    puzzleLoadedRef.current = false;
    resetSimulation();

    loadPuzzle(currentChapter, currentPuzzleId).then((data) => {
      setPuzzleData(data);

      const fixedNodes = data.fixedComponents.map((fc) => ({
        id: fc.id,
        type: fc.type,
        position: fc.position,
        data: {
          ...fc.config,
          componentType: fc.type,
          label: getComponentLabel(fc.type),
          fixed: true,
          currentLoad: 0,
        },
        draggable: fc.type !== 'client-pool',
      }));

      setNodes(fixedNodes);
      setEdges([]);
      puzzleLoadedRef.current = true;
    });
  }, [currentChapter, currentPuzzleId, setPuzzleData, setNodes, setEdges, resetSimulation]);

  // Transition to results phase when simulation completes (only after puzzle is loaded)
  useEffect(() => {
    if (simulationState.completed && puzzleLoadedRef.current) {
      setPhase('results');
    }
  }, [simulationState.completed, setPhase]);

  const nodeTypes: NodeTypes = useMemo(
    () => ({
      'client-pool': ClientPoolNode,
      'load-balancer': LoadBalancerNode,
      'web-server': WebServerNode,
      'cache': CacheNode,
      'database': DatabaseNode,
      'read-replica': ReadReplicaNode,
    }),
    []
  );

  const removeNode = usePuzzleStore((s) => s.removeNode);

  const onNodesChange: OnNodesChange = useCallback(
    (changes) => {
      if (simulationState.running) return;

      // Filter out delete changes for fixed nodes
      const filteredChanges = changes.filter((change) => {
        if (change.type === 'remove') {
          const node = nodes.find((n) => n.id === change.id);
          return node && !node.data?.fixed;
        }
        return true;
      });

      if (filteredChanges.length === 0) return;

      // Handle removals through the store's removeNode (cleans up edges too)
      const removals = filteredChanges.filter((c) => c.type === 'remove');
      const otherChanges = filteredChanges.filter((c) => c.type !== 'remove');

      if (otherChanges.length > 0) {
        setNodes(applyNodeChanges(otherChanges, nodes));
      }

      for (const removal of removals) {
        if (removal.type === 'remove') {
          removeNode(removal.id);
        }
      }
    },
    [nodes, setNodes, removeNode, simulationState.running]
  );

  const onEdgesChange: OnEdgesChange = useCallback(
    (changes) => {
      if (simulationState.running) return;
      setEdges(applyEdgeChanges(changes, edges));
    },
    [edges, setEdges, simulationState.running]
  );

  const onConnect: OnConnect = useCallback(
    (connection) => {
      if (simulationState.running) return;
      setEdges(
        addEdge(
          {
            ...connection,
            animated: true,
            style: { stroke: '#4488ff', strokeWidth: 2.5, strokeLinecap: 'round' },
          },
          edges
        )
      );
    },
    [edges, setEdges, simulationState.running]
  );

  const handleDeploy = () => {
    if (!puzzleData || simulationState.running) return;
    PuzzleSimulator.run(nodes, edges, puzzleData);
  };

  const handleReset = () => {
    if (simulationState.running) return;
    resetSimulation();
    resetPuzzle();
  };

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background: '#0a0e1a',
        display: 'flex',
        flexDirection: 'column',
        pointerEvents: 'auto',
      }}
    >
      {/* Top bar */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '12px 24px',
          borderBottom: '1px solid #2a3355',
          background: 'rgba(15, 20, 35, 0.95)',
        }}
      >
        <div>
          <div style={{ fontSize: 16, fontWeight: 700, color: '#88bbff', fontFamily: 'monospace' }}>
            {puzzleData?.title || 'Loading...'}
          </div>
          <div style={{ fontSize: 12, color: '#556688', marginTop: 2 }}>
            {puzzleData?.briefing?.text?.slice(0, 100)}...
          </div>
        </div>

        <div style={{ display: 'flex', gap: 12 }}>
          <button
            onClick={handleReset}
            disabled={simulationState.running}
            style={{
              background: 'rgba(255, 68, 68, 0.15)',
              border: '1px solid #ff444444',
              color: '#ff8888',
              padding: '8px 20px',
              borderRadius: 6,
              cursor: simulationState.running ? 'not-allowed' : 'pointer',
              fontSize: 13,
              fontFamily: 'monospace',
              opacity: simulationState.running ? 0.4 : 1,
            }}
          >
            Reset
          </button>

          <button
            onClick={handleDeploy}
            disabled={simulationState.running}
            style={{
              background: simulationState.running
                ? 'rgba(68, 136, 255, 0.2)'
                : 'linear-gradient(135deg, #2255aa, #3366cc)',
              border: '1px solid #4488ff66',
              color: '#ffffff',
              padding: '8px 24px',
              borderRadius: 6,
              cursor: simulationState.running ? 'not-allowed' : 'pointer',
              fontSize: 13,
              fontWeight: 700,
              fontFamily: 'monospace',
              opacity: simulationState.running ? 0.6 : 1,
            }}
          >
            {simulationState.running ? 'Simulating...' : 'Deploy'}
          </button>
        </div>
      </div>

      {/* Main workspace */}
      <div style={{ flex: 1, display: 'flex' }}>
        <ComponentPalette />

        <div style={{ flex: 1 }}>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            nodeTypes={nodeTypes}
            deleteKeyCode={simulationState.running ? null : ['Backspace', 'Delete']}
            fitView
            proOptions={{ hideAttribution: true }}
            style={{ background: '#0d1220' }}
          >
            <Background color="#1a2040" gap={20} />
            <Controls
              style={{ background: '#1a2040', borderColor: '#2a3355' }}
            />
          </ReactFlow>
        </div>
      </div>

      <MetricsDashboard />
    </div>
  );
};
