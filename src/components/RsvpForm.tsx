import { useMemo, useState } from 'react';

export type RsvpFormValues = {
  name: string;
  email: string;
  attending: 'yes' | 'no' | '';
  allergies: string;
  foodPrefs: string;
  speech: 'yes' | 'no' | '';
  speechDetails: string;
};

const initialForm: RsvpFormValues = {
  name: '',
  email: '',
  attending: '',
  allergies: '',
  foodPrefs: '',
  speech: '',
  speechDetails: '',
};

// sätt denna till true när Google Form är kopplat
const enableGoogleForm = false;

// TODO: byt mot din riktiga formAction-URL från Google Forms
const GOOGLE_FORM_ACTION = 'PASTE_FORM_RESPONSE_URL_HERE';

// TODO: fyll i dina riktiga entry-id:n
const entryIds = {
  name: 'entry.XXXXXXXXX',
  email: 'entry.XXXXXXXXX',
  attending: 'entry.XXXXXXXXX',
  allergies: 'entry.XXXXXXXXX',
  foodPrefs: 'entry.XXXXXXXXX',
  speech: 'entry.XXXXXXXXX',
  speechDetails: 'entry.XXXXXXXXX',
} as const;

type Props = {
  osaDeadline: string;
};

export function RsvpForm({ osaDeadline }: Props) {
  const [form, setForm] = useState<RsvpFormValues>(initialForm);
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');

  const canSubmit = useMemo(() => {
    if (!form.name.trim()) return false;
    if (!form.attending) return false;
    return true;
  }, [form.name, form.attending]);

  function update<K extends keyof RsvpFormValues>(key: K, value: RsvpFormValues[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (status !== 'idle') setStatus('idle');
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;

    if (!enableGoogleForm) {
      // bara demo-läge
      setStatus('sent');
      setForm(initialForm);
      return;
    }

    try {
      setStatus('sending');

      const fd = new FormData();
      fd.set(entryIds.name, form.name);
      fd.set(entryIds.email, form.email);
      fd.set(entryIds.attending, form.attending === 'yes' ? 'Ja' : 'Nej');
      fd.set(entryIds.allergies, form.allergies);
      fd.set(entryIds.foodPrefs, form.foodPrefs);
      fd.set(entryIds.speech, form.speech === 'yes' ? 'Ja' : 'Nej');
      fd.set(entryIds.speechDetails, form.speechDetails);

      await fetch(GOOGLE_FORM_ACTION, {
        method: 'POST',
        body: fd,
        mode: 'no-cors',
      });

      setStatus('sent');
      setForm(initialForm);
    } catch {
      setStatus('error');
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
            onChange={(e) => update('name', e.target.value)}
            required
          />
        </label>
        <label>
          E-post (valfritt)
          <input
            type="email"
            value={form.email}
            onChange={(e) => update('email', e.target.value)}
            placeholder="för utskick med mer info"
          />
        </label>
      </div>

      <label>
        Kommer du?
        <div className="segmented">
          <button
            type="button"
            className={form.attending === 'yes' ? 'active' : ''}
            onClick={() => update('attending', 'yes')}
          >
            Ja
          </button>
          <button
            type="button"
            className={form.attending === 'no' ? 'active' : ''}
            onClick={() => update('attending', 'no')}
          >
            Nej
          </button>
        </div>
      </label>

      <label>
        Allergier
        <textarea
          value={form.allergies}
          onChange={(e) => update('allergies', e.target.value)}
          placeholder="Gluten, laktos, nötter osv."
          rows={2}
        />
      </label>

      <label>
        Önskemål kring mat (valfritt)
        <textarea
          value={form.foodPrefs}
          onChange={(e) => update('foodPrefs', e.target.value)}
          placeholder="Vegetariskt, inga skaldjur, osv."
          rows={2}
        />
      </label>

      <label>
        Vill du hålla tal / göra något på festen?
        <div className="segmented">
          <button
            type="button"
            className={form.speech === 'yes' ? 'active' : ''}
            onClick={() => update('speech', 'yes')}
          >
            Ja gärna
          </button>
          <button
            type="button"
            className={form.speech === 'no' ? 'active' : ''}
            onClick={() => update('speech', 'no')}
          >
            Inte denna gång
          </button>
        </div>
      </label>

      {form.speech === 'yes' && (
        <label>
          Skriv kort vad du tänker (valfritt)
          <textarea
            value={form.speechDetails}
            onChange={(e) => update('speechDetails', e.target.value)}
            placeholder="Tal, sång, spex – ungefär vad?"
            rows={3}
          />
        </label>
      )}

      <div className="actions">
        <button className="submit" disabled={!canSubmit || status === 'sending'}>
          {status === 'sending' ? 'Skickar...' : 'Skicka OSA'}
        </button>

        {status === 'sent' && (
          <p className="ok">
            Tack! Ditt svar är registrerat 💛
            <br />
            <span className="muted tiny">
              (Just nu sparas det inte externt förrän Google Form är kopplat.)
            </span>
          </p>
        )}

        {status === 'error' && <p className="err">Något gick fel. Testa igen.</p>}
      </div>

      <p className="tiny muted">OSA senast: {osaDeadline}</p>
    </form>
  );
}
