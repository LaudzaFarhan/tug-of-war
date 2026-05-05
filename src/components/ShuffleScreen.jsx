import { useState, useEffect, useRef } from 'react';

export default function ShuffleScreen({ matchups, hasDrawnBracket, onBracketDrawn, onComplete }) {
  const [showHighlight, setShowHighlight] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  
  const [initialPool, setInitialPool] = useState([]);

  // Animation State Machine
  const [currentMatchIdx, setCurrentMatchIdx] = useState(0);
  const [animPhase, setAnimPhase] = useState('ROULETTE_P1'); // ROULETTE_P1, SHOW_P1, ROULETTE_P2, SHOW_P2, MOVE
  const [roulettePlayer, setRoulettePlayer] = useState(null);

  // Initialize drawing state
  useEffect(() => {
    if (!matchups || matchups.length === 0 || isInitialized) return;
    
    if (!hasDrawnBracket) {
      const pool = [];
      matchups.forEach(m => {
        if (m[0]) pool.push(m[0]);
        if (m[1]) pool.push(m[1]);
      });
      pool.sort(() => Math.random() - 0.5);
      setInitialPool(pool);
      setCurrentMatchIdx(0);
      setAnimPhase('ROULETTE_P1');
    }
    setIsInitialized(true);
  }, [matchups, hasDrawnBracket, isInitialized]);

  // Derived State for UI
  const drawnMatchups = matchups.map((m, idx) => {
    if (hasDrawnBracket) return m;
    if (idx < currentMatchIdx) return m; // Fully drawn past matches
    if (idx === currentMatchIdx && animPhase === 'MOVE') return m; // Drawn in current tick
    return [null, null]; // Not drawn yet
  });

  const movedPlayers = new Set();
  if (!hasDrawnBracket) {
    for (let i = 0; i < currentMatchIdx; i++) {
      movedPlayers.add(matchups[i][0]);
      movedPlayers.add(matchups[i][1]);
    }
    if (animPhase === 'MOVE' && currentMatchIdx < matchups.length) {
      movedPlayers.add(matchups[currentMatchIdx][0]);
      movedPlayers.add(matchups[currentMatchIdx][1]);
    }
  }

  const displayedPool = initialPool.filter(p => !movedPlayers.has(p));

  // Sequence Controller
  useEffect(() => {
    if (!isInitialized || hasDrawnBracket) return;
    if (currentMatchIdx >= matchups.length) {
      const timer = setTimeout(() => {
        if (onBracketDrawn) onBracketDrawn();
      }, 1000);
      return () => clearTimeout(timer);
    }

    let delay = 0;
    let nextPhase = '';

    switch (animPhase) {
      case 'ROULETTE_P1':
        delay = 1000; nextPhase = 'SHOW_P1'; break;
      case 'SHOW_P1':
        delay = 800; nextPhase = 'ROULETTE_P2'; break;
      case 'ROULETTE_P2':
        delay = 1000; nextPhase = 'SHOW_P2'; break;
      case 'SHOW_P2':
        delay = 800; nextPhase = 'MOVE'; break;
      case 'MOVE':
        delay = 600; nextPhase = 'ROULETTE_P1'; break;
      default: break;
    }

    const timer = setTimeout(() => {
      if (animPhase === 'MOVE') {
        setCurrentMatchIdx(idx => idx + 1);
      }
      setAnimPhase(nextPhase);
    }, delay);

    return () => clearTimeout(timer);
  }, [isInitialized, hasDrawnBracket, currentMatchIdx, animPhase, matchups.length, onBracketDrawn]);

  // Roulette Effect Controller
  useEffect(() => {
    if (animPhase !== 'ROULETTE_P1' && animPhase !== 'ROULETTE_P2') {
      setRoulettePlayer(null);
      return;
    }

    // Only pick from players who haven't been picked for this match yet
    const availablePool = displayedPool.filter(p => {
      if (animPhase === 'ROULETTE_P2' && p === matchups[currentMatchIdx][0]) return false;
      return true;
    });

    if (availablePool.length === 0) return;

    const interval = setInterval(() => {
      const randIdx = Math.floor(Math.random() * availablePool.length);
      setRoulettePlayer(availablePool[randIdx]);
    }, 60);

    return () => clearInterval(interval);
  }, [animPhase, displayedPool, currentMatchIdx, matchups]);

  // Determine Highlights
  let highlightP1 = null;
  let highlightP2 = null;

  if (!hasDrawnBracket && currentMatchIdx < matchups.length) {
    if (animPhase === 'ROULETTE_P1') {
      highlightP1 = roulettePlayer;
    } else if (animPhase === 'SHOW_P1' || animPhase === 'ROULETTE_P2') {
      highlightP1 = matchups[currentMatchIdx][0];
      if (animPhase === 'ROULETTE_P2') highlightP2 = roulettePlayer;
    } else if (animPhase === 'SHOW_P2') {
      highlightP1 = matchups[currentMatchIdx][0];
      highlightP2 = matchups[currentMatchIdx][1];
    }
  }

  const [transitionPhase, setTransitionPhase] = useState('IDLE');
  const [rouletteMatchIdx, setRouletteMatchIdx] = useState(null);

  // Transition Animation (Only runs after bracket is fully drawn)
  useEffect(() => {
    if (!hasDrawnBracket || !matchups || matchups.length === 0) return;

    let timer;
    if (transitionPhase === 'IDLE') {
      timer = setTimeout(() => setTransitionPhase('ROULETTE'), 500);
    } else if (transitionPhase === 'ROULETTE') {
      timer = setTimeout(() => setTransitionPhase('SHOW'), 1500);
    } else if (transitionPhase === 'SHOW') {
      timer = setTimeout(() => setTransitionPhase('START'), 1500);
    } else if (transitionPhase === 'START') {
      const remainingMatchups = [...matchups];
      const currentMatch = remainingMatchups.shift(); 
      onComplete(currentMatch[0], currentMatch[1], remainingMatchups);
    }

    return () => clearTimeout(timer);
  }, [matchups, hasDrawnBracket, transitionPhase, onComplete]);

  // Matchup Roulette Effect Controller
  useEffect(() => {
    if (transitionPhase !== 'ROULETTE' || matchups.length <= 1) {
      setRouletteMatchIdx(null);
      return;
    }
    const interval = setInterval(() => {
      setRouletteMatchIdx(Math.floor(Math.random() * matchups.length));
    }, 80);
    return () => clearInterval(interval);
  }, [transitionPhase, matchups.length]);

  if (!matchups || matchups.length === 0) return null;

  return (
    <div id="bracket-screen" className="screen">
      <div className="card bracket-card">
        <h2>🏆 Bagan Pertandingan 🏆</h2>
        
        {/* Player Pool (Only visible during drawing phase) */}
        {!hasDrawnBracket && displayedPool.length > 0 && (
          <div className="player-pool">
            {displayedPool.map((p, idx) => {
              let badgeClass = "pool-badge";
              if (p === highlightP1) badgeClass += " selected-p1";
              if (p === highlightP2) badgeClass += " selected-p2";
              return (
                <span key={idx} className={badgeClass}>{p}</span>
              );
            })}
          </div>
        )}

        <div className={`bracket-list ${transitionPhase === 'ROULETTE' ? 'roulette-fast' : ''}`}>
          {drawnMatchups.map((match, idx) => {
            const isCurrentMatch = idx === 0;
            const isDrawn = match[0] !== null;
            
            let isHighlighted = false;
            let isPending = false;

            if (hasDrawnBracket) {
                if (transitionPhase === 'ROULETTE') {
                    isHighlighted = (idx === rouletteMatchIdx);
                } else if (transitionPhase === 'SHOW' || transitionPhase === 'START') {
                    isHighlighted = isCurrentMatch;
                    isPending = !isCurrentMatch;
                }
            }
            
            return (
              <div 
                key={idx} 
                className={`matchup-row ${isHighlighted ? 'matchup-highlight' : ''} ${isPending ? 'matchup-pending' : ''} ${isDrawn ? 'slot-filled' : 'slot-empty'}`}
              >
                <div className={`matchup-player ${isDrawn ? 'p1-bg' : 'empty-bg'}`}>
                  {isDrawn ? match[0] : '?'}
                </div>
                <div className="matchup-vs">VS</div>
                <div className={`matchup-player ${isDrawn ? 'p2-bg' : 'empty-bg'}`}>
                  {isDrawn ? match[1] : '?'}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
