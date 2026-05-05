import { Trophy, ArrowCounterClockwise, Sword } from '@phosphor-icons/react';

export default function GameOverScreen({ matchResult, gameMode, onRestart, onNextBattle }) {
  let winMsg = "Seri!";
  if (matchResult.winner) {
    winMsg = `${matchResult.winner} Menang!`;
  }

  return (
    <div id="gameover-screen" className="screen">
      <div className="card text-center" style={{ textAlign: 'center' }}>
        <Trophy weight="regular" className="trophy-icon bounce" />
        <h2 className="gameover-title">Game Over!</h2>
        <p className="winner-text">{winMsg}</p>
        
        <button className="btn btn-dark" onClick={onRestart}>
          <ArrowCounterClockwise weight="regular" style={{ marginRight: '8px' }} /> Kembali ke Menu
        </button>
        
        {gameMode === 'individual' && (
          <button className="btn btn-primary" onClick={onNextBattle}>
            <Sword weight="regular" style={{ marginRight: '8px' }} /> Pertarungan Selanjutnya
          </button>
        )}
      </div>
    </div>
  );
}
