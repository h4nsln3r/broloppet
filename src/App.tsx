import './styles/app.scss';
import { Hero } from './components/Hero/Hero';
import { RsvpForm } from './components/Form/RsvpForm';
import { WEDDING } from './weddingConfig';
import { Information } from './components/Section/Info';
import { ToastMasters } from './components/Section/Toast';
import { RSVP } from './components/Section/RSVP';

export default function App() {
  return (
    <div className="page">
      <Hero wedding={WEDDING} />

      <main className="content">
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
