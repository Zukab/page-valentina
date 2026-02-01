import { useEffect, useState } from 'react';

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

export default function Countdown() {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const targetDate = new Date('2026-02-18T00:00:00').getTime();

    const calculateTimeLeft = () => {
      const now = new Date().getTime();
      const difference = targetDate - now;

      if (difference > 0) {
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          minutes: Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)),
          seconds: Math.floor((difference % (1000 * 60)) / 1000),
        });
      } else {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      }
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(timer);
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <div className="relative z-50 text-center">
      <h1 className="text-5xl md:text-8xl font-bold mb-8 bg-gradient-to-r from-rose-600 via-pink-500 to-rose-600 bg-clip-text text-transparent animate-pulse">
        Valentina
      </h1>

      <p className="text-2xl md:text-4xl text-rose-600 font-light mb-12">
        Cumpleaños
      </p>

      <div className="grid grid-cols-4 gap-6 md:gap-10 mb-12">
        <div className="text-center">
          <div className="text-6xl md:text-8xl font-bold text-rose-600 drop-shadow-lg">
            {timeLeft.days}
          </div>
          <div className="text-lg md:text-2xl text-gray-600 mt-4 font-light">días</div>
        </div>

        <div className="text-center">
          <div className="text-6xl md:text-8xl font-bold text-pink-500 drop-shadow-lg">
            {timeLeft.hours}
          </div>
          <div className="text-lg md:text-2xl text-gray-600 mt-4 font-light">horas</div>
        </div>

        <div className="text-center">
          <div className="text-6xl md:text-8xl font-bold text-rose-500 drop-shadow-lg">
            {timeLeft.minutes}
          </div>
          <div className="text-lg md:text-2xl text-gray-600 mt-4 font-light">min</div>
        </div>

        <div className="text-center">
          <div className="text-6xl md:text-8xl font-bold text-amber-600 drop-shadow-lg">
            {timeLeft.seconds}
          </div>
          <div className="text-lg md:text-2xl text-gray-600 mt-4 font-light">seg</div>
        </div>
      </div>

      <div className="text-xl md:text-3xl font-light text-gray-700">
        18 de febrero, 2026
      </div>
    </div>
  );
}
