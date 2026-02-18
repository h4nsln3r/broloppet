import { IoMailOpenOutline } from "react-icons/io5";
import { WEDDING } from "../../../config";
import { RsvpForm } from "../../Form/RsvpForm";
import { ParallaxBanner } from "react-scroll-parallax";
import rsvpBg from "../../../assets/background-images/puss.jpg";
import { SectionTitle } from "../SectionTitle";

import "../section.scss";
import "./rsvp-section.scss";

export function RSVP() {
  return (
    <section className="section rsvpSection" id="rsvp">
      <SectionTitle>OSA</SectionTitle>
      <div className="rsvpSection__intro">
        <IoMailOpenOutline className="rsvpSection__icon" aria-hidden />
        <p className="muted">
          Svara om du/ni kommer eller inte. Fyll gärna i allergier och
          matpreferenser.
        </p>
      </div>

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
