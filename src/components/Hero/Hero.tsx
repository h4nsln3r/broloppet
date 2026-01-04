import { useMemo, useRef } from "react";
import { Parallax } from "react-scroll-parallax";

import heroImage from "../../assets/håj.jpg";
import type { WeddingConfig } from "../../weddingConfig";
import "./hero.scss";
import { BouncyHeart } from "../Animation/BouncyHeart";
import { ScrollToRsvpLetter } from "../Animation/ScrollToRsvpLetter";

type HeroProps = {
  wedding: WeddingConfig;
};

function splitCouple(couple: string) {
  const parts = couple
    .split(/\s*(?:&|and|och)\s*/i)
    .map((s) => s.trim())
    .filter(Boolean);

  return [parts[0] ?? "", parts[1] ?? ""] as const;
}

function orderJuliaFirst(a: string, b: string) {
  const hasJuliaA = /julia/i.test(a);
  const hasJuliaB = /julia/i.test(b);

  if (hasJuliaA) return [a, b] as const;
  if (hasJuliaB) return [b, a] as const;

  return [b, a] as const;
}

export function Hero({ wedding }: HeroProps) {
  const containerRef = useRef<HTMLElement | null>(null);

  const [firstName, secondName] = useMemo(() => {
    const [a, b] = splitCouple(wedding.couple);
    return orderJuliaFirst(a, b);
  }, [wedding.couple]);

  return (
    <header className="hero" ref={containerRef as any}>
      <Parallax speed={-50} className="hero__parallax" aria-hidden="true">
        <div
          className="hero__bg"
          style={{ backgroundImage: `url('${heroImage}')` }}
        />
      </Parallax>

      <div className="hero__fade" aria-hidden="true" />

      <BouncyHeart containerRef={containerRef as any} />

      <ScrollToRsvpLetter targetId="rsvp" label="OSA" />

      <div className="hero__header">
        <h1>{firstName}</h1>
        <h1 className="hero__heart" aria-hidden="true">
          ❤
        </h1>
        <h1>{secondName}</h1>
        <br />
        <p className="lead">{wedding.dateLong}</p>
      </div>
    </header>
  );
}
