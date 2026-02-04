import "./styles/app.scss";
import { Hero } from "./components/Hero/Hero";
import { WEDDING } from "./weddingConfig";
import { Information } from "./components/Section/Info";
import { ToastMasters } from "./components/Section/Toast";
import { RSVP } from "./components/Section/RSVP";
import { Countdown } from "./components/Countdown/Countdown";
import heartMark from "./assets/icons/heart-mark.svg";

export default function App() {
  return (
    <div className="page">
      <Hero wedding={WEDDING} />

      <main className="content">
        <div className="welcomeBlock">
          <h1 className="welcome">Välkommen till vårt bröllop!</h1>
          <img className="welcomeBlock__heart" src={heartMark} alt="<3" />
          <p className="welcomeBlock__intro muted">
            Vi skulle bli så glada om ni vill fira dagen med oss. Här hittar ni
            tider, plats, toastmasters och OSA – allt du behöver inför en fin
            dag tillsammans.
          </p>
          <Countdown />
          <hr />
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
