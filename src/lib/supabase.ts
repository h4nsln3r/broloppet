import { createClient } from "@supabase/supabase-js";
import {
  PUBLIC_SUPABASE_ANON_KEY,
  PUBLIC_SUPABASE_URL,
} from "../config/supabasePublic";

const supabaseUrl =
  import.meta.env.VITE_SUPABASE_URL || PUBLIC_SUPABASE_URL;
const supabaseAnonKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY || PUBLIC_SUPABASE_ANON_KEY;

export const supabase =
  supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey)
    : null;

export const WEDDING_PHOTOS_BUCKET = "wedding-photos";

/** Gömda bilder ligger i den här mappen och visas inte publikt. */
export const WEDDING_PHOTOS_HIDDEN_FOLDER = "hidden";

/** Filtrerar bort mappar och Storage-placeholders från list()-resultat. */
export function isWeddingPhotoFile(file: {
  name: string;
  id: string | null;
}): boolean {
  return file.name !== ".emptyFolderPlaceholder" && file.id !== null;
}
