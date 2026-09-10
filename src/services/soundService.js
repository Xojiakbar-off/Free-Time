class SoundService {
  constructor() {
    this.ctx = null;
    this.activeNodes = {};
  }

  initContext() {
    if (!this.ctx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioContext();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  playChime() {
    try {
      this.initContext();
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, this.ctx.currentTime); // D5
      osc.frequency.exponentialRampToValueAtTime(880, this.ctx.currentTime + 0.3); // A5
      
      gain.gain.setValueAtTime(0.3, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 1.2);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      
      osc.start();
      osc.stop(this.ctx.currentTime + 1.2);
    } catch (e) {
      console.warn("Audio chime error:", e);
    }
  }

  playAmbient(type, volume = 0.5) {
    try {
      this.initContext();
      this.stopAmbient(type);

      const bufferSize = 2 * this.ctx.sampleRate;
      const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }

      const whiteNoise = this.ctx.createBufferSource();
      whiteNoise.buffer = noiseBuffer;
      whiteNoise.loop = true;

      const gainNode = this.ctx.createGain();
      gainNode.gain.setValueAtTime(volume * 0.4, this.ctx.currentTime);

      if (type === 'rain') {
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 1000;
        whiteNoise.connect(filter);
        filter.connect(gainNode);
      } else if (type === 'ocean') {
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.value = 400;
        filter.Q.value = 1;

        // Wave oscillation
        const lfo = this.ctx.createOscillator();
        lfo.frequency.value = 0.15; // 6-7 seconds wave cycle
        const lfoGain = this.ctx.createGain();
        lfoGain.gain.value = 250;
        lfo.connect(lfoGain);
        lfoGain.connect(filter.frequency);
        lfo.start();

        whiteNoise.connect(filter);
        filter.connect(gainNode);
      } else if (type === 'campfire') {
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'highpass';
        filter.frequency.value = 800;
        whiteNoise.connect(filter);
        filter.connect(gainNode);
      } else {
        // default soft white noise
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 3500;
        whiteNoise.connect(filter);
        filter.connect(gainNode);
      }

      gainNode.connect(this.ctx.destination);
      whiteNoise.start();

      this.activeNodes[type] = { source: whiteNoise, gain: gainNode };
    } catch (e) {
      console.warn("Ambient sound play error:", e);
    }
  }

  stopAmbient(type) {
    if (this.activeNodes[type]) {
      try {
        this.activeNodes[type].source.stop();
        this.activeNodes[type].source.disconnect();
      } catch {
        // already stopped
      }
      delete this.activeNodes[type];
    }
  }

  stopAll() {
    Object.keys(this.activeNodes).forEach(type => this.stopAmbient(type));
  }
}

export const soundService = new SoundService();
