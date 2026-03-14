import React, { useEffect, useRef } from 'react';
import { useGameStore } from '../../core/GameStore';
import { useSDPuzzleStore } from './SDPuzzleStore';
import { loadSDPuzzle } from '../../core/ContentLoader';
import { Level1SOLID } from './levels/Level1SOLID';

export const SDPuzzleWorkspace: React.FC = () => {
  const currentChapter = useGameStore((s) => s.currentChapter);
  const currentPuzzleId = useGameStore((s) => s.currentPuzzleId);
  const setPhase = useGameStore((s) => s.setPhase);

  const setPuzzleData = useSDPuzzleStore((s) => s.setPuzzleData);
  const setClasses = useSDPuzzleStore((s) => s.setClasses);
  const setInterfaces = useSDPuzzleStore((s) => s.setInterfaces);
  const setDependencies = useSDPuzzleStore((s) => s.setDependencies);
  const resetSimulation = useSDPuzzleStore((s) => s.resetSimulation);
  const simulationState = useSDPuzzleStore((s) => s.simulationState);

  const puzzleLoadedRef = useRef(false);

  // Load puzzle data
  useEffect(() => {
    if (!currentPuzzleId) return;

    puzzleLoadedRef.current = false;
    resetSimulation();

    loadSDPuzzle(currentChapter, currentPuzzleId).then((data) => {
      setPuzzleData(data);
      setClasses(data.initialCodebase.classes.map((c) => ({ ...c })));
      setInterfaces((data.initialCodebase.interfaces || []).map((i) => ({ ...i })));

      // Build initial dependencies from class dependency arrays
      const deps: { id: string; source: string; target: string; type: 'depends-on' | 'implements' | 'creates' | 'wraps' | 'delegates-to' }[] = [];
      let depIdx = 0;
      for (const cls of data.initialCodebase.classes) {
        for (const targetId of cls.dependencies) {
          deps.push({
            id: `init-dep-${depIdx++}`,
            source: cls.id,
            target: targetId,
            type: 'depends-on',
          });
        }
        for (const ifaceId of cls.implementsInterfaces) {
          deps.push({
            id: `init-impl-${depIdx++}`,
            source: cls.id,
            target: ifaceId,
            type: 'implements',
          });
        }
      }
      setDependencies(deps);
      puzzleLoadedRef.current = true;
    });
  }, [currentChapter, currentPuzzleId, setPuzzleData, setClasses, setInterfaces, setDependencies, resetSimulation]);

  // Transition to results phase when simulation completes
  useEffect(() => {
    if (simulationState.completed && puzzleLoadedRef.current) {
      setPhase('results');
    }
  }, [simulationState.completed, setPhase]);

  // Dispatch to level-specific component based on chapter
  switch (currentChapter) {
    case 'sd-01-solid':
      return <Level1SOLID />;
    // Future levels:
    // case 'sd-02-patterns': return <Level2Patterns />;
    // case 'sd-03-refactoring': return <Level3Refactoring />;
    // case 'sd-04-orchestration': return <Level4Orchestration />;
    // case 'sd-05-architecture': return <Level5Architecture />;
    // case 'sd-06-ddd': return <Level6DDD />;
    default:
      return (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: '#0a0e1a',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: 'monospace',
            color: '#667788',
          }}
        >
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 16, color: '#88bbff', marginBottom: 8 }}>
              Chapter: {currentChapter}
            </div>
            <div style={{ fontSize: 13 }}>
              This level is not yet implemented. Check back soon.
            </div>
          </div>
        </div>
      );
  }
};
