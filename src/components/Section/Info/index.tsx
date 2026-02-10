// src/components/Section/Info/index.tsx
import { useState } from "react";
import { WEDDING } from "../../../weddingConfig";
// import { FiClock } from 'react-icons/fi';
import hossmoKA from "../../../assets/hossmoka.jpg";

import "../section.scss";
import "./info-section.scss";
import { PlaceToggle, type MapTarget } from "./PlaceToggle";
import { addQueryParam } from "../../Map/utils";

export function Information() {
  const [activeMap, setActiveMap] = useState<MapTarget>("ceremony");

  const defaultEmbed = addQueryParam(WEDDING.maps.embedSrc, "t", "k");
  const ceremonyEmbed = addQueryParam(
    addQueryParam(WEDDING.maps.ceremonyLink, "output", "embed"),
    "t",
    "k",
  );
  const partyEmbed = addQueryParam(
    addQueryParam(WEDDING.maps.partyLink, "output", "embed"),
    "t",
    "k",
  );

  const mapSrc =
    activeMap === "ceremony"
      ? ceremonyEmbed
      : activeMap === "party"
        ? partyEmbed
        : defaultEmbed;

  return (
    <section className="section" id="info">
      <h2>Information</h2>

      <div className="grid grid--times">
        <div className="card times-card">
          <h3>
            {/* <span className="icon" aria-hidden="true">
              <FiClock size={28} />
            </span> */}
            Lördag - 29 augusti
          </h3>
          <ul>
            <li className="time-row">
              <div className="time-col">
                <span>
                  {/* {WEDDING.ceremony.time} — Vigsel */}
                  Vigseln börjar kl. {WEDDING.ceremony.time} i{" "}
                  <PlaceToggle
                    target="ceremony"
                    activeMap={activeMap}
                    setActiveMap={setActiveMap}
                    className=""
                  >
                    {WEDDING.ceremony.place}
                  </PlaceToggle>
                  . Se till att vara där senast 13:45.
                </span>
              </div>
            </li>
          </ul>

          <img
            className="church-main"
            src={hossmoKA}
            alt="Hossmo kyrka"
            loading="lazy"
          />

          <ul>
            <li className="time-row">
              <div className="time-col">
                <span className="">
                  Bröllopsfesten fortsätter på{" "}
                  <PlaceToggle
                    target="party"
                    activeMap={activeMap}
                    setActiveMap={setActiveMap}
                    className=""
                  >
                    {WEDDING.party.place}.
                  </PlaceToggle>{" "}
                  <br />
                  Det är en kort promenad från kyrkan.
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
          </ul>
        </div>

        {WEDDING.maps.embedSrc.includes("PASTE_") ? (
          <div className="card map-card">
            <div className="mapPlaceholder">
              <p className="muted">
                Lägg in en Google Maps embed-URL i{" "}
                <code>WEDDING.maps.embedSrc</code>.
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
          <h3>Hur tar man sig dit?</h3>
          <p>
            Hossmo gård —{" "}
            <a href={WEDDING.maps.partyLink} target="_blank" rel="noreferrer">
              Öppna i Google Maps
            </a>
          </p>
          <p className="muted">Hossmo Gård 140, 388 92 Hossmo</p>
          <div className="info-grid">
            {/* Buss */}
            <div className="info-item">
              <h4>Buss</h4>
              <p>
                Från Kalmar Centralstation går KLT:s linje <strong>403</strong>{" "}
                mot Ljungbyholm / Torsås.
                <br />
                Kliv av vid hållplats{" "}
                <PlaceToggle
                  target="ceremony"
                  activeMap={activeMap}
                  setActiveMap={setActiveMap}
                  className=""
                >
                  Hossmo kyrka
                </PlaceToggle>{" "}
                eller <strong>Hossmo E22</strong>.
                <br />
                Resan tar ca 20 minuter.
                <br />
                <br />
                Se tidtabell på KLT-appen eller på{" "}
                <a
                  href="https://www.kalmarlanstrafik.se"
                  target="_blank"
                  rel="noreferrer"
                >
                  kalmarlanstrafik.se
                </a>
                . Biljett köps via appen eller ombord på bussen.
              </p>
            </div>

            {/* Bil */}
            <div className="info-item">
              <h4>Bil</h4>
              <p>
                Det finns parkering både vid{" "}
                <PlaceToggle
                  target="ceremony"
                  activeMap={activeMap}
                  setActiveMap={setActiveMap}
                  className=""
                >
                  Hossmo kyrka
                </PlaceToggle>{" "}
                och{" "}
                <PlaceToggle
                  target="party"
                  activeMap={activeMap}
                  setActiveMap={setActiveMap}
                  className=""
                >
                  Hossmo gård
                </PlaceToggle>
              </p>
            </div>

            {/* Taxi */}
            <div className="info-item">
              <h4>Taxi</h4>
              <p>Förslag:</p>
              <p>
                <strong>Sverigetaxi Kalmar:</strong>{" "}
                <a href="tel:0480444444">0480-44&nbsp;44&nbsp;44</a>
                <br />
                <strong>Kalmar Taxi:</strong>{" "}
                <a href="tel:048028200">0480-28&nbsp;200</a>
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="card card--info">
        <div className="info-grid">
          <div className="info-item">
            <h4>Klädkod</h4>
            <h4 className="muted">Kavaj</h4>
          </div>

          <div className="info-item">
            <h4>Barn</h4>
            <p>{WEDDING.childrenPolicy}</p>
          </div>

          <div className="info-item">
            <h4>Present</h4>
            <p>
              Den största gåvan för oss är att få fira dagen tillsammans med er.
              <br />
              Om ni vill ge en present tar vi tacksamt emot bidrag till vår
              bröllopsresa till Japan.
              <br /> Swish kan skickas till vår toastmadame Jenny:
              <br /> 073 622 67 58.
            </p>
          </div>
        </div>
      </div>
      <br />
      <div className="card card--info">
        <h3>Hotell</h3>
        <p>
          Vi bor på Calmar Stadshotell på brölloppsnatten. Om ni vill bo där
          tillsammans med oss kan ni boka med vår specialkod:
        </p>
        <p>
          <strong>Profilhotels Calmar Stadshotell</strong>
          <br />
          Stortorget 14, SE-392 32, Kalmar
        </p>

        <div className="info-grid">
          <div className="info-item">
            <h4>Bokningskod</h4>
            <p>
              <strong>Hannes&Julia2026</strong>
            </p>
            <p className="muted">
              10% rabatt på samtliga rumskategorier under Flexible Rate
            </p>
          </div>

          <div className="info-item">
            <h4>Villkor</h4>
            <p className="muted">
              Fri avbokning fram till ankomstdagen kl. 14:00
              <br />
              Gäller perioden 28–30 augusti
              <br />
              Kod aktiv fram till 31 juli
            </p>
          </div>

          <div className="info-item">
            <h4>Bokning</h4>
            <p>
              Gå in på{" "}
              <a href="https://www.ligula.se" target="_blank" rel="noreferrer">
                ligula.se
              </a>{" "}
              och fyll i bokningskoden vid bokningen.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
