'use client';

import React, { useRef, useMemo, useEffect } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { HiveEngine } from '../core/HiveEngine';
import { HoneycombShader } from './Shaders';
import { useHiveAnimation } from '../hooks/useHiveAnimation';
import { VisibilityManager, AnimeNode } from '../core/VisibilityManager';
import { AnimationController } from '../core/AnimationController';
import { usePointerInteraction, HoveredNodeInfo } from '../hooks/usePointerInteraction';
import { eventBus } from '../core/EventBus';

interface HoneycombMeshProps {
  engine: HiveEngine;
  catalog: AnimeNode[];
  visibilityManager: VisibilityManager;
  animCtrl: AnimationController;
  onHoverNode: (info: HoveredNodeInfo | null) => void;
}

export const HoneycombMesh: React.FC<HoneycombMeshProps> = ({
  engine, catalog, visibilityManager, animCtrl, onHoverNode,
}) => {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const config  = engine.getConfig();

  // ── Hexagon Geometry (extruded, Fresnel crystal — no texture) ──────
  const { shape, extrudeSettings } = useMemo(() => {
    const s = new THREE.Shape();
    const r = 0.9;
    for (let i = 0; i < 6; i++) {
      const a = (Math.PI / 6) + (i * Math.PI) / 3;
      i === 0 ? s.moveTo(r * Math.cos(a), r * Math.sin(a))
              : s.lineTo(r * Math.cos(a), r * Math.sin(a));
    }
    s.closePath();
    return {
      shape: s,
      extrudeSettings: {
        depth: 0.18,
        bevelEnabled: true,
        bevelSegments: 2,
        steps: 1,
        bevelSize: 0.04,
        bevelThickness: 0.04,
      },
    };
  }, []);

  // ── Base positions ─────────────────────────────────────────────────
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

  const { applyToMesh } = useHiveAnimation(basePositions, basePositions.length);

  // Initialise visible state for all nodes
  useEffect(() => {
    for (let i = 0; i < basePositions.length; i++) animCtrl.setState(i, 'VISIBLE');
  }, [animCtrl, basePositions.length]);

  // ── Pointer events ─────────────────────────────────────────────────
  const { handlePointerMove, handlePointerOut, handlePointerClick } =
    usePointerInteraction(animCtrl, visibilityManager, onHoverNode);

  // ── Shader uniforms (no texture needed) ───────────────────────────
  const uniforms = useMemo(() => ({
    glowColor: { value: new THREE.Color('#00E5FF') },
    baseColor: { value: new THREE.Color('#010f1c') },
    glowPower: { value: 2.5 },
    opacity:   { value: 0.20 },
  }), []);

  // ── AI Pulse reaction ──────────────────────────────────────────────
  useEffect(() => {
    return eventBus.on('AI_PULSE_START', () => {
      const start = performance.now();
      const tick = () => {
        const t = Math.min(1, (performance.now() - start) / 1400);
        uniforms.glowPower.value = 2.5 - Math.sin(t * Math.PI) * 1.5;
        if (t < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });
  }, [uniforms]);

  // ── Frame loop ─────────────────────────────────────────────────────
  useFrame(({ clock, camera }, delta) => {
    if (!meshRef.current) return;
    visibilityManager.tickRecycle(camera.position.y, 1.5);
    applyToMesh(meshRef.current, clock.getElapsedTime(), delta);
  });

  return (
    <instancedMesh
      ref={meshRef}
      args={[undefined, undefined, basePositions.length]}
      frustumCulled={false}
      renderOrder={2}
      onPointerMove={handlePointerMove}
      onPointerOut={handlePointerOut}
      onClick={handlePointerClick}
    >
      <extrudeGeometry args={[shape, extrudeSettings]} />
      <shaderMaterial
        vertexShader={HoneycombShader.vertexShader}
        fragmentShader={HoneycombShader.fragmentShader}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        side={THREE.DoubleSide}
      />
    </instancedMesh>
  );
};
