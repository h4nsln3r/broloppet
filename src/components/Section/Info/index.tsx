import { WEDDING } from '../../../weddingConfig';
import { FiClock } from 'react-icons/fi';
import hossmoKA from '../../../assets/hossmoka.jpg';

import '../section.scss';
import './info-section.scss';

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
              {/* <div className="church-col">
                <span className="church-icon" aria-hidden="true" title={WEDDING.ceremony.place}>
                  <img src={hossmoKA} alt="Hossmo kyrka" loading="lazy" />
                </span>
              </div> */}
            </li>
          </ul>

          <img style={{ height: '256px' }} src={hossmoKA} alt="Hossmo kyrka" loading="lazy" />
          <ul>
            <li className="time-row">
              <div className="time-col">
                <span className="time-text">15:00 - Promenad till Hossmo Gård</span>
              </div>
              {/* <div className="church-col">
                <span className="church-icon" aria-hidden="true" title={WEDDING.ceremony.place}>
                  <img src={hossmoKA} alt="Hossmo kyrka" loading="lazy" />
                </span>
              </div> */}
            </li>
            <li className="time-row">
              <div className="time-col">
                <span className="time-text">18:00 — Middag</span>
                <span className="place-text muted">{WEDDING.party.place}</span>
              </div>
              {/* <div className="church-col">
                <span className="church-icon" aria-hidden="true" title={WEDDING.ceremony.place}>
                  <img src={hossmoKA} alt="Hossmo kyrka" loading="lazy" />
                </span>
              </div> */}
            </li>
            <li className="time-row">
              <div className="time-col">
                <span className="time-text">22:00 — Fest</span>
                <span className="place-text muted">{WEDDING.party.place}</span>
              </div>
              {/* <div className="church-col">
                <span className="church-icon" aria-hidden="true" title={WEDDING.ceremony.place}>
                  <img src={hossmoKA} alt="Hossmo kyrka" loading="lazy" />
                </span>
              </div> */}
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
          <div className="card map-card">
            <div className="mapWrap">
              <iframe
                src={WEDDING.maps.embedSrc}
                width="100%"
                height="100%"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="Karta"
              />
            </div>
          </div>
        )}
      </div>
      <br />

      <div className="grid">
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
            <a className="link" href={WEDDING.maps.ceremonyLink} target="_blank" rel="noreferrer">
              Hossmo kyrka – karta
            </a>
            <a className="link" href={WEDDING.maps.partyLink} target="_blank" rel="noreferrer">
              Hossmo gård – karta
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
