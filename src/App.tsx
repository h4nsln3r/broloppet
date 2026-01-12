import "./styles/app.scss";
import { Hero } from "./components/Hero/Hero";
import { WEDDING } from "./weddingConfig";
import { Information } from "./components/Section/Info";
import { ToastMasters } from "./components/Section/Toast";
import { RSVP } from "./components/Section/RSVP";
import heartMark from "./assets/heart-mark.svg";

export default function App() {
  return (
    <div className="page">
      <Hero wedding={WEDDING} />

      <main className="content">
        <div className="welcomeBlock">
          <h1 className="welcome">Välkommen till Hannes och Julias bröllop!</h1>
          <img className="welcomeBlock__heart" src={heartMark} alt="" />
          <p className="welcomeBlock__intro muted">
            Vi är så glada att du vill fira dagen med oss. Här hittar du tider,
            plats, toastmasters och OSA – allt du behöver inför en fin dag
            tillsammans.
          </p>
        </div>
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
