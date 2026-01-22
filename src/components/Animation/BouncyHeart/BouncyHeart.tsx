// src/components/Animation/BouncyHeart/BouncyHeart.tsx
import { motion } from "framer-motion";
import { useBouncyPhysics } from "./useBouncyPhysics";
import { useLongPressProgress } from "./useLongPressProgress";
import { BouncyRing } from "./BouncyRing";

type BouncyHeartProps = {
  /** Ref till ytan hjärtat ska studsa inom (t.ex. header.hero) */
  containerRef: React.RefObject<HTMLElement | null>;
  /** Klick/tap ger en extra knuff */
  boostOnClick?: boolean;
  /** Körs varje gång hjärtat studsar mot en vägg */
  onBounce?: () => void;
};

export function BouncyHeart({
  containerRef,
  boostOnClick = true,
  onBounce,
}: BouncyHeartProps) {
  // Long press (3s, visuell start efter 0.5s)
  const { progress, isHolding, completed, startHolding, stopHolding } =
    useLongPressProgress({
      totalMs: 3000,
      visualDelayMs: 500,
      onComplete: () => {
        alert("Du höll kvar i hjärtat i 3 sekunder – det måste vara kärlek 💕");
      },
    });

  // Studs-fysik (pausas när man håller nere)
  const { x, y, boost } = useBouncyPhysics({
    containerRef,
    paused: isHolding,
    onBounce,
  });

  const handlePointerDown = () => {
    startHolding();
  };

  const handlePointerUp = () => {
    const wasCompleted = completed;
    stopHolding();

    // Om man inte höll klart hela tiden → liten boost
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

  return (
    <motion.button
      type="button"
      className="hero__bouncyHeart hero__bouncyHeart--bare"
      style={{ x, y }}
      aria-label="Kärlekshjärta"
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerCancel}
      onPointerLeave={handlePointerLeave}
      whileTap={{ scale: 0.9 }}
      whileHover={{ scale: 1.05 }}
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.35 }}
    >
      <BouncyRing progress={progress} />❤
    </motion.button>
  );
}
