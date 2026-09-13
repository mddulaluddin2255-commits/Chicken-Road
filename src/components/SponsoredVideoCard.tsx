import React, { useState, useEffect, useRef } from 'react';
import { Volume2, VolumeX, Play, ExternalLink } from 'lucide-react';
import { loadVastAd, VastAdResult } from '../services/vastService';

export const SponsoredVideoCard: React.FC = () => {
  const [adData, setAdData] = useState<VastAdResult | null>(null);
  const [isMuted, setIsMuted] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasError, setHasError] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    loadVastAd()
      .then((data) => {
        if (data.mediaFiles && data.mediaFiles.length > 0) {
          setAdData(data);
        } else {
          setHasError(true);
        }
      })
      .catch(() => {
        setHasError(true);
      });
  }, []);

  const handlePlayToggle = () => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current.play().catch(() => {
        // autoplay restriction
      });
      setIsPlaying(true);
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  };

  return (
    <div
      id="in-game-sponsored-ad-card"
      className="w-full bg-slate-900/90 border border-slate-800 rounded-2xl p-3 sm:p-4 shadow-lg flex flex-col gap-2.5 overflow-hidden"
    >
      {/* Header Label */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 text-[10px] sm:text-xs font-black tracking-wider bg-slate-800 text-slate-300 border border-slate-700 rounded uppercase">
            AD LOCATION 2
          </span>
          <span className="text-xs sm:text-sm font-bold text-amber-400 tracking-wide uppercase">
            SPONSORED VIDEO
          </span>
        </div>
        <span className="text-[11px] text-slate-500">In-Game Video Stream</span>
      </div>

      {/* Video Stream Container */}
      <div className="relative aspect-video w-full rounded-xl overflow-hidden bg-slate-950 border border-slate-800/80 group">
        {!hasError && adData && adData.mediaFiles.length > 0 ? (
          <>
            <video
              ref={videoRef}
              src={adData.mediaFiles[0].url}
              playsInline
              muted={isMuted}
              loop
              autoPlay
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
              className="w-full h-full object-cover"
            />

            {/* Subtle overlay controls */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-90 transition flex flex-col justify-between p-2.5 pointer-events-none">
              <div className="flex justify-between items-start pointer-events-auto">
                <span className="text-[10px] font-semibold bg-black/60 backdrop-blur-sm text-slate-200 px-2 py-0.5 rounded border border-white/10">
                  {adData.title}
                </span>
                <button
                  onClick={() => setIsMuted(!isMuted)}
                  className="p-1 rounded-md bg-black/60 text-slate-300 hover:text-white border border-white/10"
                  title={isMuted ? 'Unmute' : 'Mute'}
                >
                  {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                </button>
              </div>

              <div className="flex items-center justify-between pointer-events-auto">
                <button
                  onClick={handlePlayToggle}
                  className="px-2.5 py-1 rounded bg-black/60 hover:bg-black/80 text-[11px] font-medium text-slate-200 flex items-center gap-1 border border-white/10 transition"
                >
                  <Play className={`w-3 h-3 ${isPlaying ? 'fill-current' : ''}`} />
                  {isPlaying ? 'Pause' : 'Play'}
                </button>

                {adData.clickThroughUrl && (
                  <a
                    href={adData.clickThroughUrl}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="text-[11px] text-amber-300 hover:underline flex items-center gap-0.5 bg-black/60 px-2 py-1 rounded border border-white/10"
                  >
                    Learn More <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                )}
              </div>
            </div>
          </>
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-center p-4 text-slate-500 bg-slate-950">
            <span className="text-xs font-semibold text-slate-400">Sponsored Video Partner</span>
            <span className="text-[11px] text-slate-500 mt-0.5">
              Advertisement player standby. Stream does not grant points directly.
            </span>
          </div>
        )}
      </div>

      <p className="text-[11px] text-slate-500 text-center leading-tight">
        Sponsored advertisement placement. To earn <strong className="text-emerald-400">+200 Virtual Points</strong>, watch via the Rewarded Ad button above.
      </p>
    </div>
  );
};
