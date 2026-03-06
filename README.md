# FrameworkIT

**Learn System Design by Building**

FrameworkIT is a browser-based educational game that teaches system design concepts through interactive puzzles. Players explore a server room, talk to NPCs who explain real-world infrastructure problems, then solve those problems by building architectures with drag-and-drop components.

## How It Works

1. **Explore** - Walk around a pixel-art server room using arrow keys
2. **Dialogue** - Talk to NPC engineers who explain system design challenges
3. **Build** - Drag-and-drop architecture components (load balancers, caches, databases) onto a diagram canvas
4. **Simulate** - Deploy your design and watch a discrete event simulation route thousands of requests through it
5. **Grade** - Earn Bronze/Silver/Gold based on throughput, latency, error rate, and cost objectives
6. **Reflect** - Answer debrief questions about what you built and why

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Game engine | Phaser 3 (2D world, sprites, physics) |
| UI framework | React 18 (overlays, dialogue, puzzle workspace) |
| Diagram editor | @xyflow/react (React Flow) for drag-and-drop architecture diagrams |
| State management | Zustand (GameStore, PuzzleStore, DialogueStore, AuthStore) |
| Content pipeline | YAML files loaded at runtime via js-yaml |
| Build tool | Vite |
| Language | TypeScript |

## Getting Started

### Prerequisites

- Node.js 18+
- npm

### Install and Run

```bash
cd system-design-game
npm install
npx vite          # starts dev server on http://localhost:3000
```

On WSL, if `npm install` fails with cross-filesystem errors, use:
```bash
npm install --no-bin-links
node node_modules/vite/bin/vite.js
```

### Build for Production

```bash
npm run build
npm run preview
```

## Project Structure

```
system-design-game/
  public/
    content/
      chapters/                    # All game content (YAML)
        01-load-balancing/
          chapter.yaml             # Chapter metadata
          dialogues/
            sarah-intro.yaml       # NPC dialogue tree
          puzzles/
            handle-10k-rps.yaml    # Puzzle definition
        02-caching/
        03-databases/
      components/                  # Component reference data
    favicon.svg
  src/
    auth/
      AuthStore.ts                 # Player name (localStorage)
      AuthUI.tsx                   # Name prompt screen
      AuthGuard.tsx                # Guards game behind name entry
    core/
      GameStore.ts                 # Central game state + chapter progression
      ContentLoader.ts             # YAML fetch + cache
      EventBus.ts                  # Typed pub/sub between Phaser and React
    dialogue/
      DialogueEngine.ts            # Maps NPCs to dialogues, handles actions
      DialogueStore.ts             # Current dialogue state
      DialogueUI.tsx               # Dialogue box component
    puzzle/
      PuzzleWorkspace.tsx          # React Flow canvas + top bar
      PuzzleSimulator.ts           # Discrete event simulation engine
      PuzzleValidator.ts           # Grade evaluation (bronze/silver/gold)
      PuzzleStore.ts               # Nodes, edges, simulation state
      ComponentPalette.tsx         # Draggable component sidebar
      MetricsDashboard.tsx         # Live metrics during simulation
      GradeDisplay.tsx             # Results screen
      DebriefUI.tsx                # Post-puzzle reflection questions
      components/                  # Simulation logic per component type
        types.ts                   # SimRequest, SimComponent interfaces
        ClientPool.ts              # Request generator
        LoadBalancer.ts            # Round-robin / least-connections
        WebServer.ts               # Request processor with capacity
        Cache.ts                   # Cache-aside with TTL + eviction
        Database.ts                # Primary DB with R/W latency
        ReadReplica.ts             # Read-only replica with replication lag
      nodes/                       # React Flow node components (visual)
        ClientPoolNode.tsx
        LoadBalancerNode.tsx
        WebServerNode.tsx
        CacheNode.tsx
        DatabaseNode.tsx
        ReadReplicaNode.tsx
    scenes/
      BootScene.ts                 # Pixel art sprite generation
      WorldScene.ts                # Server room world + NPC placement
    world/
      Player.ts                    # Player movement + walk animation
      NPC.ts                       # NPC idle animation + interaction
    ui/
      App.tsx                      # Root component, phase router
    types/
      index.ts                     # All shared TypeScript interfaces
    main.ts                        # Entry point (Phaser + React bootstrap)
  docs/
    ADDING-A-LEVEL.md              # Step-by-step guide for new levels
  index.html
  vite.config.ts
  tsconfig.json
  package.json
```

## Architecture

### Game Flow

```
AuthUI (name prompt)
  |
  v
WorldScene (Phaser - explore server room)
  |  arrow keys to move, space to interact with NPCs
  v
DialogueUI (React overlay - NPC conversation)
  |  action: startPuzzle
  v
PuzzleWorkspace (React Flow - build architecture)
  |  click Deploy
  v
PuzzleSimulator (discrete event simulation)
  |  simulation completes
  v
GradeDisplay (results - bronze/silver/gold/fail)
  |  if passed
  v
DebriefUI (reflection questions)
  |  continue
  v
WorldScene (back to exploring, NPC shows post-completion dialogue)
  |  action: nextChapter
  v
Next chapter unlocks
```

### Communication

- **Phaser to React**: `EventBus.emit('npc:interact', npcId)` triggers dialogue overlay
- **React to Phaser**: `EventBus.emit('puzzle:back-to-world')` returns to exploration
- **State**: Zustand stores are the single source of truth, accessed by both Phaser scenes and React components

### Simulation Engine

The `PuzzleSimulator` converts the player's React Flow diagram into a simulation graph:

1. Each node becomes a `SimComponent` with `process(requests, tick)` logic
2. Edges define routing between components
3. Requests flow from ClientPool through the graph each tick
4. Components apply latency, capacity limits, caching, load distribution
5. After all ticks complete, metrics are calculated and compared against puzzle objectives

### Persistence

All data is stored in `localStorage`:
- `player-name` - Player display name
- `completed-chapters` - JSON array of completed chapter IDs
- `puzzle-best-grade-{chapter}` - Best grade per chapter
- `debrief-{chapter}` - Debrief answers per chapter

## Current Chapters

| # | Chapter | Concept | NPC |
|---|---------|---------|-----|
| 1 | Load Balancing | Horizontal scaling, request distribution | Sarah |
| 2 | Caching | Cache-aside, TTL, eviction policies | Marcus |
| 3 | Databases | Read replicas, replication lag, read/write splitting | Sarah |

## Adding New Levels

See [docs/ADDING-A-LEVEL.md](docs/ADDING-A-LEVEL.md) for the complete step-by-step guide and checklist.

For a deeper reference on the content format and simulation internals, see [docs/LEVEL-ARCHITECTURE.md](docs/LEVEL-ARCHITECTURE.md).

## Optional: LLM Feedback

Set `VITE_LLM_API_KEY` in a `.env` file to enable AI-powered feedback on debrief answers:

```
VITE_LLM_API_KEY=your-anthropic-api-key
```

When configured, a "Get AI Feedback" button appears after submitting debrief answers.

## License

Private project.
