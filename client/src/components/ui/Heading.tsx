import React from "react";
import styles from "./Heading.module.css";

interface HeadingProps {
  as?: string | React.ComponentType<unknown>;
  children: React.ReactNode;
  size?: keyof typeof sizeMap;
  color?: keyof typeof colorMap;
  className?: string;
  mb?: number | string;
}

const sizeMap = {
  xs: "text-xs",
  sm: "text-sm",
  base: "text-base",
  lg: "text-lg",
  xl: "text-xl",
  "2xl": "text-2xl",
  "3xl": "text-3xl",
  "4xl": "text-4xl",
} as const;

const colorMap = {
  main: "text-main",
  muted: "text-muted",
  primary: "text-primary",
} as const;

export const Heading = ({
  as: Tag = "h1",
  children,
  size,
  color,
  className = "",
  mb,
}: HeadingProps) => {
  const sizeClass = size ? sizeMap[size] : "";
  const colorClass = color ? colorMap[color] : "";
  const mbClass = mb !== undefined ? `mb-${mb}` : "";
  const TagName = Tag as any;
  return (
    <TagName className={`${styles.heading} ${sizeClass} ${colorClass} ${mbClass} ${className}`}>
      {children}
    </TagName>
  );
};
