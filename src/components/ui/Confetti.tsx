'use client';

import { useEffect, useState } from 'react';

type Props = {
  trigger: boolean;
  pieces?: number;
  durationMs?: number;
  onDone?: () => void;
};

const COLORS = ['#1F6F5C', '#7B5EA7', '#B8860B', '#10b981', '#f59e0b', '#3b82f6'];

type Piece = {
  left: string;
  delay: number;
  color: string;
  rotateStart: number;
  drift: number;
  width: number;
  height: number;
  radius: string;
  duration: number;
};

function makePieces(count: number): Piece[] {
  return Array.from({ length: count }).map((_, i) => ({
    left: `${(i * 73 + Math.random() * 30) % 100}%`,
    delay: (i % 12) * 25,
    color: COLORS[i % COLORS.length],
    rotateStart: Math.random() * 360,
    drift: (Math.random() - 0.5) * 200,
    width: 6 + (i % 4) * 2,
    height: 10 + (i % 3) * 3,
    radius: i % 2 === 0 ? '2px' : '50%',
    duration: 1.4 + (i % 5) * 0.2,
  }));
}

export function Confetti({ trigger, pieces = 60, durationMs = 2200, onDone }: Props) {
  const [activePieces, setActivePieces] = useState<Piece[]>([]);

  useEffect(() => {
    if (trigger) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setActivePieces(makePieces(pieces));
      const t = setTimeout(() => {
        setActivePieces([]);
        onDone?.();
      }, durationMs);
      return () => clearTimeout(t);
    }
  }, [trigger, durationMs, onDone, pieces]);

  if (activePieces.length === 0) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-[60] overflow-hidden" aria-hidden>
      {activePieces.map((p, i) => (
        <span
          key={i}
          style={
            {
              position: 'absolute',
              top: '-12px',
              left: p.left,
              width: `${p.width}px`,
              height: `${p.height}px`,
              background: p.color,
              borderRadius: p.radius,
              transform: `rotate(${p.rotateStart}deg)`,
              animation: `confetti-fall ${p.duration}s ${p.delay}ms cubic-bezier(.2,.6,.4,1) forwards`,
              ['--drift' as string]: `${p.drift}px`,
            } as React.CSSProperties
          }
        />
      ))}
      <style>{`
        @keyframes confetti-fall {
          0% { transform: translate(0, -20px) rotate(0deg); opacity: 1; }
          100% { transform: translate(var(--drift), 110vh) rotate(720deg); opacity: 0; }
        }
      `}</style>
    </div>
  );
}
