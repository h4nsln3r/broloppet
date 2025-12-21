import './app.css';
import { useMemo, useState } from 'react';

type RsvpForm = {
  name: string;
  email: string;
  attending: 'yes' | 'no' | '';
  allergies: string;
  plusOneName: string;
  speech: 'yes' | 'no' | '';
  speechDetails: string;
};

const initialForm: RsvpForm = {
  name: '',
  email: '',
  attending: '',
  allergies: '',
  plusOneName: '',
  speech: '',
  speechDetails: '',
};

export default function App() {
  const [form, setForm] = useState<RsvpForm>(initialForm);
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');

  // TODO: lägg in din Google Form action + entry-id:n här (steg 4)
  const GOOGLE_FORM_ACTION = 'PASTE_GOOGLE_FORM_ACTION_URL_HERE';

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

    try {
      setStatus('sending');

      // POST:a till Google Forms via FormData
      const fd = new FormData();

      // TODO: byt entry.xxxxx till rätt fält-id:n (steg 4)
      fd.append('entry.1111111111', form.name);
      fd.append('entry.2222222222', form.email);
      fd.append('entry.3333333333', form.attending);
      fd.append('entry.4444444444', form.allergies);
      fd.append('entry.5555555555', form.plusOneName);
      fd.append('entry.6666666666', form.speech);
      fd.append('entry.7777777777', form.speechDetails);

      // Viktigt: no-cors (GitHub Pages + Google Forms)
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
          <h1>Julia & Hannes</h1>
          <p className="lead">29 augusti • Hossmo kyrka → Hossmo gård</p>

          <div className="hero__cards">
            <div className="card">
              <h3>Vigsel</h3>
              <p>Hossmo kyrka</p>
              <p className="muted">Fredag 29 augusti</p>
            </div>
            <div className="card">
              <h3>Middag & fest</h3>
              <p>Hossmo gård</p>
              <p className="muted">Efter vigseln</p>
            </div>
            <div className="card">
              <h3>OSA</h3>
              <p>Svara via formuläret</p>
              <p className="muted">Senast: lägg datum här</p>
            </div>
          </div>

          <a className="cta" href="#rsvp">
            Svara på inbjudan
          </a>
        </div>
      </header>

      <main className="content">
        <section className="section">
          <h2>Praktisk information</h2>

          <div className="grid">
            <div className="card">
              <h3>Tider</h3>
              <ul>
                <li>Vigsel: (lägg tid)</li>
                <li>Middag: (lägg tid)</li>
                <li>Fest: (lägg tid)</li>
              </ul>
            </div>

            <div className="card">
              <h3>Klädkod</h3>
              <p>(t.ex. Kavaj / Sommarfin / Valfritt)</p>
            </div>

            <div className="card">
              <h3>Tal & uppträdanden</h3>
              <p>
                Om du vill hålla tal eller göra något – kryssa i formuläret så kontaktar vi dig.
              </p>
            </div>

            <div className="card">
              <h3>Kontakt</h3>
              <p>Toastmaster: (namn + telefon)</p>
              <p>Frågor: (mail/telefon)</p>
            </div>
          </div>
        </section>

        <section className="section" id="rsvp">
          <h2>OSA / RSVP</h2>
          <p className="muted">Svara om du kommer eller inte, och skriv gärna allergier.</p>

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

            <label>
              Allergier / specialkost
              <textarea
                value={form.allergies}
                onChange={(e) => update('allergies', e.target.value)}
                placeholder="T.ex. gluten, nötter, vegetarisk..."
                rows={3}
              />
            </label>

            <label>
              +1 / medföljande (namn)
              <input
                value={form.plusOneName}
                onChange={(e) => update('plusOneName', e.target.value)}
                placeholder="Om du har en plus one"
              />
            </label>

            <label>
              Planerar du tal/uppträdande?
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
                Berätta kort (valfritt)
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
                {status === 'sending' ? 'Skickar...' : 'Skicka svar'}
              </button>

              {status === 'sent' && <p className="ok">Tack! Ditt svar är skickat 💛</p>}
              {status === 'error' && <p className="err">Något gick fel. Testa igen.</p>}
            </div>

            <p className="tiny muted">(Vi kan lägga till “tack-sida” och bekräftelse senare.)</p>
          </form>
        </section>
      </main>

      <footer className="footer">
        <p className="muted">© Julia & Hannes • 29 augusti</p>
      </footer>
    </div>
  );
}
