import React, { useEffect, useRef } from 'react';

const VS_SOURCE = `
  attribute vec2 position;
  void main() {
    gl_Position = vec4(position, 0.0, 1.0);
  }
`;

const STARFIELD_FS = `
  precision highp float;
  uniform float u_time;
  uniform float u_travel;
  uniform float u_warp;
  uniform vec2 u_resolution;

  float hash(vec2 p) {
    p = fract(p * vec2(123.34, 456.21));
    p += dot(p, p + 45.32);
    return fract(p.x * p.y);
  }

  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    float a = hash(i);
    float b = hash(i + vec2(1.0, 0.0));
    float c = hash(i + vec2(0.0, 1.0));
    float d = hash(i + vec2(1.0, 1.0));
    return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
  }

  float fbm(vec2 p) {
    float f = 0.0;
    f += 0.5000 * noise(p); p *= 2.0;
    f += 0.2500 * noise(p); p *= 2.0;
    f += 0.1250 * noise(p); p *= 2.0;
    f += 0.0625 * noise(p);
    return f;
  }

  void main() {
    vec2 uv = (gl_FragCoord.xy - 0.5 * u_resolution.xy) / min(u_resolution.y, u_resolution.x);
    
    #define LAYERS 8.0
    #define GRID_SIZE 18.0
    #define STAR_DENSITY 0.98
    #define BRIGHTNESS 0.12
    #define STRETCH_STRENGTH 0.3
    #define TWINKLE_SPEED 0.3
    #define TWINKLE_INTENSITY 0.15
    #define NEBULA_SCALE 1.2
    #define NEBULA_INTENSITY 0.6
    #define NEBULA_COLOR_A vec3(0.35, 0.12, 0.65)
    #define NEBULA_COLOR_B vec3(0.08, 0.32, 0.75)
    
    vec3 base_color = vec3(0.015, 0.008, 0.04) * (uv.y + 0.5);
    
    float n_val = fbm(uv * NEBULA_SCALE);
    float nebula_noise = pow(n_val, 1.8);
    vec3 nebula_blend_color = mix(NEBULA_COLOR_A, NEBULA_COLOR_B, fract(n_val * 2.0));
    vec3 color = mix(base_color, nebula_blend_color, nebula_noise * NEBULA_INTENSITY);
    
    for(float i = 0.0; i < LAYERS; i++) {
        float z = fract(i * (1.0 / LAYERS) + u_travel);
        float fade = smoothstep(0.0, 0.15, z) * smoothstep(1.0, 0.85, z);
        if (fade <= 0.001) continue;

        vec2 p = uv / z;
        vec2 grid = floor(p * GRID_SIZE);
        float seed = hash(grid + i * 99.0);
        
        if (seed > STAR_DENSITY) {
            vec2 jitter = (vec2(hash(grid + 13.0), hash(grid + 17.0)) - 0.5) * 0.7;
            vec2 local = (fract(p * GRID_SIZE) - 0.5) - jitter;
            
            float distSq = dot(local, local);
            if (distSq > 0.4) continue;

            float starSize = mix(0.7, 1.0, fract(seed * 456.78));
            float stretch = 1.0 + (u_warp - 1.0) * STRETCH_STRENGTH * smoothstep(0.1, 1.0, 1.0 - z);
            
            vec2 dir = normalize(p);
            float radial = dot(local, dir);
            vec2 stretched_local = (radial * dir) / stretch + (local - radial * dir);
            float l = length(stretched_local);
            
            if (l > 0.5) continue;

            float phase = hash(grid + i * 123.456);
            float twinkle = 1.0 + (TWINKLE_INTENSITY * starSize) * sin(u_time * TWINKLE_SPEED + phase * 6.283);
            float mask = (1.0 - l * 2.0) * (1.0 - l * 2.0);
            float brightness = (BRIGHTNESS * starSize) / max(0.0005, l);
            color += brightness * mask * fade * vec3(0.9, 0.95, 1.0) * seed * twinkle;
        }
    }
    gl_FragColor = vec4(color, 1.0);
  }
`;

// Tuning Constants
const BASE_SPEED = 0.001;
const WARP_SPEED_MULT = 0.12;
const INTERPOLATION = 0.15;
const WARP_MAGNITUDE = 15;

// Global trigger handler to bridge visual effect triggers easily
let activeTriggerWarp: ((factor?: number, duration?: number, direction?: number) => void) | null = null;

export function triggerWarp(factor = WARP_MAGNITUDE, duration = 150, direction = 1) {
  if (activeTriggerWarp) {
    activeTriggerWarp(factor, duration, direction);
  }
}

export const StarfieldBackground: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationRef = useRef<number | null>(null);

  const warpFactorRef = useRef<number>(1);
  const targetWarpRef = useRef<number>(1);
  const travelRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(performance.now());

  useEffect(() => {
    // Expose structural warp controls
    activeTriggerWarp = (factor = WARP_MAGNITUDE, duration = 150, direction = 1) => {
      targetWarpRef.current = factor * direction;
      setTimeout(() => {
        targetWarpRef.current = 1 * direction;
      }, duration);
    };

    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext('webgl', { alpha: false });
    if (!gl) {
      console.warn('[Starfield] WebGL not supported in this browser.');
      return;
    }

    // Helper functions to compile shaders & link programs
    const compileShader = (type: number, src: string) => {
      const s = gl.createShader(type);
      if (!s) return null;
      gl.shaderSource(s, src);
      gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
        console.error('[Starfield] Shader compilation fail:', gl.getShaderInfoLog(s));
      }
      return s;
    };

    const vs = compileShader(gl.VERTEX_SHADER, VS_SOURCE);
    const fs = compileShader(gl.FRAGMENT_SHADER, STARFIELD_FS);
    if (!vs || !fs) return;

    const program = gl.createProgram();
    if (!program) return;
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);
    if (!gl.getProjectParameter) {
      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        console.error('[Starfield] Program linking fail', gl.getProgramInfoLog(program));
        return;
      }
    }

    gl.useProgram(program);

    const vertices = new Float32Array([
      -1, -1,  1, -1, -1,  1,
      -1,  1,  1, -1,  1,  1,
    ]);

    const vertexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

    const positionLoc = gl.getAttribLocation(program, 'position');
    gl.enableVertexAttribArray(positionLoc);
    gl.vertexAttribPointer(positionLoc, 2, gl.FLOAT, false, 0, 0);

    const timeLoc = gl.getUniformLocation(program, 'u_time');
    const travelLoc = gl.getUniformLocation(program, 'u_travel');
    const warpLoc = gl.getUniformLocation(program, 'u_warp');
    const resolutionLoc = gl.getUniformLocation(program, 'u_resolution');

    const startTime = performance.now();

    const resize = () => {
      if (!canvas) return;
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      gl.viewport(0, 0, canvas.width, canvas.height);
    };

    window.addEventListener('resize', resize);
    resize();

    const render = () => {
      const now = performance.now();
      const dt = (now - lastTimeRef.current) / 1000;
      lastTimeRef.current = now;

      // Update warp levels
      warpFactorRef.current += (targetWarpRef.current - warpFactorRef.current) * INTERPOLATION;
      const mag = Math.abs(warpFactorRef.current);
      const dir = Math.sign(warpFactorRef.current) || 1;

      travelRef.current += dt * (BASE_SPEED + (mag - 1.0) * WARP_SPEED_MULT) * dir;

      gl.useProgram(program);
      gl.uniform1f(timeLoc, (now - startTime) / 1000);
      gl.uniform1f(travelLoc, travelRef.current);
      gl.uniform1f(warpLoc, mag);
      gl.uniform2f(resolutionLoc, canvas.width, canvas.height);

      gl.clearColor(0.0, 0.0, 0.0, 1.0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.drawArrays(gl.TRIANGLES, 0, 6);

      animationRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', resize);
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      gl.deleteBuffer(vertexBuffer);
      gl.deleteProgram(program);
      activeTriggerWarp = null;
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-full h-full pointer-events-none -z-10"
      style={{ display: 'block' }}
    />
  );
};
