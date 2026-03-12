import React, { useState, useEffect, useCallback } from 'react';
import { useDialogueStore } from './DialogueStore';
import { DialogueEngine } from './DialogueEngine';
import { useGameStore } from '../core/GameStore';
import { EventBus } from '../core/EventBus';

const NPC_COLORS: Record<string, string> = {
  Sarah: '#44cc66',
  Marcus: '#aa88ff',
};

export const DialogueUI: React.FC = () => {
  const { active, currentNode, history, dialogueData } = useDialogueStore();
  const advanceToNode = useDialogueStore((s) => s.advanceToNode);
  const [displayedText, setDisplayedText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [fullText, setFullText] = useState('');

  useEffect(() => {
    if (!currentNode) return;

    const text = currentNode.text;
    setFullText(text);
    setDisplayedText('');
    setIsTyping(true);

    let index = 0;
    const interval = setInterval(() => {
      index++;
      setDisplayedText(text.slice(0, index));
      if (index >= text.length) {
        clearInterval(interval);
        setIsTyping(false);
      }
    }, 18);

    return () => clearInterval(interval);
  }, [currentNode]);

  const skipTypewriter = useCallback(() => {
    if (isTyping) {
      setDisplayedText(fullText);
      setIsTyping(false);
    }
  }, [isTyping, fullText]);

  const handleChoice = useCallback(
    (next: string, action?: string) => {
      if (action) {
        DialogueEngine.handleAction(action);
        return;
      }
      advanceToNode(next);
    },
    [advanceToNode]
  );

  const handleContinue = useCallback(() => {
    if (!currentNode) return;

    if (isTyping) {
      skipTypewriter();
      return;
    }

    if (currentNode.action) {
      DialogueEngine.handleAction(currentNode.action);
      return;
    }

    if (currentNode.next) {
      advanceToNode(currentNode.next);
    }
  }, [currentNode, isTyping, skipTypewriter, advanceToNode]);

  const handleBack = () => {
    useDialogueStore.getState().endDialogue();
    useGameStore.getState().setPhase('exploring');
    EventBus.emit('dialogue:ended');
  };

  if (!active || !currentNode) return null;

  const hasChoices = currentNode.choices && currentNode.choices.length > 0;
  const speakerColor = NPC_COLORS[currentNode.speaker] || '#6688aa';

  // Build conversation history for terminal display
  const pastMessages: { speaker: string; text: string; nodeId: string }[] = [];
  if (dialogueData) {
    for (let i = 0; i < history.length - 1; i++) {
      const node = dialogueData.nodes[history[i]];
      if (node) {
        pastMessages.push({ speaker: node.speaker, text: node.text, nodeId: history[i] });
      }
    }
  }

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
          padding: '12px 32px',
          borderBottom: '1px solid #1a2040',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button
            onClick={handleBack}
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
            {'<'} Back
          </button>
          <span style={{ fontSize: 11, color: '#334455' }}>|</span>
          <span style={{ fontSize: 11, color: '#556677' }}>
            Mission Briefing
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div
            style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: speakerColor,
              opacity: 0.6,
            }}
          />
          <span style={{ fontSize: 11, color: speakerColor }}>
            {currentNode.speaker} online
          </span>
        </div>
      </div>

      {/* Terminal conversation area */}
      <div
        style={{
          position: 'relative',
          flex: 1,
          overflow: 'auto',
          padding: '24px 32px',
          maxWidth: 800,
          margin: '0 auto',
          width: '100%',
        }}
        onClick={!hasChoices ? handleContinue : undefined}
      >
        {/* Past messages */}
        {pastMessages.map((msg, i) => (
          <div key={msg.nodeId + i} style={{ marginBottom: 20, opacity: 0.5 }}>
            <div style={{ fontSize: 11, color: NPC_COLORS[msg.speaker] || '#6688aa', marginBottom: 4 }}>
              [{msg.speaker.toLowerCase()}@frameworkit ~]$
            </div>
            <div style={{ fontSize: 14, color: '#8899aa', lineHeight: 1.6, paddingLeft: 12 }}>
              {msg.text}
            </div>
          </div>
        ))}

        {/* Current message */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 11, color: speakerColor, marginBottom: 4 }}>
            [{currentNode.speaker.toLowerCase()}@frameworkit ~]$
          </div>
          <div
            style={{
              fontSize: 15,
              lineHeight: 1.7,
              color: '#d0d8e8',
              paddingLeft: 12,
            }}
          >
            {displayedText}
            {isTyping && (
              <span style={{ opacity: 0.5, animation: 'blink 0.5s step-end infinite' }}>_</span>
            )}
          </div>
        </div>

        {/* Choices */}
        {!isTyping && hasChoices && (
          <div style={{ paddingLeft: 12, display: 'flex', flexDirection: 'column', gap: 6, marginTop: 16 }}>
            <div style={{ fontSize: 10, color: '#334455', marginBottom: 4 }}>
              Select an option:
            </div>
            {currentNode.choices!.map((choice, i) => (
              <button
                key={i}
                onClick={(e) => {
                  e.stopPropagation();
                  handleChoice(choice.next, choice.action);
                }}
                style={{
                  background: 'transparent',
                  border: '1px solid #2a3355',
                  color: '#88bbff',
                  padding: '8px 16px',
                  borderRadius: 4,
                  cursor: 'pointer',
                  fontSize: 13,
                  fontFamily: 'monospace',
                  textAlign: 'left',
                  transition: 'all 0.15s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(68, 136, 255, 0.08)';
                  e.currentTarget.style.borderColor = '#4488ff';
                  e.currentTarget.style.color = '#aaccff';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.borderColor = '#2a3355';
                  e.currentTarget.style.color = '#88bbff';
                }}
              >
                [{i + 1}] {choice.text}
              </button>
            ))}
          </div>
        )}

        {/* Continue prompt */}
        {!isTyping && !hasChoices && (
          <div style={{ paddingLeft: 12, fontSize: 11, color: '#445566', marginTop: 8 }}>
            Click to continue...
          </div>
        )}
      </div>

      <style>{`
        @keyframes blink {
          50% { opacity: 0; }
        }
      `}</style>
    </div>
  );
};
