import "./flowerbouquet.scss";

type BouquetProps = {
  className?: string;
  /** Bredd i px eller css-string */
  width?: number | string;
  /** Höjd i px eller css-string */
  height?: number | string;
  /** Hastighetsmultiplikator: 1 = normal, 2 = dubbelt så snabbt */
  speed?: number;
  /** Stäng av animationer helt */
  reduceMotion?: boolean;
};

export default function FlowerBouquet({
  className,
  width,
  height,
  speed = 1,
  reduceMotion = false,
}: BouquetProps) {
  const s = Math.max(0.1, speed);

  return (
    <div className={className} style={{ width, height }}>
      <svg
        viewBox="0 0 360 360"
        width="100%"
        height="100%"
        role="img"
        aria-label="Animerad färgglad blombukett"
        style={{ display: "block", overflow: "visible" }}
      >
        <defs>
          <radialGradient id="bgGlow" cx="50%" cy="35%" r="65%">
            <stop offset="0%" stopColor="rgba(255,255,255,0.95)" />
            <stop offset="45%" stopColor="rgba(255,255,255,0.35)" />
            <stop offset="100%" stopColor="rgba(255,255,255,0)" />
          </radialGradient>

          <linearGradient id="stem" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#2EE59D" />
            <stop offset="55%" stopColor="#0FAE74" />
            <stop offset="100%" stopColor="#0A7A54" />
          </linearGradient>

          <filter id="softShadow" x="-40%" y="-40%" width="180%" height="180%">
            <feDropShadow dx="0" dy="6" stdDeviation="6" floodOpacity="0.18" />
          </filter>

          <filter id="bloom" x="-60%" y="-60%" width="220%" height="220%">
            <feGaussianBlur stdDeviation="2.6" result="b" />
            <feColorMatrix
              in="b"
              type="matrix"
              values="
                1 0 0 0 0
                0 1 0 0 0
                0 0 1 0 0
                0 0 0 0.6 0"
              result="c"
            />
            <feMerge>
              <feMergeNode in="c" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          <style>{`
            .bgGlow { fill: url(#bgGlow); }

            .wrap { filter: url(#softShadow); transform-origin: 180px 300px; }

            .stem { fill: none; stroke: url(#stem); stroke-width: 8; stroke-linecap: round; }
            .stemThin { fill: none; stroke: url(#stem); stroke-width: 6; stroke-linecap: round; opacity: 0.9; }
            .leaf { fill: #16C784; opacity: 0.95; filter: url(#bloom); }

            .flower { filter: url(#bloom); transform-origin: center; }
            .petal { transform-origin: var(--ox) var(--oy); }
            .core { filter: url(#bloom); }

            .sparkle { opacity: 0.9; filter: url(#bloom); }

            @keyframes sway {
              0%   { transform: rotate(-2.6deg) translateY(0px); }
              50%  { transform: rotate(2.6deg) translateY(-2px); }
              100% { transform: rotate(-2.6deg) translateY(0px); }
            }

            @keyframes sway2 {
              0%   { transform: rotate(1.8deg); }
              50%  { transform: rotate(-1.8deg); }
              100% { transform: rotate(1.8deg); }
            }

            @keyframes bloomPulse {
              0%   { transform: scale(0.985); }
              50%  { transform: scale(1.03); }
              100% { transform: scale(0.985); }
            }

            @keyframes petalWiggle {
              0%   { transform: rotate(-1.2deg); }
              50%  { transform: rotate(1.2deg); }
              100% { transform: rotate(-1.2deg); }
            }

            @keyframes floatUp {
              0%   { transform: translateY(0px) translateX(0px) scale(0.9); opacity: 0; }
              15%  { opacity: 0.85; }
              70%  { opacity: 0.55; }
              100% { transform: translateY(-70px) translateX(10px) scale(1.15); opacity: 0; }
            }

            /* Respektera användarens OS-inställning */
            @media (prefers-reduced-motion: reduce) {
              .anim { animation: none !important; }
            }
          `}</style>
        </defs>

        {/* mjuk bakgrundsglöd */}
        <circle className="bgGlow" cx="180" cy="120" r="140" />

        <g
          className="wrap anim"
          style={{
            animation: reduceMotion
              ? "none"
              : `sway ${6 / s}s ease-in-out infinite`,
          }}
        >
          {/* Stjälkar */}
          <path className="stem" d="M180 310 C170 265, 150 220, 140 170" />
          <path className="stemThin" d="M190 315 C200 270, 230 225, 245 175" />
          <path className="stemThin" d="M170 318 C160 270, 140 235, 120 200" />

          {/* Blad */}
          <path
            className="leaf"
            d="M160 250 C130 240, 118 220, 132 205 C150 205, 165 225, 160 250 Z"
          />
          <path
            className="leaf"
            d="M210 255 C240 242, 252 222, 238 206 C220 206, 205 226, 210 255 Z"
          />
          <path
            className="leaf"
            d="M150 290 C125 282, 112 266, 122 252 C138 252, 154 268, 150 290 Z"
            opacity="0.85"
          />
          <path
            className="leaf"
            d="M220 292 C245 284, 258 268, 248 254 C232 254, 216 270, 220 292 Z"
            opacity="0.85"
          />

          {/* Bukettband */}
          <g transform="translate(0,0)">
            <path
              d="M150 305 C165 290, 195 290, 210 305 C198 320, 162 320, 150 305 Z"
              fill="#FF4D8D"
              opacity="0.95"
              filter="url(#bloom)"
              style={{
                animation: reduceMotion
                  ? "none"
                  : `leafKick ${3.2 / speed}s steps(1) infinite`,
                animationDelay: `${Math.random() * 2}s`,
              }}
            />
            <path
              d="M172 307 C178 300, 182 300, 188 307 C183 314, 177 314, 172 307 Z"
              fill="#FFD1E0"
              opacity="0.95"
              style={{
                animation: reduceMotion
                  ? "none"
                  : `leafKick ${3.2 / speed}s steps(1) infinite`,
                animationDelay: `${Math.random() * 2}s`,
              }}
            />
          </g>

          {/* Blommor */}
          <Flower
            cx={140}
            cy={165}
            size={38}
            petals={8}
            petalFill="#FF5C7A"
            petalFill2="#FFB3C1"
            core="#FFD54A"
            speed={s}
            reduceMotion={reduceMotion}
          />
          <Flower
            cx={245}
            cy={170}
            size={44}
            petals={10}
            petalFill="#7C5CFF"
            petalFill2="#B9A8FF"
            core="#FFE66D"
            speed={s}
            reduceMotion={reduceMotion}
          />
          <Flower
            cx={120}
            cy={205}
            size={32}
            petals={7}
            petalFill="#00C2FF"
            petalFill2="#9BE7FF"
            core="#FFDA6B"
            speed={s}
            reduceMotion={reduceMotion}
          />
          <Flower
            cx={275}
            cy={205}
            size={34}
            petals={7}
            petalFill="#FF8A00"
            petalFill2="#FFD39B"
            core="#FFF1A8"
            speed={s}
            reduceMotion={reduceMotion}
          />
          <Flower
            cx={180}
            cy={140}
            size={52}
            petals={12}
            petalFill="#22E3A5"
            petalFill2="#B9FFE6"
            core="#FF4D8D"
            speed={s}
            reduceMotion={reduceMotion}
          />

          {/* Små kvistar / filler */}
          <g
            className="anim"
            style={{
              animation: reduceMotion
                ? "none"
                : `sway2 ${5.2 / s}s ease-in-out infinite`,
            }}
          >
            <circle cx="205" cy="190" r="4" fill="#FFFFFF" opacity="0.9" />
            <circle cx="215" cy="200" r="3" fill="#FFFFFF" opacity="0.8" />
            <circle cx="225" cy="210" r="2.5" fill="#FFFFFF" opacity="0.7" />
            <circle cx="155" cy="195" r="4" fill="#FFFFFF" opacity="0.9" />
            <circle cx="145" cy="205" r="3" fill="#FFFFFF" opacity="0.8" />
            <circle cx="135" cy="215" r="2.5" fill="#FFFFFF" opacity="0.7" />
          </g>

          {/* Sparkles */}
          <Sparkle
            x={110}
            y={140}
            delay={0.0}
            speed={s}
            reduceMotion={reduceMotion}
          />
          <Sparkle
            x={290}
            y={150}
            delay={0.9}
            speed={s}
            reduceMotion={reduceMotion}
          />
          <Sparkle
            x={180}
            y={95}
            delay={1.4}
            speed={s}
            reduceMotion={reduceMotion}
          />
          <Sparkle
            x={250}
            y={120}
            delay={2.0}
            speed={s}
            reduceMotion={reduceMotion}
          />
          <Sparkle
            x={130}
            y={115}
            delay={2.6}
            speed={s}
            reduceMotion={reduceMotion}
          />
        </g>
      </svg>
    </div>
  );
}

function Flower({
  cx,
  cy,
  size,
  petals,
  petalFill,
  petalFill2,
  core,
  speed,
  reduceMotion,
}: {
  cx: number;
  cy: number;
  size: number;
  petals: number;
  petalFill: string;
  petalFill2: string;
  core: string;
  speed: number;
  reduceMotion: boolean;
}) {
  const r = size * 0.48;
  const petalW = size * 0.42;
  const petalH = size * 0.24;

  const petalPaths = Array.from({ length: petals }, (_, i) => {
    const a = (i / petals) * Math.PI * 2;
    const px = cx + Math.cos(a) * r;
    const py = cy + Math.sin(a) * r;
    const rot = (a * 180) / Math.PI;

    const fill = i % 2 === 0 ? petalFill : petalFill2;

    return (
      <ellipse
        key={i}
        className="petal anim"
        cx={px}
        cy={py}
        rx={petalW * 0.5}
        ry={petalH * 0.5}
        fill={fill}
        style={{
          transformOrigin: `${cx}px ${cy}px`,
          transform: `rotate(${rot}deg)`,
          animation: reduceMotion
            ? "none"
            : `petalWiggle ${2.8 / speed}s ease-in-out infinite`,
          animationDelay: `${i * 0.06}s`,
        }}
      />
    );
  });

  return (
    <g
      className="flower anim"
      style={{
        animation: reduceMotion
          ? "none"
          : `bloomPulse ${3.6 / speed}s ease-in-out infinite`,
        transformOrigin: `${cx}px ${cy}px`,
      }}
    >
      {petalPaths}
      <circle className="core" cx={cx} cy={cy} r={size * 0.18} fill={core} />
      <circle
        cx={cx - 4}
        cy={cy - 5}
        r={size * 0.06}
        fill="rgba(255,255,255,0.7)"
      />
    </g>
  );
}

function Sparkle({
  x,
  y,
  delay,
  speed,
  reduceMotion,
}: {
  x: number;
  y: number;
  delay: number;
  speed: number;
  reduceMotion: boolean;
}) {
  return (
    <g
      className="sparkle anim"
      style={{
        animation: reduceMotion
          ? "none"
          : `floatUp ${3.4 / speed}s ease-in-out infinite`,
        animationDelay: `${delay}s`,
        transformOrigin: `${x}px ${y}px`,
      }}
    >
      <path
        d={`M ${x} ${y - 6} 
           C ${x + 2} ${y - 2}, ${x + 6} ${y - 2}, ${x + 6} ${y}
           C ${x + 6} ${y + 2}, ${x + 2} ${y + 2}, ${x} ${y + 6}
           C ${x - 2} ${y + 2}, ${x - 6} ${y + 2}, ${x - 6} ${y}
           C ${x - 6} ${y - 2}, ${x - 2} ${y - 2}, ${x} ${y - 6} Z`}
        fill="rgba(255,255,255,0.9)"
      />
      <circle cx={x + 10} cy={y + 6} r="2.2" fill="rgba(255,255,255,0.75)" />
    </g>
  );
}
