export interface HiveConfig {
  cols: number;
  rows: number;
  spacingX: number;
  spacingY: number;
  radius: number; // Curvature radius of the cylinder wall
  nodeCount: number; // Max visible node instances (40-80 recommended)
}

export const DEFAULT_HIVE_CONFIG: HiveConfig = {
  cols: 8,
  rows: 8,
  spacingX: 1.8,
  spacingY: 1.5,
  radius: 12,
  nodeCount: 64
};

export class HiveEngine {
  private config: HiveConfig;

  constructor(customConfig?: Partial<HiveConfig>) {
    this.config = { ...DEFAULT_HIVE_CONFIG, ...customConfig };
  }

  getConfig(): HiveConfig {
    return this.config;
  }

  updateConfig(newConfig: Partial<HiveConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Calculates the 3D position of a hexagon in a curved cylinder wall.
   * X is horizontal, Y is vertical, Z curves back.
   */
  calculateNodePosition(col: number, row: number): [number, number, number] {
    const { spacingX, spacingY, radius } = this.config;

    // Alternating offset for hexagon layout
    const offset = (row % 2) * (spacingX / 2);
    
    // Base flat coordinates
    const flatX = (col - this.config.cols / 2) * spacingX + offset;
    const flatY = (row - this.config.rows / 2) * spacingY;

    // Apply cylindrical curvature on X-axis
    // Z curves back (negative direction) as X increases from center
    const theta = flatX / radius;
    const x = radius * Math.sin(theta);
    const z = -radius * (1 - Math.cos(theta));
    const y = flatY;

    return [x, y, z];
  }
}
