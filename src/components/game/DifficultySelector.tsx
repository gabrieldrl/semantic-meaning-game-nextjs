import { useState } from 'react';

interface Props {
  difficulties: string[];
  onSelect: (difficulty: string, timerDuration: number | null) => void;
}

const TIMER_OPTIONS = [
  { duration: 10, label: '10s' },
  { duration: 20, label: '20s' },
  { duration: 30, label: '30s' },
  { duration: null, label: 'Unlimited' }
];

export const DifficultySelector = ({ difficulties, onSelect }: Props) => {
  const [selectedTimer, setSelectedTimer] = useState<number | null>(null);

  // If difficulties array is empty, show loading state
  if (!difficulties.length) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white p-8 flex flex-col items-center justify-center">
        <div className="max-w-2xl w-full bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="animate-spin w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-6"></div>
          <h1 className="text-4xl font-bold mb-4 text-gray-800">
            Loading Game...
          </h1>
          <p className="text-gray-600 text-lg mb-2">
            Please wait while we prepare the language model.
          </p>
          <p className="text-gray-500 text-sm">
            This might take up to 2 minutes on first load.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white p-8 flex flex-col items-center justify-center">
      <div className="max-w-2xl w-full bg-white rounded-2xl shadow-xl p-8">
        <h1 className="text-4xl font-bold text-center mb-8 text-gray-800">
          Semantic Meaning Game
        </h1>
        <div className="space-y-8">
          <div className="space-y-4">
            <h2 className="text-2xl font-semibold text-gray-700 text-center">Select Timer</h2>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              {TIMER_OPTIONS.map(option => (
                <button
                  key={option.label}
                  onClick={() => setSelectedTimer(option.duration)}
                  className={`py-3 px-6 rounded-lg transition-all duration-200 shadow-md font-medium
                    ${selectedTimer === option.duration
                      ? 'bg-green-500 text-white'
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-800'}`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <h2 className="text-2xl font-semibold text-gray-700 text-center">Select Difficulty</h2>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              {difficulties.map(difficulty => (
                <button
                  key={difficulty}
                  onClick={() => selectedTimer !== undefined && onSelect(difficulty, selectedTimer)}
                  disabled={selectedTimer === undefined}
                  className={`py-3 px-6 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg
                           hover:from-blue-600 hover:to-blue-700 transform hover:scale-105 transition-all
                           duration-200 shadow-md font-medium capitalize
                           ${selectedTimer === undefined ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {difficulty}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
