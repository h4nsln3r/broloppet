import { useMemo, useRef, useState, useEffect } from "react";
import { Parallax } from "react-scroll-parallax";

import type { WeddingConfig } from "../../config";
import { DESKTOP_HERO_IMAGES, MOBILE_HERO_IMAGES, ALL_HERO_IMAGES } from "./heroImages";
import "./hero.scss";
import { BouncyHeart } from "../Animation/BouncyHeart";
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
  const [isMobile, setIsMobile] = useState(
    () => typeof window !== "undefined" && window.innerWidth < 768
  );
  const [imagesLoaded, setImagesLoaded] = useState(false);
  const [imageIndex, setImageIndex] = useState(0);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    let loadedCount = 0;
    const total = ALL_HERO_IMAGES.length;
    const onLoad = () => {
      loadedCount++;
      if (loadedCount === total) setImagesLoaded(true);
    };
    ALL_HERO_IMAGES.forEach((src) => {
      const img = new Image();
      img.onload = onLoad;
      img.onerror = onLoad;
      img.src = src;
    });
  }, []);

  const activeList = isMobile ? MOBILE_HERO_IMAGES : DESKTOP_HERO_IMAGES;
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
    document.querySelector(".content")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <header className="hero" ref={containerRef}>
      <Parallax speed={-50} className="hero__parallax" aria-hidden="true">
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
        onBounce={() => setImageIndex((i) => i + 1)}
      />

      <ScrollToRsvpLetter targetId="rsvp" label="OSA" />

      <button
        className="hero__scroll-arrow"
        onClick={handleScrollDown}
        aria-label="Scroll down to information"
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
