import { useState, useEffect } from 'react';
import StartScreen from './components/StartScreen';
import ShuffleScreen from './components/ShuffleScreen';
import VsScreen from './components/VsScreen';
import GameScreen from './components/GameScreen';
import GameOverScreen from './components/GameOverScreen';

function App() {
  const [gameState, setGameState] = useState('start'); // start, shuffle, vs, playing, gameover
  const [gameMode, setGameMode] = useState('group'); // group, individual
  const [p1Name, setP1Name] = useState('Pemain 1');
  const [p2Name, setP2Name] = useState('Pemain 2');
  const [gameDuration, setGameDuration] = useState(60);
  const [studentList, setStudentList] = useState([]);
  
  const [leaderboard, setLeaderboard] = useState([]);
  const [matchResult, setMatchResult] = useState({ winner: null, loser: null, isDraw: false });

  // Generate Math Question Helper
  const generateMathQuestion = () => {
    const operations = ['+', '-', '*'];
    const op = operations[Math.floor(Math.random() * operations.length)];
    let num1, num2, answer;

    if (op === '+') {
        num1 = Math.floor(Math.random() * 20) + 1;
        num2 = Math.floor(Math.random() * 20) + 1;
        answer = num1 + num2;
    } else if (op === '-') {
        num1 = Math.floor(Math.random() * 20) + 10;
        num2 = Math.floor(Math.random() * num1) + 1;
        answer = num1 - num2;
    } else {
        num1 = Math.floor(Math.random() * 10) + 1;
        num2 = Math.floor(Math.random() * 10) + 1;
        answer = num1 * num2;
    }

    const choices = new Set([answer]);
    while (choices.size < 3) {
        const offset = Math.floor(Math.random() * 10) - 5;
        const wrongAnswer = answer + offset;
        if (wrongAnswer !== answer && wrongAnswer >= 0) {
            choices.add(wrongAnswer);
        }
    }

    const shuffledChoices = Array.from(choices).sort(() => Math.random() - 0.5);

    return {
        text: `${num1} ${op} ${num2}`,
        answer: answer,
        choices: shuffledChoices
    };
  };

  const handleStartGame = (mode, duration, names, list) => {
    setGameMode(mode);
    setGameDuration(duration);
    
    if (mode === 'individual') {
      setStudentList(list);
      setGameState('shuffle');
    } else {
      setP1Name(names.p1);
      setP2Name(names.p2);
      setGameState('vs');
    }
  };

  const handleShuffleComplete = (p1, p2, remainingList) => {
    setP1Name(p1);
    setP2Name(p2);
    setStudentList(remainingList);
    setGameState('vs');
  };

  const handleVsComplete = () => {
    setGameState('playing');
  };

  const handleGameOver = (ropePos) => {
    let winner = null;
    let loser = null;
    let isDraw = false;

    if (ropePos > 0) {
      winner = p1Name;
      loser = p2Name;
    } else if (ropePos < 0) {
      winner = p2Name;
      loser = p1Name;
    } else {
      isDraw = true;
    }

    setMatchResult({ winner, loser, isDraw });
    
    if (winner) {
      setLeaderboard(prev => [{
        id: Date.now(),
        winner,
        loser,
        date: new Date().toLocaleTimeString()
      }, ...prev]);
    }

    setGameState('gameover');
  };

  const handleRestart = () => {
    setGameState('start');
  };

  const handleNextBattle = () => {
    if (studentList.length < 2) {
      alert('Tidak cukup siswa tersisa! Silakan tambahkan lebih banyak nama.');
      setGameState('start');
      return;
    }
    setGameState('shuffle');
  };

  return (
    <div id="app" className="app-container">
      {gameState === 'start' && (
        <StartScreen 
          onStart={handleStartGame} 
          leaderboard={leaderboard} 
        />
      )}
      
      {gameState === 'shuffle' && (
        <ShuffleScreen 
          studentList={studentList}
          onComplete={handleShuffleComplete}
        />
      )}
      
      {gameState === 'vs' && (
        <VsScreen 
          p1Name={p1Name}
          p2Name={p2Name}
          onComplete={handleVsComplete}
        />
      )}
      
      {gameState === 'playing' && (
        <GameScreen 
          p1Name={p1Name}
          p2Name={p2Name}
          gameDuration={gameDuration}
          generateMathQuestion={generateMathQuestion}
          onGameOver={handleGameOver}
        />
      )}
      
      {gameState === 'gameover' && (
        <GameOverScreen 
          matchResult={matchResult}
          gameMode={gameMode}
          onRestart={handleRestart}
          onNextBattle={handleNextBattle}
        />
      )}
    </div>
  );
}

export default App;
