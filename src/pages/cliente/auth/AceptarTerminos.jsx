import React, { useState, useEffect, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { FiCheck } from "react-icons/fi";
import { toast } from "sonner";
import { Button } from "../../../components/ui/Button/Button";
import { Spinner } from "../../../components/ui/Spinner/Spinner";
import { parseTerminos } from "../../../constants/terminosCondiciones";
import { useChannel } from "../../../context/ChannelContext";
import { useAuthStore } from "../../../store/useAuthStore";
import { useUsuarioWebIdActual } from "../../../hooks/useUsuario";
import {
  useObtenerSocioUsuarioPorUsuarioId,
  useEmpresasCompletas,
} from "../../../hooks/useSocios";
import {
  useObtenerTerminosVigentes,
  useConfirmarTyC,
} from "../../../hooks/useTerminos";
import { generarPdfConfirmacionTyC } from "../../../utils/terminosPdf";
import styles from "./AceptarTerminos.module.css";

export default function AceptarTerminos() {
  const navigate = useNavigate();
  const [aceptado, setAceptado] = useState(false);
  const [seccionActiva, setSeccionActiva] = useState(null);
  const [progreso, setProgreso] = useState(0);
  const [isGenerandoPdf, setIsGenerandoPdf] = useState(false);
  const scrollRef = useRef(null);

  const { basePath } = useChannel();
  const user = useAuthStore((state) => state.user);
  const setTerminosVerificado = useAuthStore(
    (state) => state.setTerminosVerificado,
  );

  // Guarda sincrónica contra doble submit: `isConfirmando` (isPending de la
  // mutación) no se activa hasta después de generar el PDF (await previo),
  // dejando una ventana en la que el botón sigue clickeable — mismo patrón
  // que causaba el doble/triple submit de ConfirmacionModal.
  const isEnviandoRef = useRef(false);

  const usuarioWebId = useUsuarioWebIdActual();
  const { data: socioUsuarios } = useObtenerSocioUsuarioPorUsuarioId(usuarioWebId);
  const { empresasCompletas } = useEmpresasCompletas(socioUsuarios);
  const tieneEmpresas = empresasCompletas.length > 0;

  const { data: terminosVigentes, isLoading: isLoadingTerminos } =
    useObtenerTerminosVigentes();
  const { mutateAsync: confirmarTyC, isPending: isConfirmando } =
    useConfirmarTyC();

  const terminos = useMemo(
    () => (terminosVigentes?.textotyc ? parseTerminos(terminosVigentes.textotyc) : []),
    [terminosVigentes],
  );

  const tablaContenido = useMemo(() => {
    return terminos
      .filter((s) => s.titulo && !s.esTabla)
      .map((s) => ({ id: s.id, titulo: s.titulo }));
  }, [terminos]);

  const handleAceptarTerminos = async () => {
    if (!aceptado || isConfirmando || isEnviandoRef.current) return;

    if (!usuarioWebId || !terminosVigentes?.terminosycondicionesid) {
      toast.error(
        "No se pudo determinar la versión vigente de los Términos. Reintentá en unos segundos.",
      );
      return;
    }

    isEnviandoRef.current = true;
    setIsGenerandoPdf(true);
    try {
      const contenidoTyC = await generarPdfConfirmacionTyC({
        textoTyC: terminosVigentes.textotyc,
        email: user?.email || "",
        fecha: new Date(),
      });
      setIsGenerandoPdf(false);

      await confirmarTyC({
        usuarioWebId,
        terminosyCondicionesId: terminosVigentes.terminosycondicionesid,
        contenidoTyC,
      });

      setTerminosVerificado(true);
      navigate(
        `${basePath}/${tieneEmpresas ? "legajo" : "alta-datos-empresa"}`,
      );
    } catch (err) {
      console.error("[AceptarTerminos] Error al registrar la aceptación:", err);
      toast.error("No se pudo registrar la aceptación. Intentá nuevamente.");
    } finally {
      isEnviandoRef.current = false;
      setIsGenerandoPdf(false);
    }
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
  }, [terminos]);

  const scrollTo = (id) => {
    const el = scrollRef.current;
    const target = el?.querySelector(`[data-section-id="${id}"]`);
    if (target) target.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  if (isLoadingTerminos) {
    return (
      <div className={styles.page}>
        <Spinner size={40} />
      </div>
    );
  }

  if (!terminosVigentes) {
    return (
      <div className={styles.page}>
        <div className={styles.document}>
          <div className={styles.docHeader}>
            <h1 className={styles.docTitle}>Términos y Condiciones</h1>
            <p className={styles.docSubtitle}>
              Todavía no hay una versión de los Términos y Condiciones
              publicada. Volvé a intentarlo en unos minutos.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      {/* DOCUMENTO ────────────────────────────────────────────────────────── */}
      <div className={styles.document}>
        {/* ENCABEZADO DEL DOCUMENTO */}
        <header className={styles.docHeader}>
          <div className={styles.docHeaderMeta}>
            <span className={styles.docBadge}>Documento legal</span>
            <span className={styles.docVersion}>
              Versión {terminosVigentes.terminosycondicionesid}
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
                {aceptado && <FiCheck size={12} color="#000" strokeWidth={3} />}
              </span>
            </span>
            <span className={styles.checkboxLabel}>
              He leído y acepto los términos y condiciones de uso de la
              plataforma
            </span>
          </label>

          <Button
            variant="primary"
            disabled={!aceptado || isConfirmando || isGenerandoPdf}
            isLoading={isConfirmando || isGenerandoPdf}
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
