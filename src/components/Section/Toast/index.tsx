// src/components/Section/Toast/index.tsx
import { WEDDING } from "../../../weddingConfig";
import { Card } from "../../Card";
import JGImage from "../../../assets/toast/JG.jpg";
import TebbeImage from "../../../assets/toast/tebbe.jpg";

import "./toast-section.scss";

const toastmasterImages: Record<string, string> = {
  "Jenny Griffin": JGImage,
  "Erik Tebrell": TebbeImage,
};

export function ToastMasters() {
  return (
    <section className="section section--toastmasters">
      <h2>Tal & underhållning</h2>
      <Card>
        <p>
          Vi är otroligt glada att ha{" "}
          <strong>{WEDDING.toastmasters[0].name}</strong> och{" "}
          <strong>{WEDDING.toastmasters[1].name}</strong> som toastmasters.
          <br />
          <br />
          De hjälper oss att hålla ihop hela dagen och kvällen – från tal och
          spex till allt som händer däremellan. Tveka inte att prata med dem om
          ni behöver hjälp eller har frågor.
        </p>

        <div className="toastmaster-contact">
          {WEDDING.toastmasters.map((tm, idx) => (
            <div
              key={tm.name}
              className={`toastmaster-card toastmaster-card--${idx + 1}`}
            >
              <div className="toastmaster-card__avatar">
                {tm.image && toastmasterImages[tm.name] ? (
                  <img
                    src={toastmasterImages[tm.name]}
                    alt={tm.name}
                    className="avatar-image"
                  />
                ) : (
                  <div className="avatar-placeholder">
                    <svg
                      viewBox="0 0 100 100"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <circle
                        cx="50"
                        cy="35"
                        r="20"
                        fill="currentColor"
                        opacity="0.3"
                      />
                      <ellipse
                        cx="50"
                        cy="75"
                        rx="28"
                        ry="25"
                        fill="currentColor"
                        opacity="0.3"
                      />
                    </svg>
                    <span className="avatar-initials">
                      {tm.name
                        .split(/\s+/)
                        .map((n) => n[0])
                        .join("")}
                    </span>
                  </div>
                )}
              </div>
              <div className="toastmaster-card__content">
                <h3 className="toastmaster-card__name">{tm.name}</h3>
                {tm.email && (
                  <a
                    href={`mailto:${tm.email}`}
                    className="toastmaster-card__email"
                  >
                    {tm.email}
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="info-grid" style={{ marginTop: "24px" }}>
          <div className="info-item">
            <p className="muted">
              {WEDDING.toastInfo.note}
              <br />
              <br />
              Sista dag för att anmäla tal eller underhållning:{" "}
              <strong>{WEDDING.toastInfo.deadline}</strong>
            </p>
          </div>
        </div>
      </Card>
    </section>
  );
}
