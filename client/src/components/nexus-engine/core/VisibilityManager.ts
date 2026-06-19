/**
 * VisibilityManager.ts
 * ─────────────────────────────────────────────────────────────────────
 * Controls which pool slots are active (VISIBLE) vs recycled (IDLE)
 * based on camera position.
 *
 * Strategy (Sprint 3):
 *  - Maintains a virtual infinite grid of anime nodes.
 *  - The pool has a fixed number of InstancedMesh slots (nodeCount).
 *  - As the camera moves, nodes that drift beyond a Y threshold are
 *    marked RECYCLE, repositioned, and loaded with a new anime entry.
 *  - Prefetch: keeps a small buffer queue of upcoming items ready so
 *    there's no visual pop when a node becomes visible.
 *
 * The manager does NOT interact with Three.js directly —
 * it only returns data that the rendering layer reads each frame.
 */

import { AnimationController } from './AnimationController';
import { eventBus } from './EventBus';

export interface AnimeNode {
  id:          number;
  title:       string;
  coverImage:  string;
  score:       number;
  status:      string;
  genres:      string[];
}

interface PoolSlot {
  instanceIndex: number;
  anime:         AnimeNode | null;
  /** Base grid row in the virtual infinite grid */
  virtualRow: number;
}

export class VisibilityManager {
  private pool:         PoolSlot[];
  private catalog:      AnimeNode[]    = [];
  private catalogIndex  = 0;
  private prefetchQueue: AnimeNode[]   = [];

  constructor(
    private readonly nodeCount:  number,
    private readonly animCtrl:   AnimationController
  ) {
    this.pool = Array.from({ length: nodeCount }, (_, i) => ({
      instanceIndex: i,
      anime:         null,
      virtualRow:    Math.floor(i / 8), // initial row assignment (8 cols)
    }));
  }

  /** Feed the full anime catalog.  Call once after initial API load. */
  setCatalog(animes: AnimeNode[]): void {
    this.catalog      = animes;
    this.catalogIndex = 0;

    // Assign first N animes to the pool
    this.pool.forEach(slot => {
      slot.anime = this.nextAnime();
      if (slot.anime) this.animCtrl.setState(slot.instanceIndex, 'VISIBLE');
    });
  }

  /** Returns the anime currently assigned to a pool slot (for shader UV lookup) */
  getAnimeForSlot(instanceIndex: number): AnimeNode | null {
    return this.pool[instanceIndex]?.anime ?? null;
  }

  /**
   * Call from the frame loop when the camera Y position changes significantly.
   * Slots whose anime is far behind the camera are recycled to the front.
   *
   * @param cameraY  current camera Y in world units
   * @param rowHeight spacing between hex rows in world units
   */
  tickRecycle(cameraY: number, rowHeight: number): void {
    const threshold = cameraY - rowHeight * 2; // rows more than 2 below camera

    for (const slot of this.pool) {
      const slotWorldY = slot.virtualRow * rowHeight;
      if (slotWorldY < threshold) {
        this.recycleSlot(slot, cameraY, rowHeight);
      }
    }
  }

  private recycleSlot(slot: PoolSlot, cameraY: number, rowHeight: number): void {
    // Move virtual row far ahead of the camera
    const highestRow = Math.max(...this.pool.map(s => s.virtualRow));
    slot.virtualRow  = highestRow + 1;

    // Assign next anime from catalog
    const next = this.nextAnime();
    if (next) {
      slot.anime = next;
      this.animCtrl.setState(slot.instanceIndex, 'RECYCLE');
      // Brief delay then flip back to VISIBLE (handled by AnimationController)
      setTimeout(() => {
        this.animCtrl.setState(slot.instanceIndex, 'VISIBLE');
      }, 400);
    }
  }

  private nextAnime(): AnimeNode | null {
    if (this.catalog.length === 0) return null;
    const anime = this.catalog[this.catalogIndex % this.catalog.length];
    this.catalogIndex++;
    return anime;
  }
}
