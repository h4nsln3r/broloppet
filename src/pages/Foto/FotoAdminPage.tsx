import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import type { Session } from "@supabase/supabase-js";
import { supabase, WEDDING_PHOTOS_BUCKET } from "../../lib/supabase";
import "./FotoPage.scss";
import "./FotoAdminPage.scss";

type GalleryImage = { name: string; url: string };

function describeAuthError(raw: string): string {
  const m = raw.toLowerCase();
  if (m.includes("invalid login") || m.includes("invalid credentials")) {
    return "Fel e-post eller lösenord.";
  }
  if (m.includes("email not confirmed")) {
    return "E-postadressen är inte bekräftad ännu.";
  }
  if (
    m.includes("row-level security") ||
    m.includes("unauthorized") ||
    m.includes("permission") ||
    m.includes("policy") ||
    m.includes("403")
  ) {
    return "Saknar behörighet – kontrollera DELETE-policyn i Supabase.";
  }
  return raw || "Okänt fel.";
}

export function FotoAdminPage() {
  const [session, setSession] = useState<Session | null>(null);
  const [authLoading, setAuthLoading] = useState(() => Boolean(supabase));
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loggingIn, setLoggingIn] = useState(false);

  const [images, setImages] = useState<GalleryImage[]>([]);
  const [galleryError, setGalleryError] = useState<string | null>(null);
  const [galleryLoading, setGalleryLoading] = useState(false);
  const [deletingName, setDeletingName] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  useEffect(() => {
    const client = supabase;
    if (!client) return;

    let cancelled = false;
    client.auth.getSession().then(({ data }) => {
      if (!cancelled) {
        setSession(data.session);
        setAuthLoading(false);
      }
    });

    const { data: sub } = client.auth.onAuthStateChange((_event, next) => {
      setSession(next);
    });

    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
  }, []);

  const fetchImages = useCallback(async () => {
    const client = supabase;
    if (!client) return;
    setGalleryLoading(true);
    setGalleryError(null);
    const { data, error } = await client.storage
      .from(WEDDING_PHOTOS_BUCKET)
      .list("", { limit: 200 });
    if (error) {
      setGalleryError(describeAuthError(error.message));
      setGalleryLoading(false);
      return;
    }
    const files = (data ?? []).filter(
      (f) => f.name !== ".emptyFolderPlaceholder"
    );
    const urls = files.map((f) => {
      const { data: urlData } = client.storage
        .from(WEDDING_PHOTOS_BUCKET)
        .getPublicUrl(f.name);
      return { name: f.name, url: urlData.publicUrl };
    });
    setImages(urls);
    setGalleryLoading(false);
  }, []);

  useEffect(() => {
    if (!session) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchImages();
  }, [session, fetchImages]);

  const handleLogin = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      const client = supabase;
      if (!client) return;
      setLoggingIn(true);
      setLoginError(null);
      const { error } = await client.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (error) {
        setLoginError(describeAuthError(error.message));
      }
      setLoggingIn(false);
    },
    [email, password]
  );

  const handleLogout = useCallback(async () => {
    await supabase?.auth.signOut();
    setImages([]);
    setActionMessage(null);
  }, []);

  const handleDelete = useCallback(
    async (name: string) => {
      const client = supabase;
      if (!client) return;
      const ok = window.confirm(
        "Vill du verkligen radera den här bilden? Det går inte att ångra."
      );
      if (!ok) return;

      setDeletingName(name);
      setActionMessage(null);
      const { error } = await client.storage
        .from(WEDDING_PHOTOS_BUCKET)
        .remove([name]);
      setDeletingName(null);

      if (error) {
        setActionMessage(describeAuthError(error.message));
        return;
      }
      setImages((prev) => prev.filter((img) => img.name !== name));
      setActionMessage("Bilden är raderad.");
    },
    []
  );

  if (!supabase) {
    return (
      <div className="foto-page">
        <div className="foto-page__card">
          <h1>Foto – admin</h1>
          <p className="muted">
            Supabase är inte konfigurerad. Lägg till VITE_SUPABASE_URL och
            VITE_SUPABASE_ANON_KEY i .env.
          </p>
        </div>
      </div>
    );
  }

  if (authLoading) {
    return (
      <div className="foto-page">
        <div className="foto-page__card">
          <p className="muted" style={{ textAlign: "center", margin: "40px 0" }}>
            Laddar…
          </p>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="foto-page">
        <div className="foto-page__card">
          <Link to="/foto" className="foto-page__back-corner">
            ← Tillbaka till foto
          </Link>
          <h1>Foto – admin</h1>
          <p className="foto-page__intro muted">
            Logga in för att radera bilder. Sidan är bara till för er.
          </p>

          <form className="foto-admin__login" onSubmit={handleLogin}>
            <label className="foto-admin__field">
              <span>E-post</span>
              <input
                type="email"
                autoComplete="username"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </label>
            <label className="foto-admin__field">
              <span>Lösenord</span>
              <input
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </label>
            {loginError && (
              <p className="foto-upload__error-msg" role="alert">
                {loginError}
              </p>
            )}
            <button
              type="submit"
              className="foto-upload__submit"
              disabled={loggingIn}
            >
              {loggingIn ? "Loggar in…" : "Logga in"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="foto-page foto-page--gallery">
      <div className="foto-page__card">
        <Link to="/foto" className="foto-page__back-corner">
          ← Tillbaka till foto
        </Link>
        <h1>Foto – admin</h1>
        <p className="foto-page__intro muted">
          Inloggad som {session.user.email}. Radera bilder som inte ska visas.
        </p>

        <div className="foto-admin__toolbar">
          <button
            type="button"
            className="foto-admin__secondary"
            onClick={fetchImages}
            disabled={galleryLoading}
          >
            {galleryLoading ? "Uppdaterar…" : "Uppdatera"}
          </button>
          <button
            type="button"
            className="foto-admin__secondary"
            onClick={handleLogout}
          >
            Logga ut
          </button>
        </div>

        {actionMessage && (
          <p className="foto-admin__status" role="status">
            {actionMessage}
          </p>
        )}
        {galleryError && (
          <p className="foto-upload__error-msg" role="alert">
            {galleryError}
          </p>
        )}

        {!galleryError && images.length === 0 && !galleryLoading && (
          <p className="muted">Inga bilder att radera.</p>
        )}

        {images.length > 0 && (
          <div className="foto-admin__grid">
            {images.map((img) => (
              <div key={img.name} className="foto-admin__item">
                <img src={img.url} alt="" loading="lazy" />
                <button
                  type="button"
                  className="foto-admin__delete"
                  onClick={() => handleDelete(img.name)}
                  disabled={deletingName === img.name}
                >
                  {deletingName === img.name ? "Raderar…" : "Radera"}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
