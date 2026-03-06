# Level Architecture Reference

This document covers the internals of how levels work in FrameworkIT: content formats, simulation engine, component system, dialogue mechanics, and the full lifecycle of a chapter.

For the step-by-step guide on adding a new level, see [ADDING-A-LEVEL.md](ADDING-A-LEVEL.md).

---

## Table of Contents

1. [Chapter Lifecycle](#chapter-lifecycle)
2. [Content Pipeline](#content-pipeline)
3. [YAML Schema Reference](#yaml-schema-reference)
4. [Simulation Engine](#simulation-engine)
5. [Component System](#component-system)
6. [Dialogue System](#dialogue-system)
7. [Grading System](#grading-system)
8. [Debrief System](#debrief-system)
9. [NPC System](#npc-system)
10. [State Management](#state-management)

---

## Chapter Lifecycle

A chapter progresses through these phases (defined in `src/types/index.ts`):

```
exploring -> dialogue -> puzzle -> results -> debrief -> exploring
```

| Phase | What happens | Controlled by |
|-------|-------------|---------------|
| `exploring` | Player walks the server room, approaches NPCs | WorldScene (Phaser) |
| `dialogue` | NPC dialogue tree with choices | DialogueEngine + DialogueUI |
| `puzzle` | Player builds architecture on React Flow canvas | PuzzleWorkspace |
| `results` | Simulation runs, grade displayed | PuzzleSimulator + GradeDisplay |
| `debrief` | Reflection questions (only on pass) | DebriefUI |
| `exploring` | Returns to world, NPC shows post-completion dialogue | WorldScene |

Phase transitions are managed by `GameStore.setPhase()`. The `App.tsx` component renders the appropriate overlay for each phase.

---

## Content Pipeline

All level content lives in `public/content/chapters/<chapter-id>/` as YAML files. At runtime, `ContentLoader.ts` fetches and parses them using `js-yaml`.

### Directory structure per chapter

```
public/content/chapters/<chapter-id>/
  chapter.yaml                    # Metadata
  dialogues/
    <dialogue-id>.yaml            # Dialogue tree
  puzzles/
    <puzzle-id>.yaml              # Puzzle definition
```

### How content is loaded

1. `DialogueEngine` calls `loadDialogue(chapterId, dialogueId)` when NPC interaction starts
2. `PuzzleWorkspace` calls `loadPuzzle(chapterId, puzzleId)` when puzzle phase begins
3. `ContentLoader` fetches the YAML, parses it, and caches the result in memory

The content loader (`src/core/ContentLoader.ts`) maintains a `Map<string, unknown>` cache so each file is fetched only once per session.

---

## YAML Schema Reference

### chapter.yaml

```yaml
id: "01-load-balancing"           # Must match directory name
title: "The Load Balancing Crisis"
description: "Our single server is crashing under peak load."
npc: "sarah-the-sre"             # NPC slug (display purposes)
puzzles:
  - "handle-10k-rps"             # References puzzles/<id>.yaml
```

TypeScript type: `ChapterMeta` in `src/types/index.ts`

### Dialogue YAML

```yaml
id: "sarah-intro"
startNode: start                  # Which node to show first

nodes:
  start:
    id: start
    speaker: "Sarah"
    text: "Hey! We have a problem..."
    choices:
      - text: "Tell me more"
        next: explain              # Jump to node with this id
      - text: "Let me try!"
        next: start_puzzle

  explain:
    id: explain
    speaker: "Sarah"
    text: "Our server handles 2k req/s but we're getting 10k."
    next: start_puzzle             # Auto-advance (no choices)

  start_puzzle:
    id: start_puzzle
    speaker: "Sarah"
    text: "Here's the system. Good luck!"
    action: startPuzzle            # Triggers puzzle phase
```

TypeScript type: `DialogueData` with `DialogueNode` and `DialogueChoice` in `src/types/index.ts`

**Actions** (set on a node or choice):
| Action | Effect |
|--------|--------|
| `startPuzzle` | Sets `GameStore.phase = 'puzzle'` and loads the puzzle |
| `nextChapter` | Marks chapter complete, advances to next chapter |
| `end` | Closes dialogue, returns to exploring |

**Required nodes for post-completion flow:**
- `post_complete` or `post-completion` - Shown when the player talks to the NPC after completing the puzzle. This must exist for the flow to work correctly.

### Puzzle YAML

```yaml
id: "handle-10k-rps"
title: "Handle 10,000 Requests Per Second"
chapter: "01-load-balancing"
difficulty: 2                      # 1-5 (display only)

briefing:
  npc: "sarah-the-sre"
  text: "Our single server is crashing under load..."

fixedComponents:                   # Pre-placed, player cannot remove
  - id: client-pool
    type: client-pool
    position: { x: 50, y: 300 }
    config:
      requestsPerSecond: 10000
      distribution: uniform

  - id: existing-server
    type: web-server
    position: { x: 600, y: 300 }
    config:
      maxRPS: 2000
      baseLatencyMs: 20

availableComponents:               # Player can add from palette
  - type: load-balancer
    maxCount: 2                    # Maximum instances
    costPerUnit: 150               # Cost per instance (for total_cost metric)
  - type: web-server
    maxCount: 8
    costPerUnit: 100

objectives:
  bronze:                          # Must pass ALL conditions to earn bronze
    - metric: throughput
      operator: ">="
      value: 10000
    - metric: error_rate
      operator: "<="
      value: 5
  silver:                          # Must also pass bronze + ALL silver conditions
    - metric: p99_latency
      operator: "<="
      value: 200
  gold:                            # Must also pass bronze + silver + ALL gold conditions
    - metric: total_cost
      operator: "<="
      value: 800

simulation:
  durationSeconds: 60              # How long the simulation runs
  tickRateMs: 100                  # Tick interval (100ms = 10 ticks/second)

debrief:                           # Reflection questions shown after passing
  - id: what-you-did
    question: "Explain what you built and why it works."
    hint: "Think about horizontal scaling."
  - id: tradeoffs
    question: "What trade-offs did you consider?"
    hint: "Consider cost vs. performance."
```

TypeScript type: `PuzzleData` in `src/types/index.ts`

---

## Simulation Engine

The simulation engine (`src/puzzle/PuzzleSimulator.ts`) converts the player's React Flow diagram into a running simulation.

### How it works

1. **Validation** - Checks that a client pool exists and is connected to something
2. **Build** - Each React Flow node becomes a `SimComponent` instance. Edge connections become the component's `connectedTargets`
3. **Tick loop** - Runs `totalTicks` iterations (durationSeconds * 1000 / tickRateMs)
4. **Per tick**:
   - ClientPool generates `requestsPerSecond / ticksPerSecond` requests
   - Requests are routed through the graph recursively via `processComponent()`
   - Each component applies its logic (latency, capacity, caching, routing)
   - Tick metrics are collected and stored
5. **Completion** - Final metrics calculated (percentiles, rates), grade evaluated

### Request routing

Routing is recursive and component-type-aware:

- **Load Balancer**: Distributes requests to connected targets using its algorithm, then recursively processes at each target
- **Cache**: Processes requests (hit/miss), returns hits immediately, routes misses downstream
- **Web Server / Database / Read Replica**: Processes with capacity limits, then forwards to any downstream connections

Each `SimRequest` accumulates latency as it passes through components. If a component is over capacity, the request is marked `dropped`.

### Tick timing

The simulation uses `requestAnimationFrame` for smooth visual updates. Node visuals (load indicators, hit rates) are updated every 5 ticks.

---

## Component System

Each component type has two parts:

1. **Simulation class** (`src/puzzle/components/`) - Implements `SimComponent` interface
2. **React Flow node** (`src/puzzle/nodes/`) - Visual representation with handles

### SimComponent Interface

```typescript
// src/puzzle/components/types.ts

interface SimRequest {
  id: string;
  sourceId: string;
  type: 'read' | 'write';
  latencyMs: number;           // Accumulated latency
  dropped: boolean;
  cached: boolean;
  processedBy: string | null;  // Last component that processed this
}

interface ComponentState {
  processedThisTick: number;
  totalProcessed: number;
  totalDropped: number;
}

interface SimComponent {
  id: string;
  type: string;
  state: ComponentState;
  process(requests: SimRequest[], tick: number): SimRequest[];
  getConnectedTargets(): string[];
  setConnectedTargets(targets: string[]): void;
  reset(): void;
}
```

### Built-in Component Types

| Type | Class | Behavior |
|------|-------|----------|
| `client-pool` | `ClientPoolComponent` | Generates N requests per tick. Configurable read/write ratio. |
| `load-balancer` | `LoadBalancerComponent` | Distributes requests to targets. Algorithms: `round-robin`, `least-connections`, `random`. |
| `web-server` | `WebServerComponent` | Processes requests up to `maxRPS` capacity. Adds `baseLatencyMs`. Drops excess. |
| `cache` | `CacheComponent` | Cache-aside strategy. TTL-based expiry. LRU/FIFO eviction. Hit = fast, miss = forward downstream. |
| `database` | `DatabaseComponent` | Separate read/write latency and capacity. Connection pool limits. |
| `read-replica` | `ReadReplicaComponent` | Read-only. Lower latency. Configurable replication lag. |

### Creating a New Component Type

When a puzzle needs a component that doesn't exist yet:

**1. Simulation class** - Create `src/puzzle/components/NewComponent.ts`:

```typescript
import type { SimComponent, SimRequest, ComponentState } from './types';

export class NewComponentClass implements SimComponent {
  id: string;
  type = 'new-type';
  state: ComponentState & { /* extra state fields */ };
  private targets: string[] = [];

  constructor(id: string, /* config params */) {
    this.id = id;
    this.state = {
      processedThisTick: 0,
      totalProcessed: 0,
      totalDropped: 0,
      // initialize extra fields
    };
  }

  process(requests: SimRequest[], tick: number): SimRequest[] {
    this.state.processedThisTick = 0;
    // Process each request: add latency, check capacity, etc.
    return requests;
  }

  getConnectedTargets(): string[] { return this.targets; }
  setConnectedTargets(targets: string[]): void { this.targets = targets; }
  reset(): void { /* reset state */ }
}
```

**2. React Flow node** - Create `src/puzzle/nodes/NewComponentNode.tsx`:

All nodes follow a consistent visual pattern:
- 10px border radius, dark background (#0f1428)
- Colored left border (4px) and subtle border (#2a3355)
- Icon badge (top-right, 20x20, rounded)
- 12px handles with colored borders and glow on connection
- Status indicators that update during simulation

```typescript
import React from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';

export const NewComponentNode: React.FC<NodeProps> = ({ data }) => {
  return (
    <div style={{
      background: '#0f1428',
      border: '1px solid #2a3355',
      borderLeft: '4px solid #ff6699',
      borderRadius: 10,
      padding: '10px 14px',
      minWidth: 160,
      fontFamily: 'monospace',
      fontSize: 12,
      color: '#ccddeeff',
      position: 'relative',
    }}>
      <Handle type="target" position={Position.Left}
        style={{ width: 12, height: 12, background: '#0f1428',
                 border: '2px solid #ff6699', borderRadius: '50%' }} />

      {/* Content */}
      <div style={{ fontWeight: 700, marginBottom: 4 }}>
        {data.label as string}
      </div>

      <Handle type="source" position={Position.Right}
        style={{ width: 12, height: 12, background: '#0f1428',
                 border: '2px solid #ff6699', borderRadius: '50%' }} />
    </div>
  );
};
```

**3. Register everywhere** (see [ADDING-A-LEVEL.md](ADDING-A-LEVEL.md) Step 3 for the full list):
- `PuzzleWorkspace.tsx` - `nodeTypes` and `COMPONENT_LABELS`
- `ComponentPalette.tsx` - `PALETTE_ITEMS` and `defaults` in `handleAdd`
- `PuzzleSimulator.ts` - `buildComponents()` switch case and `processComponent()` routing logic

---

## Dialogue System

### How dialogue flows

1. Player presses Space near an NPC in `WorldScene`
2. `EventBus.emit('npc:interact', npcId)` fires
3. `DialogueEngine.handleInteraction(npcId)` determines which dialogue to load based on the current chapter and NPC state
4. Dialogue YAML is loaded, `DialogueStore` is populated, `GameStore.phase` set to `'dialogue'`
5. `DialogueUI` renders the conversation tree
6. When a node has `action: startPuzzle`, `DialogueEngine.handleAction()` transitions to puzzle phase

### DialogueEngine internals

The engine (`src/dialogue/DialogueEngine.ts`) uses three key data structures:

**CHAPTER_NPC_MAP** - Maps each chapter to its NPCs and their dialogue/puzzle configs:
```typescript
{
  '01-load-balancing': {
    sarah: { dialogue: 'sarah-intro', puzzleId: 'handle-10k-rps' }
  },
  '02-caching': {
    marcus: { dialogue: 'senior-engineer-intro', puzzleId: 'cache-the-dashboard' },
    sarah: { dialogue: 'sarah-intro', puzzleId: 'handle-10k-rps' }
  }
}
```

**primaryNPCs** - Maps each chapter to its primary NPC (the one who introduces the new puzzle):
```typescript
{
  '01-load-balancing': 'sarah',
  '02-caching': 'marcus',
  '03-databases': 'sarah'
}
```

Note: `primaryNPCs` is duplicated in 4 methods. When adding a chapter, you must update ALL 4 copies.

### NPC dialogue resolution

When a player talks to an NPC, the engine determines what to show:

1. **Is this the current chapter's primary NPC?**
   - If puzzle not completed -> show chapter intro dialogue
   - If puzzle completed -> show `post_complete` node
2. **Is this an NPC from a completed chapter?**
   - Show that chapter's `post_complete` node
3. **NPC not relevant to current state?**
   - Show generic greeting or nothing

---

## Grading System

Grading is handled by `PuzzleValidator.evaluate()` in `src/puzzle/PuzzleValidator.ts`.

### How grades are calculated

Grades are cumulative. To earn a higher grade, you must meet ALL conditions of lower grades too:

1. Check all `bronze` conditions. If any fails -> `'none'` (fail)
2. Check all `silver` conditions. If any fails -> `'bronze'`
3. Check all `gold` conditions. If any fails -> `'silver'`
4. All pass -> `'gold'`

### Available metrics

These metric names can be used in puzzle objective conditions:

| YAML metric name | SimulationMetrics field | Description |
|-----------------|----------------------|-------------|
| `throughput` | `throughput` | Successful requests per second |
| `error_rate` | `errorRate` | Percentage of dropped requests |
| `p50_latency` | `p50Latency` | 50th percentile latency (ms) |
| `p95_latency` | `p95Latency` | 95th percentile latency (ms) |
| `p99_latency` | `p99Latency` | 99th percentile latency (ms) |
| `total_cost` | `totalCost` | Sum of all component costs |
| `cache_hit_rate` | `cacheHitRate` | Cache hit percentage |
| `staleness_rate` | `stalenessRate` | Percentage of stale cache hits |
| `cache_evictions` | `cacheEvictions` | Total cache evictions |
| `db_read_throughput` | `dbReadThroughput` | Database reads per second |
| `db_write_throughput` | `dbWriteThroughput` | Database writes per second |
| `replication_lag` | `replicationLag` | Replica lag in milliseconds |

### Available operators

`>=`, `<=`, `>`, `<`, `==`

### Adding new metrics

1. Add the field to `SimulationMetrics` in `src/types/index.ts`
2. Calculate it in `PuzzleSimulator.ts` at simulation completion
3. Add the YAML name -> field mapping in `PuzzleValidator.ts`

---

## Debrief System

After a successful puzzle completion, players answer 1-2 reflection questions defined in the puzzle YAML's `debrief` array.

### Flow

1. `GradeDisplay` shows the grade. On pass, clicking "Continue" sets phase to `'debrief'`
2. `DebriefUI` renders the questions with text areas
3. Players write answers (minimum 10 characters each)
4. Optional: "Get AI Feedback" button (visible only when `VITE_LLM_API_KEY` is set)
5. On "Continue", answers are saved to `localStorage` as `debrief-{chapter}`, the grade is persisted, and phase returns to `'exploring'`

### Question format

```yaml
debrief:
  - id: what-you-did          # Unique within the puzzle
    question: "Explain what you built and why."
    hint: "Think about the core concept."   # Optional, toggleable
```

Each question shows an expandable hint to guide the player's thinking without giving away the answer.

---

## NPC System

### Sprite creation

NPCs are rendered as pixel art sprites generated procedurally in `BootScene.ts`. Each NPC has:
- Head pixel data (hair, face, skin color)
- Body pixel data (shirt/outfit)
- Legs pixel data (pants, shoes)

These are composed into a 32x48 texture using `createPixelArtSprite()`.

### Adding a new NPC

1. **Define pixel data** in `src/scenes/BootScene.ts` - Create head/body/legs arrays following existing patterns (Sarah, Marcus)
2. **Spawn in world** in `src/scenes/WorldScene.ts` `setupNPCs()` - Set position, name label, and visibility conditions (e.g., "appears from chapter 2 onward")
3. **Register dialogues** in `DialogueEngine.ts` - Add to `CHAPTER_NPC_MAP` and `primaryNPCs`
4. **Add display info** in `App.tsx` - Add to `CHAPTER_NPC` and `CHAPTER_NUMBER` maps

### NPC behavior

- Idle breathing animation (sine wave tween, 3px vertical bob)
- "Press SPACE" prompt when player is nearby
- Name label with text stroke for readability
- Interaction triggers `EventBus.emit('npc:interact', npcId)`

---

## State Management

Four Zustand stores manage all game state:

### GameStore (`src/core/GameStore.ts`)
- `phase` - Current game phase
- `currentChapter` - Active chapter ID
- `currentPuzzleId` - Active puzzle ID (null when not in puzzle)
- `puzzleCompleted` - Whether current chapter's puzzle has been completed
- `bestGrade` - Best grade for current chapter
- `completedChapters` - Array of completed chapter IDs
- Derived from `localStorage` on initialization

### PuzzleStore (`src/puzzle/PuzzleStore.ts`)
- `nodes` / `edges` - React Flow graph state
- `puzzleData` - Loaded puzzle YAML data
- `simulationState` - Running/completed/tick/metrics/grade
- `componentCounts` - Track how many of each type placed (enforces `maxCount`)

### DialogueStore (`src/dialogue/DialogueStore.ts`)
- `currentDialogue` - Loaded dialogue data
- `currentNodeId` - Which dialogue node is active
- `isOpen` - Whether dialogue overlay is visible

### AuthStore (`src/auth/AuthStore.ts`)
- `playerName` - Player's display name
- `initialized` - Whether localStorage has been checked
- Persists to `localStorage` key `player-name`

---

## Design Decisions

### Why YAML over JSON?
YAML is more readable for content authors. Dialogue trees with multi-line text and nested choices are much cleaner in YAML than JSON. The `js-yaml` parser adds minimal bundle size.

### Why Phaser + React instead of pure React?
The server room exploration benefits from Phaser's sprite system, physics, and camera. The puzzle workspace benefits from React's component model and React Flow's mature diagram library. The `EventBus` bridges the two cleanly.

### Why localStorage instead of a backend?
Keeps the game self-contained and instantly deployable. No server infrastructure needed. Progress persists across browser sessions. Easy to extend to cloud sync later if needed.

### Why discrete event simulation?
Simulating actual request routing through the player's architecture makes the learning tangible. Players see their design succeed or fail under realistic conditions, not just pass a static check.
