// Fysik för två hjärtan med kollision mellan dem (studs som bollar).
import { useEffect, useRef, useCallback } from "react";
import { useAnimationFrame, useMotionValue, MotionValue } from "framer-motion";

const SIZE = 44;
const PADDING = 10;
const VELOCITY_MAX = 520;
const HEART_RADIUS = SIZE / 2;

type BodyResult = {
  x: MotionValue<number>;
  y: MotionValue<number>;
  boost: () => void;
  applyVelocity: (vx: number, vy: number) => void;
};

type UseDualBouncyPhysicsOptions = {
  containerRef: React.RefObject<HTMLElement | null>;
  /** Första kroppen pausad (t.ex. håller in) */
  paused1?: boolean;
  /** Andra kroppen pausad */
  paused2?: boolean;
  onBounce1?: () => void;
  onBounce2?: () => void;
  /** Startposition andra hjärtat (när det spawnar) */
  initial2?: { x: number; y: number };
};

export function useDualBouncyPhysics({
  containerRef,
  paused1 = false,
  paused2 = false,
  onBounce1,
  onBounce2,
  initial2,
}: UseDualBouncyPhysicsOptions): { body1: BodyResult; body2: BodyResult } {
  const x1 = useMotionValue(40);
  const y1 = useMotionValue(40);
  const x2 = useMotionValue(90);
  const y2 = useMotionValue(70);

  const vx1 = useRef(140);
  const vy1 = useRef(110);
  const vx2 = useRef(-120);
  const vy2 = useRef(90);

  const clamp = (v: number) =>
    Math.max(-VELOCITY_MAX, Math.min(VELOCITY_MAX, v));

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const maxX = Math.max(PADDING, r.width - SIZE - PADDING);
    const maxY = Math.max(PADDING, r.height - SIZE - PADDING);
    x1.set(Math.max(16, Math.min(120, maxX)));
    y1.set(Math.max(16, Math.min(120, maxY)));
    if (initial2) {
      x2.set(Math.max(PADDING, Math.min(initial2.x, maxX)));
      y2.set(Math.max(PADDING, Math.min(initial2.y, maxY)));
    } else {
      x2.set(Math.max(PADDING, Math.min(90, maxX)));
      y2.set(Math.max(PADDING, Math.min(70, maxY)));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!initial2) return;
    const el = containerRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const maxX = Math.max(PADDING, r.width - SIZE - PADDING);
    const maxY = Math.max(PADDING, r.height - SIZE - PADDING);
    x2.set(Math.max(PADDING, Math.min(initial2.x, maxX)));
    y2.set(Math.max(PADDING, Math.min(initial2.y, maxY)));
  }, [initial2, containerRef, x2, y2]);

  const boost1 = useCallback(() => {
    const b = 180;
    vx1.current = clamp(vx1.current + (Math.random() * 2 - 1) * b);
    vy1.current = clamp(vy1.current + (Math.random() * 2 - 1) * b);
  }, []);

  const boost2 = useCallback(() => {
    const b = 180;
    vx2.current = clamp(vx2.current + (Math.random() * 2 - 1) * b);
    vy2.current = clamp(vy2.current + (Math.random() * 2 - 1) * b);
  }, []);

  const applyVelocity1 = useCallback((vx: number, vy: number) => {
    vx1.current = clamp(vx1.current + vx);
    vy1.current = clamp(vy1.current + vy);
  }, []);

  const applyVelocity2 = useCallback((vx: number, vy: number) => {
    vx2.current = clamp(vx2.current + vx);
    vy2.current = clamp(vy2.current + vy);
  }, []);

  useAnimationFrame((_t, delta) => {
    const el = containerRef.current;
    if (!el) return;
    const dt = delta / 1000;
    const rect = el.getBoundingClientRect();
    const minX = PADDING;
    const minY = PADDING;
    const maxX = Math.max(PADDING, rect.width - SIZE - PADDING);
    const maxY = Math.max(PADDING, rect.height - SIZE - PADDING);

    const step = (nx: number, ny: number, vx: React.MutableRefObject<number>, vy: React.MutableRefObject<number>) => {
      let x = nx;
      let y = ny;
      let bounced = false;
      if (x <= minX) {
        x = minX;
        vx.current = Math.abs(vx.current);
        bounced = true;
      } else if (x >= maxX) {
        x = maxX;
        vx.current = -Math.abs(vx.current);
        bounced = true;
      }
      if (y <= minY) {
        y = minY;
        vy.current = Math.abs(vy.current);
        bounced = true;
      } else if (y >= maxY) {
        y = maxY;
        vy.current = -Math.abs(vy.current);
        bounced = true;
      }
      return { x, y, bounced };
    };

    if (!paused1) {
      let nx1 = x1.get() + vx1.current * dt;
      let ny1 = y1.get() + vy1.current * dt;
      const r1 = step(nx1, ny1, vx1, vy1);
      x1.set(r1.x);
      y1.set(r1.y);
      if (r1.bounced && onBounce1) onBounce1();
    }
    const hasSecond = initial2 != null;
    if (hasSecond && !paused2) {
      let nx2 = x2.get() + vx2.current * dt;
      let ny2 = y2.get() + vy2.current * dt;
      const r2 = step(nx2, ny2, vx2, vy2);
      x2.set(r2.x);
      y2.set(r2.y);
      if (r2.bounced && onBounce2) onBounce2();
    }

    // Kollision mellan hjärtana (bara när båda finns)
    if (!hasSecond) return;

    // Kollision mellan hjärtana: studs som bollar (elastisk, lika massa)
    const px1 = x1.get();
    const py1 = y1.get();
    const px2 = x2.get();
    const py2 = y2.get();
    const dx = px2 - px1;
    const dy = py2 - py1;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < HEART_RADIUS * 2 && dist > 0.1) {
      const nx = dx / dist;
      const ny = dy / dist;
      const overlap = HEART_RADIUS * 2 - dist;
      x1.set(px1 - (nx * overlap) / 2);
      y1.set(py1 - (ny * overlap) / 2);
      x2.set(px2 + (nx * overlap) / 2);
      y2.set(py2 + (ny * overlap) / 2);
      const v1n = vx1.current * nx + vy1.current * ny;
      const v2n = vx2.current * nx + vy2.current * ny;
      const swap = v1n - v2n;
      vx1.current = vx1.current - swap * nx;
      vy1.current = vy1.current - swap * ny;
      vx2.current = vx2.current + swap * nx;
      vy2.current = vy2.current + swap * ny;
      if (onBounce1) onBounce1();
      if (onBounce2) onBounce2();
    }
  });

  return {
    body1: { x: x1, y: y1, boost: boost1, applyVelocity: applyVelocity1 },
    body2: { x: x2, y: y2, boost: boost2, applyVelocity: applyVelocity2 },
  };
}
