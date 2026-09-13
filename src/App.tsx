/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Navbar } from './components/Navbar';
import { GameCanvas, LANES } from './components/GameCanvas';
import { GameControls } from './components/GameControls';
import { SponsoredVideoCard } from './components/SponsoredVideoCard';
import { LeaderboardView } from './components/LeaderboardView';
import { ProfileView } from './components/ProfileView';
import { VastVideoModal } from './components/VastVideoModal';
import { AuthModal } from './components/AuthModal';
import { GameState, NavTab, UserProfile, LeaderboardEntry } from './types';
import {
  getOrCreateUserProfile,
  saveUserProfile,
  deductRoundCost,
  recordRoundClaim,
  recordRoundCrash,
  awardAdRewardPoints,
  getLeaderboard,
  createNewProfile,
  ROUND_COST,
} from './utils/storage';
import { playStartSound, playClickSound, setMuted, getMuted } from './utils/audio';

export default function App() {
  // Navigation & Game State
  const [currentTab, setCurrentTab] = useState<NavTab>('GAME');
  const [gameState, setGameState] = useState<GameState>('READY');
  const [currentLane, setCurrentLane] = useState<number>(0);
  const [currentMultiplier, setCurrentMultiplier] = useState<number>(1.0);
  const [roundPoints, setRoundPoints] = useState<number>(20);

  // User Profile & Leaderboard
  const [userProfile, setUserProfile] = useState<UserProfile>(() => getOrCreateUserProfile());
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>(() => getLeaderboard());
  const [isAudioMuted, setIsAudioMuted] = useState<boolean>(() => getMuted());

  // Modals & Popups
  const [isRewardedAdOpen, setIsRewardedAdOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'info' | 'warn' } | null>(null);

  // Sync leaderboard when profile changes
  const refreshLeaderboard = useCallback(() => {
    setLeaderboard(getLeaderboard());
  }, []);

  useEffect(() => {
    refreshLeaderboard();
  }, [userProfile, refreshLeaderboard]);

  const showToast = (text: string, type: 'success' | 'info' | 'warn' = 'info') => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  const handleToggleMute = () => {
    const next = !isAudioMuted;
    setIsAudioMuted(next);
    setMuted(next);
  };

  // 1. Start Game Handler (-20 Virtual Points)
  const handleStartGame = () => {
    if (userProfile.points < ROUND_COST) {
      showToast('Not enough points. Watch an ad to earn +200 points.', 'warn');
      return;
    }

    const { success, updatedProfile } = deductRoundCost(userProfile);
    if (!success) {
      showToast('Not enough points to start round.', 'warn');
      return;
    }

    setUserProfile(updatedProfile);
    setCurrentLane(0);
    setCurrentMultiplier(1.0);
    setRoundPoints(ROUND_COST); // starts with 20 points
    setGameState('STARTING');
    playStartSound();

    showToast(`Round started! -${ROUND_COST} Points`, 'info');

    setTimeout(() => {
      setGameState('PLAYING');
    }, 300);
  };

  // 2. Step Forward Handler
  const handleStepForward = () => {
    if (gameState !== 'PLAYING') return;

    const nextLaneIdx = currentLane + 1;
    if (nextLaneIdx >= LANES.length) {
      handleVictory();
      return;
    }

    // Trigger step in canvas
    const canvasContainer = document.getElementById('chicken-road-canvas-container');
    if (canvasContainer) {
      canvasContainer.click();
    }
  };

  // 3. Step complete callback from Canvas (Successful hop into safe or road lane)
  const handleCanvasStepComplete = (newLane: number) => {
    setCurrentLane(newLane);
    const laneDef = LANES[newLane];
    const multiplier = laneDef?.multiplier ?? 1.0;
    setCurrentMultiplier(multiplier);

    // Calculate round points (20 base * multiplier)
    const points = Math.round(ROUND_COST * multiplier);
    setRoundPoints(points);

    if (laneDef?.type === 'MEDIAN_SAFE') {
      setGameState('CHECKPOINT');
      setTimeout(() => {
        setGameState('PLAYING');
      }, 500);
    }
  };

  // 4. Crash callback from Canvas
  const handleCanvasCrash = (crashLane: number) => {
    setGameState('CRASHED');
    const updated = recordRoundCrash(userProfile, currentMultiplier, crashLane);
    setUserProfile(updated);
    refreshLeaderboard();
    showToast('Hit by a speeding car! Round points lost.', 'warn');
  };

  // 5. Ultimate Finish Line Victory
  const handleVictory = () => {
    const finalMultiplier = 50.0;
    const finalPoints = Math.round(ROUND_COST * finalMultiplier); // 1,000 pts
    setCurrentMultiplier(finalMultiplier);
    setRoundPoints(finalPoints);
    setGameState('CLAIMED');

    const updated = recordRoundClaim(userProfile, finalPoints, finalMultiplier, LANES.length - 1);
    setUserProfile(updated);
    refreshLeaderboard();
    showToast(`🏆 GRAND VICTORY! +${finalPoints} Virtual Points Added!`, 'success');
  };

  // 6. Claim Points Handler
  const handleClaimPoints = () => {
    if (gameState !== 'PLAYING' && gameState !== 'CHECKPOINT') return;

    setGameState('CLAIMED');
    const updated = recordRoundClaim(userProfile, roundPoints, currentMultiplier, currentLane);
    setUserProfile(updated);
    refreshLeaderboard();
    showToast(`Secured! +${roundPoints} Virtual Points added to your balance.`, 'success');
  };

  // 7. Reset to Ready
  const handleResetToReady = () => {
    setGameState('READY');
    setCurrentLane(0);
    setCurrentMultiplier(1.0);
    setRoundPoints(ROUND_COST);
  };

  // 8. Rewarded Ad Completion Handler (+200 Points)
  const handleAdRewardEarned = (token: string) => {
    const result = awardAdRewardPoints(userProfile, token);
    if (result.success) {
      setUserProfile(result.updatedProfile);
      refreshLeaderboard();
      showToast('AD COMPLETED! +200 Virtual Points Added to Balance!', 'success');
    } else {
      showToast(result.reason || 'Reward already claimed.', 'info');
    }
  };

  // 9. Profile Handlers
  const handleUpdateUsername = (newName: string) => {
    const updated: UserProfile = {
      ...userProfile,
      username: newName,
    };
    saveUserProfile(updated);
    setUserProfile(updated);
    refreshLeaderboard();
    showToast(`Username updated to ${newName}`, 'success');
  };

  const handleCreateOrSwitchAccount = (newUsername: string) => {
    const freshProfile = createNewProfile(newUsername);
    saveUserProfile(freshProfile);
    setUserProfile(freshProfile);
    refreshLeaderboard();
    handleResetToReady();
    showToast(`Welcome, ${freshProfile.username}! 200 Virtual Points credited.`, 'success');
  };

  // Calculate current user's rank
  const currentUserEntry = leaderboard.find((e) => e.id === userProfile.id || e.isCurrentUser);
  const userRank = currentUserEntry ? currentUserEntry.rank : 1;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between selection:bg-emerald-500 selection:text-slate-950">
      {/* Top Navbar */}
      <Navbar
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        balance={userProfile.points}
        isMuted={isAudioMuted}
        onToggleMute={handleToggleMute}
        username={userProfile.username}
      />

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-4xl mx-auto px-3 sm:px-4 py-3 sm:py-5 flex flex-col gap-4">
        {/* Toast Notification Banner */}
        {toastMessage && (
          <div
            className={`fixed top-16 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold shadow-2xl border backdrop-blur-md animate-bounce flex items-center gap-2 ${
              toastMessage.type === 'success'
                ? 'bg-emerald-950/90 text-emerald-200 border-emerald-500/80 shadow-emerald-900/50'
                : toastMessage.type === 'warn'
                ? 'bg-rose-950/90 text-rose-200 border-rose-500/80 shadow-rose-900/50'
                : 'bg-slate-900/90 text-slate-200 border-slate-700 shadow-black'
            }`}
          >
            <span>{toastMessage.text}</span>
          </div>
        )}

        {/* Tab 1: GAMEPLAY */}
        {currentTab === 'GAME' && (
          <div className="flex flex-col gap-4">
            {/* Top Game Stage Container */}
            <div className="flex flex-col gap-3">
              {/* Chicken Road Canvas */}
              <GameCanvas
                gameState={gameState}
                currentLane={currentLane}
                onStepComplete={handleCanvasStepComplete}
                onCrash={handleCanvasCrash}
                onVictory={handleVictory}
              />

              {/* Game Controls & Multiplier Cards */}
              <GameControls
                gameState={gameState}
                balance={userProfile.points}
                currentMultiplier={currentMultiplier}
                roundPoints={roundPoints}
                currentLane={currentLane}
                canAdvance={gameState === 'PLAYING'}
                onStartGame={handleStartGame}
                onStepForward={handleStepForward}
                onClaimPoints={handleClaimPoints}
                onOpenRewardedAd={() => setIsRewardedAdOpen(true)}
                onResetToReady={handleResetToReady}
              />
            </div>

            {/* AD LOCATION 2: In-Game Sponsored Video Stream Card */}
            <div className="pt-2">
              <SponsoredVideoCard />
            </div>
          </div>
        )}

        {/* Tab 2: LEADERBOARD */}
        {currentTab === 'LEADERBOARD' && (
          <LeaderboardView entries={leaderboard} currentUserId={userProfile.id} />
        )}

        {/* Tab 3: PROFILE */}
        {currentTab === 'PROFILE' && (
          <ProfileView
            profile={userProfile}
            leaderboardRank={userRank}
            onUpdateUsername={handleUpdateUsername}
            onResetAccount={() => setIsAuthOpen(true)}
          />
        )}
      </main>

      {/* Mandatory Responsible Gaming Disclaimer Notice */}
      <footer className="w-full bg-slate-950/90 border-t border-slate-800/80 py-3.5 px-4 text-center mt-auto">
        <div className="max-w-4xl mx-auto flex flex-col items-center gap-1 text-[11px] text-slate-400">
          <div className="flex flex-wrap items-center justify-center gap-2 font-bold text-amber-400 uppercase tracking-wider">
            <span>Virtual Points Only</span>
            <span>•</span>
            <span>No Cash Value</span>
            <span>•</span>
            <span>No Deposits</span>
            <span>•</span>
            <span>No Withdrawals</span>
          </div>
          <p className="text-slate-500 text-[10px] sm:text-[11px]">
            Chicken Road Points is an original arcade game using virtual points only. Points have no monetary equivalent and cannot be exchanged, cashed out, or redeemed.
          </p>
        </div>
      </footer>

      {/* Modals */}
      <VastVideoModal
        isOpen={isRewardedAdOpen}
        onClose={() => setIsRewardedAdOpen(false)}
        onRewardEarned={handleAdRewardEarned}
      />

      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onLoginOrCreate={handleCreateOrSwitchAccount}
      />
    </div>
  );
}
