'use client';

import { useState, useEffect, useRef } from 'react';

type Props = {
  onTabSwitch?: (evt: { type: string; timestamp?: number }) => void;
  onTabReturn?: () => void;
  enabled?: boolean;
};

export function useTabSwitch({ onTabSwitch, onTabReturn, enabled = true }: Props) {
  const [isFocused, setIsFocused] = useState(true);
  const [switchCount, setSwitchCount] = useState(0);
  const onSwitchRef = useRef(onTabSwitch);
  const onReturnRef = useRef(onTabReturn);

  useEffect(() => {
    onSwitchRef.current = onTabSwitch;
  }, [onTabSwitch]);
  useEffect(() => {
    onReturnRef.current = onTabReturn;
  }, [onTabReturn]);

  useEffect(() => {
    if (!enabled) return;

    const handleVisibility = () => {
      const focused = document.visibilityState === 'visible';
      setIsFocused(focused);
      if (!focused) {
        setSwitchCount((c) => c + 1);
        onSwitchRef.current?.({ type: 'tab_switch', timestamp: Date.now() });
      } else {
        onReturnRef.current?.();
      }
    };

    const handleBlur = () => {
      setIsFocused(false);
      setSwitchCount((c) => c + 1);
      onSwitchRef.current?.({ type: 'tab_blur', timestamp: Date.now() });
    };

    const handleFocus = () => {
      setIsFocused(true);
      onReturnRef.current?.();
    };

    document.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('blur', handleBlur);
    window.addEventListener('focus', handleFocus);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('blur', handleBlur);
      window.removeEventListener('focus', handleFocus);
    };
  }, [enabled]);

  return { isFocused, switchCount };
}
