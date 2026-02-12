import React, { useState } from 'react';
import { useAuthStore } from './AuthStore';

export const AuthUI: React.FC = () => {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { loading, error, signIn, signUp, clearError } = useAuthStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || password.length < 6) return;

    if (mode === 'login') {
      await signIn(email.trim(), password);
    } else {
      await signUp(email.trim(), password);
    }
  };

  const toggleMode = () => {
    setMode(mode === 'login' ? 'register' : 'login');
    clearError();
  };

  const isValid = email.trim().length > 0 && password.length >= 6;

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
          <div style={{ marginBottom: 16 }}>
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
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
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
              placeholder="you@example.com"
            />
          </div>

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
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
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
              placeholder="Min 6 characters"
            />
          </div>

          {error && (
            <div
              style={{
                background: 'rgba(255, 68, 68, 0.1)',
                border: '1px solid #ff444444',
                borderRadius: 6,
                padding: '8px 12px',
                marginBottom: 16,
                fontSize: 12,
                color: '#ff6666',
              }}
            >
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !isValid}
            style={{
              width: '100%',
              padding: '12px',
              background: loading || !isValid
                ? 'rgba(68, 136, 255, 0.1)'
                : 'linear-gradient(135deg, #2255aa, #3366cc)',
              border: '1px solid #4488ff44',
              borderRadius: 8,
              color: loading || !isValid ? '#4488ff88' : '#ffffff',
              fontSize: 14,
              fontWeight: 700,
              fontFamily: 'monospace',
              cursor: loading || !isValid ? 'default' : 'pointer',
              letterSpacing: 1,
            }}
          >
            {loading ? 'Loading...' : mode === 'login' ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: 20 }}>
          <button
            onClick={toggleMode}
            style={{
              background: 'none',
              border: 'none',
              color: '#4488ff',
              fontSize: 12,
              fontFamily: 'monospace',
              cursor: 'pointer',
              textDecoration: 'underline',
            }}
          >
            {mode === 'login' ? 'Need an account? Register' : 'Have an account? Sign in'}
          </button>
        </div>
      </div>
    </div>
  );
};
