import React, { useEffect, useRef } from 'react';
import { useGameStore } from '../core/GameStore';
import { usePuzzleStore } from '../puzzle/PuzzleStore';
import { DialogueUI } from '../dialogue/DialogueUI';
import { PuzzleWorkspace } from '../puzzle/PuzzleWorkspace';
import { GradeDisplay } from '../puzzle/GradeDisplay';

const CHAPTER_NPC: Record<string, string> = {
  '01-load-balancing': 'Sarah',
  '02-caching': 'Marcus',
  '03-databases': 'Sarah',
};

const CHAPTER_NUMBER: Record<string, number> = {
  '01-load-balancing': 1,
  '02-caching': 2,
  '03-databases': 3,
};

export const App: React.FC = () => {
  const phase = useGameStore((s) => s.phase);
  const currentChapter = useGameStore((s) => s.currentChapter);
  const puzzleCompleted = useGameStore((s) => s.puzzleCompleted);
  const completedChapters = useGameStore((s) => s.completedChapters);
  const prevPhase = useRef(phase);

  // When transitioning from results to exploring, check the grade
  // to determine if the puzzle was actually passed
  useEffect(() => {
    if (prevPhase.current === 'results' && phase === 'exploring') {
      const grade = usePuzzleStore.getState().simulationState.grade;
      const passed = grade !== 'none';
      useGameStore.getState().setPuzzleCompleted(passed);

      if (passed) {
        const gradeKey = `puzzle-best-grade-${currentChapter}`;
        const bestGrade = localStorage.getItem(gradeKey);
        const gradeRank: Record<string, number> = { none: 0, bronze: 1, silver: 2, gold: 3 };
        if (!bestGrade || gradeRank[grade] > (gradeRank[bestGrade] || 0)) {
          localStorage.setItem(gradeKey, grade);
        }
      }
    }
    prevPhase.current = phase;
  }, [phase, currentChapter]);

  const chapterNum = CHAPTER_NUMBER[currentChapter] || 1;
  const chapterName = currentChapter.replace(/^\d+-/, '').replace(/-/g, ' ');
  const npcName = CHAPTER_NPC[currentChapter] || 'the NPC';
  const bestGradeKey = `puzzle-best-grade-${currentChapter}`;
  const bestGrade = typeof window !== 'undefined' ? localStorage.getItem(bestGradeKey) : null;

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
            Ch {chapterNum}: {chapterName}
          </div>
          <div style={{ fontSize: 14, color: '#aabbcc', marginTop: 6 }}>
            {puzzleCompleted
              ? `Puzzle complete! Talk to ${npcName} for next steps.`
              : `Approach ${npcName} and press [E] to talk`}
          </div>
          {puzzleCompleted && bestGrade && (
            <div style={{ fontSize: 11, color: '#44cc66', marginTop: 4 }}>
              Best: {bestGrade.toUpperCase()}
            </div>
          )}
          {completedChapters.length > 0 && (
            <div style={{ fontSize: 10, color: '#445566', marginTop: 6 }}>
              Chapters completed: {completedChapters.length}/3
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
