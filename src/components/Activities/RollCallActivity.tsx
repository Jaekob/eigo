import React, { useEffect, useRef, useState } from 'react';
import { useGame } from '../../context/GameContext';
import { useEffects } from '../EffectsOverlay';
import { audioService } from '../../services/audioService';
import { Question } from '../../types';
interface FloatingObject {
  x: number;
  y: number;
  vx: number;
  vy: number;
  angle: number;
  spin: number;
  size: number;
  isTarget: boolean;
}

interface RollCallActivityProps {
  onQuestionResolved: (correct: boolean) => void;
}
export const RollCallActivity: React.FC<RollCallActivityProps> = ({ onQuestionResolved }) => {
  const { state } = useGame(); // Removed addScore
  const { floatText, particlesAt } = useEffects();

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const requestRef = useRef<number | null>(null);

  const [count, setCount] = useState<number>(0);
  const [targetShape, setTargetShape] = useState<'star' | 'circle' | 'square' | 'diamond'>('star');
  const [revealed, setRevealed] = useState(false);
  const [activeCountIdx, setActiveCountIdx] = useState<number>(-1);
  const [isLocked, setIsLocked] = useState(false);

  const [floaters, setFloaters] = useState<FloatingObject[]>([]);

  const startNewRoll = () => {
    setRevealed(false);
    setActiveCountIdx(-1);
    setIsLocked(false);

    const shapes = ['star', 'circle', 'square', 'diamond'] as const;
    setTargetShape(shapes[Math.floor(Math.random() * shapes.length)]);

    // Random count based on difficulty settings
    const min = state.rollCallMinCount ?? 3;
    const max = state.rollCallMaxCount ?? 10;
    const targetCount = min + Math.floor(Math.random() * (max - min + 1));
    const distractorCount = state.rollCallDistractorCount ?? 0;
    
    setCount(targetCount);

    const canvas = canvasRef.current;
    if (!canvas) return;

    // Build targets list
    const targets: FloatingObject[] = Array.from({ length: targetCount }, () => ({
      x: 50 + Math.random() * (canvas.width - 100),
      y: 50 + Math.random() * (canvas.height - 100),
      vx: (Math.random() - 0.5) * 1.8,
      vy: (Math.random() - 0.5) * 1.8,
      angle: Math.random() * Math.PI,
      spin: (Math.random() - 0.5) * 0.04,
      size: 26 + Math.random() * 18,
      isTarget: true
    }));

    // Build distractors list (junk)
    const distractors: FloatingObject[] = Array.from({ length: distractorCount }, () => ({
      x: 50 + Math.random() * (canvas.width - 100),
      y: 50 + Math.random() * (canvas.height - 100),
      vx: (Math.random() - 0.5) * 2.5,
      vy: (Math.random() - 0.5) * 2.5,
      angle: Math.random() * Math.PI,
      spin: (Math.random() - 0.5) * 0.1,
      size: 14 + Math.random() * 12,
      isTarget: false
    }));

    setFloaters([...targets, ...distractors]);
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = container.getBoundingClientRect();
    canvas.width = Math.floor(rect.width || 600);
    canvas.height = Math.floor(rect.height || 400);

    startNewRoll();
  }, [state.activeQuestionnaireId]); // Trigger on activeQuestionnaireId

  // Main canvas animation loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || floaters.length === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const W = canvas.width;
    const H = canvas.height;

    const loop = () => {
      ctx.clearRect(0, 0, W, H);

      // Simple space containment background
      const bGrad = ctx.createRadialGradient(W / 2, H / 2, 10, W / 2, H / 2, W / 1.5);
      bGrad.addColorStop(0, '#0c071d');
      bGrad.addColorStop(1, '#020106');
      ctx.fillStyle = bGrad;
      ctx.fillRect(0, 0, W, H);

      // Draw vector grids inside the containment arena
      ctx.strokeStyle = 'rgba(139, 92, 246, 0.05)';
      ctx.lineWidth = 1;
      for (let i = 40; i < W; i += 40) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i, H);
        ctx.stroke();
      }
      for (let i = 40; i < H; i += 40) {
        ctx.beginPath();
        ctx.moveTo(0, i);
        ctx.lineTo(W, i);
        ctx.stroke();
      }

      // Update and draw floating bodies
      floaters.forEach((star, index) => {
        // Physics update
        star.x += star.vx;
        star.y += star.vy;
        star.angle += star.spin;

        // Bounces on canvas walls
        if (star.x <= star.size || star.x >= W - star.size) {
          star.vx *= -1;
          star.x = star.x <= star.size ? star.size : W - star.size;
        }
        if (star.y <= star.size || star.y >= H - star.size) {
          star.vy *= -1;
          star.y = star.y <= star.size ? star.size : H - star.size;
        }

        // Only highlight and index actual targets
        const isTarget = star.isTarget;
        const targetIndex = floaters.filter((f, i) => f.isTarget && i < index).length;
        const isCountingNow = revealed && isTarget && targetIndex <= activeCountIdx;
        ctx.save();
        ctx.translate(star.x, star.y);
        ctx.rotate(star.angle);

        if (isTarget) {
          // Halo glows
          const glow = ctx.createRadialGradient(0, 0, 0, 0, 0, star.size * 2);
          glow.addColorStop(0, isCountingNow ? 'rgba(251, 191, 36, 0.45)' : 'rgba(139, 92, 246, 0.2)');
          glow.addColorStop(1, 'transparent');
          ctx.fillStyle = glow;
          ctx.beginPath();
          ctx.arc(0, 0, star.size * 2, 0, Math.PI * 2);
          ctx.fill();

          // Vector Drawing based on selected shape
          ctx.fillStyle = isCountingNow ? '#fbbf24' : '#6366f1';
          ctx.beginPath();
          if (targetShape === 'star') {
            for (let i = 0; i < 5; i++) {
              ctx.lineTo(Math.cos(((18 + i * 72) * Math.PI) / 180) * star.size, -Math.sin(((18 + i * 72) * Math.PI) / 180) * star.size);
              ctx.lineTo(Math.cos(((54 + i * 72) * Math.PI) / 180) * (star.size * 0.45), -Math.sin(((54 + i * 72) * Math.PI) / 180) * (star.size * 0.45));
            }
          } else if (targetShape === 'circle') {
            ctx.arc(0, 0, star.size, 0, Math.PI * 2);
          } else if (targetShape === 'square') {
            ctx.rect(-star.size, -star.size, star.size * 2, star.size * 2);
          } else if (targetShape === 'diamond') {
            ctx.moveTo(0, -star.size * 1.3);
            ctx.lineTo(star.size, 0);
            ctx.lineTo(0, star.size * 1.3);
            ctx.lineTo(-star.size, 0);
          }
          ctx.closePath();
          ctx.fill();
        } else {
          // Draw distractor "Space Junk"
          ctx.fillStyle = 'rgba(113, 113, 122, 0.4)';
          ctx.strokeStyle = 'rgba(113, 113, 122, 0.6)';
          ctx.lineWidth = 1;
          ctx.beginPath();
          let sides = 3 + (index % 3); // Triangle, square, or pentagon
          
          // Logic to prevent distractor shapes from matching target geometry
          if (sides === 4 && (targetShape === 'square' || targetShape === 'diamond')) sides = 6;
          if (sides === 5 && targetShape === 'star') sides = 3;

          for (let i = 0; i < sides; i++) {
            const px = Math.cos((i * 2 * Math.PI) / sides) * star.size;
            const py = Math.sin((i * 2 * Math.PI) / sides) * star.size;
            if (i === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
          }
          ctx.closePath();
          ctx.fill();
          ctx.stroke();
        }

        ctx.restore();

        // Overlay index count digit if counting actively
        if (isTarget && isCountingNow) {          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 20px "Orbitron", sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText((targetIndex + 1).toString(), star.x, star.y);
        }
      });

      requestRef.current = requestAnimationFrame(loop);
    };

    requestRef.current = requestAnimationFrame(loop);
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [floaters, revealed, activeCountIdx, targetShape]);

  const handleReveal = () => {
    if (isLocked || revealed) return;

    setRevealed(true);
    setIsLocked(true);

    const targets = floaters.filter(f => f.isTarget);

    // Count them in sequential order step by step programmatically with dings
    let currentIdx = 0;
    const ticker = setInterval(() => {
      setActiveCountIdx(currentIdx);
      
      const star = targets[currentIdx];
      if (star) {
        // High frequency scale chime dings
        const frequency = 523.25 + currentIdx * 35.0; // scales frequencies upward C5, D5, E5, etc.
        audioService.play({ freq: frequency, type: 'triangle', dur: 0.12, vol: 0.1 });
        floatText(`${currentIdx + 1}!`, '#fbbf24');
      }

      currentIdx++;
      if (currentIdx >= count) {
        clearInterval(ticker);
        
        // Final celebration blast
        setTimeout(() => {
          audioService.sounds.victory();
          const canvasBounds = canvasRef.current?.getBoundingClientRect();
          if (canvasBounds) {
            particlesAt(canvasBounds.left + canvasBounds.width / 2, canvasBounds.top + canvasBounds.height / 2, '#fbbf24', 20);
          }
          setIsLocked(false);
        }, 300);
      }
    }, 450);
  };

  return (
    <div className="flex flex-col items-center justify-center p-4 w-full h-full select-none animate-[fadeIn_0.5s_forwards]">
      
      {/* drifting stars stage sandbox container */}
      <div 
        ref={containerRef}
        className="w-full max-w-5xl h-[500px] relative rounded-[2.5rem] overflow-hidden border border-zinc-850 bg-zinc-950/40 shadow-2xl"
      >
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full"
          style={{ display: 'block' }}
        />
      </div>

      <div className="mt-6 flex flex-col items-center">
        {revealed && (
          <div className="text-3xl font-black text-yellow-400 font-['Outfit'] mb-4 animate-bounce uppercase tracking-tighter">
            ✨ Found {count} {targetShape}s!
          </div>
        )}

        {!revealed ? (
          <button
            onClick={handleReveal}
            disabled={isLocked}
            className="px-10 py-4 bg-gradient-to-r from-yellow-500 via-amber-500 to-orange-500 rounded-xl font-bold tracking-widest text-lg shadow-lg hover:scale-105 transition-all text-white uppercase cursor-pointer"
          >
            🔍 INITIATE SCAN (REVEAL COUNT)
          </button>
        ) : null}
      </div>

    </div>
  );
};
export default RollCallActivity;
