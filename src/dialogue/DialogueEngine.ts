import { loadDialogue } from '../core/ContentLoader';
import { EventBus } from '../core/EventBus';
import { useDialogueStore } from './DialogueStore';
import { useGameStore } from '../core/GameStore';
import type { DialogueData } from '../types';

const NPC_DIALOGUE_MAP: Record<string, { chapter: string; dialogue: string }> = {
  sarah: { chapter: '01-load-balancing', dialogue: 'sarah-intro' },
};

const POST_PUZZLE_DIALOGUE: Record<string, { chapter: string; dialogue: string }> = {
  sarah: { chapter: '01-load-balancing', dialogue: 'sarah-intro' },
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
    const puzzleCompleted = gameState.puzzleCompleted;

    const mapping = puzzleCompleted
      ? POST_PUZZLE_DIALOGUE[npcId]
      : NPC_DIALOGUE_MAP[npcId];

    if (!mapping) return;

    try {
      let data: DialogueData;

      if (puzzleCompleted) {
        data = await loadDialogue(mapping.chapter, mapping.dialogue);
        // Switch to post-completion start node if it exists
        if (data.nodes['post-completion']) {
          data = { ...data, startNode: 'post-completion' };
        }
      } else {
        data = await loadDialogue(mapping.chapter, mapping.dialogue);
      }

      useDialogueStore.getState().startDialogue(data);
    } catch (err) {
      console.error(`Failed to load dialogue for NPC ${npcId}:`, err);
    }
  }

  static handleAction(action: string): void {
    if (action === 'start-puzzle') {
      useDialogueStore.getState().endDialogue();
      useGameStore.getState().setPhase('puzzle');
      useGameStore.getState().setCurrentPuzzleId('handle-10k-rps');
      EventBus.emit('dialogue:start-puzzle', 'handle-10k-rps');
    } else if (action === 'end') {
      useDialogueStore.getState().endDialogue();
      EventBus.emit('dialogue:ended');
    }
  }
}
