import { useState, useEffect } from 'react';
import { CheckCircle } from '@phosphor-icons/react';

export default function VsScreen({ p1Name, p2Name, onComplete }) {
  const [countdown, setCountdown] = useState(null);
  
  const handleReady = () => {
    setCountdown(3);
  };

  useEffect(() => {
    if (countdown === null) return;

    if (countdown === 'GO!') {
      const timer = setTimeout(() => {
        onComplete();
      }, 1000);
      return () => clearTimeout(timer);
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
    </div>
  );
}
