// src/components/Section/Toast/index.tsx
import { WEDDING } from "../../../weddingConfig";
import { Card } from "../../Card";

export function ToastMasters() {
  return (
    <section className="section">
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

        <div className="info-grid">
          <div className="info-item">
            <h4>Kontakt</h4>
            <ul className="toastmaster-list">
              {WEDDING.toastmasters.map((tm) => (
                <li key={tm.name}>
                  <strong>{tm.name}</strong>
                  {tm.email && (
                    <>
                      <br />
                      <a href={`mailto:${tm.email}`}>{tm.email}</a>
                    </>
                  )}
                </li>
              ))}
            </ul>
          </div>

          <div className="info-item">
            <h4>Tider</h4>
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
