'use client';

import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

function createCircleParticleTexture(): THREE.CanvasTexture | null {
  if (typeof document === 'undefined') return null;
  const size = 64;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  const half = size / 2;
  const gradient = ctx.createRadialGradient(half, half, 0, half, half, half);
  gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
  gradient.addColorStop(0.45, 'rgba(255, 255, 255, 0.85)');
  gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

export default function Scene3D() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let disposed = false;
    let rafId: number | null = null;
    let isContextLost = false;

    const timer = new THREE.Timer();
    timer.connect(document);

    const scene = new THREE.Scene();
    scene.fog = new THREE.Fog('#030508', 2, 5);

    const camera = new THREE.PerspectiveCamera(
      60,
      window.innerWidth / Math.max(window.innerHeight, 1),
      0.1,
      100
    );
    camera.position.set(0, 0, 3);

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        canvas,
        antialias: false,
        powerPreference: 'high-performance',
        alpha: true,
      });
    } catch (err) {
      console.warn('[Scene3D] WebGL initialization skipped:', err);
      timer.disconnect();
      timer.dispose();
      return;
    }

    const updateSize = () => {
      const width = window.innerWidth;
      const height = Math.max(window.innerHeight, 1);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
      renderer.setSize(width, height, false);
    };
    updateSize();

    // Generar partículas en distribución esférica
    const count = 3000;
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const theta = 2 * Math.PI * Math.random();
      const phi = Math.acos(2 * Math.random() - 1);
      const r = 2.5 + Math.random() * 2;

      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = r * Math.cos(phi);
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const pointTexture = createCircleParticleTexture();
    const material = new THREE.PointsMaterial({
      transparent: true,
      color: '#00E5FF',
      size: 0.015,
      sizeAttenuation: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      opacity: 0.6,
      map: pointTexture,
      alphaTest: 0.01,
      fog: true,
    });

    const points = new THREE.Points(geometry, material);
    points.frustumCulled = false;

    const group = new THREE.Group();
    group.rotation.set(0, 0, Math.PI / 4);
    group.add(points);
    scene.add(group);

    const targetRotation = { x: 0, y: 0 };

    const handleMouseMove = (event: MouseEvent) => {
      const x = (event.clientX / Math.max(window.innerWidth, 1)) * 2 - 1;
      const y = -(event.clientY / Math.max(window.innerHeight, 1)) * 2 + 1;
      targetRotation.x = y * 0.2;
      targetRotation.y = x * 0.2;
    };

    const stopLoop = () => {
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
        rafId = null;
      }
    };

    const animate = (timestamp: number) => {
      if (disposed || isContextLost || document.hidden) {
        rafId = null;
        return;
      }

      timer.update(timestamp);
      const delta = Math.min(timer.getDelta(), 0.1);

      points.rotation.y += delta * 0.05;
      points.rotation.x += delta * 0.02;
      points.rotation.x += (targetRotation.x - points.rotation.x) * 0.05;
      points.rotation.y += (targetRotation.y - points.rotation.y) * 0.05;

      renderer.render(scene, camera);
      rafId = requestAnimationFrame(animate);
    };

    const startLoop = () => {
      if (disposed || isContextLost || document.hidden || rafId !== null) return;
      timer.reset();
      rafId = requestAnimationFrame(animate);
    };

    const handleVisibility = () => {
      if (document.hidden) {
        stopLoop();
      } else {
        startLoop();
      }
    };

    const handleContextLost = (event: Event) => {
      event.preventDefault();
      isContextLost = true;
      stopLoop();
    };

    const handleContextRestored = () => {
      isContextLost = false;
      if (!document.hidden) {
        startLoop();
      }
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    window.addEventListener('resize', updateSize, { passive: true });
    document.addEventListener('visibilitychange', handleVisibility);
    canvas.addEventListener('webglcontextlost', handleContextLost);
    canvas.addEventListener('webglcontextrestored', handleContextRestored);

    if (!document.hidden) {
      startLoop();
    }

    return () => {
      disposed = true;
      stopLoop();
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', updateSize);
      document.removeEventListener('visibilitychange', handleVisibility);
      canvas.removeEventListener('webglcontextlost', handleContextLost);
      canvas.removeEventListener('webglcontextrestored', handleContextRestored);

      timer.disconnect();
      timer.dispose();
      geometry.dispose();
      material.dispose();
      pointTexture?.dispose();
      renderer.dispose();
      renderer.forceContextLoss();
    };
  }, []);

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        zIndex: -1,
        pointerEvents: 'none',
        background: 'radial-gradient(circle at center, #0a0b10 0%, #030508 100%)',
      }}
    >
      <canvas
        ref={canvasRef}
        style={{
          width: '100%',
          height: '100%',
          display: 'block',
        }}
      />
    </div>
  );
}
