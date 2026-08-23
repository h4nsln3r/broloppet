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

/** Val vid uppladdning: bord, brudparet, eller inget bord. */
export type PhotoIdentity =
  | { kind: "table"; table: PhotoTableNumber }
  | { kind: "couple" }
  | { kind: "none" };

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

export const PHOTO_COUPLE_FOLDER = "brudparet";
export const PHOTO_COUPLE_COLOR = "#b08968";

export const PHOTO_TABLE_NUMBERS = Array.from(
  { length: PHOTO_TABLE_COUNT },
  (_, i) => (i + 1) as PhotoTableNumber
);

export const PHOTO_TABLE_STORAGE_KEY = "wedding-photo-table";
export const PHOTO_GALLERY_FILTER_KEY = "wedding-photo-gallery-filter";
export const PHOTO_GUEST_NAME_KEY = "wedding-photo-guest-name";
export const PHOTO_NAME_PROMPT_KEY = "wedding-photo-name-prompt-done";
export const PHOTO_GUEST_NAME_MAX_LEN = 40;

export type PhotoGalleryFilter = "mine" | "all";

export function isPhotoTableNumber(value: unknown): value is PhotoTableNumber {
  return (
    typeof value === "number" &&
    Number.isInteger(value) &&
    value >= 1 &&
    value <= PHOTO_TABLE_COUNT
  );
}

export function serializePhotoIdentity(identity: PhotoIdentity): string {
  if (identity.kind === "table") return String(identity.table);
  return identity.kind;
}

export function parsePhotoIdentity(raw: string | null): PhotoIdentity | null {
  if (!raw) return null;
  if (raw === "couple") return { kind: "couple" };
  if (raw === "none") return { kind: "none" };
  const n = Number(raw);
  return isPhotoTableNumber(n) ? { kind: "table", table: n } : null;
}

export function readStoredPhotoIdentity(): PhotoIdentity | null {
  try {
    return parsePhotoIdentity(localStorage.getItem(PHOTO_TABLE_STORAGE_KEY));
  } catch {
    return null;
  }
}

export function writeStoredPhotoIdentity(identity: PhotoIdentity): void {
  try {
    localStorage.setItem(
      PHOTO_TABLE_STORAGE_KEY,
      serializePhotoIdentity(identity)
    );
  } catch {
    // Ignorera privat läge / blockerad storage.
  }
}

export function readStoredGuestName(): string | null {
  try {
    const raw = localStorage.getItem(PHOTO_GUEST_NAME_KEY);
    const name = raw?.trim();
    return name ? name.slice(0, PHOTO_GUEST_NAME_MAX_LEN) : null;
  } catch {
    return null;
  }
}

export function writeStoredGuestName(name: string | null): void {
  try {
    if (!name) {
      localStorage.removeItem(PHOTO_GUEST_NAME_KEY);
      return;
    }
    localStorage.setItem(PHOTO_GUEST_NAME_KEY, name);
  } catch {
    // Ignorera privat läge / blockerad storage.
  }
}

export function readStoredNamePromptDone(): boolean {
  try {
    return localStorage.getItem(PHOTO_NAME_PROMPT_KEY) === "1";
  } catch {
    return false;
  }
}

export function writeStoredNamePromptDone(): void {
  try {
    localStorage.setItem(PHOTO_NAME_PROMPT_KEY, "1");
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

export function identityFolder(identity: PhotoIdentity): string | null {
  if (identity.kind === "table") return tableFolder(identity.table);
  if (identity.kind === "couple") return PHOTO_COUPLE_FOLDER;
  return null;
}

export function publicPhotoFolders(): string[] {
  return [...PHOTO_TABLE_NUMBERS.map(tableFolder), PHOTO_COUPLE_FOLDER];
}

export function tableColor(table: PhotoTableNumber | null): string | null {
  return table ? PHOTO_TABLE_COLORS[table] : null;
}

export function identityColor(identity: PhotoIdentity): string | null {
  if (identity.kind === "table") return PHOTO_TABLE_COLORS[identity.table];
  if (identity.kind === "couple") return PHOTO_COUPLE_COLOR;
  return null;
}

export function identityLabel(identity: PhotoIdentity): string {
  if (identity.kind === "table") return `Bord ${identity.table}`;
  if (identity.kind === "couple") return "Brudparet";
  return "Inget bord";
}

export function identityChipMark(identity: PhotoIdentity): string {
  if (identity.kind === "table") return String(identity.table);
  if (identity.kind === "couple") return "♥";
  return "–";
}

export function identitiesEqual(a: PhotoIdentity, b: PhotoIdentity): boolean {
  if (a.kind === "table" && b.kind === "table") return a.table === b.table;
  return a.kind === b.kind;
}
