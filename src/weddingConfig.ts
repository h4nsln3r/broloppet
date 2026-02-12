// src/weddingConfig.ts
export const WEDDING = {
  couple: "Hannes & Julia",
  // Ändra datumtexten om ni vill ha annan formulering
  dateLong: "Lördag 29 augusti 2026",
  ceremony: {
    place: "Hossmo kyrka",
    time: "14:00",
  },
  party: {
    place: "Hossmo gård",
    time: "Efter vigseln",
    ends: "02:00",
  },
  osaDeadline: "5 Juli 2026",
  dressCode: "Sommarfin", // t.ex. Kavaj / Sommarfin / Valfritt
  childrenPolicy: "Vi önskar en barnfri dag/kväll ❤️",
  gifts: "Vi önskar oss gärna ett bidrag till vår bröllopsresa.",
  toastmasters: [
    {
      name: "Jenny Griffin",
      email: "jennygriffinlindahl@gmail.com",
      image: "JG.jpg",
    },
    {
      name: "Erik Tebrell",
      email: "erik.tebrell@gmail.com",
      image: "tebbe.jpg",
    },
  ],
  toastInfo: {
    deadline: "1 Augusti 2026",
    note: "Vill du hålla tal, spex eller göra något annat kul under kvällen? Hör gärna av dig i god tid så hjälper våra toastmasters till att pussla ihop programmet.",
  },
  transport: [
    "Buss: KLT:s linje 403 går från Kalmar C till Hossmo kyrka / Hossmo E22 på cirka 20 minuter. Se KLT-appen eller kalmarlanstrafik.se för aktuella tider.",
    "Bil: Det finns parkering vid både Hossmo kyrka och Hossmo gård – samåk gärna om ni kan.",
    "Taxi: Till exempel Sverigetaxi Kalmar 0480-44 44 44 eller Kalmar Taxi 0480-28 200 (förboka gärna).",
  ],
  maps: {
    // Tips: använd “Dela” i Google Maps och ta en länk till kyrkan + gården
    ceremonyLink: "https://maps.google.com/?q=Hossmo+kyrka",
    partyLink: "https://maps.google.com/?q=Hossmo+g%C3%A5rd",
    // Embed: i Google Maps -> Dela -> “Bädda in en karta” -> kopiera src-URL
    embedSrc:
      "https://www.google.com/maps?q=Hossmo%20G%C3%A5rd%2C%20Kalmar&output=embed",
  },
} as const;

export type WeddingConfig = typeof WEDDING;
