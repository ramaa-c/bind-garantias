import React, { useEffect, useRef, useState } from "react";
import Navbar from "../Client/Navbar/Navbar";
import Sidebar from "../Client/Sidebar/Sidebar";
import styles from "./DashboardLayout.module.css";

const MARGEN_FINAL_PX = 24;
// Ancho CSS de una pantalla Full HD a 133% de zoom (1920 / 1.33): a partir de
// ahí el marco ya no crece.
const ANCHO_REFERENCIA_RANGO_2 = 1443;
const ZOOM_MARCO_MINIMO = 0.75;

export default function DashboardLayout({ children, hideHelpButton = false }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [hayMasAbajo, setHayMasAbajo] = useState(false);
  const columnaRef = useRef(null);
  const contenidoRef = useRef(null);

  const toggleSidebar = () => setIsSidebarOpen((prev) => !prev);
  const closeSidebar = () => setIsSidebarOpen(false);

  // Rango 2 (de 133% de zoom hasta que pasa a mobile, o pantallas chicas
  // de origen): el marco (sidebar + navbar) deja de crecer y se queda del
  // tamaño físico que tiene a 133% en una Full HD, para que el espacio que se
  // gana con el zoom vaya al contenido. Se compensa con la propiedad CSS
  // `zoom` (ver --zoom-marco en Sidebar/Navbar). Piso de 0.75: más allá de
  // eso el menú vuelve a crecer para que siga siendo legible.
  useEffect(() => {
    const rango2 = window.matchMedia(
      "(min-width: 64rem) and (max-width: 1440px), (min-width: 64rem) and (max-height: 716px)",
    );
    const raiz = document.documentElement;
    const actualizarZoomMarco = () => {
      const zoom = rango2.matches
        ? Math.min(1, Math.max(ZOOM_MARCO_MINIMO, window.innerWidth / ANCHO_REFERENCIA_RANGO_2))
        : 1;
      raiz.style.setProperty("--zoom-marco", zoom.toFixed(3));
    };
    actualizarZoomMarco();
    window.addEventListener("resize", actualizarZoomMarco);
    return () => {
      window.removeEventListener("resize", actualizarZoomMarco);
      raiz.style.removeProperty("--zoom-marco");
    };
  }, []);

  useEffect(() => {
    const columna = columnaRef.current;
    const contenido = contenidoRef.current;
    if (!columna || !contenido) return;

    const actualizar = () => {
      // Ancho real de la barra de scroll (varía según navegador y zoom): los
      // fondos fijos de cada pantalla lo usan para no taparla.
      columna.style.setProperty("--gutter-scroll", `${columna.offsetWidth - columna.clientWidth}px`);
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
        {/* El navbar queda fuera de la columna que scrollea: así la barra de
            scroll arranca debajo de él y no le pasa por encima. */}
        <Navbar
          usuario="asesoramiento@mailinator.com"
          onToggleSidebar={toggleSidebar}
          hideHelpButton={hideHelpButton}
        />
        <div className={`${styles.mainColumn} scroll-visible`} ref={columnaRef}>
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
