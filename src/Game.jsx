import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Smile, Timer, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert } from "@/components/ui/alert";

const AnimalCharacter = ({ emotion, className }) => (
  <svg width="100" height="100" viewBox="0 0 100 100" className={className}>
    <circle cx="50" cy="50" r="40" fill="#FFD700" />
    <circle cx="35" cy="40" r="5" fill="#000" />
    <circle cx="65" cy="40" r="5" fill="#000" />
    {emotion === 'happy' && (
      <path d="M 30 60 Q 50 80 70 60" stroke="#000" strokeWidth="3" fill="none" />
    )}
    {emotion === 'neutral' && (
      <line x1="30" y1="60" x2="70" y2="60" stroke="#000" strokeWidth="3" />
    )}
    {emotion === 'excited' && (
      <path d="M 30 50 Q 50 80 70 50" stroke="#000" strokeWidth="3" fill="none" />
    )}
  </svg>
);

const CongratulationsMessage = ({ elapsedTime, onRestart }) => (
  <div className="fixed inset-0 flex items-center justify-center z-50 bg-gradient-to-r from-purple-500 via-pink-500 to-red-500 bg-opacity-80">
    <div className="text-center relative w-full h-full flex flex-col justify-center items-center">
      <AnimalCharacter emotion="excited" className="w-40 h-40 animate-bounce mb-4" />
      <h2 className="text-6xl font-bold mb-4 text-yellow-300 
                     transition-all duration-1000 transform scale-150 animate-pulse">
        おめでとう！
      </h2>
      <p className="text-4xl text-white 
                    transition-all duration-1000 transform scale-125 animate-bounce">
        やったね！！
      </p>
      <div className="mt-8 flex justify-center items-center space-x-2">
        <Timer className="w-6 h-6 text-white" />
        <p className="text-2xl text-white">クリアタイム: {elapsedTime}びょう</p>
      </div>
      <div className="mt-8 flex justify-center space-x-4">
        <AnimalCharacter emotion="happy" className="w-16 h-16 animate-spin" />
        <AnimalCharacter emotion="excited" className="w-16 h-16 animate-ping" />
        <AnimalCharacter emotion="happy" className="w-16 h-16 animate-spin" />
      </div>
      <Button 
        onClick={onRestart} 
        className="mt-12 bg-yellow-400 hover:bg-yellow-500 text-black font-bold py-3 px-6 rounded-full text-xl transition-all duration-300 transform hover:scale-105"
      >
        もういっかいする
      </Button>
    </div>
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {[...Array(50)].map((_, i) => (
        <div key={i} 
             className="absolute w-2 h-2 bg-white rounded-full animate-firework"
             style={{
               left: `${Math.random() * 100}vw`,
               top: `${Math.random() * 100}vh`,
               animationDelay: `${Math.random() * 2}s`
             }}
        />
      ))}
    </div>
  </div>
);

const Game = () => {
  const [balls, setBalls] = useState([]);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [audioContext, setAudioContext] = useState(null);
  const [characterEmotion, setCharacterEmotion] = useState('neutral');
  const [characterMessage, setCharacterMessage] = useState('がんばってね！');
  const [showCongratulations, setShowCongratulations] = useState(false);
  const [startTime, setStartTime] = useState(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [showWarning, setShowWarning] = useState(false);
  const clickedBalls = useRef(new Set());
  const lastClickTime = useRef({});

  const colors = ['red', 'blue', 'green', 'yellow', 'purple', 'orange', 'pink', 'cyan'];

  const getRandomColor = () => colors[Math.floor(Math.random() * colors.length)];

  const handleContextMenu = useCallback((e) => {
    e.preventDefault();
    setShowWarning(true);
    setTimeout(() => {
      setShowWarning(false);
    }, 1000);
  }, []);

  const initializeGame = useCallback(() => {
    const newBalls = Array.from({ length: 10 }, (_, index) => ({
      id: index,
      x: Math.random() * 80 + 10,
      y: Math.random() * 70 + 10,
      color: getRandomColor(),
      status: 'active'
    }));
    setBalls(newBalls);
    setScore(0);
    setGameOver(false);
    setCharacterEmotion('neutral');
    setCharacterMessage('がんばってね！');
    setShowCongratulations(false);
    setStartTime(Date.now());
    setElapsedTime(0);
    clickedBalls.current.clear();
    lastClickTime.current = {};
  }, []);

  useEffect(() => {
    initializeGame();
    setAudioContext(new (window.AudioContext || window.webkitAudioContext)());
  }, [initializeGame]);

  useEffect(() => {
    let timer;
    if (startTime && !gameOver) {
      timer = setInterval(() => {
        setElapsedTime(Math.floor((Date.now() - startTime) / 1000));
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [startTime, gameOver]);

  const playSound = useCallback((frequency, duration) => {
    if (audioContext) {
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);

      gainNode.gain.setValueAtTime(0.5, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.start();
      oscillator.stop(audioContext.currentTime + duration);
    }
  }, [audioContext]);

  const handleBallClick = useCallback((id) => {
    const currentTime = new Date().getTime();
    const lastClick = lastClickTime.current[id] || 0;
    
    if (currentTime - lastClick < 300) {  // Double click detected
      if (clickedBalls.current.has(id)) return;

      clickedBalls.current.add(id);
      playSound(440, 0.1);

      setBalls(prevBalls => 
        prevBalls.map(ball => 
          ball.id === id ? { ...ball, status: 'popping' } : ball
        )
      );

      setScore(prevScore => {
        const newScore = prevScore + 10;
        if (newScore % 50 === 0) {
          setCharacterEmotion('excited');
          setCharacterMessage('すごい！ がんばってるね！');
        } else if (newScore % 30 === 0) {
          setCharacterEmotion('happy');
          setCharacterMessage('そのちょうし！');
        }
        return newScore;
      });

      setTimeout(() => {
        setBalls(prevBalls => prevBalls.filter(ball => ball.id !== id));
      }, 500);
    } else {
      lastClickTime.current[id] = currentTime;
    }
  }, [playSound]);

  useEffect(() => {
    if (balls.length === 0 && score > 0) {
      setGameOver(true);
      setCharacterEmotion('excited');
      setCharacterMessage('やったね！ くりあだよ！');
      playSound(523.25, 0.5);
      setShowCongratulations(true);
    } else if (balls.length <= 3) {
      setCharacterEmotion('happy');
      setCharacterMessage('もうすこし！');
    }
  }, [balls, score, playSound]);

  return (
    <div className="w-full h-screen bg-blue-100 p-4 relative" onContextMenu={handleContextMenu}>
      <h1 className="text-2xl font-bold mb-4">カラフルぼーるわりゲーム (ダブルクリック版)</h1>
      <div className="text-6xl font-bold mb-6 text-center">てんすう: {score}</div>
      <div className="absolute top-4 right-4 flex items-center space-x-2">
        <Timer className="w-6 h-6" />
        <span className="text-xl font-bold">{elapsedTime}びょう</span>
      </div>
      <div className="w-full h-64 bg-white relative">
        {showWarning && (
          <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50">
            <Alert className="bg-yellow-100 border-yellow-400 text-yellow-800 px-6 py-4 rounded-lg shadow-lg animate-bounce">
              <AlertTriangle className="h-6 w-6 inline-block mr-2" />
              <span className="text-xl font-bold">みぎクリックしないでね</span>
            </Alert>
          </div>
        )}
        {balls.map(ball => (
          <div
            key={ball.id}
            className={`absolute w-12 h-12 rounded-full cursor-pointer transition-all duration-500 ${
              ball.status === 'active' ? `bg-${ball.color}-500` : 'bg-yellow-300 scale-150 opacity-0'
            }`}
            style={{ left: `${ball.x}%`, top: `${ball.y}%` }}
            onClick={() => handleBallClick(ball.id)}
          />
        ))}
      </div>
      <div className="absolute bottom-4 left-4 flex items-center">
        <AnimalCharacter emotion={characterEmotion} />
        <div className="ml-4 text-lg font-bold">{characterMessage}</div>
        <a
          href="https://mouselesson.manabi-time.com"
          className="fixed bottom-4 right-4"
        >
          <Button className="bg-gray-500 hover:bg-gray-600 text-white">
            もどる
          </Button>
        </a>
      </div>
      {showCongratulations && <CongratulationsMessage elapsedTime={elapsedTime} onRestart={initializeGame} />}
    </div>
  );
};

export default Game;