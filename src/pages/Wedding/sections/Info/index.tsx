import { useState, useCallback } from "react";
import {
  IoBus,
  IoCar,
  IoCall,
  IoShirtOutline,
  IoPeopleOutline,
  IoGiftOutline,
  IoKeyOutline,
  IoDocumentTextOutline,
  IoOpenOutline,
} from "react-icons/io5";
import { WEDDING } from "../../../../config";
import hossmoKA from "../../../../assets/hossmoka.jpg";
import { addQueryParam } from "../../../../components/Map/utils";
import { useScrollToMap } from "../../../../hooks/useScrollToMap";
import type { MapTarget } from "./types";

import { SectionTitle } from "../../../../components/Section/SectionTitle";
import "../../../../components/Section/section.scss";
import "./info-section.scss";

export function Information() {
  const [activeMap, setActiveMap] = useState<MapTarget>("ceremony");
  const scrollToMap = useScrollToMap();

  const handleSetActiveMap = useCallback(
    (target: MapTarget) => {
      setActiveMap(target);
      setTimeout(() => scrollToMap(), 80);
    },
    [scrollToMap],
  );

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
      <SectionTitle>Information</SectionTitle>

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
                  Vigseln börjar kl. {WEDDING.ceremony.time} i{" "}
                  <button
                    className={`place-button ${activeMap === "ceremony" ? "active" : ""}`}
                    onClick={() => handleSetActiveMap("ceremony")}
                  >
                    {WEDDING.ceremony.place}
                  </button>
                  . Se till att vara där senast 13:45.
                </span>
              </div>
            </li>
          </ul>

          <img
            className={`church-main ${activeMap === "ceremony" ? "active" : ""}`}
            src={hossmoKA}
            alt="Hossmo kyrka"
            loading="lazy"
          />

          <ul>
            <li className="time-row">
              <div className="time-col">
                <span className="">
                  Bröllopsfesten fortsätter sen på{" "}
                  <button
                    className={`place-button ${activeMap === "party" ? "active" : ""}`}
                    onClick={() => handleSetActiveMap("party")}
                  >
                    {WEDDING.party.place}
                  </button>
                  . Det är en kort promenad från kyrkan.
                </span>
              </div>
            </li>

            <li>
              <img
                className={`church-main ${activeMap === "party" ? "active" : ""}`}
                src="https://www.hossmogard.se/media/s11fy3cd/hossmogard_house_tny.webp?width=1300&height=696&v=1dc2df4c2cbab70"
                alt="Hossmo Gård"
                loading="lazy"
              />
            </li>
          </ul>

          <div className="place-buttons-row">
            <button
              type="button"
              className={`place-button ${activeMap === "ceremony" ? "active" : ""}`}
              onClick={() => handleSetActiveMap("ceremony")}
            >
              {WEDDING.ceremony.place}
            </button>
            <button
              type="button"
              className={`place-button ${activeMap === "party" ? "active" : ""}`}
              onClick={() => handleSetActiveMap("party")}
            >
              {WEDDING.party.place}
            </button>
          </div>
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
        )}
      </div>

      <br />

      <div className="grid">
        <div className="card card--info transport-card">
          <h3>Hur tar man sig dit?</h3>
          <p className="transport-card__destination">
            <button
              className={`place-button ${activeMap === "party" ? "active" : ""}`}
              onClick={() => handleSetActiveMap("party")}
            >
              {WEDDING.party.place}
            </button>{" "}
            —{" "}
            <a href={WEDDING.maps.partyLink} target="_blank" rel="noreferrer">
              Öppna i Google Maps
            </a>
          </p>
          <p className="transport-card__address muted">
            Hossmo Gård 140, 388 92 Hossmo
          </p>
          <div className="info-grid transport-grid">
            <div className="transport-item info-item">
              <h4 className="transport-item__title">
                <IoBus className="transport-item__icon" aria-hidden />
                Buss
              </h4>
              <p>
                Från Kalmar Centralstation går KLT:s linje <strong>403</strong>{" "}
                mot Ljungbyholm / Torsås.
                <br />
                Kliv av vid hållplats{" "}
                <button
                  className={`place-button ${activeMap === "ceremony" ? "active" : ""}`}
                  onClick={() => handleSetActiveMap("ceremony")}
                >
                  Hossmo kyrka
                </button>{" "}
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

            <div className="transport-item info-item">
              <h4 className="transport-item__title">
                <IoCar className="transport-item__icon" aria-hidden />
                Bil
              </h4>
              <p>
                Det finns parkering både vid{" "}
                <button
                  className={`place-button ${activeMap === "ceremony" ? "active" : ""}`}
                  onClick={() => handleSetActiveMap("ceremony")}
                >
                  Hossmo kyrka
                </button>{" "}
                och{" "}
                <button
                  className={`place-button ${activeMap === "party" ? "active" : ""}`}
                  onClick={() => handleSetActiveMap("party")}
                >
                  Hossmo gård
                </button>
                .
              </p>
            </div>

            <div className="transport-item info-item">
              <h4 className="transport-item__title">
                <IoCall className="transport-item__icon" aria-hidden />
                Taxi
              </h4>
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

      <div className="card card--info card--dress-barn-present">
        <div className="info-grid info-grid--dress-barn-present">
          <div className="info-item">
            <h4 className="info-item__title-with-icon">
              <IoShirtOutline className="info-item__icon" aria-hidden />
              Klädkod
            </h4>
            <h4 className="muted">Kavaj</h4>
          </div>

          <div className="info-item">
            <h4 className="info-item__title-with-icon">
              <IoPeopleOutline className="info-item__icon" aria-hidden />
              Barn
            </h4>
            <p>{WEDDING.childrenPolicy}</p>
          </div>

          <div className="info-item info-item--full-width">
            <h4 className="info-item__title-with-icon">
              <IoGiftOutline className="info-item__icon" aria-hidden />
              Present
            </h4>
            <p>
              Den största gåvan för oss är att få fira dagen tillsammans med er.
              <br />
              Om ni vill ge en present tar vi tacksamt emot bidrag till vår
              bröllopsresa till Japan.
              <br />
              Swish kan skickas till vår toastmadame{" "}
              <span className="present-contact">
                <span className="present-contact__name">
                  Jennifer Griffin Lindahl
                </span>
                <a href="tel:0736226758" className="present-contact__tel">
                  073 622 67 58
                </a>
              </span>
            </p>
          </div>
          {/* <FlowerBouquet className="flower" speed={1} /> */}
        </div>
      </div>
      <br />
      <div className="card card--info card--hotell">
        <h3>Hotell</h3>
        <p className="card--hotell__intro">
          Vi bor på Calmar Stadshotell på brölloppsnatten. Om ni vill bo där
          tillsammans med oss kan ni boka med vår specialkod:
        </p>
        <p className="card--hotell__address">
          <strong>Profilhotels Calmar Stadshotell</strong>
          <br />
          Stortorget 14, SE-392 32, Kalmar
        </p>

        <div className="info-grid info-grid--hotell">
          <div className="info-item">
            <h4 className="info-item__title-with-icon">
              <IoKeyOutline className="info-item__icon" aria-hidden />
              Bokningskod
            </h4>
            <p>
              <strong>Hannes&Julia2026</strong>
            </p>
            <p className="muted">
              10% rabatt på samtliga rumskategorier under Flexible Rate
            </p>
          </div>

          <div className="info-item">
            <h4 className="info-item__title-with-icon">
              <IoDocumentTextOutline className="info-item__icon" aria-hidden />
              Villkor
            </h4>
            <p className="muted">
              Fri avbokning fram till ankomstdagen kl. 14:00
              <br />
              Gäller perioden 28–30 augusti
              <br />
              Kod aktiv fram till 31 juli
            </p>
          </div>

          <div className="info-item">
            <h4 className="info-item__title-with-icon">
              <IoOpenOutline className="info-item__icon" aria-hidden />
              Bokning
            </h4>
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
