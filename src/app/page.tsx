'use client';

import { useEffect, useState, useRef } from 'react';
import { GameState } from '@/types';
import { GameSummary } from '@/components/GameSummary';
import { SimilarityTableView } from '@/components/game/SimilarityTableView';
import { DifficultySelector } from '@/components/game/DifficultySelector';
import { WordChain } from '@/components/game/WordChain';
import { Timer } from '@/components/game/Timer';

export default function Home() {
  const [difficulties, setDifficulties] = useState<string[]>([]);
  const [gameState, setGameState] = useState<GameState>({
    isConnected: false,
    difficulty: null,
    words: [],
    currentWord: '',
    similarityTable: { forWord: '', similarities: [] },
    gameOver: false,
    gameOverMessage: '',
    error: '',
    gameId: null,
    playerTable: null,
    computerTable: null,
    gameSummary: null,
    currentTables: {
      player: null,
      computer: null
    },
    threshold: null,  // Add this new property
    timerDuration: null
  });
  
  const wsRef = useRef<WebSocket | null>(null);
  const [isTimerActive, setIsTimerActive] = useState(false);
  const [shouldResetTimer, setShouldResetTimer] = useState(false);

  useEffect(() => {
    fetch('http://localhost:8000/difficulties')
      .then(res => res.json())
      .then(data => setDifficulties(data.difficulties));
  }, []);

  const startGame = async (difficulty: string, timerDuration: number | null) => {
    try {
      const response = await fetch(`http://localhost:8000/initialize-game/${difficulty}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ timerDuration })
      });
      
      if (!response.ok) {
        throw new Error('Failed to initialize game');
      }
      
      const data = await response.json();
      if (!data.game_id) {
        throw new Error('No game ID received');
      }

      console.log('Initializing game with ID:', data.game_id);
      
      const ws = new WebSocket(`ws://localhost:8000/game/${data.game_id}`);
      
      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        setGameState(prev => ({
          ...prev,
          error: 'Failed to connect to game server'
        }));
      };
      
      ws.onopen = () => {
        console.log('WebSocket connection established');  // Add debug logging
        setGameState(prev => ({ 
          ...prev, 
          isConnected: true,
          difficulty,
          gameId: data.game_id,
          threshold: data.threshold,
          timerDuration
        }));
      };

      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        
        switch (data.type) {
          case 'computerMove':
            setGameState(prev => ({
              ...prev,
              words: [...prev.words, { word: data.word, player: 'computer' }],
              currentTables: {
                ...prev.currentTables,
                computer: data.similarityTable
              },
              error: ''
            }));
            break;
            
          case 'playerMove':
            // Add the player's word to the chain when their move is processed
            setGameState(prev => ({
              ...prev,
              words: [...prev.words, { word: data.similarityTable.forWord, player: 'human' }],
              currentTables: {
                ...prev.currentTables,
                player: data.similarityTable
              }
            }));
            break;
            
          case 'moveAccepted':
            setGameState(prev => ({
              ...prev,
              currentTables: {
                ...prev.currentTables,
                computer: data.similarityTable
              },
              currentWord: '',
              error: ''
            }));
            break;
            
          case 'error':
            setGameState(prev => ({
              ...prev,
              error: data.message
            }));
            break;
            
          case 'gameOver':
            setGameState(prev => ({
              ...prev,
              gameOver: true,
              gameOverMessage: data.message,
              similarityTable: data.similarityTable,
              gameSummary: data.gameSummary,
              // Clear current tables when game ends
              currentTables: {
                player: null,
                computer: null
              }
            }));
            break;
        }
      };

      ws.onclose = () => {
        setGameState(prev => ({ ...prev, isConnected: false }));
      };

      wsRef.current = ws;
    } catch (error) {
      console.error('Failed to initialize game:', error);
    }
  };

  const submitWord = () => {
    if (wsRef.current && gameState.currentWord) {
      wsRef.current.send(JSON.stringify({ word: gameState.currentWord }));
      setShouldResetTimer(true);  // Reset timer when user submits a word
    }
  };

  useEffect(() => {
    if (shouldResetTimer) {
      setShouldResetTimer(false);
    }
  }, [shouldResetTimer]);

  const getLargestTable = () => {
    const playerSize = gameState.currentTables.player?.similarities.length || 0;
    const computerSize = gameState.currentTables.computer?.similarities.length || 0;
    return playerSize >= computerSize ? 'player' : 'computer';
  };

  // Determine winner based on game over message
  const determineWinner = (message: string) => {
    if (message.toLowerCase().includes("computer couldn't")) {
      return 'human';
    }
    // If it's the player's word that was too similar, they lose
    if (message.toLowerCase().includes("too similar")) {
      return 'computer';
    }
    return 'computer'; // Default case
  };

  const handleTimeUp = () => {
    setGameState(prev => ({
      ...prev,
      gameOver: true,
      gameOverMessage: "Time's up! You took too long to make a move.",
      winner: 'computer'
    }));
  };

  useEffect(() => {
    if (gameState.words.length > 0) {
      const lastMove = gameState.words[gameState.words.length - 1];
      setIsTimerActive(lastMove.player === 'computer' && !gameState.gameOver);
    }
  }, [gameState.words, gameState.gameOver]);

  if (!gameState.isConnected && !gameState.difficulty) {
    return <DifficultySelector difficulties={difficulties} onSelect={startGame} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <div className="max-w-4xl mx-auto p-4 md:p-8">
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-24">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-gray-800">Semantic Meaning Game</h1>
            {gameState.difficulty && (
              <div className="flex items-center gap-2">
                <span className="px-4 py-2 bg-blue-100 text-blue-800 rounded-full font-medium">
                  {gameState.difficulty.toUpperCase()}
                </span>
                <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm">
                  Threshold: {gameState.threshold?.toFixed(2)}
                </span>
              </div>
            )}
          </div>

          <div className="space-y-6">
            {gameState.gameOver ? (
              <GameSummary 
                words={gameState.words}
                finalTable={gameState.similarityTable}
                winner={determineWinner(gameState.gameOverMessage)}
                gameOverMessage={gameState.gameOverMessage}
                timerDuration={gameState.timerDuration}  // Add this prop
              />
            ) : (
              <>
                <WordChain 
                  words={gameState.words}
                  gameOver={false}
                />

                {/* Error Message */}
                {gameState.error && (
                  <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded">
                    <p className="text-red-700">{gameState.error}</p>
                  </div>
                )}

                {/* Current Similarity Tables */}
                {(gameState.currentTables.player || gameState.currentTables.computer) && (
                  <div className="space-y-4">
                    <h2 className="text-xl font-semibold text-gray-700">
                      Current Table {getLargestTable() === 'player' ? '(Your Word)' : '(Computer\'s Word)'}
                    </h2>
                    {gameState.currentTables.player && (
                      <div className={getLargestTable() === 'player' ? 'ring-2 ring-green-500 rounded-lg' : ''}>
                        <SimilarityTableView table={gameState.currentTables.player} title="Your Word Similarity" />
                      </div>
                    )}
                    {gameState.currentTables.computer && (
                      <div className={getLargestTable() === 'computer' ? 'ring-2 ring-blue-500 rounded-lg' : ''}>
                        <SimilarityTableView table={gameState.currentTables.computer} title="Computer's Word Similarity" />
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Fixed Input Section */}
        <div className="fixed bottom-0 left-0 right-0 bg-white shadow-lg border-t p-4">
          <div className="max-w-4xl mx-auto">
            {!gameState.gameOver ? (
              <div className="flex gap-3">
                <input
                  type="text"
                  value={gameState.currentWord}
                  onChange={(e) => setGameState(prev => ({ ...prev, currentWord: e.target.value }))}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 
                           focus:border-blue-500 outline-none transition-all duration-200"
                  placeholder="Enter your word..."
                />
                <button
                  onClick={submitWord}
                  className="px-6 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg
                           hover:from-blue-600 hover:to-blue-700 transform hover:scale-105 transition-all"
                >
                  Submit
                </button>
              </div>
            ) : (
              <button
                onClick={() => window.location.reload()}
                className="w-full px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg
                         hover:from-green-600 hover:to-green-700 transition-all"
              >
                Play Again
              </button>
            )}
          </div>
        </div>
      </div>
      {/* Add Timer before the fixed input section */}
      {gameState.timerDuration && !gameState.gameOver && (
        <div className="fixed top-4 right-4">
          <Timer
            duration={gameState.timerDuration}
            onTimeUp={handleTimeUp}
            isActive={isTimerActive}
            shouldReset={shouldResetTimer}
          />
        </div>
      )}
    </div>
  );
}
