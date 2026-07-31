# AGENTS.md — snabbguide för AI-agenter

Läs detta först. Målet är att komma in i projektet på under en minut.

## Vad projektet är

Bröllopswebb för **Hannes & Julia** (29 aug 2026, Hossmo, Kalmar). En klient-side SPA i **React 19 + TypeScript + Vite 7**. UI-texten är på **svenska**. Ingen egen backend: OSA går till Google Forms, foton lagras i Supabase Storage.

## Kommandon

```bash
npm run dev      # dev-server (Vite, HMR)
npm run build    # tsc -b + vite build → dist/
npm run lint     # eslint .
npm run preview  # serva byggd version
```

Det finns **inga tester** (ingen Vitest/Jest/Playwright). Verifiera ändringar med `npm run lint` och `npm run build`.

## Var saker finns (kritiskt)

| Uppgift | Fil |
|---------|-----|
| **Ändra text/innehåll** (datum, platser, toastmasters, klädkod, transport, kartor) | `src/config/wedding.ts` — enda källan för innehåll |
| Routes | `src/App.tsx` |
| Entry | `src/main.tsx` (StrictMode + BrowserRouter), `index.html` |
| Hero-bilder | lägg JPG i `src/assets/background-images/` + registrera i `src/components/Hero/heroImages.ts` |
| OSA-formulär | `src/components/Form/RsvpForm.tsx` (Google Form-URL + entry-ID:n) |
| Supabase-klient | `src/lib/supabase.ts` (bucket: `wedding-photos`) |
| Temavariabler | `src/styles/_variables.scss` |
| Globala stilar | `src/styles/app.scss`, keyframes i `src/styles/_animations.scss` |

## Routes

- `/` → `pages/Wedding/WeddingPage.tsx` — sektioner: Hero, Welcome, Info (`#info`), Toast, RSVP (`#rsvp`)
- `/foto` → `pages/Foto/FotoPage.tsx` — uppladdning + galleri + helskärmsbildspel (kräver Supabase)
- `/qrcode` → `pages/QrCode/QRCodePage.tsx` — QR-kod som pekar på `/foto`

## Konventioner

- **Återanvändbara** komponenter i `src/components/`; **sidspecifika** sektioner i `src/pages/Wedding/sections/`. `components/index.ts` re-exporterar sektioner för rena imports i `WeddingPage`.
- Co-lokaliserad `.scss` per komponent. Styling är **SCSS med `@use`** — ingen Tailwind, ingen CSS-in-JS.
- **Inga path-alias** (`@/`). Använd relativa imports.
- Ingen global state (ingen Redux/Zustand/React Query) — bara React-hooks.
- Animation: Framer Motion + `react-scroll-parallax`.
- TS är `strict`. Håll typerna rena; `wedding.ts` är `as const`.

## Miljö

`.env` i roten:
```env
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
```
Saknas de fungerar `/` ändå; `/foto` visar konfigmeddelande. OBS: `.env` är i dagsläget inte i `.gitignore`.

## Roll & stil

Agera **senior frontend-utvecklare**: modern, ren och **tillgänglig** UI (semantisk HTML, fokusbara/keyboard-vänliga kontroller, `aria`-attribut vid behov, respektera `prefers-reduced-motion` för de många animationerna, tillräcklig kontrast). Behåll svenska i all UI-text.

## Tillgänglighet & prestanda (redan på plats)

- `prefers-reduced-motion` respekteras: Hero använder framer-motions `useReducedMotion` (stänger av hjärtan + parallax), `useScrollToMap` hoppar direkt, och `app.scss` nollar animationer/transitions.
- Globala `:focus-visible`-ringar i `app.scss`.
- `/foto` och `/qrcode` är lazy-laddade i `App.tsx` (Supabase/QR utanför huvudbunten). Vendor delas via `manualChunks` i `vite.config.ts`.
- Hero förladdar bara aktuell enhets bildlista (se `activeList`-effekten).
- Delningsbild: `public/og-image.jpg` + OG/Twitter-taggar i `index.html`.

## Kända lösa trådar

- Miljö: `.env` är avspårad i git men kan finnas kvar i git-historiken — rotera nycklarna om de läckt.
- Hero förladdar fortfarande hela enhetslistan (13–20 bilder) på mount; overkill men medvetet för crossfade-effekten.
- `og:image`/`twitter:image` är relativa – sätt absolut URL i produktion för alla delningsverktyg.
