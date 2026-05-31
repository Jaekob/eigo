import React, { useEffect, useRef, useState } from 'react';
import { useGame } from '../../context/GameContext';
import { useEffects } from '../EffectsOverlay';
import { audioService } from '../../services/audioService';

interface Peg {
  x: number;
  y: number;
}

interface Bucket {
  x: number;
  width: number;
  label: string;
  points: number;
  color: string;
}

const GRAVITY = 0.32;
const BALL_RADIUS = 11;
const PEG_RADIUS = 6.5;
const RESTITUTION = 0.58;
const FRICTION = 0.994;
const MAX_SPEED = 12;

const BOARD_PAD_X = 50;
const BOARD_PAD_TOP = 80;
const BOARD_PAD_BOT = 110;
const PEG_ROWS = 8;
const PEGS_PER_ROW = 9;
const SETTLE_THRESHOLD = 0.45;
const MAX_FRAMES = 600;

const BUCKETS_CONFIG = [
  { label: '0', points: 0, color: '#495057' },
  { label: '+1', points: 1, color: '#2f9e44' },
  { label: '+2', points: 2, color: '#1971c2' },
  { label: '+3', points: 3, color: '#9775fa' },
  { label: '+5', points: 5, color: '#f59f00' },
  { label: '+3', points: 3, color: '#9775fa' },
  { label: '+2', points: 2, color: '#1971c2' },
  { label: '+1', points: 1, color: '#2f9e44' },
  { label: '0', points: 0, color: '#495057' }
];

export const PachinkoGame: React.FC<{ onTurnEnd: () => void }> = ({ onTurnEnd }) => {
  const { state, addScore, startRound } = useGame();
  const { floatText, particlesAt } = useEffects();

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const frameRef = useRef<number | null>(null);

  const [outcomeMsg, setOutcomeMsg] = useState<string | null>(null);
  const [isSettled, setIsSettled] = useState(false);

  useEffect(() => {
    startRound();
    setIsSettled(false);
    setOutcomeMsg(null);

    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Resizing matches wrapping box
    const rect = container.getBoundingClientRect();
    canvas.width = Math.floor(rect.width || 800);
    canvas.height = Math.floor(rect.height || 550);

    const W = canvas.width;
    const H = canvas.height;
    const floorY = H - BOARD_PAD_BOT;

    // 1. Build peg arrays (alternates even and odd vertical columns)
    const pegs: Peg[] = [];
    const usableW = W - BOARD_PAD_X * 2;
    const usableH = H - BOARD_PAD_TOP - BOARD_PAD_BOT;
    const rowGap = usableH / (PEG_ROWS - 1);

    for (let row = 0; row < PEG_ROWS; row++) {
      const count = row % 2 === 0 ? PEGS_PER_ROW : PEGS_PER_ROW - 1;
      const colGap = usableW / (count - 1);
      const offset = row % 2 === 0 ? 0 : colGap / 2;

      for (let col = 0; col < count; col++) {
        pegs.push({
          x: BOARD_PAD_X + offset + col * colGap,
          y: BOARD_PAD_TOP + row * rowGap
        });
      }
    }

    // 2. Build bucket slots
    const bucketCount = BUCKETS_CONFIG.length;
    const bucketW = (W - BOARD_PAD_X * 2) / bucketCount;
    const buckets: Bucket[] = BUCKETS_CONFIG.map((b, idx) => ({
      ...b,
      x: BOARD_PAD_X + idx * bucketW,
      width: bucketW
    }));

    // 3. Spawns coordinates
    const gotCorrect = state.lastQuestionCorrect;
    const spread = gotCorrect ? 0.15 : 0.5; // Narrower center for correct
    const center = W / 2;
    const range = (W - BOARD_PAD_X * 2) * spread;
    const r1 = (Math.random() - 0.5) * 2;
    const r2 = (Math.random() - 0.5) * 2;
    const offset = ((r1 + r2) / 2) * range;

    const spawnX = Math.max(BOARD_PAD_X + BALL_RADIUS,
      Math.min(W - BOARD_PAD_X - BALL_RADIUS, center + offset));

    let ball = {
      x: spawnX,
      y: 20,
      vx: (Math.random() - 0.5) * 1.5,
      vy: 0
    };

    let frame = 0;
    let ballSettle = false;
    let winningBucket: Bucket | null = null;
    let isFlashedOn = false;
    let flashCounter = 0;

    const activeTeamColor = state.teams[state.activeIndex]?.color || '#ffffff';

    const draw = () => {
      ctx.clearRect(0, 0, W, H);

      // Stars backdrop
      const bg = ctx.createLinearGradient(0, 0, 0, H);
      bg.addColorStop(0, '#0a0518');
      bg.addColorStop(1, '#030209');
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, W, H);

      // Left-right physical boundaries
      ctx.fillStyle = 'rgba(124, 58, 237, 0.08)';
      ctx.fillRect(0, 0, BOARD_PAD_X - 4, H);
      ctx.fillRect(W - BOARD_PAD_X + 4, 0, BOARD_PAD_X - 4, H);

      // Floor marker
      ctx.strokeStyle = 'rgba(124, 58, 237, 0.4)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(BOARD_PAD_X, floorY);
      ctx.lineTo(W - BOARD_PAD_X, floorY);
      ctx.stroke();

      // Render bottom buckets
      buckets.forEach((b) => {
        const isSelfWinner = winningBucket !== null && b.x === winningBucket.x;
        const flashActive = isSelfWinner && isFlashedOn;

        // Fills
        ctx.fillStyle = flashActive ? `${b.color}88` : `${b.color}22`;
        ctx.fillRect(b.x + 1, floorY, b.width - 2, H - floorY);

        // Divider
        ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
        ctx.fillRect(b.x, floorY - 2, 2, H - floorY + 2);

        // Name
        ctx.fillStyle = flashActive ? '#ffffff' : 'rgba(255, 255, 255, 0.6)';
        ctx.font = `bold ${Math.floor(b.width * 0.35)}px 'Outfit', sans-serif`;
        ctx.textAlign = 'center';
        ctx.fillText(b.label, b.x + b.width / 2, floorY + 36);

        // Points
        if (b.points > 0) {
          ctx.fillStyle = flashActive ? '#ffffff' : b.color;
          ctx.font = `bold ${Math.floor(b.width * 0.28)}px 'Outfit', sans-serif`;
          ctx.fillText(`${b.points}pt`, b.x + b.width / 2, floorY + 60);
        }
      });

      // Render peg grid
      pegs.forEach((p) => {
        // Glowing aura
        const grd = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, PEG_RADIUS * 2.5);
        grd.addColorStop(0, 'rgba(168, 85, 247, 0.25)');
        grd.addColorStop(1, 'transparent');
        ctx.fillStyle = grd;
        ctx.beginPath();
        ctx.arc(p.x, p.y, PEG_RADIUS * 2.5, 0, Math.PI * 2);
        ctx.fill();

        // Core peg body
        const pegBody = ctx.createRadialGradient(p.x - 1, p.y - 1, 1, p.x, p.y, PEG_RADIUS);
        pegBody.addColorStop(0, '#ffffff');
        pegBody.addColorStop(0.4, '#a855f7');
        pegBody.addColorStop(1, '#6b21a8');
        ctx.fillStyle = pegBody;
        ctx.beginPath();
        ctx.arc(p.x, p.y, PEG_RADIUS, 0, Math.PI * 2);
        ctx.fill();
      });

      // Render falling ball
      if (!ballSettle) {
        // Shadow offset
        ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
        ctx.beginPath();
        ctx.ellipse(ball.x + 3, ball.y + 4, BALL_RADIUS, BALL_RADIUS * 0.6, 0, 0, Math.PI * 2);
        ctx.fill();

        // Main Ball
        const ballGrad = ctx.createRadialGradient(ball.x - BALL_RADIUS * 0.3, ball.y - BALL_RADIUS * 0.3, BALL_RADIUS * 0.1, ball.x, ball.y, BALL_RADIUS);
        ballGrad.addColorStop(0, '#ffffff');
        ballGrad.addColorStop(0.3, activeTeamColor);
        ballGrad.addColorStop(1, '#0e0b16');
        ctx.fillStyle = ballGrad;
        ctx.beginPath();
        ctx.arc(ball.x, ball.y, BALL_RADIUS, 0, Math.PI * 2);
        ctx.fill();

        // Highlight
        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.beginPath();
        ctx.arc(ball.x - BALL_RADIUS * 0.3, ball.y - BALL_RADIUS * 0.3, BALL_RADIUS * 0.2, 0, Math.PI * 2);
        ctx.fill();

        // Spawn path guide
        if (frame < 30) {
          ctx.strokeStyle = `${activeTeamColor}66`;
          ctx.lineWidth = 1.5;
          ctx.setLineDash([4, 4]);
          ctx.beginPath();
          ctx.moveTo(ball.x, 0);
          ctx.lineTo(ball.x, ball.y - BALL_RADIUS - 3);
          ctx.stroke();
          ctx.setLineDash([]);
        }
      }
    };

    const handleSettle = (bucket: Bucket) => {
      ballSettle = true;
      setIsSettled(true);
      winningBucket = bucket;

      const basePoints = bucket.points;
      // Points reduced 50% if answer incorrect
      const pointsEarned = gotCorrect ? basePoints : Math.floor(basePoints * 0.5);

      if (pointsEarned > 0) {
        addScore(state.activeIndex, pointsEarned);
        audioService.sounds.bank();
        setOutcomeMsg(`Ball landed in ${bucket.label}! Received +${pointsEarned} points!`);
      } else {
        audioService.sounds.wrong();
        setOutcomeMsg("Aw, landed in the 0-point slot!");
      }

      // Quick-blink winner bucket 6 times
      const blinkInterval = setInterval(() => {
        isFlashedOn = !isFlashedOn;
        draw();

        flashCounter++;
        if (flashCounter >= 8) {
          clearInterval(blinkInterval);
          isFlashedOn = true;
          draw();

          // Particle burst at bottom center coordinates
          const canvasBounds = canvas.getBoundingClientRect();
          const targetX = canvasBounds.left + bucket.x + bucket.width / 2;
          const targetY = canvasBounds.top + floorY + 40;
          particlesAt(targetX, targetY, bucket.color, 16);

          setTimeout(() => {
            onTurnEnd();
          }, 1800);
        }
      }, 100);
    };

    const runPhysicsIndex = () => {
      frame++;
      
      // Multi-step integration to solve fast-clashing coordinate overlaps safely
      ball.vy += GRAVITY;

      const speed = Math.hypot(ball.vx, ball.vy);
      if (speed > MAX_SPEED) {
        ball.vx = (ball.vx / speed) * MAX_SPEED;
        ball.vy = (ball.vy / speed) * MAX_SPEED;
      }

      ball.vx *= FRICTION;

      // Check wall bounces
      const minX = BOARD_PAD_X + BALL_RADIUS;
      const maxX = W - BOARD_PAD_X - BALL_RADIUS;

      if (ball.x + ball.vx < minX) {
        ball.x = minX;
        ball.vx = Math.abs(ball.vx) * RESTITUTION;
      } else if (ball.x + ball.vx > maxX) {
        ball.x = maxX;
        ball.vx = -Math.abs(ball.vx) * RESTITUTION;
      }

      // Resolve Peg Contacts
      pegs.forEach(p => {
        const dx = ball.x - p.x;
        const dy = ball.y - p.y;
        const dist = Math.hypot(dx, dy);
        const minDist = BALL_RADIUS + PEG_RADIUS;

        if (dist < minDist && dist > 0) {
          // Push out of overlapping peg coords
          const nx = dx / dist;
          const ny = dy / dist;
          const overlap = minDist - dist;

          ball.x += nx * overlap;
          ball.y += ny * overlap;

          // Elastic bounce
          const dot = ball.vx * nx + ball.vy * ny;
          ball.vx -= (1 + RESTITUTION) * dot * nx;
          ball.vy -= (1 + RESTITUTION) * dot * ny;

          // Tiny nudge to slide off peg centers
          ball.vx += (Math.random() - 0.5) * 0.3;
          audioService.sounds.tick();
        }
      });

      // Update positions
      ball.x += ball.vx;
      ball.y += ball.vy;

      // Check floor settle boundaries
      const isBreached = ball.y >= floorY - BALL_RADIUS;
      const isStopped = frame >= MAX_FRAMES || (ball.y > floorY - 60 && Math.hypot(ball.vx, ball.vy) < SETTLE_THRESHOLD);

      draw();

      if (isBreached || isStopped) {
        // Pin settle bucket
        const pickedBucket = buckets.find(b => ball.x >= b.x && ball.x < b.x + b.width) || buckets[4];
        handleSettle(pickedBucket);
      } else {
        frameRef.current = requestAnimationFrame(runPhysicsIndex);
      }
    };

    frameRef.current = requestAnimationFrame(runPhysicsIndex);

    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    };
  }, [state.activeIndex]);

  return (
    <div className="flex flex-col items-center justify-center p-4 w-full h-full select-none animate-[fadeIn_0.5s_forwards]">
      
      {/* Simulation Box wrapper */}
      <div 
        ref={containerRef}
        className="w-full max-w-4xl h-[420px] aspect-[4/3] relative rounded-3xl overflow-hidden border border-zinc-900 bg-zinc-950/20"
      >
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full"
          style={{ display: 'block' }}
        />
      </div>

      {/* Outcome notification banner */}
      {outcomeMsg && (
        <div className="mt-6 p-4 bg-zinc-900/60 border border-zinc-850 rounded-xl text-center text-sm font-semibold max-w-sm text-yellow-400 border-l-4 border-l-yellow-500 animate-[fadeIn_0.3s_forwards]">
          {outcomeMsg}
        </div>
      )}

      {/* Helper caption */}
      {!isSettled && (
        <div className="text-zinc-500 text-xs mt-3 uppercase tracking-widest animate-pulse font-mono flex items-center justify-center gap-2">
          <span>🌌 Starship physical gravity descent in progress...</span>
        </div>
      )}

    </div>
  );
};
export default PachinkoGame;
