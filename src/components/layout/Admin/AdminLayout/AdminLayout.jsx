import React from "react";
import AdminNavbar from "../AdminNavbar/AdminNavbar";
import styles from "./AdminLayout.module.css";

export default function AdminLayout({ children }) {
  return (
    <div className={`${styles.adminRoot} admin-theme`}>
      <AdminNavbar />
      {/* Decorative gradient glowing spots for wow factor */}
      <div className={styles.blobTop}></div>
      <div className={styles.blobRight}></div>

      <main className={styles.adminContent}>
        <div className={styles.containerInner}>
          {children}
        </div>
      </main>
    </div>
  );
}
