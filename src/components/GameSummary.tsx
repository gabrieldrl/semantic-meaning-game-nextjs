import { WordEntry, SimilarityTable, SimilarityEntry } from '@/types';
import { WordChain } from './game/WordChain';

interface GameSummaryProps {
  words: WordEntry[];
  finalTable: SimilarityTable;
  winner: 'human' | 'computer';
  gameOverMessage: string;
  timerDuration: number | null;  // Add this prop
}

const calculateScore = (words: WordEntry[], timerDuration: number | null): number => {
  const playerWords = words.filter(w => w.player === 'human').length;
  
  // Base score: 100 points per word
  let score = playerWords * 100;
  
  // Timer multiplier
  if (timerDuration) {
    const timerMultiplier = {
      10: 3,   // 3x points for 10s timer
      20: 2,   // 2x points for 20s timer
      30: 1.5  // 1.5x points for 30s timer
    }[timerDuration] || 1;
    
    score *= timerMultiplier;
  }
  
  // Add 65% bonus points
  score = Math.round(score * 1.65);
  
  return score;
};

export const GameSummary = ({ words, finalTable, winner, gameOverMessage, timerDuration }: GameSummaryProps) => {
  const humanWords = words.filter(w => w.player === 'human').length;
  const computerWords = words.filter(w => w.player === 'computer').length;
  // Always show table data regardless of who won
  const hasTableData = finalTable && finalTable.similarities && finalTable.similarities.length > 0;
  
  // Always calculate score
  const score = calculateScore(words, timerDuration);

  return (
    <div className="space-y-6">
      {/* Game Over Message */}
      <div className="animate-pulse bg-red-50 border-2 border-red-200 rounded-xl p-4">
        <h2 className="text-2xl font-bold text-red-600 text-center">
          Game Over: {gameOverMessage}
        </h2>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Game Summary</h2>
        <div className="space-y-6">
          {/* Winner, score, and word count section */}
          <div className="flex flex-col space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-semibold">
                Winner: <span className={winner === 'human' ? 'text-green-600' : 'text-blue-600'}>
                  {winner === 'human' ? 'You' : 'Computer'}
                </span>
              </h3>
              <div className="text-sm space-x-4">
                <span className="text-green-600">Your words: {humanWords}</span>
                <span className="text-blue-600">Computer&apos;s words: {computerWords}</span>
              </div>
            </div>
            
            {/* Score section - always show */}
            <div className="bg-green-50 p-4 rounded-lg">
              <h4 className="text-lg font-semibold text-green-800">
                Your Score: {score} points
              </h4>
              <p className="text-sm text-green-600">
                {timerDuration ? 
                  `Playing with ${timerDuration}s timer (bonus multiplier applied)` : 
                  'Playing without timer'}
              </p>
            </div>
          </div>

          {/* Complete word chain using WordChain component */}
          <WordChain 
            words={words}
            gameOver={true}
            losingWord={finalTable?.forWord}
          />

          {/* Game-ending similarity table - only render if there's data */}
          {hasTableData && (
            <div className="mt-4">
              <h4 className="font-semibold mb-2">Game-Ending Word Similarity:</h4>
              <div className="bg-red-50 rounded-lg p-4">
                <p className="text-lg mb-2">
                  Losing Word: <span className="font-bold text-red-600">{finalTable.forWord}</span>
                  <span className="ml-2 text-sm text-gray-600">
                    (played by {words.find(w => w.word === finalTable.forWord)?.player || 'unknown'})
                  </span>
                </p>
                <table className="min-w-full">
                  <thead className="bg-red-100">
                    <tr>
                      <th className="px-4 py-2 text-left">Previous Word</th>
                      <th className="px-4 py-2 text-left">Played By</th>
                      <th className="px-4 py-2 text-left">Similarity</th>
                    </tr>
                  </thead>
                  <tbody>
                    {finalTable.similarities.map((entry: SimilarityEntry, index: number) => (
                      <tr key={index} className={`
                        border-b border-red-100
                        ${entry.tooSimilar ? 'bg-red-100 font-semibold' : ''}
                      `}>
                        <td className="px-4 py-2">{entry.previousWord}</td>
                        <td className="px-4 py-2">{entry.playedBy}</td>
                        <td className={`px-4 py-2 ${entry.tooSimilar ? 'text-red-600' : ''}`}>
                          {entry.similarity?.toFixed(3)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
