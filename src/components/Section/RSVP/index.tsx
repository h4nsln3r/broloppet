import { WEDDING } from "../../../weddingConfig";
import { RsvpForm } from "../../Form/RsvpForm";
import { ParallaxBanner } from "react-scroll-parallax";
import rsvpBg from "../../../assets/hossmoka.jpg";

import "../section.scss";
import "./rsvp-section.scss";

export function RSVP() {
  return (
    <section className="section rsvpSection" id="rsvp">
      <h2>OSA / RSVP</h2>
      <p className="muted">
        Svara om du/ni kommer eller inte. Fyll gärna i allergier och
        matpreferenser.
      </p>

      <ParallaxBanner
        className="rsvpBanner"
        layers={[
          {
            image: rsvpBg,
            speed: -15,
          },
        ]}
      >
        <div className="rsvpBanner__overlay" aria-hidden="true" />
        <div className="rsvpBanner__content">
          <RsvpForm osaDeadline={WEDDING.osaDeadline} />
        </div>
      </ParallaxBanner>
    </section>
  );
}
