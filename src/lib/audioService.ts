// Web Audio Synthesizer for high-fidelity hip-hop loops (Boom Bap, Trap, G-Funk, Synthwave, Industrial)

class AudioService {
  private ctx: AudioContext | null = null;
  private isPlaying = false;
  private bpm = 90;
  private timerId: any = null;
  private currentStep = 0;
  private preset: string = 'boombap';
  private masterVolume: GainNode | null = null;
  private activeNodes: AudioNode[] = [];

  constructor() {}

  private initContext() {
    if (!this.ctx) {
      // @ts-ignore
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioContextClass();
      this.masterVolume = this.ctx.createGain();
      this.masterVolume.gain.setValueAtTime(0.35, this.ctx.currentTime); // Standard safe volume
      this.masterVolume.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public setPreset(newPreset: string) {
    this.preset = newPreset;
    switch (newPreset) {
      case 'synthwave': this.bpm = 110; break;
      case 'boombap': this.bpm = 88; break;
      case 'trap': this.bpm = 140; break;
      case 'gfunk': this.bpm = 96; break;
      case 'industrial': this.bpm = 125; break;
      default: this.bpm = 90;
    }
  }

  public getBpm() {
    return this.bpm;
  }

  public setBpm(val: number) {
    this.bpm = val;
  }

  public start() {
    this.initContext();
    if (this.isPlaying) return;
    this.isPlaying = true;
    this.currentStep = 0;
    this.scheduler();
  }

  public stop() {
    this.isPlaying = false;
    if (this.timerId) {
      clearTimeout(this.timerId);
      this.timerId = null;
    }
    // Clean active nodes
    this.activeNodes.forEach(node => {
      try { (node as any).stop(); } catch (e) {}
    });
    this.activeNodes = [];
  }

  private scheduler() {
    if (!this.isPlaying || !this.ctx) return;
    const stepDuration = 60 / this.bpm / 4; // 16th notes
    this.playStep(this.currentStep, this.ctx.currentTime);
    this.currentStep = (this.currentStep + 1) % 16;
    this.timerId = setTimeout(() => this.scheduler(), stepDuration * 1000);
  }

  private playStep(step: number, time: number) {
    if (!this.ctx || !this.masterVolume) return;

    // Beats grid definitions
    // step: 0 to 15
    const isKick = this.getKickGrid(step);
    const isSnare = this.getSnareGrid(step);
    const isHihat = this.getHihatGrid(step);
    const isMelody = this.getMelodyGrid(step);

    if (isKick) this.triggerKick(time);
    if (isSnare) this.triggerSnare(time);
    if (isHihat && Math.random() > this.getHihatVelocityGate()) this.triggerHihat(time);
    if (isMelody) this.triggerBassOrMelody(time, step);
  }

  private getKickGrid(step: number): boolean {
    switch (this.preset) {
      case 'trap':
        return step === 0 || step === 3 || step === 8 || step === 11 || step === 14;
      case 'boombap':
        return step === 0 || step === 8 || step === 10 || step === 11;
      case 'gfunk':
        return step === 0 || step === 2 || step === 8 || step === 12;
      case 'synthwave':
        return step === 0 || step === 4 || step === 8 || step === 12;
      case 'industrial':
        return step === 0 || step === 4 || step === 8 || step === 12 || step === 14;
      default:
        return step === 0 || step === 8;
    }
  }

  private getSnareGrid(step: number): boolean {
    switch (this.preset) {
      case 'trap':
        return step === 4 || step === 12;
      case 'boombap':
        return step === 4 || step === 12 || (step === 15 && Math.random() > 0.6);
      case 'gfunk':
        return step === 4 || step === 12;
      case 'synthwave':
        return step === 4 || step === 12;
      case 'industrial':
        return step === 4 || step === 10 || step === 12;
      default:
        return step === 4 || step === 12;
    }
  }

  private getHihatGrid(step: number): boolean {
    switch (this.preset) {
      case 'trap':
        return true; // Fast hi-hats on everything
      case 'boombap':
        return step % 2 === 0; // standard eighths
      case 'gfunk':
        return step % 2 === 0 || step === 7 || step === 15;
      case 'synthwave':
        return step % 2 === 1; // offbeat hihats
      case 'industrial':
        return step % 2 === 0;
      default:
        return step % 2 === 0;
    }
  }

  private getHihatVelocityGate(): number {
    // Probability to skip hihat for trap style rolls
    if (this.preset === 'trap') return 0.15;
    return 0.05;
  }

  private getMelodyGrid(step: number): boolean {
    switch (this.preset) {
      case 'trap':
        return step % 4 === 0 || step === 6 || step === 13;
      case 'boombap':
        return step === 0 || step === 3 || step === 8 || step === 11;
      case 'gfunk':
        return step % 2 === 0; // dense synth whistle/bassline
      case 'synthwave':
        return step % 2 === 0;
      case 'industrial':
        return step % 3 === 0;
      default:
        return step === 0;
    }
  }

  private triggerKick(time: number) {
    if (!this.ctx || !this.masterVolume) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.connect(gain);
    gain.connect(this.masterVolume);

    // Deep heavy kick
    osc.frequency.setValueAtTime(150, time);
    osc.frequency.exponentialRampToValueAtTime(0.01, time + 0.35);

    gain.gain.setValueAtTime(1.0, time);
    gain.gain.exponentialRampToValueAtTime(0.01, time + 0.35);

    osc.start(time);
    osc.stop(time + 0.35);
    this.activeNodes.push(osc);
  }

  private triggerSnare(time: number) {
    if (!this.ctx || !this.masterVolume) return;

    // Buffer for white noise snare snap
    const bufferSize = this.ctx.sampleRate * 0.2; // 0.2 seconds
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    // Lowpass filter to make it fat
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(1000, time);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.4, time);
    gain.gain.exponentialRampToValueAtTime(0.01, time + 0.2);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterVolume);

    // Snap sound tone overlay
    const osc = this.ctx.createOscillator();
    const oscGain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(180, time);
    oscGain.gain.setValueAtTime(0.3, time);
    oscGain.gain.exponentialRampToValueAtTime(0.01, time + 0.1);

    osc.connect(oscGain);
    oscGain.connect(this.masterVolume);

    noise.start(time);
    noise.stop(time + 0.2);
    osc.start(time);
    osc.stop(time + 0.1);

    this.activeNodes.push(noise, osc);
  }

  private triggerHihat(time: number) {
    if (!this.ctx || !this.masterVolume) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc.type = 'square';
    osc.frequency.setValueAtTime(8000, time);

    filter.type = 'highpass';
    filter.frequency.setValueAtTime(6000, time);

    gain.gain.setValueAtTime(0.12, time);
    // Fast hihat roll decay for trap
    const decay = this.preset === 'trap' ? 0.05 : 0.08;
    gain.gain.exponentialRampToValueAtTime(0.001, time + decay);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterVolume);

    osc.start(time);
    osc.stop(time + decay);

    this.activeNodes.push(osc);
  }

  private triggerBassOrMelody(time: number, step: number) {
    if (!this.ctx || !this.masterVolume) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.connect(gain);
    gain.connect(this.masterVolume);

    // Melodic notes depending on setting
    let freq = 55; // default A1 sub

    if (this.preset === 'gfunk') {
      // Synth whine lead (extremely distinctive high-pitched west coast synth)
      osc.type = 'sine';
      const notes = [440, 494, 523, 587, 659, 784, 880];
      freq = notes[step % notes.length];
      gain.gain.setValueAtTime(0.15, time);
      gain.gain.linearRampToValueAtTime(0.15, time + 0.18);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.22);
      osc.frequency.setValueAtTime(freq, time);
      osc.frequency.exponentialRampToValueAtTime(freq * 1.05, time + 0.22); // subtle slide
      osc.start(time);
      osc.stop(time + 0.22);
      this.activeNodes.push(osc);
      return;
    }

    if (this.preset === 'trap') {
      // Slidng deep 808 bass
      osc.type = 'triangle';
      const trapBass = [40, 40, 48, 55, 36, 40, 52, 45];
      freq = trapBass[step % trapBass.length];
      gain.gain.setValueAtTime(0.5, time);
      gain.gain.exponentialRampToValueAtTime(0.01, time + 0.4);
      osc.frequency.setValueAtTime(freq, time);
      osc.frequency.exponentialRampToValueAtTime(freq * 0.7, time + 0.4); // slide down
      osc.start(time);
      osc.stop(time + 0.4);
      this.activeNodes.push(osc);
      return;
    }

    if (this.preset === 'synthwave') {
      // Retro synth pluck
      osc.type = 'sawtooth';
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(1000, time);
      filter.frequency.exponentialRampToValueAtTime(100, time + 0.15);

      osc.disconnect(gain);
      osc.connect(filter);
      filter.connect(gain);

      const neonPlucks = [110, 130, 98, 110, 146, 165, 110, 123];
      freq = neonPlucks[step % neonPlucks.length];
      osc.frequency.setValueAtTime(freq, time);
      
      gain.gain.setValueAtTime(0.2, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.18);

      osc.start(time);
      osc.stop(time + 0.18);
      this.activeNodes.push(osc);
      return;
    }

    if (this.preset === 'boombap') {
      // Jazz bassline plucks
      osc.type = 'sine';
      const jazzNotes = [73, 98, 82, 110, 73, 98, 123, 110];
      freq = jazzNotes[step % jazzNotes.length];
      osc.frequency.setValueAtTime(freq, time);

      gain.gain.setValueAtTime(0.4, time);
      gain.gain.exponentialRampToValueAtTime(0.01, time + 0.3);

      osc.start(time);
      osc.stop(time + 0.3);
      this.activeNodes.push(osc);
      return;
    }

    if (this.preset === 'industrial') {
      // Gritty saw oscillator bass
      osc.type = 'sawtooth';
      const indNotes = [65, 73, 58, 65, 87, 58];
      freq = indNotes[step % indNotes.length];
      osc.frequency.setValueAtTime(freq, time);

      gain.gain.setValueAtTime(0.25, time);
      gain.gain.exponentialRampToValueAtTime(0.01, time + 0.2);

      osc.start(time);
      osc.stop(time + 0.2);
      this.activeNodes.push(osc);
      return;
    }

    // Default simple synth
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(55, time);
    gain.gain.setValueAtTime(0.3, time);
    gain.gain.exponentialRampToValueAtTime(0.01, time + 0.25);
    osc.start(time);
    osc.stop(time + 0.25);
    this.activeNodes.push(osc);
  }
}

export const synthBeat = new AudioService();
export default synthBeat;
