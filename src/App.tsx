import "./styles/app.scss";
import { Hero } from "./components/Hero/Hero";
import { WEDDING } from "./weddingConfig";
import { Information } from "./components/Section/Info";
import { ToastMasters } from "./components/Section/Toast";
import { RSVP } from "./components/Section/RSVP";
import { Welcome } from "./components/Section/Welcome";

export default function App() {
  return (
    <div className="page">
      <Hero wedding={WEDDING} />

      <main className="content">
        <Welcome />
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
