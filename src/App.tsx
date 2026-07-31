import { lazy, Suspense } from "react";
import { Routes, Route } from "react-router-dom";
import { ParallaxProvider } from "react-scroll-parallax";

import "./styles/app.scss";
import { WeddingPage } from "./pages/Wedding/WeddingPage";

// Verktygssidorna laddas först vid behov – de drar in Supabase/QR-bibliotek
// som inte behövs för huvudsidan.
const FotoPage = lazy(() =>
  import("./pages/Foto/FotoPage").then((m) => ({ default: m.FotoPage }))
);
const QRCodePage = lazy(() =>
  import("./pages/QrCode/QRCodePage").then((m) => ({ default: m.QRCodePage }))
);

export default function App() {
  return (
    <ParallaxProvider>
      <Suspense fallback={null}>
        <Routes>
          <Route path="/" element={<WeddingPage />} />
          <Route path="/foto" element={<FotoPage />} />
          <Route path="/qrcode" element={<QRCodePage />} />
        </Routes>
      </Suspense>
    </ParallaxProvider>
  );
}