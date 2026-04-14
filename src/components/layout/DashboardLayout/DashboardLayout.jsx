import React, { useState } from "react";
import Navbar from "../Navbar/Navbar";
import Sidebar from "../Sidebar/Sidebar";
import styles from "./DashboardLayout.module.css";

export default function DashboardLayout({ children }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setIsSidebarOpen((prev) => !prev);
  };

  const closeSidebar = () => {
    setIsSidebarOpen(false);
  };

  return (
    <div className={styles.root}>
      <Navbar
        usuario="asesoramiento@mailinator.com"
        onToggleSidebar={toggleSidebar}
      />

      <div className={styles.body}>
        <div
          className={`${styles.overlay} ${isSidebarOpen ? styles.overlayActive : ""}`}
          onClick={closeSidebar}
          aria-hidden="true"
        />

        <Sidebar isOpen={isSidebarOpen} onClose={closeSidebar} />

        <main className={styles.content}>{children}</main>
      </div>
    </div>
  );
}
