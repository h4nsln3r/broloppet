// src/components/Animation/BouncyHeart/BouncyHeart.tsx
import { useState, useCallback, useEffect, useRef } from "react";
import { motion, type PanInfo } from "framer-motion";
import { useBouncyPhysics } from "./useBouncyPhysics";
import { useLongPressProgress } from "./useLongPressProgress";
import { BouncyRing } from "./BouncyRing";
import "./bouncyheart.scss";

export type BouncyHeartPhysics = {
  x: import("framer-motion").MotionValue<number>;
  y: import("framer-motion").MotionValue<number>;
  boost: () => void;
  applyVelocity: (vx: number, vy: number) => void;
};

type BouncyHeartProps = {
  /** Ref till ytan hjärtat ska studsa inom (t.ex. header.hero) */
  containerRef: React.RefObject<HTMLElement | null>;
  /** Klick/tap ger en extra knuff */
  boostOnClick?: boolean;
  /** Körs varje gång hjärtat studsar mot en vägg (eller annat hjärta) */
  onBounce?: () => void;
  /** Körs när man hållit 3 sek – får aktuell position så andra hjärtat kan spawna där */
  onLongPressComplete?: (position: { x: number; y: number }) => void;
  /** Optionell startposition (t.ex. för andra hjärtat) */
  initialX?: number;
  initialY?: number;
  /** Extern fysik (när Hero använder dual physics med kollision) */
  physics?: BouncyHeartPhysics;
  /** Rapportera när hjärtat är pausat (håll/drag) så dual physics pausar rätt */
  onPausedChange?: (paused: boolean) => void;
};

export function BouncyHeart({
  containerRef,
  boostOnClick = true,
  onBounce,
  onLongPressComplete,
  initialX,
  initialY,
  physics: externalPhysics,
  onPausedChange,
}: BouncyHeartProps) {
  const [isDragging, setIsDragging] = useState(false);

  const { progress, isHolding, completed, startHolding, stopHolding } =
    useLongPressProgress({
      totalMs: 3000,
      visualDelayMs: 500,
    });

  const internalPhysics = useBouncyPhysics({
    containerRef,
    paused: isHolding || isDragging,
    onBounce,
    initialX,
    initialY,
    skipPhysics: Boolean(externalPhysics),
  });

  const { x, y, boost, applyVelocity } = externalPhysics ?? internalPhysics;

  useEffect(() => {
    if (externalPhysics) {
      onPausedChange?.(isHolding || isDragging);
    }
  }, [externalPhysics, isHolding, isDragging, onPausedChange]);

  const completedReportedRef = useRef(false);
  useEffect(() => {
    if (completed && onLongPressComplete && !completedReportedRef.current) {
      completedReportedRef.current = true;
      onLongPressComplete({ x: x.get(), y: y.get() });
    }
    if (!completed) completedReportedRef.current = false;
  }, [completed, onLongPressComplete, x, y]);

  const handlePointerDown = () => {
    if (onLongPressComplete) startHolding();
  };

  const handlePointerUp = () => {
    const wasCompleted = completed;
    stopHolding();
    if (boostOnClick && !wasCompleted) {
      boost();
    }
  };

  const handlePointerCancel = () => {
    stopHolding();
  };

  const handlePointerLeave: React.PointerEventHandler<HTMLButtonElement> = (
    e,
  ) => {
    if (e.buttons === 0) {
      stopHolding();
    }
  };

  const handleDragStart = useCallback(() => {
    setIsDragging(true);
  }, []);

  const handleDragEnd = useCallback(
    (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
      setIsDragging(false);
      const { velocity } = info;
      applyVelocity(velocity.x, velocity.y);
    },
    [applyVelocity]
  );

  const scaleWhileHolding = 1 + progress * 0.4;

  return (
    <motion.button
      type="button"
      className="bouncyHeart hero__bouncyHeart--bare"
      style={{ x, y }}
      aria-label="Kärlekshjärta"
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerCancel}
      onPointerLeave={handlePointerLeave}
      drag
      dragMomentum={false}
      dragElastic={0.05}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      dragConstraints={containerRef}
      whileTap={isHolding ? undefined : { scale: 0.95 }}
      whileHover={isHolding ? undefined : { scale: 1.05 }}
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{
        scale: isHolding ? scaleWhileHolding : 1,
        opacity: 1,
      }}
      transition={{ scale: { duration: 0.15 }, opacity: { duration: 0.35 } }}
    >
      <BouncyRing progress={progress} />❤
    </motion.button>
  );
}
