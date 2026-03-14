import React, { useState } from 'react';
import { useGameStore, CHAPTER_ORDER, SD_CHAPTER_ORDER, getChapterOrder } from '../core/GameStore';
import { useAuthStore } from '../auth/AuthStore';
import { EventBus } from '../core/EventBus';

interface ChapterInfo {
  id: string;
  number: number;
  title: string;
  description: string;
  npc: string;
  npcRole: string;
  status: 'locked' | 'available' | 'in-progress' | 'completed';
  grade: string | null;
}

const CHAPTER_META: Record<string, { title: string; description: string; npc: string; npcRole: string }> = {
  // System Design chapters
  '01-load-balancing': {
    title: 'The Traffic Spike',
    description: 'Handle 10,000 requests per second by distributing traffic across multiple servers.',
    npc: 'Sarah',
    npcRole: 'SRE',
  },
  '02-caching': {
    title: 'The Slow Dashboard',
    description: 'Speed up a dashboard hitting the database on every request using an in-memory cache.',
    npc: 'Marcus',
    npcRole: 'Senior Engineer',
  },
  '03-databases': {
    title: 'The Database Bottleneck',
    description: 'Scale database reads with replicas while managing replication lag trade-offs.',
    npc: 'Sarah',
    npcRole: 'SRE',
  },
  '04-rate-limiting': {
    title: 'Protect the API',
    description: 'Filter abusive traffic with token bucket rate limiting while preserving legitimate users.',
    npc: 'Marcus',
    npcRole: 'Senior Engineer',
  },
  '05-sessions': {
    title: 'The Lost Cart',
    description: 'Fix disappearing shopping carts by adding a shared session store for stateless servers.',
    npc: 'Sarah',
    npcRole: 'SRE',
  },
  '06-partitioning': {
    title: 'Going Global',
    description: 'Split the database across regional clusters to handle multi-city scale.',
    npc: 'Marcus',
    npcRole: 'Senior Engineer',
  },
  // Software Design chapters
  'sd-01-solid': {
    title: 'The Startup That Couldn\'t Ship',
    description: 'Untangle a 2,400-line UserService by applying SOLID principles to a messy codebase.',
    npc: 'Marcus',
    npcRole: 'Architect',
  },
  'sd-02-patterns': {
    title: 'The Shape of the Solution',
    description: 'Refactor rigid code into flexible patterns -- Factory, Builder, Adapter, Decorator.',
    npc: 'Priya',
    npcRole: 'Tech Lead',
  },
  'sd-03-refactoring': {
    title: 'The Legacy Rescue',
    description: 'Rescue a god class with 28 methods using extract, move, and inject refactorings.',
    npc: 'Priya',
    npcRole: 'Tech Lead',
  },
  'sd-04-orchestration': {
    title: 'The Workflow That Grew Teeth',
    description: 'Design a workflow engine using Strategy, Specification, and Observer patterns.',
    npc: 'Omar',
    npcRole: 'Domain Expert',
  },
  'sd-05-architecture': {
    title: 'Monolith\'s Last Stand',
    description: 'Assign components to architecture layers and wire ports to adapters.',
    npc: 'Marcus',
    npcRole: 'Architect',
  },
  'sd-06-ddd': {
    title: 'The Business Nobody Understood',
    description: 'Model aggregate boundaries, classify entities vs value objects, and wire domain events.',
    npc: 'Omar',
    npcRole: 'Domain Expert',
  },
};

const GRADE_COLORS: Record<string, string> = {
  bronze: '#cd7f32',
  silver: '#c0c0c0',
  gold: '#ffd700',
};

export const ChapterDashboard: React.FC = () => {
  const currentChapter = useGameStore((s) => s.currentChapter);
  const completedChapters = useGameStore((s) => s.completedChapters);
  const selectedTrack = useGameStore((s) => s.selectedTrack);
  const backToTrackSelect = useGameStore((s) => s.backToTrackSelect);
  const playerName = useAuthStore((s) => s.playerName);
  const clearPlayer = useAuthStore((s) => s.clearPlayer);
  const [hoveredChapter, setHoveredChapter] = useState<string | null>(null);

  const trackChapterOrder = getChapterOrder(selectedTrack);
  const trackLabel = selectedTrack === 'software-design' ? 'Software Design' : 'System Design';
  const accentColor = selectedTrack === 'software-design' ? '#aa66ff' : '#4488ff';

  const chapters: ChapterInfo[] = trackChapterOrder.map((id, index) => {
    const meta = CHAPTER_META[id];
    const isCompleted = completedChapters.includes(id);
    const isCurrent = id === currentChapter;
    const grade = localStorage.getItem(`puzzle-best-grade-${id}`);

    // A chapter is available if it's the current one or completed
    // Locked if it comes after the current chapter and isn't completed
    let status: ChapterInfo['status'];
    if (isCompleted) {
      status = 'completed';
    } else if (isCurrent) {
      status = grade ? 'in-progress' : 'available';
    } else {
      // Check if the previous chapter is completed
      const prevCompleted = index === 0 || completedChapters.includes(trackChapterOrder[index - 1]);
      status = prevCompleted ? 'available' : 'locked';
    }

    return {
      id,
      number: index + 1,
      title: meta?.title || id,
      description: meta?.description || '',
      npc: meta?.npc || 'NPC',
      npcRole: meta?.npcRole || '',
      status,
      grade,
    };
  });

  const handleChapterClick = (chapter: ChapterInfo) => {
    if (chapter.status === 'locked') return;

    // Load grade/debrief state for selected chapter
    const grade = localStorage.getItem(`puzzle-best-grade-${chapter.id}`);
    const debriefDone = localStorage.getItem(`debrief-completed-${chapter.id}`) === 'true';
    useGameStore.setState({
      currentChapter: chapter.id,
      puzzleCompleted: grade !== null,
      bestGrade: grade,
      debriefCompleted: debriefDone,
    });

    // Trigger NPC interaction
    const npcId = chapter.npc.toLowerCase();
    EventBus.emit('npc:interact', npcId);
    useGameStore.getState().setPhase('dialogue');
  };

  const completedCount = completedChapters.length;
  const totalCount = CHAPTER_ORDER.length;

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background: '#0a0e1a',
        display: 'flex',
        flexDirection: 'column',
        fontFamily: 'monospace',
        pointerEvents: 'auto',
        overflow: 'auto',
      }}
    >
      {/* Background grid */}
      <div
        style={{
          position: 'fixed',
          inset: 0,
          backgroundImage:
            'linear-gradient(rgba(68, 136, 255, 0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(68, 136, 255, 0.02) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
          pointerEvents: 'none',
        }}
      />

      {/* Top bar */}
      <div
        style={{
          position: 'relative',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '16px 32px',
          borderBottom: '1px solid #1a2040',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <span style={{ fontSize: 11, color: '#4488ff', textTransform: 'uppercase', letterSpacing: 3 }}>
            FrameworkIT
          </span>
          <span style={{ fontSize: 11, color: '#334455' }}>|</span>
          <span style={{ fontSize: 11, color: '#556677' }}>{trackLabel}</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {playerName && (
            <span style={{ fontSize: 11, color: '#6688aa' }}>{playerName}</span>
          )}
          <button
            onClick={backToTrackSelect}
            style={{
              background: 'rgba(68, 136, 255, 0.08)',
              border: '1px solid #2a3355',
              color: '#6688aa',
              padding: '4px 12px',
              borderRadius: 4,
              cursor: 'pointer',
              fontSize: 10,
              fontFamily: 'monospace',
            }}
          >
            Tracks
          </button>
          <button
            onClick={clearPlayer}
            style={{
              background: 'rgba(255, 68, 68, 0.08)',
              border: '1px solid #331a1a',
              color: '#884444',
              padding: '4px 12px',
              borderRadius: 4,
              cursor: 'pointer',
              fontSize: 10,
              fontFamily: 'monospace',
            }}
          >
            Reset
          </button>
        </div>
      </div>

      {/* Terminal header */}
      <div
        style={{
          position: 'relative',
          padding: '32px 32px 0',
          maxWidth: 900,
          margin: '0 auto',
          width: '100%',
        }}
      >
        <div style={{ fontSize: 11, color: '#334455', marginBottom: 4 }}>
          $ cat /missions/{selectedTrack || 'system-design'}/index
        </div>
        <div style={{ fontSize: 22, fontWeight: 700, color: '#e0e8f0', marginBottom: 8 }}>
          Mission Board
        </div>
        <div style={{ fontSize: 12, color: '#556677', marginBottom: 4 }}>
          {completedCount}/{totalCount} missions completed
        </div>

        {/* Progress bar */}
        <div
          style={{
            background: '#1a1a2e',
            borderRadius: 2,
            height: 4,
            marginTop: 12,
            marginBottom: 32,
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              width: `${(completedCount / totalCount) * 100}%`,
              height: '100%',
              background: completedCount === totalCount
                ? 'linear-gradient(90deg, #44cc66, #66ddaa)'
                : 'linear-gradient(90deg, #4488ff, #66aaff)',
              transition: 'width 0.3s',
            }}
          />
        </div>
      </div>

      {/* Chapter list */}
      <div
        style={{
          position: 'relative',
          padding: '0 32px 32px',
          maxWidth: 900,
          margin: '0 auto',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
        }}
      >
        {chapters.map((ch) => {
          const isLocked = ch.status === 'locked';
          const isCompleted = ch.status === 'completed';
          const isHovered = hoveredChapter === ch.id && !isLocked;
          const gradeColor = ch.grade ? GRADE_COLORS[ch.grade] || '#6688aa' : null;

          return (
            <button
              key={ch.id}
              onClick={() => handleChapterClick(ch)}
              onMouseEnter={() => setHoveredChapter(ch.id)}
              onMouseLeave={() => setHoveredChapter(null)}
              disabled={isLocked}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 16,
                padding: '16px 20px',
                background: isHovered
                  ? 'rgba(68, 136, 255, 0.06)'
                  : 'transparent',
                border: 'none',
                borderLeft: isHovered
                  ? '3px solid #4488ff'
                  : isCompleted
                  ? '3px solid #44cc6644'
                  : '3px solid transparent',
                cursor: isLocked ? 'default' : 'pointer',
                opacity: isLocked ? 0.35 : 1,
                textAlign: 'left',
                fontFamily: 'monospace',
                transition: 'all 0.15s',
                width: '100%',
                borderRadius: 0,
              }}
            >
              {/* Chapter number */}
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 6,
                  background: isCompleted
                    ? 'rgba(68, 204, 102, 0.1)'
                    : isLocked
                    ? 'rgba(40, 50, 70, 0.3)'
                    : 'rgba(68, 136, 255, 0.08)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 14,
                  fontWeight: 700,
                  color: isCompleted
                    ? '#44cc66'
                    : isLocked
                    ? '#334455'
                    : '#4488ff',
                  flexShrink: 0,
                }}
              >
                {isCompleted ? '[x]' : isLocked ? `0${ch.number}` : `0${ch.number}`}
              </div>

              {/* Chapter info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                  <span
                    style={{
                      fontSize: 14,
                      fontWeight: 600,
                      color: isCompleted ? '#88aa88' : isLocked ? '#445566' : '#d0d8e8',
                    }}
                  >
                    {ch.title}
                  </span>
                  {ch.status === 'in-progress' && (
                    <span style={{ fontSize: 9, color: '#ccaa44', background: 'rgba(204, 170, 68, 0.1)', padding: '1px 6px', borderRadius: 3 }}>
                      IN PROGRESS
                    </span>
                  )}
                </div>
                <div
                  style={{
                    fontSize: 11,
                    color: isLocked ? '#334455' : '#667788',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {ch.description}
                </div>
              </div>

              {/* NPC */}
              <div style={{ flexShrink: 0, textAlign: 'right' }}>
                <div style={{ fontSize: 11, color: isLocked ? '#334455' : '#6688aa' }}>
                  {ch.npc}
                </div>
                <div style={{ fontSize: 9, color: isLocked ? '#223344' : '#445566' }}>
                  {ch.npcRole}
                </div>
              </div>

              {/* Grade badge */}
              <div style={{ width: 60, textAlign: 'right', flexShrink: 0 }}>
                {isCompleted && gradeColor ? (
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      color: gradeColor,
                      textTransform: 'uppercase',
                    }}
                  >
                    {ch.grade}
                  </span>
                ) : isLocked ? (
                  <span style={{ fontSize: 11, color: '#223344' }}>--</span>
                ) : ch.grade ? (
                  <span style={{ fontSize: 11, color: gradeColor || '#6688aa', fontWeight: 700, textTransform: 'uppercase' }}>
                    {ch.grade}
                  </span>
                ) : (
                  <span style={{ fontSize: 11, color: '#334455' }}>--</span>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Terminal footer */}
      <div
        style={{
          position: 'relative',
          padding: '16px 32px',
          maxWidth: 900,
          margin: '0 auto',
          width: '100%',
          borderTop: '1px solid #1a2040',
        }}
      >
        <div style={{ fontSize: 11, color: '#334455' }}>
          {completedCount === totalCount
            ? '$ echo "All missions completed. System architecture mastered."'
            : `$ echo "Select a mission to begin. ${totalCount - completedCount} remaining."`}
        </div>
      </div>
    </div>
  );
};
