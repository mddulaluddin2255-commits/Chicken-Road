import React, { useState } from 'react';
import { X, UserPlus, LogIn, ShieldCheck, AlertCircle } from 'lucide-react';
import { STARTING_POINTS } from '../utils/storage';
import { playClickSound } from '../utils/audio';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginOrCreate: (username: string) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onLoginOrCreate,
}) => {
  const [isSignUp, setIsSignUp] = useState(true);
  const [username, setUsername] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = username.trim();
    if (!trimmed) {
      setError('Please enter a username.');
      return;
    }
    if (trimmed.length < 3) {
      setError('Username must be at least 3 characters.');
      return;
    }
    if (trimmed.length > 18) {
      setError('Username must be 18 characters or less.');
      return;
    }

    playClickSound();
    onLoginOrCreate(trimmed);
    onClose();
  };

  return (
    <div
      id="auth-account-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn"
    >
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-5 sm:p-6 overflow-hidden">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white transition"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Header */}
        <div className="text-center mb-5">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-2xl flex items-center justify-center mx-auto mb-2">
            🐔
          </div>
          <h3 className="text-xl font-black text-white uppercase tracking-wide">
            {isSignUp ? 'REGISTER NEW PLAYER' : 'PLAYER LOGIN'}
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            {isSignUp
              ? `Create an account and receive exactly ${STARTING_POINTS} Virtual Points to start!`
              : 'Log in to continue your arcade journey.'}
          </p>
        </div>

        {/* Starting bonus badge */}
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3 mb-4 flex items-center gap-3 text-amber-300 text-xs">
          <ShieldCheck className="w-5 h-5 text-amber-400 shrink-0" />
          <div>
            <p className="font-bold">New Registered Player Bonus:</p>
            <p className="text-amber-400 font-mono-numbers font-black text-sm">
              {STARTING_POINTS} Virtual Points
            </p>
            <span className="text-[10px] text-slate-400">
              Virtual points only • No real money value
            </span>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
              Player Username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => {
                setUsername(e.target.value);
                setError(null);
              }}
              placeholder="e.g. SpeedyRooster"
              maxLength={18}
              autoFocus
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500 transition"
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 text-rose-400 text-xs bg-rose-950/40 p-2.5 rounded-lg border border-rose-800">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            className="w-full py-3 px-4 rounded-xl font-black text-sm tracking-wider uppercase bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-400 hover:to-green-500 text-slate-950 shadow-lg shadow-emerald-500/25 active:scale-95 transition"
          >
            {isSignUp ? 'CREATE ACCOUNT (+200 PTS)' : 'LOGIN TO PLAY'}
          </button>
        </form>

        {/* Toggle sign up / login */}
        <div className="mt-4 pt-4 border-t border-slate-800 text-center">
          <button
            onClick={() => {
              setIsSignUp(!isSignUp);
              setError(null);
            }}
            className="text-xs text-slate-400 hover:text-emerald-400 transition"
          >
            {isSignUp
              ? 'Already have an existing profile? Switch / Log in'
              : 'Need a new player profile? Sign Up'}
          </button>
        </div>
      </div>
    </div>
  );
};
