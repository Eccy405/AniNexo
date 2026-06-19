import { useRef, useMemo } from 'react';
import * as THREE from 'three';
import { AnimationController } from '../core/AnimationController';

/**
 * useHiveAnimation
 * ─────────────────────────────────────────────────────────────────────
 * Drives per-instance matrix updates on the InstancedMesh each frame.
 *
 * Responsibilities:
 *  - Runs AnimationController.tick() to advance state machines
 *  - Applies breathing (scale), micro-rotation (<1°) and hoverZ offset
 *    on top of each node's base position
 *
 * Call `applyToMesh()` inside useFrame with the InstancedMesh ref.
 */
export function useHiveAnimation(
  basePositions: [number, number, number][],
  count: number
) {
  const controller = useMemo(() => new AnimationController(count), [count]);
  const dummy      = useMemo(() => new THREE.Object3D(), []);

  // Activate all nodes as VISIBLE on first use
  const activatedRef = useRef(false);
  if (!activatedRef.current && count > 0) {
    for (let i = 0; i < count; i++) controller.setState(i, 'VISIBLE');
    activatedRef.current = true;
  }

  /**
   * Call this inside useFrame({ clock, delta }) after ticking the timeline.
   */
  function applyToMesh(
    mesh: THREE.InstancedMesh,
    elapsed: number,
    delta: number
  ) {
    const nodes = controller.tick(delta);

    for (let i = 0; i < nodes.length; i++) {
      const node = nodes[i];
      const base = basePositions[i];
      if (!base) continue;

      // Breathing: very subtle scale oscillation with per-node phase
      const breathe = 1 + Math.sin(elapsed * 0.8 + node.phase) * 0.022;

      // Micro-rotation: < 1° per axis, independent for each node
      const rotX = Math.sin(elapsed * 0.25 + node.phase * 0.7) * 0.008;
      const rotZ = Math.cos(elapsed * 0.20 + node.phase * 1.1) * 0.006;

      // Float: tiny Y oscillation
      const floatY = Math.sin(elapsed * 0.5 + node.phase * 1.3) * 0.05;

      dummy.position.set(
        base[0],
        base[1] + floatY,
        base[2] + node.hoverZ
      );
      dummy.rotation.set(rotX, 0, rotZ);
      dummy.scale.setScalar(breathe * node.blendAlpha);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    }

    mesh.instanceMatrix.needsUpdate = true;
  }

  return { controller, applyToMesh };
}
