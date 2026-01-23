// src/components/Animation/BouncyHeart/BouncyRing.tsx

const RADIUS = 18;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

type BouncyRingProps = {
  progress: number; // 0–1
};

export function BouncyRing({ progress }: BouncyRingProps) {
  const safeProgress = Math.min(1, Math.max(0, progress));

  return (
    <svg
      className="hero__bouncyHeartRing"
      viewBox="0 0 44 44"
      style={{ opacity: safeProgress > 0 ? 1 : 0.45 }}
    >
      <circle className="hero__bouncyHeartRingBg" cx="22" cy="22" r={RADIUS} />
      <circle
        className="hero__bouncyHeartRingProgress"
        cx="22"
        cy="22"
        r={RADIUS}
        strokeDasharray={CIRCUMFERENCE}
        strokeDashoffset={CIRCUMFERENCE * (1 - safeProgress)}
      />
    </svg>
  );
}
