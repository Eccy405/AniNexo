/**
 * AnimationController.ts
 * ─────────────────────────────────────────────────────────────────────
 * Manages the per-node state machine and computes target animation values.
 *
 * States (in order of lifecycle):
 *   IDLE     → node is outside the viewport pool, no resources
 *   VISIBLE  → node is active, slow breathing animation
 *   HOVER    → pointer nearby, node advances toward camera + glows
 *   SELECTED → clicked, camera focuses on it
 *   RECYCLE  → fade-out before repositioning in the pool
 *
 * Sprint 2 scope: IDLE / VISIBLE / HOVER / RECYCLE transitions.
 *                 SELECTED / EXPANDED are Sprint 4.
 */

export type NodeState = 'IDLE' | 'VISIBLE' | 'HOVER' | 'SELECTED' | 'EXPANDED' | 'RECYCLE';

export interface NodeAnimData {
  state: NodeState;
  /** 0..1 – used to lerp scale / opacity smoothly when entering or recycling */
  blendAlpha: number;
  /** Z-offset added on top of base position when hovering */
  hoverZ: number;
  /** Per-node phase offset so they don't all breathe in sync */
  phase: number;
}

const LERP_SPEED = 6; // units/sec for blendAlpha changes

export class AnimationController {
  private nodes: NodeAnimData[] = [];

  constructor(count: number) {
    this.reset(count);
  }

  /** Re-initialise for a new pool size */
  reset(count: number): void {
    this.nodes = Array.from({ length: count }, (_, i) => ({
      state: 'IDLE',
      blendAlpha: 0,
      hoverZ: 0,
      phase: (i / count) * Math.PI * 2, // stagger phases across the pool
    }));
  }

  getNode(index: number): NodeAnimData {
    return this.nodes[index];
  }

  /** Returns the full nodes array (read-only snapshot for renderers that don't drive the tick) */
  getNodes(): NodeAnimData[] {
    return this.nodes;
  }

  setState(index: number, next: NodeState): void {
    const node = this.nodes[index];
    if (!node || node.state === next) return;
    node.state = next;
  }

  /** Call once per frame with the elapsed delta.  Returns mutated data array. */
  tick(delta: number): NodeAnimData[] {
    const lerpDelta = Math.min(delta * LERP_SPEED, 1);

    for (const node of this.nodes) {
      switch (node.state) {
        case 'IDLE':
          node.blendAlpha = node.blendAlpha - lerpDelta > 0
            ? node.blendAlpha - lerpDelta
            : 0;
          break;

        case 'VISIBLE':
          node.blendAlpha = node.blendAlpha + lerpDelta < 1
            ? node.blendAlpha + lerpDelta
            : 1;
          node.hoverZ = node.hoverZ * (1 - lerpDelta); // return to base
          break;

        case 'HOVER':
          node.blendAlpha = 1;
          node.hoverZ = node.hoverZ + (0.35 - node.hoverZ) * lerpDelta;
          break;

        case 'RECYCLE':
          node.blendAlpha = node.blendAlpha - lerpDelta > 0
            ? node.blendAlpha - lerpDelta
            : 0;
          if (node.blendAlpha === 0) node.state = 'IDLE';
          break;
      }
    }
    return this.nodes;
  }
}
