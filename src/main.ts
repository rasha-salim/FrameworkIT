import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './ui/App';
import { AuthGuard } from './auth/AuthGuard';
import { DialogueEngine } from './dialogue/DialogueEngine';
import { useAuthStore } from './auth/AuthStore';

// Initialize dialogue system (sets up EventBus listeners)
DialogueEngine.init();

// Initialize auth store
useAuthStore.getState().initialize();

// Render React UI
const uiRoot = document.getElementById('ui-root');
if (uiRoot) {
  ReactDOM.createRoot(uiRoot).render(
    React.createElement(AuthGuard, null, React.createElement(App))
  );
}
