import React from 'react';
import { useGameStore } from '../core/GameStore';
import { DialogueUI } from '../dialogue/DialogueUI';
import { PuzzleWorkspace } from '../puzzle/PuzzleWorkspace';
import { GradeDisplay } from '../puzzle/GradeDisplay';
import { DebriefUI } from '../puzzle/DebriefUI';
import { TrackSelectScreen } from './TrackSelectScreen';
import { ChapterDashboard } from './ChapterDashboard';

export const App: React.FC = () => {
  const phase = useGameStore((s) => s.phase);

  if (phase === 'track-select') {
    return <TrackSelectScreen />;
  }

  return (
    <>
      {phase === 'exploring' && <ChapterDashboard />}
      {phase === 'dialogue' && <DialogueUI />}
      {phase === 'puzzle' && <PuzzleWorkspace />}
      {phase === 'results' && <GradeDisplay />}
      {phase === 'debrief' && <DebriefUI />}
    </>
  );
};
