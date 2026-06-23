import React from "react";
import styles from "./Container.module.css";

interface ContainerProps {
  children: React.ReactNode;
  center?: boolean;
  className?: string;
  py?: number | string;
  px?: number | string;
  maxWidth?: string;
}

export const Container = ({
  children,
  center = false,
  className = "",
  py,
  px,
  maxWidth,
}: ContainerProps) => {
  const pyClass = py !== undefined ? `py-${py}` : "";
  const pxClass = px !== undefined ? `px-${px}` : "";
  const maxW = maxWidth ? `max-w-${maxWidth}` : "";
  const centerClass = center ? "mx-auto" : "";
  return (
    <div
      className={`${styles.container} ${pyClass} ${pxClass} ${maxW} ${centerClass} ${className}`}
    >
      {children}
    </div>
  );
};
