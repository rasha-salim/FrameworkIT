import React, { useState, useCallback } from 'react';
import { useSDPuzzleStore } from '../SDPuzzleStore';
import { ClassNode } from '../components/ClassNode';
import { InterfaceNode } from '../components/InterfaceNode';
import { CodeSmellBadge, type CodeSmell } from '../components/CodeSmellBadge';
import { SDSimulator } from '../SDSimulator';

export const Level1SOLID: React.FC = () => {
  const classes = useSDPuzzleStore((s) => s.classes);
  const interfaces = useSDPuzzleStore((s) => s.interfaces);
  const dependencies = useSDPuzzleStore((s) => s.dependencies);
  const simulationState = useSDPuzzleStore((s) => s.simulationState);
  const selectedClassId = useSDPuzzleStore((s) => s.selectedClassId);
  const splitMode = useSDPuzzleStore((s) => s.splitMode);
  const puzzleData = useSDPuzzleStore((s) => s.puzzleData);

  const setSelectedClassId = useSDPuzzleStore((s) => s.setSelectedClassId);
  const setSplitMode = useSDPuzzleStore((s) => s.setSplitMode);
  const splitClass = useSDPuzzleStore((s) => s.splitClass);
  const extractInterface = useSDPuzzleStore((s) => s.extractInterface);
  const updateClass = useSDPuzzleStore((s) => s.updateClass);
  const removeInterface = useSDPuzzleStore((s) => s.removeInterface);
  const resetPuzzle = useSDPuzzleStore((s) => s.resetPuzzle);
  const resetSimulation = useSDPuzzleStore((s) => s.resetSimulation);

  const [newClassName, setNewClassName] = useState('');
  const [showNameDialog, setShowNameDialog] = useState(false);
  const [pendingSplit, setPendingSplit] = useState<{
    classId: string;
    methodIds: string[];
  } | null>(null);

  // Detect code smells
  const smells = detectCodeSmells(classes, interfaces, dependencies);

  // Affected classes from scenario results
  const affectedClassIds = new Set(
    simulationState.scenarioResults.flatMap((r) => r.classesAffected)
  );

  const handleSplit = useCallback(
    (classId: string, methodIds: string[]) => {
      setPendingSplit({ classId, methodIds });
      setNewClassName('');
      setShowNameDialog(true);
    },
    []
  );

  const confirmSplit = () => {
    if (!pendingSplit || !newClassName.trim()) return;
    splitClass(pendingSplit.classId, pendingSplit.methodIds, newClassName.trim());
    setShowNameDialog(false);
    setPendingSplit(null);
  };

  const handleDeploy = async () => {
    if (simulationState.running) return;
    await SDSimulator.run();
  };

  const handleReset = () => {
    if (simulationState.running) return;
    resetSimulation();
    resetPuzzle();
  };

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background: '#0a0e1a',
        display: 'flex',
        flexDirection: 'column',
        pointerEvents: 'auto',
        fontFamily: 'monospace',
      }}
    >
      {/* Top bar */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '12px 24px',
          borderBottom: '1px solid #2a3355',
          background: 'rgba(15, 20, 35, 0.95)',
        }}
      >
        <div>
          <div style={{ fontSize: 16, fontWeight: 700, color: '#88bbff' }}>
            {puzzleData?.title || 'Loading...'}
          </div>
          <div style={{ fontSize: 12, color: '#556688', marginTop: 2 }}>
            {puzzleData?.briefing?.text?.slice(0, 100)}...
          </div>
        </div>

        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          {/* Tool toggles */}
          <button
            onClick={() => setSplitMode(!splitMode)}
            style={{
              background: splitMode ? 'rgba(68, 204, 102, 0.2)' : 'rgba(68, 136, 255, 0.1)',
              border: `1px solid ${splitMode ? '#44cc6666' : '#4488ff44'}`,
              color: splitMode ? '#88ffaa' : '#88bbff',
              padding: '6px 14px',
              borderRadius: 6,
              cursor: 'pointer',
              fontSize: 11,
              fontFamily: 'monospace',
              fontWeight: splitMode ? 700 : 400,
            }}
          >
            {splitMode ? '[Split ON]' : 'Split Tool'}
          </button>

          <button
            onClick={handleReset}
            disabled={simulationState.running}
            style={{
              background: 'rgba(255, 68, 68, 0.15)',
              border: '1px solid #ff444444',
              color: '#ff8888',
              padding: '8px 20px',
              borderRadius: 6,
              cursor: simulationState.running ? 'not-allowed' : 'pointer',
              fontSize: 13,
              fontFamily: 'monospace',
              opacity: simulationState.running ? 0.4 : 1,
            }}
          >
            Reset
          </button>

          <button
            onClick={handleDeploy}
            disabled={simulationState.running}
            style={{
              background: simulationState.running
                ? 'rgba(68, 136, 255, 0.2)'
                : 'linear-gradient(135deg, #2255aa, #3366cc)',
              border: '1px solid #4488ff66',
              color: '#ffffff',
              padding: '8px 24px',
              borderRadius: 6,
              cursor: simulationState.running ? 'not-allowed' : 'pointer',
              fontSize: 13,
              fontWeight: 700,
              fontFamily: 'monospace',
              opacity: simulationState.running ? 0.6 : 1,
            }}
          >
            {simulationState.running ? 'Simulating...' : 'Deploy'}
          </button>
        </div>
      </div>

      {/* Main workspace */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* Code Structure Canvas */}
        <div
          style={{
            flex: 1,
            position: 'relative',
            overflow: 'auto',
            background: '#0d1220',
          }}
          onClick={() => {
            setSelectedClassId(null);
          }}
        >
          {/* Grid background */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              backgroundImage:
                'linear-gradient(rgba(68, 136, 255, 0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(68, 136, 255, 0.02) 1px, transparent 1px)',
              backgroundSize: '40px 40px',
              pointerEvents: 'none',
            }}
          />

          {/* Dependency arrows (SVG) */}
          <svg
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              pointerEvents: 'none',
            }}
          >
            <defs>
              <marker
                id="arrowhead"
                markerWidth="8"
                markerHeight="6"
                refX="8"
                refY="3"
                orient="auto"
              >
                <polygon points="0 0, 8 3, 0 6" fill="#4488ff88" />
              </marker>
              <marker
                id="arrowhead-impl"
                markerWidth="8"
                markerHeight="6"
                refX="8"
                refY="3"
                orient="auto"
              >
                <polygon points="0 0, 8 3, 0 6" fill="#aa66ff88" />
              </marker>
            </defs>
            {dependencies.map((dep) => {
              const sourceClass = classes.find((c) => c.id === dep.source);
              const targetClass = classes.find((c) => c.id === dep.target);
              const targetIface = interfaces.find((i) => i.id === dep.target);
              const source = sourceClass;
              const target = targetClass || targetIface;
              if (!source || !target) return null;

              const sx = source.position.x + 110;
              const sy = source.position.y + 40;
              const tx = target.position.x + 90;
              const ty = target.position.y + 40;

              const isImpl = dep.type === 'implements';

              return (
                <line
                  key={dep.id}
                  x1={sx}
                  y1={sy}
                  x2={tx}
                  y2={ty}
                  stroke={isImpl ? '#aa66ff44' : '#4488ff44'}
                  strokeWidth={2}
                  strokeDasharray={isImpl ? '6 3' : 'none'}
                  markerEnd={isImpl ? 'url(#arrowhead-impl)' : 'url(#arrowhead)'}
                />
              );
            })}
          </svg>

          {/* Interface nodes */}
          {interfaces.map((iface) => (
            <InterfaceNode
              key={iface.id}
              iface={iface}
              onRemove={removeInterface}
            />
          ))}

          {/* Class nodes */}
          {classes.map((cls) => (
            <ClassNode
              key={cls.id}
              cls={cls}
              isSelected={selectedClassId === cls.id}
              splitMode={splitMode}
              onSelect={setSelectedClassId}
              onSplit={handleSplit}
              onExtractInterface={extractInterface}
              onLabelChange={(id, label) => updateClass(id, { responsibilityLabel: label })}
              onPositionChange={(id, pos) => updateClass(id, { position: pos })}
              affectedByScenario={affectedClassIds.has(cls.id)}
            />
          ))}
        </div>

        {/* Right panel: Violations + Metrics */}
        <div
          style={{
            width: 280,
            background: 'rgba(15, 20, 35, 0.95)',
            borderLeft: '1px solid #2a3355',
            padding: '16px',
            overflowY: 'auto',
          }}
        >
          <div style={{ fontSize: 12, fontWeight: 700, color: '#88bbff', marginBottom: 12 }}>
            Violations Panel
          </div>

          {smells.length === 0 ? (
            <div style={{ fontSize: 11, color: '#44cc66' }}>
              No violations detected.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {smells.map((smell) => (
                <CodeSmellBadge key={smell.id} smell={smell} />
              ))}
            </div>
          )}

          {/* Quick stats */}
          <div style={{ marginTop: 24, borderTop: '1px solid #1a2040', paddingTop: 12 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#88bbff', marginBottom: 8 }}>
              Structure
            </div>
            <StatRow label="Classes" value={classes.length} />
            <StatRow label="Interfaces" value={interfaces.length} />
            <StatRow label="Dependencies" value={dependencies.length} />
            <StatRow
              label="Avg methods/class"
              value={
                classes.length > 0
                  ? Math.round(
                      (classes.reduce((s, c) => s + c.methods.length, 0) / classes.length) * 10
                    ) / 10
                  : 0
              }
            />
          </div>

          {/* Change scenarios info */}
          {puzzleData && (
            <div style={{ marginTop: 24, borderTop: '1px solid #1a2040', paddingTop: 12 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#88bbff', marginBottom: 8 }}>
                Change Scenarios
              </div>
              {puzzleData.changeScenarios.map((sc) => (
                <div key={sc.id} style={{ fontSize: 10, color: '#667788', marginBottom: 6, lineHeight: 1.4 }}>
                  - {sc.description}
                  <span style={{ color: '#445566', marginLeft: 4 }}>({sc.tests})</span>
                </div>
              ))}
            </div>
          )}

          {/* Instructions */}
          <div style={{ marginTop: 24, borderTop: '1px solid #1a2040', paddingTop: 12 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#88bbff', marginBottom: 8 }}>
              Tools
            </div>
            <div style={{ fontSize: 10, color: '#667788', lineHeight: 1.6 }}>
              <div>1. Split Tool: Select methods, then split into new class</div>
              <div>2. [I] button: Extract interface from a class</div>
              <div>3. Click label area to set responsibility</div>
              <div>4. Drag class nodes to reposition</div>
              <div>5. Deploy to run change propagation</div>
            </div>
          </div>
        </div>
      </div>

      {/* Name dialog for splits */}
      {showNameDialog && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
          }}
          onClick={() => setShowNameDialog(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: 'linear-gradient(135deg, #0f1428, #141a30)',
              border: '2px solid #4488ff44',
              borderRadius: 12,
              padding: '24px 32px',
              fontFamily: 'monospace',
            }}
          >
            <div style={{ fontSize: 14, fontWeight: 700, color: '#88bbff', marginBottom: 12 }}>
              Name the new class
            </div>
            <input
              value={newClassName}
              onChange={(e) => setNewClassName(e.target.value)}
              onKeyDown={(e) => {
                e.stopPropagation();
                if (e.key === 'Enter') confirmSplit();
                if (e.key === 'Escape') setShowNameDialog(false);
              }}
              autoFocus
              placeholder="e.g. PaymentGateway"
              style={{
                width: 260,
                background: '#0a0e1a',
                border: '1px solid #2a3355',
                borderRadius: 6,
                color: '#ccddeeff',
                fontSize: 13,
                padding: '8px 12px',
                fontFamily: 'monospace',
                outline: 'none',
              }}
            />
            <div style={{ display: 'flex', gap: 8, marginTop: 12, justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowNameDialog(false)}
                style={{
                  background: 'none',
                  border: '1px solid #2a3355',
                  color: '#667788',
                  padding: '6px 14px',
                  borderRadius: 6,
                  cursor: 'pointer',
                  fontSize: 11,
                  fontFamily: 'monospace',
                }}
              >
                Cancel
              </button>
              <button
                onClick={confirmSplit}
                disabled={!newClassName.trim()}
                style={{
                  background: 'linear-gradient(135deg, #2255aa, #3366cc)',
                  border: '1px solid #4488ff66',
                  color: '#ffffff',
                  padding: '6px 14px',
                  borderRadius: 6,
                  cursor: newClassName.trim() ? 'pointer' : 'not-allowed',
                  fontSize: 11,
                  fontWeight: 700,
                  fontFamily: 'monospace',
                }}
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

function detectCodeSmells(
  classes: { id: string; name: string; methods: { id: string; responsibilityGroup?: string }[]; responsibilityLabel?: string }[],
  interfaces: { id: string; methods: { id: string }[] }[],
  dependencies: { source: string; target: string; type: string }[]
): CodeSmell[] {
  const smells: CodeSmell[] = [];

  // God class: too many methods
  for (const cls of classes) {
    if (cls.methods.length > 6) {
      smells.push({
        id: `god-${cls.id}`,
        label: `${cls.name}: God Class (${cls.methods.length} methods)`,
        severity: 'red',
        description: `${cls.name} has ${cls.methods.length} methods. Consider splitting by responsibility.`,
      });
    }
  }

  // Mixed responsibilities
  for (const cls of classes) {
    const groups = new Set(cls.methods.map((m) => m.responsibilityGroup).filter(Boolean));
    if (groups.size > 1) {
      smells.push({
        id: `srp-${cls.id}`,
        label: `${cls.name}: Mixed Responsibilities`,
        severity: 'amber',
        description: `${cls.name} has methods from ${groups.size} responsibility groups: ${Array.from(groups).join(', ')}`,
      });
    }
  }

  // Missing responsibility labels
  for (const cls of classes) {
    if (!cls.responsibilityLabel) {
      smells.push({
        id: `label-${cls.id}`,
        label: `${cls.name}: No Responsibility Label`,
        severity: 'amber',
        description: `${cls.name} needs a responsibility label describing its single purpose.`,
      });
    }
  }

  // Circular dependencies
  const depMap = new Map<string, Set<string>>();
  for (const dep of dependencies) {
    if (dep.type === 'implements') continue;
    if (!depMap.has(dep.source)) depMap.set(dep.source, new Set());
    depMap.get(dep.source)!.add(dep.target);
  }
  for (const [a, targets] of depMap) {
    for (const b of targets) {
      if (depMap.get(b)?.has(a)) {
        smells.push({
          id: `circular-${a}-${b}`,
          label: `Circular: ${a} <-> ${b}`,
          severity: 'red',
          description: `Circular dependency between ${a} and ${b}. Neither can be deployed or tested independently.`,
        });
      }
    }
  }

  // Fat interfaces
  for (const iface of interfaces) {
    if (iface.methods.length > 5) {
      smells.push({
        id: `isp-${iface.id}`,
        label: `Fat Interface: ${iface.methods.length} methods`,
        severity: 'amber',
        description: `Interface has ${iface.methods.length} methods. Clients may be forced to depend on methods they do not use.`,
      });
    }
  }

  // All good
  if (smells.length === 0) {
    smells.push({
      id: 'all-good',
      label: 'Clean Design',
      severity: 'green',
      description: 'No structural violations detected.',
    });
  }

  return smells;
}

const StatRow: React.FC<{ label: string; value: number }> = ({ label, value }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
    <span style={{ fontSize: 10, color: '#667788' }}>{label}</span>
    <span style={{ fontSize: 11, fontWeight: 700, color: '#aabbcc' }}>{value}</span>
  </div>
);
