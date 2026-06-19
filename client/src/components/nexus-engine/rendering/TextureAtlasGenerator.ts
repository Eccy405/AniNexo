/**
 * TextureAtlasGenerator.ts
 * ─────────────────────────────────────────────────────────────────────
 * Packs anime poster images into a single CanvasTexture (GPU upload
 * happens once).  Each slot has UV offset + scale stored in a Float32Array
 * so the shader can map any hexagon to the correct sub-region.
 *
 * LRU Cache: when the atlas is full and a new image is requested, the
 * least-recently-used slot is overwritten.  Images already in the cache
 * are returned instantly without a network round-trip.
 *
 * Grid layout (COLS × ROWS tiles on one texture):
 *   ATLAS_COLS = 8, ATLAS_ROWS = 8  →  64 posters per atlas
 *
 * UV coordinates per tile:
 *   u_offset = (col / ATLAS_COLS)
 *   v_offset = (row / ATLAS_ROWS)
 *   u_scale  = 1 / ATLAS_COLS
 *   v_scale  = 1 / ATLAS_ROWS
 */

import * as THREE from 'three';

const ATLAS_COLS   = 8;
const ATLAS_ROWS   = 8;
const TILE_SIZE    = 256; // pixels per poster tile
const ATLAS_W      = ATLAS_COLS * TILE_SIZE;
const ATLAS_H      = ATLAS_ROWS * TILE_SIZE;
const TOTAL_SLOTS  = ATLAS_COLS * ATLAS_ROWS;

export interface AtlasSlot {
  /** Index in the flat atlas grid [0..TOTAL_SLOTS) */
  slotIndex: number;
  /** Pre-computed UV offset and scale for this slot */
  uvOffset: [number, number];
  uvScale:  [number, number];
}

interface CacheEntry {
  url:       string;
  slot:      AtlasSlot;
  lastUsed:  number; // monotonic counter
}

export class TextureAtlasGenerator {
  private canvas: HTMLCanvasElement;
  private ctx:    CanvasRenderingContext2D;
  private texture: THREE.CanvasTexture;

  /** LRU tracking */
  private entries:   Map<string, CacheEntry> = new Map();
  private lruClock  = 0;

  constructor() {
    this.canvas = document.createElement('canvas');
    this.canvas.width  = ATLAS_W;
    this.canvas.height = ATLAS_H;
    this.ctx = this.canvas.getContext('2d')!;

    // Fill with a dark fallback colour
    this.ctx.fillStyle = '#0a0a12';
    this.ctx.fillRect(0, 0, ATLAS_W, ATLAS_H);

    this.texture = new THREE.CanvasTexture(this.canvas);
    this.texture.minFilter = THREE.LinearFilter;
    this.texture.generateMipmaps = false;
  }

  get threeTexture(): THREE.CanvasTexture {
    return this.texture;
  }

  /** Returns the UV data for a given URL, loading it if necessary. */
  async getSlot(url: string): Promise<AtlasSlot> {
    const existing = this.entries.get(url);
    if (existing) {
      existing.lastUsed = ++this.lruClock;
      return existing.slot;
    }

    const slotIndex = this.allocateSlot(url);
    const slot      = this.makeSlot(slotIndex);

    await this.drawPoster(url, slotIndex);

    const entry: CacheEntry = { url, slot, lastUsed: ++this.lruClock };
    this.entries.set(url, entry);

    return slot;
  }

  /** Allocates a free slot or evicts the LRU entry */
  private allocateSlot(forUrl: string): number {
    if (this.entries.size < TOTAL_SLOTS) {
      return this.entries.size; // next free slot
    }

    // Find LRU entry
    let lruKey = '';
    let lruTime = Infinity;
    for (const [key, entry] of this.entries) {
      if (entry.lastUsed < lruTime) {
        lruTime = entry.lastUsed;
        lruKey  = key;
      }
    }

    const evicted = this.entries.get(lruKey)!;
    this.entries.delete(lruKey);
    return evicted.slot.slotIndex;
  }

  private makeSlot(index: number): AtlasSlot {
    const col = index % ATLAS_COLS;
    const row = Math.floor(index / ATLAS_COLS);
    return {
      slotIndex: index,
      uvOffset:  [col / ATLAS_COLS, row / ATLAS_ROWS],
      uvScale:   [1 / ATLAS_COLS,   1 / ATLAS_ROWS],
    };
  }

  private async drawPoster(url: string, slotIndex: number): Promise<void> {
    const col = slotIndex % ATLAS_COLS;
    const row = Math.floor(slotIndex / ATLAS_COLS);
    const x   = col * TILE_SIZE;
    const y   = row * TILE_SIZE;

    try {
      const img = await this.loadImage(url);
      // Draw centred, filling the tile (cover behaviour)
      const scale = Math.max(TILE_SIZE / img.naturalWidth, TILE_SIZE / img.naturalHeight);
      const sw    = img.naturalWidth  * scale;
      const sh    = img.naturalHeight * scale;
      this.ctx.drawImage(img, x + (TILE_SIZE - sw) / 2, y + (TILE_SIZE - sh) / 2, sw, sh);
    } catch {
      // Draw a dark placeholder tile with the slot index
      this.ctx.fillStyle = '#0d1524';
      this.ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
      this.ctx.strokeStyle = '#00E5FF22';
      this.ctx.strokeRect(x + 1, y + 1, TILE_SIZE - 2, TILE_SIZE - 2);
    }

    // Signal Three.js to re-upload the texture
    this.texture.needsUpdate = true;
  }

  private loadImage(url: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload  = () => resolve(img);
      img.onerror = reject;
      img.src = url;
    });
  }

  dispose(): void {
    this.texture.dispose();
  }
}
