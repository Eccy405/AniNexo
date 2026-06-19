import { useRef, useMemo } from 'react';
import { useThree } from '@react-three/fiber';
import { CameraController } from '../core/CameraController';

/**
 * useHiveCamera
 * ─────────────────────────────────────────────────────────────────────
 * Wraps CameraController and applies its output to the R3F camera
 * every frame via the caller's useFrame loop.
 *
 * Usage:
 *   const { cameraController, applyToCamera } = useHiveCamera();
 *   // inside useFrame:
 *   cameraController.setScrollProgress(scroll.current);
 *   applyToCamera(delta);
 */
export function useHiveCamera() {
  const { camera } = useThree();
  const controller = useMemo(() => new CameraController(), []);

  function applyToCamera(delta: number) {
    controller.tick(delta);
    camera.position.copy(controller.current);
    camera.lookAt(controller.lookAt);
  }

  return { cameraController: controller, applyToCamera };
}
