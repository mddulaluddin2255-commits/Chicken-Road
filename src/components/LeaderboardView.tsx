import React from 'react';
import { Trophy, Award, Flame, Hash, Gamepad2 } from 'lucide-react';
import { LeaderboardEntry } from '../types';

interface LeaderboardViewProps {
  entries: LeaderboardEntry[];
  currentUserId: string;
}

export const LeaderboardView: React.FC<LeaderboardViewProps> = ({ entries, currentUserId }) => {
  return (
    <div id="leaderboard-view-container" className="flex flex-col gap-4 w-full animate-fadeIn">
      {/* Top Banner Requirement */}
      <div className="bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 rounded-2xl p-4 sm:p-5 text-center shadow-lg relative overflow-hidden">
        <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 mb-2">
          <Trophy className="w-8 h-8" />
        </div>
        <h2 className="text-xl sm:text-2xl font-black uppercase tracking-wider text-white">
          VIRTUAL POINTS LEADERBOARD
        </h2>
        <p className="text-xs font-bold text-amber-400/90 tracking-wide uppercase mt-1">
          No Real-Money Value
        </p>
        <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
          Compete against players worldwide by crossing lanes, timing your claims, and maximizing your virtual points!
        </p>
      </div>

      {/* Top 3 Podium Highlights */}
      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        {/* 2nd Place */}
        {entries[1] && (
          <div className="bg-slate-900/80 border border-slate-700/60 rounded-2xl p-3 flex flex-col items-center text-center justify-end relative shadow">
            <span className="text-2xl mb-1">🥈</span>
            <span className="text-[10px] font-bold text-slate-400 uppercase">2nd Place</span>
            <p className="text-xs sm:text-sm font-black text-white truncate max-w-full">
              {entries[1].username}
            </p>
            <p className="text-xs font-black text-amber-400 font-mono-numbers mt-0.5">
              {entries[1].points.toLocaleString()} PTS
            </p>
            <span className="text-[10px] text-slate-500 mt-1">{entries[1].bestMultiplier}x Best</span>
          </div>
        )}

        {/* 1st Place */}
        {entries[0] && (
          <div className="bg-amber-950/30 border border-amber-500/50 rounded-2xl p-3 sm:p-4 flex flex-col items-center text-center justify-end relative shadow-lg gold-glow scale-105">
            <span className="text-3xl mb-1 animate-bounce">🥇</span>
            <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider">
              CHAMPION
            </span>
            <p className="text-sm sm:text-base font-black text-white truncate max-w-full">
              {entries[0].username}
            </p>
            <p className="text-sm sm:text-base font-black text-amber-300 font-mono-numbers mt-0.5">
              {entries[0].points.toLocaleString()} PTS
            </p>
            <span className="text-[11px] text-amber-400/80 font-bold mt-1">
              {entries[0].bestMultiplier}x Best
            </span>
          </div>
        )}

        {/* 3rd Place */}
        {entries[2] && (
          <div className="bg-slate-900/80 border border-slate-700/60 rounded-2xl p-3 flex flex-col items-center text-center justify-end relative shadow">
            <span className="text-2xl mb-1">🥉</span>
            <span className="text-[10px] font-bold text-slate-400 uppercase">3rd Place</span>
            <p className="text-xs sm:text-sm font-black text-white truncate max-w-full">
              {entries[2].username}
            </p>
            <p className="text-xs font-black text-amber-400 font-mono-numbers mt-0.5">
              {entries[2].points.toLocaleString()} PTS
            </p>
            <span className="text-[10px] text-slate-500 mt-1">{entries[2].bestMultiplier}x Best</span>
          </div>
        )}
      </div>

      {/* Leaderboard Table List */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="px-4 py-3 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between text-xs font-bold text-slate-400 uppercase tracking-wider">
          <div className="flex items-center gap-3">
            <span className="w-8 text-center">Rank</span>
            <span>Player</span>
          </div>
          <div className="flex items-center gap-4 sm:gap-6">
            <span className="hidden sm:inline">Best</span>
            <span className="hidden md:inline">Games</span>
            <span className="text-right">Total Points</span>
          </div>
        </div>

        <div className="divide-y divide-slate-800/80 max-h-[460px] overflow-y-auto">
          {entries.map((entry) => {
            const isUser = entry.id === currentUserId || entry.isCurrentUser;

            let rankBadge = (
              <span className="w-7 h-7 rounded-lg bg-slate-800 flex items-center justify-center font-bold text-xs text-slate-300">
                #{entry.rank}
              </span>
            );

            if (entry.rank === 1) rankBadge = <span className="text-lg">🥇</span>;
            if (entry.rank === 2) rankBadge = <span className="text-lg">🥈</span>;
            if (entry.rank === 3) rankBadge = <span className="text-lg">🥉</span>;

            return (
              <div
                key={entry.id}
                className={`px-3 sm:px-4 py-3 flex items-center justify-between transition ${
                  isUser
                    ? 'bg-emerald-500/10 border-l-4 border-emerald-400 text-white'
                    : 'hover:bg-slate-800/50'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-7 flex items-center justify-center shrink-0">{rankBadge}</div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-xs sm:text-sm font-bold truncate flex items-center gap-1.5">
                      {entry.username}
                      {isUser && (
                        <span className="px-1.5 py-0.2 text-[9px] bg-emerald-500/20 text-emerald-300 rounded border border-emerald-500/40">
                          YOU
                        </span>
                      )}
                    </span>
                    <span className="text-[10px] text-slate-400 sm:hidden">
                      {entry.bestMultiplier}x • {entry.gamesPlayed} games
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-4 sm:gap-6 shrink-0">
                  <span className="text-xs font-mono font-semibold text-sky-400 hidden sm:inline">
                    {entry.bestMultiplier.toFixed(2)}x
                  </span>
                  <span className="text-xs font-mono text-slate-400 hidden md:inline">
                    {entry.gamesPlayed}
                  </span>
                  <div className="flex flex-col items-end">
                    <span className="text-xs sm:text-sm font-black text-amber-400 font-mono-numbers">
                      {entry.points.toLocaleString()}
                    </span>
                    <span className="text-[9px] text-slate-400">Virtual Pts</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
