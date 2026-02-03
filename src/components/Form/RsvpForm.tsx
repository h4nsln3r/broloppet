import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { FiCheckCircle } from "react-icons/fi";

export type RsvpFormValues = {
  name: string;
  email: string;
  attending: "yes" | "no" | "";
  allergies: string;
  foodPrefs: string;
};

const initialForm: RsvpFormValues = {
  name: "",
  email: "",
  attending: "",
  allergies: "",
  foodPrefs: "",
};

const enableGoogleForm = true;

const GOOGLE_FORM_ACTION =
  "https://docs.google.com/forms/d/e/1FAIpQLSdsXv5hBd9mGLxadeNbuvAqMdFWqXiBglw1VhqsjXPn9p3Sdg/formResponse";

const entryIds = {
  name: "entry.372731744",
  attending: "entry.388611717", // "JA" / "NEJ"
  allergies: "entry.2000885047",
  foodPrefs: "entry.207181512",
  email: "entry.1988040124",
} as const;

type Props = {
  osaDeadline: string;
};

const curtain = {
  hidden: {
    opacity: 0,
    scaleY: 0.85,
    y: -10,
    clipPath: "inset(0 0 100% 0 round 16px)",
  },
  show: {
    opacity: 1,
    scaleY: 1,
    y: 0,
    clipPath: "inset(0 0 0% 0 round 16px)",
    transition: {
      duration: 0.55,
      ease: [0.22, 1, 0.36, 1],
    },
  },
  exit: {
    opacity: 0,
    scaleY: 0.9,
    y: -12,
    clipPath: "inset(0 0 100% 0 round 16px)",
    transition: {
      duration: 0.45,
      ease: [0.22, 1, 0.36, 1],
    },
  },
} as const;

const confirmCard = {
  hidden: { opacity: 0, y: 14, filter: "blur(6px)" },
  show: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] },
  },
  exit: {
    opacity: 0,
    y: 8,
    filter: "blur(6px)",
    transition: { duration: 0.25 },
  },
} as const;

const popIcon = {
  hidden: { scale: 0.75, rotate: -8, opacity: 0 },
  show: {
    scale: 1,
    rotate: 0,
    opacity: 1,
    transition: { type: "spring", stiffness: 320, damping: 18 },
  },
} as const;

function ConfettiDots() {
  // Små “prickar” som flyger upp och ut (utan extra libs)
  const dots = Array.from({ length: 10 }, (_, i) => i);
  return (
    <div
      aria-hidden
      style={{
        position: "absolute",
        inset: 0,
        pointerEvents: "none",
        overflow: "hidden",
        borderRadius: 16,
      }}
    >
      {dots.map((i) => (
        <motion.span
          key={i}
          initial={{ opacity: 0, x: 0, y: 0, scale: 0.8 }}
          animate={{
            opacity: [0, 1, 0],
            x: [0, (i % 2 === 0 ? 1 : -1) * (40 + i * 6)],
            y: [0, -(40 + i * 10)],
            scale: [0.8, 1, 0.9],
          }}
          transition={{
            duration: 0.9,
            ease: [0.22, 1, 0.36, 1],
            delay: 0.08 + i * 0.03,
          }}
          style={{
            position: "absolute",
            left: "50%",
            top: "58%",
            width: 7,
            height: 7,
            borderRadius: 999,
            background: "currentColor",
            opacity: 0.8,
            transform: `translate(-50%, -50%)`,
          }}
        />
      ))}
    </div>
  );
}

export function RsvpForm({ osaDeadline }: Props) {
  const [form, setForm] = useState<RsvpFormValues>(initialForm);
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">(
    "idle",
  );

  const canSubmit = useMemo(() => {
    if (!form.name.trim()) return false;
    if (!form.attending) return false;
    return true;
  }, [form.name, form.attending]);

  function update<K extends keyof RsvpFormValues>(
    key: K,
    value: RsvpFormValues[K],
  ) {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (status !== "idle") setStatus("idle");
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;

    // demo-läge om du skulle vilja toggla i framtiden
    if (!enableGoogleForm) {
      setStatus("sent");
      setForm(initialForm);
      return;
    }

    try {
      setStatus("sending");

      const fd = new FormData();
      fd.set(entryIds.name, form.name);
      fd.set(entryIds.email, form.email);
      fd.set(entryIds.attending, form.attending === "yes" ? "JA" : "NEJ");
      fd.set(entryIds.allergies, form.allergies);
      fd.set(entryIds.foodPrefs, form.foodPrefs);

      await fetch(GOOGLE_FORM_ACTION, {
        method: "POST",
        body: fd,
        mode: "no-cors",
      });

      setStatus("sent");
      setForm(initialForm);
    } catch {
      setStatus("error");
    }
  }

  return (
    <div className="rsvp">
      <AnimatePresence mode="wait">
        {status !== "sent" ? (
          <motion.form
            key="form"
            className="form card"
            onSubmit={onSubmit}
            variants={curtain}
            initial="hidden"
            animate="show"
            exit="exit"
            style={{ transformOrigin: "top" }}
          >
            <div className="row">
              <label>
                Namn
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => update("name", e.target.value)}
                  required
                />
              </label>

              {/* <label>
                E-post (valfritt)
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => update("email", e.target.value)}
                  placeholder="för utskick med mer info"
                />
              </label> */}
            </div>

            <label>
              Kommer du?
              <div className="segmented">
                <button
                  type="button"
                  className={form.attending === "yes" ? "active" : ""}
                  onClick={() => update("attending", "yes")}
                >
                  Ja
                </button>
                <button
                  type="button"
                  className={form.attending === "no" ? "active" : ""}
                  onClick={() => update("attending", "no")}
                >
                  Nej
                </button>
              </div>
            </label>

            <label>
              Allergier
              <textarea
                value={form.allergies}
                onChange={(e) => update("allergies", e.target.value)}
                placeholder="Gluten, laktos, nötter osv."
                rows={2}
              />
            </label>

            <label>
              Önskemål kring mat (valfritt)
              <textarea
                value={form.foodPrefs}
                onChange={(e) => update("foodPrefs", e.target.value)}
                placeholder="Vegetariskt, inga skaldjur, osv."
                rows={2}
              />
            </label>

            <div className="actions">
              <motion.button
                className="submit"
                disabled={!canSubmit || status === "sending"}
                whileTap={{ scale: 0.98 }}
                whileHover={status !== "sending" ? { y: -1 } : undefined}
              >
                {status === "sending" ? "Skickar..." : "Skicka OSA"}
              </motion.button>

              <AnimatePresence>
                {status === "error" && (
                  <motion.p
                    key="err"
                    className="err"
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 4 }}
                    transition={{ duration: 0.2 }}
                  >
                    Något gick fel. Testa igen.
                  </motion.p>
                )}
              </AnimatePresence>
            </div>

            <p className="tiny muted">OSA senast: {osaDeadline}</p>
          </motion.form>
        ) : (
          <motion.div
            key="confirm"
            className="card rsvp-confirm"
            variants={confirmCard}
            initial="hidden"
            animate="show"
            exit="exit"
            style={{ position: "relative" }}
          >
            <ConfettiDots />

            <motion.div
              variants={popIcon}
              initial="hidden"
              animate="show"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 10,
                marginBottom: 8,
              }}
            >
              <FiCheckCircle size={28} />
              <strong style={{ fontSize: "1.05rem" }}>
                Tack för ditt svar! 💛
              </strong>
            </motion.div>

            <br />

            <motion.button
              type="button"
              className="submit"
              style={{ marginTop: 12 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setStatus("idle")}
            >
              Skicka ett till svar?
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
