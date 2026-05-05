import { useState, useEffect, useCallback, useRef } from 'react';
import { Clock, WarningCircle } from '@phosphor-icons/react';
import playerBlueImg from '../assets/player-blue.png';
import playerRedImg from '../assets/player-red.png';

const WIN_SCORE = 15;
const PENALTY_TIME = 1500;

export default function GameScreen({ p1Name, p2Name, gameDuration, generateMathQuestion, onGameOver }) {
  const [timer, setTimer] = useState(gameDuration);
  const [ropePos, setRopePos] = useState(0);
  
  const [p1Question, setP1Question] = useState(generateMathQuestion());
  const [p2Question, setP2Question] = useState(generateMathQuestion());
  
  const [p1Penalty, setP1Penalty] = useState(false);
  const [p2Penalty, setP2Penalty] = useState(false);

  const [p1Flash, setP1Flash] = useState(null); // 'correct' | 'wrong' | null
  const [p2Flash, setP2Flash] = useState(null);
  
  // Audio refs
  const correctSoundRef = useRef(null);
  const wrongSoundRef = useRef(null);

  // Canvas & Game State Refs
  const canvasRef = useRef(null);
  const ropePosRef = useRef(0);
  const localGameOverRef = useRef(false); // Controls local animation state before unmounting
  const [isGameOverLocal, setIsGameOverLocal] = useState(false); // For hiding UI
  
  const animState = useRef({
    particles: [],
    p1PullTimer: 0,
    p2PullTimer: 0,
    width: 0,
    height: 0,
    groundY: 0,
    pullDist: 0,
    createDust: null,
    visualRopePos: 0
  });

  useEffect(() => {
    ropePosRef.current = ropePos;
  }, [ropePos]);

  useEffect(() => {
    correctSoundRef.current = new Audio('sounds/correct.mp3');
    wrongSoundRef.current = new Audio('sounds/wrong.mp3');
  }, []);

  // Timer Effect
  useEffect(() => {
    if (timer <= 0 && !localGameOverRef.current) {
      localGameOverRef.current = true;
      setTimeout(() => onGameOver(ropePosRef.current), 3000);
      return;
    }
    
    if (localGameOverRef.current) return;
    
    const interval = setInterval(() => {
      setTimer(t => t - 1);
    }, 1000);
    
    return () => clearInterval(interval);
  }, [timer, onGameOver]);

  // Handle Answer
  const handleAnswer = useCallback((playerNum, choiceIndex) => {
    if (timer <= 0 || localGameOverRef.current) return;

    if (playerNum === 1 && !p1Penalty) {
      const isCorrect = p1Question.choices[choiceIndex] === p1Question.answer;
      if (isCorrect) {
        if (correctSoundRef.current) {
          correctSoundRef.current.currentTime = 0;
          correctSoundRef.current.play().catch(() => {});
        }
        setP1Flash('correct');
        if (animState.current && animState.current.createDust) {
          animState.current.p1PullTimer = 8;
          animState.current.createDust(1);
        }
        setTimeout(() => setP1Flash(null), 400);
        
        setRopePos(prev => {
          const next = prev - 1;
          if (next <= -WIN_SCORE && !localGameOverRef.current) {
            localGameOverRef.current = true;
            setTimeout(() => onGameOver(next), 3000); // Wait 3 seconds to show animation
          }
          return next;
        });
        setP1Question(generateMathQuestion());
      } else {
        if (wrongSoundRef.current) {
          wrongSoundRef.current.currentTime = 0;
          wrongSoundRef.current.play().catch(() => {});
        }
        setP1Flash('wrong');
        setTimeout(() => setP1Flash(null), 400);
        
        setP1Penalty(true);
        setTimeout(() => setP1Penalty(false), PENALTY_TIME);
      }
    } else if (playerNum === 2 && !p2Penalty) {
      const isCorrect = p2Question.choices[choiceIndex] === p2Question.answer;
      if (isCorrect) {
        if (correctSoundRef.current) {
          correctSoundRef.current.currentTime = 0;
          correctSoundRef.current.play().catch(() => {});
        }
        setP2Flash('correct');
        if (animState.current && animState.current.createDust) {
          animState.current.p2PullTimer = 8;
          animState.current.createDust(2);
        }
        setTimeout(() => setP2Flash(null), 400);
        
        setRopePos(prev => {
          const next = prev + 1;
          if (next >= WIN_SCORE && !localGameOverRef.current) {
            localGameOverRef.current = true;
            setTimeout(() => onGameOver(next), 3000);
          }
          return next;
        });
        setP2Question(generateMathQuestion());
      } else {
        if (wrongSoundRef.current) {
          wrongSoundRef.current.currentTime = 0;
          wrongSoundRef.current.play().catch(() => {});
        }
        setP2Flash('wrong');
        setTimeout(() => setP2Flash(null), 400);
        
        setP2Penalty(true);
        setTimeout(() => setP2Penalty(false), PENALTY_TIME);
      }
    }
  }, [p1Question, p2Question, p1Penalty, p2Penalty, timer, generateMathQuestion, onGameOver]);

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e) => {
      const key = e.key.toLowerCase();
      if (key === 'a') handleAnswer(1, 0);
      if (key === 's') handleAnswer(1, 1);
      if (key === 'd') handleAnswer(1, 2);
      if (key === 'j') handleAnswer(2, 0);
      if (key === 'k') handleAnswer(2, 1);
      if (key === 'l') handleAnswer(2, 2);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleAnswer]);

  // Canvas render loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationFrameId;

    const resize = () => {
      const parent = canvas.parentElement;
      canvas.width = parent.clientWidth;
      canvas.height = parent.clientHeight;
      animState.current.width = canvas.width;
      animState.current.height = canvas.height;
      animState.current.groundY = canvas.height * 0.75;
      animState.current.pullDist = Math.min(canvas.width * 0.45, 450);
    };

    window.addEventListener('resize', resize);
    resize();

    const getPlayerX = (player, cRopePos) => {
      const { width, pullDist } = animState.current;
      if (player === 1) return width/2 - pullDist/2 + (cRopePos * pullDist/2);
      return width/2 + pullDist/2 + (cRopePos * pullDist/2);
    };

    animState.current.createDust = (player) => {
      const x = getPlayerX(player, animState.current.visualRopePos);
      const y = animState.current.groundY;
      for(let i=0; i<5; i++) {
        animState.current.particles.push({
            x: x + (Math.random()-0.5)*30,
            y: y,
            vx: (Math.random() - 0.5) * 6,
            vy: (Math.random() - 1) * 4 - 1,
            life: 1,
            color: '#cbd5e1',
            size: Math.random() * 5 + 2
        });
      }
    };

    const drawPlayer = (x, y, color, isLeft, pullActive, isFallen, isWinner) => {
        if (isWinner) {
            y += Math.sin(Date.now() / 80) * 15; // Bounce up and down
        }

        ctx.strokeStyle = color;
        ctx.lineWidth = 14; 
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        let dir = isLeft ? 1 : -1;

        if (isFallen) {
            ctx.beginPath();
            ctx.moveTo(x - dir*25, y - 5); 
            ctx.lineTo(x + dir*10, y - 5); 
            ctx.lineTo(x + dir*40, y - 5); 
            ctx.stroke();
            
            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.arc(x + dir*55, y, 18, 0, Math.PI*2);
            ctx.fill();
            
            // X Eyes for fallen
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(x + dir*55 - 4, y - 4);
            ctx.lineTo(x + dir*55 + 4, y + 4);
            ctx.moveTo(x + dir*55 + 4, y - 4);
            ctx.lineTo(x + dir*55 - 4, y + 4);
            ctx.stroke();
            
            let handX = x + dir*75;
            let handY = y - 5;
            ctx.strokeStyle = color;
            ctx.lineWidth = 14;
            ctx.beginPath();
            ctx.moveTo(x + dir*40, y - 5);
            ctx.lineTo(handX, handY);
            ctx.stroke();
            return { handX: handX, handY: handY };
        }

        let lean = pullActive ? 40 : 15;
        let headX = x - (dir * lean);
        let headY = y - 85;
        let handX = x + (dir * 30);
        let handY = y - 45;
        let pelvisX = x - (dir * (lean / 2));
        let pelvisY = y - 40;

        ctx.fillStyle = 'rgba(0,0,0,0.15)';
        ctx.beginPath();
        ctx.ellipse(x, y + 5, 25, 5, 0, 0, Math.PI*2);
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(x - (dir * 25), y);
        ctx.lineTo(pelvisX, pelvisY);
        ctx.stroke();
        
        ctx.beginPath();
        ctx.moveTo(x + (dir * 15), y);
        ctx.lineTo(pelvisX, pelvisY);
        ctx.stroke();
        
        ctx.beginPath();
        ctx.moveTo(pelvisX, pelvisY);
        ctx.lineTo(headX, headY + 22);
        ctx.stroke();

        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(headX, headY, 20, 0, Math.PI*2);
        ctx.fill();
        
        if (isWinner) {
            // Happy ^^ face
            ctx.strokeStyle = '#ffffff'; 
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(headX + dir*5, headY - 5); 
            ctx.lineTo(headX + dir*10, headY - 12); 
            ctx.lineTo(headX + dir*15, headY - 5);
            ctx.stroke();
        } else {
            // Normal dot eye
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(headX + dir*10, headY - 4, 6, 0, Math.PI*2);
            ctx.fill();
            
            ctx.fillStyle = '#0f172a';
            ctx.beginPath();
            ctx.arc(headX + dir*12, headY - 4, 3, 0, Math.PI*2);
            ctx.fill();
        }

        if (pullActive) {
            ctx.fillStyle = '#60A5FA';
            ctx.beginPath();
            ctx.arc(headX - dir*14, headY - 8, 4, 0, Math.PI*2);
            ctx.fill();
            ctx.beginPath();
            ctx.moveTo(headX - dir*14 - 4, headY - 8);
            ctx.lineTo(headX - dir*14 + 4, headY - 8);
            ctx.lineTo(headX - dir*14, headY - 14);
            ctx.fill();
        }

        ctx.beginPath();
        ctx.moveTo(headX, headY + 22);
        ctx.lineTo(handX - (dir * (pullActive ? 15 : 0)), handY);
        ctx.stroke();

        return { handX: handX - (dir * (pullActive ? 15 : 0)), handY: handY };
    };

    const render = () => {
      const { width, height, groundY, pullDist, particles } = animState.current;
      ctx.clearRect(0, 0, width, height);

      // Interpolate visual rope position for smooth dragging and game over sliding
      if (localGameOverRef.current) {
         if (ropePosRef.current < 0) {
             animState.current.visualRopePos -= 0.04; 
             if (animState.current.visualRopePos < -1.0) animState.current.visualRopePos = -1.0;
         } else if (ropePosRef.current > 0) {
             animState.current.visualRopePos += 0.04;
             if (animState.current.visualRopePos > 1.0) animState.current.visualRopePos = 1.0;
         }
      } else {
         animState.current.visualRopePos += ( (ropePosRef.current / WIN_SCORE) - animState.current.visualRopePos ) * 0.15;
      }
      const cRopePos = animState.current.visualRopePos;

      // Mud Pit
      ctx.fillStyle = '#4a3018'; 
      ctx.beginPath();
      ctx.ellipse(width/2, groundY + 5, pullDist * 0.35, 22, 0, 0, Math.PI*2);
      ctx.fill();
      ctx.fillStyle = '#5c4033';
      ctx.beginPath();
      ctx.ellipse(width/2, groundY + 5, pullDist * 0.25, 14, 0, 0, Math.PI*2);
      ctx.fill();

      // Center Line
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
      ctx.lineWidth = 4;
      ctx.setLineDash([12, 12]);
      ctx.beginPath();
      ctx.moveTo(width/2, groundY - 50);
      ctx.lineTo(width/2, groundY + 40);
      ctx.stroke();
      ctx.setLineDash([]);

      let p1X = getPlayerX(1, cRopePos);
      let p2X = getPlayerX(2, cRopePos);

      let p1Fallen = localGameOverRef.current && ropePosRef.current > 0 && cRopePos >= 0.95;
      let p2Fallen = localGameOverRef.current && ropePosRef.current < 0 && cRopePos <= -0.95;
      
      let p1Winner = localGameOverRef.current && ropePosRef.current < 0 && cRopePos <= -0.95;
      let p2Winner = localGameOverRef.current && ropePosRef.current > 0 && cRopePos >= 0.95;

      let p1Hands = drawPlayer(p1X, groundY, '#3B82F6', true, animState.current.p1PullTimer > 0, p1Fallen, p1Winner);
      let p2Hands = drawPlayer(p2X, groundY, '#EF4444', false, animState.current.p2PullTimer > 0, p2Fallen, p2Winner);

      // Rope Base
      ctx.strokeStyle = '#D2B48C';
      ctx.lineWidth = 10;
      ctx.beginPath();
      ctx.moveTo(p1Hands.handX - (p1Fallen ? 0 : 25), p1Hands.handY);
      ctx.lineTo(p1Hands.handX, p1Hands.handY);
      ctx.lineTo(p2Hands.handX, p2Hands.handY);
      ctx.lineTo(p2Hands.handX + (p2Fallen ? 0 : 25), p2Hands.handY);
      ctx.stroke();

      // Rope Texture
      let xDist = p2Hands.handX - p1Hands.handX;
      let yDist = p2Hands.handY - p1Hands.handY;
      let slope = xDist !== 0 ? yDist / xDist : 0;
      
      ctx.strokeStyle = '#8B4513';
      ctx.lineWidth = 3;
      ctx.beginPath();
      
      let startX = p1Hands.handX;
      let endX = p2Hands.handX;
      let offset = ((ropePosRef.current / WIN_SCORE) * 200) % 18; 
      if (offset < 0) offset += 18;

      for (let i = startX + offset; i < endX; i += 18) {
          let yOffset = (i - p1Hands.handX) * slope + p1Hands.handY;
          ctx.moveTo(i, yOffset - 5);
          ctx.lineTo(i + 8, yOffset + 5);
      }
      ctx.stroke();

      // Center Ribbon
      let ropeCenterX = (p1Hands.handX + p2Hands.handX) / 2;
      let ropeCenterY = (p1Hands.handY + p2Hands.handY) / 2;
      ctx.fillStyle = '#EF4444'; 
      ctx.beginPath();
      ctx.moveTo(ropeCenterX - 8, ropeCenterY - 12);
      ctx.lineTo(ropeCenterX + 8, ropeCenterY - 12);
      ctx.lineTo(ropeCenterX, ropeCenterY + 20);
      ctx.fill();
      
      ctx.fillStyle = '#B91C1C';
      ctx.beginPath();
      ctx.arc(ropeCenterX, ropeCenterY, 5, 0, Math.PI*2);
      ctx.fill();

      // Particles Update
      particles.forEach(p => {
          p.x += p.vx;
          p.y += p.vy;
          p.vy += 0.3; // gravity
          p.life -= 0.025; // fade rate
          if(p.life > 0) {
            ctx.fillStyle = p.color;
            ctx.globalAlpha = Math.max(0, p.life);
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI*2);
            ctx.fill();
          }
      });
      ctx.globalAlpha = 1.0;
      animState.current.particles = particles.filter(p => p.life > 0);

      animState.current.p1PullTimer = Math.max(0, animState.current.p1PullTimer - 1);
      animState.current.p2PullTimer = Math.max(0, animState.current.p2PullTimer - 1);

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  // UI Calculations
  const strengthPercent = Math.abs(ropePos) / WIN_SCORE * 100;
  const minutes = Math.floor(timer / 60);
  const seconds = timer % 60;
  const timerDisplay = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

  return (
    <div id="game-screen" className="screen">
      {/* Timer */}
      {!isGameOverLocal && (
        <div className="game-header">
          <div id="timer" className={`timer ${timer <= 10 ? 'alert' : ''}`}>
            <Clock weight="bold" size={28} /> <span id="timer-text">{timerDisplay}</span>
          </div>
        </div>
      )}

      {/* Tug of War Arena */}
      <div className={`tug-of-war-arena ${isGameOverLocal ? 'game-over-expanded' : ''}`} style={{ position: 'relative' }}>
        {/* Sky background with clouds */}
        <div className="arena-sky">
          <div className="cloud cloud-1"></div>
          <div className="cloud cloud-2"></div>
          <div className="cloud cloud-3"></div>
        </div>
        
        {/* Canvas overlay rendering characters and rope */}
        <canvas ref={canvasRef} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 10, pointerEvents: 'none' }}></canvas>

        {/* Ground */}
        <div className="ground">
          <div className="grass-line"></div>
        </div>
      </div>
      
      {/* Strength Bar */}
      {!isGameOverLocal && (
        <div className="strength-bar-container">
          <span className={`strength-name p1-name ${ropePos < 0 ? 'winning' : ''}`}>
            💪 {p1Name}
          </span>
          <div className="strength-bar">
            <div 
              className={`strength-fill ${ropePos < 0 ? 'p1-fill' : ropePos > 0 ? 'p2-fill' : ''}`}
              style={{ 
                width: `${strengthPercent}%`,
                marginLeft: ropePos > 0 ? '50%' : `${50 - strengthPercent}%`,
                marginRight: ropePos < 0 ? '50%' : 'auto'
              }}
            ></div>
            <div className="strength-center-mark"></div>
          </div>
          <span className={`strength-name p2-name ${ropePos > 0 ? 'winning' : ''}`}>
            {p2Name} 💪
          </span>
        </div>
      )}

      {/* Control Panels */}
      {!isGameOverLocal && (
        <div className="controls-area">
          {/* P1 Panel */}
          <div className={`player-panel p1-panel ${p1Penalty ? 'penalized' : ''} ${p1Flash === 'correct' ? 'flash-correct' : ''} ${p1Flash === 'wrong' ? 'flash-wrong' : ''}`}>
            {p1Penalty && (
              <div className="penalty-overlay">
                <WarningCircle weight="fill" className="penalty-icon" />
                <span className="penalty-text">Salah! Tunggu...</span>
                <span className="penalty-answer">Jawaban: {p1Question.answer}</span>
              </div>
            )}
            <div className="panel-header p1-header">
              <img src={playerBlueImg} alt="" className="panel-avatar" />
              <h2>{p1Name}</h2>
            </div>
            <div className="question-box">
              <span className="question-text">{p1Question.text} = ?</span>
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
                  <span className="key-hint">{['A', 'S', 'D'][idx]}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="vs-divider">
            <span>⚔️</span>
            <span>VS</span>
          </div>

          {/* P2 Panel */}
          <div className={`player-panel p2-panel ${p2Penalty ? 'penalized' : ''} ${p2Flash === 'correct' ? 'flash-correct' : ''} ${p2Flash === 'wrong' ? 'flash-wrong' : ''}`}>
            {p2Penalty && (
              <div className="penalty-overlay">
                <WarningCircle weight="fill" className="penalty-icon" />
                <span className="penalty-text">Salah! Tunggu...</span>
                <span className="penalty-answer">Jawaban: {p2Question.answer}</span>
              </div>
            )}
            <div className="panel-header p2-header">
              <img src={playerRedImg} alt="" className="panel-avatar" />
              <h2>{p2Name}</h2>
            </div>
            <div className="question-box">
              <span className="question-text">{p2Question.text} = ?</span>
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
                  <span className="key-hint">{['J', 'K', 'L'][idx]}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
