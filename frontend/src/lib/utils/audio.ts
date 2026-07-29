export type SoundEffect = 'pop' | 'correct' | 'wrong' | 'stageComplete' | 'quizComplete' | 'countdown' | 'buttonClick' | 'starCollect' | 'whoosh';

class AudioEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private _isMuted = false;

  get isMuted(): boolean {
    return this._isMuted;
  }

  setMuted(muted: boolean) {
    this._isMuted = muted;
    if (this.masterGain && this.ctx) {
      // Use setTargetAtTime for smooth volume transition without clicking
      this.masterGain.gain.setTargetAtTime(muted ? 0 : 1, this.ctx.currentTime, 0.01);
    }
  }

  private initCtx() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        this.ctx = new AudioContextClass();
        this.masterGain = this.ctx.createGain();
        this.masterGain.connect(this.ctx.destination);
        this.masterGain.gain.value = this._isMuted ? 0 : 1;
      }
    }
    return this.ctx;
  }

  play(effect: SoundEffect) {
    if (this._isMuted) return;
    const ctx = this.initCtx();
    if (!ctx || !this.masterGain) return;

    if (ctx.state === 'suspended') {
      ctx.resume();
    }

    const t = ctx.currentTime;
    
    switch (effect) {
      case 'pop': {
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const gain = ctx.createGain();
        
        osc1.type = 'sine';
        osc2.type = 'sine';
        
        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(this.masterGain);
        
        osc1.frequency.setValueAtTime(600, t);
        osc1.frequency.exponentialRampToValueAtTime(1200, t + 0.08);
        
        osc2.frequency.setValueAtTime(1200, t);
        osc2.frequency.exponentialRampToValueAtTime(2400, t + 0.08);
        
        gain.gain.setValueAtTime(0, t);
        gain.gain.linearRampToValueAtTime(0.5, t + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.08);
        
        osc1.start(t);
        osc2.start(t);
        osc1.stop(t + 0.08);
        osc2.stop(t + 0.08);
        break;
      }
      case 'correct': {
        const playDing = (freq: number, delay: number) => {
          const osc = ctx.createOscillator();
          const sine = ctx.createOscillator();
          const gain = ctx.createGain();
          
          osc.type = 'triangle';
          sine.type = 'sine';
          
          osc.frequency.value = freq;
          sine.frequency.value = freq;
          
          osc.connect(gain);
          sine.connect(gain);
          gain.connect(this.masterGain!);
          
          gain.gain.setValueAtTime(0, t + delay);
          gain.gain.linearRampToValueAtTime(0.3, t + delay + 0.02);
          gain.gain.exponentialRampToValueAtTime(0.01, t + delay + 0.3);
          
          osc.start(t + delay);
          sine.start(t + delay);
          osc.stop(t + delay + 0.3);
          sine.stop(t + delay + 0.3);
        };
        // C6 (1046.50 Hz), E6 (1318.51 Hz)
        playDing(1046.50, 0);
        playDing(1318.51, 0.1);
        break;
      }
      case 'wrong': {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        
        osc.connect(gain);
        gain.connect(this.masterGain);
        
        osc.frequency.setValueAtTime(300, t);
        osc.frequency.exponentialRampToValueAtTime(150, t + 0.4);
        
        gain.gain.setValueAtTime(0, t);
        gain.gain.linearRampToValueAtTime(0.5, t + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.4);
        
        osc.start(t);
        osc.stop(t + 0.4);
        break;
      }
      case 'stageComplete': {
        const freqs = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
        freqs.forEach((freq, i) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.value = freq;
          osc.connect(gain);
          gain.connect(this.masterGain!);
          
          const delay = i * 0.1;
          const dur = i === freqs.length - 1 ? 1.0 : 0.4;
          gain.gain.setValueAtTime(0, t + delay);
          gain.gain.linearRampToValueAtTime(0.2, t + delay + 0.05);
          gain.gain.exponentialRampToValueAtTime(0.01, t + delay + dur);
          
          osc.start(t + delay);
          osc.stop(t + delay + dur);
        });
        break;
      }
      case 'quizComplete': {
        const freqs = [523.25, 523.25, 523.25, 659.25, 783.99, 1046.50];
        const delays = [0, 0.2, 0.4, 0.6, 0.8, 1.4];
        freqs.forEach((freq, i) => {
          const osc = ctx.createOscillator();
          const sine = ctx.createOscillator();
          const gain = ctx.createGain();
          
          osc.type = 'triangle';
          sine.type = 'sine';
          osc.frequency.value = freq;
          sine.frequency.value = freq;
          
          osc.connect(gain);
          sine.connect(gain);
          gain.connect(this.masterGain!);
          
          const delay = delays[i];
          const dur = (i === freqs.length - 1) ? 1.5 : 0.3;
          
          gain.gain.setValueAtTime(0, t + delay);
          gain.gain.linearRampToValueAtTime(0.2, t + delay + 0.05);
          gain.gain.exponentialRampToValueAtTime(0.01, t + delay + dur);
          
          osc.start(t + delay);
          sine.start(t + delay);
          osc.stop(t + delay + dur);
          sine.stop(t + delay + dur);
        });
        break;
      }
      case 'countdown': {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.value = 800;
        osc.connect(gain);
        gain.connect(this.masterGain);
        
        gain.gain.setValueAtTime(0, t);
        gain.gain.linearRampToValueAtTime(0.3, t + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.05);
        
        osc.start(t);
        osc.stop(t + 0.05);
        break;
      }
      case 'buttonClick': {
        const bufferSize = ctx.sampleRate * 0.03;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          data[i] = Math.random() * 2 - 1;
        }
        
        const noise = ctx.createBufferSource();
        noise.buffer = buffer;
        
        const filter = ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.value = 2000;
        
        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.2, t);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.03);
        
        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.masterGain);
        
        noise.start(t);
        break;
      }
      case 'starCollect': {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.connect(gain);
        gain.connect(this.masterGain);
        
        osc.frequency.setValueAtTime(1000, t);
        osc.frequency.exponentialRampToValueAtTime(3000, t + 0.15);
        
        gain.gain.setValueAtTime(0, t);
        gain.gain.linearRampToValueAtTime(0.3, t + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.15);
        
        osc.start(t);
        osc.stop(t + 0.15);
        break;
      }
      case 'whoosh': {
        const bufferSize = ctx.sampleRate * 0.2;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          data[i] = Math.random() * 2 - 1;
        }
        
        const noise = ctx.createBufferSource();
        noise.buffer = buffer;
        
        const filter = ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(500, t);
        filter.frequency.exponentialRampToValueAtTime(2000, t + 0.2);
        filter.Q.value = 1.0;
        
        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0, t);
        gain.gain.linearRampToValueAtTime(0.2, t + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.2);
        
        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.masterGain);
        
        noise.start(t);
        break;
      }
    }
  }
}

export const audio = new AudioEngine();
