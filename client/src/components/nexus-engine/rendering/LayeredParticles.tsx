'use client';

import React, { useRef, useMemo } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';

export const LayeredParticles: React.FC = () => {
  const pointsRef1 = useRef<THREE.Points>(null);
  const pointsRef2 = useRef<THREE.Points>(null);
  const pointsRef3 = useRef<THREE.Points>(null);

  // Generate particle coordinate buffers
  const [p1, p2, p3] = useMemo(() => {
    const makeData = (count: number, zRange: [number, number], spread: number) => {
      const arr = new Float32Array(count * 3);
      for (let i = 0; i < count; i++) {
        const theta = Math.random() * Math.PI * 2;
        const radius = Math.random() * spread + 2;
        
        arr[i * 3]     = radius * Math.sin(theta); // X
        arr[i * 3 + 1] = (Math.random() - 0.5) * 12; // Y
        arr[i * 3 + 2] = zRange[0] + Math.random() * (zRange[1] - zRange[0]); // Z
      }
      return arr;
    };

    // Layer 1: background (small, far back)
    // Layer 2: midground (glowing, near hexagons)
    // Layer 3: foreground (large, floating near camera)
    return [
      makeData(220, [-12, -4], 14),
      makeData(120, [-4, 2], 10),
      makeData(40, [2, 7], 6)
    ];
  }, []);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();

    // Rotate layers independently for parallax motion
    if (pointsRef1.current) {
      pointsRef1.current.rotation.y = t * 0.015;
      pointsRef1.current.position.y = Math.sin(t * 0.1) * 0.15;
    }
    if (pointsRef2.current) {
      pointsRef2.current.rotation.y = -t * 0.025;
      pointsRef2.current.position.y = Math.cos(t * 0.15) * 0.1;
    }
    if (pointsRef3.current) {
      pointsRef3.current.rotation.y = t * 0.035;
      pointsRef3.current.position.y = Math.sin(t * 0.2) * 0.2;
    }
  });

  return (
    <>
      {/* Background points */}
      <points ref={pointsRef1} frustumCulled={false}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[p1, 3]} />
        </bufferGeometry>
        <pointsMaterial
          color="#9B51E0"
          size={0.06}
          transparent
          opacity={0.3}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </points>

      {/* Midground points */}
      <points ref={pointsRef2} frustumCulled={false}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[p2, 3]} />
        </bufferGeometry>
        <pointsMaterial
          color="#00E5FF"
          size={0.1}
          transparent
          opacity={0.5}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </points>

      {/* Foreground points */}
      <points ref={pointsRef3} frustumCulled={false}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[p3, 3]} />
        </bufferGeometry>
        <pointsMaterial
          color="#0055FF"
          size={0.16}
          transparent
          opacity={0.4}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </points>
    </>
  );
};
