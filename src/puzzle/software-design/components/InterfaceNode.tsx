import React from 'react';
import type { SDInterface } from '../../../types';

interface InterfaceNodeProps {
  iface: SDInterface;
  onRemove: (id: string) => void;
}

export const InterfaceNode: React.FC<InterfaceNodeProps> = ({ iface, onRemove }) => {
  return (
    <div
      style={{
        position: 'absolute',
        left: iface.position.x,
        top: iface.position.y,
        background: 'rgba(170, 102, 255, 0.06)',
        border: '2px dashed #aa66ff66',
        borderRadius: 10,
        padding: '10px 14px',
        minWidth: 180,
        fontFamily: 'monospace',
      }}
    >
      {/* Interface header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 6,
        }}
      >
        <div>
          <div style={{ fontSize: 9, color: '#aa66ff', textTransform: 'uppercase', letterSpacing: 1 }}>
            interface
          </div>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#cc88ff' }}>
            {iface.name}
          </div>
        </div>
        <button
          onClick={() => onRemove(iface.id)}
          title="Remove interface"
          style={{
            background: 'rgba(255, 68, 68, 0.1)',
            border: '1px solid #ff444433',
            color: '#884444',
            fontSize: 9,
            padding: '2px 5px',
            borderRadius: 3,
            cursor: 'pointer',
            fontFamily: 'monospace',
          }}
        >
          x
        </button>
      </div>

      {/* Method signatures */}
      <div style={{ borderTop: '1px solid #2a2355', paddingTop: 4 }}>
        {iface.methods.map((method) => (
          <div
            key={method.id}
            style={{
              fontSize: 10,
              color: '#8877aa',
              padding: '1px 2px',
            }}
          >
            {method.name}()
          </div>
        ))}
      </div>
    </div>
  );
};
