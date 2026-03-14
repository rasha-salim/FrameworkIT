import { create } from 'zustand';
import type {
  SDClass,
  SDInterface,
  SDDependency,
  SDPuzzleData,
  SoftwareDesignMetrics,
  Grade,
} from '../../types';

export interface SDSimulationState {
  running: boolean;
  completed: boolean;
  scenarioResults: ScenarioResult[];
  finalMetrics: SoftwareDesignMetrics | null;
  grade: Grade;
}

export interface ScenarioResult {
  scenarioId: string;
  description: string;
  classesAffected: string[];
  changeCount: number;
}

interface SDPuzzleState {
  puzzleData: SDPuzzleData | null;
  classes: SDClass[];
  interfaces: SDInterface[];
  dependencies: SDDependency[];
  simulationState: SDSimulationState;
  selectedClassId: string | null;
  splitMode: boolean;
  rewireMode: boolean;

  setPuzzleData: (data: SDPuzzleData) => void;
  setClasses: (classes: SDClass[]) => void;
  setInterfaces: (interfaces: SDInterface[]) => void;
  setDependencies: (deps: SDDependency[]) => void;

  addClass: (cls: SDClass) => void;
  updateClass: (id: string, updates: Partial<SDClass>) => void;
  removeClass: (id: string) => void;

  addInterface: (iface: SDInterface) => void;
  removeInterface: (id: string) => void;

  addDependency: (dep: SDDependency) => void;
  removeDependency: (id: string) => void;
  updateDependency: (id: string, updates: Partial<SDDependency>) => void;

  splitClass: (classId: string, methodIds: string[], newClassName: string) => string;
  extractInterface: (classId: string) => string;
  moveMethod: (methodId: string, fromClassId: string, toClassId: string) => void;

  setSelectedClassId: (id: string | null) => void;
  setSplitMode: (on: boolean) => void;
  setRewireMode: (on: boolean) => void;

  startSimulation: () => void;
  completeSimulation: (results: ScenarioResult[], metrics: SoftwareDesignMetrics, grade: Grade) => void;
  resetSimulation: () => void;
  resetPuzzle: () => void;
}

const initialSimState: SDSimulationState = {
  running: false,
  completed: false,
  scenarioResults: [],
  finalMetrics: null,
  grade: 'none',
};

let nextId = 1000;
function genId(prefix: string): string {
  return `${prefix}-${nextId++}`;
}

export const useSDPuzzleStore = create<SDPuzzleState>((set, get) => ({
  puzzleData: null,
  classes: [],
  interfaces: [],
  dependencies: [],
  simulationState: { ...initialSimState },
  selectedClassId: null,
  splitMode: false,
  rewireMode: false,

  setPuzzleData: (data) => set({ puzzleData: data }),

  setClasses: (classes) => set({ classes }),
  setInterfaces: (interfaces) => set({ interfaces }),
  setDependencies: (deps) => set({ dependencies: deps }),

  addClass: (cls) => set((s) => ({ classes: [...s.classes, cls] })),

  updateClass: (id, updates) =>
    set((s) => ({
      classes: s.classes.map((c) => (c.id === id ? { ...c, ...updates } : c)),
    })),

  removeClass: (id) =>
    set((s) => ({
      classes: s.classes.filter((c) => c.id !== id),
      dependencies: s.dependencies.filter((d) => d.source !== id && d.target !== id),
    })),

  addInterface: (iface) => set((s) => ({ interfaces: [...s.interfaces, iface] })),

  removeInterface: (id) =>
    set((s) => ({
      interfaces: s.interfaces.filter((i) => i.id !== id),
      dependencies: s.dependencies.filter((d) => d.source !== id && d.target !== id),
      classes: s.classes.map((c) => ({
        ...c,
        implementsInterfaces: c.implementsInterfaces.filter((iid) => iid !== id),
      })),
    })),

  addDependency: (dep) => set((s) => ({ dependencies: [...s.dependencies, dep] })),

  removeDependency: (id) =>
    set((s) => ({ dependencies: s.dependencies.filter((d) => d.id !== id) })),

  updateDependency: (id, updates) =>
    set((s) => ({
      dependencies: s.dependencies.map((d) => (d.id === id ? { ...d, ...updates } : d)),
    })),

  splitClass: (classId, methodIds, newClassName) => {
    const { classes, dependencies } = get();
    const source = classes.find((c) => c.id === classId);
    if (!source) return classId;

    const movedMethods = source.methods.filter((m) => methodIds.includes(m.id));
    const remainingMethods = source.methods.filter((m) => !methodIds.includes(m.id));

    const newId = genId('class');
    const newClass: SDClass = {
      id: newId,
      name: newClassName,
      methods: movedMethods,
      dependencies: [],
      implementsInterfaces: [],
      position: { x: source.position.x + 280, y: source.position.y },
    };

    // Update the source class
    const updatedSource = { ...source, methods: remainingMethods };

    // Add dependency from source to new class
    const newDep: SDDependency = {
      id: genId('dep'),
      source: classId,
      target: newId,
      type: 'depends-on',
    };

    set({
      classes: [...classes.filter((c) => c.id !== classId), updatedSource, newClass],
      dependencies: [...dependencies, newDep],
    });

    return newId;
  },

  extractInterface: (classId) => {
    const { classes, interfaces } = get();
    const cls = classes.find((c) => c.id === classId);
    if (!cls) return classId;

    const ifaceId = genId('iface');
    const iface: SDInterface = {
      id: ifaceId,
      name: `I${cls.name}`,
      methods: cls.methods.map((m) => ({ id: m.id, name: m.name })),
      position: { x: cls.position.x, y: cls.position.y - 160 },
    };

    const updatedClass = {
      ...cls,
      implementsInterfaces: [...cls.implementsInterfaces, ifaceId],
    };

    // Rewire dependencies: other classes that depend on this class now depend on the interface
    const { dependencies } = get();
    const updatedDeps = dependencies.map((d) => {
      if (d.target === classId && d.type === 'depends-on') {
        return { ...d, target: ifaceId };
      }
      return d;
    });

    // Add implements dependency
    const implDep: SDDependency = {
      id: genId('dep'),
      source: classId,
      target: ifaceId,
      type: 'implements',
    };

    set({
      interfaces: [...interfaces, iface],
      classes: classes.map((c) => (c.id === classId ? updatedClass : c)),
      dependencies: [...updatedDeps, implDep],
    });

    return ifaceId;
  },

  moveMethod: (methodId, fromClassId, toClassId) => {
    const { classes } = get();
    const from = classes.find((c) => c.id === fromClassId);
    const to = classes.find((c) => c.id === toClassId);
    if (!from || !to) return;

    const method = from.methods.find((m) => m.id === methodId);
    if (!method) return;

    set({
      classes: classes.map((c) => {
        if (c.id === fromClassId) {
          return { ...c, methods: c.methods.filter((m) => m.id !== methodId) };
        }
        if (c.id === toClassId) {
          return { ...c, methods: [...c.methods, method] };
        }
        return c;
      }),
    });
  },

  setSelectedClassId: (id) => set({ selectedClassId: id }),
  setSplitMode: (on) => set({ splitMode: on, rewireMode: false }),
  setRewireMode: (on) => set({ rewireMode: on, splitMode: false }),

  startSimulation: () =>
    set({ simulationState: { ...initialSimState, running: true } }),

  completeSimulation: (results, metrics, grade) =>
    set({
      simulationState: {
        running: false,
        completed: true,
        scenarioResults: results,
        finalMetrics: metrics,
        grade,
      },
    }),

  resetSimulation: () => set({ simulationState: { ...initialSimState } }),

  resetPuzzle: () => {
    const { puzzleData } = get();
    if (!puzzleData) return;

    set({
      classes: puzzleData.initialCodebase.classes.map((c) => ({ ...c })),
      interfaces: (puzzleData.initialCodebase.interfaces || []).map((i) => ({ ...i })),
      dependencies: [],
      simulationState: { ...initialSimState },
      selectedClassId: null,
      splitMode: false,
      rewireMode: false,
    });
  },
}));
