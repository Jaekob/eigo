/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

interface PlayOptions {
  freq?: number;
  type?: 'sine' | 'square' | 'triangle' | 'sawtooth' | 'noise';
  dur?: number;
  vol?: number;
  attack?: number;
  release?: number;
  endFreq?: number;
  detune?: number;
  filterFreq?: number;
  filterType?: BiquadFilterType;
}

class AudioService {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private noiseBuf: AudioBuffer | null = null;
  private muted: boolean = false;
  private volume: number = 0.5;

  private getCtx(): AudioContext {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  private getMasterGain(): GainNode {
    const c = this.getCtx();
    if (!this.masterGain) {
      this.masterGain = c.createGain();
      this.masterGain.gain.value = this.muted ? 0 : this.volume;
      this.masterGain.connect(c.destination);
    }
    return this.masterGain;
  }

  private getNoiseBuffer(): AudioBuffer {
    const c = this.getCtx();
    if (!this.noiseBuf) {
      this.noiseBuf = c.createBuffer(1, c.sampleRate * 2, c.sampleRate);
      const data = this.noiseBuf.getChannelData(0);
      for (let i = 0; i < data.length; i++) {
        data[i] = Math.random() * 2 - 1;
      }
    }
    return this.noiseBuf;
  }

  public setMuted(muted: boolean): void {
    this.muted = muted;
    if (this.masterGain) {
      this.masterGain.gain.setValueAtTime(muted ? 0 : this.volume, this.getCtx().currentTime);
    }
  }

  public isMuted(): boolean {
    return this.muted;
  }

  public setVolume(vol: number): void {
    this.volume = Math.max(0, Math.min(1, vol));
    if (this.masterGain && !this.muted) {
      this.masterGain.gain.setValueAtTime(this.volume, this.getCtx().currentTime);
    }
  }

  public getVolume(): number {
    return this.volume;
  }

  public play(opts: PlayOptions = {}): void {
    if (this.muted) return;
    try {
      const c = this.getCtx();
      const {
        freq = 440,
        type = 'sine',
        dur = 0.1,
        vol = 0.08,
        attack = 0.005,
        release,
        endFreq,
        detune = 0,
        filterFreq,
        filterType = 'lowpass'
      } = opts;

      const rel = release ?? dur * 0.4;
      const now = c.currentTime;

      let source: OscillatorNode | AudioBufferSourceNode;

      if (type === 'noise') {
        source = c.createBufferSource();
        source.buffer = this.getNoiseBuffer();
        source.loop = true;
      } else {
        source = c.createOscillator();
        source.type = type;
        const safeFreq = Math.max(1, freq);
        source.frequency.setValueAtTime(safeFreq, now);
        source.detune.setValueAtTime(detune, now);
        if (endFreq && endFreq > 0) {
          source.frequency.exponentialRampToValueAtTime(Math.max(1, endFreq), now + dur);
        }
      }

      let lastNode: AudioNode = source;
      if (filterFreq) {
        const filter = c.createBiquadFilter();
        filter.type = filterType;
        filter.frequency.setValueAtTime(filterFreq, now);
        lastNode.connect(filter);
        lastNode = filter;
      }

      const gain = c.createGain();
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(vol, now + attack);
      gain.gain.setValueAtTime(vol, now + dur - rel);
      gain.gain.linearRampToValueAtTime(0, now + dur);

      lastNode.connect(gain);
      gain.connect(this.getMasterGain());

      source.start(now);
      source.stop(now + dur);

      source.onended = () => {
        try { source.disconnect(); } catch (_) {}
        try { gain.disconnect(); } catch (_) {}
      };
    } catch (e) {
      console.warn('[AudioService] Playback failed', e);
    }
  }

  public sequence(freqs: number[], gap = 120, opts: PlayOptions = {}): { cancel: () => void } {
    const ids = freqs.map((freq, i) =>
      setTimeout(() => this.play({ freq, ...opts }), i * gap)
    );
    return {
      cancel() {
        ids.forEach(id => clearTimeout(id));
      }
    };
  }

  // Pre-configured sound design presets
  public sounds = {
    correct: () => {
      this.play({ type: 'noise', dur: 0.03, vol: 0.02, filterFreq: 3000, filterType: 'lowpass' });
      this.sequence([880, 1760], 60, { type: 'sine', dur: 0.12, vol: 0.1 });
    },
    wrong: () => {
      this.play({ freq: 220, endFreq: 110, type: 'sawtooth', dur: 0.35, vol: 0.08 });
      this.play({ type: 'noise', dur: 0.2, vol: 0.04, filterFreq: 600, filterType: 'lowpass' });
    },
    tick: () => {
      this.play({ type: 'noise', dur: 0.006, vol: 0.06, filterFreq: 7000, filterType: 'highpass' });
      this.play({ type: 'noise', dur: 0.015, vol: 0.02, filterFreq: 1200, filterType: 'bandpass' });
      this.play({ freq: 1100, type: 'triangle', dur: 0.01, vol: 0.02, attack: 0.001 });
    },
    bank: () => {
      this.sequence([523, 659, 783, 1046], 70, { type: 'triangle', dur: 0.25, vol: 0.1, detune: 6 });
    },
    victory: () => {
      this.sequence([523, 392, 523, 659, 784, 1046], 120, { type: 'triangle', dur: 0.25, vol: 0.08, detune: 5, attack: 0.02 });
    },
    rare: () => {
      this.sequence([1046, 1318, 1567, 2093], 60, { type: 'sine', dur: 0.2, vol: 0.04, attack: 0.02 });
    },
    bomb: () => {
      this.play({ type: 'noise', dur: 2.5, vol: 0.3, filterFreq: 400, filterType: 'lowpass', attack: 0.05 });
    },
    bombPlant: () => {
      this.play({ type: 'noise', dur: 0.04, vol: 0.04, filterFreq: 1200, filterType: 'bandpass' });
      setTimeout(() => {
        this.play({ type: 'noise', dur: 0.04, vol: 0.04, filterFreq: 1000, filterType: 'bandpass' });
      }, 100);
      setTimeout(() => this.play({ freq: 1200, type: 'sine', dur: 0.08, vol: 0.05 }), 250);
      setTimeout(() => this.play({ freq: 1200, type: 'sine', dur: 0.08, vol: 0.05 }), 400);
    },
    point: (multiplier = 1) => {
      // Small adjustment for multiplier speed
      const baseFreqs = multiplier > 1 ? [988, 1480] : [988, 1319];
      this.sequence(baseFreqs, 50, { type: 'square', dur: 0.1, vol: 0.05, attack: 0.01 });
    },
    navHover: () => {
      this.play({ type: 'noise', dur: 0.008, vol: 0.03, filterFreq: 8000, filterType: 'highpass' });
    },
    navSelect: () => {
      this.play({ type: 'noise', dur: 0.01, vol: 0.05, filterFreq: 5000, filterType: 'highpass' });
      this.play({ type: 'noise', dur: 0.02, vol: 0.03, filterFreq: 1200, filterType: 'bandpass' });
      this.play({ freq: 800, type: 'triangle', dur: 0.015, vol: 0.02 });
    }
  };
}

export const audioService = new AudioService();
