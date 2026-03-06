# Adding a New Level to FrameworkIT

This guide walks through every file you need to create or modify to add a new chapter. Follow it step by step.

---

## Overview

Each level consists of:
- **Chapter metadata** (YAML)
- **Dialogue script** (YAML)
- **Puzzle definition** (YAML)
- **Component class** (TypeScript, only if introducing a new component type)
- **Component React node** (TSX, only if introducing a new component type)
- **Registration** in existing files

---

## Step 1: Content Files (YAML)

All content lives in `public/content/chapters/<chapter-id>/`.

### 1a. Chapter metadata

Create `public/content/chapters/<chapter-id>/chapter.yaml`:

```yaml
id: <chapter-id>                    # e.g. "04-api-design"
title: "The Chapter Title"
description: "One-sentence description of the problem the player solves."
npc: <npc-slug>                     # e.g. "sarah-the-sre" or "the-senior-engineer"
puzzles:
  - <puzzle-id>                     # e.g. "design-the-api"
```

### 1b. Dialogue script

Create `public/content/chapters/<chapter-id>/dialogues/<dialogue-id>.yaml`:

```yaml
id: <dialogue-id>                   # e.g. "sarah-api-intro"
startNode: start

nodes:
  start:
    id: start
    speaker: <NPC Name>
    text: "Opening line introducing the problem."
    choices:
      - text: "Tell me more"
        next: explain_problem
      - text: "Let me try!"
        next: start_puzzle

  explain_problem:
    id: explain_problem
    speaker: <NPC Name>
    text: "Deeper explanation of the concept."
    choices:
      - text: "What are the trade-offs?"
        next: tradeoffs
      - text: "I think I understand. Let me try!"
        next: start_puzzle

  tradeoffs:
    id: tradeoffs
    speaker: <NPC Name>
    text: "Discussion of key trade-offs."
    next: start_puzzle

  start_puzzle:
    id: start_puzzle
    speaker: <NPC Name>
    text: "Here's the system. Good luck!"
    action: startPuzzle              # MUST be exactly "startPuzzle"

  post_complete:                     # MUST be named "post_complete" or "post-completion"
    id: post_complete
    speaker: <NPC Name>
    text: "Congratulations message after solving the puzzle."
    choices:
      - text: "What's next?"
        next: tease_next
      - text: "Let me try again."
        next: retry
        action: startPuzzle
      - text: "Thanks!"
        next: end
        action: end

  tease_next:
    id: tease_next
    speaker: <NPC Name>
    text: "Teaser for the next chapter."
    choices:
      - text: "Let's go!"
        next: advance
        action: nextChapter          # MUST be exactly "nextChapter"
      - text: "Later."
        next: end
        action: end

  advance:
    id: advance
    speaker: <NPC Name>
    text: "Good luck with the next challenge!"
    action: nextChapter

  retry:
    id: retry
    speaker: <NPC Name>
    text: "Sure! Setting up the diagram again."
    action: startPuzzle

  end:
    id: end
    speaker: <NPC Name>
    text: "See you around!"
    action: end
```

**Key rules:**
- `action: startPuzzle` triggers the puzzle workspace
- `action: nextChapter` marks the chapter complete and advances
- `action: end` closes the dialogue
- Post-completion node MUST be named `post_complete` or `post-completion`

### 1c. Puzzle definition

Create `public/content/chapters/<chapter-id>/puzzles/<puzzle-id>.yaml`:

```yaml
id: <puzzle-id>
title: "Puzzle Title"
chapter: <chapter-id>
difficulty: 3                        # 1-5

briefing:
  npc: <npc-slug>
  text: "Brief description of what the player needs to build."

fixedComponents:                     # Pre-placed components the player cannot remove
  - id: client-pool
    type: client-pool
    position: { x: 50, y: 200 }
    config:
      requestsPerSecond: 5000
      distribution: uniform

availableComponents:                 # Components the player can add
  - type: <component-type>
    maxCount: 3
    costPerUnit: 200

objectives:
  bronze:                            # Minimum to pass
    - metric: throughput
      operator: ">="
      value: 5000
    - metric: error_rate
      operator: "<="
      value: 5
  silver:                            # Good solution
    - metric: p99_latency
      operator: "<="
      value: 200
  gold:                              # Optimal solution
    - metric: total_cost
      operator: "<="
      value: 800

simulation:
  durationSeconds: 60
  tickRateMs: 100

debrief:                             # Reflection questions after completion
  - id: what-you-did
    question: "Explain what you built and why it works."
    hint: "Think about the core concept this puzzle teaches."
  - id: tradeoffs
    question: "What trade-offs did you consider?"
    hint: "Consider cost, performance, and complexity."
```

**Available metrics:** `throughput`, `error_rate`, `p99_latency`, `p50_latency`, `p95_latency`, `total_cost`, `cache_hit_rate`, `staleness_rate`, `cache_evictions`, `db_read_throughput`, `db_write_throughput`, `replication_lag`

**Available component types (built-in):** `client-pool`, `load-balancer`, `web-server`, `cache`, `database`, `read-replica`

---

## Step 2: Register the Chapter

### 2a. GameStore - CHAPTER_ORDER

File: `src/core/GameStore.ts`

Add the chapter ID to the array:

```typescript
export const CHAPTER_ORDER = [
  '01-load-balancing',
  '02-caching',
  '03-databases',
  '04-api-design',          // <-- add here
];
```

### 2b. DialogueEngine - CHAPTER_NPC_MAP and primaryNPCs

File: `src/dialogue/DialogueEngine.ts`

Add entries in THREE places:

1. `CHAPTER_NPC_MAP` (top of file):
```typescript
'04-api-design': {
  sarah: { dialogue: 'sarah-api-intro', puzzleId: 'design-the-api' },
  // Add other NPCs if they have dialogue in this chapter
},
```

2. `primaryNPCs` object (appears in 4 methods -- update ALL of them):
```typescript
const primaryNPCs: Record<string, string> = {
  '01-load-balancing': 'sarah',
  '02-caching': 'marcus',
  '03-databases': 'sarah',
  '04-api-design': 'sarah',    // <-- add to ALL 4 copies
};
```

### 2c. App.tsx - Chapter display info

File: `src/ui/App.tsx`

Update `CHAPTER_NPC` and `CHAPTER_NUMBER`:

```typescript
const CHAPTER_NPC: Record<string, string> = {
  ...
  '04-api-design': 'Sarah',
};

const CHAPTER_NUMBER: Record<string, number> = {
  ...
  '04-api-design': 4,
};
```

---

## Step 3: New Component Type (only if needed)

Skip this step if your puzzle only uses existing component types.

### 3a. Component simulation class

Create `src/puzzle/components/<ComponentName>.ts`:

```typescript
// Implements the simulation logic for this component type.
// Look at LoadBalancer.ts, Cache.ts, or Database.ts for patterns.
```

### 3b. React node component

Create `src/puzzle/nodes/<ComponentName>Node.tsx`:

Follow the pattern in existing nodes (Handle for input/output, config controls, status display).

### 3c. Register in PuzzleWorkspace

File: `src/puzzle/PuzzleWorkspace.tsx`

1. Import the node component
2. Add to `nodeTypes`:
```typescript
const nodeTypes: NodeTypes = useMemo(() => ({
  ...
  'new-type': NewTypeNode,
}), []);
```
3. Add label to `COMPONENT_LABELS`

### 3d. Register in ComponentPalette

File: `src/puzzle/ComponentPalette.tsx`

Add to `PALETTE_ITEMS`:
```typescript
{
  type: 'new-type',
  label: 'New Component',
  color: '#ff6699',
  description: 'What it does',
},
```

Add defaults to `defaults` in `handleAdd`.

### 3e. Register in PuzzleSimulator

File: `src/puzzle/PuzzleSimulator.ts`

Add routing/processing logic for the new component type.

### 3f. Add metrics if needed

File: `src/types/index.ts`

Add new metric fields to `SimulationMetrics` interface.

---

## Step 4: New NPC (only if needed)

### 4a. Sprite pixels

File: `src/scenes/BootScene.ts`

Add pixel data arrays (head, body, legs) following the existing pattern. Register with `createPixelArtSprite`.

### 4b. WorldScene spawn

File: `src/scenes/WorldScene.ts` in `setupNPCs()`

Add conditional NPC creation (similar to how Marcus appears from Ch2 onward).

---

## Step 5: Verify

1. Run `npx tsc --noEmit` -- zero errors
2. Start the game, advance to the new chapter
3. Talk to the NPC, go through dialogue choices
4. Complete the puzzle, check all grade tiers
5. Verify debrief questions appear
6. Verify post-completion dialogue and chapter advancement work

---

## Checklist

```
[ ] public/content/chapters/<id>/chapter.yaml
[ ] public/content/chapters/<id>/dialogues/<dialogue>.yaml
[ ] public/content/chapters/<id>/puzzles/<puzzle>.yaml
[ ] src/core/GameStore.ts -- CHAPTER_ORDER
[ ] src/dialogue/DialogueEngine.ts -- CHAPTER_NPC_MAP + primaryNPCs (x4)
[ ] src/ui/App.tsx -- CHAPTER_NPC + CHAPTER_NUMBER
[ ] (if new component) src/puzzle/components/<Name>.ts
[ ] (if new component) src/puzzle/nodes/<Name>Node.tsx
[ ] (if new component) src/puzzle/PuzzleWorkspace.tsx -- nodeTypes + labels
[ ] (if new component) src/puzzle/ComponentPalette.tsx -- PALETTE_ITEMS + defaults
[ ] (if new component) src/puzzle/PuzzleSimulator.ts -- simulation logic
[ ] (if new NPC) src/scenes/BootScene.ts -- sprite pixels
[ ] (if new NPC) src/scenes/WorldScene.ts -- setupNPCs()
[ ] npx tsc --noEmit passes
[ ] Playtest the full flow
```
