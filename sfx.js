/**
 * sfx.js
 * A lightweight, modular sound effects system using the Web Audio API.
 * Designed for browser-based Quantum Simulations without external audio files.
 */

const sfx = {
  ctx: null,
  master: null,
  muted: false,
  volume: 0.8, // PhET level volume
  lastPlayTimes: {},
  cooldown: 50, // Reduced cooldown to allow tighter event layering

  // Lazy Initialization of AudioContext & Master Limiter
  init() {
    if (!this.ctx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        this.ctx = new AudioContext();
        
        // Master Limiter to avoid distortion
        this.master = this.ctx.createGain();
        this.master.gain.value = this.volume;
        this.master.connect(this.ctx.destination);
      } else {
        console.warn("Web Audio API not supported in this browser.");
      }
    }
    // Resume context if suspended
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  },

  // Toggle Mute State
  toggleMute() {
    this.muted = !this.muted;
    const btn = document.getElementById("sfx-mute-btn");
    if (btn) {
      btn.innerHTML = this.muted ? "🔇" : "🔈";
      btn.title = this.muted ? "Unmute Sound" : "Mute Sound";
      btn.style.opacity = this.muted ? "0.6" : "1";
    }
    return this.muted;
  },

  // Safe Play with throttling and context-options
  safePlay(name, options = {}) {
    const now = performance.now();
    if (this.lastPlayTimes[name] && (now - this.lastPlayTimes[name] < this.cooldown)) {
      return; 
    }
    this.lastPlayTimes[name] = now;
    this.play(name, options);
  },

  // Main Synthesis Engine (Premium PhET-Level Sound)
  play(name, options = {}) {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return; 

    const time = this.ctx.currentTime;
    
    // Core output node for this specific sound
    const gain = this.ctx.createGain();

    // 4. ADD SMALL REVERB FEEL (FAKE BUT EFFECTIVE)
    const delay = this.ctx.createDelay();
    delay.delayTime.value = 0.03;
    
    // Route sound directly + slightly delayed through the master limiter
    gain.connect(this.master);
    gain.connect(delay);
    delay.connect(this.master);

    const volMod = options.volume !== undefined ? options.volume : 1.0;
    const isDistorted = options.distort || false;

    // Optional Eve Distortion Layer
    if (isDistorted) {
      const distortOsc = this.ctx.createOscillator();
      const distortGain = this.ctx.createGain();
      distortOsc.type = 'square';
      distortOsc.frequency.setValueAtTime(100, time);
      distortOsc.frequency.exponentialRampToValueAtTime(40, time + 0.3);
      distortGain.gain.value = 0.15 * volMod;
      distortOsc.connect(distortGain);
      distortGain.connect(gain);
      distortOsc.start(time);
      distortOsc.stop(time + 0.4);
    }

    switch (name) {
      case "gate":
        // Smooth sine base + light harmonic (triangle)
        const o1Gate = this.ctx.createOscillator();
        const o2Gate = this.ctx.createOscillator();

        o1Gate.type = 'sine';
        o2Gate.type = 'triangle';

        o1Gate.frequency.value = 600;
        o2Gate.frequency.value = 900;

        o1Gate.connect(gain);
        o2Gate.connect(gain);

        // Premium feel: subtle pitch drop
        o1Gate.frequency.exponentialRampToValueAtTime(400, time + 0.15);

        // Smoother envelope
        gain.gain.setValueAtTime(0.0001, time);
        gain.gain.linearRampToValueAtTime(0.25 * volMod, time + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, time + 0.15);

        o1Gate.start(time);
        o2Gate.start(time);

        o1Gate.stop(time + 0.16);
        o2Gate.stop(time + 0.16);
        break;

      case "run":
        // LAYERED MULTIPLE OSCILLATORS
        [1, 2, 3].forEach((mult, i) => {
          const o = this.ctx.createOscillator();
          const og = this.ctx.createGain();
          o.type = i === 0 ? 'sine' : 'triangle';
          o.frequency.setValueAtTime(300 * mult, time);
          o.frequency.exponentialRampToValueAtTime(800 * mult, time + 0.3);
          
          og.gain.value = 0.2 / (i + 1);
          o.connect(og);
          og.connect(gain);
          
          o.start(time);
          o.stop(time + 0.3);
        });
        
        gain.gain.setValueAtTime(0, time);
        gain.gain.linearRampToValueAtTime(1.2 * volMod, time + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.001, time + 0.3);
        break;

      case "success":
        // Rich layered chime
        [523.25, 659.25].forEach((baseFreq) => { // C5 and E5
          [1, 2].forEach((mult, i) => {
            const o = this.ctx.createOscillator();
            const og = this.ctx.createGain();
            o.type = i === 0 ? 'sine' : 'triangle';
            o.frequency.setValueAtTime(baseFreq * mult, time);
            o.frequency.setValueAtTime((baseFreq + 130) * mult, time + 0.1); 
            
            og.gain.value = 0.25 / (i + 1);
            o.connect(og);
            og.connect(gain);
            
            o.start(time);
            o.stop(time + 0.4);
          });
        });
        
        gain.gain.setValueAtTime(0, time);
        gain.gain.linearRampToValueAtTime(1.2 * volMod, time + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.001, time + 0.4);
        break;

      case "error":
        // Deep layered buzz
        [1, 2, 3].forEach((mult, i) => {
          const o = this.ctx.createOscillator();
          const og = this.ctx.createGain();
          o.type = i === 0 ? 'sawtooth' : 'triangle';
          o.frequency.setValueAtTime(150 * mult, time);
          o.frequency.exponentialRampToValueAtTime(60 * mult, time + 0.35);
          
          og.gain.value = 0.2 / (i + 1);
          o.connect(og);
          og.connect(gain);
          
          o.start(time);
          o.stop(time + 0.35);
        });
        
        gain.gain.setValueAtTime(0, time);
        gain.gain.linearRampToValueAtTime(1.2 * volMod, time + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.001, time + 0.35);
        break;

      case "reset":
        // Soft descending tone
        [1, 2].forEach((mult, i) => {
          const o = this.ctx.createOscillator();
          const og = this.ctx.createGain();
          o.type = 'sine';
          o.frequency.setValueAtTime(400 * mult, time);
          o.frequency.exponentialRampToValueAtTime(150 * mult, time + 0.25);
          
          og.gain.value = 0.3 / (i + 1);
          o.connect(og);
          og.connect(gain);
          
          o.start(time);
          o.stop(time + 0.25);
        });
        
        gain.gain.setValueAtTime(0, time);
        gain.gain.linearRampToValueAtTime(1.0 * volMod, time + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.001, time + 0.25);
        break;

      case "photon":
        // Upgraded premium "whoosh" sound requested
        const oscPhoton = this.ctx.createOscillator();
        oscPhoton.connect(gain);
        
        oscPhoton.type = 'sawtooth';
        oscPhoton.frequency.setValueAtTime(1500, time);
        oscPhoton.frequency.exponentialRampToValueAtTime(300, time + 0.25);

        gain.gain.setValueAtTime(0.001, time);
        gain.gain.linearRampToValueAtTime(0.2 * volMod, time + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, time + 0.3);

        oscPhoton.start(time);
        oscPhoton.stop(time + 0.3);
        break;

      default:
        console.warn(`Sound '${name}' not found.`);
        gain.disconnect();
    }
  },

  // Setup UI Integration
  injectUI() {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this._createButton());
    } else {
      this._createButton();
    }

    // Global listener for generic click sounds on `.tab`, `.gate-btn`, buttons
    document.addEventListener('click', (e) => {
      this.init(); // Unlock AudioContext on first user interaction
      
      const target = e.target.closest('button, .tab, .gate-btn, .pol-btn, .qc-preset-btn, .expi, a');
      if (target && target.id !== 'sfx-mute-btn') {
        // Play subtle interaction sound
        if (!target.disabled) {
          const isTab = target.classList.contains('tab') || target.tagName === 'A' || target.classList.contains('vlab-tab-btn');
          this.safePlay("gate", { volume: isTab ? 0.25 : 0.45 });
        }
      }
    });

    document.addEventListener('keydown', () => { this.init(); }, { once: true });
  },

  _createButton() {
    if (document.getElementById("sfx-mute-btn")) return;

    const btn = document.createElement("button");
    btn.id = "sfx-mute-btn";
    btn.innerHTML = this.muted ? "🔇" : "🔈";
    btn.title = this.muted ? "Unmute Sound" : "Mute Sound";
    
    // Style the button
    Object.assign(btn.style, {
      background: "rgba(255, 255, 255, 0.1)",
      border: "1px solid rgba(255, 255, 255, 0.2)",
      borderRadius: "6px",
      color: "white",
      fontSize: "16px",
      cursor: "pointer",
      padding: "6px 12px",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      transition: "all 0.2s ease",
      boxShadow: "0 2px 5px rgba(0,0,0,0.2)",
      opacity: this.muted ? "0.6" : "1",
      marginRight: "5px" // Add a little spacing
    });

    // Hover effect
    btn.addEventListener("mouseover", () => {
      btn.style.background = "rgba(255, 255, 255, 0.2)";
      btn.style.transform = "translateY(-1px)";
    });
    btn.addEventListener("mouseout", () => {
      btn.style.background = "rgba(255, 255, 255, 0.1)";
      btn.style.transform = "translateY(0)";
    });

    btn.addEventListener("click", (e) => {
      e.stopPropagation(); // prevent general tab clicks
      this.init();
      const isMuted = this.toggleMute();
      if (!isMuted) {
        this.safePlay("gate");
      }
    });

    // Inject into the top nav bar right before the SRM Logo container
    const topBarRight = document.querySelector('.tbar > div:last-child');
    if (topBarRight) {
      topBarRight.prepend(btn);
    } else {
      document.body.prepend(btn); // Fallback
    }
  }
};

// Automatically inject UI
sfx.injectUI();
