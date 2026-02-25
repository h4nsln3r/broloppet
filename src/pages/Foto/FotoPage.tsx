import { useState, useCallback, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { supabase, WEDDING_PHOTOS_BUCKET } from "../../lib/supabase";
import "./FotoPage.scss";

type UploadStatus = "idle" | "uploading" | "success" | "error";
type ViewMode = "upload" | "gallery" | "slideshow";

const SLIDESHOW_INTERVAL_MS = 5000;

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function FotoPage() {
  const [files, setFiles] = useState<File[]>([]);
  const [status, setStatus] = useState<UploadStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [images, setImages] = useState<{ name: string; url: string }[]>([]);
  const [mode, setMode] = useState<ViewMode>("upload");
  const [slideshowIndex, setSlideshowIndex] = useState(0);
  const [randomOrder, setRandomOrder] = useState(false);
  const orderIndicesRef = useRef<number[]>([]);
  const slideshowTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

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
    fetchImages();
  }, [fetchImages]);

  const startSlideshow = useCallback(() => {
    setMode("slideshow");
    setSlideshowIndex(0);
    setRandomOrder(false);
    orderIndicesRef.current = images.map((_, i) => i);
    document.documentElement.requestFullscreen?.().catch(() => {});
  }, [images]);

  useEffect(() => {
    if (mode === "slideshow" && images.length > 0 && orderIndicesRef.current.length !== images.length) {
      orderIndicesRef.current = images.map((_, i) => i);
    }
  }, [mode, images]);

  useEffect(() => {
    if (mode !== "slideshow" || images.length === 0) return;
    const n = images.length;
    slideshowTimerRef.current = setInterval(() => {
      setSlideshowIndex((i) => (i + 1) % n);
    }, SLIDESHOW_INTERVAL_MS);
    return () => {
      if (slideshowTimerRef.current) {
        clearInterval(slideshowTimerRef.current);
        slideshowTimerRef.current = null;
      }
    };
  }, [mode, images.length, randomOrder]);

  const orderIndices = orderIndicesRef.current;
  const currentImage =
    orderIndices.length > 0 && orderIndices[slideshowIndex] !== undefined
      ? images[orderIndices[slideshowIndex]]
      : images[slideshowIndex];

  const goPrev = useCallback(() => {
    const n = images.length;
    setSlideshowIndex((i) => (i - 1 + n) % n);
  }, [images.length]);

  const goNext = useCallback(() => {
    const n = images.length;
    setSlideshowIndex((i) => (i + 1) % n);
  }, [images.length]);

  const toggleRandom = useCallback(() => {
    setRandomOrder((prev) => {
      setSlideshowIndex(0);
      if (prev) {
        orderIndicesRef.current = images.map((_, i) => i);
        return false;
      } else {
        orderIndicesRef.current = shuffle(images.map((_, i) => i));
        return true;
      }
    });
  }, [images]);

  const exitSlideshow = useCallback(() => {
    setMode("gallery");
    document.exitFullscreen?.();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const f = Array.from(e.dataTransfer.files).filter((file) =>
      file.type.startsWith("image/")
    );
    setFiles((prev) => [...prev, ...f]);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
  }, []);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const f = Array.from(e.target.files ?? []).filter((file) =>
      file.type.startsWith("image/")
    );
    setFiles((prev) => [...prev, ...f]);
    e.target.value = "";
  }, []);

  const removeFile = useCallback((index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const upload = useCallback(async () => {
    if (!supabase || files.length === 0) return;
    setStatus("uploading");
    setError(null);
    try {
      for (const file of files) {
        const name = `${Date.now()}-${Math.random().toString(36).slice(2)}-${file.name}`;
        await supabase.storage.from(WEDDING_PHOTOS_BUCKET).upload(name, file, {
          cacheControl: "3600",
          upsert: false,
        });
      }
      setFiles([]);
      setStatus("success");
      await fetchImages();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Något gick fel");
      setStatus("error");
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

  useEffect(() => {
    if (mode !== "slideshow") return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") exitSlideshow();
      if (e.key === "ArrowLeft") goPrev();
      if (e.key === "ArrowRight") goNext();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [mode, exitSlideshow, goPrev, goNext]);

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
              <p className="foto-upload__success">Tack! Bilderna är uppladdade.</p>
            )}
            {status === "error" && error && (
              <p className="foto-upload__error">{error}</p>
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
            className="foto-slideshow"
            role="region"
            aria-label="Bildspel"
          >
            <button
              type="button"
              role="switch"
              aria-checked={randomOrder}
              className="foto-slideshow__toggle"
              onClick={toggleRandom}
              aria-label={randomOrder ? "Slumpad ordning – klicka för att stänga av" : "Slumpad ordning – klicka för att slå på"}
              title={randomOrder ? "Slumpad ordning på" : "Slumpad ordning av"}
            >
              <span
                className="foto-slideshow__toggle-track"
                style={{
                  background: randomOrder
                    ? "rgba(107, 83, 68, 0.5)"
                    : "rgba(154, 143, 130, 0.3)",
                }}
              >
                <span
                  className="foto-slideshow__toggle-thumb"
                  style={{
                    transform: randomOrder ? "translateX(16px)" : "translateX(0)",
                    background: randomOrder ? "#6b5344" : "#fff",
                  }}
                />
              </span>
              <span
                className="foto-slideshow__toggle-label"
                style={{
                  color: randomOrder ? "#6b5344" : undefined,
                  fontWeight: randomOrder ? 600 : 500,
                }}
              >
                Rand
              </span>
            </button>
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
            <div className="foto-slideshow__image-wrap">
              <img
                key={currentImage?.name ?? slideshowIndex}
                src={currentImage?.url}
                alt=""
                className="foto-slideshow__image"
              />
            </div>
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
        )}
      </div>
    </div>
  );
}
