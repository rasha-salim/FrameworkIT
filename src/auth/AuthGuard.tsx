import React, { useEffect } from 'react';
import { useAuthStore } from './AuthStore';
import { AuthUI } from './AuthUI';

export const AuthGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { playerName, initialized, initialize } = useAuthStore();

  useEffect(() => {
    initialize();
  }, [initialize]);

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

  if (!playerName) {
    return <AuthUI />;
  }

  return <>{children}</>;
};
