import { loadDialogue } from '../core/ContentLoader';
import { EventBus } from '../core/EventBus';
import { useDialogueStore } from './DialogueStore';
import { useGameStore } from '../core/GameStore';
import { usePuzzleStore } from '../puzzle/PuzzleStore';
import type { DialogueData } from '../types';

// Maps chapter -> npc -> dialogue config
interface ChapterDialogueConfig {
  dialogue: string;
  puzzleId: string;
}

const CHAPTER_NPC_MAP: Record<string, Record<string, ChapterDialogueConfig>> = {
  '01-load-balancing': {
    sarah: { dialogue: 'sarah-intro', puzzleId: 'handle-10k-rps' },
  },
  '02-caching': {
    marcus: { dialogue: 'senior-engineer-intro', puzzleId: 'cache-the-dashboard' },
    sarah: { dialogue: 'sarah-intro', puzzleId: 'handle-10k-rps' },
  },
  '03-databases': {
    sarah: { dialogue: 'sarah-db-intro', puzzleId: 'scale-reads-with-replicas' },
    marcus: { dialogue: 'senior-engineer-intro', puzzleId: 'cache-the-dashboard' },
  },
  '04-rate-limiting': {
    marcus: { dialogue: 'marcus-rate-limit-intro', puzzleId: 'protect-the-api' },
    sarah: { dialogue: 'sarah-db-intro', puzzleId: 'scale-reads-with-replicas' },
  },
  '05-sessions': {
    sarah: { dialogue: 'sarah-sessions-intro', puzzleId: 'the-lost-cart' },
    marcus: { dialogue: 'marcus-rate-limit-intro', puzzleId: 'protect-the-api' },
  },
  '06-partitioning': {
    marcus: { dialogue: 'marcus-partitioning-intro', puzzleId: 'going-global' },
    sarah: { dialogue: 'sarah-sessions-intro', puzzleId: 'the-lost-cart' },
  },
};

export class DialogueEngine {
  private static instance: DialogueEngine | null = null;

  static init(): void {
    if (this.instance) return;
    this.instance = new DialogueEngine();
  }

  private constructor() {
    EventBus.on('npc:interact', (npcId) => this.handleInteract(npcId));
  }

  private async handleInteract(npcId: string): Promise<void> {
    const gameState = useGameStore.getState();
    const currentChapter = gameState.currentChapter;
    const puzzleCompleted = gameState.puzzleCompleted;
    const debriefCompleted = gameState.debriefCompleted;

    // Get the dialogue config for this NPC in this chapter
    const chapterConfig = CHAPTER_NPC_MAP[currentChapter];
    if (!chapterConfig) return;

    const npcConfig = chapterConfig[npcId];
    if (!npcConfig) {
      // NPC exists but has no dialogue for this chapter
      // Check if they had dialogue in a previous chapter (they're just hanging around)
      // Show a generic "no dialogue" or previous chapter's post-complete
      return;
    }

    try {
      let data: DialogueData;

      if (puzzleCompleted && !debriefCompleted && this.isCurrentChapterNPC(npcId, currentChapter)) {
        // Puzzle passed but debrief not done -- offer to start debrief
        data = this.buildDebriefPromptDialogue(npcId, npcConfig);
        useDialogueStore.getState().startDialogue(data);
        return;
      }

      if (puzzleCompleted && debriefCompleted && this.isCurrentChapterNPC(npcId, currentChapter)) {
        // Both done - show post-completion dialogue
        data = await loadDialogue(currentChapter, npcConfig.dialogue);
        if (data.nodes['post_complete']) {
          data = { ...data, startNode: 'post_complete' };
        } else if (data.nodes['post-completion']) {
          data = { ...data, startNode: 'post-completion' };
        }
      } else if (this.isNPCFromCompletedChapter(npcId, currentChapter)) {
        // This NPC is from a previously completed chapter - show their post-complete
        const prevChapter = this.getNPCChapter(npcId);
        if (prevChapter) {
          const prevConfig = CHAPTER_NPC_MAP[prevChapter]?.[npcId];
          if (prevConfig) {
            data = await loadDialogue(prevChapter, prevConfig.dialogue);
            if (data.nodes['post_complete']) {
              data = { ...data, startNode: 'post_complete' };
            } else if (data.nodes['post-completion']) {
              data = { ...data, startNode: 'post-completion' };
            }
          } else {
            return;
          }
        } else {
          return;
        }
      } else {
        // Normal intro dialogue
        data = await loadDialogue(currentChapter, npcConfig.dialogue);
      }

      useDialogueStore.getState().startDialogue(data);
    } catch (err) {
      console.error(`Failed to load dialogue for NPC ${npcId}:`, err);
    }
  }

  // Check if this NPC is the "primary" NPC for the current chapter's puzzle
  private isCurrentChapterNPC(npcId: string, chapter: string): boolean {
    const primaryNPCs: Record<string, string> = {
      '01-load-balancing': 'sarah',
      '02-caching': 'marcus',
      '03-databases': 'sarah',
      '04-rate-limiting': 'marcus',
      '05-sessions': 'sarah',
      '06-partitioning': 'marcus',
    };
    return primaryNPCs[chapter] === npcId;
  }

  // Check if this NPC belongs to a chapter that's already completed
  // but is NOT the primary NPC for the current chapter
  private isNPCFromCompletedChapter(npcId: string, currentChapter: string): boolean {
    // If this NPC is the primary NPC for the current chapter, they should
    // show the current chapter's dialogue, not a previous chapter's post-complete
    if (this.isCurrentChapterNPC(npcId, currentChapter)) {
      return false;
    }

    const gameState = useGameStore.getState();
    const primaryNPCs: Record<string, string> = {
      '01-load-balancing': 'sarah',
      '02-caching': 'marcus',
      '03-databases': 'sarah',
      '04-rate-limiting': 'marcus',
      '05-sessions': 'sarah',
      '06-partitioning': 'marcus',
    };

    for (const [chapter, primaryNpc] of Object.entries(primaryNPCs)) {
      if (chapter !== currentChapter && primaryNpc === npcId && gameState.isChapterCompleted(chapter)) {
        return true;
      }
    }
    return false;
  }

  // Find which chapter this NPC was the primary NPC for
  private getNPCChapter(npcId: string): string | null {
    const primaryNPCs: Record<string, string> = {
      '01-load-balancing': 'sarah',
      '02-caching': 'marcus',
      '03-databases': 'sarah',
      '04-rate-limiting': 'marcus',
      '05-sessions': 'sarah',
      '06-partitioning': 'marcus',
    };

    for (const [chapter, primaryNpc] of Object.entries(primaryNPCs)) {
      if (primaryNpc === npcId && useGameStore.getState().isChapterCompleted(chapter)) {
        return chapter;
      }
    }
    return null;
  }

  private buildDebriefPromptDialogue(npcId: string, _config: ChapterDialogueConfig): DialogueData {
    const speaker = npcId === 'sarah' ? 'Sarah' : 'Marcus';
    return {
      id: 'debrief-prompt',
      startNode: 'start',
      nodes: {
        start: {
          id: 'start',
          speaker,
          text: "You did great on that puzzle! But before we move on, I'd like you to reflect on your design decisions. Ready for the debrief?",
          choices: [
            { text: "Let's do the debrief.", next: 'open_debrief', action: 'openDebrief' },
            { text: "Not right now.", next: 'later', action: 'end' },
          ],
        },
        open_debrief: {
          id: 'open_debrief',
          speaker,
          text: "Great, let's go over what you built.",
          action: 'openDebrief',
        },
        later: {
          id: 'later',
          speaker,
          text: "No worries, come back when you're ready. We need to debrief before moving on to the next challenge.",
          action: 'end',
        },
      },
    };
  }

  static handleAction(action: string): void {
    const gameState = useGameStore.getState();
    const currentChapter = gameState.currentChapter;

    if (action === 'openDebrief') {
      useDialogueStore.getState().endDialogue();
      gameState.setPhase('debrief');
      return;
    }

    if (action === 'startPuzzle') {
      // Dynamically resolve puzzle ID from current chapter config
      const chapterConfig = CHAPTER_NPC_MAP[currentChapter];
      if (!chapterConfig) return;

      // Find the primary NPC's puzzle for this chapter
      const primaryNPCs: Record<string, string> = {
        '01-load-balancing': 'sarah',
        '02-caching': 'marcus',
        '03-databases': 'sarah',
        '04-rate-limiting': 'marcus',
      };
      const primaryNpc = primaryNPCs[currentChapter];
      const config = chapterConfig[primaryNpc];
      if (!config) return;

      useDialogueStore.getState().endDialogue();
      usePuzzleStore.getState().resetSimulation();
      gameState.setPhase('puzzle');
      gameState.setCurrentPuzzleId(config.puzzleId);
      EventBus.emit('dialogue:start-puzzle', config.puzzleId);
    } else if (action === 'start-puzzle') {
      // Legacy action name support
      const chapterConfig = CHAPTER_NPC_MAP[currentChapter];
      if (!chapterConfig) return;

      const primaryNPCs: Record<string, string> = {
        '01-load-balancing': 'sarah',
        '02-caching': 'marcus',
        '03-databases': 'sarah',
        '04-rate-limiting': 'marcus',
      };
      const primaryNpc = primaryNPCs[currentChapter];
      const config = chapterConfig[primaryNpc];

      useDialogueStore.getState().endDialogue();
      usePuzzleStore.getState().resetSimulation();
      gameState.setPhase('puzzle');
      gameState.setCurrentPuzzleId(config?.puzzleId || 'handle-10k-rps');
      EventBus.emit('dialogue:start-puzzle', config?.puzzleId || 'handle-10k-rps');
    } else if (action === 'nextChapter') {
      useDialogueStore.getState().endDialogue();

      // Mark current chapter as completed
      gameState.markChapterCompleted(currentChapter);

      // Advance to next chapter
      const advanced = gameState.advanceToNextChapter();

      if (advanced) {
        EventBus.emit('chapter:advanced');
        EventBus.emit('dialogue:ended');
      } else {
        // No more chapters - just end dialogue
        EventBus.emit('dialogue:ended');
      }
    } else if (action === 'end') {
      useDialogueStore.getState().endDialogue();
      EventBus.emit('dialogue:ended');
    }
  }
}
