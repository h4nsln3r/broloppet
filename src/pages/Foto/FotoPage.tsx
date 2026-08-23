import { useState, useCallback, useEffect, useRef, useMemo, type CSSProperties } from "react";
import { Link } from "react-router-dom";
import {
  AnimatePresence,
  motion,
  useReducedMotion,
  type Variants,
} from "framer-motion";
import {
  PHOTO_COUPLE_COLOR,
  PHOTO_GUEST_NAME_MAX_LEN,
  PHOTO_TABLE_NUMBERS,
  identitiesEqual,
  identityChipMark,
  identityColor,
  identityLabel,
  readStoredGalleryFilter,
  readStoredGuestName,
  readStoredNamePromptDone,
  readStoredPhotoIdentity,
  writeStoredGalleryFilter,
  writeStoredGuestName,
  writeStoredNamePromptDone,
  writeStoredPhotoIdentity,
  type PhotoGalleryFilter,
  type PhotoIdentity,
} from "../../config/photoTables";
import { supabase, WEDDING_PHOTOS_BUCKET } from "../../lib/supabase";
import {
  buildPhotoFileName,
  fetchPublicWeddingPhotos,
  normalizeGuestName,
  photoAttribution,
  photoMatchesIdentity,
  photoSourceColor,
  photoSourceMark,
  photoUploadPath,
  type WeddingPhoto,
} from "../../lib/weddingPhotos";
import "./FotoPage.scss";

type UploadStatus = "idle" | "uploading" | "success" | "error";
type ViewMode = "upload" | "gallery" | "slideshow";
type FailedUpload = { name: string; reason: string };
type SlideDirection = 1 | -1;
type TransitionEffect = "fade" | "slide" | "zoom" | "flip" | "soft";

const DEFAULT_SLIDESHOW_INTERVAL_MS = 6000;
const SLIDESHOW_INTERVAL_MIN_MS = 2000;
const SLIDESHOW_INTERVAL_MAX_MS = 15000;
const SLIDESHOW_INTERVAL_STEP_MS = 1000;
const SLIDE_TRANSITION_S = 0.7;
const CONTROLS_IDLE_MS = 2500;
const DEFAULT_SLIDESHOW_BG = "#14110f";
/** Hur ofta galleri/bildspel kollar efter nya uppladdningar. */
const IMAGE_POLL_INTERVAL_MS = 12_000;

function formatIntervalSeconds(ms: number): string {
  const seconds = Math.round(ms / 1000);
  return seconds === 1 ? "1 sekund" : `${seconds} sekunder`;
}

function sameImageList(a: WeddingPhoto[], b: WeddingPhoto[]): boolean {
  return (
    a.length === b.length &&
    a.every(
      (img, i) =>
        img.path === b[i]?.path &&
        img.url === b[i]?.url &&
        img.table === b[i]?.table &&
        img.fromCouple === b[i]?.fromCouple &&
        img.guestName === b[i]?.guestName
    )
  );
}

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

/** Lägger in `toInsert` direkt efter aktuell bild i spelets kö. */
function insertAfterCurrent(
  order: number[],
  currentPos: number,
  toInsert: number[]
): number[] {
  if (toInsert.length === 0) return order;
  const insertSet = new Set(toInsert);
  const without = order.filter((idx) => !insertSet.has(idx));
  const currentImgIdx = order[currentPos];
  const at = currentImgIdx !== undefined ? without.indexOf(currentImgIdx) : -1;
  const insertAt = at >= 0 ? at + 1 : 0;
  return [
    ...without.slice(0, insertAt),
    ...toInsert,
    ...without.slice(insertAt),
  ];
}

function getSlideVariants(effect: TransitionEffect): Variants {
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
    return "Saknar behörighet – Storage-policyn i Supabase tillåter inte detta.";
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
  const [allImages, setAllImages] = useState<WeddingPhoto[]>([]);
  const [galleryError, setGalleryError] = useState<string | null>(null);
  const [mode, setMode] = useState<ViewMode>("upload");
  const [selectedIdentity, setSelectedIdentity] =
    useState<PhotoIdentity | null>(() => readStoredPhotoIdentity());
  const [guestName, setGuestName] = useState<string | null>(() =>
    readStoredGuestName()
  );
  const [namePromptDone, setNamePromptDone] = useState(() =>
    readStoredNamePromptDone()
  );
  const [nameDraft, setNameDraft] = useState(() => readStoredGuestName() ?? "");
  const [galleryFilter, setGalleryFilter] = useState<PhotoGalleryFilter>(() =>
    readStoredGalleryFilter()
  );
  const [tableMenuOpen, setTableMenuOpen] = useState(false);
  const [slideshowIndex, setSlideshowIndex] = useState(0);
  const [randomOrder, setRandomOrder] = useState(false);
  const [preferNewImages, setPreferNewImages] = useState(false);
  const [orderIndices, setOrderIndices] = useState<number[]>([]);
  const [slideDirection, setSlideDirection] = useState<SlideDirection>(1);
  const [configOpen, setConfigOpen] = useState(false);
  const [controlsVisible, setControlsVisible] = useState(true);
  const [slideshowBg, setSlideshowBg] = useState(DEFAULT_SLIDESHOW_BG);
  const [slideshowIntervalMs, setSlideshowIntervalMs] = useState(
    DEFAULT_SLIDESHOW_INTERVAL_MS
  );
  const [transitionEffect, setTransitionEffect] =
    useState<TransitionEffect>("slide");
  const prefersReducedMotion = useReducedMotion();
  const advanceRef = useRef<(dir: SlideDirection) => void>(() => {});
  const idleTimerRef = useRef<number | null>(null);
  const configOpenRef = useRef(false);
  const randomOrderRef = useRef(false);
  const preferNewImagesRef = useRef(false);
  const currentImageNameRef = useRef<string | null>(null);
  const prevSlideshowImagesRef = useRef<WeddingPhoto[]>([]);
  const slideshowActiveRef = useRef(false);
  const tableMenuRef = useRef<HTMLDivElement>(null);

  const images = useMemo(() => {
    if (galleryFilter === "mine" && selectedIdentity !== null) {
      return allImages.filter((img) =>
        photoMatchesIdentity(img, selectedIdentity)
      );
    }
    return allImages;
  }, [allImages, galleryFilter, selectedIdentity]);

  const selectIdentity = useCallback((identity: PhotoIdentity) => {
    writeStoredPhotoIdentity(identity);
    setSelectedIdentity(identity);
    setTableMenuOpen(false);
  }, []);

  const finishNamePrompt = useCallback((rawName: string | null) => {
    const name = rawName ? normalizeGuestName(rawName) || null : null;
    writeStoredGuestName(name);
    writeStoredNamePromptDone();
    setGuestName(name);
    setNameDraft(name ?? "");
    setNamePromptDone(true);
  }, []);

  const saveGuestName = useCallback((rawName: string) => {
    const name = normalizeGuestName(rawName) || null;
    writeStoredGuestName(name);
    setGuestName(name);
    setNameDraft(name ?? "");
  }, []);

  const setFilter = useCallback((filter: PhotoGalleryFilter) => {
    writeStoredGalleryFilter(filter);
    setGalleryFilter(filter);
  }, []);

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
    () => getSlideVariants(transitionEffect),
    [transitionEffect]
  );

  const fetchImages = useCallback(async () => {
    const { photos, error } = await fetchPublicWeddingPhotos();
    if (error) {
      console.error(error);
      setGalleryError(describeUploadError(error));
      return;
    }
    setGalleryError(null);
    setAllImages((prev) => (sameImageList(prev, photos) ? prev : photos));
  }, []);

  useEffect(() => {
    if (!tableMenuOpen) return;
    const onPointerDown = (e: PointerEvent) => {
      if (!tableMenuRef.current?.contains(e.target as Node)) {
        setTableMenuOpen(false);
      }
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setTableMenuOpen(false);
    };
    window.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [tableMenuOpen]);

  useEffect(() => {
    // Hämtar bilder vid mount; setState sker asynkront efter nätverksanropet.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchImages();
  }, [fetchImages]);

  /** Under galleri/bildspel: hämta nya uppladdningar med jämna mellanrum. */
  useEffect(() => {
    if (mode !== "gallery" && mode !== "slideshow") return;
    const id = window.setInterval(() => {
      void fetchImages();
    }, IMAGE_POLL_INTERVAL_MS);
    return () => window.clearInterval(id);
  }, [mode, fetchImages]);

  useEffect(() => {
    randomOrderRef.current = randomOrder;
  }, [randomOrder]);

  useEffect(() => {
    preferNewImagesRef.current = preferNewImages;
  }, [preferNewImages]);

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

  /**
   * När bildlistan ändras under bildspelet: behåll aktuell bild.
   * Utan "nya först": tidsordning (nya sist) eller slump (nya sist i kön).
   * Med "nya först": nya bilder köas direkt efter den som visas nu.
   */
  useEffect(() => {
    if (mode !== "slideshow") {
      slideshowActiveRef.current = false;
      prevSlideshowImagesRef.current = images;
      return;
    }

    const justStarted = !slideshowActiveRef.current;
    slideshowActiveRef.current = true;

    if (justStarted) {
      prevSlideshowImagesRef.current = images;
      return;
    }

    const n = images.length;
    if (n === 0) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- synka kö med bildlista
      setOrderIndices([]);
      setSlideshowIndex(0);
      prevSlideshowImagesRef.current = images;
      return;
    }

    const stayOn = currentImageNameRef.current;
    const prevImages = prevSlideshowImagesRef.current;
    const preferNew = preferNewImagesRef.current;
    const random = randomOrderRef.current;

    // Ren tidsordning utan prioritet – alltid äldst → nyast.
    if (!random && !preferNew) {
      setOrderIndices(sequentialOrder(n));
      const idx = stayOn
        ? images.findIndex((img) => img.path === stayOn)
        : 0;
      setSlideshowIndex(idx >= 0 ? idx : 0);
      prevSlideshowImagesRef.current = images;
      return;
    }

    const nameToIdx = new Map(images.map((img, i) => [img.path, i]));

    setOrderIndices((prevOrder) => {
      const remapped = prevOrder
        .map((oldIdx) => {
          const path = prevImages[oldIdx]?.path;
          return path !== undefined ? nameToIdx.get(path) : undefined;
        })
        .filter((i): i is number => i !== undefined);

      const present = new Set(remapped);
      let newcomers = images
        .map((_, i) => i)
        .filter((i) => !present.has(i));

      if (preferNew) {
        // Nyast först bland de som just kommit in.
        newcomers = [...newcomers].sort((a, b) =>
          images[b].path.localeCompare(images[a].path)
        );
      } else if (random) {
        newcomers = shuffle(newcomers);
      }

      let next: number[];
      if (remapped.length === 0) {
        next = random ? reshuffle(n) : sequentialOrder(n);
      } else if (newcomers.length === 0) {
        next = remapped;
      } else if (preferNew) {
        const stayPos = stayOn
          ? remapped.findIndex((imgIdx) => images[imgIdx]?.path === stayOn)
          : 0;
        next = insertAfterCurrent(
          remapped,
          stayPos >= 0 ? stayPos : 0,
          newcomers
        );
      } else {
        next = [...remapped, ...newcomers];
      }

      const pos = stayOn
        ? next.findIndex((imgIdx) => images[imgIdx]?.path === stayOn)
        : 0;
      setSlideshowIndex(pos >= 0 ? pos : 0);
      return next;
    });

    prevSlideshowImagesRef.current = images;
  }, [images, mode]);

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
    }, slideshowIntervalMs);
    return () => window.clearTimeout(id);
  }, [mode, images.length, slideshowIndex, slideshowIntervalMs]);

  const currentImageIndex =
    orderIndices.length > 0 && orderIndices[slideshowIndex] !== undefined
      ? orderIndices[slideshowIndex]
      : slideshowIndex;
  const currentImage = images[currentImageIndex];

  useEffect(() => {
    currentImageNameRef.current = currentImage?.path ?? null;
  }, [currentImage?.path]);

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
      if (!preferNewImages) {
        setOrderIndices(sequentialOrder(n));
        setSlideshowIndex(Math.min(currentRealIndex, n - 1));
      } else {
        // Behåll kön men stanna på samma bild.
        const pos = orderIndices.findIndex((idx) => idx === currentRealIndex);
        setSlideshowIndex(pos >= 0 ? pos : 0);
      }
      return;
    }

    const rest = sequentialOrder(n).filter((idx) => idx !== currentRealIndex);
    setOrderIndices([currentRealIndex, ...shuffle(rest)]);
    setSlideshowIndex(0);
    setRandomOrder(true);
  }, [images.length, orderIndices, slideshowIndex, randomOrder, preferNewImages]);

  const togglePreferNewImages = useCallback(() => {
    const n = images.length;
    if (n === 0) return;

    const currentRealIndex = orderIndices[slideshowIndex] ?? slideshowIndex;

    setPreferNewImages((on) => {
      const next = !on;
      if (!next && !randomOrderRef.current) {
        setOrderIndices(sequentialOrder(n));
        setSlideshowIndex(Math.min(currentRealIndex, n - 1));
      }
      return next;
    });
  }, [images.length, orderIndices, slideshowIndex]);

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
    if (!client || files.length === 0 || selectedIdentity === null) return;
    setStatus("uploading");
    setError(null);
    setFailedUploads([]);
    setSuccessCount(0);

    const failed: { file: File; reason: string }[] = [];

    for (const file of files) {
      const fileName = buildPhotoFileName(file.name, guestName);
      const path = photoUploadPath(selectedIdentity, fileName);
      try {
        const { error: uploadError } = await client.storage
          .from(WEDDING_PHOTOS_BUCKET)
          .upload(path, file, {
            cacheControl: "3600",
            upsert: false,
            metadata: {
              table:
                selectedIdentity.kind === "table"
                  ? String(selectedIdentity.table)
                  : selectedIdentity.kind,
              guestName: guestName ?? "",
            },
          });
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
  }, [files, fetchImages, selectedIdentity, guestName]);

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

  if (selectedIdentity === null) {
    return (
      <div className="foto-page">
        <div className="foto-page__card foto-page__card--picker">
          <h1>Vilket bord sitter du vid?</h1>
          <p className="foto-page__intro muted">
            Välj ditt bord så kopplas bilderna du laddar upp till laget. Du kan
            byta senare – och du måste inte välja om du inte vill.
          </p>
          <div
            className="foto-table-picker"
            role="group"
            aria-label="Välj bordsnummer"
          >
            {PHOTO_TABLE_NUMBERS.map((table) => (
              <button
                key={table}
                type="button"
                className="foto-table-picker__btn"
                style={
                  {
                    "--table-color": identityColor({ kind: "table", table }),
                  } as CSSProperties
                }
                onClick={() => selectIdentity({ kind: "table", table })}
              >
                <span className="foto-table-picker__num">{table}</span>
                <span className="foto-table-picker__label">Bord {table}</span>
              </button>
            ))}
          </div>
          <div className="foto-table-picker__extras">
            <button
              type="button"
              className="foto-table-picker__skip"
              onClick={() => selectIdentity({ kind: "none" })}
            >
              Hoppa över
            </button>
            <button
              type="button"
              className="foto-table-picker__couple"
              onClick={() => selectIdentity({ kind: "couple" })}
              aria-label="Brudparet"
            >
              <span aria-hidden="true">♥</span>
              Brudparet
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!namePromptDone) {
    const chosenLabel =
      selectedIdentity.kind === "none"
        ? null
        : identityLabel(selectedIdentity);

    return (
      <div className="foto-page">
        <div className="foto-page__card">
          <h1>Vad heter du?</h1>
          <p className="foto-page__intro muted">
            {chosenLabel ? (
              <>
                Du valde <strong>{chosenLabel}</strong>. Vill du också att ditt
                namn ska synas tillsammans med bilderna? Det är valfritt.
              </>
            ) : (
              <>
                Vill du att ditt namn ska synas tillsammans med bilderna? Det är
                valfritt.
              </>
            )}
          </p>
          <form
            className="foto-name-prompt"
            onSubmit={(e) => {
              e.preventDefault();
              finishNamePrompt(nameDraft);
            }}
          >
            <label className="foto-name-prompt__field">
              <span className="visually-hidden">Ditt namn</span>
              <input
                type="text"
                name="guest-name"
                autoComplete="name"
                autoFocus
                maxLength={PHOTO_GUEST_NAME_MAX_LEN}
                placeholder="Ditt namn"
                value={nameDraft}
                onChange={(e) => setNameDraft(e.target.value)}
              />
            </label>
            <button type="submit" className="foto-name-prompt__submit">
              Fortsätt
            </button>
            <button
              type="button"
              className="foto-name-prompt__skip"
              onClick={() => finishNamePrompt(null)}
            >
              Hoppa över
            </button>
          </form>
        </div>
      </div>
    );
  }

  const selectedColor = identityColor(selectedIdentity);
  const selectedLabel = identityLabel(selectedIdentity);
  const mineFilterLabel =
    selectedIdentity.kind === "couple"
      ? "Bara brudparet"
      : selectedIdentity.kind === "none"
        ? "Bara utan bord"
        : "Bara mitt bord";

  return (
    <div className={`foto-page ${mode === "gallery" ? "foto-page--gallery" : ""}`}>
      <div className="foto-page__card">
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
            <p className="foto-upload__table-hint muted tiny">
              Uppladdningar sparas till{" "}
              <strong style={{ color: selectedColor ?? undefined }}>
                {selectedLabel}
              </strong>
              {guestName ? (
                <>
                  {" "}
                  som <strong>{guestName}</strong>
                </>
              ) : null}
              .
            </p>
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
            {galleryFilter === "mine" && (
              <p className="foto-gallery__filter-hint muted tiny">
                Visar bara {selectedLabel}
                {galleryError ? "" : ` · ${images.length} bilder`}
              </p>
            )}
            {galleryError ? (
              <p className="foto-upload__error-msg" role="alert">
                Kunde inte hämta galleriet: {galleryError}
              </p>
            ) : images.length === 0 ? (
              <p className="muted">
                {galleryFilter === "mine"
                  ? selectedIdentity.kind === "couple"
                    ? "Inga bilder från brudparet ännu."
                    : selectedIdentity.kind === "none"
                      ? "Inga bilder utan bord ännu."
                      : "Inga bilder från ditt bord ännu."
                  : "Inga bilder ännu."}
              </p>
            ) : (
              <div className="foto-gallery__grid">
                {images.map((img) => {
                  const color = photoSourceColor(img);
                  const mark = photoSourceMark(img);
                  const sourceLabel = img.fromCouple
                    ? "Brudparet"
                    : img.table !== null
                      ? `Bord ${img.table}`
                      : null;
                  return (
                    <a
                      key={img.path}
                      href={img.url}
                      target="_blank"
                      rel="noreferrer"
                      className="foto-gallery__item"
                      aria-label={photoAttribution(img) ?? "Bild"}
                      style={
                        color
                          ? ({ "--table-color": color } as CSSProperties)
                          : undefined
                      }
                    >
                      <img src={img.url} alt="" loading="lazy" />
                      {mark !== null && (
                        <span
                          className={`foto-gallery__badge${
                            img.fromCouple ? " foto-gallery__badge--text" : ""
                          }`}
                          aria-label={sourceLabel ?? undefined}
                        >
                          {mark}
                        </span>
                      )}
                      {img.guestName && (
                        <span className="foto-gallery__name">{img.guestName}</span>
                      )}
                    </a>
                  );
                })}
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
            style={
              {
                backgroundColor: slideshowBg,
                "--slideshow-kenburns-ms": `${slideshowIntervalMs}ms`,
              } as CSSProperties
            }
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
                  key={currentImage?.path ?? slideshowIndex}
                  className="foto-slideshow__slide"
                  custom={slideDirection}
                  variants={slideVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{
                    duration: SLIDE_TRANSITION_S,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                >
                  <img
                    src={currentImage?.url}
                    alt=""
                    className={`foto-slideshow__image${
                      transitionEffect === "flip"
                        ? ""
                        : " foto-slideshow__image--kenburns"
                    }`}
                    draggable={false}
                  />
                </motion.div>
              </AnimatePresence>
            </div>

            {currentImage && photoAttribution(currentImage) && (
              <div
                className="foto-slideshow__table-badge"
                style={
                  {
                    "--table-color":
                      photoSourceColor(currentImage) ?? undefined,
                  } as CSSProperties
                }
              >
                {photoAttribution(currentImage)}
              </div>
            )}

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
                        <p className="foto-slideshow__config-label">Bytestid</p>
                        <div className="foto-slideshow__speed">
                          <div className="foto-slideshow__speed-header">
                            <span className="foto-slideshow__speed-hint">Snabb</span>
                            <span
                              className="foto-slideshow__speed-value"
                              aria-live="polite"
                            >
                              {formatIntervalSeconds(slideshowIntervalMs)}
                            </span>
                            <span className="foto-slideshow__speed-hint">Långsam</span>
                          </div>
                          <label className="foto-slideshow__speed-slider">
                            <span className="visually-hidden">
                              Tid mellan bildbyten
                            </span>
                            <input
                              type="range"
                              min={SLIDESHOW_INTERVAL_MIN_MS}
                              max={SLIDESHOW_INTERVAL_MAX_MS}
                              step={SLIDESHOW_INTERVAL_STEP_MS}
                              value={slideshowIntervalMs}
                              onChange={(e) =>
                                setSlideshowIntervalMs(Number(e.target.value))
                              }
                              aria-valuemin={SLIDESHOW_INTERVAL_MIN_MS / 1000}
                              aria-valuemax={SLIDESHOW_INTERVAL_MAX_MS / 1000}
                              aria-valuenow={slideshowIntervalMs / 1000}
                              aria-valuetext={formatIntervalSeconds(
                                slideshowIntervalMs
                              )}
                            />
                          </label>
                        </div>
                      </div>

                      <div className="foto-slideshow__config-section">
                        <p className="foto-slideshow__config-label">Ordning</p>
                        <div className="foto-slideshow__switches">
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
                          <button
                            type="button"
                            role="switch"
                            aria-checked={preferNewImages}
                            className={`foto-slideshow__switch${preferNewImages ? " is-on" : ""}`}
                            onClick={togglePreferNewImages}
                          >
                            <span className="foto-slideshow__switch-track">
                              <span className="foto-slideshow__switch-thumb" />
                            </span>
                            <span>Visa nya bilder först</span>
                          </button>
                          <p className="foto-slideshow__switch-hint">
                            Uppladdningar under spelet visas härnäst
                          </p>
                        </div>
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

      {mode !== "slideshow" && (
        <>
          <div className="foto-table-sticky" ref={tableMenuRef}>
            <button
              type="button"
              className={`foto-table-sticky__chip${tableMenuOpen ? " is-open" : ""}`}
              style={
                {
                  "--table-color": selectedColor,
                } as CSSProperties
              }
              onClick={() => setTableMenuOpen((open) => !open)}
              aria-expanded={tableMenuOpen}
              aria-controls="foto-table-menu"
              aria-label={`${selectedLabel}, öppna meny`}
            >
              <span className="foto-table-sticky__num" aria-hidden="true">
                {identityChipMark(selectedIdentity)}
              </span>
              <span className="foto-table-sticky__text">{selectedLabel}</span>
            </button>

            <AnimatePresence>
              {tableMenuOpen && (
                <motion.div
                  id="foto-table-menu"
                  className="foto-table-sticky__menu"
                  role="dialog"
                  aria-label="Bordmeny"
                  initial={
                    prefersReducedMotion
                      ? { opacity: 0 }
                      : { opacity: 0, y: 16, scale: 0.96 }
                  }
                  animate={
                    prefersReducedMotion
                      ? { opacity: 1 }
                      : { opacity: 1, y: 0, scale: 1 }
                  }
                  exit={
                    prefersReducedMotion
                      ? { opacity: 0 }
                      : { opacity: 0, y: 12, scale: 0.97 }
                  }
                  transition={{
                    duration: prefersReducedMotion ? 0.01 : 0.28,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                >
                  <p className="foto-table-sticky__menu-title">Ditt bord</p>
                  <div
                    className="foto-table-sticky__filter"
                    role="group"
                    aria-label="Filtrera galleri"
                  >
                    <button
                      type="button"
                      className={galleryFilter === "mine" ? "is-active" : ""}
                      onClick={() => setFilter("mine")}
                    >
                      {mineFilterLabel}
                    </button>
                    <button
                      type="button"
                      className={galleryFilter === "all" ? "is-active" : ""}
                      onClick={() => setFilter("all")}
                    >
                      Alla bilder
                    </button>
                  </div>
                  <p className="foto-table-sticky__menu-title">Byt bord</p>
                  <div
                    className="foto-table-sticky__grid"
                    role="group"
                    aria-label="Byt bordsnummer"
                  >
                    {PHOTO_TABLE_NUMBERS.map((table) => (
                      <button
                        key={table}
                        type="button"
                        className={`foto-table-sticky__pick${
                          identitiesEqual(selectedIdentity, {
                            kind: "table",
                            table,
                          })
                            ? " is-selected"
                            : ""
                        }`}
                        style={
                          {
                            "--table-color": identityColor({
                              kind: "table",
                              table,
                            }),
                          } as CSSProperties
                        }
                        onClick={() =>
                          selectIdentity({ kind: "table", table })
                        }
                        aria-pressed={identitiesEqual(selectedIdentity, {
                          kind: "table",
                          table,
                        })}
                      >
                        {table}
                      </button>
                    ))}
                  </div>
                  <div className="foto-table-sticky__alts">
                    <button
                      type="button"
                      className={`foto-table-sticky__alt${
                        selectedIdentity.kind === "couple" ? " is-selected" : ""
                      }`}
                      style={
                        {
                          "--table-color": PHOTO_COUPLE_COLOR,
                        } as CSSProperties
                      }
                      onClick={() => selectIdentity({ kind: "couple" })}
                      aria-pressed={selectedIdentity.kind === "couple"}
                    >
                      ♥ Brudparet
                    </button>
                    <button
                      type="button"
                      className={`foto-table-sticky__alt${
                        selectedIdentity.kind === "none" ? " is-selected" : ""
                      }`}
                      onClick={() => selectIdentity({ kind: "none" })}
                      aria-pressed={selectedIdentity.kind === "none"}
                    >
                      Inget bord
                    </button>
                  </div>
                  <p className="foto-table-sticky__menu-title">Ditt namn</p>
                  <form
                    className="foto-table-sticky__name"
                    onSubmit={(e) => {
                      e.preventDefault();
                      saveGuestName(nameDraft);
                    }}
                  >
                    <label>
                      <span className="visually-hidden">Ditt namn</span>
                      <input
                        type="text"
                        name="guest-name"
                        autoComplete="name"
                        maxLength={PHOTO_GUEST_NAME_MAX_LEN}
                        placeholder="Valfritt"
                        value={nameDraft}
                        onChange={(e) => setNameDraft(e.target.value)}
                      />
                    </label>
                    <button type="submit">Spara</button>
                  </form>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <Link
            to="/foto/admin"
            className="foto-page__admin-secret"
            aria-label="Admin"
            title="Admin"
          >
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.75"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <rect x="5" y="11" width="14" height="10" rx="1" />
              <path d="M8 11V8a4 4 0 0 1 8 0v3" />
            </svg>
          </Link>
        </>
      )}
    </div>
  );
}
