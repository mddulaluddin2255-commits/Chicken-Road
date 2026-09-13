export type GameState =
  | 'HOME'
  | 'READY'
  | 'STARTING'
  | 'PLAYING'
  | 'CHECKPOINT'
  | 'CLAIMED'
  | 'CRASHED'
  | 'GAME_OVER'
  | 'AD_LOADING'
  | 'AD_PLAYING'
  | 'AD_COMPLETED';

export type NavTab = 'GAME' | 'LEADERBOARD' | 'PROFILE';

export interface UserProfile {
  id: string;
  username: string;
  points: number;
  bestMultiplier: number;
  gamesPlayed: number;
  totalPointsEarned: number;
  weeklyScore: number;
  createdAt: string;
  history: GameHistoryItem[];
}

export interface GameHistoryItem {
  id: string;
  timestamp: number;
  result: 'CLAIMED' | 'CRASHED';
  cost: number;
  multiplier: number;
  pointsWon: number;
  lanesCompleted: number;
}

export interface LeaderboardEntry {
  id: string;
  rank: number;
  username: string;
  points: number;
  bestMultiplier: number;
  gamesPlayed: number;
  weeklyScore: number;
  isCurrentUser?: boolean;
}

export type LaneType = 'START_SIDEWALK' | 'ROAD' | 'MEDIAN_SAFE' | 'HIGHWAY' | 'FINISH_SAFE';

export interface LaneDefinition {
  index: number;
  type: LaneType;
  multiplier: number;
  name: string;
  vehicleSpeed?: number;
  vehicleDirection?: 1 | -1;
  vehicleFrequency?: number; // seconds between vehicles
  vehicleTypes?: ('car' | 'taxi' | 'truck' | 'bus' | 'sports' | 'van')[];
}
