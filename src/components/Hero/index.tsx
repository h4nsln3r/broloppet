import { useMemo, useRef, useState, useEffect } from "react";
import { Parallax } from "react-scroll-parallax";
import { useReducedMotion } from "framer-motion";

import type { WeddingConfig } from "../../config";
import { DESKTOP_HERO_IMAGES, MOBILE_HERO_IMAGES } from "./heroImages";
import "./hero.scss";
import { BouncyHeart } from "../Animation/BouncyHeart";
import { useDualBouncyPhysics } from "../Animation/BouncyHeart/useDualBouncyPhysics";
import { ScrollToRsvpLetter } from "../Animation/ScrollToRsvpLetter";

type HeroProps = {
  wedding: WeddingConfig;
};

function splitCouple(couple: string): readonly [string, string] {
  const parts = couple
    .split(/\s*(?:&|and|och)\s*/i)
    .map((s) => s.trim())
    .filter(Boolean);
  return [parts[0] ?? "", parts[1] ?? ""];
}

/** Delar t.ex. "Lördag 29 augusti 2026" i [veckodag, datum, år] för snygga radbrytningar på mobil. */
function splitDateLong(dateLong: string): [string, string, string] {
  const parts = dateLong.trim().split(/\s+/);
  if (parts.length < 3) return [dateLong, "", ""];
  const weekday = parts[0];
  const year = parts[parts.length - 1];
  const date = parts.slice(1, -1).join(" ");
  return [weekday, date, year];
}

export function Hero({ wedding }: HeroProps) {
  const containerRef = useRef<HTMLElement | null>(null);
  const prefersReducedMotion = useReducedMotion();
  const [isMobile, setIsMobile] = useState(
    () => typeof window !== "undefined" && window.innerWidth < 768
  );
  const [imagesLoaded, setImagesLoaded] = useState(false);
  const [imageIndex, setImageIndex] = useState(0);
  const [secondHeartSpawn, setSecondHeartSpawn] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const [heart1Paused, setHeart1Paused] = useState(false);

  const { body1, body2 } = useDualBouncyPhysics({
    containerRef,
    paused1: heart1Paused,
    onBounce1: () => setImageIndex((i) => i + 1),
    onBounce2: () => setImageIndex((i) => i + 1),
    initial2: secondHeartSpawn ?? undefined,
  });

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const activeList = isMobile ? MOBILE_HERO_IMAGES : DESKTOP_HERO_IMAGES;

  // Förladda bara bilderna för aktuell enhet (mobil/desktop) – inte båda.
  useEffect(() => {
    let cancelled = false;
    let loadedCount = 0;
    const total = activeList.length;
    setImagesLoaded(false);
    const onLoad = () => {
      loadedCount++;
      if (!cancelled && loadedCount === total) setImagesLoaded(true);
    };
    activeList.forEach((src) => {
      const img = new Image();
      img.onload = onLoad;
      img.onerror = onLoad;
      img.src = src;
    });
    return () => {
      cancelled = true;
    };
  }, [activeList]);
  const currentImage =
    activeList[imageIndex % activeList.length] ?? DESKTOP_HERO_IMAGES[0];

  const [firstName, secondName] = useMemo(
    () => splitCouple(wedding.couple),
    [wedding.couple]
  );

  const dateLines = useMemo(
    () => splitDateLong(wedding.dateLong),
    [wedding.dateLong]
  );

  const handleScrollDown = () => {
    document.querySelector(".content")?.scrollIntoView({
      behavior: prefersReducedMotion ? "auto" : "smooth",
    });
  };

  return (
    <header className="hero" ref={containerRef}>
      <Parallax
        speed={prefersReducedMotion ? 0 : -50}
        className="hero__parallax"
        aria-hidden="true"
      >
        <div
          className="hero__bg"
          style={{
            backgroundImage: imagesLoaded ? `url('${currentImage}')` : undefined,
            opacity: imagesLoaded ? 1 : 0,
            transition: "opacity 0.3s ease-in-out",
          }}
        />
      </Parallax>

      <div className="hero__fade" aria-hidden="true" />

      <BouncyHeart
        containerRef={containerRef}
        physics={body1}
        onPausedChange={setHeart1Paused}
        onBounce={() => setImageIndex((i) => i + 1)}
        onLongPressComplete={(pos) => setSecondHeartSpawn(pos)}
      />
      {secondHeartSpawn && (
        <BouncyHeart
          containerRef={containerRef}
          physics={body2}
          onBounce={() => setImageIndex((i) => i + 1)}
        />
      )}

      <ScrollToRsvpLetter targetId="rsvp" label="OSA" />

      <button
        className="hero__scroll-arrow"
        onClick={handleScrollDown}
        aria-label="Skrolla ner till information"
        type="button"
      >
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      <div className="hero__header">
        <h1>{firstName}</h1>
        <span className="hero__heart" aria-hidden="true">
          ❤
        </span>
        <h1>{secondName}</h1>
        <br />
        <p className="lead">
          <span className="lead__line">{dateLines[0]}</span>
          <br className="lead__br" />
          <span className="lead__line">{dateLines[1]}</span>
          <br className="lead__br" />
          <span className="lead__line">{dateLines[2]}</span>
        </p>
      </div>
    </header>
  );
}
