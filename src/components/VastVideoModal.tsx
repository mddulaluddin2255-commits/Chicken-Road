import React, { useState, useEffect, useRef } from 'react';
import { X, Volume2, VolumeX, CheckCircle, AlertCircle, Loader2, Play } from 'lucide-react';
import { loadVastAd, sendTrackingBeacon, VastAdResult, FALLBACK_SPONSORED_VIDEO } from '../services/vastService';
import { playClaimSound, playClickSound } from '../utils/audio';

interface VastVideoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRewardEarned: (token: string) => void;
}

export const VastVideoModal: React.FC<VastVideoModalProps> = ({
  isOpen,
  onClose,
  onRewardEarned,
}) => {
  const [loading, setLoading] = useState(true);
  const [adData, setAdData] = useState<VastAdResult | null>(null);
  const [mediaFileIndex, setMediaFileIndex] = useState(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState(15);
  const [canClose, setCanClose] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  // Default to muted true so mobile Chrome autoplay policy never rejects playback
  const [isMuted, setIsMuted] = useState(true);
  const [rewardClaimed, setRewardClaimed] = useState(false);
  const [showPlayOverlay, setShowPlayOverlay] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const rewardTokenRef = useRef<string>('');
  const sentQuartiles = useRef<{ q1: boolean; q2: boolean; q3: boolean }>({
    q1: false,
    q2: false,
    q3: false,
  });

  // Reset and load ad when opened
  useEffect(() => {
    if (!isOpen) {
      setLoading(true);
      setAdData(null);
      setMediaFileIndex(0);
      setErrorMsg(null);
      setIsCompleted(false);
      setCanClose(false);
      setRewardClaimed(false);
      setShowPlayOverlay(false);
      return;
    }

    rewardTokenRef.current = 'token_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9);
    sentQuartiles.current = { q1: false, q2: false, q3: false };
    setLoading(true);
    setErrorMsg(null);
    setMediaFileIndex(0);
    setShowPlayOverlay(false);

    loadVastAd()
      .then((data) => {
        if (!data.mediaFiles || data.mediaFiles.length === 0) {
          // Provide fallback media
          data.mediaFiles = [
            {
              url: FALLBACK_SPONSORED_VIDEO,
              type: 'video/mp4',
            },
          ];
        }

        setAdData(data);
        const duration = Math.min(30, Math.max(10, data.durationSeconds || 15));
        setTimeLeft(duration);
        setLoading(false);

        // Send impression tracking
        data.impressionUrls.forEach(sendTrackingBeacon);
      })
      .catch(() => {
        // Fallback gracefully instead of blocking user
        setAdData({
          success: true,
          mediaFiles: [{ url: FALLBACK_SPONSORED_VIDEO, type: 'video/mp4' }],
          durationSeconds: 15,
          title: 'Sponsored Arcade Partner',
          impressionUrls: [],
          trackingEvents: [],
          isFallback: true,
        });
        setTimeLeft(15);
        setLoading(false);
      });
  }, [isOpen]);

  // Handle countdown timer & quartile tracking during playback
  const handleTimeUpdate = () => {
    if (!videoRef.current || isCompleted) return;
    const current = videoRef.current.currentTime;
    const duration = videoRef.current.duration || (adData?.durationSeconds ?? 15);

    const remaining = Math.max(0, Math.ceil(duration - current));
    setTimeLeft(remaining);

    // Quartile tracking
    if (adData && duration > 0) {
      const progress = current / duration;
      if (progress >= 0.25 && !sentQuartiles.current.q1) {
        sentQuartiles.current.q1 = true;
        adData.trackingEvents.filter((t) => t.event === 'firstQuartile').forEach((t) => sendTrackingBeacon(t.url));
      }
      if (progress >= 0.5 && !sentQuartiles.current.q2) {
        sentQuartiles.current.q2 = true;
        adData.trackingEvents.filter((t) => t.event === 'midpoint').forEach((t) => sendTrackingBeacon(t.url));
      }
      if (progress >= 0.75 && !sentQuartiles.current.q3) {
        sentQuartiles.current.q3 = true;
        adData.trackingEvents.filter((t) => t.event === 'thirdQuartile').forEach((t) => sendTrackingBeacon(t.url));
      }
    }
  };

  const handleVideoCompleted = () => {
    if (rewardClaimed) return;
    setIsCompleted(true);
    setCanClose(true);
    setTimeLeft(0);
    setRewardClaimed(true);

    // Send complete tracking
    adData?.trackingEvents.filter((t) => t.event === 'complete').forEach((t) => sendTrackingBeacon(t.url));

    playClaimSound();
    onRewardEarned(rewardTokenRef.current);
  };

  // Video error recovery handler
  const handleVideoError = () => {
    if (!adData || !adData.mediaFiles) {
      setErrorMsg('Advertisement unavailable. Please try again later.');
      setCanClose(true);
      return;
    }

    const nextIndex = mediaFileIndex + 1;
    if (nextIndex < adData.mediaFiles.length) {
      // Try next media format / resolution
      console.log(`[VAST Video] Trying alternative media stream index ${nextIndex}`);
      setMediaFileIndex(nextIndex);
    } else if (adData.mediaFiles[mediaFileIndex]?.url !== FALLBACK_SPONSORED_VIDEO) {
      // Try reliable fallback video
      console.log('[VAST Video] Upstream streams exhausted. Switching to fallback sponsored video.');
      setAdData({
        ...adData,
        mediaFiles: [{ url: FALLBACK_SPONSORED_VIDEO, type: 'video/mp4' }],
      });
      setMediaFileIndex(0);
    } else {
      setErrorMsg('Advertisement unavailable. Please try again later.');
      setCanClose(true);
    }
  };

  // Explicit user tap to start if autoplay was blocked by browser
  const handleManualPlay = () => {
    if (videoRef.current) {
      videoRef.current.play().catch(() => {});
      setShowPlayOverlay(false);
    }
  };

  const handleCloseAttempt = () => {
    playClickSound();
    if (!isCompleted && !errorMsg) {
      const confirmLeave = window.confirm(
        'Warning: You must finish watching the video to earn the +200 Virtual Points reward. Leave now?'
      );
      if (!confirmLeave) return;
    }
    onClose();
  };

  if (!isOpen) return null;

  const currentMediaUrl = adData?.mediaFiles?.[mediaFileIndex]?.url || FALLBACK_SPONSORED_VIDEO;

  return (
    <div
      id="vast-rewarded-ad-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-fadeIn"
    >
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Ad Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-slate-950/80 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 rounded">
              AD
            </span>
            <span className="text-xs sm:text-sm font-semibold text-slate-200 truncate">
              {adData?.title || 'Sponsored Video'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {!loading && !errorMsg && (
              <button
                id="ad-mute-toggle"
                onClick={() => setIsMuted(!isMuted)}
                className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white transition flex items-center gap-1.5 text-xs"
                title={isMuted ? 'Unmute' : 'Mute'}
              >
                {isMuted ? <VolumeX className="w-4 h-4 text-amber-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
                <span className="hidden sm:inline">{isMuted ? 'Muted' : 'Sound On'}</span>
              </button>
            )}

            <button
              id="ad-close-btn"
              onClick={handleCloseAttempt}
              className={`p-1.5 rounded-lg transition ${
                canClose
                  ? 'bg-emerald-600/30 text-emerald-300 hover:bg-emerald-600/50'
                  : 'bg-slate-800/80 text-slate-400 hover:text-white'
              }`}
              title="Close Ad"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Video Player Area */}
        <div className="relative aspect-video bg-black flex items-center justify-center overflow-hidden">
          {loading && (
            <div className="flex flex-col items-center gap-3 text-slate-300 p-6">
              <Loader2 className="w-9 h-9 text-emerald-400 animate-spin" />
              <p className="text-sm font-medium">Loading Rewarded Video Ad...</p>
              <span className="text-xs text-slate-500">Connecting to VAST ad network</span>
            </div>
          )}

          {errorMsg && !loading && (
            <div className="flex flex-col items-center text-center p-6 gap-3">
              <AlertCircle className="w-10 h-10 text-rose-400" />
              <p className="text-sm text-slate-200 font-medium">{errorMsg}</p>
              <p className="text-xs text-slate-400 max-w-xs">
                The ad server could not be reached. Your game balance remains safe and unaffected.
              </p>
              <button
                id="ad-error-close-btn"
                onClick={onClose}
                className="mt-2 px-5 py-2 text-xs font-bold uppercase tracking-wider bg-slate-800 hover:bg-slate-700 text-white rounded-lg border border-slate-700 transition"
              >
                Return to Game
              </button>
            </div>
          )}

          {!loading && !errorMsg && (
            <>
              <video
                key={currentMediaUrl}
                ref={videoRef}
                src={currentMediaUrl}
                autoPlay
                playsInline
                muted={isMuted}
                onTimeUpdate={handleTimeUpdate}
                onEnded={handleVideoCompleted}
                onError={handleVideoError}
                onPlay={() => setShowPlayOverlay(false)}
                onPause={() => {
                  if (!isCompleted) setShowPlayOverlay(true);
                }}
                className="w-full h-full object-contain"
              />

              {/* Tap to Unmute Banner if muted */}
              {isMuted && !isCompleted && (
                <button
                  onClick={() => setIsMuted(false)}
                  className="absolute bottom-3 right-3 bg-black/80 hover:bg-black text-amber-300 text-[11px] font-bold px-3 py-1.5 rounded-full border border-amber-500/40 flex items-center gap-1.5 backdrop-blur-sm z-20 active:scale-95 transition"
                >
                  <VolumeX className="w-3.5 h-3.5 text-amber-400" />
                  <span>Tap for Sound</span>
                </button>
              )}

              {/* Tap to Play Overlay if mobile browser blocked autoplay */}
              {showPlayOverlay && !isCompleted && (
                <div
                  onClick={handleManualPlay}
                  className="absolute inset-0 bg-black/60 backdrop-blur-xs flex flex-col items-center justify-center gap-2 cursor-pointer z-20"
                >
                  <div className="w-12 h-12 rounded-full bg-emerald-500/80 text-white flex items-center justify-center shadow-lg animate-pulse">
                    <Play className="w-6 h-6 fill-current ml-0.5" />
                  </div>
                  <span className="text-xs font-bold text-white bg-black/70 px-3 py-1 rounded-full">
                    Tap to Resume Video
                  </span>
                </div>
              )}

              {/* In-video live countdown badge */}
              {!isCompleted && (
                <div className="absolute top-3 left-3 bg-black/80 backdrop-blur-md px-3 py-1 rounded-full border border-white/10 flex items-center gap-2 z-10">
                  <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-xs font-mono font-bold text-white">
                    Reward in: {timeLeft}s
                  </span>
                </div>
              )}
            </>
          )}

          {/* Reward Earned Overlay */}
          {isCompleted && (
            <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center animate-fadeIn z-30">
              <div className="w-16 h-16 rounded-full bg-emerald-500/20 border-2 border-emerald-400 flex items-center justify-center mb-3 animate-bounce">
                <CheckCircle className="w-10 h-10 text-emerald-400" />
              </div>
              <h3 className="text-xl font-black text-white uppercase tracking-wide">
                AD COMPLETED!
              </h3>
              <p className="text-2xl font-black text-amber-400 mt-1 drop-shadow font-mono-numbers">
                +200 Virtual Points
              </p>
              <p className="text-xs text-slate-300 mt-2 max-w-xs">
                Points have been credited to your balance. Ready for your next road cross!
              </p>
              <button
                id="ad-collect-close-btn"
                onClick={() => {
                  playClickSound();
                  onClose();
                }}
                className="mt-5 w-full max-w-xs py-3 px-6 rounded-xl font-black text-sm tracking-wider uppercase text-slate-950 bg-gradient-to-r from-emerald-400 to-emerald-500 hover:from-emerald-300 hover:to-emerald-400 shadow-lg shadow-emerald-500/30 active:scale-95 transition"
              >
                CLAIM & RETURN TO GAME
              </button>
            </div>
          )}
        </div>

        {/* Ad Footer */}
        <div className="px-4 py-3 bg-slate-950 flex flex-col sm:flex-row items-center justify-between gap-2 border-t border-slate-800 text-xs">
          <div className="flex items-center gap-1.5 text-slate-400">
            <span className="font-semibold text-slate-300">Rewarded Ad Placement</span>
            <span>•</span>
            <span className="text-amber-400/90 font-medium">+200 Virtual Points</span>
          </div>
          <span className="text-[11px] text-slate-500">
            Official VAST integration • No Cash Value
          </span>
        </div>
      </div>
    </div>
  );
};
