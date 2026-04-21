import React from "react";
import styles from "./SkeletonTable.module.css";

export const SkeletonTable = ({
  rows = 5,
  className = "",
}) => {
  return (
    <div
      className={`${styles.container} ${className}`}
      aria-busy="true"
      aria-label="Cargando datos..."
    >
      {Array.from({ length: rows }).map((_, i) => (
        <div className={styles.row} key={i} />
      ))}
    </div>
  );
};
