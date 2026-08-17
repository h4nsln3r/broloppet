import {
  PHOTO_TABLE_NUMBERS,
  type PhotoTableNumber,
  isPhotoTableNumber,
  tableFolder,
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
  created_at?: string | null;
};

const TABLE_FOLDER_RE = /^bord-(\d+)$/;

export function parseTableFromFolder(
  folder: string | null | undefined
): PhotoTableNumber | null {
  if (!folder) return null;
  const match = folder.match(TABLE_FOLDER_RE);
  if (!match) return null;
  const n = Number(match[1]);
  return isPhotoTableNumber(n) ? n : null;
}

/** Tolkar bord från en storage-sökväg (`bord-3/...` eller `hidden/bord-3/...`). */
export function parseTableFromPath(path: string): PhotoTableNumber | null {
  const parts = path.split("/").filter(Boolean);
  if (parts[0] === WEDDING_PHOTOS_HIDDEN_FOLDER) {
    return parseTableFromFolder(parts[1]);
  }
  return parseTableFromFolder(parts[0]);
}

export function photoUploadPath(
  table: PhotoTableNumber,
  fileName: string
): string {
  return `${tableFolder(table)}/${fileName}`;
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
    created_at: file.created_at ?? null,
  };
}

/**
 * Hämtar publika bilder: root (äldre utan bord) + bord-1…bord-8.
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

  const tableResults = await Promise.all(
    PHOTO_TABLE_NUMBERS.map(async (table) => {
      const folder = tableFolder(table);
      const res = await listFolder(folder);
      return { folder, ...res };
    })
  );

  for (const res of tableResults) {
    if (res.error) return { photos: [], error: res.error };
  }

  const tablePhotos = tableResults.flatMap((res) =>
    res.files.map((f) => toWeddingPhoto(f, res.folder, getPublicUrl))
  );

  return {
    photos: sortPhotosByTime([...rootPhotos, ...tablePhotos]),
    error: null,
  };
}

/**
 * Admin: synliga (root + bord) och gömda (`hidden` + `hidden/bord-N`).
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

  const [publicRes, hiddenRootRes, ...hiddenTableResults] = await Promise.all([
    fetchPublicWeddingPhotos(),
    listFolder(WEDDING_PHOTOS_HIDDEN_FOLDER),
    ...PHOTO_TABLE_NUMBERS.map((table) =>
      listFolder(`${WEDDING_PHOTOS_HIDDEN_FOLDER}/${tableFolder(table)}`)
    ),
  ]);

  if (publicRes.error) {
    return { visible: [], hidden: [], error: publicRes.error };
  }
  if (hiddenRootRes.error) {
    return { visible: [], hidden: [], error: hiddenRootRes.error };
  }
  for (const res of hiddenTableResults) {
    if (res.error) {
      return { visible: [], hidden: [], error: res.error };
    }
  }

  const hiddenRootPhotos = hiddenRootRes.files.map((f) =>
    toWeddingPhoto(f, WEDDING_PHOTOS_HIDDEN_FOLDER, getPublicUrl)
  );

  const hiddenTablePhotos = PHOTO_TABLE_NUMBERS.flatMap((table, i) => {
    const folder = `${WEDDING_PHOTOS_HIDDEN_FOLDER}/${tableFolder(table)}`;
    return hiddenTableResults[i].files.map((f) =>
      toWeddingPhoto(f, folder, getPublicUrl)
    );
  });

  return {
    visible: publicRes.photos,
    hidden: sortPhotosByTime([...hiddenRootPhotos, ...hiddenTablePhotos]),
    error: null,
  };
}
