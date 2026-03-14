import React, { useState } from 'react';
import { useGameStore } from '../core/GameStore';
import { useAuthStore } from '../auth/AuthStore';

export const TrackSelectScreen: React.FC = () => {
  const selectTrack = useGameStore((s) => s.selectTrack);
  const playerName = useAuthStore((s) => s.playerName);
  const [hoveredTrack, setHoveredTrack] = useState<string | null>(null);

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background: '#0a0e1a',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'monospace',
        pointerEvents: 'auto',
        zIndex: 50,
      }}
    >
      {/* Background grid */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage:
            'linear-gradient(rgba(68, 136, 255, 0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(68, 136, 255, 0.03) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
          pointerEvents: 'none',
        }}
      />

      {/* Header */}
      <div style={{ position: 'relative', textAlign: 'center', marginBottom: 48 }}>
        <div
          style={{
            fontSize: 11,
            color: '#4488ff',
            textTransform: 'uppercase',
            letterSpacing: 3,
            marginBottom: 12,
          }}
        >
          FrameworkIT
        </div>
        <div
          style={{
            fontSize: 28,
            fontWeight: 900,
            color: '#e0e8f0',
            letterSpacing: 1,
          }}
        >
          Choose Your Track
        </div>
        {playerName && (
          <div style={{ fontSize: 12, color: '#556688', marginTop: 8 }}>
            Welcome back, {playerName}
          </div>
        )}
      </div>

      {/* Track cards */}
      <div
        style={{
          position: 'relative',
          display: 'flex',
          gap: 32,
          maxWidth: 800,
        }}
      >
        {/* System Design Track */}
        <button
          onClick={() => selectTrack('system-design')}
          onMouseEnter={() => setHoveredTrack('system-design')}
          onMouseLeave={() => setHoveredTrack(null)}
          style={{
            background:
              hoveredTrack === 'system-design'
                ? 'linear-gradient(135deg, #0f1a35, #142040)'
                : 'linear-gradient(135deg, #0f1428, #141a30)',
            border: `2px solid ${hoveredTrack === 'system-design' ? '#4488ff' : '#2a3355'}`,
            borderRadius: 16,
            padding: '36px 32px',
            width: 340,
            textAlign: 'left',
            cursor: 'pointer',
            transition: 'all 0.25s',
            transform: hoveredTrack === 'system-design' ? 'translateY(-4px)' : 'none',
            boxShadow:
              hoveredTrack === 'system-design'
                ? '0 8px 32px rgba(68, 136, 255, 0.15)'
                : 'none',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              marginBottom: 16,
            }}
          >
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 10,
                background: 'rgba(68, 136, 255, 0.12)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 20,
              }}
            >
              <span style={{ color: '#4488ff' }}>[=]</span>
            </div>
            <div>
              <div style={{ fontSize: 18, fontWeight: 700, color: '#e0e8f0' }}>
                System Design
              </div>
              <div style={{ fontSize: 11, color: '#4488ff', marginTop: 2 }}>
                6 chapters available
              </div>
            </div>
          </div>

          <div
            style={{
              fontSize: 13,
              color: '#8899aa',
              lineHeight: 1.6,
              marginBottom: 20,
            }}
          >
            Build scalable architectures. Load balancers, caches, databases,
            rate limiters -- learn by wiring real systems and watching them
            handle traffic.
          </div>

          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {['Load Balancing', 'Caching', 'Databases', 'Rate Limiting', 'Sessions', 'Partitioning'].map(
              (tag) => (
                <span
                  key={tag}
                  style={{
                    fontSize: 10,
                    color: '#4488ff',
                    background: 'rgba(68, 136, 255, 0.08)',
                    border: '1px solid rgba(68, 136, 255, 0.2)',
                    borderRadius: 4,
                    padding: '3px 8px',
                  }}
                >
                  {tag}
                </span>
              )
            )}
          </div>

          <div
            style={{
              marginTop: 20,
              fontSize: 12,
              fontWeight: 700,
              color: '#4488ff',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            Start Playing
            <span style={{ fontSize: 14 }}>{'-->'}</span>
          </div>
        </button>

        {/* Software Design Track */}
        <button
          onClick={() => selectTrack('software-design')}
          onMouseEnter={() => setHoveredTrack('software-design')}
          onMouseLeave={() => setHoveredTrack(null)}
          style={{
            background:
              hoveredTrack === 'software-design'
                ? 'linear-gradient(135deg, #1a0f35, #201440)'
                : 'linear-gradient(135deg, #140f28, #1a1430)',
            border: `2px solid ${hoveredTrack === 'software-design' ? '#aa66ff' : '#2a2355'}`,
            borderRadius: 16,
            padding: '36px 32px',
            width: 340,
            textAlign: 'left',
            cursor: 'pointer',
            transition: 'all 0.25s',
            transform: hoveredTrack === 'software-design' ? 'translateY(-4px)' : 'none',
            boxShadow:
              hoveredTrack === 'software-design'
                ? '0 8px 32px rgba(170, 102, 255, 0.15)'
                : 'none',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              marginBottom: 16,
            }}
          >
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 10,
                background: 'rgba(170, 102, 255, 0.12)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 20,
              }}
            >
              <span style={{ color: '#aa66ff' }}>{'<>'}</span>
            </div>
            <div>
              <div style={{ fontSize: 18, fontWeight: 700, color: '#e0e8f0' }}>
                Software Design
              </div>
              <div style={{ fontSize: 11, color: '#aa66ff', marginTop: 2 }}>
                6 chapters available
              </div>
            </div>
          </div>

          <div
            style={{
              fontSize: 13,
              color: '#8899aa',
              lineHeight: 1.6,
              marginBottom: 20,
            }}
          >
            Master software architecture patterns. SOLID principles, design
            patterns, refactoring, DDD -- learn to write clean, maintainable
            code through hands-on challenges.
          </div>

          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {['SOLID', 'Design Patterns', 'Refactoring', 'Architecture', 'DDD'].map((tag) => (
              <span
                key={tag}
                style={{
                  fontSize: 10,
                  color: '#aa66ff',
                  background: 'rgba(170, 102, 255, 0.08)',
                  border: '1px solid rgba(170, 102, 255, 0.2)',
                  borderRadius: 4,
                  padding: '3px 8px',
                }}
              >
                {tag}
              </span>
            ))}
          </div>

          <div
            style={{
              marginTop: 20,
              fontSize: 12,
              fontWeight: 700,
              color: '#aa66ff',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            Start Playing
            <span style={{ fontSize: 14 }}>{'-->'}</span>
          </div>
        </button>
      </div>

      {/* Footer */}
      <div
        style={{
          position: 'relative',
          marginTop: 48,
          fontSize: 11,
          color: '#334455',
        }}
      >
        Learn engineering through play
      </div>
    </div>
  );
};
