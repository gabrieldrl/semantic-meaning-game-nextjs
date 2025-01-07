'use client';

import { useState, useEffect, useRef } from 'react';
import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000';

interface Message {
  type: string;
  word?: string;
  similarityTable?: SimilarityTableData;
  wordChain?: WordChainData[];
  message?: string;
  gameSummary?: GameSummaryData;
  timeLeft?: number;
}

interface SimilarityTableData {
  forWord: string;
  similarities: SimilarityData[];
}

interface SimilarityData {
  previousWord: string;
  playedBy: string;
  similarity: number | null;
  tooSimilar: boolean;
}

interface WordChainData {
  word: string;
  player: string;
}

interface GameSummaryData {
  winner: string;
  totalWords: number;
  humanWords: number;
  computerWords: number;
  wordHistory: WordChainData[];
  message?: string;
  finalWord?: string;
  similarityTable?: SimilarityTableData;
}

interface SimilarityTableProps {
  table: SimilarityTableData;
}

interface GameSummaryProps {
  summary: GameSummaryData;
}

const GamePage = () => {
  const [gameId, setGameId] = useState<string | null>(null);
  const [difficulty, setDifficulty] = useState<string>('easy');
  const [timerDuration, setTimerDuration] = useState<number | null>(null);
  const [word, setWord] = useState<string>('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [latestTable, setLatestTable] = useState<SimilarityTableData | null>(null);
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [gameSummary, setGameSummary] = useState<GameSummaryData | null>(null);
  const historyRef = useRef<HTMLDivElement>(null);
  const [threshold, setThreshold] = useState<number | null>(null);

  useEffect(() => {
    if (gameId) {
      const ws = new WebSocket(`${API_BASE_URL.replace('http', 'ws')}/game/${gameId}`);
      ws.onmessage = (event) => {
        const data: Message = JSON.parse(event.data);
        if (data.type === 'timerUpdate') {
          setTimeLeft(data.timeLeft || null);
        } else if (data.type === 'gameOver') {
          setIsGameOver(true);
          const summary = {
            ...data.gameSummary!,
            humanWords: data.gameSummary!.wordHistory.filter((w) => w.player === 'human').length,
            computerWords: data.gameSummary!.wordHistory.filter((w) => w.player === 'computer').length,
          };
          setGameSummary(summary);
          console.log('Game Over:', summary);
        } else {
          setMessages((prev) => [...prev, data]);
          if (data.similarityTable) {
            setLatestTable(data.similarityTable);
          }
        }
      };
      setSocket(ws);
      return () => ws.close();
    }
  }, [gameId]);

  useEffect(() => {
    if (historyRef.current) {
      historyRef.current.scrollTop = historyRef.current.scrollHeight;
    }
  }, [messages]);

  const startGame = async () => {
    const response = await axios.post(`${API_BASE_URL}/initialize-game/${difficulty}`, { timerDuration });
    setGameId(response.data.game_id);
    setThreshold(response.data.threshold);
  };

  const sendWord = () => {
    if (socket && word) {
      socket.send(JSON.stringify({ word }));
      setWord('');
    }
  };

  const SimilarityTable = ({ table }: SimilarityTableProps) => (
    <div className="bg-white rounded-xl p-4 shadow-md">
      <h4 className="text-lg font-semibold mb-3">Similarity Table for: {table.forWord}</h4>
      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead>
            <tr className="bg-gray-50">
              <th className="px-4 py-2 text-left">Previous Word</th>
              <th className="px-4 py-2 text-left">Player</th>
              <th className="px-4 py-2 text-left">Similarity</th>
            </tr>
          </thead>
          <tbody>
            {table.similarities.map((sim, i) => (
              <tr key={i} className={sim.tooSimilar ? 'bg-red-50' : ''}>
                <td className="px-4 py-2 border-t">{sim.previousWord}</td>
                <td className="px-4 py-2 border-t">{sim.playedBy}</td>
                <td className="px-4 py-2 border-t">
                  {sim.similarity}
                  {sim.tooSimilar && ' ⚠️'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const WordChain = () => (
    <div className="flex flex-wrap gap-2 my-4">
      {messages
        .filter(msg => msg.wordChain)
        .slice(-1)[0]?.wordChain?.map((word, index) => (
          <div
            key={index}
            className={`px-3 py-1 rounded-full text-sm font-medium ${
              word.player === 'computer'
                ? 'bg-blue-100 text-blue-800'
                : 'bg-purple-100 text-purple-800'
            }`}
          >
            {word.word}
            <span className="ml-1 opacity-50">
              {word.player === 'computer' ? '🤖' : '👤'}
            </span>
          </div>
        ))}
    </div>
  );

  const GameSummary = ({ summary }: GameSummaryProps) => (
    <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
      <div className="text-center mb-6">
        <h3 className="text-2xl font-bold text-gray-800 mb-2">Game Over!</h3>
        <div className={`text-xl font-semibold ${
          summary.winner === 'human' ? 'text-green-600' : 'text-blue-600'
        }`}>
          {summary.winner === 'human' ? 'You Won! 🎉' : 'Computer Won! 🤖'}
        </div>
        <div className="mt-4 p-4 bg-gray-50 rounded-xl">
          <div className="text-gray-700 text-lg">
            {summary.message && summary.message.toLowerCase().includes('time') ? (
              // Special handling for timer expiration
              <div className="text-blue-600 font-medium">
                Time&apos;s up! Computer wins! 🤖
              </div>
            ) : summary.message && summary.message.toLowerCase().includes('similar') ? (
              <>
                Game ended because of similar words:
                <div className="mt-2 flex gap-2 justify-center flex-wrap">
                  {summary.similarityTable?.similarities
                    .filter((sim) => sim.tooSimilar)
                    .map((sim, i) => (
                      <div key={i} className="inline-flex items-center gap-2">
                        <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full font-medium">
                          {summary.finalWord}
                        </span>
                        <span className="text-red-600">↔</span>
                        <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full font-medium">
                          {sim.previousWord}
                        </span>
                        <span className="text-gray-500">
                          ({sim.similarity})
                        </span>
                      </div>
                    ))}
                </div>
              </>
            ) : (
              summary.message || "Game Over!"
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-blue-50 rounded-xl p-4">
          <div className="text-lg font-semibold">Total Words</div>
          <div className="text-3xl font-bold text-blue-600">{summary.totalWords}</div>
        </div>
        <div className="bg-purple-50 rounded-xl p-4">
          <div className="text-lg font-semibold">Your Words</div>
          <div className="text-3xl font-bold text-purple-600">{summary.humanWords}</div>
          <div className="text-sm text-gray-600 mt-1">
            ({Math.round((summary.humanWords / summary.totalWords) * 100)}%)
          </div>
        </div>
        <div className="bg-gray-50 rounded-xl p-4">
          <div className="text-lg font-semibold">Computer Words</div>
          <div className="text-3xl font-bold text-gray-600">{summary.computerWords}</div>
          <div className="text-sm text-gray-600 mt-1">
            ({Math.round((summary.computerWords / summary.totalWords) * 100)}%)
          </div>
        </div>
      </div>

      <div className="mt-6">
        <h4 className="text-xl font-semibold mb-3">Game Timeline</h4>
        <div className="flex flex-col gap-2">
          {summary.wordHistory.map((word, index) => (
            <div
              key={index}
              className={`px-4 py-2 rounded-lg ${
                word.player === 'computer'
                  ? 'bg-blue-50 border border-blue-100'
                  : 'bg-purple-50 border border-purple-100'
              }`}
            >
              <div className="flex justify-between items-center">
                <span>
                  <span className="font-bold">{index + 1}.</span>
                  <span className="ml-2 font-medium">{word.word}</span>
                  <span className="ml-1 opacity-50">
                    {word.player === 'computer' ? '🤖' : '👤'}
                  </span>
                </span>
                <span className="text-sm text-gray-600">
                  {word.player === 'computer' ? 'Computer' : 'You'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const GameHeader = () => (
    <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white rounded-2xl p-6 shadow-lg border border-gray-100 mb-6">
      <div className="flex items-center gap-4">
        <div className="px-4 py-2 bg-blue-50 rounded-lg">
          <span className="text-sm text-gray-600">Game ID:</span>
          <span className="ml-2 font-medium text-blue-600">{gameId}</span>
        </div>
        <div className="px-4 py-2 bg-purple-50 rounded-lg">
          <span className="text-sm text-gray-600">Difficulty:</span>
          <span className="ml-2 font-medium text-purple-600 capitalize">{difficulty}</span>
        </div>
        <div className="px-4 py-2 bg-gray-50 rounded-lg">
          <span className="text-sm text-gray-600">Threshold:</span>
          <span className="ml-2 font-medium text-gray-600">{threshold}</span>
        </div>
      </div>
      {timeLeft !== null && (
        <div className={`px-4 py-2 rounded-lg ${
          timeLeft < 10 ? 'bg-red-50 text-red-600' : 'bg-green-50 text-gray-600'
        }`}>
          <span className="text-sm">Time Left:</span>
          <span className="ml-2 font-bold">{timeLeft}s</span>
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-800 mb-8 text-center bg-white rounded-2xl p-6 shadow-sm">
          Semantic Meaning Game
        </h1>

        {!gameId ? (
          <div className="bg-white rounded-2xl p-6 md:p-8 shadow-lg border border-gray-100">
            <div className="space-y-6">
              <div className="squamorphic-input-group">
                <label className="block text-gray-700 mb-2 font-medium">
                  Difficulty Level
                </label>
                <select 
                  value={difficulty} 
                  onChange={(e) => setDifficulty(e.target.value)}
                  className="w-full p-3 rounded-xl bg-gray-50 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-200 transition-all"
                >
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                  <option value="expert">Expert</option>
                </select>
              </div>

              <div className="squamorphic-input-group">
                <label className="block text-gray-700 mb-2 font-medium">
                  Timer Duration (seconds)
                </label>
                <input
                  type="number"
                  value={timerDuration ?? ''}
                  onChange={(e) => setTimerDuration(Number(e.target.value))}
                  className="w-full p-3 rounded-xl bg-gray-50 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-200 transition-all"
                />
              </div>

              <button 
                onClick={startGame}
                className="w-full py-4 px-6 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl font-medium hover:opacity-90 transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] shadow-md"
              >
                Start New Game
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <GameHeader />
            
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
              <div className="flex flex-col md:flex-row gap-4">
                <input
                  type="text"
                  value={word}
                  onChange={(e) => setWord(e.target.value)}
                  placeholder="Enter your word"
                  className="flex-1 p-4 rounded-xl bg-gray-50 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-200 transition-all"
                  onKeyPress={(e) => e.key === 'Enter' && sendWord()}
                />
                <button
                  onClick={sendWord}
                  className="px-6 py-4 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl font-medium hover:opacity-90 transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] shadow-md"
                >
                  Send Word
                </button>
              </div>
            </div>

            {latestTable && (
              <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
                <h3 className="text-xl font-semibold text-gray-700 mb-4">Latest Similarity Table</h3>
                <SimilarityTable table={latestTable} />
                <div className="mt-6">
                  <h4 className="text-lg font-semibold mb-2">Word Chain</h4>
                  <WordChain />
                </div>
              </div>
            )}

            {isGameOver ? (
              gameSummary && <GameSummary summary={gameSummary} />
            ) : (
              <div 
                ref={historyRef}
                className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 max-h-[600px] overflow-y-auto"
              >
                <h3 className="text-xl font-semibold text-gray-700 mb-4">Game History</h3>
                <div className="space-y-4">
                  {messages.map((msg, index) => (
                    <div 
                      key={index}
                      className={`p-4 rounded-xl ${
                        msg.type === 'computerMove' 
                          ? 'bg-blue-50 border border-blue-100' 
                          : 'bg-purple-50 border border-purple-100'
                      }`}
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <div className="flex items-center gap-2 px-3 py-1 rounded-lg bg-white shadow-sm">
                          <span className="text-sm font-medium text-gray-600">
                            {msg.type === 'computerMove' ? 'Computer 🤖' : 'Player 👤'}
                          </span>
                          {msg.word && (
                            <>
                              <span className="text-gray-400">|</span>
                              <span className="font-semibold text-gray-800">
                                {msg.word}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                      {msg.similarityTable && (
                        <div className="mt-2 text-sm text-gray-600">
                          <div className="font-medium">Similarities:</div>
                          {msg.similarityTable.similarities.map((sim, i) => (
                            <div key={i} className="ml-2">
                              {sim.previousWord}: {sim.similarity}
                              {sim.tooSimilar && ' ⚠️'}
                            </div>
                          ))}
                        </div>
                      )}
                      {msg.message && (
                        <div className="text-sm text-gray-600 mt-2">{msg.message}</div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default GamePage;
