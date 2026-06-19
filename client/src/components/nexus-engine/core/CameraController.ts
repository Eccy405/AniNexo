import * as THREE from 'three';

/**
 * CameraController.ts
 * ─────────────────────────────────────────────────────────────────────
 * Manages the camera's target position and applies smooth damping so
 * movements always feel cinematic — never snappy or jarring.
 *
 * Architecture:
 *   scroll → setScrollProgress() → updateTarget() → tick() → camera.position
 *
 * The controller never touches the THREE.Camera directly — it only
 * computes the desired position / lookAt.  The R3F hook (useHiveCamera)
 * reads these values each frame and applies them to the actual camera.
 */

interface CameraConfig {
  /** How aggressively the camera follows its target (0 = frozen, 1 = snap) */
  dampingFactor: number;
  /** Maximum Y tilt applied as the user scrolls through the section */
  maxScrollY: number;
  /** How much the camera drifts on its own (alive-camera feel) */
  driftAmplitude: number;
  /** Frequency of the alive-camera drift in Hz */
  driftFrequency: number;
}

const DEFAULT_CAM_CONFIG: CameraConfig = {
  dampingFactor: 0.055,
  maxScrollY: 2.5,
  driftAmplitude: 0.07,
  driftFrequency: 0.18,
};

export class CameraController {
  private cfg: CameraConfig;

  /** Where we WANT the camera to be */
  readonly target   = new THREE.Vector3(0, 0, 9);
  /** Where the camera IS right now (interpolated toward target) */
  readonly current  = new THREE.Vector3(0, 0, 9);
  /** Where the camera looks */
  readonly lookAt   = new THREE.Vector3(0, 0, 0);

  private scrollProgress = 0;
  private elapsed        = 0;

  constructor(cfg?: Partial<CameraConfig>) {
    this.cfg = { ...DEFAULT_CAM_CONFIG, ...cfg };
  }

  /** Call whenever the section's scroll progress changes [0..1] */
  setScrollProgress(p: number): void {
    this.scrollProgress = Math.max(0, Math.min(1, p));
  }

  /**
   * Call once per frame.
   * @param delta  seconds since last frame
   */
  tick(delta: number): void {
    this.elapsed += delta;

    const { dampingFactor, maxScrollY, driftAmplitude, driftFrequency } = this.cfg;
    const t  = this.elapsed;
    const sp = this.scrollProgress;

    // ── Scroll-driven target ──────────────────────────────────────────
    // As the user scrolls: Y drops (camera descends), Z creeps closer
    this.target.set(
      0,
      -sp * maxScrollY,
      9 - sp * 1.5
    );

    // ── Alive drift added on top ──────────────────────────────────────
    this.target.x += Math.sin(t * driftFrequency * Math.PI * 2) * driftAmplitude;
    this.target.y += Math.cos(t * driftFrequency * 0.7 * Math.PI * 2) * driftAmplitude * 0.6;

    // ── Exponential lerp (damping) ────────────────────────────────────
    // camera.pos = lerp(camera.pos, target, 1 - e^(-damping * delta * 60))
    const alpha = 1 - Math.pow(1 - dampingFactor, delta * 60);
    this.current.lerp(this.target, alpha);

    // ── LookAt tracks slightly behind target for a lag feel ───────────
    this.lookAt.set(
      Math.sin(t * driftFrequency * 0.5 * Math.PI * 2) * 0.3,
      -sp * maxScrollY * 0.4,
      0
    );
  }
}
