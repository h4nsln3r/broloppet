/**
 * Hero-bakgrundsbilder. Desktop och mobil har olika listor för bästa crop/upplevelse.
 */
import viet from "../../assets/background-images/viet.jpg";
import frieri from "../../assets/background-images/frieri.jpg";
import puss from "../../assets/background-images/puss.jpg";
import bild1 from "../../assets/background-images/bild1.jpg";
import bild2 from "../../assets/background-images/bild2.jpg";
import bild3 from "../../assets/background-images/bild3.jpg";
import bild4 from "../../assets/background-images/bild4.jpg";
import bild5 from "../../assets/background-images/bild5.jpg";
import hj1 from "../../assets/background-images/hj1.jpg";
import hj2 from "../../assets/background-images/hj2.jpg";
import hj3 from "../../assets/background-images/hj3.jpg";
import hj4 from "../../assets/background-images/hj4.jpg";
import hj5 from "../../assets/background-images/hj5.jpg";
import hj6 from "../../assets/background-images/hj6.jpg";
import hj7 from "../../assets/background-images/hj7.jpg";
import hj8 from "../../assets/background-images/hj8.jpg";
import hj9 from "../../assets/background-images/hj9.jpg";
import hl10 from "../../assets/background-images/hl10.jpg";
import hj13 from "../../assets/background-images/hj13.jpg";
import hj15 from "../../assets/background-images/hj15.jpg";
import hj16 from "../../assets/background-images/hj16.jpg";
import hj17 from "../../assets/background-images/hj17.jpg";

export const DESKTOP_HERO_IMAGES = [
  viet,
  frieri,
  bild1,
  bild2,
  bild3,
  bild5,
  hj1,
  hj5,
  hj8,
  hj9,
  hl10,
  hj16,
  hj13,
];

export const MOBILE_HERO_IMAGES = [
  frieri,
  viet,
  puss,
  bild1,
  bild2,
  bild3,
  bild4,
  bild5,
  hj2,
  hj3,
  hj4,
  hj5,
  hj6,
  hj7,
  hj15,
  hj8,
  hj9,
  hl10,
  hj17,
  hj16,
];

/** Alla bilder som ska förladdas (union av desktop + mobile). */
export const ALL_HERO_IMAGES = [
  ...new Set([...DESKTOP_HERO_IMAGES, ...MOBILE_HERO_IMAGES]),
];
