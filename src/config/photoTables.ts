/** Bord för foto-uppladdning och lagutmaningar. */
export const PHOTO_TABLE_COUNT = 8;

export type PhotoTableNumber =
  | 1
  | 2
  | 3
  | 4
  | 5
  | 6
  | 7
  | 8;

/** Distinkta men mjuka lagfärger – nummer är primär identitet. */
export const PHOTO_TABLE_COLORS: Record<PhotoTableNumber, string> = {
  1: "#c45c4a",
  2: "#5f8f6c",
  3: "#4a7a9b",
  4: "#c4923a",
  5: "#b56b7a",
  6: "#3f8a86",
  7: "#8a6a9a",
  8: "#7a8450",
};

export const PHOTO_TABLE_NUMBERS = Array.from(
  { length: PHOTO_TABLE_COUNT },
  (_, i) => (i + 1) as PhotoTableNumber
);

export const PHOTO_TABLE_STORAGE_KEY = "wedding-photo-table";
export const PHOTO_GALLERY_FILTER_KEY = "wedding-photo-gallery-filter";

export type PhotoGalleryFilter = "mine" | "all";

export function isPhotoTableNumber(value: unknown): value is PhotoTableNumber {
  return (
    typeof value === "number" &&
    Number.isInteger(value) &&
    value >= 1 &&
    value <= PHOTO_TABLE_COUNT
  );
}

export function readStoredPhotoTable(): PhotoTableNumber | null {
  try {
    const raw = localStorage.getItem(PHOTO_TABLE_STORAGE_KEY);
    if (!raw) return null;
    const n = Number(raw);
    return isPhotoTableNumber(n) ? n : null;
  } catch {
    return null;
  }
}

export function writeStoredPhotoTable(table: PhotoTableNumber): void {
  try {
    localStorage.setItem(PHOTO_TABLE_STORAGE_KEY, String(table));
  } catch {
    // Ignorera privat läge / blockerad storage.
  }
}

export function readStoredGalleryFilter(): PhotoGalleryFilter {
  try {
    const raw = localStorage.getItem(PHOTO_GALLERY_FILTER_KEY);
    return raw === "mine" ? "mine" : "all";
  } catch {
    return "all";
  }
}

export function writeStoredGalleryFilter(filter: PhotoGalleryFilter): void {
  try {
    localStorage.setItem(PHOTO_GALLERY_FILTER_KEY, filter);
  } catch {
    // Ignorera privat läge / blockerad storage.
  }
}

export function tableFolder(table: PhotoTableNumber): string {
  return `bord-${table}`;
}

export function tableColor(table: PhotoTableNumber | null): string | null {
  return table ? PHOTO_TABLE_COLORS[table] : null;
}
