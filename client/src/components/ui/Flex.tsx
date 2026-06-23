import React from "react";
import styles from "./Flex.module.css";

interface FlexProps {
  children: React.ReactNode;
  direction?: "row" | "column";
  gap?: number | string;
  wrap?: boolean;
  className?: string;
  justifyContent?: "start" | "end" | "center" | "between" | "around";
  alignItems?: "start" | "end" | "center" | "baseline" | "stretch";
}

export const Flex = ({
  children,
  direction = "row",
  gap,
  wrap = false,
  className = "",
  justifyContent,
  alignItems,
}: FlexProps) => {
  const dirClass = direction === "column" ? "flex-col" : "flex-row";
  const gapClass = gap !== undefined ? `gap-${gap}` : "";
  const wrapClass = wrap ? "flex-wrap" : "flex-nowrap";
  const jcClass = justifyContent
    ? {
        start: "justify-start",
        end: "justify-end",
        center: "justify-center",
        between: "justify-between",
        around: "justify-around",
      }[justifyContent]
    : "";
  const aiClass = alignItems
    ? {
        start: "items-start",
        end: "items-end",
        center: "items-center",
        baseline: "items-baseline",
        stretch: "items-stretch",
      }[alignItems]
    : "";
  return (
    <div
      className={`${styles.flex} ${dirClass} ${gapClass} ${wrapClass} ${jcClass} ${aiClass} ${className}`}
    >
      {children}
    </div>
  );
};
