import yaml from 'js-yaml';
import type { DialogueData, PuzzleData, SDPuzzleData } from '../types';

const cache = new Map<string, unknown>();

async function loadYaml<T>(path: string): Promise<T> {
  if (cache.has(path)) {
    return cache.get(path) as T;
  }

  const response = await fetch(path);
  if (!response.ok) {
    throw new Error(`Failed to load ${path}: ${response.status} ${response.statusText}`);
  }

  const text = await response.text();
  const data = yaml.load(text) as T;
  cache.set(path, data);
  return data;
}

export async function loadDialogue(chapterId: string, dialogueId: string): Promise<DialogueData> {
  return loadYaml<DialogueData>(
    `/content/chapters/${chapterId}/dialogues/${dialogueId}.yaml`
  );
}

export async function loadPuzzle(chapterId: string, puzzleId: string): Promise<PuzzleData> {
  return loadYaml<PuzzleData>(
    `/content/chapters/${chapterId}/puzzles/${puzzleId}.yaml`
  );
}

export async function loadSDPuzzle(chapterId: string, puzzleId: string): Promise<SDPuzzleData> {
  return loadYaml<SDPuzzleData>(
    `/content/chapters/${chapterId}/puzzles/${puzzleId}.yaml`
  );
}

export function clearCache(): void {
  cache.clear();
}
