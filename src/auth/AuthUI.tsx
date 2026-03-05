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
        <div
          style={{
            fontSize: 24,
            fontWeight: 700,
            color: '#4488ff',
            textAlign: 'center',
            marginBottom: 8,
          }}
        >
          FrameworkIT
        </div>
        <div
          style={{
            fontSize: 12,
            color: '#6688aa',
            textAlign: 'center',
            marginBottom: 32,
            textTransform: 'uppercase',
            letterSpacing: 2,
          }}
        >
          System Design Game
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
