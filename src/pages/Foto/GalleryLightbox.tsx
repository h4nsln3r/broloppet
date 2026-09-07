import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type CSSProperties,
  type TouchEvent,
} from "react";
import { createPortal } from "react-dom";
import {
  downloadWeddingPhoto,
  photoAttribution,
  photoSourceColor,
  type WeddingPhoto,
} from "../../lib/weddingPhotos";
import "./GalleryLightbox.scss";

const SWIPE_THRESHOLD_PX = 56;
const FOCUSABLE =
  'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

type GalleryLightboxProps = {
  images: WeddingPhoto[];
  index: number;
  onClose: () => void;
  onIndexChange: (index: number) => void;
};

export function GalleryLightbox({
  images,
  index,
  onClose,
  onIndexChange,
}: GalleryLightboxProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef<number | null>(null);
  const onCloseRef = useRef(onClose);
  const goPrevRef = useRef<() => void>(() => {});
  const goNextRef = useRef<() => void>(() => {});
  const titleId = useId();
  const [downloadState, setDownloadState] = useState<
    "idle" | "busy" | "error"
  >("idle");

  const photo = images[index];
  const count = images.length;
  const canBrowse = count > 1;
  const prevPhoto = canBrowse ? images[(index - 1 + count) % count] : null;
  const nextPhoto = canBrowse ? images[(index + 1) % count] : null;
  const attribution = photo ? photoAttribution(photo) : null;
  const sourceColor = photo ? photoSourceColor(photo) : null;

  const go = useCallback(
    (dir: -1 | 1) => {
      if (images.length < 2) return;
      const next = (index + dir + images.length) % images.length;
      setDownloadState("idle");
      onIndexChange(next);
    },
    [images.length, index, onIndexChange]
  );

  const goPrev = useCallback(() => go(-1), [go]);
  const goNext = useCallback(() => go(1), [go]);
  const didSwipe = useRef(false);

  useEffect(() => {
    onCloseRef.current = onClose;
    goPrevRef.current = goPrev;
    goNextRef.current = goNext;
  }, [onClose, goPrev, goNext]);

  const handleDownload = useCallback(async () => {
    if (!photo || downloadState === "busy") return;
    setDownloadState("busy");
    try {
      await downloadWeddingPhoto(photo);
      setDownloadState("idle");
    } catch (err) {
      console.error(err);
      setDownloadState("error");
    }
  }, [photo, downloadState]);

  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const dialog = dialogRef.current;
    dialog?.focus();

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onCloseRef.current();
        return;
      }
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        goPrevRef.current();
        return;
      }
      if (e.key === "ArrowRight") {
        e.preventDefault();
        goNextRef.current();
        return;
      }
      if (e.key === "Tab" && dialog) {
        const nodes = Array.from(
          dialog.querySelectorAll<HTMLElement>(FOCUSABLE)
        ).filter((el) => !el.hasAttribute("disabled"));
        if (nodes.length === 0) {
          e.preventDefault();
          dialog.focus();
          return;
        }
        const first = nodes[0];
        const last = nodes[nodes.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = prevOverflow;
      previouslyFocused?.focus();
    };
  }, []);

  const onTouchStart = useCallback((e: TouchEvent) => {
    touchStartX.current = e.changedTouches[0]?.clientX ?? null;
  }, []);

  const onTouchEnd = useCallback((e: TouchEvent) => {
    const start = touchStartX.current;
    touchStartX.current = null;
    if (start == null) return;
    const dx = (e.changedTouches[0]?.clientX ?? start) - start;
    if (Math.abs(dx) < SWIPE_THRESHOLD_PX) return;
    didSwipe.current = true;
    if (dx > 0) goPrevRef.current();
    else goNextRef.current();
  }, []);

  const onStageClick = useCallback(() => {
    if (didSwipe.current) {
      didSwipe.current = false;
      return;
    }
    onClose();
  }, [onClose]);

  if (!photo) return null;

  return createPortal(
    <div className="gallery-lightbox">
      <div
        ref={dialogRef}
        className="gallery-lightbox__dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
      >
        <h2 id={titleId} className="gallery-lightbox__sr-only">
          Bild {index + 1} av {count}
          {attribution ? ` · ${attribution}` : ""}
        </h2>

        {prevPhoto && (
          <img
            src={prevPhoto.url}
            alt=""
            className="gallery-lightbox__preload"
            aria-hidden="true"
          />
        )}
        {nextPhoto && (
          <img
            src={nextPhoto.url}
            alt=""
            className="gallery-lightbox__preload"
            aria-hidden="true"
          />
        )}

        <div className="gallery-lightbox__chrome">
          <p className="gallery-lightbox__counter" aria-live="polite">
            {index + 1} / {count}
          </p>
          {attribution && (
            <p
              className="gallery-lightbox__attribution"
              style={
                sourceColor
                  ? ({ "--table-color": sourceColor } as CSSProperties)
                  : undefined
              }
            >
              {attribution}
            </p>
          )}
          <div className="gallery-lightbox__actions">
            <button
              type="button"
              className="gallery-lightbox__action"
              onClick={handleDownload}
              disabled={downloadState === "busy"}
              aria-label={
                downloadState === "busy"
                  ? "Laddar ner bilden"
                  : "Ladda ner bilden"
              }
            >
              {downloadState === "busy" ? "Laddar…" : "Ladda ner"}
            </button>
            <button
              type="button"
              className="gallery-lightbox__action gallery-lightbox__action--close"
              onClick={onClose}
              aria-label="Stäng"
            >
              ✕
            </button>
          </div>
        </div>

        {downloadState === "error" && (
          <p className="gallery-lightbox__error" role="alert">
            Kunde inte ladda ner bilden. Försök igen.
          </p>
        )}

        <div
          className="gallery-lightbox__stage"
          onClick={onStageClick}
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
        >
          <img
            src={photo.url}
            alt={attribution ?? "Bröllopsbild"}
            className="gallery-lightbox__image"
            draggable={false}
            onClick={(e) => e.stopPropagation()}
          />
        </div>

        {canBrowse && (
          <>
            <button
              type="button"
              className="gallery-lightbox__nav gallery-lightbox__nav--prev"
              onClick={goPrev}
              aria-label="Föregående bild"
            >
              ←
            </button>
            <button
              type="button"
              className="gallery-lightbox__nav gallery-lightbox__nav--next"
              onClick={goNext}
              aria-label="Nästa bild"
            >
              →
            </button>
          </>
        )}
      </div>
    </div>,
    document.body
  );
}
