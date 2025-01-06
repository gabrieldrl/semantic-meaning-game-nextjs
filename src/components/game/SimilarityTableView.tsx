import { SimilarityTable } from '@/types';

interface Props {
  table: SimilarityTable;
  title: string;
}

export const SimilarityTableView = ({ table, title }: Props) => (
  <div className="bg-white rounded-lg shadow-md p-4 mt-4">
    <h3 className="text-lg font-bold text-gray-800 mb-3 border-b pb-2">
      {title}: <span className="text-blue-600">&quot;{table.forWord}&quot;</span>
    </h3>
    <div className="overflow-x-auto">
      <table className="min-w-full">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Previous Word</th>
            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Played By</th>
            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Similarity</th>
            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Too Similar</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {table.similarities.map((entry, index) => (
            <tr key={index} className="hover:bg-gray-50">
              <td className="px-4 py-2">{entry.previousWord}</td>
              <td className={`px-4 py-2 ${entry.playedBy === 'computer' ? 'text-blue-600' : 'text-green-600'}`}>
                {entry.playedBy}
              </td>
              <td className="px-4 py-2">{entry.similarity?.toFixed(3) || 'N/A'}</td>
              <td className={`px-4 py-2 ${entry.tooSimilar ? 'text-red-600 font-semibold' : 'text-gray-600'}`}>
                {entry.tooSimilar ? '⚠️ Yes' : 'No'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);
