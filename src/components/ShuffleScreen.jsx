import { useState, useEffect } from 'react';

export default function ShuffleScreen({ studentList, onComplete }) {
  const [highlightIdx, setHighlightIdx] = useState(-1);
  const [selectedP1, setSelectedP1] = useState(null);
  const [selectedP2, setSelectedP2] = useState(null);

  useEffect(() => {
    let shuffleCount = 0;
    const maxShuffles = 25;
    const speed = 80;
    let lastIdx = -1;

    const shuffleInterval = setInterval(() => {
      let randomIdx = Math.floor(Math.random() * studentList.length);
      while (randomIdx === lastIdx && studentList.length > 1) {
        randomIdx = Math.floor(Math.random() * studentList.length);
      }
      
      setHighlightIdx(randomIdx);
      lastIdx = randomIdx;
      
      shuffleCount++;
      if (shuffleCount >= maxShuffles) {
        clearInterval(shuffleInterval);
        
        // Copy list to avoid mutation
        const remainingList = [...studentList];
        
        const idx1 = Math.floor(Math.random() * remainingList.length);
        const p1Name = remainingList.splice(idx1, 1)[0];
        
        const idx2 = Math.floor(Math.random() * remainingList.length);
        const p2Name = remainingList.splice(idx2, 1)[0];

        setHighlightIdx(-1);
        setSelectedP1(p1Name);
        setSelectedP2(p2Name);

        setTimeout(() => {
          onComplete(p1Name, p2Name, remainingList);
        }, 2000);
      }
    }, speed);

    return () => clearInterval(shuffleInterval);
  }, [studentList, onComplete]);

  return (
    <div id="shuffle-screen" className="screen">
      <div className="card shuffle-card">
        <h2>Memilih Pemain...</h2>
        <div className="name-grid" id="shuffle-grid">
          {studentList.map((student, idx) => {
            let className = 'name-badge';
            if (idx === highlightIdx) className += ' highlight';
            if (student === selectedP1) className += ' selected-p1';
            else if (student === selectedP2 && student !== selectedP1) className += ' selected-p2'; // rudimentary handle duplicate names
            
            return (
              <div key={idx} className={className}>
                {student}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
