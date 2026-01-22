// src/components/Animation/BouncyHeart/useBouncyPhysics.ts
import { useEffect, useRef } from "react";
import { useAnimationFrame, useMotionValue, MotionValue } from "framer-motion";

type UseBouncyPhysicsOptions = {
  containerRef: React.RefObject<HTMLElement | null>;
  paused?: boolean;
  onBounce?: () => void;
};

type UseBouncyPhysicsResult = {
  x: MotionValue<number>;
  y: MotionValue<number>;
  boost: () => void;
};

export function useBouncyPhysics({
  containerRef,
  paused = false,
  onBounce,
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
    x.set(Math.max(16, Math.min(120, r.width - 60)));
    y.set(Math.max(16, Math.min(120, r.height - 60)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const clamp = (v: number) => Math.max(-420, Math.min(420, v));

  function boost() {
    const boost = 180;
    vxRef.current = clamp(vxRef.current + (Math.random() * 2 - 1) * boost);
    vyRef.current = clamp(vyRef.current + (Math.random() * 2 - 1) * boost);
  }

  useAnimationFrame((_t, delta) => {
    if (paused) return;

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

  return { x, y, boost };
}
