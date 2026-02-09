// src/components/Hero/Hero.tsx
import { useMemo, useRef, useState, useEffect } from "react";
import { Parallax } from "react-scroll-parallax";

import backgoundImage from "../../assets/background-images/viet.jpg";
import backgoundImage1 from "../../assets/background-images/frieri.jpg";
import backgoundImage2 from "../../assets/background-images/puss.jpg";
import backgoundImage3 from "../../assets/background-images/bild1.jpg";
import backgoundImage4 from "../../assets/background-images/bild2.jpg";
import backgoundImage5 from "../../assets/background-images/bild3.jpg";
import backgoundImage6 from "../../assets/background-images/bild4.jpg";
import backgoundImage7 from "../../assets/background-images/bild5.jpg";

// Importera fler bilder här när du har dem
// import heroImage2 from "../../assets/hero2.jpg";
// import mobileHeroImage2 from "../../assets/mobile-hero2.jpg";

import type { WeddingConfig } from "../../weddingConfig";
import "./hero.scss";
import { BouncyHeart } from "../Animation/BouncyHeart";
import { ScrollToRsvpLetter } from "../Animation/ScrollToRsvpLetter";

type HeroProps = {
  wedding: WeddingConfig;
};

// ... splitCouple + orderJuliaFirst som innan ...
function splitCouple(couple: string) {
  const parts = couple
    .split(/\s*(?:&|and|och)\s*/i)
    .map((s) => s.trim())
    .filter(Boolean);

  return [parts[0] ?? "", parts[1] ?? ""] as const;
}

export function Hero({ wedding }: HeroProps) {
  const containerRef = useRef<HTMLElement | null>(null);

  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const desktopImages = [
    backgoundImage,
    backgoundImage1,
    backgoundImage3,
    backgoundImage4,
    backgoundImage5,
    backgoundImage7,
  ];

  const mobileImages = [
    backgoundImage1,
    backgoundImage,
    backgoundImage2,
    backgoundImage3,
    backgoundImage4,
    backgoundImage5,
    backgoundImage6,
  ];

  const [imageIndex, setImageIndex] = useState(0);

  const activeList = isMobile ? mobileImages : desktopImages;

  const currentImage =
    activeList.length > 0
      ? activeList[imageIndex % activeList.length]
      : backgoundImage;

  const [firstName, secondName] = useMemo(() => {
    const [a, b] = splitCouple(wedding.couple);
    return [a, b];
  }, [wedding.couple]);

  const handleHeartBounce = () => {
    setImageIndex((prev) => prev + 1);
  };

  const handleScrollDown = () => {
    const content = document.querySelector(".content");
    if (content) {
      content.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <header className="hero" ref={containerRef}>
      <Parallax speed={-50} className="hero__parallax" aria-hidden="true">
        <div
          className="hero__bg"
          style={{ backgroundImage: `url('${currentImage}')` }}
        />
      </Parallax>

      <div className="hero__fade" aria-hidden="true" />

      <BouncyHeart containerRef={containerRef} onBounce={handleHeartBounce} />

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
          <polyline points="6 9 12 15 18 9"></polyline>
        </svg>
      </button>

      <div className="hero__header">
        <h1>{firstName}</h1>
        <span className="hero__heart" aria-hidden="true">
          ❤
        </span>
        <h1>{secondName}</h1>
        <br />
        <p className="lead">{wedding.dateLong}</p>
      </div>
    </header>
  );
}
