import React, { createContext, useContext, useState, useEffect, useRef } from 'react';

// Fragment shaders from old app, modernized for React
const SHOCKWAVE_FS = `
precision mediump float;
uniform float u_time;
uniform vec2 u_resolution;
uniform vec2 u_epicenter;

void main() {
    // Normalise coordinates
    vec2 uv = gl_FragCoord.xy / u_resolution;
    vec2 center = u_epicenter / u_resolution;
    vec2 diff = uv - center;
    diff.x *= u_resolution.x / u_resolution.y;
    float d = length(diff);
    float t = u_time * 2.0;
    
    // Expanding shockwave ring
    float ring = smoothstep(t - 0.2, t, d) - smoothstep(t, t + 0.05, d);
    float flash = smoothstep(0.4, 0.0, d / (t + 0.01));
    
    vec3 color = mix(vec3(1.0, 0.35, 0.08), vec3(1.0, 0.85, 0.15), ring);
    color = mix(color, vec3(1.0, 1.0, 1.0), flash * (1.0 - t * 0.5));
    
    float alpha = (ring * 1.5 + flash * 0.8) * (1.0 - t * 0.4);
    gl_FragColor = vec4(color, clamp(alpha, 0.0, 1.0));
}
`;

const CONFETTI_FS = `
precision mediump float;
uniform float u_time;
uniform vec2 u_resolution;

float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
}

vec4 renderLayer(vec2 uv, vec2 st, float layerId) {
    float depth = (layerId + 1.0) / 3.0;
    float numLanes = 16.0 - (depth * 8.0);
    float speedMult = 0.5 + depth * 1.0;
    float gridScaleY = 6.0 / depth;
    vec2 baseGPos = vec2(st.x * numLanes, st.y * gridScaleY);
    float bottomFade = smoothstep(0.0, 0.1, uv.y);
    vec4 layerAcc = vec4(0.0);

    for (int x = -1; x <= 1; x++) {
        float laneId = floor(baseGPos.x) + float(x);
        float lSpeed = speedMult * (0.7 + hash(vec2(laneId, layerId * 1.1)) * 0.6);
        float tFall = u_time * lSpeed;
        float gPosY = baseGPos.y + tFall;
        float iposY_base = floor(gPosY);

        for (int y = -1; y <= 1; y++) {
            float iposY = iposY_base + float(y);
            vec2 ipos = vec2(laneId, iposY);

            float rnd = hash(ipos + layerId * 123.45);
            float rnd2 = fract(rnd * 13.57);
            float rnd3 = fract(rnd * 43.21);
            
            vec2 p = vec2(baseGPos.x - laneId - 0.5, gPosY - iposY - 0.5);
            p -= (vec2(rnd2, rnd3) - 0.5) * 0.3;

            if (abs(p.x) > 0.6 || abs(p.y) > 0.3) continue;

            float tBase = u_time * (2.0 + rnd2 * 5.0) + rnd * 6.283;
            p.x += sin(tBase * 0.5) * (0.08 + depth * 0.15);

            float flip = cos(tBase * 0.8);
            float sA = sin(tBase);
            float cA = cos(tBase);
            p = mat2(cA, -sA, sA, cA) * p;
            p.x /= max(0.1, abs(flip));

            float size = (0.02 + depth * 0.05) * (0.8 + rnd * 0.4);
            vec2 dBox = abs(p) - vec2(size, size * 0.6);
            float pieceMask = smoothstep(0.01, 0.0, max(dBox.x, dBox.y));
            
            if (pieceMask > 0.0) {
                vec3 baseColor = 0.5 + 0.5 * cos(rnd * 6.283 + vec3(0, 2, 4));
                vec3 finalColor = baseColor * (0.5 + depth * 0.5) * (0.8 + 0.2 * abs(flip));
                float alpha = pieceMask * bottomFade;
                vec4 particleCol = vec4(finalColor * alpha, alpha);
                layerAcc = particleCol + layerAcc * (1.0 - particleCol.a);
            }
        }
    }
    return layerAcc;
}

void main() {
    vec2 uv = gl_FragCoord.xy / u_resolution.xy;
    vec2 st = uv;
    st.x *= u_resolution.x / u_resolution.y;

    vec4 finalOut = vec4(0.0);
    for (int i = 0; i < 3; i++) {
        vec4 layerColor = renderLayer(uv, st, float(i));
        finalOut = layerColor + finalOut * (1.0 - layerColor.a);
    }
    gl_FragColor = finalOut;
}
`;

const VS_SOURCE = `
  attribute vec2 position;
  void main() {
    gl_Position = vec4(position, 0.0, 1.0);
  }
`;

interface FloatingText {
  id: string;
  text: string;
  color: string;
  left: string;
  top: string;
}

interface Particle {
  id: string;
  x: number;
  y: number;
  color: string;
  tx: number;
  ty: number;
}

interface EffectsContextType {
  floatText: (text: string, color?: string) => void;
  particles: (elementId: string | HTMLElement, color?: string, count?: number) => void;
  particlesAt: (x: number, y: number, color?: string, count?: number) => void;
  shakeScreen: () => void;
  explodeAt: (x: number, y: number) => void;
  startConfetti: () => void;
  stopConfetti: () => void;
  isShaking: boolean;
}

const EffectsContext = createContext<EffectsContextType | undefined>(undefined);

export const useEffects = () => {
  const context = useContext(EffectsContext);
  if (!context) {
    throw new Error('useEffects must be used within EffectsProvider');
  }
  return context;
};

export const EffectsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [floaters, setFloaters] = useState<FloatingText[]>([]);
  const [sparks, setSparks] = useState<Particle[]>([]);
  const [isShaking, setIsShaking] = useState(false);
  const [isConfettiActive, setIsConfettiActive] = useState(false);

  // Shockwave states
  const [shockwave, setShockwave] = useState<{ x: number; y: number } | null>(null);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const confettiCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Trigger floating text
  const floatText = (text: string, color = '#ffd23f') => {
    const id = Math.random().toString();
    const l = 20 + Math.random() * 60;
    const t = 35 + Math.random() * 45;
    
    setFloaters((prev) => [...prev, { id, text, color, left: `${l}%`, top: `${t}%` }]);
    setTimeout(() => {
      setFloaters((prev) => prev.filter((item) => item.id !== id));
    }, 1500);
  };

  // Trigger particle burst around an element or ID
  const particles = (target: string | HTMLElement, color = '#38b000', count = 12) => {
    let el: HTMLElement | null = null;
    if (typeof target === 'string') {
      el = document.getElementById(target);
    } else {
      el = target;
    }

    if (!el) return;

    const rect = el.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    particlesAt(cx, cy, color, count);
  };

  // Trigger particle burst at raw page coordinates
  const particlesAt = (x: number, y: number, color = '#38b000', count = 12) => {
    const newSparks: Particle[] = [];
    for (let i = 0; i < count; i++) {
      const id = Math.random().toString();
      const tx = (Math.random() - 0.5) * 200;
      const ty = (Math.random() - 0.5) * 200;
      newSparks.push({ id, x, y, color, tx, ty });
    }

    setSparks((prev) => [...prev, ...newSparks]);
    setTimeout(() => {
      const idsToRemove = new Set(newSparks.map(s => s.id));
      setSparks((prev) => prev.filter((item) => !idsToRemove.has(item.id)));
    }, 1000);
  };

  // Soundless screen shake (game classes hook this state into CSS classes)
  const shakeScreen = () => {
    setIsShaking(true);
    setTimeout(() => {
      setIsShaking(false);
    }, 600);
  };

  // Set epicenter and trigger WebGL shockwave
  const explodeAt = (x: number, y: number) => {
    setShockwave({ x, y });
    shakeScreen();
    setTimeout(() => {
      setShockwave(null);
    }, 2000);
  };

  const startConfetti = () => setIsConfettiActive(true);
  const stopConfetti = () => setIsConfettiActive(false);

  // WebGL Shockwave Renderer
  useEffect(() => {
    if (!shockwave) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext('webgl', { alpha: true });
    if (!gl) return;

    // Helper functions
    const compile = (type: number, src: string) => {
      const s = gl.createShader(type);
      if (!s) return null;
      gl.shaderSource(s, src);
      gl.compileShader(s);
      return s;
    };

    const vs = compile(gl.VERTEX_SHADER, VS_SOURCE);
    const fs = compile(gl.FRAGMENT_SHADER, SHOCKWAVE_FS);
    if (!vs || !fs) return;

    const prog = gl.createProgram();
    if (!prog) return;
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);
    gl.useProgram(prog);

    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 1,-1, -1,1, -1,1, 1,-1, 1,1]), gl.STATIC_DRAW);

    const pos = gl.getAttribLocation(prog, 'position');
    gl.enableVertexAttribArray(pos);
    gl.vertexAttribPointer(pos, 2, gl.FLOAT, false, 0, 0);

    const timeLoc = gl.getUniformLocation(prog, 'u_time');
    const resLoc = gl.getUniformLocation(prog, 'u_resolution');
    const epiLoc = gl.getUniformLocation(prog, 'u_epicenter');

    const startTime = performance.now();
    let animId: number;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      gl.viewport(0, 0, canvas.width, canvas.height);
    };
    resize();

    const draw = () => {
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.clearColor(0,0,0,0);
      gl.clear(gl.COLOR_BUFFER_BIT);

      gl.useProgram(prog);
      gl.uniform1f(timeLoc, (performance.now() - startTime) / 1000);
      gl.uniform2f(resLoc, canvas.width, canvas.height);
      // Flip epicenter's Y coordinate to align coordinate systems (WebGL is bottom-to-top)
      gl.uniform2f(epiLoc, shockwave.x, canvas.height - shockwave.y);

      gl.drawArrays(gl.TRIANGLES, 0, 6);
      animId = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      cancelAnimationFrame(animId);
      gl.deleteBuffer(buffer);
      gl.deleteProgram(prog);
    };
  }, [shockwave]);

  // WebGL Confetti Cascade Renderer
  useEffect(() => {
    if (!isConfettiActive) return;
    const canvas = confettiCanvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext('webgl', { alpha: true });
    if (!gl) return;

    const compile = (type: number, src: string) => {
      const s = gl.createShader(type);
      if (!s) return null;
      gl.shaderSource(s, src);
      gl.compileShader(s);
      return s;
    };

    const vs = compile(gl.VERTEX_SHADER, VS_SOURCE);
    const fs = compile(gl.FRAGMENT_SHADER, CONFETTI_FS);
    if (!vs || !fs) return;

    const prog = gl.createProgram();
    if (!prog) return;
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);
    gl.useProgram(prog);

    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 1,-1, -1,1, -1,1, 1,-1, 1,1]), gl.STATIC_DRAW);

    const pos = gl.getAttribLocation(prog, 'position');
    gl.enableVertexAttribArray(pos);
    gl.vertexAttribPointer(pos, 2, gl.FLOAT, false, 0, 0);

    const timeLoc = gl.getUniformLocation(prog, 'u_time');
    const resLoc = gl.getUniformLocation(prog, 'u_resolution');

    const startTime = performance.now();
    let animId: number;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      gl.viewport(0, 0, canvas.width, canvas.height);
    };
    resize();
    window.addEventListener('resize', resize);

    const draw = () => {
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.clearColor(0,0,0,0);
      gl.clear(gl.COLOR_BUFFER_BIT);

      gl.useProgram(prog);
      gl.uniform1f(timeLoc, (performance.now() - startTime) / 1000);
      gl.uniform2f(resLoc, canvas.width, canvas.height);

      gl.drawArrays(gl.TRIANGLES, 0, 6);
      animId = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animId);
      gl.deleteBuffer(buffer);
      gl.deleteProgram(prog);
    };
  }, [isConfettiActive]);

  return (
    <EffectsContext.Provider value={{
      floatText,
      particles,
      particlesAt,
      shakeScreen,
      explodeAt,
      startConfetti,
      stopConfetti,
      isShaking
    }}>
      <div className={`relative w-full h-full min-h-screen select-none ${isShaking ? 'animate-[shake_0.6s_infinite_ease-in-out]' : ''}`}>
        {children}

        {/* Global Floating Text Overlay */}
        <div id="effects-overlay" className="absolute inset-0 w-full h-full pointer-events-none overflow-hidden z-[9999]">
          {floaters.map((f) => (
            <div
              key={f.id}
              className="absolute font-['Outfit',_sans-serif] text-3xl font-extrabold tracking-wider filter drop-shadow-[0_0_8px_rgba(255,255,255,0.7)] animate-[floatFade_1.5s_forwards_cubic-bezier(0.18,0.89,0.32,1.28)]"
              style={{ color: f.color, left: f.left, top: f.top }}
            >
              {f.text}
            </div>
          ))}

          {/* Glowing particle bursts */}
          {sparks.map((s) => (
            <div
              key={s.id}
              className="absolute w-3 h-3 rounded-full shadow-[0_0_10px_currentColor] animate-[particleExplode_1s_forwards]"
              style={{
                color: s.color,
                background: s.color,
                left: s.x,
                top: s.y,
                '--tx': `${s.tx}px`,
                '--ty': `${s.ty}px`
              } as React.CSSProperties}
            />
          ))}
        </div>

        {/* Shockwave webgl canvas overlay */}
        {shockwave && (
          <canvas
            ref={canvasRef}
            className="fixed inset-0 w-full h-full pointer-events-none z-[9998]"
          />
        )}

        {/* Confetti celebration webgl canvas overlay - Rendered above UI to prevent backdrop-blur interference */}
        {isConfettiActive && (
          <canvas
            ref={confettiCanvasRef}
            className="fixed inset-0 w-full h-full pointer-events-none z-[60]"
          />
        )}

      </div>
    </EffectsContext.Provider>
  );
};
