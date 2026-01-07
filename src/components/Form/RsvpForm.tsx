import { useMemo, useState } from "react";

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

const GOOGLE_FORM_ACTION =
  "https://docs.google.com/forms/d/e/1FAIpQLSdsXv5hBd9mGLxadeNbuvAqMdFWqXiBglw1VhqsjXPn9p3Sdg/formResponse";

// Entry IDs från din prefilled-länk
const entryIds = {
  name: "entry.372731744",
  attending: "entry.388611717", // JA / NEJ
  allergies: "entry.2000885047",
  foodPrefs: "entry.207181512",
  email: "entry.1988040124",
} as const;

type Props = {
  osaDeadline: string;
};

export function RsvpForm({ osaDeadline }: Props) {
  const [form, setForm] = useState<RsvpFormValues>(initialForm);
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">(
    "idle"
  );

  const canSubmit = useMemo(() => {
    if (!form.name.trim()) return false;
    if (!form.attending) return false;
    return true;
  }, [form.name, form.attending]);

  function update<K extends keyof RsvpFormValues>(
    key: K,
    value: RsvpFormValues[K]
  ) {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (status !== "idle") setStatus("idle");
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;

    try {
      setStatus("sending");

      const fd = new FormData();
      fd.set(entryIds.name, form.name);
      fd.set(entryIds.email, form.email);

      // Exakt match mot Google Form
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
    <form className="form card" onSubmit={onSubmit}>
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

        <label>
          E-post (valfritt)
          <input
            type="email"
            value={form.email}
            onChange={(e) => update("email", e.target.value)}
            placeholder="för utskick med mer info"
          />
        </label>
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
        <button
          className="submit"
          disabled={!canSubmit || status === "sending"}
        >
          {status === "sending" ? "Skickar..." : "Skicka OSA"}
        </button>

        {status === "sent" && (
          <p className="ok">Tack! Ditt svar är registrerat 💛</p>
        )}

        {status === "error" && (
          <p className="err">Något gick fel. Testa igen.</p>
        )}
      </div>

      <p className="tiny muted">OSA senast: {osaDeadline}</p>
    </form>
  );
}
