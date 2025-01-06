export interface WordEntry {
  word: string;
  player: 'human' | 'computer';
}

export interface SimilarityEntry {
  previousWord: string;
  playedBy: string;
  similarity: number | null;
  tooSimilar: boolean;
}

export interface SimilarityTable {
  forWord: string;
  similarities: SimilarityEntry[];
}

export interface GameSummary {
  totalWords: number;
  wordHistory: WordEntry[];
}

export interface GameState {
  isConnected: boolean;
  difficulty: string | null;
  words: WordEntry[];
  currentWord: string;
  similarityTable: SimilarityTable;
  gameOver: boolean;
  gameOverMessage: string;
  error: string;
  gameId: string | null;
  playerTable: SimilarityTable | null;
  computerTable: SimilarityTable | null;
  gameSummary: GameSummary | null;
  currentTables: {
    player: SimilarityTable | null;
    computer: SimilarityTable | null;
  };
  threshold: number | null;
  timerDuration: number | null;
}

export interface TimerConfig {
  duration: number | null;
  label: string;
}