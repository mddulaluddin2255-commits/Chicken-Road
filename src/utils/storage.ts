import { UserProfile, LeaderboardEntry, GameHistoryItem } from '../types';

const STORAGE_USER_KEY = 'crp_user_profile_v1';
const STORAGE_LEADERBOARD_KEY = 'crp_leaderboard_v1';
const CLAIMED_AD_TOKENS_KEY = 'crp_claimed_ad_tokens_v1';

export const STARTING_POINTS = 200;
export const ROUND_COST = 20;
export const AD_REWARD_POINTS = 200;

const DEFAULT_LEADERBOARD: LeaderboardEntry[] = [
  { id: 'bot_1', rank: 1, username: 'ChickenKing', points: 12450, bestMultiplier: 35.0, gamesPlayed: 142, weeklyScore: 6800 },
  { id: 'bot_2', rank: 2, username: 'RoadMaster', points: 10820, bestMultiplier: 20.0, gamesPlayed: 118, weeklyScore: 5400 },
  { id: 'bot_3', rank: 3, username: 'PixelRooster', points: 9750, bestMultiplier: 20.0, gamesPlayed: 96, weeklyScore: 4950 },
  { id: 'bot_4', rank: 4, username: 'LuckyFeather', points: 8340, bestMultiplier: 12.0, gamesPlayed: 85, weeklyScore: 4100 },
  { id: 'bot_5', rank: 5, username: 'HighwayHero', points: 7620, bestMultiplier: 12.0, gamesPlayed: 79, weeklyScore: 3600 },
  { id: 'bot_6', rank: 6, username: 'TurboCluck', points: 6490, bestMultiplier: 8.0, gamesPlayed: 64, weeklyScore: 3100 },
  { id: 'bot_7', rank: 7, username: 'CrossyDodge', points: 5880, bestMultiplier: 8.0, gamesPlayed: 58, weeklyScore: 2850 },
  { id: 'bot_8', rank: 8, username: 'Eggcelent99', points: 4920, bestMultiplier: 5.0, gamesPlayed: 52, weeklyScore: 2400 },
  { id: 'bot_9', rank: 9, username: 'TrafficNinja', points: 4100, bestMultiplier: 5.0, gamesPlayed: 45, weeklyScore: 2100 },
  { id: 'bot_10', rank: 10, username: 'SpeedyBeak', points: 3450, bestMultiplier: 3.0, gamesPlayed: 38, weeklyScore: 1750 },
];

/**
 * Creates or gets the active user profile.
 * Every newly registered player strictly starts with 200 Virtual Points.
 */
export function getOrCreateUserProfile(): UserProfile {
  if (typeof window === 'undefined') {
    return createNewProfile('Player_' + Math.floor(1000 + Math.random() * 9000));
  }

  try {
    const raw = localStorage.getItem(STORAGE_USER_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed.points === 'number') {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Error loading user profile:', e);
  }

  const newProfile = createNewProfile('Player_' + Math.floor(1000 + Math.random() * 9000));
  saveUserProfile(newProfile);
  return newProfile;
}

export function createNewProfile(username: string): UserProfile {
  return {
    id: 'usr_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
    username: username.trim() || 'Player_' + Math.floor(1000 + Math.random() * 9000),
    points: STARTING_POINTS, // Strictly 200 points
    bestMultiplier: 1.0,
    gamesPlayed: 0,
    totalPointsEarned: 0,
    weeklyScore: 0,
    createdAt: new Date().toISOString(),
    history: [],
  };
}

export function saveUserProfile(profile: UserProfile): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_USER_KEY, JSON.stringify(profile));
    syncLeaderboard(profile);
  } catch (e) {
    console.error('Error saving user profile:', e);
  }
}

/**
 * Deducts 20 points to start a round.
 * Returns true if successful, false if insufficient points.
 */
export function deductRoundCost(profile: UserProfile): { success: boolean; updatedProfile: UserProfile } {
  if (profile.points < ROUND_COST) {
    return { success: false, updatedProfile: profile };
  }

  const updated: UserProfile = {
    ...profile,
    points: Math.max(0, profile.points - ROUND_COST),
    gamesPlayed: profile.gamesPlayed + 1,
  };

  saveUserProfile(updated);
  return { success: true, updatedProfile: updated };
}

/**
 * Records claimed round points.
 */
export function recordRoundClaim(
  profile: UserProfile,
  roundPoints: number,
  multiplier: number,
  lanesCompleted: number
): UserProfile {
  const historyItem: GameHistoryItem = {
    id: 'rnd_' + Date.now(),
    timestamp: Date.now(),
    result: 'CLAIMED',
    cost: ROUND_COST,
    multiplier,
    pointsWon: roundPoints,
    lanesCompleted,
  };

  const updated: UserProfile = {
    ...profile,
    points: profile.points + roundPoints,
    totalPointsEarned: profile.totalPointsEarned + roundPoints,
    weeklyScore: profile.weeklyScore + roundPoints,
    bestMultiplier: Math.max(profile.bestMultiplier, multiplier),
    history: [historyItem, ...(profile.history || []).slice(0, 49)],
  };

  saveUserProfile(updated);
  return updated;
}

/**
 * Records round crash. Unclaimed round points are lost.
 */
export function recordRoundCrash(
  profile: UserProfile,
  multiplier: number,
  lanesCompleted: number
): UserProfile {
  const historyItem: GameHistoryItem = {
    id: 'rnd_' + Date.now(),
    timestamp: Date.now(),
    result: 'CRASHED',
    cost: ROUND_COST,
    multiplier,
    pointsWon: 0,
    lanesCompleted,
  };

  const updated: UserProfile = {
    ...profile,
    bestMultiplier: Math.max(profile.bestMultiplier, multiplier),
    history: [historyItem, ...(profile.history || []).slice(0, 49)],
  };

  saveUserProfile(updated);
  return updated;
}

/**
 * Awards +200 points for a successfully completed rewarded video ad.
 * Includes token deduplication to prevent duplicate reward calls.
 */
export function awardAdRewardPoints(
  profile: UserProfile,
  rewardToken: string
): { success: boolean; updatedProfile: UserProfile; reason?: string } {
  if (typeof window === 'undefined') {
    return { success: false, updatedProfile: profile, reason: 'Invalid context' };
  }

  try {
    const rawTokens = localStorage.getItem(CLAIMED_AD_TOKENS_KEY);
    const tokens: string[] = rawTokens ? JSON.parse(rawTokens) : [];

    if (tokens.includes(rewardToken)) {
      return { success: false, updatedProfile: profile, reason: 'Reward already claimed for this ad.' };
    }

    tokens.push(rewardToken);
    localStorage.setItem(CLAIMED_AD_TOKENS_KEY, JSON.stringify(tokens.slice(-100)));

    const updated: UserProfile = {
      ...profile,
      points: profile.points + AD_REWARD_POINTS,
      totalPointsEarned: profile.totalPointsEarned + AD_REWARD_POINTS,
      weeklyScore: profile.weeklyScore + AD_REWARD_POINTS,
    };

    saveUserProfile(updated);
    return { success: true, updatedProfile: updated };
  } catch (e) {
    console.error('Error awarding ad points:', e);
    return { success: false, updatedProfile: profile, reason: 'Storage error' };
  }
}

/**
 * Gets leaderboard entries merged with current user.
 */
export function getLeaderboard(): LeaderboardEntry[] {
  if (typeof window === 'undefined') return DEFAULT_LEADERBOARD;

  let baseList = [...DEFAULT_LEADERBOARD];
  try {
    const raw = localStorage.getItem(STORAGE_LEADERBOARD_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        baseList = parsed;
      }
    }
  } catch (e) {
    console.error('Error loading leaderboard:', e);
  }

  // Inject current user
  const currentUser = getOrCreateUserProfile();
  const userScore = currentUser.points;

  // Filter out existing user entry if present
  baseList = baseList.filter((entry) => entry.id !== currentUser.id);

  // Add user entry
  baseList.push({
    id: currentUser.id,
    rank: 0,
    username: currentUser.username,
    points: userScore,
    bestMultiplier: currentUser.bestMultiplier,
    gamesPlayed: currentUser.gamesPlayed,
    weeklyScore: currentUser.weeklyScore,
    isCurrentUser: true,
  });

  // Sort descending by points
  baseList.sort((a, b) => b.points - a.points);

  // Assign ranks
  return baseList.map((item, index) => ({
    ...item,
    rank: index + 1,
  }));
}

export function syncLeaderboard(user: UserProfile) {
  if (typeof window === 'undefined') return;
  try {
    const full = getLeaderboard();
    localStorage.setItem(STORAGE_LEADERBOARD_KEY, JSON.stringify(full.slice(0, 50)));
  } catch {
    // ignore
  }
}
