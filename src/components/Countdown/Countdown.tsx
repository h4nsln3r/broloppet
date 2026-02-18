import { useEffect, useState } from "react";
import { WEDDING } from "../../config";
import "./countdown.scss";

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

export function Countdown() {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  useEffect(() => {
    const calculateTimeLeft = () => {
      const targetDate = new Date(WEDDING.ceremonyDateISO).getTime();
      const now = new Date().getTime();
      const difference = targetDate - now;

      if (difference > 0) {
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60),
        });
      } else {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      }
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="countdown">
      <div className="countdown__unit">
        <div className="countdown__number">{timeLeft.days}</div>
        <div className="countdown__label">dagar</div>
      </div>
      <div className="countdown__unit">
        <div className="countdown__number">{timeLeft.hours}</div>
        <div className="countdown__label">timmar</div>
      </div>
      <div className="countdown__unit">
        <div className="countdown__number">{timeLeft.minutes}</div>
        <div className="countdown__label">minuter</div>
      </div>
      <div className="countdown__unit">
        <div className="countdown__number">{timeLeft.seconds}</div>
        <div className="countdown__label">sekunder</div>
      </div>
    </div>
  );
}
