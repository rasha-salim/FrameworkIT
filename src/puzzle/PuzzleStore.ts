import { create } from 'zustand';
import type { Node, Edge } from '@xyflow/react';
import type { SimulationState, SimulationMetrics, TickMetrics, Grade, PuzzleData, AvailableComponent } from '../types';

interface PuzzleState {
  puzzleData: PuzzleData | null;
  nodes: Node[];
  edges: Edge[];
  simulationState: SimulationState;
  componentCounts: Record<string, number>;

  setPuzzleData: (data: PuzzleData) => void;
  setNodes: (nodes: Node[]) => void;
  setEdges: (edges: Edge[]) => void;
  addNode: (node: Node) => void;
  removeNode: (nodeId: string) => void;
  onNodesChange: (changes: Node[]) => void;
  onEdgesChange: (changes: Edge[]) => void;

  startSimulation: (totalTicks: number) => void;
  updateTick: (tick: number, metrics: TickMetrics) => void;
  completeSimulation: (finalMetrics: SimulationMetrics, grade: Grade) => void;
  resetSimulation: () => void;
  resetPuzzle: () => void;

  canAddComponent: (type: string) => boolean;
  getComponentCost: () => number;
}

const initialSimState: SimulationState = {
  running: false,
  completed: false,
  currentTick: 0,
  totalTicks: 0,
  tickMetrics: [],
  finalMetrics: null,
  grade: 'none',
};

export const usePuzzleStore = create<PuzzleState>((set, get) => ({
  puzzleData: null,
  nodes: [],
  edges: [],
  simulationState: { ...initialSimState },
  componentCounts: {},

  setPuzzleData: (data) => set({ puzzleData: data }),

  setNodes: (nodes) => {
    const counts: Record<string, number> = {};
    nodes.forEach((n) => {
      const type = n.data?.componentType as string;
      if (type) {
        counts[type] = (counts[type] || 0) + 1;
      }
    });
    set({ nodes, componentCounts: counts });
  },

  setEdges: (edges) => set({ edges }),

  addNode: (node) => {
    const { nodes } = get();
    const type = node.data?.componentType as string;
    const counts = { ...get().componentCounts };
    counts[type] = (counts[type] || 0) + 1;
    set({ nodes: [...nodes, node], componentCounts: counts });
  },

  removeNode: (nodeId) => {
    const { nodes, edges } = get();
    const removed = nodes.find((n) => n.id === nodeId);
    if (removed) {
      const type = removed.data?.componentType as string;
      const counts = { ...get().componentCounts };
      counts[type] = Math.max(0, (counts[type] || 0) - 1);
      set({
        nodes: nodes.filter((n) => n.id !== nodeId),
        edges: edges.filter((e) => e.source !== nodeId && e.target !== nodeId),
        componentCounts: counts,
      });
    }
  },

  onNodesChange: (updatedNodes) => set({ nodes: updatedNodes }),
  onEdgesChange: (updatedEdges) => set({ edges: updatedEdges }),

  startSimulation: (totalTicks) =>
    set({
      simulationState: {
        ...initialSimState,
        running: true,
        totalTicks,
      },
    }),

  updateTick: (tick, metrics) =>
    set((state) => ({
      simulationState: {
        ...state.simulationState,
        currentTick: tick,
        tickMetrics: [...state.simulationState.tickMetrics, metrics],
      },
    })),

  completeSimulation: (finalMetrics, grade) =>
    set((state) => ({
      simulationState: {
        ...state.simulationState,
        running: false,
        completed: true,
        finalMetrics,
        grade,
      },
    })),

  resetSimulation: () =>
    set({ simulationState: { ...initialSimState } }),

  resetPuzzle: () => {
    const { puzzleData } = get();
    if (!puzzleData) return;

    const labelMap: Record<string, string> = {
      'client-pool': 'Clients',
      'load-balancer': 'Load Balancer',
      'web-server': 'Web Server',
      'cache': 'Cache',
      'database': 'Primary DB',
      'read-replica': 'Read Replica',
      'rate-limiter': 'Rate Limiter',
    };

    const fixedNodes: Node[] = puzzleData.fixedComponents.map((fc) => ({
      id: fc.id,
      type: fc.type,
      position: fc.position,
      data: {
        ...fc.config,
        componentType: fc.type,
        label: labelMap[fc.type] || fc.type,
        fixed: true,
      },
      draggable: fc.type !== 'client-pool',
    }));

    set({
      nodes: fixedNodes,
      edges: [],
      simulationState: { ...initialSimState },
      componentCounts: {},
    });
  },

  canAddComponent: (type) => {
    const { puzzleData, componentCounts } = get();
    if (!puzzleData) return false;

    const available = puzzleData.availableComponents.find(
      (c: AvailableComponent) => c.type === type
    );
    if (!available) return false;

    const current = componentCounts[type] || 0;
    // Subtract fixed components of same type
    const fixedOfType = puzzleData.fixedComponents.filter((f) => f.type === type).length;
    return current - fixedOfType < available.maxCount;
  },

  getComponentCost: () => {
    const { puzzleData, componentCounts } = get();
    if (!puzzleData) return 0;

    let cost = 0;
    puzzleData.availableComponents.forEach((ac: AvailableComponent) => {
      const total = componentCounts[ac.type] || 0;
      const fixed = puzzleData.fixedComponents.filter((f) => f.type === ac.type).length;
      const added = Math.max(0, total - fixed);
      cost += added * ac.costPerUnit;
    });
    return cost;
  },
}));
