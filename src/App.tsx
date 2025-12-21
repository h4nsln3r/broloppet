import './app.css';
import { useMemo, useState } from 'react';

type RsvpForm = {
  name: string;
  email: string;
  attending: 'yes' | 'no' | '';
  allergies: string;
  foodPrefs: string;
  speech: 'yes' | 'no' | '';
  speechDetails: string;
};

const initialForm: RsvpForm = {
  name: '',
  email: '',
  attending: '',
  allergies: '',
  foodPrefs: '',
  speech: '',
  speechDetails: '',
};

// ======= EDITA HÄR (bröllopsinfo) =======
const WEDDING = {
  couple: 'Julia & Hannes',
  dateLong: 'Fredag 29 augusti 2026', // om ni menar 2026; ändra annars till 2025
  ceremony: {
    place: 'Hossmo kyrka',
    time: '15:00', // ändra
  },
  party: {
    place: 'Hossmo gård',
    time: 'Efter vigseln',
    ends: '02:00',
  },
  osaDeadline: '1 augusti 2026', // ändra
  dressCode: 'Sommarfin', // t.ex. Kavaj / Sommarfin / Valfritt
  childrenPolicy: 'Vi önskar en barnfri dag/kväll ❤️',
  gifts: 'Vi önskar oss gärna ett bidrag till vår bröllopsresa.',
  toastmaster: {
    name: 'Toastmaster/Toastmadame: (namn)',
    contact: '(telefon / mail)',
    note: 'Vill du hålla tal, spex eller uppträde? Kontakta toastmaster/toastmadame i god tid.',
  },
  transport: [
    'Kyrka: (tips om parkering/transport här)',
    'Hossmo gård: (vägbeskrivning/parkering här)',
    'Samåkning: (om ni vill lägga till)',
  ],
  maps: {
    // Tips: använd “Dela” i Google Maps och ta en länk till kyrkan + gården
    ceremonyLink: 'https://maps.google.com/?q=Hossmo+kyrka',
    partyLink: 'https://maps.google.com/?q=Hossmo+g%C3%A5rd',
    // Embed: i Google Maps -> Dela -> “Bädda in en karta” -> kopiera src-URL
    embedSrc: 'PASTE_GOOGLE_MAPS_EMBED_SRC_HERE',
  },
};
// =======================================

export default function App() {
  const [form, setForm] = useState<RsvpForm>(initialForm);
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');

  const canSubmit = useMemo(() => {
    if (!form.name.trim()) return false;
    if (!form.attending) return false;
    return true;
  }, [form.name, form.attending]);

  function update<K extends keyof RsvpForm>(key: K, value: RsvpForm[K]) {
    setForm((p) => ({ ...p, [key]: value }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;

    // ======= GOOGLE FORMS (aktivera när du skapat det) =======
    // 1) Skapa Google Form + få action-URL och entry-id:n
    // 2) Sätt enableGoogleForm = true
    // 3) Fyll i GOOGLE_FORM_ACTION och entry.X nedan
    const enableGoogleForm = false;

    const GOOGLE_FORM_ACTION = 'PASTE_GOOGLE_FORM_ACTION_URL_HERE';

    const ENTRY = {
      name: 'entry.1111111111',
      email: 'entry.2222222222',
      attending: 'entry.3333333333',
      allergies: 'entry.4444444444',
      foodPrefs: 'entry.5555555555',
      speech: 'entry.6666666666',
      speechDetails: 'entry.7777777777',
    };
    // ========================================================

    try {
      setStatus('sending');

      if (!enableGoogleForm) {
        // “Fake submit” tills Google Form finns (så ni kan bygga UI i lugn och ro)
        await new Promise((r) => setTimeout(r, 350));
        setStatus('sent');
        setForm(initialForm);
        return;
      }

      const fd = new FormData();
      fd.append(ENTRY.name, form.name);
      fd.append(ENTRY.email, form.email);
      fd.append(ENTRY.attending, form.attending);
      fd.append(ENTRY.allergies, form.allergies);
      fd.append(ENTRY.foodPrefs, form.foodPrefs);
      fd.append(ENTRY.speech, form.speech);
      fd.append(ENTRY.speechDetails, form.speechDetails);

      await fetch(GOOGLE_FORM_ACTION, {
        method: 'POST',
        body: fd,
        mode: 'no-cors',
      });

      setStatus('sent');
      setForm(initialForm);
    } catch {
      setStatus('error');
    }
  }

  return (
    <div className="page">
      <header className="hero">
        <div className="hero__inner">
          <p className="eyebrow">Bröllop</p>
          <h1>{WEDDING.couple}</h1>
          <p className="lead">{WEDDING.dateLong}</p>

          <div className="hero__cards">
            <div className="card">
              <h3>Vigsel</h3>
              <p>{WEDDING.ceremony.place}</p>
              <p className="muted">Start: {WEDDING.ceremony.time}</p>
              <a className="link" href={WEDDING.maps.ceremonyLink} target="_blank" rel="noreferrer">
                Öppna i Google Maps
              </a>
            </div>

            <div className="card">
              <h3>Middag & fest</h3>
              <p>{WEDDING.party.place}</p>
              <p className="muted">
                {WEDDING.party.time} • Slutar: {WEDDING.party.ends}
              </p>
              <a className="link" href={WEDDING.maps.partyLink} target="_blank" rel="noreferrer">
                Öppna i Google Maps
              </a>
            </div>

            <div className="card">
              <h3>OSA</h3>
              <p>Svara via formuläret</p>
              <p className="muted">Senast: {WEDDING.osaDeadline}</p>
              <a className="link" href="#rsvp">
                Gå till OSA
              </a>
            </div>
          </div>

          <div className="hero__meta">
            <span className="pill">Klädkod: {WEDDING.dressCode}</span>
            <span className="pill">{WEDDING.childrenPolicy}</span>
          </div>

          <a className="cta" href="#rsvp">
            OSA nu
          </a>
        </div>
      </header>

      <main className="content">
        <section className="section">
          <h2>Information</h2>

          <div className="grid">
            <div className="card">
              <h3>Tider</h3>
              <ul>
                <li>Vigsel startar: {WEDDING.ceremony.time}</li>
                <li>Middag & fest: {WEDDING.party.time}</li>
                <li>Festen slutar: {WEDDING.party.ends}</li>
              </ul>
            </div>

            <div className="card">
              <h3>Klädkod</h3>
              <p>{WEDDING.dressCode}</p>
              <p className="muted">
                (Skriv gärna en kort förklaring här om ni vill, t.ex. “sommarfin – kostym/klänning,
                men kom som du trivs”.)
              </p>
            </div>

            <div className="card">
              <h3>Presenter</h3>
              <p>{WEDDING.gifts}</p>
              <p className="muted">
                (Här kan ni lägga till Swish/IBAN eller länk senare om ni vill.)
              </p>
            </div>

            <div className="card">
              <h3>Barn</h3>
              <p>{WEDDING.childrenPolicy}</p>
              <p className="muted">
                (Vill ni göra det extra tydligt: “Gäller både vigsel och fest”.)
              </p>
            </div>
          </div>
        </section>

        <section className="section">
          <h2>Transport</h2>
          <div className="card">
            <ul>
              {WEDDING.transport.map((t) => (
                <li key={t}>{t}</li>
              ))}
            </ul>
            <p className="muted">Tips: lägg gärna till “Kom i god tid” + parkeringstips här.</p>
          </div>
        </section>

        <section className="section">
          <h2>Karta</h2>
          <div className="card">
            <p className="muted">
              Kyrka och festlokal finns på länkarna ovan. Ni kan även bädda in en karta här:
            </p>

            {WEDDING.maps.embedSrc.includes('PASTE_') ? (
              <div className="mapPlaceholder">
                <p className="muted">
                  Lägg in en Google Maps embed-URL i <code>WEDDING.maps.embedSrc</code>
                  <br />
                  (Google Maps → Dela → “Bädda in en karta” → kopiera <code>src</code>)
                </p>
              </div>
            ) : (
              <div className="mapWrap">
                <iframe
                  src={WEDDING.maps.embedSrc}
                  width="100%"
                  height="360"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title="Karta"
                />
              </div>
            )}
          </div>
        </section>

        <section className="section">
          <h2>Tal & underhållning</h2>
          <div className="card">
            <p>{WEDDING.toastmaster.name}</p>
            <p className="muted">{WEDDING.toastmaster.contact}</p>
            <p className="muted">{WEDDING.toastmaster.note}</p>
          </div>
        </section>

        <section className="section" id="rsvp">
          <h2>OSA / RSVP</h2>
          <p className="muted">
            Svara om du kommer eller inte. Fyll gärna i allergier/matpreferenser.
          </p>

          <form className="form card" onSubmit={onSubmit}>
            <div className="row">
              <label>
                Namn *
                <input
                  value={form.name}
                  onChange={(e) => update('name', e.target.value)}
                  placeholder="För- och efternamn"
                  required
                />
              </label>

              <label>
                E-post (valfritt)
                <input
                  value={form.email}
                  onChange={(e) => update('email', e.target.value)}
                  placeholder="namn@mail.com"
                />
              </label>
            </div>

            <label>
              Kommer du? *
              <div className="segmented">
                <button
                  type="button"
                  className={form.attending === 'yes' ? 'active' : ''}
                  onClick={() => update('attending', 'yes')}
                >
                  Ja
                </button>
                <button
                  type="button"
                  className={form.attending === 'no' ? 'active' : ''}
                  onClick={() => update('attending', 'no')}
                >
                  Nej
                </button>
              </div>
            </label>

            <div className="row">
              <label>
                Allergier
                <input
                  value={form.allergies}
                  onChange={(e) => update('allergies', e.target.value)}
                  placeholder="T.ex. gluten, nötter…"
                />
              </label>

              <label>
                Matpreferenser
                <input
                  value={form.foodPrefs}
                  onChange={(e) => update('foodPrefs', e.target.value)}
                  placeholder="T.ex. vegetarisk, vegansk…"
                />
              </label>
            </div>

            <label>
              Planerar du tal/uppträdande/spex?
              <div className="segmented">
                <button
                  type="button"
                  className={form.speech === 'yes' ? 'active' : ''}
                  onClick={() => update('speech', 'yes')}
                >
                  Ja
                </button>
                <button
                  type="button"
                  className={form.speech === 'no' ? 'active' : ''}
                  onClick={() => update('speech', 'no')}
                >
                  Nej
                </button>
              </div>
            </label>

            {form.speech === 'yes' && (
              <label>
                Skriv kort vad du tänker (valfritt)
                <textarea
                  value={form.speechDetails}
                  onChange={(e) => update('speechDetails', e.target.value)}
                  placeholder="Tal, sång, spex – ungefär vad?"
                  rows={3}
                />
              </label>
            )}

            <div className="actions">
              <button className="submit" disabled={!canSubmit || status === 'sending'}>
                {status === 'sending' ? 'Skickar...' : 'Skicka OSA'}
              </button>

              {status === 'sent' && (
                <p className="ok">
                  Tack! Ditt svar är registrerat 💛
                  <br />
                  <span className="muted tiny">
                    (Just nu sparas det inte externt förrän Google Form är kopplat.)
                  </span>
                </p>
              )}

              {status === 'error' && <p className="err">Något gick fel. Testa igen.</p>}
            </div>

            <p className="tiny muted">OSA senast: {WEDDING.osaDeadline}</p>
          </form>
        </section>
      </main>

      <footer className="footer">
        <p className="muted">
          {WEDDING.couple} • {WEDDING.dateLong}
        </p>
      </footer>
    </div>
  );
}
