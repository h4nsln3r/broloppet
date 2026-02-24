import { Link } from "react-router-dom";
import { QRCodeSVG } from "qrcode.react";
import "./QRCodePage.scss";

export function QRCodePage() {
  const fotoUrl = `${window.location.origin}/foto`;

  return (
    <div className="qrcode-page">
      <div className="qrcode-page__card">
        <h1 className="qrcode-page__title">Dela dina bröllopsfoton</h1>
        <p className="qrcode-page__subtitle">
          Skanna QR-koden med mobilen för att ladda upp och se foton
        </p>
        <div className="qrcode-page__qr">
          <QRCodeSVG value={fotoUrl} size={240} level="M" />
        </div>
        <Link to="/foto" className="qrcode-page__btn">
          Gå till fotosidan
        </Link>
      </div>
    </div>
  );
}
