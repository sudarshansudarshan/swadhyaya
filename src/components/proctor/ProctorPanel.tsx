'use client';

import { useEffect } from 'react';
import { ProctorProvider, useProctor } from './ProctorProvider';
import { FloatingVideo } from './FloatingVideo';

type Props = {
  itemId: string;
  onAnomaly?: (type: string, severity: number) => void;
  onFail?: () => void;
  children: React.ReactNode;
};

function ProctorMonitor({ onAnomaly }: { onAnomaly?: Props['onAnomaly'] }) {
  const { anomalies } = useProctor();

  useEffect(() => {
    if (anomalies.length === 0) return;
    const latest = anomalies[anomalies.length - 1];
    onAnomaly?.(latest.type, latest.severity);
  }, [anomalies, onAnomaly]);

  return <FloatingVideo />;
}

export function ProctorPanel({ itemId, onAnomaly, onFail, children }: Props) {
  return (
    <ProctorProvider itemId={itemId} onFail={onFail}>
      <ProctorMonitor onAnomaly={onAnomaly} />
      {children}
    </ProctorProvider>
  );
}
