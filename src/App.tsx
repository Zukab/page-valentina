import { Heart } from 'lucide-react';
import Countdown from './components/Countdown';
import NotesBoard from './components/NotesBoard';

function App() {
  const hearts = Array.from({ length: 30 }, (_, i) => ({
    id: i,
    left: Math.random() * 100,
    delay: Math.random() * 8,
    duration: 8 + Math.random() * 6,
    size: 40 + Math.random() * 80,
  }));

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-rose-100 via-pink-50 to-amber-50">
      {hearts.map((heart) => (
        <div
          key={heart.id}
          className="absolute pointer-events-none opacity-40 animate-float"
          style={{
            left: `${heart.left}%`,
            animationDelay: `${heart.delay}s`,
            animationDuration: `${heart.duration}s`,
            bottom: '-100px',
          }}
        >
          <Heart
            size={heart.size}
            className="text-rose-400 fill-rose-400"
            style={{
              filter: 'drop-shadow(0 0 8px rgba(244, 63, 94, 0.4))',
            }}
          />
        </div>
      ))}

      <div className="container mx-auto px-4 py-12 min-h-screen flex flex-col items-center justify-center">
        <div className="max-w-2xl w-full">
          <Countdown />
        </div>
      </div>

      <NotesBoard />
    </div>
  );
}

export default App;
