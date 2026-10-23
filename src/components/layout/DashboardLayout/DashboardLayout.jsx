import React, { useEffect, useRef, useState } from "react";
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

  return (
    <div className={styles.root}>
      <div
        className={`${styles.overlay} ${isSidebarOpen ? styles.overlayActive : ""}`}
        onClick={closeSidebar}
        aria-hidden="true"
      />

      <Sidebar isOpen={isSidebarOpen} onClose={closeSidebar} />

      <div className={styles.columnaPrincipal}>
        {/* scroll-visible: la barra se ve sin pasar el mouse (ver index.css). */}
        <div className={`${styles.mainColumn} scroll-visible`} ref={columnaRef}>
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
          aria-hidden="true"
          className={`${styles.indicadorScroll} ${hayMasAbajo ? styles.indicadorScrollVisible : ""}`}
        >
          {/* Solo el degradé: el botón "Más abajo" tapaba contenido; la
              señal de que hay más es la barra de scroll siempre visible
              (scroll-visible) más este corte suave del borde inferior. */}
          <span className={styles.indicadorDegrade} aria-hidden="true" />
        </div>
      </div>
    </div>
  );
}
