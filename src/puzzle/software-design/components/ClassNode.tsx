import React, { useState } from 'react';
import type { SDClass, SDMethod } from '../../../types';

interface ClassNodeProps {
  cls: SDClass;
  isSelected: boolean;
  splitMode: boolean;
  onSelect: (id: string) => void;
  onSplit: (classId: string, methodIds: string[]) => void;
  onExtractInterface: (classId: string) => void;
  onLabelChange: (classId: string, label: string) => void;
  onPositionChange: (classId: string, pos: { x: number; y: number }) => void;
  highlightedMethods?: Set<string>;
  affectedByScenario?: boolean;
}

const REJECTED_LABELS = ['helper', 'utils', 'manager', 'misc', 'stuff', 'other', 'general'];

export const ClassNode: React.FC<ClassNodeProps> = ({
  cls,
  isSelected,
  splitMode,
  onSelect,
  onSplit,
  onExtractInterface,
  onLabelChange,
  onPositionChange,
  highlightedMethods,
  affectedByScenario,
}) => {
  const [selectedMethods, setSelectedMethods] = useState<Set<string>>(new Set());
  const [editingLabel, setEditingLabel] = useState(false);
  const [labelText, setLabelText] = useState(cls.responsibilityLabel || '');
  const [labelError, setLabelError] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number } | null>(null);

  const toggleMethod = (methodId: string) => {
    if (!splitMode) return;
    const next = new Set(selectedMethods);
    if (next.has(methodId)) next.delete(methodId);
    else next.add(methodId);
    setSelectedMethods(next);
  };

  const handleSplit = () => {
    if (selectedMethods.size === 0 || selectedMethods.size === cls.methods.length) return;
    onSplit(cls.id, Array.from(selectedMethods));
    setSelectedMethods(new Set());
  };

  const handleLabelSave = () => {
    const trimmed = labelText.trim();
    if (REJECTED_LABELS.some((r) => trimmed.toLowerCase().includes(r))) {
      setLabelError('A responsibility should describe a specific business concern, not a code organization pattern.');
      return;
    }
    if (trimmed.length < 5) {
      setLabelError('Please provide a more specific responsibility description.');
      return;
    }
    setLabelError(null);
    setEditingLabel(false);
    onLabelChange(cls.id, trimmed);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (splitMode) return;
    e.preventDefault();
    setDragOffset({ x: e.clientX - cls.position.x, y: e.clientY - cls.position.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!dragOffset) return;
    onPositionChange(cls.id, {
      x: e.clientX - dragOffset.x,
      y: e.clientY - dragOffset.y,
    });
  };

  const handleMouseUp = () => {
    setDragOffset(null);
  };

  const borderColor = affectedByScenario
    ? '#ff4444'
    : isSelected
    ? '#4488ff'
    : '#2a3355';

  return (
    <div
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onClick={() => onSelect(cls.id)}
      style={{
        position: 'absolute',
        left: cls.position.x,
        top: cls.position.y,
        background: affectedByScenario
          ? 'rgba(255, 68, 68, 0.08)'
          : 'linear-gradient(135deg, #0f1428, #141a30)',
        border: `2px solid ${borderColor}`,
        borderRadius: 10,
        padding: '12px 16px',
        minWidth: 220,
        fontFamily: 'monospace',
        cursor: splitMode ? 'crosshair' : 'grab',
        userSelect: 'none',
        transition: 'border-color 0.15s',
      }}
    >
      {/* Class name */}
      <div
        style={{
          fontSize: 14,
          fontWeight: 700,
          color: '#88bbff',
          marginBottom: 4,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <span>{cls.name}</span>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onExtractInterface(cls.id);
          }}
          title="Extract Interface"
          style={{
            background: 'rgba(68, 136, 255, 0.15)',
            border: '1px solid #4488ff44',
            color: '#6699cc',
            fontSize: 9,
            padding: '2px 6px',
            borderRadius: 3,
            cursor: 'pointer',
            fontFamily: 'monospace',
          }}
        >
          [I]
        </button>
      </div>

      {/* Responsibility label */}
      <div style={{ marginBottom: 8 }}>
        {editingLabel ? (
          <div>
            <input
              value={labelText}
              onChange={(e) => setLabelText(e.target.value)}
              onKeyDown={(e) => {
                e.stopPropagation();
                if (e.key === 'Enter') handleLabelSave();
                if (e.key === 'Escape') setEditingLabel(false);
              }}
              autoFocus
              placeholder="Describe this class's responsibility..."
              style={{
                width: '100%',
                background: '#0a0e1a',
                border: '1px solid #2a3355',
                borderRadius: 4,
                color: '#aabbcc',
                fontSize: 10,
                padding: '4px 6px',
                fontFamily: 'monospace',
                outline: 'none',
              }}
            />
            {labelError && (
              <div style={{ fontSize: 9, color: '#ff6644', marginTop: 2 }}>{labelError}</div>
            )}
          </div>
        ) : (
          <div
            onClick={(e) => {
              e.stopPropagation();
              setEditingLabel(true);
            }}
            style={{
              fontSize: 10,
              color: cls.responsibilityLabel ? '#6688aa' : '#445566',
              cursor: 'text',
              fontStyle: cls.responsibilityLabel ? 'normal' : 'italic',
            }}
          >
            {cls.responsibilityLabel || 'Click to add responsibility label...'}
          </div>
        )}
      </div>

      {/* Methods list */}
      <div style={{ borderTop: '1px solid #1a2040', paddingTop: 6 }}>
        {cls.methods.map((method) => {
          const isMethodSelected = selectedMethods.has(method.id);
          const isHighlighted = highlightedMethods?.has(method.id);
          return (
            <div
              key={method.id}
              onClick={(e) => {
                e.stopPropagation();
                toggleMethod(method.id);
              }}
              style={{
                fontSize: 11,
                color: isHighlighted
                  ? '#ff8844'
                  : isMethodSelected
                  ? '#44cc66'
                  : '#8899aa',
                padding: '2px 4px',
                borderRadius: 3,
                cursor: splitMode ? 'pointer' : 'default',
                background: isMethodSelected
                  ? 'rgba(68, 204, 102, 0.1)'
                  : isHighlighted
                  ? 'rgba(255, 136, 68, 0.1)'
                  : 'transparent',
                transition: 'background 0.1s',
              }}
            >
              {method.name}()
              {method.responsibilityGroup && (
                <span style={{ fontSize: 8, color: '#556677', marginLeft: 4 }}>
                  [{method.responsibilityGroup}]
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* Split button */}
      {splitMode && selectedMethods.size > 0 && selectedMethods.size < cls.methods.length && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleSplit();
          }}
          style={{
            marginTop: 8,
            width: '100%',
            background: 'linear-gradient(135deg, #225533, #336644)',
            border: '1px solid #44cc6644',
            color: '#88ffaa',
            fontSize: 11,
            padding: '6px',
            borderRadius: 4,
            cursor: 'pointer',
            fontFamily: 'monospace',
            fontWeight: 700,
          }}
        >
          Split ({selectedMethods.size} methods)
        </button>
      )}

      {/* Implements badges */}
      {cls.implementsInterfaces.length > 0 && (
        <div style={{ marginTop: 6, display: 'flex', gap: 4, flexWrap: 'wrap' }}>
          {cls.implementsInterfaces.map((ifaceId) => (
            <span
              key={ifaceId}
              style={{
                fontSize: 8,
                color: '#cc88ff',
                background: 'rgba(170, 102, 255, 0.1)',
                border: '1px solid #aa66ff33',
                borderRadius: 3,
                padding: '1px 4px',
              }}
            >
              implements
            </span>
          ))}
        </div>
      )}
    </div>
  );
};
