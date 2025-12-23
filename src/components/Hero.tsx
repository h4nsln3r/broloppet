import type { WeddingConfig } from '../weddingConfig';
import weddingPhoto from '../assets/hannes-julia-illustration.png';

type HeroProps = {
  wedding: WeddingConfig;
};

export function Hero({ wedding }: HeroProps) {
  return (
    <header className="hero">
      <div className="hero__inner">
        <p className="eyebrow">Save the date</p>
        <h1>{wedding.couple}</h1>
        <p className="lead">{wedding.dateLong}</p>

        <div className="hero__illustration">
          {/* Lägg bilden i public/ enligt filnamnet nedan */}
          <img src={weddingPhoto} alt={wedding.couple} />
        </div>

        <div className="hero__cards">
          <div className="card">
            <h3>Vigsel</h3>
            <p>{wedding.ceremony.place}</p>
            <p className="muted">Start: {wedding.ceremony.time}</p>
            <a className="link" href={wedding.maps.ceremonyLink} target="_blank" rel="noreferrer">
              Hossmo kyrka – Google Maps
            </a>
          </div>

          <div className="card">
            <h3>Middag & fest</h3>
            <p>{wedding.party.place}</p>
            <p className="muted">Efter vigseln • till ca {wedding.party.ends}</p>
            <a className="link" href={wedding.maps.partyLink} target="_blank" rel="noreferrer">
              Hossmo gård – Google Maps
            </a>
          </div>

          <div className="card card--meta">
            <div className="card__meta-row">
              <span className="label">OSA</span>
              <span>{wedding.osaDeadline}</span>
            </div>
            <div className="card__meta-row">
              <span className="label">Klädkod</span>
              <span>{wedding.dressCode}</span>
            </div>
            <div className="card__meta-row">
              <span className="label">Barn</span>
              <span>{wedding.childrenPolicy}</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
