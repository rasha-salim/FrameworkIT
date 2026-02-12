import React, { useEffect } from 'react';
import { useAuthStore } from './AuthStore';
import { AuthUI } from './AuthUI';
import { supabase } from '../lib/supabase';

export const AuthGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, initialized, initialize } = useAuthStore();

  useEffect(() => {
    initialize();
  }, [initialize]);

  // Offline-only dev mode: no Supabase configured, skip auth entirely
  if (!supabase) {
    return <>{children}</>;
  }

  // Still loading session
  if (!initialized) {
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
        <div style={{ color: '#4488ff', fontSize: 16 }}>Loading...</div>
      </div>
    );
  }

  // Not authenticated: show login
  if (!user) {
    return <AuthUI />;
  }

  // Authenticated: render game
  return <>{children}</>;
};
