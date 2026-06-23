import React from "react";
import styles from "./Section.module.css";

interface SectionProps {
  children: React.ReactNode;
  padding?: number | string;
  bg?: string;
  className?: string;
  mb?: number | string;
}

export const Section = ({
  children,
  padding,
  bg,
  className = "",
  mb,
}: SectionProps) => {
  const pClass = padding !== undefined ? `p-${padding}` : "";
  const bgClass = bg ? `bg-${bg}` : "";
  const mbClass = mb !== undefined ? `mb-${mb}` : "";
  return (
    <section
      className={`${styles.section} ${pClass} ${bgClass} ${mbClass} ${className}`}
    >
      {children}
    </section>
  );
};
