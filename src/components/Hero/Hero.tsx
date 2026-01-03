import { Parallax } from 'react-scroll-parallax';
import heroImage from '../../assets/håj.jpg';
import type { WeddingConfig } from '../../weddingConfig';
import './hero.scss';

type HeroProps = {
  wedding: WeddingConfig;
};

export function Hero({ wedding }: HeroProps) {
  return (
    <header className="hero">
      <Parallax speed={-50} className="hero__parallax" aria-hidden="true">
        <div className="hero__bg" style={{ backgroundImage: `url('${heroImage}')` }} />
      </Parallax>

      <div className="hero__fade" aria-hidden="true" />

      <div className="hero__header">
        <h1>{wedding.couple.split(' & ')[0]}</h1>
        <h1>&</h1>
        <h1>{wedding.couple.split(' & ')[1]}</h1>
        <br />
        <p className="lead">{wedding.dateLong}</p>
      </div>
    </header>
  );
}
