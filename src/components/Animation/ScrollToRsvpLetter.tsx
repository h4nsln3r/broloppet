import { motion } from "framer-motion";
import { FiMail } from "react-icons/fi";

type ScrollToRsvpLetterProps = {
  /** id på RSVP-sektionen, ex: "rsvp" */
  targetId: string;
  /** valfri label */
  label?: string;
};

export function ScrollToRsvpLetter({
  targetId,
  label = "OSA",
}: ScrollToRsvpLetterProps) {
  function scrollToTarget() {
    const el = document.getElementById(targetId);
    if (!el) return;

    el.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <motion.button
      type="button"
      className="hero__letter"
      aria-label={`Gå till ${label}`}
      onClick={scrollToTarget}
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.96 }}
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: 0.1 }}
    >
      <FiMail className="hero__letter--icon" aria-hidden="true" />
      <span className="hero__letter--text">{label}</span>
    </motion.button>
  );
}
