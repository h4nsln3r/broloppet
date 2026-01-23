// src/components/Section/Toast/index.tsx
import { WEDDING } from '../../../weddingConfig';
import { Card } from '../../Card';

export function ToastMasters() {
  return (
    <section className="section">
      <h2>Tal & underhållning</h2>
      <Card>
        <p>
          Vi är otroligt glada att ha <strong>{WEDDING.toastmasters[0].name}</strong> och{' '}
          <strong>{WEDDING.toastmasters[1].name}</strong> som toastmasters under kvällen. De hjälper
          till att hålla ihop tal, spex och annan underhållning.
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
              Sista dag för att anmäla tal eller underhållning:{' '}
              <strong>{WEDDING.toastInfo.deadline}</strong>
            </p>
          </div>
        </div>
      </Card>
    </section>
  );
}
