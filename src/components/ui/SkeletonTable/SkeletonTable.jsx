import React from "react";
import styles from "./SkeletonTable.module.css";

export const SkeletonTable = ({ rows = 3 }) => {
  return (
    <>
      {Array.from({ length: rows }).map((_, index) => (
        <div key={index} className={styles.skeletonCard}>
          <div className={styles.cardMain}>
            <div className={styles.leftInfo}>
              <div className={`${styles.skeletonBlock} ${styles.badge}`} />
              <div className={`${styles.skeletonBlock} ${styles.title}`} />
              <div className={`${styles.skeletonBlock} ${styles.amount}`} />
            </div>
            <div className={styles.rightInfo}>
              <div className={`${styles.skeletonBlock} ${styles.date}`} />
              <div className={`${styles.skeletonBlock} ${styles.action}`} />
            </div>
          </div>
        </div>
      ))}
    </>
  );
};