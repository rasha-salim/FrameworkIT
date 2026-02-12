import React, { useState, useEffect, useCallback } from 'react';
import { useDialogueStore } from './DialogueStore';
import { DialogueEngine } from './DialogueEngine';

export const DialogueUI: React.FC = () => {
  const { active, currentNode } = useDialogueStore();
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
    }, 25);

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

  if (!active || !currentNode) return null;

  const hasChoices = currentNode.choices && currentNode.choices.length > 0;

  return (
    <div
      style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: '40%',
        background: 'linear-gradient(to bottom, rgba(10, 14, 30, 0.92), rgba(10, 14, 30, 0.98))',
        borderTop: '2px solid #334466',
        display: 'flex',
        flexDirection: 'column',
        padding: '24px 48px',
        pointerEvents: 'auto',
      }}
      onClick={!hasChoices ? handleContinue : undefined}
    >
      {/* Speaker name */}
      <div
        style={{
          fontSize: 16,
          fontWeight: 700,
          color: '#44cc66',
          marginBottom: 12,
          fontFamily: 'monospace',
          textTransform: 'uppercase',
          letterSpacing: 2,
        }}
      >
        {currentNode.speaker}
      </div>

      {/* Dialogue text */}
      <div
        style={{
          fontSize: 18,
          lineHeight: 1.6,
          color: '#d0d8e8',
          fontFamily: "'Segoe UI', system-ui, sans-serif",
          flex: 1,
          maxWidth: 800,
        }}
      >
        {displayedText}
        {isTyping && (
          <span style={{ opacity: 0.5, animation: 'blink 0.5s step-end infinite' }}>|</span>
        )}
      </div>

      {/* Choices or continue prompt */}
      <div style={{ marginTop: 16 }}>
        {!isTyping && hasChoices && (
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            {currentNode.choices!.map((choice, i) => (
              <button
                key={i}
                onClick={(e) => {
                  e.stopPropagation();
                  handleChoice(choice.next, choice.action);
                }}
                style={{
                  background: 'rgba(68, 136, 255, 0.15)',
                  border: '1px solid #4488ff44',
                  color: '#88bbff',
                  padding: '10px 20px',
                  borderRadius: 6,
                  cursor: 'pointer',
                  fontSize: 14,
                  fontFamily: 'monospace',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(68, 136, 255, 0.3)';
                  e.currentTarget.style.borderColor = '#4488ff88';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(68, 136, 255, 0.15)';
                  e.currentTarget.style.borderColor = '#4488ff44';
                }}
              >
                {choice.text}
              </button>
            ))}
          </div>
        )}

        {!isTyping && !hasChoices && (
          <div
            style={{
              fontSize: 12,
              color: '#556688',
              fontFamily: 'monospace',
            }}
          >
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
