import { WEDDING } from '../../../weddingConfig';
import { Card } from '../../Card';

export function ToastMasters() {
  return (
    <section className="section">
      <h2>Tal & underhållning</h2>
      <Card>
        <p>{WEDDING.toastmaster.name}</p>
        <p className="muted">{WEDDING.toastmaster.contact}</p>
        <p className="muted">{WEDDING.toastmaster.note}</p>
      </Card>
    </section>
  );
}
