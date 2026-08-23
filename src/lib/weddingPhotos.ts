import {
  PHOTO_COUPLE_COLOR,
  PHOTO_COUPLE_FOLDER,
  PHOTO_GUEST_NAME_MAX_LEN,
  type PhotoIdentity,
  type PhotoTableNumber,
  identityFolder,
  isPhotoTableNumber,
  publicPhotoFolders,
  tableColor,
} from "../config/photoTables";
import {
  WEDDING_PHOTOS_BUCKET,
  WEDDING_PHOTOS_HIDDEN_FOLDER,
  isWeddingPhotoFile,
  supabase,
} from "./supabase";

export type WeddingPhoto = {
  /** Filnamn utan mapp (t.ex. `123-abc-foto.jpg`). */
  name: string;
  /** Full storage-sökväg (t.ex. `bord-3/123-abc-foto.jpg`). */
  path: string;
  url: string;
  table: PhotoTableNumber | null;
  fromCouple: boolean;
  guestName: string | null;
  created_at?: string | null;
};

const TABLE_FOLDER_RE = /^bord-(\d+)$/;
/** `timestamp-rand--n.{base64url}--original.jpg` */
const FILE_NAME_META_RE = /^\d+-[a-z0-9]+--n\.([A-Za-z0-9_-]+)--/i;

export function parseTableFromFolder(
  folder: string | null | undefined
): PhotoTableNumber | null {
  if (!folder) return null;
  const match = folder.match(TABLE_FOLDER_RE);
  if (!match) return null;
  const n = Number(match[1]);
  return isPhotoTableNumber(n) ? n : null;
}

function folderFromPath(path: string): string | null {
  const parts = path.split("/").filter(Boolean);
  if (parts.length < 2) return null;
  if (parts[0] === WEDDING_PHOTOS_HIDDEN_FOLDER) {
    return parts[1] ?? null;
  }
  return parts[0] ?? null;
}

/** Tolkar bord från en storage-sökväg (`bord-3/...` eller `hidden/bord-3/...`). */
export function parseTableFromPath(path: string): PhotoTableNumber | null {
  return parseTableFromFolder(folderFromPath(path));
}

export function parseCoupleFromPath(path: string): boolean {
  return folderFromPath(path) === PHOTO_COUPLE_FOLDER;
}

export function normalizeGuestName(name: string): string {
  return name.trim().replace(/\s+/g, " ").slice(0, PHOTO_GUEST_NAME_MAX_LEN);
}

function encodeGuestNameToken(name: string): string | null {
  const normalized = normalizeGuestName(name);
  if (!normalized) return null;
  const bytes = new TextEncoder().encode(normalized);
  let bin = "";
  for (const byte of bytes) bin += String.fromCharCode(byte);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function decodeGuestNameToken(token: string): string | null {
  try {
    const b64 = token.replace(/-/g, "+").replace(/_/g, "/");
    const padded = b64 + "=".repeat((4 - (b64.length % 4)) % 4);
    const bin = atob(padded);
    const bytes = Uint8Array.from(bin, (ch) => ch.charCodeAt(0));
    const name = normalizeGuestName(new TextDecoder().decode(bytes));
    return name || null;
  } catch {
    return null;
  }
}

export function parseGuestNameFromFileName(fileName: string): string | null {
  const match = fileName.match(FILE_NAME_META_RE);
  return match ? decodeGuestNameToken(match[1]) : null;
}

export function buildPhotoFileName(
  originalName: string,
  guestName: string | null
): string {
  const safe = originalName.replace(/[/\\]/g, "_");
  const id = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  const token = guestName ? encodeGuestNameToken(guestName) : null;
  return token ? `${id}--n.${token}--${safe}` : `${id}-${safe}`;
}

export function photoUploadPath(
  identity: PhotoIdentity,
  fileName: string
): string {
  const folder = identityFolder(identity);
  return folder ? `${folder}/${fileName}` : fileName;
}

export function photoSourceColor(photo: {
  table: PhotoTableNumber | null;
  fromCouple: boolean;
}): string | null {
  if (photo.fromCouple) return PHOTO_COUPLE_COLOR;
  return tableColor(photo.table);
}

export function photoSourceLabel(photo: {
  table: PhotoTableNumber | null;
  fromCouple: boolean;
}): string | null {
  if (photo.fromCouple) return "Brudparet";
  if (photo.table !== null) return `Bord ${photo.table}`;
  return null;
}

/** Kort märkning för små thumbnails (nummer eller hjärta). */
export function photoSourceMark(photo: {
  table: PhotoTableNumber | null;
  fromCouple: boolean;
}): string | null {
  if (photo.fromCouple) return "♥";
  if (photo.table !== null) return String(photo.table);
  return null;
}

export function photoAttribution(photo: {
  table: PhotoTableNumber | null;
  fromCouple: boolean;
  guestName: string | null;
}): string | null {
  const parts: string[] = [];
  const source = photoSourceLabel(photo);
  if (source) parts.push(source);
  if (photo.guestName) parts.push(photo.guestName);
  return parts.length > 0 ? parts.join(" · ") : null;
}

export function photoMatchesIdentity(
  photo: { table: PhotoTableNumber | null; fromCouple: boolean },
  identity: PhotoIdentity
): boolean {
  if (identity.kind === "table") {
    return !photo.fromCouple && photo.table === identity.table;
  }
  if (identity.kind === "couple") return photo.fromCouple;
  return !photo.fromCouple && photo.table === null;
}

/** Gömda bilder behåller bordsmappen under `hidden/`. */
export function hiddenPhotoPath(path: string): string {
  if (path.startsWith(`${WEDDING_PHOTOS_HIDDEN_FOLDER}/`)) return path;
  return `${WEDDING_PHOTOS_HIDDEN_FOLDER}/${path}`;
}

/** Återställer synlig sökväg från en gömd (behåller bord om det fanns). */
export function visiblePhotoPathFromHidden(hiddenPath: string): string {
  const prefix = `${WEDDING_PHOTOS_HIDDEN_FOLDER}/`;
  if (!hiddenPath.startsWith(prefix)) return hiddenPath;
  return hiddenPath.slice(prefix.length);
}

export function sortPhotosByTime<
  T extends { name: string; path?: string; created_at?: string | null },
>(files: T[]): T[] {
  return [...files].sort((a, b) => {
    const aTime = a.created_at ?? "";
    const bTime = b.created_at ?? "";
    if (aTime && bTime && aTime !== bTime) {
      return aTime.localeCompare(bTime);
    }
    const aKey = a.path ?? a.name;
    const bKey = b.path ?? b.name;
    return aKey.localeCompare(bKey);
  });
}

type ListedFile = {
  name: string;
  id: string | null;
  created_at?: string | null;
};

async function listFolder(
  folder: string
): Promise<{ files: ListedFile[]; error: string | null }> {
  const client = supabase;
  if (!client) return { files: [], error: "Supabase är inte konfigurerad." };

  const { data, error } = await client.storage
    .from(WEDDING_PHOTOS_BUCKET)
    .list(folder, {
      limit: 200,
      sortBy: { column: "created_at", order: "asc" },
    });

  if (error) return { files: [], error: error.message };
  return {
    files: (data ?? []).filter(isWeddingPhotoFile) as ListedFile[],
    error: null,
  };
}

function toWeddingPhoto(
  file: ListedFile,
  folder: string | null,
  getPublicUrl: (path: string) => string
): WeddingPhoto {
  const path = folder ? `${folder}/${file.name}` : file.name;
  return {
    name: file.name,
    path,
    url: getPublicUrl(path),
    table: parseTableFromPath(path),
    fromCouple: parseCoupleFromPath(path),
    guestName: parseGuestNameFromFileName(file.name),
    created_at: file.created_at ?? null,
  };
}

/**
 * Hämtar publika bilder: root (utan bord) + bord-1…bord-8 + brudparet.
 * Mappar (t.ex. `hidden`) ignoreras.
 */
export async function fetchPublicWeddingPhotos(): Promise<{
  photos: WeddingPhoto[];
  error: string | null;
}> {
  const client = supabase;
  if (!client) {
    return { photos: [], error: "Supabase är inte konfigurerad." };
  }

  const getPublicUrl = (path: string) =>
    client.storage.from(WEDDING_PHOTOS_BUCKET).getPublicUrl(path).data
      .publicUrl;

  const rootRes = await listFolder("");
  if (rootRes.error) return { photos: [], error: rootRes.error };

  // Root-listan innehåller både filer och mappar; filtrera till filer.
  const rootPhotos = rootRes.files.map((f) =>
    toWeddingPhoto(f, null, getPublicUrl)
  );

  const folderResults = await Promise.all(
    publicPhotoFolders().map(async (folder) => {
      const res = await listFolder(folder);
      return { folder, ...res };
    })
  );

  for (const res of folderResults) {
    if (res.error) return { photos: [], error: res.error };
  }

  const folderPhotos = folderResults.flatMap((res) =>
    res.files.map((f) => toWeddingPhoto(f, res.folder, getPublicUrl))
  );

  return {
    photos: sortPhotosByTime([...rootPhotos, ...folderPhotos]),
    error: null,
  };
}

/**
 * Admin: synliga (root + bord + brudparet) och gömda (`hidden` + undermappar).
 */
export async function fetchAdminWeddingPhotos(): Promise<{
  visible: WeddingPhoto[];
  hidden: WeddingPhoto[];
  error: string | null;
}> {
  const client = supabase;
  if (!client) {
    return {
      visible: [],
      hidden: [],
      error: "Supabase är inte konfigurerad.",
    };
  }

  const getPublicUrl = (path: string) =>
    client.storage.from(WEDDING_PHOTOS_BUCKET).getPublicUrl(path).data
      .publicUrl;

  const hiddenFolders = [
    WEDDING_PHOTOS_HIDDEN_FOLDER,
    ...publicPhotoFolders().map(
      (folder) => `${WEDDING_PHOTOS_HIDDEN_FOLDER}/${folder}`
    ),
  ];

  const [publicRes, ...hiddenResults] = await Promise.all([
    fetchPublicWeddingPhotos(),
    ...hiddenFolders.map((folder) => listFolder(folder)),
  ]);

  if (publicRes.error) {
    return { visible: [], hidden: [], error: publicRes.error };
  }
  for (const res of hiddenResults) {
    if (res.error) {
      return { visible: [], hidden: [], error: res.error };
    }
  }

  const hiddenPhotos = hiddenFolders.flatMap((folder, i) =>
    hiddenResults[i].files.map((f) => toWeddingPhoto(f, folder, getPublicUrl))
  );

  return {
    visible: publicRes.photos,
    hidden: sortPhotosByTime(hiddenPhotos),
    error: null,
  };
}
