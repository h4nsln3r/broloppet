import { useState } from 'react';
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
  const defaultEmbed = addQueryParam(WEDDING.maps.embedSrc, 't', 'k');
  const ceremonyEmbed = addQueryParam(
    addQueryParam(WEDDING.maps.ceremonyLink, 'output', 'embed'),
    't',
    'k'
  );
  const partyEmbed = addQueryParam(
    addQueryParam(WEDDING.maps.partyLink, 'output', 'embed'),
    't',
    'k'
  );

  const [activeMap, setActiveMap] = useState<'default' | 'ceremony' | 'party'>('ceremony');

  const mapSrc =
    activeMap === 'ceremony' ? ceremonyEmbed : activeMap === 'party' ? partyEmbed : defaultEmbed;

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
                <span className="time-text">{WEDDING.ceremony.time}</span>
                <span className="">
                  {/* {WEDDING.ceremony.time} — Vigsel */}
                  Vigseln börjar kl. {WEDDING.ceremony.time} i {WEDDING.ceremony.place}. Se till att
                  vara där senast 13:45.
                </span>
                <span
                  role="button"
                  tabIndex={0}
                  className={`place-text muted ${activeMap === 'ceremony' ? 'active' : ''}`}
                  onClick={() => setActiveMap('ceremony')}
                  onKeyDown={(e) =>
                    (e.key === 'Enter' || e.key === ' ') && setActiveMap('ceremony')
                  }
                >
                  {WEDDING.ceremony.place}
                </span>
              </div>
            </li>
          </ul>

          <img className="church-main" src={hossmoKA} alt="Hossmo kyrka" loading="lazy" />

          <ul>
            <li className="time-row">
              <div className="time-col">
                <span className="">
                  Efter vigseln fortsätter bröllopsfesten på Hossmo gård. Gång från kyrkan.
                </span>
              </div>
            </li>

            <li className="time-row">
              <div className="time-col">
                <span className="time-text">Ca 18:00 — Middag</span>
                <span
                  role="button"
                  tabIndex={0}
                  className={`place-text muted ${activeMap === 'party' ? 'active' : ''}`}
                  onClick={() => setActiveMap('party')}
                  onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && setActiveMap('party')}
                >
                  {WEDDING.party.place}
                </span>
              </div>
            </li>
            <li>
              <img
                className="church-main"
                src="https://www.hossmogard.se/media/s11fy3cd/hossmogard_house_tny.webp?width=1300&height=696&v=1dc2df4c2cbab70"
                alt="Hossmo Gård"
                loading="lazy"
              />
            </li>
            {/* <li className="time-row">
              <div className="time-col">
                <span className="time-text">22:00 — Fest</span>
                <span
                  role="button"
                  tabIndex={0}
                  className={`place-text muted ${
                    activeMap === "party" ? "active" : ""
                  }`}
                  onClick={() => setActiveMap("party")}
                  onKeyDown={(e) =>
                    (e.key === "Enter" || e.key === " ") &&
                    setActiveMap("party")
                  }
                >
                  {WEDDING.party.place}
                </span>
              </div>
            </li> */}
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
          <>
            <div className="mapWrap">
              <iframe
                src={mapSrc}
                width="100%"
                height="100%"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="Karta"
              />
            </div>
          </>
        )}
      </div>
      <br />
      <div className="grid">
        <div className="card card--info transport-card">
          <h3>Hur tar en sig hit?</h3>
          <div className="info-grid">
            <div className="info-item">
              <h4>Bussar</h4>
              <p>Lägg info om bussar</p>
            </div>

            <div className="info-item">
              <h4>Bil</h4>
              <p>Lägg info om parkering</p>
            </div>

            <div className="info-item">
              <h4>Taxi</h4>
              <p>Nummer och taxibolag</p>
            </div>
          </div>
          <br />
          <ul>
            {WEDDING.transport.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      </div>

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
    </section>
  );
}
