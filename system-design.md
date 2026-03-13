# FrameworkIT - System Design Diagram

- **Project**: system-design-game
- **Path**: `/mnt/c/users/rasha/frameworkit/System Design/system-design-game`
- **Generated**: 2026-03-13
- **Tool**: CMIW (Components, Maps, Interactions, Workflows)

```mermaid
graph LR

    %% ── Entry Point ──
    subgraph entry["Entry"]
        main["main.ts"]
    end

    %% ── Auth Layer ──
    subgraph auth["Auth"]
        AuthGuard["AuthGuard"]
        AuthUI["AuthUI"]
        AuthStore["AuthStore"]
    end

    %% ── Core Layer ──
    subgraph core["Core"]
        GameStore["GameStore"]
        EventBus["EventBus"]
        ContentLoader["ContentLoader"]
    end

    %% ── Types ──
    subgraph types["Types"]
        TypesIndex["types/index.ts"]
        SimRequest(("SimRequest"))
        SimComponent(("SimComponent"))
        ComponentState(("ComponentState"))
    end

    %% ── UI Layer ──
    subgraph ui["UI"]
        App["App"]
        TrackSelect["TrackSelectScreen"]
        ChapterDash["ChapterDashboard"]
    end

    %% ── Dialogue Layer ──
    subgraph dialogue["Dialogue"]
        DialogueEngine["DialogueEngine"]
        DialogueStore["DialogueStore"]
        DialogueUI["DialogueUI"]
    end

    %% ── Puzzle Workspace ──
    subgraph workspace["Puzzle Workspace"]
        PuzzleWorkspace["PuzzleWorkspace"]
        PuzzleStore["PuzzleStore"]
        PuzzleSimulator["PuzzleSimulator"]
        PuzzleValidator["PuzzleValidator"]
        ComponentPalette["ComponentPalette"]
        MetricsDash["MetricsDashboard"]
        GradeDisplay["GradeDisplay"]
        DebriefUI["DebriefUI"]
    end

    %% ── Simulation Components ──
    subgraph sim["Simulation Components"]
        ClientPool["ClientPool"]
        LoadBalancer["LoadBalancer"]
        WebServer["WebServer"]
        Cache["Cache"]
        Database["Database"]
        ReadReplica["ReadReplica"]
        RateLimiter["RateLimiter"]
        SessionStore["SessionStore"]
        ShardRouter["ShardRouter"]
    end

    %% ── React Flow Nodes ──
    subgraph nodes["React Flow Nodes"]
        ClientPoolNode["ClientPoolNode"]
        LBNode["LoadBalancerNode"]
        WSNode["WebServerNode"]
        CacheNode["CacheNode"]
        DBNode["DatabaseNode"]
        RRNode["ReadReplicaNode"]
        RLNode["RateLimiterNode"]
        SSNode["SessionStoreNode"]
        SRNode["ShardRouterNode"]
    end

    %% ── Entry imports ──
    main --> App
    main --> AuthGuard
    main --> DialogueEngine
    main --> AuthStore

    %% ── Auth imports ──
    AuthGuard --> AuthStore
    AuthGuard --> AuthUI
    AuthUI --> AuthStore

    %% ── UI imports ──
    App --> GameStore
    App --> DialogueUI
    App --> PuzzleWorkspace
    App --> GradeDisplay
    App --> DebriefUI
    App --> TrackSelect
    App --> ChapterDash
    ChapterDash --> GameStore
    ChapterDash --> AuthStore
    ChapterDash --> EventBus
    TrackSelect --> GameStore
    TrackSelect --> AuthStore

    %% ── Dialogue imports ──
    DialogueEngine --> ContentLoader
    DialogueEngine --> EventBus
    DialogueEngine --> DialogueStore
    DialogueEngine --> GameStore
    DialogueEngine --> PuzzleStore
    DialogueUI --> DialogueStore
    DialogueUI --> DialogueEngine
    DialogueUI --> GameStore
    DialogueUI --> EventBus

    %% ── Puzzle Workspace imports ──
    PuzzleWorkspace --> PuzzleStore
    PuzzleWorkspace --> ComponentPalette
    PuzzleWorkspace --> MetricsDash
    PuzzleWorkspace --> PuzzleSimulator
    PuzzleWorkspace --> ContentLoader
    PuzzleWorkspace --> GameStore
    PuzzleWorkspace -->|"9 nodes"| nodes
    ComponentPalette --> PuzzleStore
    MetricsDash --> PuzzleStore
    GradeDisplay --> PuzzleStore
    GradeDisplay --> GameStore
    GradeDisplay --> EventBus
    DebriefUI --> PuzzleStore
    DebriefUI --> GameStore
    DebriefUI --> EventBus

    %% ── Simulator imports ──
    PuzzleSimulator --> PuzzleStore
    PuzzleSimulator --> PuzzleValidator
    PuzzleSimulator -->|"8 components"| sim

    %% ── Implements SimComponent ──
    ClientPool -.->|implements| SimComponent
    LoadBalancer -.->|implements| SimComponent
    WebServer -.->|implements| SimComponent
    Cache -.->|implements| SimComponent
    Database -.->|implements| SimComponent
    ReadReplica -.->|implements| SimComponent
    RateLimiter -.->|implements| SimComponent
    SessionStore -.->|implements| SimComponent
    ShardRouter -.->|implements| SimComponent

    %% ── Type imports ──
    ContentLoader --> TypesIndex
    GameStore --> TypesIndex
    DialogueStore --> TypesIndex
    PuzzleStore --> TypesIndex
    PuzzleValidator --> TypesIndex
    sim --> SimRequest
    sim --> ComponentState

    %% ── Node -> Store ──
    CacheNode --> PuzzleStore
    LBNode --> PuzzleStore
    RLNode --> PuzzleStore
    SSNode --> PuzzleStore
    SRNode --> PuzzleStore

    %% ── Calls ──
    PuzzleSimulator -->|calls| PuzzleValidator
    DialogueEngine -->|calls| EventBus

    %% ── Security Grade ──
    security["Security: A (100/100)"]

    %% ── Styling ──
    style entry fill:#1a2040,stroke:#4488ff,color:#e0e8f0
    style auth fill:#1a2020,stroke:#44cc66,color:#e0e8f0
    style core fill:#1a2040,stroke:#4488ff,color:#e0e8f0
    style types fill:#201a30,stroke:#aa88ff,color:#e0e8f0
    style ui fill:#1a2040,stroke:#4488ff,color:#e0e8f0
    style dialogue fill:#201a20,stroke:#cc66aa,color:#e0e8f0
    style workspace fill:#1a2030,stroke:#4488ff,color:#e0e8f0
    style sim fill:#1a2520,stroke:#22ccaa,color:#e0e8f0
    style nodes fill:#201a18,stroke:#dd8844,color:#e0e8f0
    style security fill:#1a3020,stroke:#44cc66,color:#44cc66
```

## Legend

| Shape | Meaning |
|-------|---------|
| `["Name"]` rectangle | Class, component, or file |
| `(("Name"))` circle | Interface |
| `-->` solid arrow | Imports |
| `-.->` dashed arrow | Implements |
| `-->\|calls\|` labeled arrow | Function call |
| Collapsed edge `\|"N items"\|` | Multiple edges between clusters |

## Key Metrics

| Metric | Value |
|--------|-------|
| Total components | 109 |
| Total relationships | 99 |
| Clusters | 11 |
| Circular dependencies | 0 |
| Security grade | **A** (100/100) |

### Top 5 Most-Connected Components (Hubs)

| Component | Connections | Role |
|-----------|------------|------|
| PuzzleWorkspace | 16 | Orchestrates puzzle UI, nodes, simulator |
| PuzzleSimulator | 14 | Wires all sim components + validator |
| PuzzleStore | 13 | Central state for puzzle phase |
| types/index.ts | 10 | Shared type definitions |
| GameStore | 9 | Global game state + chapter progression |

### Architecture Summary

- **No circular dependencies** -- clean dependency graph
- **SimComponent interface** is the backbone of the simulation layer, with 9 implementations (one per infrastructure component type)
- **PuzzleSimulator** is the most complex file, importing all 8 simulation components + validator
- **PuzzleStore** is the most depended-on store (13 connections), used by workspace, palette, nodes, simulator, grade display, debrief, and metrics
- **EventBus** decouples the dialogue/chapter flow from the UI layer
