import React, { useState } from 'react';
import { User, Shield, Trophy, Flame, History, LogOut, CheckCircle2, Edit2, Gamepad2, Coins } from 'lucide-react';
import { UserProfile, LeaderboardEntry } from '../types';
import { STARTING_POINTS } from '../utils/storage';
import { playClickSound } from '../utils/audio';

interface ProfileViewProps {
  profile: UserProfile;
  leaderboardRank: number;
  onUpdateUsername: (newName: string) => void;
  onResetAccount: () => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({
  profile,
  leaderboardRank,
  onUpdateUsername,
  onResetAccount,
}) => {
  const [editing, setEditing] = useState(false);
  const [nameInput, setNameInput] = useState(profile.username);

  const handleSaveName = (e: React.FormEvent) => {
    e.preventDefault();
    if (nameInput.trim()) {
      onUpdateUsername(nameInput.trim());
      setEditing(false);
      playClickSound();
    }
  };

  return (
    <div id="user-profile-view" className="flex flex-col gap-4 w-full animate-fadeIn">
      {/* Profile Header Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl relative overflow-hidden">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 p-0.5 shadow-lg shadow-emerald-500/20">
            <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center text-3xl">
              🐔
            </div>
          </div>

          <div className="flex-1 text-center sm:text-left">
            {editing ? (
              <form onSubmit={handleSaveName} className="flex items-center gap-2 max-w-xs mx-auto sm:mx-0">
                <input
                  type="text"
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  maxLength={18}
                  className="bg-slate-800 border border-emerald-500/60 rounded-xl px-3 py-1.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 w-full"
                />
                <button
                  type="submit"
                  className="px-3 py-1.5 bg-emerald-500 text-slate-950 text-xs font-bold rounded-xl hover:bg-emerald-400 transition"
                >
                  Save
                </button>
              </form>
            ) : (
              <div className="flex items-center justify-center sm:justify-start gap-2">
                <h3 className="text-xl font-black text-white">{profile.username}</h3>
                <button
                  onClick={() => setEditing(true)}
                  className="p-1 text-slate-400 hover:text-white transition"
                  title="Edit username"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            <p className="text-xs text-slate-400 mt-0.5">
              Player ID: <span className="font-mono text-slate-500">{profile.id}</span>
            </p>

            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mt-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/10 text-amber-300 border border-amber-500/30">
                Rank #{leaderboardRank || '—'}
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-300 border border-emerald-500/30">
                Active Player
              </span>
            </div>
          </div>

          <button
            onClick={() => {
              playClickSound();
              onResetAccount();
            }}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl text-xs font-bold flex items-center gap-1.5 border border-slate-700 transition"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Switch / New Account</span>
          </button>
        </div>
      </div>

      {/* Profile Stat Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 sm:gap-3">
        {/* Current Points */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-3.5 flex flex-col justify-between shadow">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">Current Points</span>
            <Coins className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-2xl sm:text-3xl font-black text-amber-300 font-mono-numbers mt-2">
            {profile.points.toLocaleString()}
          </p>
          <span className="text-[10px] text-slate-500 mt-1">Virtual Points</span>
        </div>

        {/* Best Multiplier */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-3.5 flex flex-col justify-between shadow">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">Best Multiplier</span>
            <Flame className="w-4 h-4 text-sky-400" />
          </div>
          <p className="text-2xl sm:text-3xl font-black text-sky-400 font-mono-numbers mt-2">
            {profile.bestMultiplier.toFixed(2)}x
          </p>
          <span className="text-[10px] text-slate-500 mt-1">Personal Record</span>
        </div>

        {/* Games Played */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-3.5 flex flex-col justify-between shadow">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">Games Played</span>
            <Gamepad2 className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-2xl sm:text-3xl font-black text-emerald-400 font-mono-numbers mt-2">
            {profile.gamesPlayed}
          </p>
          <span className="text-[10px] text-slate-500 mt-1">Rounds Finished</span>
        </div>

        {/* Total Points Earned */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-3.5 flex flex-col justify-between shadow">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">Total Earned</span>
            <Trophy className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-2xl sm:text-3xl font-black text-amber-400 font-mono-numbers mt-2">
            {profile.totalPointsEarned.toLocaleString()}
          </p>
          <span className="text-[10px] text-slate-500 mt-1">All-time points won</span>
        </div>

        {/* Weekly Score */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-3.5 flex flex-col justify-between shadow">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">Weekly Score</span>
            <Trophy className="w-4 h-4 text-purple-400" />
          </div>
          <p className="text-2xl sm:text-3xl font-black text-purple-300 font-mono-numbers mt-2">
            {profile.weeklyScore.toLocaleString()}
          </p>
          <span className="text-[10px] text-slate-500 mt-1">Current Tournament</span>
        </div>

        {/* Starting Balance Guarantee */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-3.5 flex flex-col justify-between shadow">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">Starting Bonus</span>
            <Shield className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-2xl sm:text-3xl font-black text-slate-200 font-mono-numbers mt-2">
            200 PTS
          </p>
          <span className="text-[10px] text-slate-500 mt-1">New Player Baseline</span>
        </div>
      </div>

      {/* Round History Log */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="px-4 py-3 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-slate-400" />
            <h4 className="text-xs sm:text-sm font-bold text-white uppercase tracking-wider">
              Recent Game Rounds
            </h4>
          </div>
          <span className="text-[11px] text-slate-500">
            {profile.history?.length || 0} rounds recorded
          </span>
        </div>

        <div className="divide-y divide-slate-800/80 max-h-64 overflow-y-auto">
          {(!profile.history || profile.history.length === 0) ? (
            <div className="p-6 text-center text-slate-500 text-xs">
              No game rounds recorded yet. Press START GAME to play!
            </div>
          ) : (
            profile.history.map((item) => (
              <div
                key={item.id}
                className="px-4 py-2.5 flex items-center justify-between hover:bg-slate-800/40 transition"
              >
                <div className="flex items-center gap-2.5">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      item.result === 'CLAIMED' ? 'bg-emerald-400' : 'bg-rose-500'
                    }`}
                  />
                  <div>
                    <p className="text-xs font-bold text-slate-200">
                      {item.result === 'CLAIMED' ? 'Secured Points' : 'Vehicle Crash'}
                    </p>
                    <span className="text-[10px] text-slate-500">
                      Crossed {item.lanesCompleted} lanes • {item.multiplier.toFixed(2)}x
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <span
                    className={`text-xs font-black font-mono-numbers ${
                      item.result === 'CLAIMED' ? 'text-amber-400' : 'text-slate-500'
                    }`}
                  >
                    {item.result === 'CLAIMED' ? `+${item.pointsWon} PTS` : '0 PTS'}
                  </span>
                  <p className="text-[10px] text-slate-500">-20 cost</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Responsible Gaming Notice Requirement */}
      <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 text-center">
        <p className="text-xs font-bold text-amber-400 uppercase tracking-wider">
          Virtual Points Only
        </p>
        <p className="text-xs font-semibold text-slate-300 mt-1">
          No Cash Value • No Deposits • No Withdrawals
        </p>
        <p className="text-[11px] text-slate-500 mt-1 max-w-sm mx-auto">
          This is an arcade game using virtual points only. No real money gambling or payouts of any kind are offered or possible.
        </p>
      </div>
    </div>
  );
};
