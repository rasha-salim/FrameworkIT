import React, { useEffect, useRef } from 'react';
import { useGameStore } from '../core/GameStore';
import { usePuzzleStore } from '../puzzle/PuzzleStore';
import { DialogueUI } from '../dialogue/DialogueUI';
import { PuzzleWorkspace } from '../puzzle/PuzzleWorkspace';
import { GradeDisplay } from '../puzzle/GradeDisplay';

export const App: React.FC = () => {
  const phase = useGameStore((s) => s.phase);
  const currentChapter = useGameStore((s) => s.currentChapter);
  const puzzleCompleted = useGameStore((s) => s.puzzleCompleted);
  const prevPhase = useRef(phase);

  // When transitioning from results to exploring, check the grade
  // to determine if the puzzle was actually passed
  useEffect(() => {
    if (prevPhase.current === 'results' && phase === 'exploring') {
      const grade = usePuzzleStore.getState().simulationState.grade;
      const passed = grade !== 'none';
      useGameStore.getState().setPuzzleCompleted(passed);

      if (passed) {
        const bestGrade = localStorage.getItem('puzzle-best-grade');
        const gradeRank: Record<string, number> = { none: 0, bronze: 1, silver: 2, gold: 3 };
        if (!bestGrade || gradeRank[grade] > (gradeRank[bestGrade] || 0)) {
          localStorage.setItem('puzzle-best-grade', grade);
        }
      }
    }
    prevPhase.current = phase;
  }, [phase]);

  return (
    <>
      {phase === 'exploring' && (
        <div
          style={{
            position: 'absolute',
            top: 16,
            left: 16,
            background: 'rgba(0, 0, 0, 0.7)',
            padding: '12px 20px',
            borderRadius: 8,
            border: '1px solid #2a3355',
            pointerEvents: 'none',
            fontFamily: 'monospace',
          }}
        >
          <div style={{ fontSize: 12, color: '#6688aa', textTransform: 'uppercase', letterSpacing: 1 }}>
            Chapter: {currentChapter.replace(/^\d+-/, '').replace(/-/g, ' ')}
          </div>
          <div style={{ fontSize: 14, color: '#aabbcc', marginTop: 6 }}>
            {puzzleCompleted
              ? 'Puzzle complete! Talk to Sarah.'
              : 'Approach Sarah and press [E] to talk'}
          </div>
          {puzzleCompleted && (
            <div style={{ fontSize: 11, color: '#44cc66', marginTop: 4 }}>
              Best: {localStorage.getItem('puzzle-best-grade')?.toUpperCase() || 'N/A'}
            </div>
          )}
        </div>
      )}

      {phase === 'dialogue' && <DialogueUI />}
      {phase === 'puzzle' && <PuzzleWorkspace />}
      {phase === 'results' && <GradeDisplay />}
    </>
  );
};
