import React from "react";
import AdminNavbar from "../AdminNavbar/AdminNavbar";
import { useVersionApi } from "../../../../hooks/useSistema";
import styles from "./AdminLayout.module.css";

export default function AdminLayout({ children }) {
  // Mismo indicador que ya existe en el Sidebar del cliente (ver
  // Sidebar.jsx) - acá no hay sidebar propio, así que va fijo abajo a la
  // izquierda sobre el layout entero en vez de en un footer de nav.
  const { data: versionApiRaw } = useVersionApi();
  // El backend devuelve un string suelto (ej. "SGRPlus API Web Version
  // 1.0"), no un objeto - se le extrae solo el número, mismo criterio que
  // en Sidebar.jsx.
  const versionApi = versionApiRaw?.match(/[\d]+(?:\.[\d]+)*\s*$/)?.[0]?.trim();

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

      <p className={styles.versionText}>
        Versión {__APP_VERSION__}
        {versionApi && <> · API {versionApi}</>}
      </p>
    </div>
  );
}
