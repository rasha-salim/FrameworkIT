import React, { useEffect, useRef } from 'react';
import { useGameStore, CHAPTER_ORDER } from '../core/GameStore';

import { useAuthStore } from '../auth/AuthStore';
import { DialogueUI } from '../dialogue/DialogueUI';
import { PuzzleWorkspace } from '../puzzle/PuzzleWorkspace';
import { GradeDisplay } from '../puzzle/GradeDisplay';
import { DebriefUI } from '../puzzle/DebriefUI';
import { TrackSelectScreen } from './TrackSelectScreen';

const CHAPTER_NPC: Record<string, string> = {
  '01-load-balancing': 'Sarah',
  '02-caching': 'Marcus',
  '03-databases': 'Sarah',
  '04-rate-limiting': 'Marcus',
};

const CHAPTER_NUMBER: Record<string, number> = {
  '01-load-balancing': 1,
  '02-caching': 2,
  '03-databases': 3,
  '04-rate-limiting': 4,
};

export const App: React.FC = () => {
  const phase = useGameStore((s) => s.phase);
  const currentChapter = useGameStore((s) => s.currentChapter);
  const puzzleCompleted = useGameStore((s) => s.puzzleCompleted);
  const completedChapters = useGameStore((s) => s.completedChapters);
  const selectedTrack = useGameStore((s) => s.selectedTrack);
  const backToTrackSelect = useGameStore((s) => s.backToTrackSelect);
  const playerName = useAuthStore((s) => s.playerName);
  const clearPlayer = useAuthStore((s) => s.clearPlayer);
  const prevPhase = useRef(phase);

  // Grade saving and puzzleCompleted are now handled by DebriefUI (on pass)
  // and GradeDisplay (on fail) directly, so no phase-transition effect needed.
  useEffect(() => {
    prevPhase.current = phase;
  }, [phase]);

  const chapterNum = CHAPTER_NUMBER[currentChapter] || 1;
  const chapterName = currentChapter.replace(/^\d+-/, '').replace(/-/g, ' ');
  const npcName = CHAPTER_NPC[currentChapter] || 'the NPC';
  const bestGradeKey = `puzzle-best-grade-${currentChapter}`;
  const bestGrade = typeof window !== 'undefined' ? localStorage.getItem(bestGradeKey) : null;

  if (phase === 'track-select') {
    return <TrackSelectScreen />;
  }

  return (
    <>
      {phase === 'exploring' && playerName && (
        <div
          style={{
            position: 'absolute',
            top: 16,
            right: 16,
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            background: 'rgba(0, 0, 0, 0.7)',
            padding: '8px 16px',
            borderRadius: 8,
            border: '1px solid #2a3355',
            fontFamily: 'monospace',
            pointerEvents: 'auto',
            zIndex: 20,
          }}
        >
          <span style={{ fontSize: 11, color: '#6688aa' }}>{playerName}</span>
          <button
            onClick={backToTrackSelect}
            style={{
              background: 'rgba(68, 136, 255, 0.12)',
              border: '1px solid #4488ff44',
              color: '#88bbff',
              padding: '4px 10px',
              borderRadius: 4,
              cursor: 'pointer',
              fontSize: 11,
              fontFamily: 'monospace',
            }}
          >
            Tracks
          </button>
          <button
            onClick={clearPlayer}
            style={{
              background: 'rgba(255, 68, 68, 0.15)',
              border: '1px solid #ff444444',
              color: '#ff8888',
              padding: '4px 10px',
              borderRadius: 4,
              cursor: 'pointer',
              fontSize: 11,
              fontFamily: 'monospace',
            }}
          >
            Reset
          </button>
        </div>
      )}

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
              Chapters completed: {completedChapters.length}/{CHAPTER_ORDER.length}
            </div>
          )}
        </div>
      )}

      {phase === 'dialogue' && <DialogueUI />}
      {phase === 'puzzle' && <PuzzleWorkspace />}
      {phase === 'results' && <GradeDisplay />}
      {phase === 'debrief' && <DebriefUI />}
    </>
  );
};
