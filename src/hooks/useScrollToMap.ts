import { useCallback } from "react";

const MAP_SELECTOR = ".mapWrap, .map-card";
const SCROLL_OFFSET = 24;
const DURATION_MS = 700;

function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

/**
 * Returnerar en funktion som scrollar mjukt till kartelementet (.mapWrap / .map-card).
 */
export function useScrollToMap(): (scrollAfter?: boolean) => void {
  const scrollToMap = useCallback((scrollAfter = true) => {
    if (!scrollAfter) return;
    const el = document.querySelector(MAP_SELECTOR);
    if (!el) return;

    const startY = window.scrollY ?? window.pageYOffset;
    const rect = el.getBoundingClientRect();
    const targetY = rect.top + startY - SCROLL_OFFSET;
    const distance = targetY - startY;

    // Respektera minskad rörelse: hoppa direkt utan animation.
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) {
      window.scrollTo(0, Math.round(targetY));
      return;
    }

    let startTime: number | null = null;

    const step = (timestamp: number) => {
      if (startTime === null) startTime = timestamp;
      const elapsed = timestamp - startTime;
      const progress = Math.min(elapsed / DURATION_MS, 1);
      const eased = easeInOutCubic(progress);
      window.scrollTo(0, Math.round(startY + distance * eased));
      if (elapsed < DURATION_MS) window.requestAnimationFrame(step);
    };

    window.requestAnimationFrame(step);
  }, []);

  return scrollToMap;
}

