import { IoMicOutline, IoPeopleOutline, IoCalendarOutline } from "react-icons/io5";
import { WEDDING } from "../../../config";
import { Card } from "../../Card";
import { SectionTitle } from "../SectionTitle";
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
      <SectionTitle>Tal & underhållning</SectionTitle>
      <Card className="card--toast">
        <div className="toast-intro">
          <IoMicOutline className="toast-intro__icon" aria-hidden />
          <p>
            Vi är otroligt glada att ha{" "}
            <strong>{WEDDING.toastmasters[0].name}</strong> och{" "}
            <strong>{WEDDING.toastmasters[1].name}</strong> som toastmasters.
            <br />
            <br />
            De hjälper oss att hålla ihop hela dagen och kvällen – från tal och
            spex till allt som händer däremellan. Tveka inte att prata med dem
            om ni behöver hjälp eller har frågor.
          </p>
        </div>

        <h4 className="toast-contact__heading">
          <IoPeopleOutline className="toast-contact__icon" aria-hidden />
          Våra toastmasters
        </h4>
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

        <div className="toast-deadline">
          <h4 className="toast-deadline__title">
            <IoCalendarOutline className="toast-deadline__icon" aria-hidden />
            Anmälan
          </h4>
          <p className="toast-deadline__note muted">
            {WEDDING.toastInfo.note}
          </p>
          <p className="toast-deadline__date">
            Sista dag för att anmäla tal eller underhållning:{" "}
            <strong>{WEDDING.toastInfo.deadline}</strong>
          </p>
        </div>
      </Card>
    </section>
  );
}
