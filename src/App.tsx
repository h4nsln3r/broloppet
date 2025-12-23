import './styles/app.scss';
import { Hero } from './components/Hero';
import { RsvpForm } from './components/RsvpForm';
import { WEDDING } from './weddingConfig';

export default function App() {
  return (
    <div className="page">
      <Hero wedding={WEDDING} />

      <main className="content">
        <section className="section">
          <h2>Information</h2>

          <div className="grid grid--info">
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
            </div>

            <div className="card">
              <h3>Barn</h3>
              <p>{WEDDING.childrenPolicy}</p>
            </div>

            <div className="card">
              <h3>Presenter</h3>
              <p>{WEDDING.gifts}</p>
            </div>

            <div className="card">
              <h3>Transport & parkering</h3>
              <ul>
                {WEDDING.transport.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>

            <div className="card">
              <h3>Platser</h3>
              <p>{WEDDING.ceremony.place}</p>
              <p>{WEDDING.party.place}</p>
              <div className="links">
                <a
                  className="link"
                  href={WEDDING.maps.ceremonyLink}
                  target="_blank"
                  rel="noreferrer"
                >
                  Hossmo kyrka – karta
                </a>
                <a className="link" href={WEDDING.maps.partyLink} target="_blank" rel="noreferrer">
                  Hossmo gård – karta
                </a>
              </div>
            </div>
          </div>

          <div className="mapSection">
            {WEDDING.maps.embedSrc.includes('PASTE_') ? (
              <div className="mapPlaceholder">
                <p className="muted">
                  Lägg in en Google Maps embed-URL i <code>WEDDING.maps.embedSrc</code>.
                  <br />
                  (Google Maps → Dela → “Bädda in en karta” → kopiera <code>src</code>.)
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
            Svara om du kommer eller inte. Fyll gärna i allergier och önskemål kring mat.
          </p>

          <RsvpForm osaDeadline={WEDDING.osaDeadline} />
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
