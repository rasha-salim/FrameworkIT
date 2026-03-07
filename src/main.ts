import Phaser from 'phaser';
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BootScene } from './scenes/BootScene';
import { WorldScene } from './scenes/WorldScene';
import { App } from './ui/App';
import { AuthGuard } from './auth/AuthGuard';
import { DialogueEngine } from './dialogue/DialogueEngine';
import { useAuthStore } from './auth/AuthStore';
import { useGameStore } from './core/GameStore';

// Initialize dialogue system (sets up EventBus listeners)
DialogueEngine.init();

let phaserGame: Phaser.Game | null = null;

function startPhaserGame() {
  if (phaserGame) return; // Already running

  const config: Phaser.Types.Core.GameConfig = {
    type: Phaser.AUTO,
    width: 1024,
    height: 600,
    parent: 'game-container',
    backgroundColor: '#0a0e1a',
    physics: {
      default: 'arcade',
      arcade: {
        gravity: { x: 0, y: 0 },
        debug: false,
      },
    },
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
    },
    scene: [BootScene, WorldScene],
  };

  phaserGame = new Phaser.Game(config);
}

// Render React UI immediately (AuthGuard will show name prompt if needed)
const uiRoot = document.getElementById('ui-root');
if (uiRoot) {
  ReactDOM.createRoot(uiRoot).render(
    React.createElement(AuthGuard, null, React.createElement(App))
  );
}

// Start Phaser only when player is authenticated AND a track is selected
function tryStartPhaser() {
  const auth = useAuthStore.getState();
  const game = useGameStore.getState();
  if (auth.playerName && game.selectedTrack === 'system-design') {
    startPhaserGame();
    return true;
  }
  return false;
}

// Initialize auth store and start game when player name is available
useAuthStore.getState().initialize();

if (!tryStartPhaser()) {
  // Watch for auth + track selection to both be ready
  const unsubAuth = useAuthStore.subscribe(() => {
    if (tryStartPhaser()) {
      unsubAuth();
      unsubGame();
    }
  });
  const unsubGame = useGameStore.subscribe(() => {
    if (tryStartPhaser()) {
      unsubAuth();
      unsubGame();
    }
  });
}
