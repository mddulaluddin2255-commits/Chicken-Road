import React, { useRef, useEffect, useState, useCallback } from 'react';
import { GameState, LaneDefinition } from '../types';
import { playStepSound, playCrashSound, playHornSound, playClaimSound } from '../utils/audio';

export const LANES: LaneDefinition[] = [
  { index: 0, type: 'START_SIDEWALK', multiplier: 1.0, name: 'Starting Curb' },
  {
    index: 1,
    type: 'ROAD',
    multiplier: 1.2,
    name: 'Quiet Street',
    vehicleSpeed: 2.2,
    vehicleDirection: 1,
    vehicleTypes: ['car', 'taxi'],
  },
  {
    index: 2,
    type: 'ROAD',
    multiplier: 1.5,
    name: 'City Avenue',
    vehicleSpeed: 2.8,
    vehicleDirection: -1,
    vehicleTypes: ['taxi', 'sports'],
  },
  { index: 3, type: 'MEDIAN_SAFE', multiplier: 2.0, name: 'Safe Island Refugium' },
  {
    index: 4,
    type: 'ROAD',
    multiplier: 3.0,
    name: 'Metro Boulevard',
    vehicleSpeed: 3.5,
    vehicleDirection: 1,
    vehicleTypes: ['truck', 'van', 'car'],
  },
  {
    index: 5,
    type: 'HIGHWAY',
    multiplier: 5.0,
    name: 'Express Lane',
    vehicleSpeed: 4.2,
    vehicleDirection: -1,
    vehicleTypes: ['sports', 'car', 'taxi'],
  },
  { index: 6, type: 'MEDIAN_SAFE', multiplier: 8.0, name: 'Safe Oasis Checkpoint' },
  {
    index: 7,
    type: 'HIGHWAY',
    multiplier: 12.0,
    name: 'Interstate Highway',
    vehicleSpeed: 4.8,
    vehicleDirection: 1,
    vehicleTypes: ['truck', 'bus'],
  },
  {
    index: 8,
    type: 'HIGHWAY',
    multiplier: 20.0,
    name: 'Super Speedway',
    vehicleSpeed: 5.6,
    vehicleDirection: -1,
    vehicleTypes: ['sports', 'car'],
  },
  {
    index: 9,
    type: 'HIGHWAY',
    multiplier: 35.0,
    name: 'Danger Crossing',
    vehicleSpeed: 6.2,
    vehicleDirection: 1,
    vehicleTypes: ['sports', 'truck'],
  },
  { index: 10, type: 'FINISH_SAFE', multiplier: 50.0, name: 'Golden Finish Arch' },
];

interface VehicleItem {
  laneIndex: number;
  x: number;
  width: number;
  height: number;
  speed: number;
  direction: 1 | -1;
  color: string;
  type: 'car' | 'taxi' | 'truck' | 'bus' | 'sports' | 'van';
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  alpha: number;
  decay: number;
  rotation: number;
  vRot: number;
}

interface GameCanvasProps {
  gameState: GameState;
  currentLane: number;
  onStepComplete: (newLane: number) => void;
  onCrash: (crashLane: number) => void;
  onVictory: () => void;
}

export const GameCanvas: React.FC<GameCanvasProps> = ({
  gameState,
  currentLane,
  onStepComplete,
  onCrash,
  onVictory,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Animation state
  const chickenPosRef = useRef({
    lane: 0,
    progress: 0, // 0 = fully in lane, 0..1 during hop
    targetLane: 0,
    isHopping: false,
    hopHeight: 0,
    animFrame: 0,
    crashed: false,
    crashScale: 1,
    crashRotation: 0,
  });

  const vehiclesRef = useRef<VehicleItem[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const cameraYRef = useRef<number>(0);
  const screenShakeRef = useRef<number>(0);
  const [dimensions, setDimensions] = useState({ width: 380, height: 460 });

  const LANE_HEIGHT = 70;

  // Initialize vehicles
  const initVehicles = useCallback((width: number) => {
    const list: VehicleItem[] = [];
    LANES.forEach((lane) => {
      if (lane.type === 'ROAD' || lane.type === 'HIGHWAY') {
        const types = lane.vehicleTypes || ['car'];
        const dir = lane.vehicleDirection || 1;
        const speed = lane.vehicleSpeed || 2.5;

        // Add 2 to 3 vehicles per lane
        const count = width > 500 ? 3 : 2;
        const spacing = (width + 120) / count;

        for (let i = 0; i < count; i++) {
          const type = types[i % types.length];
          let w = 54;
          let h = 32;
          let color = '#38bdf8';

          if (type === 'taxi') {
            w = 56;
            color = '#facc15';
          } else if (type === 'truck') {
            w = 88;
            h = 36;
            color = '#f97316';
          } else if (type === 'bus') {
            w = 100;
            h = 38;
            color = '#a855f7';
          } else if (type === 'sports') {
            w = 58;
            color = '#ef4444';
          } else if (type === 'van') {
            w = 64;
            h = 34;
            color = '#10b981';
          }

          list.push({
            laneIndex: lane.index,
            x: i * spacing + (Math.random() * 40 - 20),
            width: w,
            height: h,
            speed: speed * (0.9 + Math.random() * 0.2),
            direction: dir,
            color,
            type,
          });
        }
      }
    });
    vehiclesRef.current = list;
  }, []);

  // Update canvas sizing with ResizeObserver
  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        if (width > 0 && height > 0) {
          const roundedW = Math.floor(width);
          const roundedH = Math.min(540, Math.max(380, Math.floor(height)));
          setDimensions({ width: roundedW, height: roundedH });
          initVehicles(roundedW);
        }
      }
    });

    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [initVehicles]);

  // Sync chicken position with currentLane prop
  useEffect(() => {
    chickenPosRef.current.lane = currentLane;
    chickenPosRef.current.targetLane = currentLane;
    chickenPosRef.current.isHopping = false;
    chickenPosRef.current.progress = 0;

    if (gameState === 'READY' || gameState === 'HOME') {
      chickenPosRef.current.crashed = false;
      chickenPosRef.current.crashScale = 1;
      chickenPosRef.current.crashRotation = 0;
      particlesRef.current = [];
    }

    if (gameState === 'CRASHED') {
      chickenPosRef.current.crashed = true;
      screenShakeRef.current = 15;
      playCrashSound();
      spawnFeathers(dimensions.width / 2, getLaneY(currentLane, dimensions.height));
    }

    if (gameState === 'CLAIMED') {
      playClaimSound();
      spawnCoins(dimensions.width / 2, getLaneY(currentLane, dimensions.height));
    }
  }, [currentLane, gameState, dimensions]);

  const getLaneY = (laneIdx: number, canvasH: number) => {
    // Lane 0 is at bottom, Lane 10 at top
    const startY = canvasH - 55;
    return startY - laneIdx * LANE_HEIGHT;
  };

  // Particle spawn generators
  const spawnFeathers = (cx: number, cy: number) => {
    const list: Particle[] = [];
    const colors = ['#ffffff', '#fef08a', '#fde047', '#f87171', '#fb923c'];
    for (let i = 0; i < 35; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 2 + Math.random() * 6;
      list.push({
        x: cx,
        y: cy,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 2,
        size: 4 + Math.random() * 7,
        color: colors[Math.floor(Math.random() * colors.length)],
        alpha: 1,
        decay: 0.015 + Math.random() * 0.02,
        rotation: Math.random() * Math.PI * 2,
        vRot: (Math.random() - 0.5) * 0.2,
      });
    }
    particlesRef.current.push(...list);
  };

  const spawnCoins = (cx: number, cy: number) => {
    const list: Particle[] = [];
    const colors = ['#facc15', '#fbbf24', '#f59e0b', '#fef08a'];
    for (let i = 0; i < 40; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 2 + Math.random() * 7;
      list.push({
        x: cx,
        y: cy,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 4,
        size: 6 + Math.random() * 6,
        color: colors[Math.floor(Math.random() * colors.length)],
        alpha: 1,
        decay: 0.012 + Math.random() * 0.015,
        rotation: 0,
        vRot: (Math.random() - 0.5) * 0.3,
      });
    }
    particlesRef.current.push(...list);
  };

  // Step Chicken forward trigger
  const triggerStepForward = useCallback(() => {
    if (chickenPosRef.current.isHopping || chickenPosRef.current.crashed) return;
    if (gameState !== 'PLAYING') return;

    const nextLane = currentLane + 1;
    if (nextLane >= LANES.length) {
      onVictory();
      return;
    }

    chickenPosRef.current.isHopping = true;
    chickenPosRef.current.targetLane = nextLane;
    chickenPosRef.current.progress = 0;
    playStepSound();
  }, [gameState, currentLane, onVictory]);

  // Main 60FPS Game Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;

    const render = () => {
      const W = canvas.width;
      const H = canvas.height;

      // Update screen shake
      let shakeX = 0;
      let shakeY = 0;
      if (screenShakeRef.current > 0) {
        shakeX = (Math.random() - 0.5) * screenShakeRef.current;
        shakeY = (Math.random() - 0.5) * screenShakeRef.current;
        screenShakeRef.current *= 0.88;
        if (screenShakeRef.current < 0.2) screenShakeRef.current = 0;
      }

      ctx.save();
      ctx.translate(shakeX, shakeY);

      // Handle hopping animation
      const ch = chickenPosRef.current;
      if (ch.isHopping) {
        ch.progress += 0.08;
        ch.hopHeight = Math.sin(ch.progress * Math.PI) * 22;

        if (ch.progress >= 1) {
          ch.progress = 1;
          ch.isHopping = false;
          ch.lane = ch.targetLane;
          ch.hopHeight = 0;

          // Check if this step is a crash or success
          // Safe lanes (0, 3, 6, 10) never crash
          const targetLaneDef = LANES[ch.targetLane];
          let isCrashStep = false;

          if (targetLaneDef.type === 'ROAD' || targetLaneDef.type === 'HIGHWAY') {
            // Unpredictable crash probability curve:
            // Lane 1: 12%
            // Lane 2: 18%
            // Lane 4: 24%
            // Lane 5: 32%
            // Lane 7: 38%
            // Lane 8: 45%
            // Lane 9: 55%
            const riskMap: Record<number, number> = {
              1: 0.12,
              2: 0.18,
              4: 0.24,
              5: 0.32,
              7: 0.38,
              8: 0.45,
              9: 0.55,
            };
            const risk = riskMap[ch.targetLane] ?? 0.3;
            // Cryptographic secure randomness
            const randomBuf = new Uint32Array(1);
            window.crypto.getRandomValues(randomBuf);
            const rand = randomBuf[0] / (0xffffffff + 1);

            if (rand < risk) {
              isCrashStep = true;
            }
          }

          if (isCrashStep) {
            onCrash(ch.targetLane);
          } else {
            if (ch.targetLane === LANES.length - 1) {
              onVictory();
            } else {
              onStepComplete(ch.targetLane);
            }
          }
        }
      }

      // Smooth Camera tracking chicken
      const targetChickenY = getLaneY(
        ch.isHopping ? ch.lane + (ch.targetLane - ch.lane) * ch.progress : ch.lane,
        H
      );
      const desiredCameraY = Math.max(0, H * 0.6 - targetChickenY);
      cameraYRef.current += (desiredCameraY - cameraYRef.current) * 0.1;

      ctx.save();
      ctx.translate(0, cameraYRef.current);

      // 1. Draw Background & Lanes
      ctx.fillStyle = '#0b1120';
      ctx.fillRect(0, -H * 2, W, H * 4);

      LANES.forEach((lane) => {
        const laneY = getLaneY(lane.index, H) - LANE_HEIGHT / 2;

        if (lane.type === 'START_SIDEWALK' || lane.type === 'FINISH_SAFE') {
          // Sidewalk / Finish Safe Zone
          const isFinish = lane.type === 'FINISH_SAFE';
          ctx.fillStyle = isFinish ? '#14532d' : '#1e293b';
          ctx.fillRect(0, laneY, W, LANE_HEIGHT);

          // Curb stones pattern
          ctx.fillStyle = isFinish ? '#22c55e' : '#334155';
          ctx.fillRect(0, laneY + LANE_HEIGHT - 6, W, 6);

          // Zone text
          ctx.fillStyle = isFinish ? '#4ade80' : '#94a3b8';
          ctx.font = 'bold 12px Outfit, sans-serif';
          ctx.textAlign = 'left';
          ctx.fillText(
            isFinish ? '🏆 GOLDEN FINISH • 50.00x' : '🏁 STARTING CURB • 1.00x',
            16,
            laneY + 22
          );

          if (isFinish) {
            // Golden victory banner garland
            ctx.fillStyle = '#facc15';
            for (let x = 15; x < W; x += 30) {
              ctx.beginPath();
              ctx.moveTo(x, laneY + 32);
              ctx.lineTo(x + 10, laneY + 48);
              ctx.lineTo(x + 20, laneY + 32);
              ctx.fill();
            }
          }
        } else if (lane.type === 'MEDIAN_SAFE') {
          // Grassy Island Refugium
          ctx.fillStyle = '#064e3b';
          ctx.fillRect(0, laneY, W, LANE_HEIGHT);

          // Grassy curbs top and bottom
          ctx.fillStyle = '#059669';
          ctx.fillRect(0, laneY, W, 4);
          ctx.fillRect(0, laneY + LANE_HEIGHT - 4, W, 4);

          // Checkered safe flags & label
          ctx.fillStyle = '#34d399';
          ctx.font = 'bold 11px Outfit, sans-serif';
          ctx.textAlign = 'left';
          ctx.fillText(`🛡️ SAFE CHECKPOINT • ${lane.multiplier.toFixed(2)}x`, 16, laneY + 20);

          // Little flowers / grass tufts
          ctx.fillStyle = '#a7f3d0';
          for (let gx = 30; gx < W; gx += 45) {
            ctx.beginPath();
            ctx.arc(gx, laneY + 40, 2.5, 0, Math.PI * 2);
            ctx.fill();
          }
        } else {
          // Asphalt Road / Highway
          ctx.fillStyle = lane.type === 'HIGHWAY' ? '#0f172a' : '#172033';
          ctx.fillRect(0, laneY, W, LANE_HEIGHT);

          // Road side borders
          ctx.fillStyle = '#334155';
          ctx.fillRect(0, laneY, W, 2);
          ctx.fillRect(0, laneY + LANE_HEIGHT - 2, W, 2);

          // Dashed lane divider lines
          ctx.fillStyle = '#e2e8f0';
          ctx.globalAlpha = 0.35;
          const dashLen = 22;
          const gapLen = 18;
          const lineY = laneY + LANE_HEIGHT / 2;
          for (let x = 0; x < W; x += dashLen + gapLen) {
            ctx.fillRect(x, lineY - 1.5, dashLen, 3);
          }
          ctx.globalAlpha = 1.0;

          // Lane Multiplier indicator badge on the right
          ctx.fillStyle = 'rgba(15, 23, 42, 0.7)';
          ctx.beginPath();
          ctx.roundRect(W - 75, laneY + 8, 62, 22, 6);
          ctx.fill();
          ctx.strokeStyle = '#38bdf844';
          ctx.lineWidth = 1;
          ctx.stroke();

          ctx.fillStyle = '#38bdf8';
          ctx.font = 'bold 12px "JetBrains Mono", monospace';
          ctx.textAlign = 'center';
          ctx.fillText(`${lane.multiplier.toFixed(2)}x`, W - 44, laneY + 23);
        }
      });

      // 2. Update and Draw Moving Vehicles
      const vehicles = vehiclesRef.current;
      vehicles.forEach((v) => {
        // Move vehicle
        v.x += v.speed * v.direction;
        if (v.direction === 1 && v.x > W + 80) {
          v.x = -v.width - 40;
        } else if (v.direction === -1 && v.x < -v.width - 80) {
          v.x = W + 40;
        }

        const vLaneY = getLaneY(v.laneIndex, H);
        const vy = vLaneY - v.height / 2;

        // Draw Vehicle Shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
        ctx.beginPath();
        ctx.ellipse(v.x + v.width / 2, vy + v.height + 2, v.width * 0.48, 4, 0, 0, Math.PI * 2);
        ctx.fill();

        // Draw Vehicle Body
        ctx.save();
        ctx.translate(v.x, vy);

        // Main chassis
        ctx.fillStyle = v.color;
        ctx.beginPath();
        ctx.roundRect(0, 0, v.width, v.height, 6);
        ctx.fill();

        // Windshield and windows
        ctx.fillStyle = '#0f172a';
        if (v.direction === 1) {
          // Facing right
          ctx.fillRect(v.width - 16, 4, 10, v.height - 8);
          ctx.fillRect(8, 6, v.width - 28, v.height - 12);
        } else {
          // Facing left
          ctx.fillRect(6, 4, 10, v.height - 8);
          ctx.fillRect(20, 6, v.width - 28, v.height - 12);
        }

        // Taxi roof sign
        if (v.type === 'taxi') {
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(v.width / 2 - 8, -4, 16, 5);
          ctx.fillStyle = '#000000';
          ctx.font = 'bold 6px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('TAXI', v.width / 2, 0);
        }

        // Headlights
        ctx.fillStyle = '#fef08a';
        if (v.direction === 1) {
          ctx.fillRect(v.width - 2, 4, 3, 6);
          ctx.fillRect(v.width - 2, v.height - 10, 3, 6);
        } else {
          ctx.fillRect(-1, 4, 3, 6);
          ctx.fillRect(-1, v.height - 10, 3, 6);
        }

        // Tail lights
        ctx.fillStyle = '#ef4444';
        if (v.direction === 1) {
          ctx.fillRect(-1, 4, 2, 5);
          ctx.fillRect(-1, v.height - 9, 2, 5);
        } else {
          ctx.fillRect(v.width - 1, 4, 2, 5);
          ctx.fillRect(v.width - 1, v.height - 9, 2, 5);
        }

        // Wheels
        ctx.fillStyle = '#020617';
        ctx.fillRect(8, -2, 10, 3);
        ctx.fillRect(v.width - 18, -2, 10, 3);
        ctx.fillRect(8, v.height - 1, 10, 3);
        ctx.fillRect(v.width - 18, v.height - 1, 10, 3);

        ctx.restore();
      });

      // 3. Draw Chicken
      const chickenX = W / 2;
      const chickenLaneY = getLaneY(
        ch.isHopping ? ch.lane + (ch.targetLane - ch.lane) * ch.progress : ch.lane,
        H
      );
      const chickenY = chickenLaneY - ch.hopHeight;

      ctx.save();
      ctx.translate(chickenX, chickenY);

      if (ch.crashed) {
        ch.crashRotation += 0.15;
        ctx.rotate(ch.crashRotation);
        ctx.scale(0.85, 0.85);
      }

      // Chicken Shadow on Ground
      ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
      ctx.beginPath();
      const shadowRadius = Math.max(5, 14 - ch.hopHeight * 0.4);
      ctx.ellipse(0, 14 + ch.hopHeight, shadowRadius, shadowRadius * 0.55, 0, 0, Math.PI * 2);
      ctx.fill();

      // Feet / Legs
      ctx.fillStyle = '#f97316';
      const legOffset = ch.isHopping ? Math.sin(ch.progress * Math.PI * 2) * 4 : 0;
      ctx.fillRect(-8, 8, 4, 8 + legOffset);
      ctx.fillRect(4, 8, 4, 8 - legOffset);
      // Toes
      ctx.fillRect(-10, 15 + legOffset, 7, 3);
      ctx.fillRect(2, 15 - legOffset, 7, 3);

      // Chicken Body (Fluffy plump round white/cream body)
      ctx.fillStyle = '#f8fafc';
      ctx.beginPath();
      ctx.ellipse(0, 0, 16, 15, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Wing on the side
      ctx.fillStyle = '#e2e8f0';
      ctx.beginPath();
      const wingFlap = ch.isHopping ? Math.sin(ch.progress * Math.PI) * 6 : 0;
      ctx.ellipse(-4, 2 - wingFlap, 9, 7, -0.2, 0, Math.PI * 2);
      ctx.fill();

      // Red Comb on head
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.arc(-4, -16, 4, 0, Math.PI * 2);
      ctx.arc(0, -18, 5, 0, Math.PI * 2);
      ctx.arc(5, -15, 4, 0, Math.PI * 2);
      ctx.fill();

      // Red Wattle under chin
      ctx.fillStyle = '#dc2626';
      ctx.beginPath();
      ctx.arc(11, -3, 3, 0, Math.PI * 2);
      ctx.fill();

      // Yellow Beak
      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      ctx.moveTo(12, -9);
      ctx.lineTo(21, -5);
      ctx.lineTo(12, -2);
      ctx.closePath();
      ctx.fill();

      // Eye
      if (ch.crashed) {
        // Dizzy "X" eye
        ctx.strokeStyle = '#0f172a';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(6, -10);
        ctx.lineTo(12, -4);
        ctx.moveTo(12, -10);
        ctx.lineTo(6, -4);
        ctx.stroke();
      } else {
        // Normal shiny alert eye
        ctx.fillStyle = '#0f172a';
        ctx.beginPath();
        ctx.arc(9, -7, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(8, -8, 1, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();

      // 4. Update and Draw Particles (Feathers & Coins)
      const particles = particlesRef.current;
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.12; // gravity
        p.alpha -= p.decay;
        p.rotation += p.vRot;

        if (p.alpha <= 0) {
          particles.splice(i, 1);
          continue;
        }

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        ctx.globalAlpha = p.alpha;
        ctx.fillStyle = p.color;

        ctx.beginPath();
        ctx.ellipse(0, 0, p.size, p.size * 0.6, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
      }

      ctx.restore(); // restore camera transform
      ctx.restore(); // restore screen shake

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [dimensions, onCrash, onStepComplete, onVictory]);

  return (
    <div
      ref={containerRef}
      id="chicken-road-canvas-container"
      onClick={triggerStepForward}
      className="relative w-full h-[390px] sm:h-[440px] md:h-[480px] bg-slate-950 rounded-2xl overflow-hidden border border-slate-800 shadow-2xl cursor-pointer select-none"
    >
      <canvas
        ref={canvasRef}
        width={dimensions.width}
        height={dimensions.height}
        className="w-full h-full block"
      />

      {/* Floating Lane Multiplier Header */}
      <div className="absolute top-3 left-3 bg-slate-950/85 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-700/80 flex items-center gap-2 shadow-lg">
        <span className="text-base sm:text-lg">🐔</span>
        <div className="flex flex-col">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
            Current Lane
          </span>
          <span className="text-xs sm:text-sm font-black text-white font-mono-numbers">
            {LANES[currentLane]?.name ?? 'Starting Curb'}
          </span>
        </div>
      </div>

      {/* Touch prompt hint */}
      {gameState === 'PLAYING' && (
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-slate-950/80 backdrop-blur-md px-4 py-1.5 rounded-full border border-slate-700/80 pointer-events-none animate-pulse text-center">
          <span className="text-[11px] sm:text-xs font-semibold text-emerald-400 tracking-wide">
            👆 TAP SCREEN OR PRESS &quot;CROSS NEXT LANE&quot;
          </span>
        </div>
      )}
    </div>
  );
};
