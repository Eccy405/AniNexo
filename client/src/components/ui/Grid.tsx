import React from "react";
import styles from "./Grid.module.css";

interface GridProps {
  children: React.ReactNode;
  columns?: number | string; // e.g., 1, 2, 3, or "auto"
  gap?: number | string;
  className?: string;
}

export const Grid = ({
  children,
  columns,
  gap,
  className = "",
}: GridProps) => {
  const cols = columns !== undefined ? `grid-cols-${columns}` : "";
  const gapClass = gap !== undefined ? `gap-${gap}` : "";
  return (
    <div
      className={`${styles.grid} ${cols} ${gapClass} ${className}`}
    >
      {children}
    </div>
  );
};
