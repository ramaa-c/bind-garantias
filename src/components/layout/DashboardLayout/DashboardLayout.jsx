import React, { useEffect, useRef, useState } from "react";
import { FiChevronDown } from "react-icons/fi";
import Navbar from "../Client/Navbar/Navbar";
import Sidebar from "../Client/Sidebar/Sidebar";
import styles from "./DashboardLayout.module.css";

const MARGEN_FINAL_PX = 24;

export default function DashboardLayout({ children, hideHelpButton = false }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [hayMasAbajo, setHayMasAbajo] = useState(false);
  const columnaRef = useRef(null);
  const contenidoRef = useRef(null);

  const toggleSidebar = () => setIsSidebarOpen((prev) => !prev);
  const closeSidebar = () => setIsSidebarOpen(false);

  useEffect(() => {
    const columna = columnaRef.current;
    const contenido = contenidoRef.current;
    if (!columna || !contenido) return;

    const actualizar = () => {
      const restante = columna.scrollHeight - columna.scrollTop - columna.clientHeight;
      setHayMasAbajo(restante > MARGEN_FINAL_PX);
    };

    const observadorTamano = new ResizeObserver(actualizar);
    const observarHijos = () => {
      observadorTamano.disconnect();
      observadorTamano.observe(columna);
      observadorTamano.observe(contenido);
      Array.from(contenido.children).forEach((hijo) => observadorTamano.observe(hijo));
    };
    observarHijos();

    const observadorCambios = new MutationObserver(() => {
      observarHijos();
      actualizar();
    });
    observadorCambios.observe(contenido, { childList: true, subtree: true });
    columna.addEventListener("scroll", actualizar, { passive: true });

    return () => {
      observadorTamano.disconnect();
      observadorCambios.disconnect();
      columna.removeEventListener("scroll", actualizar);
    };
  }, []);

  const bajar = () => {
    const columna = columnaRef.current;
    if (!columna) return;
    const reducirMovimiento = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    columna.scrollBy({
      top: columna.clientHeight * 0.75,
      behavior: reducirMovimiento ? "auto" : "smooth",
    });
  };

  return (
    <div className={styles.root}>
      <div
        className={`${styles.overlay} ${isSidebarOpen ? styles.overlayActive : ""}`}
        onClick={closeSidebar}
        aria-hidden="true"
      />

      <Sidebar isOpen={isSidebarOpen} onClose={closeSidebar} />

      <div className={styles.columnaPrincipal}>
        <div className={styles.mainColumn} ref={columnaRef}>
          <Navbar
            usuario="asesoramiento@mailinator.com"
            onToggleSidebar={toggleSidebar}
            hideHelpButton={hideHelpButton}
          />
          <main className={styles.content} ref={contenidoRef}>
            {children}
          </main>
        </div>

        <div
          className={`${styles.indicadorScroll} ${hayMasAbajo ? styles.indicadorScrollVisible : ""}`}
        >
          <span className={styles.indicadorDegrade} aria-hidden="true" />
          <button
            type="button"
            className={styles.indicadorBoton}
            onClick={bajar}
            tabIndex={hayMasAbajo ? 0 : -1}
            aria-hidden={!hayMasAbajo}
            aria-label="Ver más contenido abajo"
          >
            Más abajo
            <FiChevronDown className={styles.indicadorIcono} aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
  );
}
