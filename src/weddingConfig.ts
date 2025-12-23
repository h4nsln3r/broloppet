export const WEDDING = {
  couple: 'Hannes & Julia',
  // Ändra datumtexten om ni vill ha annan formulering
  dateLong: 'Fredag 29 augusti 2026',
  ceremony: {
    place: 'Hossmo kyrka',
    time: '15:00',
  },
  party: {
    place: 'Hossmo gård',
    time: 'Efter vigseln',
    ends: '02:00',
  },
  osaDeadline: '1 augusti 2026',
  dressCode: 'Sommarfin', // t.ex. Kavaj / Sommarfin / Valfritt
  childrenPolicy: 'Vi önskar en barnfri dag/kväll ❤️',
  gifts: 'Vi önskar oss gärna ett bidrag till vår bröllopsresa.',
  toastmaster: {
    name: 'Toastmaster/Toastmadame: (namn)',
    contact: '(telefon / mail)',
    note: 'Vill du hålla tal, spex eller uppträde? Kontakta toastmaster/toastmadame i god tid.',
  },
  transport: [
    'Kyrka: (tips om parkering/transport här)',
    'Hossmo gård: (vägbeskrivning/parkering här)',
    'Samåkning: (om ni vill lägga till)',
  ],
  maps: {
    // Tips: använd “Dela” i Google Maps och ta en länk till kyrkan + gården
    ceremonyLink: 'https://maps.google.com/?q=Hossmo+kyrka',
    partyLink: 'https://maps.google.com/?q=Hossmo+g%C3%A5rd',
    // Embed: i Google Maps -> Dela -> “Bädda in en karta” -> kopiera src-URL
    embedSrc: 'PASTE_GOOGLE_MAPS_EMBED_SRC_HERE',
  },
} as const;

export type WeddingConfig = typeof WEDDING;
