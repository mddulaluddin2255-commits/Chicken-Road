import React from 'react';
import { Play, DollarSign, Footprints, Video, AlertTriangle } from 'lucide-react';
import { GameState } from '../types';
import { ROUND_COST } from '../utils/storage';
import { playClickSound } from '../utils/audio';

interface GameControlsProps {
  gameState: GameState;
  balance: number;
  currentMultiplier: number;
  roundPoints: number;
  currentLane: number;
  canAdvance: boolean;
  onStartGame: () => void;
  onStepForward: () => void;
  onClaimPoints: () => void;
  onOpenRewardedAd: () => void;
  onResetToReady: () => void;
}

export const GameControls: React.FC<GameControlsProps> = ({
  gameState,
  balance,
  currentMultiplier,
  roundPoints,
  onStartGame,
  onStepForward,
  onClaimPoints,
  onOpenRewardedAd,
  onResetToReady,
}) => {
  const hasEnoughPoints = balance >= ROUND_COST;
  const isPlaying = gameState === 'PLAYING';
  const isCrashed = gameState === 'CRASHED';
  const isClaimed = gameState === 'CLAIMED';

  const handleStart = () => {
    playClickSound();
    onStartGame();
  };

  const handleStep = () => {
    playClickSound();
    onStepForward();
  };

  const handleClaim = () => {
    playClickSound();
    onClaimPoints();
  };

  const handleAdClick = () => {
    playClickSound();
    onOpenRewardedAd();
  };

  return (
    <div id="game-controls-container" className="flex flex-col gap-3.5 w-full">
      {/* 1. Multiplier & Round Points Separate UI Cards */}
      <div className="grid grid-cols-2 gap-3">
        {/* Card 1: Current Multiplier */}
        <div
          id="current-multiplier-card"
          className="bg-slate-900/90 border border-slate-800 rounded-2xl p-3.5 flex flex-col justify-between shadow-lg relative overflow-hidden"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Current Multiplier
            </span>
            <span className="text-xs font-bold px-1.5 py-0.5 rounded bg-sky-500/10 text-sky-400 border border-sky-500/30">
              {isPlaying ? 'ACTIVE' : 'READY'}
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-3xl sm:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-cyan-300 font-mono-numbers">
              {currentMultiplier.toFixed(2)}x
            </span>
          </div>
          <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
            <div
              className="bg-gradient-to-r from-sky-500 to-cyan-400 h-full transition-all duration-300"
              style={{ width: `${Math.min(100, (currentMultiplier / 50) * 100)}%` }}
            />
          </div>
        </div>

        {/* Card 2: Current Round Points */}
        <div
          id="current-round-points-card"
          className={`border rounded-2xl p-3.5 flex flex-col justify-between shadow-lg relative overflow-hidden transition ${
            isPlaying
              ? 'bg-amber-950/30 border-amber-500/50 gold-glow'
              : 'bg-slate-900/90 border-slate-800'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Round Points
            </span>
            <span className="text-xs font-bold px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/30">
              VIRTUAL
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-3xl sm:text-4xl font-black text-amber-400 font-mono-numbers drop-shadow">
              {roundPoints}
            </span>
            <span className="text-xs font-bold text-amber-300/80">PTS</span>
          </div>
          <span className="text-[11px] text-slate-400 mt-2 truncate">
            {isPlaying ? 'Claim before crash!' : '20 pts entry per round'}
          </span>
        </div>
      </div>

      {/* 2. Insufficient Points Warning Message Banner */}
      {!hasEnoughPoints && !isPlaying && (
        <div
          id="insufficient-points-banner"
          className="bg-rose-950/60 border border-rose-600/40 rounded-xl p-3 flex items-start gap-2.5 text-rose-200 text-xs sm:text-sm animate-pulse"
        >
          <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-bold">Not enough points. Watch an ad to earn +200 points.</p>
            <p className="text-[11px] text-rose-300/80 mt-0.5">
              Round requires 20 Virtual Points to start.
            </p>
          </div>
        </div>
      )}

      {/* 3. Primary Game Action Controls */}
      <div className="flex flex-col gap-2.5">
        {!isPlaying && !isCrashed && !isClaimed && (
          <button
            id="start-game-btn"
            onClick={handleStart}
            disabled={!hasEnoughPoints}
            className={`w-full py-4 px-6 rounded-2xl font-black text-base sm:text-lg tracking-wider uppercase flex items-center justify-center gap-2.5 shadow-xl transition active:scale-[0.98] ${
              hasEnoughPoints
                ? 'bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-400 hover:to-green-500 text-slate-950 shadow-emerald-500/25 cursor-pointer'
                : 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
            }`}
          >
            <Play className="w-6 h-6 fill-current" />
            <span>START GAME (-20 POINTS)</span>
          </button>
        )}

        {/* In-Game Action Buttons: CROSS TO NEXT LANE & CLAIM POINTS */}
        {isPlaying && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {/* Cross to Next Lane */}
            <button
              id="step-forward-btn"
              onClick={handleStep}
              className="w-full py-3.5 px-4 rounded-2xl font-black text-sm sm:text-base tracking-wider uppercase flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 shadow-lg shadow-emerald-500/25 active:scale-95 transition cursor-pointer"
            >
              <Footprints className="w-5 h-5" />
              <span>CROSS NEXT LANE</span>
            </button>

            {/* Claim Points */}
            <button
              id="claim-points-btn"
              onClick={handleClaim}
              className="w-full py-3.5 px-4 rounded-2xl font-black text-sm sm:text-base tracking-wider uppercase flex items-center justify-center gap-2 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 shadow-lg shadow-amber-500/30 active:scale-95 transition cursor-pointer"
            >
              <DollarSign className="w-5 h-5 stroke-[3]" />
              <span>CLAIM {roundPoints} POINTS</span>
            </button>
          </div>
        )}

        {/* Round Over - Crashed State Banner & Play Again */}
        {isCrashed && (
          <div
            id="round-crashed-banner"
            className="bg-slate-900 border border-rose-500/50 rounded-2xl p-4 flex flex-col items-center gap-3 text-center shadow-xl animate-fadeIn"
          >
            <div className="w-12 h-12 rounded-full bg-rose-500/20 border border-rose-500 flex items-center justify-center text-2xl">
              💥
            </div>
            <div>
              <h4 className="text-xl font-black text-rose-400 uppercase tracking-wide">
                ROUND OVER!
              </h4>
              <p className="text-xs text-slate-300 mt-1">
                The chicken was hit by a speeding vehicle. Unclaimed points were lost!
              </p>
            </div>
            <button
              id="try-again-btn"
              onClick={onResetToReady}
              className="w-full py-3 px-6 rounded-xl font-black text-sm tracking-wider uppercase bg-slate-800 hover:bg-slate-700 text-white border border-slate-600 transition"
            >
              PLAY AGAIN
            </button>
          </div>
        )}

        {/* Round Won - Claimed State Banner */}
        {isClaimed && (
          <div
            id="round-claimed-banner"
            className="bg-slate-900 border border-emerald-500/50 rounded-2xl p-4 flex flex-col items-center gap-3 text-center shadow-xl animate-fadeIn"
          >
            <div className="w-12 h-12 rounded-full bg-emerald-500/20 border border-emerald-400 flex items-center justify-center text-2xl">
              🎉
            </div>
            <div>
              <h4 className="text-xl font-black text-emerald-400 uppercase tracking-wide">
                POINTS SECURED!
              </h4>
              <p className="text-base font-black text-amber-400 font-mono-numbers mt-0.5">
                +{roundPoints} Virtual Points Added to Balance
              </p>
            </div>
            <button
              id="continue-next-round-btn"
              onClick={onResetToReady}
              className="w-full py-3 px-6 rounded-xl font-black text-sm tracking-wider uppercase bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold transition"
            >
              START NEXT ROUND
            </button>
          </div>
        )}

        {/* Rewarded Video Ad Button (Location 1) */}
        <button
          id="watch-rewarded-ad-btn"
          onClick={handleAdClick}
          className="w-full py-3.5 px-4 rounded-2xl font-black text-sm sm:text-base tracking-wider uppercase flex items-center justify-center gap-2 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white border border-amber-400/40 shadow-lg shadow-amber-900/30 active:scale-[0.98] transition cursor-pointer"
        >
          <Video className="w-5 h-5 text-amber-200" />
          <span>WATCH AD +200 POINTS</span>
        </button>
      </div>
    </div>
  );
};
