import React from 'react';

interface HoverConnectorProps {
  x: number;
  y: number;
}

export const HoverConnector: React.FC<HoverConnectorProps> = ({ x, y }) => {
  // Line goes from cursor (x, y) to card start boundary (x + 20, y - 60)
  return (
    <svg className="fixed inset-0 w-full h-full pointer-events-none z-40">
      <style>{`
        @keyframes dash {
          to {
            stroke-dashoffset: -12;
          }
        }
      `}</style>
      <defs>
        <linearGradient id="connectorGlow" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#00E5FF" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#9B51E0" stopOpacity="0.3" />
        </linearGradient>
      </defs>
      <path
        d={`M ${x} ${y} Q ${x + 12} ${y - 50}, ${x + 20} ${y - 60}`}
        fill="none"
        stroke="url(#connectorGlow)"
        strokeWidth="1.5"
        strokeDasharray="4 2"
        style={{ animation: 'dash 1.5s linear infinite' }}
      />
      <circle cx={x} cy={y} r="3" fill="#00E5FF" />
    </svg>
  );
};
