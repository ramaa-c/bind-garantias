import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useObtenerTodosCdas } from "../../../hooks/useCda";
import { useObtenerCdaIdsPorPantalla } from "../../../hooks/useCadenaValor";
import { esCdaActivoEstricto, getCdaId, getCdaProp } from "../../../utils/cdaUtils";
import { TODAS_PANTALLAS_CDA_GLOBAL } from "../../../utils/pantallasCda";
import { Button } from "../../../components/ui/Button/Button";
import { Skeleton } from "../../../components/ui/Skeleton/Skeleton";
import { Paginacion } from "../../../components/ui/Paginacion/Paginacion";
import { FiPlus, FiChevronRight, FiSearch, FiInbox, FiChevronUp, FiChevronDown } from "react-icons/fi";
import { useBloqueoAdminRestringido } from "../../../hooks/useBloqueoAdminRestringido";
import styles from "./CdasGlobales.module.css";

// Mismo criterio que Empresas.jsx: con el alto de fila blindado a una sola
// línea (table-layout:fixed + truncado con elipsis + tope de 2 badges de
// pantalla, ver CdasGlobales.module.css/el render de la tabla más abajo),
// el alto por fila es predecible y entra en 8 sin desbordar el punto más
// ajustado de Rango 1 - por eso .tableCard ya no necesita su propio scroll
// interno de emergencia (ver el mismo comentario en
// CdasGlobales.module.css).
const ELEMENTOS_POR_PAGINA = 8;

// Colores distintivos por integración, usados como badges en el listado
const INTEGRACION_PREFIXES = {
  ARCA: "afip.",
  CASFOG: "casfog.",
  LUFE: "lufe.",
  NOSIS: "nosis.",
  SGRPLUS: "sgrplus."
};

const INTEGRACION_COLORS = {
  ARCA: { bg: "rgba(88, 166, 255, 0.12)", color: "#58a6ff", border: "rgba(88, 166, 255, 0.35)" },
  NOSIS: { bg: "rgba(179, 136, 255, 0.12)", color: "#b388ff", border: "rgba(179, 136, 255, 0.35)" },
  LUFE: { bg: "rgba(221, 155, 32, 0.12)", color: "#dd9b20", border: "rgba(221, 155, 32, 0.35)" },
  CASFOG: { bg: "rgba(255, 121, 198, 0.12)", color: "#ff79c6", border: "rgba(255, 121, 198, 0.35)" },
  SGRPLUS: { bg: "rgba(56, 161, 105, 0.12)", color: "#38a169", border: "rgba(56, 161, 105, 0.35)" },
};
const INTEGRACION_COLOR_DEFAULT = { bg: "rgba(139, 148, 158, 0.12)", color: "#8b949e", border: "rgba(139, 148, 158, 0.3)" };

const detectarIntegracion = (expr) => {
  const e = (expr || "").toLowerCase();
  const found = Object.entries(INTEGRACION_PREFIXES).find(([, prefix]) => e.startsWith(prefix.toLowerCase()));
  return found ? found[0] : "";
};

const CdaRowSkeleton = () => (
  <tr>
    <td>
      <Skeleton height="0.85rem" width="65%" style={{ marginBottom: "0.4rem" }} />
      <Skeleton height="0.65rem" width="35%" />
    </td>
    <td><Skeleton height="1.2rem" width="70px" radius="pill" /></td>
    <td><Skeleton height="0.8rem" width="85%" /></td>
    <td><Skeleton height="0.8rem" width="70%" /></td>
    <td style={{ textAlign: "center" }}><Skeleton height="1.2rem" width="36px" radius="pill" style={{ margin: "0 auto" }} /></td>
    <td></td>
  </tr>
);

// Listado de Criterios de Aceptación Globales - el alta/edición vive en su
// propia ruta (CdaFormPage.jsx, /admin/cdas/nuevo o /admin/cdas/:cdaId) en
// vez de alternar como una segunda "vista" acá mismo: antes las dos
// convivían en un solo componente con un estado "vista" (lista/formulario),
// lo que obligaba a que esta pantalla y el workbench (con necesidades de
// layout muy distintas) compartieran el mismo layout en runtime. Con rutas
// separadas cada una tiene su propio ciclo de vida y layout, sin tener que
// coordinar nada entre sí; de paso, el alta/edición queda con URL propia
// (compartible, con "atrás" del navegador funcionando como se espera).
export default function CdasGlobales() {
  // Defensa en profundidad: ver useBloqueoAdminRestringido.
  const bloqueado = useBloqueoAdminRestringido();
  const navigate = useNavigate();
  const { data: todosCdasData, isLoading: isLoadingLista } = useObtenerTodosCdas();
  const [searchTerm, setSearchTerm] = useState("");
  const [pantallaFiltro, setPantallaFiltro] = useState("TODAS");
  const [pagina, setPagina] = useState(1);
  // Colapsado por defecto solo en Rango 2 (mismo umbral y mismo criterio
  // que Dashboard.jsx/Empresas.jsx).
  const [panelesVisibles, setPanelesVisibles] = useState(
    () => typeof window === "undefined" || !window.matchMedia("(max-height: 716px)").matches
  );

  // A diferencia de esCdaActivo (que tolera "" para no romper la vinculación
  // de CDAs migrados que ya estaban linkeados), esta lista es estricta:
  // solo se muestran los CDA con Activo="1" explícito. Uno en "0" o vacío
  // (dato migrado sin completar) no aparece. Mismo criterio que CdaPanel.
  const todosCdasList = (Array.isArray(todosCdasData) ? todosCdasData : todosCdasData?.items || todosCdasData?.data || []).filter(esCdaActivoEstricto);

  // Un CDA no tiene campo de "pantalla" propio (confirmado contra swagger):
  // la única señal real de "a qué pantalla pertenece" es estar vinculado a
  // su GrupoCda en alguna cadena. Se pide una vez por pantalla (3 llamadas,
  // cacheadas independientemente) y se arma un mapa cdaId -> pantallas[]
  // para poder mostrar el badge en la tabla y filtrar el listado - así el
  // admin ve de un vistazo qué CDAs ya existen para cada pantalla antes de
  // crear uno nuevo, en vez de terminar con dos CDAs equivalentes.
  const { data: idsPantalla0 } = useObtenerCdaIdsPorPantalla(TODAS_PANTALLAS_CDA_GLOBAL[0].value);
  const { data: idsPantalla1 } = useObtenerCdaIdsPorPantalla(TODAS_PANTALLAS_CDA_GLOBAL[1].value);
  const { data: idsPantalla2 } = useObtenerCdaIdsPorPantalla(TODAS_PANTALLAS_CDA_GLOBAL[2].value);
  const idsPorPantalla = [idsPantalla0, idsPantalla1, idsPantalla2];

  const pantallasDeCda = (cdaId) =>
    TODAS_PANTALLAS_CDA_GLOBAL.filter((_, i) => (idsPorPantalla[i] || []).includes(Number(cdaId)));

  const cdasFiltrados = todosCdasList.filter((c) => {
    if (pantallaFiltro !== "TODAS") {
      const enPantalla = pantallasDeCda(getCdaId(c)).some((p) => p.value === pantallaFiltro);
      if (!enPantalla) return false;
    }
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return (
      String(getCdaProp(c, "descripcion")).toLowerCase().includes(term) ||
      String(getCdaProp(c, "expresion")).toLowerCase().includes(term)
    );
  });

  const totalPaginas = Math.max(1, Math.ceil(cdasFiltrados.length / ELEMENTOS_POR_PAGINA));
  const paginaActual = Math.min(pagina, totalPaginas);
  const cdasPagina = cdasFiltrados.slice(
    (paginaActual - 1) * ELEMENTOS_POR_PAGINA,
    paginaActual * ELEMENTOS_POR_PAGINA
  );

  const handleBusqueda = (value) => {
    setSearchTerm(value);
    setPagina(1);
  };

  const handlePantallaFiltro = (value) => {
    setPantallaFiltro(value);
    setPagina(1);
  };

  const hayFiltrosActivos = !!searchTerm.trim() || pantallaFiltro !== "TODAS";

  if (bloqueado) return null;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.titleBox}>
          <h1>Criterios de Aceptación Globales</h1>
          <p>Gestioná los criterios de aceptación (CDA) existentes o creá uno nuevo.</p>
        </div>
        <div className={styles.actionsTop}>
          <button
            type="button"
            className={styles.toggleFiltersBtn}
            onClick={() => setPanelesVisibles((v) => !v)}
            aria-expanded={panelesVisibles}
            title={panelesVisibles ? "Ocultar filtros" : "Mostrar filtros"}
          >
            {panelesVisibles ? <FiChevronUp /> : <FiChevronDown />}
            {panelesVisibles ? "Ocultar filtros" : "Mostrar filtros"}
            {/* Con el panel colapsado, esta es la única señal de que la
                lista de abajo está filtrada y no es el total real. */}
            {!panelesVisibles && hayFiltrosActivos && (
              <span className={styles.toggleFiltersActiveDot} title="Hay filtros activos" />
            )}
          </button>
          <Button type="button" variant="blue" size="md" onClick={() => navigate("/admin/cdas/nuevo")}>
            <FiPlus /> Crear nuevo CDA
          </Button>
        </div>
      </div>

      {/* Colapsable en Rango 2 (mismo patrón que Dashboard.jsx/Empresas.jsx) */}
      <div className={`${styles.collapsiblePanel} ${!panelesVisibles ? styles.collapsiblePanelClosed : ""}`}>
        <div className={styles.collapsiblePanelInner}>
      <div className={styles.filtersCard}>
        <div className={styles.searchWrap}>
          <FiSearch className={styles.iconSearch} />
          <input
            type="text"
            placeholder="Buscar por descripción o expresión..."
            value={searchTerm}
            onChange={(e) => handleBusqueda(e.target.value)}
          />
        </div>
        <div className={styles.pantallaFilterGroup} role="group" aria-label="Filtrar por pantalla">
          <button
            type="button"
            className={pantallaFiltro === "TODAS" ? styles.pantallaFilterPillActive : styles.pantallaFilterPill}
            onClick={() => handlePantallaFiltro("TODAS")}
          >
            Todas
          </button>
          {TODAS_PANTALLAS_CDA_GLOBAL.map((p) => (
            <button
              key={p.value}
              type="button"
              className={pantallaFiltro === p.value ? styles.pantallaFilterPillActive : styles.pantallaFilterPill}
              onClick={() => handlePantallaFiltro(p.value)}
            >
              {p.label}
            </button>
          ))}
        </div>
        {!isLoadingLista && (
          <span className={styles.listCount}>
            {cdasFiltrados.length} criterio{cdasFiltrados.length !== 1 ? "s" : ""}
          </span>
        )}
      </div>
      </div>
      </div>

      <div className={styles.tableCard}>
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th style={{ width: "20%" }}>Descripción</th>
                <th style={{ width: "8%" }}>Integración</th>
                <th style={{ width: "16%" }}>Pantallas</th>
                <th style={{ width: "18%" }}>Expresión</th>
                <th style={{ width: "18%" }}>Mensaje de Rechazo</th>
                <th style={{ textAlign: "center", width: "160px" }}>Vinculación Default</th>
                <th style={{ width: "2.5rem" }}></th>
              </tr>
            </thead>
            <tbody>
              {isLoadingLista ? (
                Array.from({ length: 6 }).map((_, i) => <CdaRowSkeleton key={i} />)
              ) : cdasFiltrados.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ padding: 0 }}>
                    <div className={styles.emptyState}>
                      <FiInbox className={styles.emptyStateIcon} />
                      <span>No hay criterios de aceptación cargados todavía.</span>
                    </div>
                  </td>
                </tr>
              ) : (
                cdasPagina.map((cda) => {
                  const id = getCdaId(cda);
                  const defaultCv = String(getCdaProp(cda, "vinculadefaultcv"));
                  const esDefault = defaultCv === "1" || defaultCv.toUpperCase() === "S";
                  const integ = detectarIntegracion(getCdaProp(cda, "expresion"));
                  const integColor = INTEGRACION_COLORS[integ] || INTEGRACION_COLOR_DEFAULT;
                  const pantallasCda = pantallasDeCda(id);
                  const descripcion = getCdaProp(cda, "descripcion") || "-";
                  const expresion = getCdaProp(cda, "expresion") || "-";
                  const mensajeRechazo = getCdaProp(cda, "mensajerechazo") || "-";
                  const pantallasVisibles = pantallasCda.slice(0, 2);
                  const pantallasOcultas = pantallasCda.slice(2);
                  return (
                    <tr key={id} className={styles.clickableRow} onClick={() => navigate(`/admin/cdas/${id}`)}>
                      <td className={styles.truncateCell}>
                        <strong title={descripcion}>{descripcion}</strong>
                        <span className={styles.rowIdTag}>ID #{id}</span>
                      </td>
                      <td>
                        <span
                          className={styles.integracionBadge}
                          style={{ background: integColor.bg, color: integColor.color, borderColor: integColor.border }}
                        >
                          {integ || "—"}
                        </span>
                      </td>
                      <td>
                        {pantallasCda.length === 0 ? (
                          <span className={styles.pantallaBadgeVacio}>Sin vincular</span>
                        ) : (
                          <div className={styles.pantallaBadgeGroup}>
                            {pantallasVisibles.map((p) => (
                              <span key={p.value} className={styles.pantallaBadge}>{p.label}</span>
                            ))}
                            {pantallasOcultas.length > 0 && (
                              <span
                                className={styles.pantallaBadgeMore}
                                title={pantallasOcultas.map((p) => p.label).join(", ")}
                              >
                                +{pantallasOcultas.length}
                              </span>
                            )}
                          </div>
                        )}
                      </td>
                      <td className={styles.truncateCell}>
                        <code className={styles.tableCode} title={expresion}>{expresion}</code>
                      </td>
                      <td className={styles.truncateCell}>
                        <span title={mensajeRechazo}>{mensajeRechazo}</span>
                      </td>
                      <td style={{ textAlign: "center" }}>
                        <span className={esDefault ? styles.pillYes : styles.pillNo}>{esDefault ? "Sí" : "No"}</span>
                      </td>
                      <td style={{ textAlign: "center" }}>
                        <FiChevronRight className={styles.rowChevron} />
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {!isLoadingLista && cdasFiltrados.length > 0 && (
        <Paginacion
          page={paginaActual}
          onPageChange={setPagina}
          hasMoreData={paginaActual < totalPaginas}
          isLoading={isLoadingLista}
          knownEndPage={totalPaginas}
          variant="admin"
          totalItems={cdasFiltrados.length}
          pageSize={ELEMENTOS_POR_PAGINA}
          itemLabel="criterios"
        />
      )}
    </div>
  );
}
