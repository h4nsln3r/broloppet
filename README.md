# Bröllopet — Hannes & Julia

Personlig bröllopswebb för **Hannes & Julia**, som gifter sig **lördag 29 augusti 2026** i Hossmo kyrka med efterföljande fest på Hossmo gård utanför Kalmar.

Sidan är en enkel, snabb och tillgänglig single-page-app (SPA) byggd med **React + TypeScript + Vite**. Gästerna kan läsa all information om dagen, OSA:a via ett formulär och dela bilder från bröllopet.

---

## Innehåll

- [Snabbstart](#snabbstart)
- [Sidor & routes](#sidor--routes)
- [Projektstruktur](#projektstruktur)
- [Ändra innehållet på sidan](#ändra-innehållet-på-sidan)
- [Teknik](#teknik)
- [Styling & tema](#styling--tema)
- [Fototjänsten (Supabase)](#fototjänsten-supabase)
- [OSA-formulär (Google Forms)](#osa-formulär-google-forms)
- [Scripts](#scripts)
- [Miljövariabler](#miljövariabler)
- [Deploy](#deploy)

---

## Snabbstart

```bash
npm install
npm run dev
```

Dev-servern startar med hot reload (Vite). Öppna adressen som skrivs ut i terminalen (oftast `http://localhost:5173`).

> Huvudsidan (`/`) fungerar utan konfiguration. För fotosidan (`/foto`) behövs Supabase-nycklar i `.env` — se [Miljövariabler](#miljövariabler).

---

## Sidor & routes

Routing sköts av React Router i `src/App.tsx`. Tre routes finns:

| URL | Sida | Fil | Beskrivning |
|-----|------|-----|-------------|
| `/` | **Bröllopssidan** | `src/pages/Wedding/WeddingPage.tsx` | Inbjudan med all information, countdown, toastmasters och OSA. |
| `/foto` | **Fotosidan** | `src/pages/Foto/FotoPage.tsx` | Gäster laddar upp bilder, bläddrar i galleri och kör bildspel i helskärm. |
| `/qrcode` | **QR-kod** | `src/pages/QrCode/QRCodePage.tsx` | Visar en QR-kod som pekar på `/foto` — bra att skriva ut och ställa på borden. |

### Sektioner på huvudsidan (`/`)

Huvudsidan scrollas och har ankarlänkar (inte egna routes):

| Ankare | Sektion | Innehåll |
|--------|---------|----------|
| (toppen) | **Hero** | Parnamn, datum, roterande bakforgrundsbilder med parallax och studsande hjärtan. |
| — | **Välkommen** | Introtext + live-countdown till vigseln. |
| `#info` | **Information** | Schema, Google Maps-karta, transport, klädkod, barnpolicy, present/Swish, hotelltips. |
| — | **Toastmasters** | Kontaktuppgifter till toastmasters och info om att anmäla tal. |
| `#rsvp` | **OSA** | Parallax-banner + OSA-formulär. |

> Fotosidan och QR-sidan är verktygssidor för själva eventet och länkas inte från huvudsidan.

---

## Projektstruktur

```
brollopet/
├── index.html                 # Entry-HTML, Google Fonts, sidtitel
├── vite.config.ts             # Vite-konfiguration
├── vercel.json                # SPA-rewrites för Vercel
├── public/
│   └── favicon.svg
└── src/
    ├── main.tsx               # React-bootstrap (StrictMode + BrowserRouter)
    ├── App.tsx                # Routes + ParallaxProvider
    │
    ├── config/
    │   └── wedding.ts         # ★ All bröllopstext (datum, platser, toastmasters …)
    │
    ├── lib/
    │   └── supabase.ts        # Supabase-klient + bucket-namn
    │
    ├── hooks/                 # Egna hooks (t.ex. useScrollToMap)
    ├── utils/                 # Små hjälpfunktioner (url.ts)
    │
    ├── styles/
    │   ├── app.scss           # Globala stilar
    │   ├── _variables.scss    # Färger, typsnitt, skuggor, radier
    │   └── _animations.scss   # Keyframes
    │
    ├── assets/                # Bilder (bakgrunder, toastmasters, ikoner)
    │
    ├── components/            # Återanvändbara komponenter
    │   ├── Hero/              # Hero med parallax + heroImages.ts
    │   ├── Countdown/
    │   ├── Card/
    │   ├── Footer/
    │   ├── Form/RsvpForm.tsx  # OSA-formulär
    │   ├── Section/SectionTitle.tsx
    │   └── Animation/         # BouncyHeart, ScrollToRsvpLetter
    │
    └── pages/
        ├── Wedding/
        │   ├── WeddingPage.tsx
        │   └── sections/      # Welcome, Info, Toast, RSVP
        ├── Foto/FotoPage.tsx
        └── QrCode/QRCodePage.tsx
```

**Mönster:** Återanvändbara byggstenar ligger i `src/components/`. Sidspecifika sektioner ligger i `src/pages/Wedding/sections/`. Varje komponent har oftast en egen `.scss`-fil bredvid sig. **Allt textinnehåll är centraliserat i `src/config/wedding.ts`.**

---

## Ändra innehållet på sidan

Det mesta ändras på ett enda ställe:

| Vad du vill ändra | Var |
|-------------------|-----|
| Namn, datum, tider, platser, klädkod, OSA-datum, presenttext, toastmasters, transport, kartlänkar | `src/config/wedding.ts` |
| Hero-bilder | Lägg JPG i `src/assets/background-images/` och registrera i `src/components/Hero/heroImages.ts` |
| Toastmaster-foton | Lägg bild i `src/assets/toast/` och ange filnamnet i `wedding.ts` |
| OSA-formulärets fält | `src/components/Form/RsvpForm.tsx` (Google Form-URL + fält-ID:n) |

---

## Teknik

| Lager | Val |
|-------|-----|
| Språk | TypeScript 5.9 (`strict`) |
| UI | React 19 |
| Byggverktyg | Vite 7 |
| Routing | React Router DOM 7 |
| Styling | Sass/SCSS |
| Animation | Framer Motion, react-scroll-parallax |
| Ikoner | react-icons |
| Backend-tjänster | Supabase Storage (foton), Google Forms (OSA) |
| QR-koder | qrcode.react |
| Lint | ESLint 9 (flat config) + typescript-eslint |
| Hosting | Vercel |

Det finns **ingen egen backend** och ingen global state-hantering — komponenterna använder vanlig React-state (`useState`/`useEffect`).

---

## Styling & tema

- SCSS med partials (`@use`). Ingen Tailwind eller CSS-in-JS.
- Temavariabler i `src/styles/_variables.scss`: varm palett (`#faf8f5` bakgrund, `#2c2520` text, `#9a8f82` accent), glassmorphism-tokens och en skuggskala.
- Typsnitt laddas från Google Fonts i `index.html`: Cormorant Garamond (rubriker), Parisienne (romantisk accent), DM Sans (brödtext).
- CSS-variabler exponeras i `:root` via `app.scss` (`--bg`, `--text`, `--accent` m.fl.).

---

## Tillgänglighet & prestanda

- **Reduced motion:** respekterar `prefers-reduced-motion` – studsande hjärtan och parallax stängs av, och scroll sker utan animation för användare som valt det i sitt OS.
- **Fokus:** tydliga `:focus-visible`-ringar för tangentbordsnavigering.
- **Code-splitting:** `/foto` och `/qrcode` laddas först vid behov (lazy), så huvudsidan slipper dra in Supabase- och QR-bibliotek. Vendor-kod delas i separata chunkar (`react-vendor`, `motion`).
- **Bilder:** hero förladdar bara bilderna för aktuell enhet (mobil/desktop). Tunga foton är komprimerade.
- **Delning (SEO/OG):** meta-, Open Graph- och Twitter-taggar finns i `index.html`. Delningsbilden ligger i `public/og-image.jpg` (1200×630). Byt gärna `og:image`/`twitter:image` till en **absolut** URL i produktion för bäst resultat i alla delningsverktyg.

## Fototjänsten (Supabase)

`/foto` använder Supabase Storage för att lista och ladda upp bilder.

1. Skapa en Storage-bucket med namnet **`wedding-photos`** (se `src/lib/supabase.ts`).
2. Sätt policys så att uppladdning och läsning fungerar (publik läsning för galleriet).
3. Lägg in nycklarna i `.env` (se nedan).

Om Supabase-nycklarna saknas fungerar huvudsidan ändå — fotosidan visar då ett konfigurationsmeddelande.

---

## OSA-formulär (Google Forms)

OSA-formuläret POST:ar till ett Google Formulär (`mode: "no-cors"`). URL och fält-ID:n ligger i `src/components/Form/RsvpForm.tsx`. Flaggan `enableGoogleForm` styr om det skickas på riktigt eller bara simuleras lokalt (bra vid utveckling).

---

## Scripts

| Kommando | Gör |
|----------|-----|
| `npm run dev` | Startar dev-server med HMR |
| `npm run build` | Typkollar (`tsc -b`) och bygger produktion till `dist/` |
| `npm run preview` | Serverar en byggd version lokalt |
| `npm run lint` | Kör ESLint på hela projektet |

---

## Miljövariabler

Skapa en `.env` i projektroten:

```env
VITE_SUPABASE_URL=din-supabase-url
VITE_SUPABASE_ANON_KEY=din-supabase-anon-key
```

| Variabel | Används i | Krävs för |
|----------|-----------|-----------|
| `VITE_SUPABASE_URL` | `src/lib/supabase.ts` | `/foto` |
| `VITE_SUPABASE_ANON_KEY` | `src/lib/supabase.ts` | `/foto` |

> **Obs:** `.env` ligger idag inte i `.gitignore` (endast `*.local` ignoreras). Överväg att lägga till `.env` i `.gitignore` så att nycklar inte checkas in av misstag.

---

## Deploy

Projektet är förberett för **Vercel**. `vercel.json` innehåller en catch-all-rewrite till `index.html` så att klient-routingen fungerar i produktion. Sätt Supabase-miljövariablerna i Vercels dashboard för att fotosidan ska fungera.
