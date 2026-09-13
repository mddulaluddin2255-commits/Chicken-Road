import React from 'react';
import { Volume2, VolumeX, Trophy, User, Gamepad2, Coins } from 'lucide-react';
import { NavTab } from '../types';
import { playClickSound } from '../utils/audio';

interface NavbarProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  balance: number;
  isMuted: boolean;
  onToggleMute: () => void;
  username: string;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onSelectTab,
  balance,
  isMuted,
  onToggleMute,
  username,
}) => {
  const handleTab = (tab: NavTab) => {
    playClickSound();
    onSelectTab(tab);
  };

  return (
    <header
      id="game-header-navbar"
      className="sticky top-0 z-40 w-full bg-slate-950/90 backdrop-blur-md border-b border-slate-800 shadow-md"
    >
      <div className="max-w-4xl mx-auto px-3 sm:px-4 py-2.5 flex flex-col gap-2">
        {/* Top Row: Logo, Balance, Sound Toggle */}
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div
            onClick={() => handleTab('GAME')}
            className="flex items-center gap-2 cursor-pointer group"
          >
            <span className="text-2xl sm:text-3xl filter drop-shadow group-hover:scale-110 transition">
              🐔
            </span>
            <div className="flex flex-col">
              <h1 className="text-sm sm:text-base font-black tracking-wider text-white uppercase flex items-center gap-1.5">
                CHICKEN ROAD <span className="text-emerald-400">POINTS</span>
              </h1>
              <span className="text-[10px] font-semibold text-slate-400 tracking-wide">
                Virtual Arcade Crossing
              </span>
            </div>
          </div>

          {/* Right Section: Balance & Audio */}
          <div className="flex items-center gap-2">
            {/* Prominent Balance Badge */}
            <div
              id="user-balance-badge"
              className="bg-amber-500/10 border border-amber-500/40 rounded-xl px-2.5 sm:px-3.5 py-1.5 flex items-center gap-1.5 shadow-sm gold-glow"
            >
              <Coins className="w-4 h-4 text-amber-400 fill-amber-400/20" />
              <div className="flex flex-col sm:flex-row sm:items-baseline sm:gap-1">
                <span className="text-[10px] text-amber-300 font-bold uppercase tracking-wider hidden sm:inline">
                  Balance:
                </span>
                <span className="text-sm sm:text-base font-black text-amber-300 font-mono-numbers">
                  {balance.toLocaleString()}
                </span>
                <span className="text-[10px] text-amber-400/80 font-bold">PTS</span>
              </div>
            </div>

            {/* Audio Toggle */}
            <button
              id="navbar-mute-toggle"
              onClick={() => {
                playClickSound();
                onToggleMute();
              }}
              className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 transition"
              title={isMuted ? 'Unmute Audio' : 'Mute Audio'}
            >
              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Bottom Navigation Tabs: GAME | LEADERBOARD | PROFILE */}
        <nav className="flex items-center justify-between bg-slate-900/90 p-1 rounded-xl border border-slate-800">
          <button
            id="nav-tab-game"
            onClick={() => handleTab('GAME')}
            className={`flex-1 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition ${
              currentTab === 'GAME'
                ? 'bg-emerald-500 text-slate-950 shadow-sm font-black'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Gamepad2 className="w-3.5 h-3.5" />
            <span>GAME</span>
          </button>

          <button
            id="nav-tab-leaderboard"
            onClick={() => handleTab('LEADERBOARD')}
            className={`flex-1 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition ${
              currentTab === 'LEADERBOARD'
                ? 'bg-emerald-500 text-slate-950 shadow-sm font-black'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Trophy className="w-3.5 h-3.5" />
            <span>LEADERBOARD</span>
          </button>

          <button
            id="nav-tab-profile"
            onClick={() => handleTab('PROFILE')}
            className={`flex-1 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition ${
              currentTab === 'PROFILE'
                ? 'bg-emerald-500 text-slate-950 shadow-sm font-black'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span className="truncate max-w-[80px] sm:max-w-none">{username || 'PROFILE'}</span>
          </button>
        </nav>
      </div>
    </header>
  );
};
