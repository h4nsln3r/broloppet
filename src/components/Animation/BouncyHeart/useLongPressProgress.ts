// src/components/Animation/BouncyHeart/useLongPressProgress.ts
import { useCallback, useRef, useState } from "react";
import { useAnimationFrame } from "framer-motion";

type UseLongPressProgressOptions = {
  totalMs: number;
  visualDelayMs?: number;
  onComplete?: () => void;
};

type UseLongPressProgressResult = {
  progress: number; // 0–1
  isHolding: boolean;
  completed: boolean;
  startHolding: () => void;
  stopHolding: () => void;
};

export function useLongPressProgress({
  totalMs,
  visualDelayMs = 0,
  onComplete,
}: UseLongPressProgressOptions): UseLongPressProgressResult {
  const [progress, setProgress] = useState(0);
  const [isHolding, setIsHolding] = useState(false);
  const [completed, setCompleted] = useState(false);

  const isHoldingRef = useRef(false);
  const elapsedMsRef = useRef(0);
  const completedRef = useRef(false);

  const startHolding = useCallback(() => {
    isHoldingRef.current = true;
    elapsedMsRef.current = 0;
    completedRef.current = false;
    setCompleted(false);
    setProgress(0);
    setIsHolding(true);
  }, []);

  const stopHolding = useCallback(() => {
    isHoldingRef.current = false;
    elapsedMsRef.current = 0;
    completedRef.current = false;
    setIsHolding(false);
    setProgress(0);
    setCompleted(false);
  }, []);

  useAnimationFrame((_t, delta) => {
    if (!isHoldingRef.current) return;

    elapsedMsRef.current += delta;

    // visuell progress börjar först efter visualDelayMs
    const visualElapsed = Math.max(0, elapsedMsRef.current - visualDelayMs);
    const visualDuration = Math.max(1, totalMs - visualDelayMs);
    const visualProgress = Math.min(1, visualElapsed / visualDuration);
    setProgress(visualProgress);

    if (elapsedMsRef.current >= totalMs && !completedRef.current) {
      completedRef.current = true;
      setCompleted(true);
      if (onComplete) onComplete();
    }
  });

  return {
    progress,
    isHolding,
    completed,
    startHolding,
    stopHolding,
  };
}
