import { WordEntry } from '@/types';

interface Props {
  words: WordEntry[];
  gameOver: boolean;
  losingWord?: string;
}

export const WordChain = ({ words, gameOver, losingWord }: Props) => (
  <div className="bg-gray-50 rounded-xl p-4 mb-6">
    <h2 className="text-xl font-semibold text-gray-700 mb-3">Word Chain</h2>
    <div className="flex flex-wrap gap-2">
      {words.map((entry, index) => (
        <span
          key={index}
          className={`px-3 py-1 rounded-full text-sm font-medium flex items-center
            ${entry.player === 'computer' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'}
            ${gameOver && entry.word === losingWord ? 'ring-2 ring-red-500' : ''}`}
        >
          <span className="mr-1 opacity-70">{index + 1}.</span>
          {entry.word}
          <span className="ml-1 opacity-70">({entry.player})</span>
        </span>
      ))}
    </div>
  </div>
);
