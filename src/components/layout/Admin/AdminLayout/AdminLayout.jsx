import React, { useLayoutEffect, useRef, useState } from "react";
import AdminNavbar from "../AdminNavbar/AdminNavbar";
import { useVersionApi } from "../../../../hooks/useSistema";
import styles from "./AdminLayout.module.css";

export default function AdminLayout({ children }) {
  // Mismo indicador que ya existe en el Sidebar del cliente (ver
  // Sidebar.jsx) - acá no hay sidebar propio, así que va pegado al pie del
  // contenido en vez de en un footer de nav (ver el comentario de
  // .versionText en AdminLayout.module.css sobre por qué es
  // position:relative y no fixed).
  const { data: versionApiRaw } = useVersionApi();
  // El backend devuelve un string suelto (ej. "SGRPlus API Web Version
  // 1.0"), no un objeto - se le extrae solo el número, mismo criterio que
  // en Sidebar.jsx.
  const versionApi = versionApiRaw?.match(/[\d]+(?:\.[\d]+)*\s*$/)?.[0]?.trim();

  const adminContentRef = useRef(null);
  const containerInnerRef = useRef(null);
  const versionTextRef = useRef(null);
  const [desborda, setDesborda] = useState(false);

  // Red de seguridad sobre la media query de Rango 1/Rango 2 (ver el
  // comentario de .containerInnerDesborda en AdminLayout.module.css): esa
  // media query resuelve el caso general, pero el contenido puntual de
  // una página (cantidad de filas, filtros abiertos, etc.) puede pasarse
  // del presupuesto aunque el viewport siga midiendo Rango 1. Se
  // recalcula en cada render (cambios de contenido, ej. una pantalla que
  // termina de cargar datos o pagina) y ante cualquier resize/zoom del
  // viewport.
  useLayoutEffect(() => {
    const adminContent = adminContentRef.current;
    const containerInner = containerInnerRef.current;
    const versionText = versionTextRef.current;
    if (!adminContent || !containerInner || !versionText) return;

    const chequearDesborde = () => {
      const disponible = adminContent.clientHeight - versionText.offsetHeight;
      setDesborda((actual) => {
        const nuevo = containerInner.scrollHeight > disponible;
        return actual === nuevo ? actual : nuevo;
      });
    };

    chequearDesborde();

    const resizeObserver = new ResizeObserver(chequearDesborde);
    resizeObserver.observe(adminContent);

    return () => resizeObserver.disconnect();
  }, [children]);

  return (
    <div className={`${styles.adminRoot} admin-theme`}>
      <AdminNavbar />
      {/* Decorative gradient glowing spots for wow factor */}
      <div className={styles.blobTop}></div>
      <div className={styles.blobRight}></div>

      <main className={styles.adminContent} ref={adminContentRef}>
        <div
          ref={containerInnerRef}
          className={`${styles.containerInner} ${desborda ? styles.containerInnerDesborda : ""}`}
        >
          {children}
        </div>

        <p className={styles.versionText} ref={versionTextRef}>
          Versión {__APP_VERSION__}
          {versionApi && <> · API {versionApi}</>}
        </p>
      </main>
    </div>
  );
}
