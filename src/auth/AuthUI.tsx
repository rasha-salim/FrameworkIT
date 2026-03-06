import React, { useState } from 'react';
import { useAuthStore } from './AuthStore';

export const AuthUI: React.FC = () => {
  const [name, setName] = useState('');
  const { setPlayerName } = useAuthStore();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (trimmed.length < 2) return;
    setPlayerName(trimmed);
  };

  const isValid = name.trim().length >= 2;

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background: '#0a0e1a',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'monospace',
        zIndex: 100,
        pointerEvents: 'auto',
      }}
    >
      <div
        style={{
          background: 'linear-gradient(135deg, #0f1428, #141a30)',
          border: '1px solid #2a3355',
          borderRadius: 16,
          padding: '48px 40px',
          width: 380,
          maxWidth: '90vw',
        }}
      >
        {/* Icon */}
        <div style={{ textAlign: 'center', marginBottom: 16 }}>
          <svg width="56" height="56" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
            <rect width="64" height="64" rx="14" fill="#0f1428" />
            <rect x="1" y="1" width="62" height="62" rx="13" fill="none" stroke="#4488ff" strokeWidth="1.5" opacity="0.4" />
            <rect x="8" y="12" width="14" height="10" rx="3" fill="#4488ff" opacity="0.9" />
            <rect x="8" y="42" width="14" height="10" rx="3" fill="#4488ff" opacity="0.9" />
            <rect x="28" y="24" width="16" height="16" rx="4" fill="#aa66ff" opacity="0.9" />
            <rect x="50" y="27" width="10" height="10" rx="3" fill="#44cc66" opacity="0.9" />
            <line x1="22" y1="17" x2="28" y2="30" stroke="#4488ff" strokeWidth="2" strokeLinecap="round" opacity="0.7" />
            <line x1="22" y1="47" x2="28" y2="34" stroke="#4488ff" strokeWidth="2" strokeLinecap="round" opacity="0.7" />
            <line x1="44" y1="32" x2="50" y2="32" stroke="#44cc66" strokeWidth="2" strokeLinecap="round" opacity="0.7" />
            <circle cx="25" cy="24" r="1.5" fill="#4488ff" />
            <circle cx="25" cy="40" r="1.5" fill="#4488ff" />
            <circle cx="47" cy="32" r="1.5" fill="#44cc66" />
          </svg>
        </div>

        <div
          style={{
            fontSize: 24,
            fontWeight: 700,
            color: '#4488ff',
            textAlign: 'center',
            marginBottom: 4,
          }}
        >
          Framework<span style={{ color: '#aa66ff' }}>IT</span>
        </div>
        <div
          style={{
            fontSize: 11,
            color: '#6688aa',
            textAlign: 'center',
            marginBottom: 32,
            textTransform: 'uppercase',
            letterSpacing: 3,
          }}
        >
          Learn System Design by Building
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 24 }}>
            <label
              style={{
                display: 'block',
                fontSize: 11,
                color: '#6688aa',
                marginBottom: 6,
                textTransform: 'uppercase',
                letterSpacing: 1,
              }}
            >
              What's your name?
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
              style={{
                width: '100%',
                padding: '10px 12px',
                background: '#0a0e1a',
                border: '1px solid #2a3355',
                borderRadius: 6,
                color: '#ccddeeff',
                fontSize: 14,
                fontFamily: 'monospace',
                outline: 'none',
              }}
              placeholder="Enter your name"
            />
          </div>

          <button
            type="submit"
            disabled={!isValid}
            style={{
              width: '100%',
              padding: '12px',
              background: !isValid
                ? 'rgba(68, 136, 255, 0.1)'
                : 'linear-gradient(135deg, #2255aa, #3366cc)',
              border: '1px solid #4488ff44',
              borderRadius: 8,
              color: !isValid ? '#4488ff88' : '#ffffff',
              fontSize: 14,
              fontWeight: 700,
              fontFamily: 'monospace',
              cursor: !isValid ? 'default' : 'pointer',
              letterSpacing: 1,
            }}
          >
            Start Playing
          </button>
        </form>
      </div>
    </div>
  );
};
