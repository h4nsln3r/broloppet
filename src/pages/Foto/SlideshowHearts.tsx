import { useCallback, useRef, useState } from "react";
import { BouncyHeart } from "../../components/Animation/BouncyHeart";
import { useDualBouncyPhysics } from "../../components/Animation/BouncyHeart/useDualBouncyPhysics";

/** Låt övergången hinna spelas ut innan nästa studs byter bild. */
const BOUNCE_ADVANCE_MIN_MS = 700;

type SlideshowHeartsProps = {
  containerRef: React.RefObject<HTMLElement | null>;
  onBounce: () => void;
  speed?: number;
};

export function SlideshowHearts({
  containerRef,
  onBounce,
  speed = 1,
}: SlideshowHeartsProps) {
  const [secondHeartSpawn, setSecondHeartSpawn] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const [heart1Paused, setHeart1Paused] = useState(false);
  const lastAdvanceAtRef = useRef(0);

  const advanceOnBounce = useCallback(() => {
    const now = performance.now();
    const minMs = Math.max(250, BOUNCE_ADVANCE_MIN_MS / Math.max(0.1, speed));
    if (now - lastAdvanceAtRef.current < minMs) return;
    lastAdvanceAtRef.current = now;
    onBounce();
  }, [onBounce, speed]);

  const { body1, body2 } = useDualBouncyPhysics({
    containerRef,
    paused1: heart1Paused,
    onBounce1: advanceOnBounce,
    onBounce2: advanceOnBounce,
    initial2: secondHeartSpawn ?? undefined,
    speed,
  });

  return (
    <div className="foto-slideshow__hearts">
      <BouncyHeart
        containerRef={containerRef}
        physics={body1}
        onPausedChange={setHeart1Paused}
        onLongPressComplete={(pos) => setSecondHeartSpawn(pos)}
      />
      {secondHeartSpawn && (
        <BouncyHeart containerRef={containerRef} physics={body2} />
      )}
    </div>
  );
}
