/**
 * TimelineController.ts
 * ─────────────────────────────────────────────────────────────────────
 * Single source of truth for scene-wide time and scroll progress.
 *
 * Consumers (camera, animation, particles, AI pulse) read from here
 * instead of each keeping their own clock, avoiding drift.
 *
 * Sprint 2 scope:
 *   - global elapsed time
 *   - scroll progress [0..1]
 *   - AI pulse trigger every 20-30 seconds
 *
 * Sprint 4 will add keyed animation sequences.
 */

import { eventBus } from './EventBus';

export class TimelineController {
  private _elapsed       = 0;
  private _scrollProgress = 0;
  private _lastPulse     = 0;
  private pulseInterval: number;   // seconds between AI pulses

  constructor(pulseIntervalSeconds = 22) {
    this.pulseInterval = pulseIntervalSeconds;
  }

  get elapsed():        number { return this._elapsed; }
  get scrollProgress(): number { return this._scrollProgress; }

  setScrollProgress(p: number): void {
    this._scrollProgress = Math.max(0, Math.min(1, p));
  }

  /** Call once per frame with delta in seconds */
  tick(delta: number): void {
    this._elapsed += delta;

    // Trigger periodic AI pulse
    if (this._elapsed - this._lastPulse >= this.pulseInterval) {
      this._lastPulse = this._elapsed;
      eventBus.emit('AI_PULSE_START', { originId: 'timeline' });
    }
  }
}
