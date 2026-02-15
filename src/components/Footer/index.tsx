import { WEDDING } from "../../weddingConfig";
import "./footer.scss";

export function Footer() {
  return (
    <footer className="footer">
      <p className="muted">
        {WEDDING.couple} • {WEDDING.dateLong}
      </p>
    </footer>
  );
}
