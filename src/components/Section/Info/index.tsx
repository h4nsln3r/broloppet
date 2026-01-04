import { WEDDING } from '../../../weddingConfig';
import { FiClock } from 'react-icons/fi';
import hossmoKA from '../../../assets/hossmoka.jpg';

import '../section.scss';
import './info-section.scss';

function addQueryParam(url: string, key: string, value: string) {
  // simple helper: append or replace param
  try {
    const u = new URL(url, 'https://example.com');
    u.searchParams.set(key, value);
    // If original URL was relative to root (maps embed), try to return with same origin
    if (url.startsWith('http')) return u.toString();
    // For embed URLs like 'https://www.google.com/maps?q=...&output=embed' URL() works fine
    return u.toString();
  } catch (e) {
    // fallback: naive append
    const sep = url.includes('?') ? '&' : '?';
    console.log(e);
    return url + sep + encodeURIComponent(key) + '=' + encodeURIComponent(value);
  }
}

export function Information() {
  return (
    <section className="section">
      <h2>Information</h2>

      <div className="grid grid--times">
        <div className="card times-card">
          <h3>
            <span className="icon" aria-hidden="true">
              <FiClock size={18} />
            </span>
            Tider
          </h3>
          <ul>
            <li className="time-row">
              <div className="time-col">
                <span className="time-text">{WEDDING.ceremony.time} — Vigsel</span>
                <span className="place-text muted">{WEDDING.ceremony.place}</span>
              </div>
            </li>
          </ul>

          <img className="church-main" src={hossmoKA} alt="Hossmo kyrka" loading="lazy" />

          <ul>
            <li className="time-row">
              <div className="time-col">
                <span className="time-text">15:00 - Promenad till Hossmo Gård</span>
              </div>
            </li>
            <li className="time-row">
              <div className="time-col">
                <span className="time-text">18:00 — Middag</span>
                <span className="place-text muted">{WEDDING.party.place}</span>
              </div>
            </li>
            <li className="time-row">
              <div className="time-col">
                <span className="time-text">22:00 — Fest</span>
                <span className="place-text muted">{WEDDING.party.place}</span>
              </div>
            </li>
          </ul>
        </div>

        {WEDDING.maps.embedSrc.includes('PASTE_') ? (
          <div className="card map-card">
            <div className="mapPlaceholder">
              <p className="muted">
                Lägg in en Google Maps embed-URL i <code>WEDDING.maps.embedSrc</code>.
              </p>
            </div>
          </div>
        ) : (
          <div className="mapWrap">
            <iframe
              src={addQueryParam(WEDDING.maps.embedSrc, 't', 'k')}
              width="100%"
              height="100%"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title="Karta"
            />
          </div>
        )}
      </div>
      <br />

      <div className="card card--info">
        <div className="info-grid">
          <div className="info-item">
            <h4>Klädkod</h4>
            <p>{WEDDING.dressCode}</p>
          </div>

          <div className="info-item">
            <h4>Barn</h4>
            <p>{WEDDING.childrenPolicy}</p>
          </div>

          <div className="info-item">
            <h4>Presenter</h4>
            <p>{WEDDING.gifts}</p>
          </div>
        </div>
      </div>
      <br />
      <div className="grid">
        <div className="card transport-card">
          <h3>Transport & parkering</h3>
          <ul>
            {WEDDING.transport.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
