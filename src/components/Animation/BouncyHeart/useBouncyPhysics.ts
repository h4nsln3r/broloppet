// src/components/Animation/BouncyHeart/useBouncyPhysics.ts
import { useEffect, useRef, useCallback } from "react";
import { useAnimationFrame, useMotionValue, MotionValue } from "framer-motion";

type UseBouncyPhysicsOptions = {
  containerRef: React.RefObject<HTMLElement | null>;
  paused?: boolean;
  onBounce?: () => void;
  /** Optionell startposition (t.ex. för andra hjärtat) */
  initialX?: number;
  initialY?: number;
  /** När true körs inte fysiken (används när extern fysik används) */
  skipPhysics?: boolean;
};

type UseBouncyPhysicsResult = {
  x: MotionValue<number>;
  y: MotionValue<number>;
  boost: () => void;
  /** Lägg till hastighet (t.ex. från drag/släpp) – ökar farten */
  applyVelocity: (vx: number, vy: number) => void;
  /** Sätt position (t.ex. efter drag) */
  setPosition: (px: number, py: number) => void;
};

const VELOCITY_MAX = 520;

export function useBouncyPhysics({
  containerRef,
  paused = false,
  onBounce,
  initialX,
  initialY,
  skipPhysics = false,
}: UseBouncyPhysicsOptions): UseBouncyPhysicsResult {
  const x = useMotionValue(40);
  const y = useMotionValue(40);

  // velocity i px/sek
  const vxRef = useRef(140);
  const vyRef = useRef(110);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const r = el.getBoundingClientRect();
    const maxX = Math.max(10, r.width - 54);
    const maxY = Math.max(10, r.height - 54);
    if (initialX != null && initialY != null) {
      x.set(Math.max(10, Math.min(initialX, maxX)));
      y.set(Math.max(10, Math.min(initialY, maxY)));
    } else {
      x.set(Math.max(16, Math.min(120, maxX)));
      y.set(Math.max(16, Math.min(120, maxY)));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const clamp = (v: number) => Math.max(-VELOCITY_MAX, Math.min(VELOCITY_MAX, v));

  const boost = useCallback(() => {
    const boost = 180;
    vxRef.current = clamp(vxRef.current + (Math.random() * 2 - 1) * boost);
    vyRef.current = clamp(vyRef.current + (Math.random() * 2 - 1) * boost);
  }, []);

  const applyVelocity = useCallback((vx: number, vy: number) => {
    vxRef.current = clamp(vxRef.current + vx);
    vyRef.current = clamp(vyRef.current + vy);
  }, []);

  const setPosition = useCallback(
    (px: number, py: number) => {
      const el = containerRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const size = 44;
      const padding = 10;
      const maxX = Math.max(padding, rect.width - size - padding);
      const maxY = Math.max(padding, rect.height - size - padding);
      x.set(Math.max(padding, Math.min(px, maxX)));
      y.set(Math.max(padding, Math.min(py, maxY)));
    },
    [x, y, containerRef]
  );

  useAnimationFrame((_t, delta) => {
    if (skipPhysics || paused) return;

    const el = containerRef.current;
    if (!el) return;

    const dt = delta / 1000;
    const rect = el.getBoundingClientRect();

    const size = 44;
    const padding = 10;

    const minX = padding;
    const minY = padding;
    const maxX = Math.max(padding, rect.width - size - padding);
    const maxY = Math.max(padding, rect.height - size - padding);

    let nx = x.get() + vxRef.current * dt;
    let ny = y.get() + vyRef.current * dt;

    let bounced = false;

    if (nx <= minX) {
      nx = minX;
      vxRef.current = Math.abs(vxRef.current);
      bounced = true;
    } else if (nx >= maxX) {
      nx = maxX;
      vxRef.current = -Math.abs(vxRef.current);
      bounced = true;
    }

    if (ny <= minY) {
      ny = minY;
      vyRef.current = Math.abs(vyRef.current);
      bounced = true;
    } else if (ny >= maxY) {
      ny = maxY;
      vyRef.current = -Math.abs(vyRef.current);
      bounced = true;
    }

    x.set(nx);
    y.set(ny);

    if (bounced && onBounce) {
      onBounce();
    }
  });

  return { x, y, boost, applyVelocity, setPosition };
}
