import "./styles/app.scss";
import { Hero } from "./components/Hero/Hero";
import { WEDDING } from "./weddingConfig";
import { Information } from "./components/Section/Info";
import { ToastMasters } from "./components/Section/Toast";
import { RSVP } from "./components/Section/RSVP";

export default function App() {
  return (
    <div className="page">
      <Hero wedding={WEDDING} />

      <main className="content">
        <p>Välkommen till Hannes och Julias bröllop!</p>
        <Information />

        <ToastMasters />

        <RSVP />
      </main>

      <footer className="footer">
        <p className="muted">
          {WEDDING.couple} • {WEDDING.dateLong}
        </p>
      </footer>
    </div>
  );
}
