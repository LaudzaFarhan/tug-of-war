import { useState, useEffect, useRef } from 'react';
import { CheckCircle } from '@phosphor-icons/react';

export default function VsScreen({ p1Name, p2Name, onComplete }) {
  const [countdown, setCountdown] = useState(null);
  
  const beepSoundRef = useRef(null);
  const lastPlayedRef = useRef(null);
  
  const handleReady = () => {
    setCountdown(3);
  };

  useEffect(() => {
    if (countdown === null) return;

    // ONLY play the audio once at the very beginning (when countdown is 3)
    if (countdown === 3 && lastPlayedRef.current !== 3) {
      if (beepSoundRef.current) {
        beepSoundRef.current.currentTime = 0;
        beepSoundRef.current.play().catch(() => {});
      }
      lastPlayedRef.current = 3;
    }

    if (countdown === 'GO!') {
      let timeoutId;
      const audioEl = beepSoundRef.current;
      
      const handleEnded = () => {
        clearTimeout(timeoutId);
        onComplete();
      };
      
      if (audioEl) {
        audioEl.addEventListener('ended', handleEnded);
        // Fallback max wait time of 3 seconds just in case audio fails or is blocked
        timeoutId = setTimeout(handleEnded, 3000);
      } else {
        timeoutId = setTimeout(onComplete, 1000);
      }

      return () => {
        if (audioEl) audioEl.removeEventListener('ended', handleEnded);
        clearTimeout(timeoutId);
      };
    }

    if (countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1 === 0 ? 'GO!' : countdown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown, onComplete]);

  return (
    <div id="vs-screen" className="screen">
      <div className="vs-container">
        <div className="vs-player vs-p1" id="vs-p1-name">{p1Name}</div>
        <div className="vs-logo">VS</div>
        <div className="vs-player vs-p2" id="vs-p2-name">{p2Name}</div>
      </div>
      
      <button 
        id="ready-btn" 
        className="btn btn-primary vs-ready-btn" 
        onClick={handleReady}
        disabled={countdown !== null}
      >
        <CheckCircle weight="regular" style={{ marginRight: '8px' }} /> Siap!
      </button>
      
      {countdown !== null && (
        <div id="countdown-overlay" className="countdown-overlay">
          <span 
            id="countdown-text" 
            className="countdown-text"
            key={countdown} // Force re-render animation
          >
            {countdown}
          </span>
        </div>
      )}
      
      {/* HTML5 Audio tag for reliable playback */}
      <audio ref={beepSoundRef} src="sounds/countdown_beep.mp3" preload="auto" />
    </div>
  );
}
