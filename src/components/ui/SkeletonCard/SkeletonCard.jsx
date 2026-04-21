import React from "react";
import styles from "./SkeletonCard.module.css";

export const SkeletonCard = ({
  rows = 3,
  showHeader = true,
  className = "",
}) => {
  return (
    <div
      className={`${styles.card} ${className}`}
      aria-busy="true"
      aria-label="Cargando..."
    >
      {showHeader && (
        <div className={styles.header}>
          <div className={`${styles.shimmer} ${styles.avatarBlock}`} />
          <div className={styles.headerText}>
            <div className={`${styles.shimmer} ${styles.lineLong}`} />
            <div className={`${styles.shimmer} ${styles.lineShort}`} />
          </div>
        </div>
      )}

      <div className={styles.body}>
        {Array.from({ length: rows }).map((_, i) => (
          <div className={styles.row} key={i}>
            <div className={`${styles.shimmer} ${styles.lineLabel}`} />
            <div className={`${styles.shimmer} ${styles.lineValue}`} />
          </div>
        ))}
      </div>

      <div className={styles.footer}>
        <div className={`${styles.shimmer} ${styles.btnBlock}`} />
      </div>
    </div>
  );
};

export const SkeletonList = ({ count = 2, rows = 3, showHeader = true }) => {
  return (
    <div className={styles.list}>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} rows={rows} showHeader={showHeader} />
      ))}
    </div>
  );
};
