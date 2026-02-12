import Phaser from 'phaser';
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BootScene } from './scenes/BootScene';
import { WorldScene } from './scenes/WorldScene';
import { App } from './ui/App';
import { DialogueEngine } from './dialogue/DialogueEngine';

// Initialize dialogue system (sets up EventBus listeners)
DialogueEngine.init();

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

new Phaser.Game(config);

const uiRoot = document.getElementById('ui-root');
if (uiRoot) {
  ReactDOM.createRoot(uiRoot).render(React.createElement(App));
}
