import React, { useState } from "react";
import Navbar from "../Client/Navbar/Navbar";
import Sidebar from "../Client/Sidebar/Sidebar";
import styles from "./DashboardLayout.module.css";

export default function DashboardLayout({ children, hideHelpButton = false }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const toggleSidebar = () => setIsSidebarOpen((prev) => !prev);
  const closeSidebar = () => setIsSidebarOpen(false);

  return (
    <div className={styles.root}>
      <div
        className={`${styles.overlay} ${isSidebarOpen ? styles.overlayActive : ""}`}
        onClick={closeSidebar}
        aria-hidden="true"
      />

      <Sidebar isOpen={isSidebarOpen} onClose={closeSidebar} />

      <div className={styles.mainColumn}>
        <Navbar
          usuario="asesoramiento@mailinator.com"
          onToggleSidebar={toggleSidebar}
          hideHelpButton={hideHelpButton}
        />
        <main className={styles.content}>{children}</main>
      </div>
    </div>
  );
}
