import { Countdown } from "./../../Countdown/Countdown";
import heartMark from "./../../../assets/icons/heart-mark.svg";

export function Welcome() {
  return (
    <section className="welcome">
      <h1 className="welcome__title">Välkommen till vårt bröllop!</h1>
      <img className="welcome__heart" src={heartMark} alt="<3" />
      <p className="welcome__intro muted">
        Vi skulle bli så glada om ni vill fira dagen med oss. Här hittar ni
        tider, plats, toastmasters och OSA – allt du behöver inför en fin dag
        tillsammans.
      </p>
      <Countdown />
      <hr />
    </section>
  );
}
