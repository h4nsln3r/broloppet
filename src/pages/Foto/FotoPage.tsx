import { useState, useCallback, useEffect, useRef, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  AnimatePresence,
  motion,
  useReducedMotion,
  type Variants,
} from "framer-motion";
import { supabase, WEDDING_PHOTOS_BUCKET } from "../../lib/supabase";
import "./FotoPage.scss";

type UploadStatus = "idle" | "uploading" | "success" | "error";
type ViewMode = "upload" | "gallery" | "slideshow";
type FailedUpload = { name: string; reason: string };
type SlideDirection = 1 | -1;
type TransitionEffect = "fade" | "slide" | "zoom" | "flip" | "soft";

const SLIDESHOW_INTERVAL_MS = 6000;
const SLIDE_TRANSITION_S = 0.7;
const CONTROLS_IDLE_MS = 2500;
const DEFAULT_SLIDESHOW_BG = "#14110f";

const EFFECT_OPTIONS: { id: TransitionEffect; label: string }[] = [
  { id: "fade", label: "Tona" },
  { id: "slide", label: "Skjut" },
  { id: "zoom", label: "Zooma" },
  { id: "flip", label: "Vänd" },
  { id: "soft", label: "Mjuk" },
];

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Fisher–Yates med valfri garanti att första index ≠ avoidFirst. */
function reshuffle(count: number, avoidFirst?: number): number[] {
  const order = shuffle(Array.from({ length: count }, (_, i) => i));
  if (avoidFirst !== undefined && count > 1 && order[0] === avoidFirst) {
    const swapWith = 1 + Math.floor(Math.random() * (count - 1));
    [order[0], order[swapWith]] = [order[swapWith], order[0]];
  }
  return order;
}

function sequentialOrder(count: number): number[] {
  return Array.from({ length: count }, (_, i) => i);
}

function getSlideVariants(
  effect: TransitionEffect,
  reduced: boolean | null
): Variants {
  if (reduced) {
    return {
      enter: { opacity: 0 },
      center: { opacity: 1 },
      exit: { opacity: 0 },
    };
  }

  switch (effect) {
    case "fade":
      return {
        enter: { opacity: 0 },
        center: { opacity: 1 },
        exit: { opacity: 0 },
      };
    case "slide":
      return {
        enter: (dir: SlideDirection) => ({ opacity: 0, x: dir * 64 }),
        center: { opacity: 1, x: 0 },
        exit: (dir: SlideDirection) => ({ opacity: 0, x: dir * -48 }),
      };
    case "zoom":
      return {
        enter: { opacity: 0, scale: 1.14 },
        center: { opacity: 1, scale: 1 },
        exit: { opacity: 0, scale: 0.9 },
      };
    case "flip":
      return {
        enter: (dir: SlideDirection) => ({
          opacity: 0.35,
          rotateY: dir * 78,
          scale: 0.94,
        }),
        center: { opacity: 1, rotateY: 0, scale: 1 },
        exit: (dir: SlideDirection) => ({
          opacity: 0,
          rotateY: dir * -60,
          scale: 0.96,
        }),
      };
    case "soft":
      return {
        enter: (dir: SlideDirection) => ({
          opacity: 0,
          x: dir * 28,
          filter: "blur(10px)",
        }),
        center: { opacity: 1, x: 0, filter: "blur(0px)" },
        exit: (dir: SlideDirection) => ({
          opacity: 0,
          x: dir * -18,
          filter: "blur(8px)",
        }),
      };
  }
}

/** Översätter vanliga Supabase Storage-fel till begripliga svenska meddelanden. */
function describeUploadError(rawMessage: string): string {
  const m = rawMessage.toLowerCase();
  if (
    m.includes("row-level security") ||
    m.includes("unauthorized") ||
    m.includes("permission") ||
    m.includes("policy") ||
    m.includes("403")
  ) {
    return "Saknar behörighet – uppladdningspolicyn i Supabase tillåter inte detta.";
  }
  if (m.includes("bucket not found") || m.includes("not found")) {
    return "Lagringsutrymmet (bucket) hittades inte.";
  }
  if (m.includes("already exists") || m.includes("duplicate")) {
    return "En fil med samma namn finns redan.";
  }
  if (
    m.includes("payload too large") ||
    m.includes("maximum allowed size") ||
    m.includes("exceeded") ||
    m.includes("413")
  ) {
    return "Filen är för stor.";
  }
  if (
    m.includes("failed to fetch") ||
    m.includes("network") ||
    m.includes("load failed") ||
    m.includes("timeout")
  ) {
    return "Nätverksfel – kontrollera din anslutning och försök igen.";
  }
  return rawMessage || "Okänt fel.";
}

export function FotoPage() {
  const [files, setFiles] = useState<File[]>([]);
  const [status, setStatus] = useState<UploadStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [failedUploads, setFailedUploads] = useState<FailedUpload[]>([]);
  const [successCount, setSuccessCount] = useState(0);
  const [images, setImages] = useState<{ name: string; url: string }[]>([]);
  const [mode, setMode] = useState<ViewMode>("upload");
  const [slideshowIndex, setSlideshowIndex] = useState(0);
  const [randomOrder, setRandomOrder] = useState(false);
  const [orderIndices, setOrderIndices] = useState<number[]>([]);
  const [slideDirection, setSlideDirection] = useState<SlideDirection>(1);
  const [configOpen, setConfigOpen] = useState(false);
  const [controlsVisible, setControlsVisible] = useState(true);
  const [slideshowBg, setSlideshowBg] = useState(DEFAULT_SLIDESHOW_BG);
  const [transitionEffect, setTransitionEffect] =
    useState<TransitionEffect>("slide");
  const prefersReducedMotion = useReducedMotion();
  const advanceRef = useRef<(dir: SlideDirection) => void>(() => {});
  const idleTimerRef = useRef<number | null>(null);
  const configOpenRef = useRef(false);

  const chromeVisible = controlsVisible || configOpen;

  useEffect(() => {
    configOpenRef.current = configOpen;
  }, [configOpen]);

  const clearIdleTimer = useCallback(() => {
    if (idleTimerRef.current !== null) {
      window.clearTimeout(idleTimerRef.current);
      idleTimerRef.current = null;
    }
  }, []);

  const scheduleHideControls = useCallback(() => {
    clearIdleTimer();
    idleTimerRef.current = window.setTimeout(() => {
      if (configOpenRef.current) return;
      setControlsVisible(false);
    }, CONTROLS_IDLE_MS);
  }, [clearIdleTimer]);

  const revealControls = useCallback(() => {
    setControlsVisible(true);
    scheduleHideControls();
  }, [scheduleHideControls]);

  const openConfig = useCallback(() => {
    clearIdleTimer();
    setControlsVisible(true);
    setConfigOpen(true);
  }, [clearIdleTimer]);

  const closeConfig = useCallback(() => {
    setConfigOpen(false);
    scheduleHideControls();
  }, [scheduleHideControls]);

  const toggleConfig = useCallback(() => {
    if (configOpen) closeConfig();
    else openConfig();
  }, [configOpen, closeConfig, openConfig]);

  const slideVariants = useMemo(
    () => getSlideVariants(transitionEffect, prefersReducedMotion),
    [transitionEffect, prefersReducedMotion]
  );

  const fetchImages = useCallback(async () => {
    const client = supabase;
    if (!client) return;
    const { data, error } = await client.storage
      .from(WEDDING_PHOTOS_BUCKET)
      .list("", { limit: 200 });
    if (error) {
      console.error(error);
      return;
    }
    const files = (data ?? []).filter((f) => f.name !== ".emptyFolderPlaceholder");
    const urls = await Promise.all(
      files.map(async (f) => {
        const { data: urlData } = client.storage
          .from(WEDDING_PHOTOS_BUCKET)
          .getPublicUrl(f.name);
        return { name: f.name, url: urlData.publicUrl };
      })
    );
    setImages(urls);
  }, []);

  useEffect(() => {
    // Hämtar bilder vid mount; setState sker asynkront efter nätverksanropet.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchImages();
  }, [fetchImages]);

  const startSlideshow = useCallback(() => {
    setMode("slideshow");
    setSlideshowIndex(0);
    setRandomOrder(false);
    setSlideDirection(1);
    setConfigOpen(false);
    setControlsVisible(true);
    setOrderIndices(sequentialOrder(images.length));
    scheduleHideControls();
    document.documentElement.requestFullscreen?.().catch(() => {});
  }, [images.length, scheduleHideControls]);

  /** Bygger om ordningen om bildlistan ändras under bildspelet. */
  useEffect(() => {
    if (mode !== "slideshow") return;
    const n = images.length;
    if (n === 0) return;
    // Synkar spelets indexordning mot galleriet – medvetet state-sync.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setOrderIndices((prev) => {
      const valid = prev.length === n && prev.every((idx) => idx >= 0 && idx < n);
      if (valid) return prev;
      return randomOrder ? reshuffle(n) : sequentialOrder(n);
    });
    setSlideshowIndex((i) => (i >= n ? Math.max(0, n - 1) : i));
  }, [images.length, mode, randomOrder]);

  const advance = useCallback(
    (dir: SlideDirection) => {
      const n = images.length;
      if (n === 0) return;

      setSlideDirection(dir);

      if (!randomOrder) {
        setSlideshowIndex((i) => (i + dir + n) % n);
        return;
      }

      const i = slideshowIndex;
      const order = orderIndices;
      const next = i + dir;

      if (next >= order.length) {
        const lastImageIdx = order[i];
        setOrderIndices(reshuffle(n, lastImageIdx));
        setSlideshowIndex(0);
        return;
      }
      if (next < 0) {
        const firstImageIdx = order[0];
        const newOrder = reshuffle(n, firstImageIdx);
        setOrderIndices(newOrder);
        setSlideshowIndex(newOrder.length - 1);
        return;
      }
      setSlideshowIndex(next);
    },
    [images.length, randomOrder, slideshowIndex, orderIndices]
  );

  const goPrev = useCallback(() => advance(-1), [advance]);
  const goNext = useCallback(() => advance(1), [advance]);

  useEffect(() => {
    advanceRef.current = advance;
  }, [advance]);

  /** Timeout per bild – startas om vid varje byte (även manuell), så timing hålls jämn. */
  useEffect(() => {
    if (mode !== "slideshow" || images.length === 0) return;
    const id = window.setTimeout(() => {
      advanceRef.current(1);
    }, SLIDESHOW_INTERVAL_MS);
    return () => window.clearTimeout(id);
  }, [mode, images.length, slideshowIndex]);

  const currentImageIndex =
    orderIndices.length > 0 && orderIndices[slideshowIndex] !== undefined
      ? orderIndices[slideshowIndex]
      : slideshowIndex;
  const currentImage = images[currentImageIndex];

  const nextImageIndex =
    orderIndices.length > 0
      ? orderIndices[(slideshowIndex + 1) % orderIndices.length]
      : (slideshowIndex + 1) % Math.max(images.length, 1);
  const nextImage = images[nextImageIndex];

  const toggleRandom = useCallback(() => {
    const n = images.length;
    if (n === 0) return;

    const currentRealIndex = orderIndices[slideshowIndex] ?? slideshowIndex;

    if (randomOrder) {
      setRandomOrder(false);
      setOrderIndices(sequentialOrder(n));
      setSlideshowIndex(Math.min(currentRealIndex, n - 1));
      return;
    }

    const rest = sequentialOrder(n).filter((idx) => idx !== currentRealIndex);
    setOrderIndices([currentRealIndex, ...shuffle(rest)]);
    setSlideshowIndex(0);
    setRandomOrder(true);
  }, [images.length, orderIndices, slideshowIndex, randomOrder]);

  const exitSlideshow = useCallback(() => {
    clearIdleTimer();
    setMode("gallery");
    setConfigOpen(false);
    setControlsVisible(true);
    document.exitFullscreen?.();
  }, [clearIdleTimer]);

  useEffect(() => {
    if (mode !== "slideshow") return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (configOpen) {
          closeConfig();
          return;
        }
        exitSlideshow();
      }
      if (e.key === "ArrowLeft") goPrev();
      if (e.key === "ArrowRight") goNext();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [mode, exitSlideshow, goPrev, goNext, configOpen, closeConfig]);

  const resetUploadStatus = useCallback(() => {
    setStatus("idle");
    setError(null);
    setFailedUploads([]);
    setSuccessCount(0);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const f = Array.from(e.dataTransfer.files).filter((file) =>
        file.type.startsWith("image/")
      );
      if (f.length === 0) return;
      resetUploadStatus();
      setFiles((prev) => [...prev, ...f]);
    },
    [resetUploadStatus]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
  }, []);

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const f = Array.from(e.target.files ?? []).filter((file) =>
        file.type.startsWith("image/")
      );
      e.target.value = "";
      if (f.length === 0) return;
      resetUploadStatus();
      setFiles((prev) => [...prev, ...f]);
    },
    [resetUploadStatus]
  );

  const removeFile = useCallback((index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const upload = useCallback(async () => {
    const client = supabase;
    if (!client || files.length === 0) return;
    setStatus("uploading");
    setError(null);
    setFailedUploads([]);
    setSuccessCount(0);

    const failed: { file: File; reason: string }[] = [];

    for (const file of files) {
      const name = `${Date.now()}-${Math.random().toString(36).slice(2)}-${file.name}`;
      try {
        const { error: uploadError } = await client.storage
          .from(WEDDING_PHOTOS_BUCKET)
          .upload(name, file, { cacheControl: "3600", upsert: false });
        // Supabase kastar inte vid fel – felet returneras i `error`.
        if (uploadError) {
          failed.push({ file, reason: describeUploadError(uploadError.message) });
        }
      } catch (err) {
        failed.push({
          file,
          reason: describeUploadError(err instanceof Error ? err.message : ""),
        });
      }
    }

    await fetchImages();

    const succeeded = files.length - failed.length;
    setSuccessCount(succeeded);
    setFailedUploads(failed.map(({ file, reason }) => ({ name: file.name, reason })));
    // Behåll bara filer som misslyckades, så användaren kan försöka igen.
    setFiles(failed.map((f) => f.file));

    if (failed.length === 0) {
      setStatus("success");
    } else {
      setStatus("error");
      setError(
        succeeded > 0
          ? `${succeeded} av ${files.length} bilder laddades upp. ${failed.length} misslyckades:`
          : failed.length > 1
            ? "Ingen av bilderna kunde laddas upp:"
            : "Bilden kunde inte laddas upp:"
      );
    }
  }, [files, fetchImages]);

  if (!supabase) {
    return (
      <div className="foto-page">
        <div className="foto-page__card">
          <h1>Foto</h1>
          <p className="muted">
            Supabase är inte konfigurerad. Lägg till VITE_SUPABASE_URL och
            VITE_SUPABASE_ANON_KEY i .env och skapa ett storage-bucket med namnet
            &quot;wedding-photos&quot;.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`foto-page ${mode === "gallery" ? "foto-page--gallery" : ""}`}>
      <div className="foto-page__card">
        <Link to="/" className="foto-page__back-corner">
          ← Tillbaka till bröllopssidan
        </Link>
        <Link to="/qrcode" className="foto-page__qr-corner" title="QR-kod">
          QR
        </Link>
        <h1>Foto – Hannes & Julia</h1>
        <p className="foto-page__intro muted">
          Ladda upp bilder från bröllopsdagen. De visas i galleriet på skärmen.
        </p>

        <div className="foto-page__tabs">
          <button
            type="button"
            className={mode === "upload" ? "active" : ""}
            onClick={() => setMode("upload")}
          >
            Ladda upp
          </button>
          <button
            type="button"
            className={mode === "gallery" ? "active" : ""}
            onClick={() => setMode("gallery")}
          >
            Visa galleri ({images.length})
          </button>
          <button
            type="button"
            className={mode === "slideshow" ? "active" : ""}
            onClick={startSlideshow}
            disabled={images.length === 0}
          >
            Visa bildspel
          </button>
        </div>

        {mode === "upload" && (
          <div className="foto-upload">
            <div
              className="foto-upload__drop"
              onDrop={handleDrop}
              onDragOver={handleDragOver}
            >
              <p>Dra och släpp bilder här</p>
              <p className="tiny muted">eller</p>
              <label className="foto-upload__label">
                Välj filer
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleFileInput}
                  className="foto-upload__input"
                />
              </label>
            </div>

            {files.length > 0 && (
              <div className="foto-upload__list">
                {files.map((f, i) => (
                  <div key={i} className="foto-upload__item">
                    <span>{f.name}</span>
                    <button
                      type="button"
                      onClick={() => removeFile(i)}
                      aria-label="Ta bort"
                    >
                      ×
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  className="foto-upload__submit"
                  onClick={upload}
                  disabled={status === "uploading"}
                >
                  {status === "uploading" ? "Laddar upp..." : "Ladda upp"}
                </button>
              </div>
            )}

            {status === "success" && (
              <p className="foto-upload__success" role="status">
                Tack!{" "}
                {successCount > 1
                  ? `${successCount} bilder är uppladdade.`
                  : "Bilden är uppladdad."}
              </p>
            )}
            {status === "error" && (
              <div className="foto-upload__error" role="alert">
                {error && <p className="foto-upload__error-msg">{error}</p>}
                {failedUploads.length > 0 && (
                  <ul className="foto-upload__error-list">
                    {failedUploads.map((f, i) => (
                      <li key={i}>
                        <span className="foto-upload__error-file">{f.name}</span>
                        {" – "}
                        {f.reason}
                      </li>
                    ))}
                  </ul>
                )}
                {files.length > 0 && (
                  <p className="foto-upload__error-hint muted tiny">
                    Bilderna som misslyckades ligger kvar i listan – tryck på
                    &quot;Ladda upp&quot; för att försöka igen.
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        {mode === "gallery" && (
          <div className="foto-gallery">
            {images.length === 0 ? (
              <p className="muted">Inga bilder ännu.</p>
            ) : (
              <div className="foto-gallery__grid">
                {images.map((img) => (
                  <a
                    key={img.name}
                    href={img.url}
                    target="_blank"
                    rel="noreferrer"
                    className="foto-gallery__item"
                  >
                    <img src={img.url} alt="" loading="lazy" />
                  </a>
                ))}
              </div>
            )}
          </div>
        )}

        {mode === "slideshow" && images.length > 0 && (
          <div
            className={`foto-slideshow${chromeVisible ? " foto-slideshow--controls-visible" : ""}`}
            role="region"
            aria-label="Bildspel"
            aria-live="polite"
            style={{ backgroundColor: slideshowBg }}
            onMouseMove={revealControls}
            onTouchStart={revealControls}
          >
            {nextImage?.url && (
              <img
                src={nextImage.url}
                alt=""
                className="foto-slideshow__preload"
                aria-hidden="true"
              />
            )}

            <div
              className={`foto-slideshow__image-wrap${transitionEffect === "flip" ? " foto-slideshow__image-wrap--flip" : ""}`}
            >
              <AnimatePresence initial={false} custom={slideDirection} mode="sync">
                <motion.div
                  key={currentImage?.name ?? slideshowIndex}
                  className="foto-slideshow__slide"
                  custom={slideDirection}
                  variants={slideVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{
                    duration: prefersReducedMotion ? 0.01 : SLIDE_TRANSITION_S,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                >
                  <img
                    src={currentImage?.url}
                    alt=""
                    className={`foto-slideshow__image${
                      prefersReducedMotion || transitionEffect === "flip"
                        ? ""
                        : " foto-slideshow__image--kenburns"
                    }`}
                    draggable={false}
                  />
                </motion.div>
              </AnimatePresence>
            </div>

            <div className="foto-slideshow__chrome">
              <div className="foto-slideshow__admin">
                <button
                  type="button"
                  className={`foto-slideshow__admin-toggle${configOpen ? " is-open" : ""}`}
                  onClick={toggleConfig}
                  aria-expanded={configOpen}
                  aria-controls="foto-slideshow-config"
                  aria-label={
                    configOpen
                      ? "Stäng inställningar"
                      : "Öppna bildspelsinställningar"
                  }
                >
                  <span className="foto-slideshow__admin-icon" aria-hidden="true">
                    ⚙
                  </span>
                  <span>Inställningar</span>
                </button>

                <AnimatePresence initial={false}>
                  {configOpen && (
                    <motion.div
                      id="foto-slideshow-config"
                      className="foto-slideshow__config"
                      role="dialog"
                      aria-label="Bildspelsinställningar"
                      initial={
                        prefersReducedMotion
                          ? { opacity: 0 }
                          : { opacity: 0, y: -12, scale: 0.94 }
                      }
                      animate={
                        prefersReducedMotion
                          ? { opacity: 1 }
                          : { opacity: 1, y: 0, scale: 1 }
                      }
                      exit={
                        prefersReducedMotion
                          ? { opacity: 0 }
                          : { opacity: 0, y: -10, scale: 0.96 }
                      }
                      transition={{
                        duration: prefersReducedMotion ? 0.01 : 0.38,
                        ease: [0.22, 1, 0.36, 1],
                      }}
                      style={{ transformOrigin: "top left" }}
                    >
                      <div className="foto-slideshow__config-section">
                        <p className="foto-slideshow__config-label">Ordning</p>
                        <button
                          type="button"
                          role="switch"
                          aria-checked={randomOrder}
                          className={`foto-slideshow__switch${randomOrder ? " is-on" : ""}`}
                          onClick={toggleRandom}
                        >
                          <span className="foto-slideshow__switch-track">
                            <span className="foto-slideshow__switch-thumb" />
                          </span>
                          <span>Slumpa bilder</span>
                        </button>
                      </div>

                      <div className="foto-slideshow__config-section">
                        <p className="foto-slideshow__config-label">Bakgrund</p>
                        <div className="foto-slideshow__bg-row">
                          <label className="foto-slideshow__color">
                            <span className="visually-hidden">Välj bakgrundsfärg</span>
                            <input
                              type="color"
                              value={slideshowBg}
                              onChange={(e) => setSlideshowBg(e.target.value)}
                              aria-label="Bakgrundsfärg"
                            />
                            <span
                              className="foto-slideshow__color-swatch"
                              style={{ backgroundColor: slideshowBg }}
                              aria-hidden="true"
                            />
                            <span className="foto-slideshow__color-value">
                              {slideshowBg}
                            </span>
                          </label>
                          <button
                            type="button"
                            className="foto-slideshow__config-btn"
                            onClick={() => setSlideshowBg(DEFAULT_SLIDESHOW_BG)}
                            disabled={slideshowBg === DEFAULT_SLIDESHOW_BG}
                          >
                            Standard
                          </button>
                        </div>
                      </div>

                      <div className="foto-slideshow__config-section">
                        <p className="foto-slideshow__config-label">Byte-effekt</p>
                        <div
                          className="foto-slideshow__effects"
                          role="radiogroup"
                          aria-label="Övergångseffekt"
                        >
                          {EFFECT_OPTIONS.map((opt) => (
                            <button
                              key={opt.id}
                              type="button"
                              role="radio"
                              aria-checked={transitionEffect === opt.id}
                              className={`foto-slideshow__effect${
                                transitionEffect === opt.id ? " is-active" : ""
                              }`}
                              onClick={() => setTransitionEffect(opt.id)}
                            >
                              {opt.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <button
                type="button"
                className="foto-slideshow__close"
                onClick={exitSlideshow}
                aria-label="Avsluta bildspel"
              >
                ✕
              </button>
              <button
                type="button"
                className="foto-slideshow__nav foto-slideshow__nav--prev"
                onClick={goPrev}
                aria-label="Föregående bild"
              >
                ←
              </button>
              <button
                type="button"
                className="foto-slideshow__nav foto-slideshow__nav--next"
                onClick={goNext}
                aria-label="Nästa bild"
              >
                →
              </button>
              <div className="foto-slideshow__counter">
                {slideshowIndex + 1} / {images.length}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
