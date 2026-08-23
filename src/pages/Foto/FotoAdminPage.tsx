import { useCallback, useEffect, useState, type CSSProperties } from "react";
import { Link } from "react-router-dom";
import type { Session } from "@supabase/supabase-js";
import { supabase, WEDDING_PHOTOS_BUCKET } from "../../lib/supabase";
import {
  fetchAdminWeddingPhotos,
  hiddenPhotoPath,
  photoAttribution,
  photoSourceColor,
  visiblePhotoPathFromHidden,
  type WeddingPhoto,
} from "../../lib/weddingPhotos";
import "./FotoPage.scss";
import "./FotoAdminPage.scss";

type BusyAction = "hide" | "show" | "delete";

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
    m.includes("403") ||
    m.includes("new row violates") ||
    m.includes("violates row-level")
  ) {
    return "Saknar behörighet – kontrollera Storage-policyn i Supabase (SELECT/INSERT/DELETE för inloggade).";
  }
  if (m.includes("already exists") || m.includes("duplicate") || m.includes("resource already")) {
    return "En fil med samma namn finns redan på målplatsen.";
  }
  return raw || "Okänt fel.";
}

/**
 * Flyttar en bild genom download → upload → remove.
 * Undviker storage.move() som kräver UPDATE-policy (ofta 400 utan den).
 */
async function relocatePhoto(
  fromPath: string,
  toPath: string
): Promise<string | null> {
  const client = supabase;
  if (!client) return "Supabase är inte konfigurerad.";

  const { data: blob, error: downloadError } = await client.storage
    .from(WEDDING_PHOTOS_BUCKET)
    .download(fromPath);
  if (downloadError || !blob) {
    return describeAuthError(downloadError?.message ?? "Kunde inte läsa bilden.");
  }

  const { error: uploadError } = await client.storage
    .from(WEDDING_PHOTOS_BUCKET)
    .upload(toPath, blob, {
      upsert: false,
      contentType: blob.type || "image/jpeg",
      cacheControl: "3600",
    });
  if (uploadError) {
    return describeAuthError(uploadError.message);
  }

  const { error: removeError } = await client.storage
    .from(WEDDING_PHOTOS_BUCKET)
    .remove([fromPath]);
  if (removeError) {
    // Rulla tillbaka kopian så vi inte får dubbletter.
    await client.storage.from(WEDDING_PHOTOS_BUCKET).remove([toPath]);
    return describeAuthError(removeError.message);
  }

  return null;
}

export function FotoAdminPage() {
  const [session, setSession] = useState<Session | null>(null);
  const [authLoading, setAuthLoading] = useState(() => Boolean(supabase));
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loggingIn, setLoggingIn] = useState(false);

  const [visibleImages, setVisibleImages] = useState<WeddingPhoto[]>([]);
  const [hiddenImages, setHiddenImages] = useState<WeddingPhoto[]>([]);
  const [galleryError, setGalleryError] = useState<string | null>(null);
  const [galleryLoading, setGalleryLoading] = useState(false);
  const [busyPath, setBusyPath] = useState<string | null>(null);
  const [busyAction, setBusyAction] = useState<BusyAction | null>(null);
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
    setGalleryLoading(true);
    setGalleryError(null);

    const { visible, hidden, error } = await fetchAdminWeddingPhotos();
    if (error) {
      setGalleryError(describeAuthError(error));
      setGalleryLoading(false);
      return;
    }

    setVisibleImages(visible);
    setHiddenImages(hidden);
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
    setVisibleImages([]);
    setHiddenImages([]);
    setActionMessage(null);
  }, []);

  const handleHide = useCallback(async (img: WeddingPhoto) => {
    const client = supabase;
    if (!client) return;

    setBusyPath(img.path);
    setBusyAction("hide");
    setActionMessage(null);

    const dest = hiddenPhotoPath(img.path);
    const errorMessage = await relocatePhoto(img.path, dest);

    setBusyPath(null);
    setBusyAction(null);

    if (errorMessage) {
      setActionMessage(errorMessage);
      return;
    }

    const hiddenUrl = client.storage
      .from(WEDDING_PHOTOS_BUCKET)
      .getPublicUrl(dest).data.publicUrl;
    setVisibleImages((prev) => prev.filter((i) => i.path !== img.path));
    setHiddenImages((prev) => [
      ...prev,
      { ...img, path: dest, url: hiddenUrl },
    ]);
    setActionMessage("Bilden är gömd – sparad men visas inte publikt.");
  }, []);

  const handleUnhide = useCallback(async (img: WeddingPhoto) => {
    const client = supabase;
    if (!client) return;

    setBusyPath(img.path);
    setBusyAction("show");
    setActionMessage(null);

    const dest = visiblePhotoPathFromHidden(img.path);
    const errorMessage = await relocatePhoto(img.path, dest);

    setBusyPath(null);
    setBusyAction(null);

    if (errorMessage) {
      setActionMessage(errorMessage);
      return;
    }

    const visibleUrl = client.storage
      .from(WEDDING_PHOTOS_BUCKET)
      .getPublicUrl(dest).data.publicUrl;
    setHiddenImages((prev) => prev.filter((i) => i.path !== img.path));
    setVisibleImages((prev) => [
      ...prev,
      { ...img, path: dest, url: visibleUrl },
    ]);
    setActionMessage("Bilden visas igen i galleri och bildspel.");
  }, []);

  const handleDelete = useCallback(async (img: WeddingPhoto) => {
    const client = supabase;
    if (!client) return;
    const ok = window.confirm(
      "Vill du verkligen radera den här bilden? Det går inte att ångra."
    );
    if (!ok) return;

    setBusyPath(img.path);
    setBusyAction("delete");
    setActionMessage(null);
    const { error } = await client.storage
      .from(WEDDING_PHOTOS_BUCKET)
      .remove([img.path]);
    setBusyPath(null);
    setBusyAction(null);

    if (error) {
      setActionMessage(describeAuthError(error.message));
      return;
    }
    setVisibleImages((prev) => prev.filter((i) => i.path !== img.path));
    setHiddenImages((prev) => prev.filter((i) => i.path !== img.path));
    setActionMessage("Bilden är raderad.");
  }, []);

  const actionLabel = (
    action: BusyAction,
    path: string,
    idle: string,
    busy: string
  ) => (busyPath === path && busyAction === action ? busy : idle);

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
            Logga in för att gömma eller radera bilder. Sidan är bara till för
            er.
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

  const isEmpty =
    visibleImages.length === 0 &&
    hiddenImages.length === 0 &&
    !galleryLoading;

  return (
    <div className="foto-page foto-page--gallery">
      <div className="foto-page__card">
        <Link to="/foto" className="foto-page__back-corner">
          ← Tillbaka till foto
        </Link>
        <h1>Foto – admin</h1>
        <p className="foto-page__intro muted">
          Inloggad som {session.user.email}. Alla bord visas här. Göm bilder
          som inte ska synas publikt (de sparas kvar), eller radera dem helt.
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

        {isEmpty && <p className="muted">Inga bilder ännu.</p>}

        {!isEmpty && (
          <>
            <section
              className="foto-admin__section"
              aria-labelledby="visible-heading"
            >
              <h2 id="visible-heading" className="foto-admin__heading">
                Synliga bilder
                <span className="foto-admin__count">
                  {visibleImages.length}
                </span>
              </h2>
              <p className="foto-admin__section-hint muted">
                Visas i galleri och bildspel. Bord och namn visas på varje bild.
              </p>
              {visibleImages.length === 0 ? (
                <p className="foto-admin__empty muted">
                  Inga synliga bilder just nu.
                </p>
              ) : (
                <div className="foto-admin__grid">
                  {visibleImages.map((img) => {
                    const busy = busyPath === img.path;
                    const color = photoSourceColor(img);
                    const attribution = photoAttribution(img);
                    return (
                      <div
                        key={img.path}
                        className="foto-admin__item"
                        style={
                          color
                            ? ({ "--table-color": color } as CSSProperties)
                            : undefined
                        }
                      >
                        <img src={img.url} alt="" loading="lazy" />
                        {attribution && (
                          <span
                            className="foto-admin__table-badge"
                            aria-label={attribution}
                          >
                            {attribution}
                          </span>
                        )}
                        <div className="foto-admin__actions">
                          <button
                            type="button"
                            className="foto-admin__action foto-admin__action--hide"
                            onClick={() => handleHide(img)}
                            disabled={busy}
                          >
                            {actionLabel("hide", img.path, "Göm", "Gömmer…")}
                          </button>
                          <button
                            type="button"
                            className="foto-admin__action foto-admin__action--delete"
                            onClick={() => handleDelete(img)}
                            disabled={busy}
                          >
                            {actionLabel(
                              "delete",
                              img.path,
                              "Radera",
                              "Raderar…"
                            )}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>

            <section
              className="foto-admin__section foto-admin__section--hidden"
              aria-labelledby="hidden-heading"
            >
              <h2 id="hidden-heading" className="foto-admin__heading">
                Gömda bilder
                <span className="foto-admin__count">
                  {hiddenImages.length}
                </span>
              </h2>
              <p className="foto-admin__section-hint muted">
                Sparade men visas inte i galleri eller bildspel.
              </p>
              {hiddenImages.length === 0 ? (
                <p className="foto-admin__empty muted">
                  Inga gömda bilder. Tryck Göm så flyttas bilden hit.
                </p>
              ) : (
                <div className="foto-admin__grid">
                  {hiddenImages.map((img) => {
                    const busy = busyPath === img.path;
                    const color = photoSourceColor(img);
                    const attribution = photoAttribution(img);
                    return (
                      <div
                        key={img.path}
                        className="foto-admin__item foto-admin__item--hidden"
                        style={
                          color
                            ? ({ "--table-color": color } as CSSProperties)
                            : undefined
                        }
                      >
                        <img src={img.url} alt="" loading="lazy" />
                        {attribution ? (
                          <span
                            className="foto-admin__table-badge"
                            aria-label={attribution}
                          >
                            {attribution}
                          </span>
                        ) : (
                          <span className="foto-admin__badge">Gömd</span>
                        )}
                        <div className="foto-admin__actions">
                          <button
                            type="button"
                            className="foto-admin__action foto-admin__action--show"
                            onClick={() => handleUnhide(img)}
                            disabled={busy}
                          >
                            {actionLabel("show", img.path, "Visa", "Visar…")}
                          </button>
                          <button
                            type="button"
                            className="foto-admin__action foto-admin__action--delete"
                            onClick={() => handleDelete(img)}
                            disabled={busy}
                          >
                            {actionLabel(
                              "delete",
                              img.path,
                              "Radera",
                              "Raderar…"
                            )}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </div>
  );
}
