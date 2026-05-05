import { useState, useEffect, useCallback } from 'react';
import { Clock, WarningCircle } from '@phosphor-icons/react';

const WIN_SCORE = 15;
const PENALTY_TIME = 1500;

export default function GameScreen({ p1Name, p2Name, gameDuration, generateMathQuestion, onGameOver }) {
  const [timer, setTimer] = useState(gameDuration);
  const [ropePos, setRopePos] = useState(0);
  
  const [p1Question, setP1Question] = useState(generateMathQuestion());
  const [p2Question, setP2Question] = useState(generateMathQuestion());
  
  const [p1Penalty, setP1Penalty] = useState(false);
  const [p2Penalty, setP2Penalty] = useState(false);

  // Audio refs (using state to hold audio objects so they aren't recreated, or just instantiate them here)
  const correctSound = new Audio('sounds/correct.mp3');
  const wrongSound = new Audio('sounds/wrong.mp3');

  // Timer Effect
  useEffect(() => {
    if (timer <= 0) {
      onGameOver(ropePos);
      return;
    }
    
    const interval = setInterval(() => {
      setTimer(t => t - 1);
    }, 1000);
    
    return () => clearInterval(interval);
  }, [timer, onGameOver, ropePos]);

  // Handle Answer
  const handleAnswer = useCallback((playerNum, choiceIndex) => {
    if (timer <= 0) return;

    if (playerNum === 1 && !p1Penalty) {
      const isCorrect = p1Question.choices[choiceIndex] === p1Question.answer;
      if (isCorrect) {
        correctSound.currentTime = 0;
        correctSound.play().catch(e => console.log('Audio play failed:', e));
        
        setRopePos(prev => {
          const next = prev + 1;
          if (next >= WIN_SCORE) setTimeout(() => onGameOver(next), 0);
          return next;
        });
        setP1Question(generateMathQuestion());
      } else {
        wrongSound.currentTime = 0;
        wrongSound.play().catch(e => console.log('Audio play failed:', e));
        
        setP1Penalty(true);
        setTimeout(() => setP1Penalty(false), PENALTY_TIME);
      }
    } else if (playerNum === 2 && !p2Penalty) {
      const isCorrect = p2Question.choices[choiceIndex] === p2Question.answer;
      if (isCorrect) {
        correctSound.currentTime = 0;
        correctSound.play().catch(e => console.log('Audio play failed:', e));
        
        setRopePos(prev => {
          const next = prev - 1;
          if (next <= -WIN_SCORE) setTimeout(() => onGameOver(next), 0);
          return next;
        });
        setP2Question(generateMathQuestion());
      } else {
        wrongSound.currentTime = 0;
        wrongSound.play().catch(e => console.log('Audio play failed:', e));
        
        setP2Penalty(true);
        setTimeout(() => setP2Penalty(false), PENALTY_TIME);
      }
    }
  }, [p1Question, p2Question, p1Penalty, p2Penalty, timer, generateMathQuestion, onGameOver, correctSound, wrongSound]);

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e) => {
      const key = e.key.toLowerCase();
      // P1: A, S, D
      if (key === 'a') handleAnswer(1, 0);
      if (key === 's') handleAnswer(1, 1);
      if (key === 'd') handleAnswer(1, 2);
      
      // P2: J, K, L
      if (key === 'j') handleAnswer(2, 0);
      if (key === 'k') handleAnswer(2, 1);
      if (key === 'l') handleAnswer(2, 2);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleAnswer]);

  // Rope Position Calculation
  const percent = (ropePos / WIN_SCORE) * 40;
  
  // Timer formatting
  const minutes = Math.floor(timer / 60);
  const seconds = timer % 60;
  const timerDisplay = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

  return (
    <div id="game-screen" className="screen">
      <div className="game-header">
        <div id="timer" className={`timer ${timer <= 10 ? 'alert' : ''}`}>
          <Clock weight="regular" /> <span id="timer-text">{timerDisplay}</span>
        </div>
      </div>

      <div className="tug-of-war-arena">
        <div className="ground"></div>
        <div className="center-line"></div>
        
        <div 
          className="rope-system" 
          id="rope-system"
          style={{ transform: `translateX(${percent}%)` }}
        >
          <div className="character p1-char">🏃‍♂️</div>
          <div className="rope"></div>
          <div className="knot"><div className="flag"></div></div>
          <div className="character p2-char">🏃‍♀️</div>
        </div>
      </div>
      
      <div className="score-indicator">
        <span className={`strength-label p1-label ${ropePos > 0 ? 'active' : ''}`}>Kekuatan {p1Name}</span>
        <span className={`strength-label p2-label ${ropePos < 0 ? 'active' : ''}`}>Kekuatan {p2Name}</span>
      </div>

      <div className="controls-area">
        {/* P1 Panel */}
        <div className={`player-panel p1-panel ${p1Penalty ? 'penalized' : ''}`}>
          {p1Penalty && (
            <div className="penalty-overlay">
              <WarningCircle weight="regular" className="penalty-icon" />
            </div>
          )}
          <h2>{p1Name}</h2>
          <div className="question-box">
            <span>{p1Question.text} = ?</span>
          </div>
          <div className="choices">
            {p1Question.choices.map((choice, idx) => (
              <button 
                key={idx} 
                className="choice-btn p1-btn" 
                onClick={() => handleAnswer(1, idx)}
                disabled={p1Penalty}
              >
                <span className="val">{choice}</span>
                <span className="key-hint">Tombol {['A', 'S', 'D'][idx]}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="vs-divider">VS</div>

        {/* P2 Panel */}
        <div className={`player-panel p2-panel ${p2Penalty ? 'penalized' : ''}`}>
          {p2Penalty && (
            <div className="penalty-overlay">
              <WarningCircle weight="regular" className="penalty-icon" />
            </div>
          )}
          <h2>{p2Name}</h2>
          <div className="question-box">
            <span>{p2Question.text} = ?</span>
          </div>
          <div className="choices">
            {p2Question.choices.map((choice, idx) => (
              <button 
                key={idx} 
                className="choice-btn p2-btn" 
                onClick={() => handleAnswer(2, idx)}
                disabled={p2Penalty}
              >
                <span className="val">{choice}</span>
                <span className="key-hint">Tombol {['J', 'K', 'L'][idx]}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
