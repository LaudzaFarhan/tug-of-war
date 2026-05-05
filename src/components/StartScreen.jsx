import { useState } from 'react';
import { Trophy, Play } from '@phosphor-icons/react';

export default function StartScreen({ onStart, leaderboard }) {
  const [mode, setMode] = useState('group');
  const [p1Name, setP1Name] = useState('Pemain 1');
  const [p2Name, setP2Name] = useState('Pemain 2');
  const [duration, setDuration] = useState(60);
  const [studentListText, setStudentListText] = useState("Budi\nSiti\nAndi\nJoko");

  const handleStart = () => {
    let studentList = [];
    if (mode === 'individual') {
      studentList = studentListText.split('\n').map(s => s.trim()).filter(s => s.length > 0);
      if (studentList.length < 2) {
        alert('Tidak cukup siswa tersisa! Silakan tambahkan lebih banyak nama.');
        return;
      }
    }
    
    onStart(mode, duration, { p1: p1Name, p2: p2Name }, studentList);
  };

  return (
    <div id="start-screen" className="screen active">
      <div className="card">
        <Trophy weight="regular" className="trophy-icon" />
        <h1>Tarik Tambang Matematika</h1>
        
        <div className="mode-selector">
          <button 
            className={`mode-btn ${mode === 'group' ? 'active' : ''}`}
            onClick={() => setMode('group')}
          >
            Mode Grup
          </button>
          <button 
            className={`mode-btn ${mode === 'individual' ? 'active' : ''}`}
            onClick={() => setMode('individual')}
          >
            Mode Individu
          </button>
        </div>

        {mode === 'group' ? (
          <div id="group-inputs">
            <div className="input-group">
              <label htmlFor="p1-name">Nama Pemain 1 (Kiri - Tombol A,S,D)</label>
              <input 
                type="text" 
                id="p1-name" 
                value={p1Name}
                onChange={(e) => setP1Name(e.target.value)}
                className="input-field p1-input" 
              />
            </div>
            <div className="input-group">
              <label htmlFor="p2-name">Nama Pemain 2 (Kanan - Tombol J,K,L)</label>
              <input 
                type="text" 
                id="p2-name" 
                value={p2Name}
                onChange={(e) => setP2Name(e.target.value)}
                className="input-field p2-input" 
              />
            </div>
          </div>
        ) : (
          <div id="indiv-inputs">
            <div className="input-group">
              <label htmlFor="student-list">Daftar Siswa (Satu nama per baris)</label>
              <textarea 
                id="student-list" 
                className="input-field" 
                rows="4" 
                value={studentListText}
                onChange={(e) => setStudentListText(e.target.value)}
                placeholder="Budi&#10;Siti&#10;Andi&#10;Joko"
              ></textarea>
            </div>
          </div>
        )}

        <div className="input-group">
          <label htmlFor="game-duration">Waktu Bermain (Detik)</label>
          <input 
            type="number" 
            id="game-duration" 
            value={duration}
            onChange={(e) => setDuration(parseInt(e.target.value) || 60)}
            className="input-field" 
            min="10" 
            max="300" 
          />
        </div>

        <button id="start-btn" className="btn btn-primary" onClick={handleStart}>
          <Play weight="regular" style={{ marginRight: '8px' }} /> Mulai Pertarungan!
        </button>

        {leaderboard.length > 0 && (
          <div id="leaderboard-container" className="leaderboard">
            <h2>Leaderboard (Sesi Ini)</h2>
            <ul id="leaderboard-list">
              {leaderboard.slice(0, 5).map(entry => (
                <li key={entry.id} className="leaderboard-item">
                  <span><span className="winner">{entry.winner}</span> mengalahkan {entry.loser}</span>
                  <span className="time">{entry.date}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
