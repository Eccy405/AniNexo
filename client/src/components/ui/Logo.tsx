import React from "react";
import styles from "./Logo.module.css";

interface LogoProps {
  src: string;
  alt?: string;
  width?: string | number;
  height?: string | number;
  className?: string;
}

export const Logo = ({
  src,
  alt = "",
  width,
  height,
  className = "",
}: LogoProps) => {
  const w = typeof width === "number" ? `${width}px` : width;
  const h = typeof height === "number" ? `${height}px` : height;
  return (
    <img
      src={src}
      alt={alt}
      width={w}
      height={h}
      className={`${styles.logo} ${className}`}
    />
  );
};
