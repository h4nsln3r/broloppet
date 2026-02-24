import { Routes, Route } from "react-router-dom";
import { ParallaxProvider } from "react-scroll-parallax";

import "./styles/app.scss";
import { WeddingPage } from "./pages/Wedding/WeddingPage";
import { FotoPage } from "./pages/Foto/FotoPage";
import { QRCodePage } from "./pages/QrCode/QRCodePage";

export default function App() {
  return (
    <ParallaxProvider>
      <Routes>
        <Route path="/" element={<WeddingPage />} />
        <Route path="/foto" element={<FotoPage />} />
        <Route path="/qrcode" element={<QRCodePage />} />
      </Routes>
    </ParallaxProvider>
  );
}
//