import { useEffect, useRef } from "react";
import { motion, useAnimationFrame, useMotionValue } from "framer-motion";

type BouncyHeartProps = {
  /** Ref till ytan hjärtat ska studsa inom (t.ex. header.hero) */
  containerRef: React.RefObject<HTMLElement>;
  /** Klick/tap ger en extra knuff */
  boostOnClick?: boolean;
};

export function BouncyHeart({
  containerRef,
  boostOnClick = true,
}: BouncyHeartProps) {
  const x = useMotionValue(40);
  const y = useMotionValue(40);

  // velocity i px/sek
  const vxRef = useRef(140);
  const vyRef = useRef(110);

  const draggingRef = useRef(false);

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
    if (draggingRef.current) return;

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

    if (nx <= minX) {
      nx = minX;
      vxRef.current = Math.abs(vxRef.current);
    } else if (nx >= maxX) {
      nx = maxX;
      vxRef.current = -Math.abs(vxRef.current);
    }

    if (ny <= minY) {
      ny = minY;
      vyRef.current = Math.abs(vyRef.current);
    } else if (ny >= maxY) {
      ny = maxY;
      vyRef.current = -Math.abs(vyRef.current);
    }

    x.set(nx);
    y.set(ny);
  });

  return (
    <motion.button
      type="button"
      className="hero__bouncyHeart hero__bouncyHeart--bare"
      style={{ x, y }}
      aria-label="Kärlekshjärta"
      onPointerDown={() => (draggingRef.current = true)}
      onPointerUp={() => (draggingRef.current = false)}
      onPointerCancel={() => (draggingRef.current = false)}
      onClick={() => boostOnClick && boost()}
      drag
      dragMomentum={false}
      onDragEnd={() => {
        draggingRef.current = false;
        boostOnClick && boost();
      }}
      whileTap={{ scale: 0.9 }}
      whileHover={{ scale: 1.05 }}
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.35 }}
    >
      ❤
    </motion.button>
  );
}
