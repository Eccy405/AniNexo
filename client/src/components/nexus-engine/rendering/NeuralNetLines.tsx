'use client';

import React, { useMemo } from 'react';
import * as THREE from 'three';
import { HiveEngine } from '../core/HiveEngine';

interface NeuralNetLinesProps {
  engine: HiveEngine;
}

export const NeuralNetLines: React.FC<NeuralNetLinesProps> = ({ engine }) => {
  const config = engine.getConfig();

  const lineVertices = useMemo(() => {
    const vertices: number[] = [];
    const nodePositions: { [key: string]: [number, number, number] } = {};

    // 1. Map all nodes in the grid
    for (let r = 0; r < config.rows; r++) {
      for (let c = 0; c < config.cols; c++) {
        const pos = engine.calculateNodePosition(c, r);
        nodePositions[`${c},${r}`] = pos;
      }
    }

    // Helper to add segment between two valid coordinates
    const addSegment = (c1: number, r1: number, c2: number, r2: number) => {
      const p1 = nodePositions[`${c1},${r1}`];
      const p2 = nodePositions[`${c2},${r2}`];
      if (p1 && p2) {
        vertices.push(...p1, ...p2);
      }
    };

    // 2. Connect each hexagon to its neighbors in a honeycomb structure
    for (let r = 0; r < config.rows; r++) {
      for (let c = 0; c < config.cols; c++) {
        // Horizontal connections
        addSegment(c, r, c + 1, r);

        // Diagonal connections depend on row parity (hex grid alignment)
        const isEven = r % 2 === 0;
        if (isEven) {
          addSegment(c, r, c, r + 1);
          addSegment(c, r, c - 1, r + 1);
        } else {
          addSegment(c, r, c, r + 1);
          addSegment(c, r, c + 1, r + 1);
        }
      }
    }

    return new Float32Array(vertices);
  }, [engine, config]);

  return (
    <lineSegments frustumCulled={false}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[lineVertices, 3]}
        />
      </bufferGeometry>
      <lineBasicMaterial
        color="#00E5FF"
        transparent
        opacity={0.14}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </lineSegments>
  );
};
