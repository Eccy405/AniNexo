'use client';
/**
 * HexPosterFaces.tsx  (v4 – per-instance TextureLoader, no canvas atlas, cover aspect ratio fit)
 * ─────────────────────────────────────────────────────────────────────
 * Each hexagon slot loads its own texture directly without canvas/CORS taint.
 * Remaps texture repeat and offset on load to center-crop (cover behavior)
 * regular hexagon shape bounds (aspect ratio ~0.866) without vertical stretch.
 */

import React, { useRef, useMemo, useEffect, useState } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { HiveEngine } from '../core/HiveEngine';
import { VisibilityManager, AnimeNode } from '../core/VisibilityManager';
import { AnimationController } from '../core/AnimationController';

interface HexPosterFacesProps {
  engine: HiveEngine;
  catalog: AnimeNode[];
  visibilityManager: VisibilityManager;
  animCtrl: AnimationController;
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
function posterUrl(url: string): string {
  if (!url) return '';
  return `${API_BASE}/proxy/image?url=${encodeURIComponent(url)}`;
}

/**
 * Build a flat hexagon as a BufferGeometry with explicit UV coords.
 * UVs are normalised from the bounding box so [0,1]×[0,1] covers the full
 * hex extent — this ensures texture.repeat/offset work predictably.
 *
 * Layout: fan of 6 triangles from center. 7 unique vertices.
 * Angles start at π/6 (30°) → pointy-sides / flat-top hex.
 */
function makeHexGeometry(r = 0.86): THREE.BufferGeometry {
  // 6 corner vertices + 1 center = 7 positions
  const verts: number[] = [];
  const uvs:   number[] = [];
  const idxs:  number[] = [];

  // Bounding box of this hex: x ∈ [-xMax, xMax], y ∈ [-r, r]
  const xMax = r * Math.cos(Math.PI / 6); // r * √3/2

  // Center vertex (index 0)
  verts.push(0, 0, 0);
  uvs.push(0.5, 0.5);

  // 6 corner vertices (indices 1-6)
  for (let i = 0; i < 6; i++) {
    const a = (Math.PI / 6) + (i * Math.PI) / 3;
    const x = r * Math.cos(a);
    const y = r * Math.sin(a);
    verts.push(x, y, 0);
    // Normalize to [0,1] from bounding box
    uvs.push((x + xMax) / (2 * xMax), (y + r) / (2 * r));
  }

  // 6 triangles: center, corner[i], corner[i+1]
  for (let i = 1; i <= 6; i++) {
    idxs.push(0, i, i < 6 ? i + 1 : 1);
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3));
  geo.setAttribute('uv',       new THREE.Float32BufferAttribute(uvs,   2));
  geo.setIndex(idxs);
  geo.computeVertexNormals();
  return geo;
}

// ── Single poster hex ────────────────────────────────────────────────────────
interface PosterNodeProps {
  position: [number, number, number];
  instanceIndex: number;
  nodeStatesRef: React.MutableRefObject<ReturnType<AnimationController['tick']>>;
  geometry: THREE.BufferGeometry;
  visibilityManager: VisibilityManager;
}

const PosterNode: React.FC<PosterNodeProps> = ({
  position, instanceIndex, nodeStatesRef, geometry, visibilityManager,
}) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const [texture, setTexture] = useState<THREE.Texture | null>(null);
  const prevUrlRef = useRef<string>('');
  const prevAnimeIdRef = useRef<number | null>(null);
  const cancelLoadRef = useRef<(() => void) | null>(null);

  const loadTexture = (anime: AnimeNode | null) => {
    // Cancel any ongoing load first
    if (cancelLoadRef.current) {
      cancelLoadRef.current();
      cancelLoadRef.current = null;
    }

    if (!anime?.coverImage) {
      setTexture(prev => { prev?.dispose(); return null; });
      prevUrlRef.current = '';
      return;
    }

    const url = posterUrl(anime.coverImage);
    if (url === prevUrlRef.current) return;
    prevUrlRef.current = url;

    let cancelled = false;
    const loader = new THREE.TextureLoader();
    loader.load(
      url,
      (tex) => {
        if (cancelled) { tex.dispose(); return; }
        tex.minFilter = THREE.LinearFilter;
        tex.magFilter = THREE.LinearFilter;
        tex.generateMipmaps = false;

        // RepeatWrapping is REQUIRED for repeat/offset UV transforms to work
        tex.wrapS = THREE.RepeatWrapping;
        tex.wrapT = THREE.RepeatWrapping;

        // Cover-fit: zoom into image so both hex axes are filled, cropping edges
        // repeat < 1 means "show only this fraction" (zoom in / center crop)
        if (tex.image) {
          const imgW   = tex.image.width  || 1;
          const imgH   = tex.image.height || 1;
          const AR_img = imgW / imgH;
          const AR_hex = 0.866; // hex bounding box AR = sqrt(3)/2

          if (AR_img > AR_hex) {
            // Wider image → fit height, crop width
            const rX = AR_hex / AR_img;
            tex.repeat.set(rX, 1.0);
            tex.offset.set((1.0 - rX) * 0.5, 0.0);
          } else {
            // Taller image → fit width, crop height
            const rY = AR_img / AR_hex;
            tex.repeat.set(1.0, rY);
            tex.offset.set(0.0, (1.0 - rY) * 0.5);
          }
        }

        setTexture(prev => { prev?.dispose(); return tex; });
      },
      undefined,
      () => { /* silently ignore load errors */ }
    );

    cancelLoadRef.current = () => {
      cancelled = true;
    };
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (cancelLoadRef.current) cancelLoadRef.current();
      setTexture(prev => { prev?.dispose(); return null; });
    };
  }, []);

  // Per-frame animation & dynamic texture check
  const dummy = useMemo(() => new THREE.Object3D(), []);
  useFrame(({ clock }) => {
    // 1. Dynamic recycle / load detection
    const currentAnime = visibilityManager.getAnimeForSlot(instanceIndex);
    const currentId = currentAnime?.id ?? null;
    if (currentId !== prevAnimeIdRef.current) {
      prevAnimeIdRef.current = currentId;
      loadTexture(currentAnime);
    }

    // 2. Animation logic
    const mesh = meshRef.current;
    if (!mesh) return;

    const nodes = nodeStatesRef.current;
    const node  = nodes?.[instanceIndex];
    if (!node) return;

    const elapsed = clock.getElapsedTime();
    const breathe = 1 + Math.sin(elapsed * 0.8 + node.phase) * 0.022;
    const floatY  = Math.sin(elapsed * 0.5 + node.phase * 1.3) * 0.05;
    const rotX    = Math.sin(elapsed * 0.25 + node.phase * 0.7) * 0.008;
    const rotZ    = Math.cos(elapsed * 0.20 + node.phase * 1.1) * 0.006;

    dummy.position.set(position[0], position[1] + floatY, position[2] + node.hoverZ + 0.12);
    dummy.rotation.set(rotX, 0, rotZ);
    dummy.scale.setScalar(breathe * node.blendAlpha);
    dummy.updateMatrix();
    mesh.matrix.copy(dummy.matrix);
    mesh.matrixWorldNeedsUpdate = true;
  });

  if (!texture) return null;

  return (
    <mesh
      ref={meshRef}
      geometry={geometry}
      matrixAutoUpdate={false}
      frustumCulled={false}
      renderOrder={1}
    >
      <meshBasicMaterial
        map={texture}
        side={THREE.FrontSide}
        transparent={false}
        depthWrite={true}
      />
    </mesh>
  );
};

// ── Main component ───────────────────────────────────────────────────────────
export const HexPosterFaces: React.FC<HexPosterFacesProps> = ({
  engine, catalog, visibilityManager, animCtrl,
}) => {
  const config  = engine.getConfig();
  const geometry = useMemo(() => makeHexGeometry(), []);
  useEffect(() => () => geometry.dispose(), [geometry]);

  // ── Activate all nodes immediately and tick the controller each frame ──────
  // animCtrl is shared between HiveCanvas, VisibilityManager and HexPosterFaces.
  // HoneycombMesh has its OWN AnimationController inside useHiveAnimation.
  // Therefore we must call animCtrl.tick() here so blendAlpha actually grows.
  const activatedRef = useRef(false);
  const nodeStatesRef = useRef<ReturnType<AnimationController['tick']>>([]);
  useFrame((_, delta) => {
    // Activate all nodes as VISIBLE once on first tick (after catalog loads)
    if (!activatedRef.current && catalog.length > 0) {
      for (let i = 0; i < config.nodeCount; i++) {
        animCtrl.setState(i, 'VISIBLE');
      }
      activatedRef.current = true;
    }
    // Tick the controller so blendAlpha interpolates from 0 → 1
    nodeStatesRef.current = animCtrl.tick(delta);
  });

  // Base positions (same grid as HoneycombMesh)
  const basePositions = useMemo<[number, number, number][]>(() => {
    const arr: [number, number, number][] = [];
    let n = 0;
    for (let r = 0; r < config.rows; r++) {
      for (let c = 0; c < config.cols; c++) {
        if (n >= config.nodeCount) break;
        arr.push(engine.calculateNodePosition(c, r));
        n++;
      }
    }
    return arr;
  }, [engine, config]);

  // PosterNode reads visibilityManager.getAnimeForSlot() per frame — no pre-derived slots needed

  // Stagger how many slots are revealed to avoid 64 simultaneous HTTP requests.
  // We reveal 8 more nodes every 120ms until all are visible.
  const [visibleCount, setVisibleCount] = useState(0);
  useEffect(() => {
    if (catalog.length === 0) return;
    setVisibleCount(0); // reset on new catalog
    let current = 0;
    const BATCH = 8;
    const id = setInterval(() => {
      current += BATCH;
      setVisibleCount(current);
      if (current >= config.nodeCount) clearInterval(id);
    }, 120);
    return () => clearInterval(id);
  }, [catalog, config.nodeCount]);

  return (
    <>
      {basePositions.slice(0, visibleCount).map((pos, i) => (
        <PosterNode
          key={i}
          position={pos}
          instanceIndex={i}
          nodeStatesRef={nodeStatesRef}
          geometry={geometry}
          visibilityManager={visibilityManager}
        />
      ))}
    </>
  );
};
