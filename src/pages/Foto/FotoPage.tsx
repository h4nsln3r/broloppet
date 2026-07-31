import { useState, useCallback, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { supabase, WEDDING_PHOTOS_BUCKET } from "../../lib/supabase";
import "./FotoPage.scss";

type UploadStatus = "idle" | "uploading" | "success" | "error";
type ViewMode = "upload" | "gallery" | "slideshow";
type FailedUpload = { name: string; reason: string };

const SLIDESHOW_INTERVAL_MS = 5000;

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
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
    // Hämtar bilder vid mount; setState sker asynkront efter nätverksanropet.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchImages();
  }, [fetchImages]);

  const startSlideshow = useCallback(() => {
    setMode("slideshow");
    setSlideshowIndex(0);
    setRandomOrder(false);
    setOrderIndices(images.map((_, i) => i));
    document.documentElement.requestFullscreen?.().catch(() => {});
  }, [images]);

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
        setOrderIndices(images.map((_, i) => i));
        return false;
      } else {
        setOrderIndices(shuffle(images.map((_, i) => i)));
        return true;
      }
    });
  }, [images]);

  const exitSlideshow = useCallback(() => {
    setMode("gallery");
    document.exitFullscreen?.();
  }, []);

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
