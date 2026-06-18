export interface AvatarConfig {
  skinColor: string;
  hairstyle: string;
  shirtStyle: string;
  hatStyle: string;
  earringStyle: string;
  sunglassesStyle: string;
  expression: string;
  micStyle: string;
  bgStyle: string;
}

export interface UserProfile {
  id: string;
  username: string;
  cash: number; // Virtual $FLOW currency
  rep: number;  // Reputation points
  wins: number;
  losses: number;
  streak: number;
  avatar: AvatarConfig;
  purchasedBeatIds: string[];
  songs: Song[];
  lastDailyRewardClaim?: string;
  dailyRewardGranted?: number;
  battleHistory?: BattleHistoryItem[];
  transactions?: TransactionItem[];
}

export interface TransactionItem {
  id: string;
  type: 'deposit' | 'purchase';
  amount: number;
  cashReceived: number;
  packageName: string;
  status: 'pending' | 'success' | 'failed';
  cardLast4?: string;
  date: string;
}

export interface BattleHistoryItem {
  id: string;
  opponentName: string;
  opponentId: string;
  outcome: 'win' | 'loss' | 'tie';
  stake: number;
  playerScore: number;
  opponentScore: number;
  date: string;
}

export interface Beat {
  id: string;
  title: string;
  producer: string;
  genre: string;
  bpm: number;
  price: number;
  audioUrl?: string; // paste custom URL
  synthesisPreset?: string; // built-in web synth presests
  artworkUrl?: string;
  isCustom?: boolean;
}

export interface Song {
  id: string;
  title: string;
  lyrics: string;
  beatId?: string;
  genre: string;
  bpm: number;
  priceSold?: number;
  listedForSale: boolean;
  salePrice?: number;
  isSold: boolean;
  rating?: string; // A+, B, etc.
  dateCreated: string;
}

export interface LeaderboardEntry {
  id: string;
  name: string;
  rep: number;
  cash: number;
  wins: number;
  losses: number;
  streak: number;
  avatar: AvatarConfig;
  isUser?: boolean;
  bio?: string;
}

export interface BattleRound {
  id: string;
  opponentId: string;
  opponentName: string;
  stake: number;
  roundsCount: number;
  currentRound: number;
  userVerses: string[];
  opponentVerses: string[];
  userScores: number[];
  opponentScores: number[];
  beatId?: string;
  status: 'pending_input' | 'ai_responding' | 'completed';
  winner?: 'user' | 'opponent' | 'tie';
}

export interface AIResponse {
  verse: string;
  score: number;
  critique: string;
  winner?: 'user' | 'opponent' | 'tie';
}
