import { WEDDING } from '../../../weddingConfig';
import { RsvpForm } from '../../Form/RsvpForm';

export function RSVP() {
  return (
    <section className="section" id="rsvp">
      <h2>OSA / RSVP</h2>
      <p className="muted">
        Svara om du kommer eller inte. Fyll gärna i allergier och önskemål kring mat.
      </p>

      <RsvpForm osaDeadline={WEDDING.osaDeadline} />
    </section>
  );
}
