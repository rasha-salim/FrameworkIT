import React from 'react';

export interface CodeSmell {
  id: string;
  label: string;
  severity: 'red' | 'amber' | 'green';
  description: string;
}

interface CodeSmellBadgeProps {
  smell: CodeSmell;
}

const SEVERITY_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  red: { bg: 'rgba(255, 68, 68, 0.1)', border: '#ff444444', text: '#ff6644' },
  amber: { bg: 'rgba(204, 170, 68, 0.1)', border: '#ccaa4444', text: '#ccaa44' },
  green: { bg: 'rgba(68, 204, 102, 0.1)', border: '#44cc6644', text: '#44cc66' },
};

export const CodeSmellBadge: React.FC<CodeSmellBadgeProps> = ({ smell }) => {
  const colors = SEVERITY_COLORS[smell.severity];

  return (
    <div
      title={smell.description}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        background: colors.bg,
        border: `1px solid ${colors.border}`,
        borderRadius: 4,
        padding: '3px 8px',
        fontSize: 10,
        fontFamily: 'monospace',
        color: colors.text,
        cursor: 'help',
      }}
    >
      <span style={{ fontWeight: 700 }}>
        {smell.severity === 'red' ? '[!]' : smell.severity === 'amber' ? '[~]' : '[ok]'}
      </span>
      {smell.label}
    </div>
  );
};
