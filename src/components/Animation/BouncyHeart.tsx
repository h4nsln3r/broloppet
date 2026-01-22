// src/components/Animation/BouncyHeart.tsx
import { useEffect, useRef, useState } from "react";
import { motion, useAnimationFrame, useMotionValue } from "framer-motion";

type BouncyHeartProps = {
  /** Ref till ytan hjärtat ska studsa inom (t.ex. header.hero) */
  containerRef: React.RefObject<HTMLElement | null>;
  /** Klick/tap ger en extra knuff */
  boostOnClick?: boolean;
  /** Körs varje gång hjärtat studsar mot en vägg */
  onBounce?: () => void;
};

const HOLD_TOTAL_MS = 3000; // totalt 3 sekunder
const HOLD_VISUAL_DELAY_MS = 500; // 0.5s innan man ser laddningen

// Ring-geometri
const RADIUS = 18;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export function BouncyHeart({
  containerRef,
  boostOnClick = true,
  onBounce,
}: BouncyHeartProps) {
  const x = useMotionValue(40);
  const y = useMotionValue(40);

  // velocity i px/sek
  const vxRef = useRef(140);
  const vyRef = useRef(110);

  // Long-press state
  const [holdProgress, setHoldProgress] = useState(0); // 0–1 för ringen
  const isHoldingRef = useRef(false);
  const holdElapsedMsRef = useRef(0);
  const holdCompletedRef = useRef(false);

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

  function resetHold() {
    isHoldingRef.current = false;
    holdElapsedMsRef.current = 0;
    holdCompletedRef.current = false;
    setHoldProgress(0);
  }

  useAnimationFrame((_t, delta) => {
    const el = containerRef.current;
    if (!el) return;

    // --- Long press / laddning ---
    if (isHoldingRef.current) {
      holdElapsedMsRef.current += delta;

      // 1) beräkna visuell progress med 0.5s delay
      const visualElapsed = Math.max(
        0,
        holdElapsedMsRef.current - HOLD_VISUAL_DELAY_MS,
      );
      const visualDuration = Math.max(1, HOLD_TOTAL_MS - HOLD_VISUAL_DELAY_MS);
      const visualProgress = Math.min(1, visualElapsed / visualDuration);
      setHoldProgress(visualProgress);

      // 2) själva “klar”-logiken efter totalt 3s
      if (
        holdElapsedMsRef.current >= HOLD_TOTAL_MS &&
        !holdCompletedRef.current
      ) {
        holdCompletedRef.current = true;
        alert("Du höll kvar i hjärtat i 3 sekunder – det måste vara kärlek 💕");
      }

      // Pausa studset när man håller
      return;
    }

    // --- Bouncy-fysik ---
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

  return (
    <motion.button
      type="button"
      className="hero__bouncyHeart hero__bouncyHeart--bare"
      style={{ x, y }}
      aria-label="Kärlekshjärta"
      onPointerDown={() => {
        isHoldingRef.current = true;
        holdElapsedMsRef.current = 0;
        holdCompletedRef.current = false;
        setHoldProgress(0);
      }}
      onPointerUp={() => {
        const completed = holdCompletedRef.current;
        resetHold();
        if (boostOnClick && !completed) {
          boost();
        }
      }}
      onPointerCancel={resetHold}
      onPointerLeave={(e) => {
        if (e.buttons === 0) {
          resetHold();
        }
      }}
      whileTap={{ scale: 0.9 }}
      whileHover={{ scale: 1.05 }}
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.35 }}
    >
      {/* Laddring runt hjärtat */}
      <svg
        className="hero__bouncyHeartRing"
        viewBox="0 0 44 44"
        style={{ opacity: holdProgress > 0 ? 1 : 0.45 }}
      >
        <circle
          className="hero__bouncyHeartRingBg"
          cx="22"
          cy="22"
          r={RADIUS}
        />
        <circle
          className="hero__bouncyHeartRingProgress"
          cx="22"
          cy="22"
          r={RADIUS}
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={CIRCUMFERENCE * (1 - holdProgress)}
        />
      </svg>
      {/* Själva hjärt-ikonen */}❤
    </motion.button>
  );
}
