import { QRCodeSVG } from "qrcode.react";

export function SlideshowQr() {
  const fotoUrl = `${window.location.origin}/foto`;

  return (
    <div className="foto-slideshow__qr" aria-label="QR-kod till fotosidan">
      <div className="foto-slideshow__qr-code">
        <QRCodeSVG
          value={fotoUrl}
          size={160}
          level="M"
          bgColor="#ffffff"
          fgColor="#14110f"
          title="QR-kod till fotosidan"
        />
      </div>
      <p className="foto-slideshow__qr-caption">Skanna för foto</p>
    </div>
  );
}
