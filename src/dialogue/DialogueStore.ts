import { create } from 'zustand';
import type { DialogueData, DialogueNode } from '../types';

interface DialogueState {
  active: boolean;
  dialogueData: DialogueData | null;
  currentNode: DialogueNode | null;
  history: string[];

  startDialogue: (data: DialogueData) => void;
  advanceToNode: (nodeId: string) => void;
  endDialogue: () => void;
}

export const useDialogueStore = create<DialogueState>((set, get) => ({
  active: false,
  dialogueData: null,
  currentNode: null,
  history: [],

  startDialogue: (data) => {
    const startNode = data.nodes[data.startNode];
    set({
      active: true,
      dialogueData: data,
      currentNode: startNode,
      history: [data.startNode],
    });
  },

  advanceToNode: (nodeId) => {
    const { dialogueData, history } = get();
    if (!dialogueData) return;

    const node = dialogueData.nodes[nodeId];
    if (!node) return;

    set({
      currentNode: node,
      history: [...history, nodeId],
    });
  },

  endDialogue: () => {
    set({
      active: false,
      dialogueData: null,
      currentNode: null,
      history: [],
    });
  },
}));
