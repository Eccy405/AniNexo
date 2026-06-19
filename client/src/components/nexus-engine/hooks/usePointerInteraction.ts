import { useRef, useCallback } from 'react';
import { ThreeEvent } from '@react-three/fiber';
import { AnimationController } from '../core/AnimationController';
import { VisibilityManager, AnimeNode } from '../core/VisibilityManager';
import { eventBus } from '../core/EventBus';
import * as THREE from 'three';

export interface HoveredNodeInfo {
  anime: AnimeNode;
  position: [number, number, number];
  clientX: number;
  clientY: number;
}

export function usePointerInteraction(
  animCtrl: AnimationController,
  visibilityManager: VisibilityManager,
  onHoverChange: (info: HoveredNodeInfo | null) => void
) {
  const lastHoveredIndexRef = useRef<number | null>(null);

  const handlePointerMove = useCallback((e: ThreeEvent<PointerEvent>) => {
    // Prevent event bubbling
    e.stopPropagation();

    const idx = e.instanceId;
    if (idx === undefined) return;

    const anime = visibilityManager.getAnimeForSlot(idx);
    if (!anime) return;

    // Calculate instance position in world space
    const mesh = e.object as THREE.InstancedMesh;
    const matrix = new THREE.Matrix4();
    mesh.getMatrixAt(idx, matrix);
    const position = new THREE.Vector3();
    position.setFromMatrixPosition(matrix);

    const info: HoveredNodeInfo = {
      anime,
      position: [position.x, position.y, position.z],
      clientX: e.clientX,
      clientY: e.clientY
    };

    // If hover hasn't changed, just update screen coordinates for the UI card
    if (idx === lastHoveredIndexRef.current) {
      onHoverChange(info);
      return;
    }

    // Reset previous hover state
    if (lastHoveredIndexRef.current !== null) {
      animCtrl.setState(lastHoveredIndexRef.current, 'VISIBLE');
      eventBus.emit('NODE_HOVER_OUT', {
        id: String(visibilityManager.getAnimeForSlot(lastHoveredIndexRef.current)?.id || ''),
        index: lastHoveredIndexRef.current
      });
    }

    // Set new hover state
    animCtrl.setState(idx, 'HOVER');
    lastHoveredIndexRef.current = idx;

    onHoverChange(info);

    eventBus.emit('NODE_HOVER_IN', {
      id: String(anime.id),
      index: idx,
      position: [position.x, position.y, position.z]
    });
  }, [animCtrl, visibilityManager, onHoverChange]);

  const handlePointerOut = useCallback(() => {
    if (lastHoveredIndexRef.current !== null) {
      animCtrl.setState(lastHoveredIndexRef.current, 'VISIBLE');
      eventBus.emit('NODE_HOVER_OUT', {
        id: String(visibilityManager.getAnimeForSlot(lastHoveredIndexRef.current)?.id || ''),
        index: lastHoveredIndexRef.current
      });
      lastHoveredIndexRef.current = null;
    }
    onHoverChange(null);
  }, [animCtrl, visibilityManager, onHoverChange]);

  const handlePointerClick = useCallback((e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    const idx = e.instanceId;
    if (idx === undefined) return;

    const anime = visibilityManager.getAnimeForSlot(idx);
    if (!anime) return;

    animCtrl.setState(idx, 'SELECTED');
    eventBus.emit('NODE_SELECTED', {
      id: String(anime.id),
      index: idx
    });
  }, [animCtrl, visibilityManager]);

  return {
    handlePointerMove,
    handlePointerOut,
    handlePointerClick
  };
}
