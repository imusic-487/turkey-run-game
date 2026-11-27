// Synthesised sound: every gobble, flap and ding is made with WebAudio
// oscillators and filtered noise, so the game ships no audio files and
// makes no network request.
export class SoundBank {
  constructor() {
    this.context = null;
    this.master = null;
    this.muted = false;
  }

  ensure() {
    if (this.context) {
      if (this.context.state === 'suspended') this.context.resume();
      return;
    }
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    try {
      this.context = new AudioContext();
    } catch {
      // No audio device (headless browsers, for example): stay silent.
      return;
    }
    this.master = this.context.createGain();
    this.master.gain.value = 0.5;
    this.master.connect(this.context.destination);
  }

  toggleMute() {
    this.muted = !this.muted;
    if (this.master) this.master.gain.value = this.muted ? 0 : 0.5;
    return this.muted;
  }

  tone(freq, endFreq, duration, type, volume, delay = 0) {
    if (!this.context || this.muted) return;
    const t0 = this.context.currentTime + delay;
    const osc = this.context.createOscillator();
    const gain = this.context.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    if (endFreq !== freq) osc.frequency.exponentialRampToValueAtTime(Math.max(20, endFreq), t0 + duration);
    gain.gain.setValueAtTime(0.0001, t0);
    gain.gain.exponentialRampToValueAtTime(volume, t0 + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);
    osc.connect(gain);
    gain.connect(this.master);
    osc.start(t0);
    osc.stop(t0 + duration + 0.05);
  }

  noise(duration, volume, lowpass, delay = 0) {
    if (!this.context || this.muted) return;
    const t0 = this.context.currentTime + delay;
    const length = Math.max(1, Math.floor(this.context.sampleRate * duration));
    const buffer = this.context.createBuffer(1, length, this.context.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < length; i += 1) data[i] = (Math.random() * 2 - 1) * (1 - i / length);
    const source = this.context.createBufferSource();
    source.buffer = buffer;
    const filter = this.context.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = lowpass;
    const gain = this.context.createGain();
    gain.gain.value = volume;
    source.connect(filter);
    filter.connect(gain);
    gain.connect(this.master);
    source.start(t0);
  }

  // The turkey's signature: two quick low honks, "gobble-gobble".
  gobble() {
    this.tone(320, 180, 0.09, 'sawtooth', 0.16);
    this.tone(280, 150, 0.11, 'sawtooth', 0.16, 0.11);
    this.tone(340, 200, 0.08, 'square', 0.07, 0.05);
  }

  flap() {
    this.noise(0.12, 0.25, 900);
  }

  jump() {
    this.tone(300, 520, 0.12, 'sine', 0.12);
  }

  pickup() {
    this.tone(880, 880, 0.07, 'sine', 0.14);
    this.tone(1318, 1318, 0.1, 'sine', 0.14, 0.07);
  }

  golden() {
    this.tone(660, 660, 0.07, 'sine', 0.14);
    this.tone(880, 880, 0.07, 'sine', 0.14, 0.06);
    this.tone(1320, 1320, 0.12, 'sine', 0.14, 0.12);
  }

  hurt() {
    this.tone(520, 130, 0.28, 'sawtooth', 0.22);
    this.noise(0.18, 0.2, 1400);
  }

  caught() {
    this.tone(392, 392, 0.16, 'square', 0.16);
    this.tone(311, 311, 0.16, 'square', 0.16, 0.16);
    this.tone(233, 110, 0.5, 'square', 0.18, 0.32);
  }

  escaped() {
    const notes = [523, 659, 784, 1047];
    notes.forEach((note, i) => this.tone(note, note, 0.18, 'triangle', 0.16, i * 0.13));
    this.tone(1319, 1319, 0.4, 'triangle', 0.12, 0.55);
  }

  alarm() {
    this.tone(980, 980, 0.09, 'square', 0.08);
    this.tone(980, 980, 0.09, 'square', 0.08, 0.13);
  }

  click() {
    this.tone(700, 900, 0.05, 'sine', 0.1);
  }

  stage() {
    this.tone(440, 660, 0.12, 'triangle', 0.12);
    this.tone(660, 880, 0.14, 'triangle', 0.12, 0.11);
  }
}
