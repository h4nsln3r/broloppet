import "./styles/app.scss";
import { WEDDING } from "./config";
import {
  Hero,
  Welcome,
  Information,
  ToastMasters,
  RSVP,
  Footer,
} from "./components";

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
      <Footer />
    </div>
  );
}
