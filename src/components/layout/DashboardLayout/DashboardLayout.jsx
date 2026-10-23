import React, { useRef, useState } from "react";
import Navbar from "../Client/Navbar/Navbar";
import Sidebar from "../Client/Sidebar/Sidebar";
import { IndicadorScroll } from "../../ui/IndicadorScroll/IndicadorScroll";
import styles from "./DashboardLayout.module.css";

export default function DashboardLayout({ children, hideHelpButton = false }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  // La columna principal es la que scrollea la página (Rango 2 y pantallas
  // con más contenido que alto): ver IndicadorScroll.
  const mainColumnRef = useRef(null);

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

      <div className={`${styles.mainColumn} scroll-visible`} ref={mainColumnRef}>
        <Navbar
          usuario="asesoramiento@mailinator.com"
          onToggleSidebar={toggleSidebar}
          hideHelpButton={hideHelpButton}
        />
        <main className={styles.content}>{children}</main>
        <IndicadorScroll contenedorRef={mainColumnRef} soloEscritorio />
      </div>
    </div>
  );
}
