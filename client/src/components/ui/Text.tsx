import React from "react";
import styles from "./Text.module.css";

interface TextProps {
  children: React.ReactNode;
  size?: keyof typeof sizeMap;
  color?: keyof typeof colorMap;
  className?: string;
  mb?: number | string;
  style?: React.CSSProperties;
}

const sizeMap = {
  xs: "text-xs",
  sm: "text-sm",
  base: "text-base",
  lg: "text-lg",
  xl: "text-xl",
} as const;

const colorMap = {
  main: "text-main",
  muted: "text-muted",
  primary: "text-primary",
} as const;

export const Text = ({
  children,
  size,
  color,
  className = "",
  mb,
  style,
}: TextProps) => {
  const sizeClass = size ? sizeMap[size] : "";
  const colorClass = color ? colorMap[color] : "";
  const mbClass = mb !== undefined ? `mb-${mb}` : "";
  return (
    <span
      className={`${styles.text} ${sizeClass} ${colorClass} ${mbClass} ${className}`}
      style={style}
    >
      {children}
    </span>
  );
};
