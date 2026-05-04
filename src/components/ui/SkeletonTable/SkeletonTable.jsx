import React from "react";
import styles from "./SkeletonTable.module.css";

export const SkeletonTable = ({ rows = 5, columns = 6 }) => {
  return (
    <>
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <tr key={rowIndex} className={styles.skeletonTr}>
          {Array.from({ length: columns }).map((_, colIndex) => (
            <td key={colIndex} className={styles.skeletonTd}>
              <div className={styles.skeletonBlock} />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
};