import { useState, useCallback, useEffect } from "react";
import { supabase, WEDDING_PHOTOS_BUCKET } from "../../lib/supabase";
import "./FotoPage.scss";

type UploadStatus = "idle" | "uploading" | "success" | "error";

export function FotoPage() {
  const [files, setFiles] = useState<File[]>([]);
  const [status, setStatus] = useState<UploadStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [images, setImages] = useState<{ name: string; url: string }[]>([]);
  const [mode, setMode] = useState<"upload" | "gallery">("upload");

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

  return (
    <div className="foto-page">
      <div className="foto-page__card">
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

        <a href="/" className="foto-page__back">
          ← Tillbaka till bröllopssidan
        </a>
      </div>
    </div>
  );
}
