import React from 'react';
import { useGameStore } from '../core/GameStore';
import { DialogueUI } from '../dialogue/DialogueUI';
import { PuzzleWorkspace } from '../puzzle/PuzzleWorkspace';
import { SDPuzzleWorkspace } from '../puzzle/software-design/SDPuzzleWorkspace';
import { GradeDisplay } from '../puzzle/GradeDisplay';
import { SDGradeDisplay } from '../puzzle/software-design/SDGradeDisplay';
import { DebriefUI } from '../puzzle/DebriefUI';
import { TrackSelectScreen } from './TrackSelectScreen';
import { ChapterDashboard } from './ChapterDashboard';

export const App: React.FC = () => {
  const phase = useGameStore((s) => s.phase);
  const selectedTrack = useGameStore((s) => s.selectedTrack);

  if (phase === 'track-select') {
    return <TrackSelectScreen />;
  }

  const isSD = selectedTrack === 'software-design';

  return (
    <>
      {phase === 'exploring' && <ChapterDashboard />}
      {phase === 'dialogue' && <DialogueUI />}
      {phase === 'puzzle' && (isSD ? <SDPuzzleWorkspace /> : <PuzzleWorkspace />)}
      {phase === 'results' && (isSD ? <SDGradeDisplay /> : <GradeDisplay />)}
      {phase === 'debrief' && <DebriefUI />}
    </>
  );
};
