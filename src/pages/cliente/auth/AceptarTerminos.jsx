import React, { useState, useEffect, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../../../components/ui";
import {
  RAW_TERMINOS_Y_CONDICIONES_DEFAULT,
  parseTerminos,
} from "../../../constants/terminosCondiciones";
import { useChannel } from "../../../context/ChannelContext";
import styles from "./AceptarTerminos.module.css";

export default function AceptarTerminos() {
  const navigate = useNavigate();
  const [aceptado, setAceptado] = useState(false);
  const [seccionActiva, setSeccionActiva] = useState(null);
  const [progreso, setProgreso] = useState(0);
  const scrollRef = useRef(null);

  // Cargar términos dinámicamente
  const [terminos, setTerminos] = useState([]);

  useEffect(() => {
    const rawContent =
      localStorage.getItem("terminos_y_condiciones_content") ||
      RAW_TERMINOS_Y_CONDICIONES_DEFAULT;
    const parsed = parseTerminos(rawContent);
    setTerminos(parsed);
  }, []);

  const tablaContenido = useMemo(() => {
    return terminos
      .filter((s) => s.titulo && !s.esTabla)
      .map((s) => ({ id: s.id, titulo: s.titulo }));
  }, [terminos]);

  const { channelInfo } = useChannel();

  const handleAceptarTerminos = () => {
    if (aceptado) navigate(`/${channelInfo.id}/alta-datos-empresa`);
  };

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    const onScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = el;
      const pct = Math.min(
        100,
        Math.round((scrollTop / (scrollHeight - clientHeight)) * 100),
      );
      setProgreso(pct);

      const secciones = el.querySelectorAll("[data-section-id]");
      let activa = null;
      secciones.forEach((s) => {
        const top =
          s.getBoundingClientRect().top - el.getBoundingClientRect().top;
        if (top <= 80) activa = s.dataset.sectionId;
      });
      if (activa) setSeccionActiva(activa);
    };

    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, []);

  const scrollTo = (id) => {
    const el = scrollRef.current;
    const target = el?.querySelector(`[data-section-id="${id}"]`);
    if (target) target.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className={styles.page}>
      {/* DOCUMENTO ────────────────────────────────────────────────────────── */}
      <div className={styles.document}>
        {/* ENCABEZADO DEL DOCUMENTO */}
        <header className={styles.docHeader}>
          <div className={styles.docHeaderMeta}>
            <span className={styles.docBadge}>Documento legal</span>
            <span className={styles.docVersion}>
              Versión 1.0 · {new Date().getFullYear()}
            </span>
          </div>
          <h1 className={styles.docTitle}>Términos y Condiciones</h1>
          <p className={styles.docSubtitle}>
            Plataforma de Alta de Línea de Clientes y Pedidos de Emisión de
            Avales — <strong>Garantías Bind SGR</strong>
          </p>
          <div className={styles.progressBar}>
            <div
              className={styles.progressFill}
              style={{ width: `${progreso}%` }}
            />
          </div>
          <span className={styles.progressLabel}>{progreso}% leído</span>
        </header>

        <div className={styles.docBody}>
          {/* SIDEBAR TOC */}
          <aside className={styles.toc}>
            <p className={styles.tocTitle}>Contenido</p>
            <nav>
              {tablaContenido.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className={`${styles.tocItem} ${seccionActiva === item.id ? styles.tocItemActive : ""}`}
                  onClick={() => scrollTo(item.id)}
                >
                  {item.titulo}
                </button>
              ))}
            </nav>
          </aside>

          {/* CONTENIDO LEGAL */}
          <main className={styles.content} ref={scrollRef}>
            {terminos.map((seccion) => (
              <div
                key={seccion.id}
                data-section-id={seccion.id}
                className={styles.seccion}
              >
                {seccion.titulo && (
                  <h2 className={styles.seccionTitulo}>{seccion.titulo}</h2>
                )}

                {seccion.esTabla ? (
                  <table className={styles.tabla}>
                    <tbody>
                      {(seccion.tableRows || []).map((row, rIdx) => (
                        <tr key={rIdx}>
                          <td className={styles.tablaTerm}>{row.term}</td>
                          <td>{row.definition}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  seccion.parrafos.map((parrafo, i) => (
                    <p key={`${seccion.id}-p-${i}`} className={styles.parrafo}>
                      {parrafo}
                    </p>
                  ))
                )}
              </div>
            ))}

            <div style={{ height: "2rem" }} />
          </main>
        </div>

        {/* FOOTER DE ACEPTACIÓN */}
        <footer className={styles.docFooter}>
          <label className={styles.checkboxRow}>
            <span className={styles.checkboxWrapper}>
              <input
                type="checkbox"
                className={styles.hiddenCheckbox}
                checked={aceptado}
                onChange={() => setAceptado(!aceptado)}
              />
              <span
                className={`${styles.checkmark} ${aceptado ? styles.checkmarkActive : ""}`}
              >
                {aceptado && (
                  <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                    <path
                      d="M1 4L3.5 6.5L9 1"
                      stroke="#000"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                )}
              </span>
            </span>
            <span className={styles.checkboxLabel}>
              He leído y acepto los términos y condiciones de uso de la
              plataforma
            </span>
          </label>

          <Button
            variant="primary"
            disabled={!aceptado}
            onClick={handleAceptarTerminos}
            className={styles.btnAceptar}
          >
            ACEPTAR Y CONTINUAR
          </Button>
        </footer>
      </div>
    </div>
  );
}
