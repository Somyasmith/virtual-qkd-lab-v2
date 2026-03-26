/**
 * soundManager.js
 * Dedicated sound effects manager for quantum simulations
 * Restricts sounds to simulation interactions only
 */

const soundManager = {
  isSimulationActive: false,

  // Initialize sound system
  init() {
    if (typeof sfx !== 'undefined' && sfx.init) {
      sfx.init();
    }
  },

  // Set simulation active state
  setSimulationActive(active) {
    this.isSimulationActive = active;
  },

  // Play sound only if simulation is active
  playSound(type, options = {}) {
    if (!this.isSimulationActive) {
      return; // Silent outside simulations
    }

    if (typeof sfx !== 'undefined' && sfx.safePlay) {
      sfx.safePlay(type, options);
    }
  },

  // Stop all sounds
  stopAllSounds() {
    if (typeof sfx !== 'undefined' && sfx.ctx) {
      // Cancel all scheduled sounds
      if (sfx.ctx.suspend) {
        sfx.ctx.suspend();
      }
    }
  },

  // Toggle mute (affects all sounds)
  toggleMute() {
    if (typeof sfx !== 'undefined' && sfx.toggleMute) {
      return sfx.toggleMute();
    }
    return false;
  }
};

// Auto-initialize
soundManager.init();