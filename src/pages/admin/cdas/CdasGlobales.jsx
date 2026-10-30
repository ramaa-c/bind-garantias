import React, { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useObtenerTodosCdas } from "../../../hooks/useCda";
import { useObtenerCdaIdsPorPantalla } from "../../../hooks/useCadenaValor";
import { esCdaActivoEstricto, getCdaId, getCdaProp } from "../../../utils/cdaUtils";
import { TODAS_PANTALLAS_CDA_GLOBAL } from "../../../utils/pantallasCda";
import { Button } from "../../../components/ui/Button/Button";
import { Skeleton } from "../../../components/ui/Skeleton/Skeleton";
import { Paginacion } from "../../../components/ui/Paginacion/Paginacion";
import { FiPlus, FiChevronRight, FiSearch, FiInbox } from "react-icons/fi";
import { useBloqueoAdminRestringido } from "../../../hooks/useBloqueoAdminRestringido";
import { useFilasPorPagina } from "../../../hooks/useFilasPorPagina";
import styles from "./CdasGlobales.module.css";
import l from "../../../components/features/admin/ListadoAdmin/ListadoAdmin.module.css";

// Mismo criterio que Empresas.jsx: con el alto de fila blindado a una sola
// línea (table-layout:fixed + truncado con elipsis + tope de 2 badges de
// pantalla, ver CdasGlobales.module.css/el render de la tabla más abajo),
// el alto por fila es predecible y entra en 8 sin desbordar el punto más
// ajustado de Rango 1 - por eso .tableCard ya no necesita su propio scroll
// interno de emergencia (ver el mismo comentario en
// CdasGlobales.module.css).
const ELEMENTOS_POR_PAGINA = 8;

const ETIQUETA_CORTA_PANTALLA = {
  PANTALLA_INGRESO_CUIT: "CUIT",
  PANTALLA_SOCIOS: "Socios",
  PANTALLA_LINEAS: "Alta de línea",
};

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
  const contenedorRef = useRef(null);
  const listaRef = useRef(null);
  const filasPorPagina = useFilasPorPagina(contenedorRef, listaRef, {
    porDefecto: ELEMENTOS_POR_PAGINA,
  });


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

  const coincideBusqueda = (c) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return (
      String(getCdaProp(c, "descripcion")).toLowerCase().includes(term) ||
      String(getCdaProp(c, "expresion")).toLowerCase().includes(term)
    );
  };
  const enPantalla = (c, pantalla) =>
    pantalla === "TODAS" || pantallasDeCda(getCdaId(c)).some((p) => p.value === pantalla);

  const cdasBuscados = todosCdasList.filter(coincideBusqueda);
  const cdasFiltrados = cdasBuscados.filter((c) => enPantalla(c, pantallaFiltro));
  const cantidadEnPantalla = (pantalla) => cdasBuscados.filter((c) => enPantalla(c, pantalla)).length;

  const totalPaginas = Math.max(1, Math.ceil(cdasFiltrados.length / filasPorPagina));
  const paginaActual = Math.min(pagina, totalPaginas);
  const cdasPagina = cdasFiltrados.slice(
    (paginaActual - 1) * filasPorPagina,
    paginaActual * filasPorPagina
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
    <div className={styles.container} ref={contenedorRef}>
      <div className={l.encabezado}>
        <h1>Criterios de aceptación globales</h1>
        {!isLoadingLista && (
          <span className={l.resumen}>
            {cdasFiltrados.length === todosCdasList.length
              ? `${todosCdasList.length} criterios`
              : `${cdasFiltrados.length} de ${todosCdasList.length} criterios`}
          </span>
        )}
        <Button type="button" variant="blue" size="md" onClick={() => navigate("/admin/cdas/nuevo")} className={l.accionPrincipal}>
          <FiPlus /> Nuevo CDA
        </Button>
      </div>

      <div className={l.filtros}>
        <div className={l.buscador}>
          <FiSearch aria-hidden="true" />
          <input
            type="text"
            placeholder="Buscar por descripción o expresión"
            value={searchTerm}
            onChange={(e) => handleBusqueda(e.target.value)}
            aria-label="Buscar por descripción o expresión"
          />
        </div>
        <div className={l.segmentado} role="radiogroup" aria-label="Pantalla">
          {[{ value: "TODAS", label: "Todas" }, ...TODAS_PANTALLAS_CDA_GLOBAL].map((p) => (
            <button
              key={p.value}
              type="button"
              role="radio"
              aria-checked={pantallaFiltro === p.value}
              className={`${l.segOpcion} ${pantallaFiltro === p.value ? l.segActiva : ""}`}
              onClick={() => handlePantallaFiltro(p.value)}
            >
              {p.value === "TODAS" ? p.label : ETIQUETA_CORTA_PANTALLA[p.value] || p.label}
              <span className={l.segCantidad}>{isLoadingLista ? "–" : cantidadEnPantalla(p.value)}</span>
            </button>
          ))}
        </div>
        {hayFiltrosActivos && (
          <button
            type="button"
            className={l.limpiar}
            onClick={() => {
              handleBusqueda("");
              handlePantallaFiltro("TODAS");
            }}
          >
            Limpiar
          </button>
        )}
      </div>

      <div className={l.tablaCaja}>
        <div className={l.tablaScroll} ref={listaRef}>
          <table className={`${l.tabla} ${styles.table}`}>
            <thead>
              <tr>
                <th style={{ width: "21%" }}>Descripción</th>
                <th style={{ width: "8rem" }}>Integración</th>
                <th style={{ width: "20%" }}>Pantallas</th>
                <th style={{ width: "17%" }}>Expresión</th>
                <th style={{ width: "17%" }}>Mensaje de Rechazo</th>
                <th style={{ textAlign: "center", width: "6.5rem" }} title="Vinculación default">Default</th>
                <th style={{ width: "2.5rem" }}></th>
              </tr>
            </thead>
            <tbody>
              {isLoadingLista ? (
                Array.from({ length: 6 }).map((_, i) => <CdaRowSkeleton key={i} />)
              ) : cdasFiltrados.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ padding: 0, height: "auto" }}>
                    <div className={l.vacio}>
                      <FiInbox aria-hidden="true" />
                      <span>
                        {todosCdasList.length === 0
                          ? "No hay criterios de aceptación cargados todavía."
                          : "Ningún criterio coincide con los filtros."}
                      </span>
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
                    <tr key={id} data-fila className={`${l.filaClickeable} ${styles.clickableRow}`} onClick={() => navigate(`/admin/cdas/${id}`)}>
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
                      <td data-label="Pantallas">
                        {pantallasCda.length === 0 ? (
                          <span className={styles.pantallaBadgeVacio}>Sin vincular</span>
                        ) : (
                          <div className={styles.pantallaBadgeGroup}>
                            {pantallasVisibles.map((p, i) => (
                              <span
                                key={p.value}
                                className={`${styles.pantallaBadge} ${i > 0 ? styles.soloAncho : ""}`}
                                title={p.label}
                              >
                                {ETIQUETA_CORTA_PANTALLA[p.value] || p.label}
                              </span>
                            ))}
                            {pantallasOcultas.length > 0 && (
                              <span
                                className={`${styles.pantallaBadgeMore} ${styles.soloAncho}`}
                                title={pantallasOcultas.map((p) => p.label).join(", ")}
                              >
                                +{pantallasOcultas.length}
                              </span>
                            )}
                            {pantallasCda.length > 1 && (
                              <span
                                className={`${styles.pantallaBadgeMore} ${styles.soloAngosto}`}
                                title={pantallasCda.slice(1).map((p) => p.label).join(", ")}
                              >
                                +{pantallasCda.length - 1}
                              </span>
                            )}
                          </div>
                        )}
                      </td>
                      <td className={styles.truncateCell} data-label="Expresión">
                        <code className={styles.tableCode} title={expresion}>{expresion}</code>
                      </td>
                      <td className={styles.truncateCell} data-label="Rechazo">
                        <span title={mensajeRechazo}>{mensajeRechazo}</span>
                      </td>
                      <td style={{ textAlign: "center" }} data-label="Vinculación default">
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
          pageSize={filasPorPagina}
          itemLabel="criterios"
        />
      )}
    </div>
  );
}
