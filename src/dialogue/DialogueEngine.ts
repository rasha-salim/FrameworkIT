import { loadDialogue } from '../core/ContentLoader';
import { EventBus } from '../core/EventBus';
import { useDialogueStore } from './DialogueStore';
import { useGameStore } from '../core/GameStore';
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

      if (puzzleCompleted && this.isCurrentChapterNPC(npcId, currentChapter)) {
        // This NPC's puzzle is done - show post-completion dialogue
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
    };
    return primaryNPCs[chapter] === npcId;
  }

  // Check if this NPC belongs to a chapter that's already completed
  private isNPCFromCompletedChapter(npcId: string, currentChapter: string): boolean {
    const gameState = useGameStore.getState();
    const primaryNPCs: Record<string, string> = {
      '01-load-balancing': 'sarah',
      '02-caching': 'marcus',
      '03-databases': 'sarah',
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
    };

    for (const [chapter, primaryNpc] of Object.entries(primaryNPCs)) {
      if (primaryNpc === npcId && useGameStore.getState().isChapterCompleted(chapter)) {
        return chapter;
      }
    }
    return null;
  }

  static handleAction(action: string): void {
    const gameState = useGameStore.getState();
    const currentChapter = gameState.currentChapter;

    if (action === 'startPuzzle') {
      // Dynamically resolve puzzle ID from current chapter config
      const chapterConfig = CHAPTER_NPC_MAP[currentChapter];
      if (!chapterConfig) return;

      // Find the primary NPC's puzzle for this chapter
      const primaryNPCs: Record<string, string> = {
        '01-load-balancing': 'sarah',
        '02-caching': 'marcus',
        '03-databases': 'sarah',
      };
      const primaryNpc = primaryNPCs[currentChapter];
      const config = chapterConfig[primaryNpc];
      if (!config) return;

      useDialogueStore.getState().endDialogue();
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
      };
      const primaryNpc = primaryNPCs[currentChapter];
      const config = chapterConfig[primaryNpc];

      useDialogueStore.getState().endDialogue();
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
