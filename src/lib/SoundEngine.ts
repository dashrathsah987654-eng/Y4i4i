/**
 * SoundEngine: A procedural audio system for MentorMind.
 * Generates ambient pads and UI feedback sounds using Web Audio API.
 */

class SoundEngine {
  private ctx: AudioContext | null = null;
  private mainGain: GainNode | null = null;
  private ambientOsc: OscillatorNode | null = null;
  private isAmbientPlaying = false;

  private init() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      this.mainGain = this.ctx.createGain();
      this.mainGain.connect(this.ctx.destination);
      this.mainGain.gain.value = 0.3;
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  playEnter() {
    this.init();
    if (!this.ctx || !this.mainGain) return;
    
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(100, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(400, this.ctx.currentTime + 0.5);
    
    g.gain.setValueAtTime(0, this.ctx.currentTime);
    g.gain.linearRampToValueAtTime(0.2, this.ctx.currentTime + 0.1);
    g.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.5);
    
    osc.connect(g);
    g.connect(this.mainGain);
    
    osc.start();
    osc.stop(this.ctx.currentTime + 0.5);
  }

  playTap() {
    this.init();
    if (!this.ctx || !this.mainGain) return;
    
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(400, this.ctx.currentTime + 0.1);
    
    g.gain.setValueAtTime(0.1, this.ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.1);
    
    osc.connect(g);
    g.connect(this.mainGain);
    
    osc.start();
    osc.stop(this.ctx.currentTime + 0.1);
  }

  startAmbient() {
    this.init();
    if (!this.ctx || !this.mainGain || this.isAmbientPlaying) return;
    
    this.ambientOsc = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    const g = this.ctx.createGain();
    
    this.ambientOsc.type = 'sawtooth';
    this.ambientOsc.frequency.setValueAtTime(55, this.ctx.currentTime); // Low A
    
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(200, this.ctx.currentTime);
    
    g.gain.setValueAtTime(0, this.ctx.currentTime);
    g.gain.linearRampToValueAtTime(0.05, this.ctx.currentTime + 2);
    
    this.ambientOsc.connect(filter);
    filter.connect(g);
    g.connect(this.mainGain);
    
    this.ambientOsc.start();
    this.isAmbientPlaying = true;
  }

  stopAmbient() {
    if (this.ambientOsc) {
      this.ambientOsc.stop();
      this.ambientOsc = null;
      this.isAmbientPlaying = false;
    }
  }

  setVolume(val: number) {
    if (this.mainGain) {
      this.mainGain.gain.setTargetAtTime(val, this.ctx?.currentTime || 0, 0.1);
    }
  }
}

export const soundEngine = new SoundEngine();
