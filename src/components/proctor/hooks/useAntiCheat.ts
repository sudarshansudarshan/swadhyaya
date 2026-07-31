'use client';

import { useEffect, useCallback, useRef } from 'react';

type Props = {
  enabled?: boolean;
  onViolation?: (evt: { type: string; metadata?: Record<string, unknown> }) => void;
};

export function useAntiCheat({ enabled = true, onViolation }: Props) {
  const onRef = useRef(onViolation);

  useEffect(() => {
    onRef.current = onViolation;
  });

  const reportViolation = useCallback((type: string, meta?: Record<string, unknown>) => {
    onRef.current?.({ type, metadata: meta });
  }, []);

  useEffect(() => {
    if (!enabled) return;

    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      reportViolation('right_click', { element: (e.target as HTMLElement)?.tagName });
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      const k = e.key;
      const mod = (e.ctrlKey || e.metaKey) && !e.shiftKey;

      if ((e.ctrlKey || e.metaKey) && k === 'c' && !e.shiftKey) {
        e.preventDefault();
        reportViolation('copy_paste', { action: 'copy' });
        return;
      }
      if ((e.ctrlKey || e.metaKey) && k === 'v') {
        e.preventDefault();
        reportViolation('copy_paste', { action: 'paste' });
        return;
      }
      if ((e.ctrlKey || e.metaKey) && k === 'u') {
        e.preventDefault();
        reportViolation('copy_paste', { action: 'view_source' });
        return;
      }
      if (mod && k === 's') {
        e.preventDefault();
        reportViolation('copy_paste', { action: 'save' });
        return;
      }
      if (k === 'F12') {
        e.preventDefault();
        reportViolation('devtools', { action: 'F12' });
        return;
      }
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && k === 'I') {
        e.preventDefault();
        reportViolation('devtools', { action: 'Ctrl+Shift+I' });
        return;
      }
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && k === 'J') {
        e.preventDefault();
        reportViolation('devtools', { action: 'Ctrl+Shift+J' });
        return;
      }
      if (e.metaKey && e.altKey && k.toLowerCase() === 'i') {
        e.preventDefault();
        reportViolation('devtools', { action: 'Cmd+Option+I' });
        return;
      }
      if (e.metaKey && e.altKey && k.toLowerCase() === 'j') {
        e.preventDefault();
        reportViolation('devtools', { action: 'Cmd+Option+J' });
        return;
      }
      if (e.metaKey && e.altKey && k.toLowerCase() === 'u') {
        e.preventDefault();
        reportViolation('copy_paste', { action: 'Cmd+Option+U' });
        return;
      }
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && k === 'C') {
        e.preventDefault();
        reportViolation('devtools', { action: 'Ctrl+Shift+C' });
        return;
      }
      if (mod && k === 'p') {
        e.preventDefault();
        reportViolation('copy_paste', { action: 'print' });
        return;
      }
      if (mod && k === 't') {
        e.preventDefault();
        reportViolation('tab_switch', { action: 'new_tab' });
        return;
      }
    };

    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [enabled, reportViolation]);
}
