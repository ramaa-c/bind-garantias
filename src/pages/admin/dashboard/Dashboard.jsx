import React, { useMemo, useState } from "react";
import { FiSearch, FiCheck, FiX, FiFileText, FiList, FiGlobe, FiGrid, FiChevronRight, FiChevronUp, FiChevronDown, FiRefreshCw } from "react-icons/fi";
import { toast } from "sonner";
import { Button } from "../../../components/ui/Button/Button";
import { Modal } from "../../../components/ui/Modal/Modal";
import { SinResultados } from "../../../components/ui/SinResultados/SinResultados";
import { SelectSimple, SelectFechaSimple } from "../../../components/ui";
import { Skeleton } from "../../../components/ui";
import { Paginacion } from "../../../components/ui/Paginacion/Paginacion";
import { useAdminRestrictions } from "../../../hooks/useAdminRestrictions";
import { useObtenerTodasWeb } from "../../../hooks/useCadenaValor";
import { useObtenerLimites, useActualizarLimiteSocio, useMigrarLinea } from "../../../hooks/useLinea";
import { useObtenerSocios } from "../../../hooks/useSocios";
import { CriteriosAceptacionModal, RechazarSolicitudModal } from "../../../components/features";
import { solicitudesService } from "../../../services/solicitudesService";
import {
  ESTADO_RECHAZADA,
  ESTADO_PENDIENTE,
  ESTADO_APROBADA,
  ESTADO_CANCELADA,
  estadoTextoDesde,
} from "../../../utils/estadoLimiteSocio";
import styles from "./Dashboard.module.css";

const opcionesEstado = [
  { value: "todos", label: "Todos los estados" },
  { value: "pendiente", label: "Pendiente" },
  { value: "aprobada", label: "Aprobada" },
  { value: "rechazada", label: "Rechazada" },
  { value: "cancelada", label: "Cancelada" },
];

const opcionesOrden = [
  { value: "desc", label: "Más recientes" },
  { value: "asc", label: "Más antiguas" },
];

const FILTROS_POR_DEFECTO = {
  busqueda: "",
  filtroEstado: "todos",
  orden: "desc",
  fechaDesde: "",
  fechaHasta: "",
};

// SelectFechaSimple entrega el valor ya como ISO completo, así que el límite
// superior del rango se lleva a las 23:59:59 locales en vez de asumir un
// formato "yyyy-mm-dd" (mismo criterio que la pantalla de Solicitudes del
// cliente).
const finDelDia = (fecha) => {
  const d = new Date(fecha);
  d.setHours(23, 59, 59, 999);
  return d;
};

const dotYPillClaseDesde = (isAprobada, isRechazada, isCancelada) => {
  if (isAprobada) return "Aprobada";
  if (isRechazada) return "Rechazada";
  if (isCancelada) return "Cancelada";
  return "Pendiente";
};

const getIniciales = (denominacion) => {
  if (!denominacion) return "?";
  const palabras = denominacion.trim().split(/\s+/).filter(Boolean);
  if (palabras.length === 1) return palabras[0].slice(0, 2).toUpperCase();
  return (palabras[0][0] + palabras[1][0]).toUpperCase();
};

// Filas con avatar (mismo criterio visual que Empresas.jsx): entran menos
// por página que la vieja grilla ultra-compacta, pero se leen de un vistazo.
const ELEMENTOS_POR_PAGINA = 8;

// Misma forma que una fila real, para que el loading no "salte" de tamaño
// cuando llegan los datos.
const SolicitudRowSkeleton = () => (
  <div className={styles.row}>
    <Skeleton width="2.35rem" height="2.35rem" radius="50%" />
    <div className={styles.rowIdentity}>
      <Skeleton height="0.9rem" width="55%" />
      <Skeleton height="0.75rem" width="75%" style={{ marginTop: "0.35rem" }} />
    </div>
    <Skeleton width="6rem" height="1.4rem" radius="9999px" />
    <Skeleton width="7rem" height="1.1rem" />
    <div className={styles.rowSpacer} />
    <Skeleton width="10rem" height="1.9rem" radius="0.5rem" />
    <Skeleton width="1rem" height="1rem" />
  </div>
);

export default function Dashboard() {
  const [busqueda, setBusqueda] = useState(FILTROS_POR_DEFECTO.busqueda);
  const [filtroEstado, setFiltroEstado] = useState(FILTROS_POR_DEFECTO.filtroEstado);
  const [orden, setOrden] = useState(FILTROS_POR_DEFECTO.orden);
  const [fechaDesde, setFechaDesde] = useState(FILTROS_POR_DEFECTO.fechaDesde);
  const [fechaHasta, setFechaHasta] = useState(FILTROS_POR_DEFECTO.fechaHasta);
  const [selectedCadenaId, setSelectedCadenaId] = useState("all");
  const [pagina, setPagina] = useState(1);
  const [panelesVisibles, setPanelesVisibles] = useState(true);

  // Detalle Modal
  const [solicitudDetalle, setSolicitudDetalle] = useState(null);
  const [solicitudCda, setSolicitudCda] = useState(null);
  const [solicitudARechazar, setSolicitudARechazar] = useState(null);
  const [isChainModalOpen, setIsChainModalOpen] = useState(false);
  const [chainSearchQuery, setChainSearchQuery] = useState("");
  const { isRestricted, cadenas } = useAdminRestrictions();
  const { data: activeCadenas } = useObtenerTodasWeb();

  const targetCadenaId = selectedCadenaId === "all" ? 0 : Number(selectedCadenaId) || 0;
  const { data: limitesData, isLoading: isLoadingLimites } =
    useObtenerLimites(targetCadenaId > 0 ? targetCadenaId : undefined);
  const { data: sociosData, isLoading: isLoadingSocios } = useObtenerSocios();
  const actualizarEstadoMutation = useActualizarLimiteSocio();
  const migrarLineaMutation = useMigrarLinea();

  const loading = isLoadingLimites || isLoadingSocios;

  const selectedChain = (activeCadenas || []).find(
    (c) => String(c.cadenavalorid || c.CadenaValorID) === String(selectedCadenaId)
  );

  // Normalize restricted cadenas
  const restrictedIds = useMemo(
    () =>
      new Set(
        (cadenas || []).map((c) => c.cadenavalorid || c.CadenaValorID || c.id || c.cadenaid),
      ),
    [cadenas],
  );

  const visibleCadenas = isRestricted
    ? (activeCadenas || []).filter((c) => {
        const id = c.cadenavalorid || c.CadenaValorID;
        return restrictedIds.has(id);
      })
    : (activeCadenas || []);

  const solicitudesCanal = useMemo(() => {
    const listLimites = Array.isArray(limitesData) ? limitesData : [];
    const listSocios = Array.isArray(sociosData) ? sociosData : [];

    const sociosMap = new Map();
    listSocios.forEach((s) => {
      const socioId = s.socioid || s.SocioID;
      if (socioId) sociosMap.set(socioId, s);
    });

    const matchedLimites = listLimites.filter((l) => {
      const lCadenaId = l.cadenavalorid || l.CadenaValorID;
      if (isRestricted && !restrictedIds.has(lCadenaId)) {
        return false;
      }
      if (targetCadenaId > 0 && lCadenaId !== targetCadenaId) {
        return false;
      }
      return true;
    });

    return matchedLimites.map((l) => {
      const socioId = l.socioid || l.SocioID;
      // Sin fallback a "cualquier socio con denominación": si no lo
      // encontramos, se muestra explícitamente como no encontrado en vez de
      // mostrar los datos de otro cliente.
      const socio = socioId ? sociosMap.get(socioId) : null;

      const tipoLimiteEstadoId = l.tipolimiteestadoid ?? l.TipoLimiteEstadoID ?? ESTADO_PENDIENTE;
      const estadoText = estadoTextoDesde(tipoLimiteEstadoId);

      // Rechazada (admin) y Cancelada (socio) vuelven a distinguirse con un
      // workaround temporal: Cancelada pisa el valor de Vencido (5), que no
      // usamos para nada más (ver ESTADO_CANCELADA en utils/estadoLimiteSocio.js).
      const accionText =
        Number(tipoLimiteEstadoId) === ESTADO_APROBADA
          ? "Aprobada por Administrador"
          : Number(tipoLimiteEstadoId) === ESTADO_RECHAZADA
            ? "Rechazada por Administrador"
            : Number(tipoLimiteEstadoId) === ESTADO_CANCELADA
              ? "Cancelada por el cliente"
              : "Espera de validación del Administrador";

      const tipoLimiteId = l.tipolimiteid || l.TipoLimiteID;
      const tipoText =
        tipoLimiteId === 1
          ? "Alta de línea (Cheque)"
          : tipoLimiteId === 2
            ? "Alta de línea (Préstamo)"
            : "Alta de línea (Pagaré)";

      const importeLimite = l.importelimite || l.ImporteLimite;
      const monedaId = l.monedaid || l.MonedaID;
      const fchVigenciaDesde = l.fchvigenciadesde || l.FchVigenciaDesde;
      const fchVigenciaHasta = l.fchvigenciahasta || l.FchVigenciaHasta;
      const tipoLimiteSocioId = l.tipolimitesocioid || l.TipoLimiteSocioID;

      return {
        id: tipoLimiteSocioId?.toString() || "",
        tipoLimiteEstadoId: Number(tipoLimiteEstadoId),
        tipo: tipoText,
        monto: importeLimite
          ? new Intl.NumberFormat("es-AR").format(importeLimite)
          : "0",
        moneda: monedaId === 2 ? "U$D" : "$",
        cliente: socio?.denominacion || "Socio no encontrado",
        cuit: socio?.cuit || "—",
        usuario: socio?.email || "—",
        socioid: socioId,
        cadenavalorid: l.cadenavalorid || l.CadenaValorID,
        estado: estadoText,
        accionPendiente: accionText,
        creado: fchVigenciaDesde
          ? new Date(fchVigenciaDesde).toLocaleString("es-AR")
          : "Reciente",
        creadoISO: fchVigenciaDesde || null,
        actualizado: fchVigenciaHasta
          ? new Date(fchVigenciaHasta).toLocaleString("es-AR")
          : "Reciente",
        cadenaSlug: "default",
        raw: l,
      };
    });
  }, [limitesData, sociosData, isRestricted, restrictedIds, targetCadenaId]);

  // La migración a SGR+ es un paso aparte de la aprobación en TipoLimiteSocio
  // (que ya quedó guardada) — si falla acá, no hay que revertir nada, solo
  // avisar. `contexto` solo cambia el texto de los toasts: "reintento" se usa
  // desde el botón manual (ver handleReintentarMigracion más abajo), para
  // líneas que ya quedaron Aprobadas pero no llegaron a migrar (ej. la
  // primera vez que se aprobó, api/Linea/Migrar falló).
  const migrarLinea = (item, { contexto = "aprobar" } = {}) => {
    const tipoLimiteSocioId =
      item.raw?.tipolimitesocioid ?? item.raw?.TipoLimiteSocioID ?? item.id;
    migrarLineaMutation.mutate(tipoLimiteSocioId, {
      onSuccess: () => {
        if (contexto === "reintento") {
          toast.success(`Línea N°${item.id} migrada a SGR+ correctamente`);
        }
      },
      onError: (migError) => {
        toast.error(
          contexto === "aprobar"
            ? `La línea N°${item.id} se aprobó pero no se pudo migrar a SGR+`
            : `No se pudo migrar la línea N°${item.id} a SGR+`,
          { description: migError.message },
        );
      },
    });
  };

  const handleReintentarMigracion = (item) => migrarLinea(item, { contexto: "reintento" });

  // Cada cambio de estado en TipoLimiteSocio (aprobar/rechazar) tiene que
  // reflejarse también en SolicitudEnProceso — desde que se unificó el
  // catálogo de estados con Victor (2026-08-18), ambas tablas usan
  // literalmente los mismos valores, así que no hace falta traducir nada.
  // Se identifica la fila por TipoLimiteSocio.SolicitudID — confirmado en
  // vivo el 2026-08-18 que sigue trayendo el SolicitudEnProcesoID real a
  // pesar de que AltaOperacion.jsx mande null al crear la línea (el backend
  // lo resuelve solo). No bloquea ni revierte la aprobación/rechazo si
  // falla: solo queda logueado, es una sincronización secundaria.
  const sincronizarSolicitudEnProceso = (item, nuevoTipoLimiteEstadoId) => {
    const solicitudEnProcesoId = item.raw?.solicitudid ?? item.raw?.SolicitudID;
    if (!solicitudEnProcesoId || !item.cuit || item.cuit === "—") return;
    solicitudesService
      .sincronizarEstadoSolicitudEnProceso(item.cuit, solicitudEnProcesoId, nuevoTipoLimiteEstadoId)
      .catch((syncErr) => {
        console.error(
          `[Dashboard] No se pudo sincronizar el estado en SolicitudEnProceso para la línea N°${item.id}:`,
          syncErr,
        );
      });
  };

  const handleDecision = (item, nuevoEstado, observaciones) => {
    const payload = { ...item.raw, tipolimiteestadoid: nuevoEstado };
    if (observaciones !== undefined) payload.observaciones = observaciones;

    // El EquipoComercialID de la línea puede haber quedado en 0 (mismo
    // criterio que usa AltaOperacion.jsx al crearla: no hay que confiar en
    // lo que ya esté guardado en TipoLimiteSocio, sino resolverlo siempre
    // desde la CadenaValor vigente). Victor detectó que ese 0 es lo que
    // rompe api/Linea/Migrar al aprobar — reportado el 2026-08-14.
    const cadenaId = item.cadenavalorid ?? item.raw?.cadenavalorid ?? item.raw?.CadenaValorID;
    const cadenaDeLaLinea = (activeCadenas || []).find(
      (c) => Number(c.cadenavalorid ?? c.CadenaValorID) === Number(cadenaId),
    );
    const equipoComercialId = Number(
      cadenaDeLaLinea?.equipocomercialid ?? cadenaDeLaLinea?.EquipoComercialID ?? 0,
    );
    if (equipoComercialId > 0) payload.equipocomercialid = equipoComercialId;

    actualizarEstadoMutation.mutate(payload, {
      onSuccess: () => {
        sincronizarSolicitudEnProceso(item, nuevoEstado);
        if (nuevoEstado === ESTADO_APROBADA) {
          toast.success(`Solicitud N°${item.id} Aprobada exitosamente`, {
            description: "Los fondos o cupos han sido habilitados para el cliente.",
          });
          migrarLinea(item);
        } else {
          toast.error(`Solicitud N°${item.id} Rechazada`, {
            description: "Se ha notificado al cliente el rechazo de la operación.",
          });
          setSolicitudARechazar(null);
        }
      },
      onError: (err) => {
        toast.error(`No se pudo actualizar la Solicitud N°${item.id}: ` + err.message);
      },
    });
  };

  const handleAceptar = (item) => handleDecision(item, ESTADO_APROBADA);
  // "Rechazar" ya no aplica el cambio directo: abre el modal que pide el
  // motivo (queda en TipoLimiteSocio.Observaciones, lo que ya muestra
  // DetalleSolicitudModal.jsx del lado cliente) — ver handleConfirmarRechazo.
  const handleRechazar = (item) => setSolicitudARechazar(item);
  const handleConfirmarRechazo = (motivo) => {
    if (!solicitudARechazar) return;
    handleDecision(solicitudARechazar, ESTADO_RECHAZADA, motivo);
  };

  const fechaDesdeDate = fechaDesde ? new Date(fechaDesde) : undefined;
  const fechaHastaDate = fechaHasta ? new Date(fechaHasta) : undefined;

  const hayFiltrosActivos =
    !!busqueda ||
    filtroEstado !== FILTROS_POR_DEFECTO.filtroEstado ||
    orden !== FILTROS_POR_DEFECTO.orden ||
    !!fechaDesde ||
    !!fechaHasta;

  // Cambiar de cadena o tocar cualquier filtro vuelve a la página 1 -
  // si no, se puede quedar viendo una página vacía (ej. estabas en la
  // página 3 y el nuevo filtro solo da 1 resultado). Se resetea acá, junto
  // con el cambio real, en vez de "derivarlo" con un efecto aparte.
  const handleBusqueda = (val) => {
    setBusqueda(val);
    setPagina(1);
  };
  const handleFiltroEstado = (val) => {
    setFiltroEstado(val);
    setPagina(1);
  };
  const handleOrden = (val) => {
    setOrden(val);
    setPagina(1);
  };
  const handleFechaDesde = (val) => {
    setFechaDesde(val);
    setPagina(1);
  };
  const handleFechaHasta = (val) => {
    setFechaHasta(val);
    setPagina(1);
  };
  const handleSelectCadena = (id) => {
    setSelectedCadenaId(id);
    setPagina(1);
  };

  const handleLimpiarFiltros = () => {
    setBusqueda(FILTROS_POR_DEFECTO.busqueda);
    setFiltroEstado(FILTROS_POR_DEFECTO.filtroEstado);
    setOrden(FILTROS_POR_DEFECTO.orden);
    setFechaDesde(FILTROS_POR_DEFECTO.fechaDesde);
    setFechaHasta(FILTROS_POR_DEFECTO.fechaHasta);
    setPagina(1);
  };

  const filtradas = solicitudesCanal
    .filter((s) => {
      const matchTexto =
        s.cliente.toLowerCase().includes(busqueda.toLowerCase()) ||
        s.cuit.includes(busqueda) ||
        s.id.includes(busqueda) ||
        s.usuario.toLowerCase().includes(busqueda.toLowerCase());
      if (!matchTexto) return false;

      if (filtroEstado !== "todos" && !s.estado.toLowerCase().includes(filtroEstado.toLowerCase())) {
        return false;
      }

      if (fechaDesde || fechaHasta) {
        if (!s.creadoISO) return false;
        const fechaItem = new Date(s.creadoISO);
        if (fechaDesde && fechaItem < new Date(fechaDesde)) return false;
        if (fechaHasta && fechaItem > finDelDia(fechaHasta)) return false;
      }

      return true;
    })
    .sort((a, b) => {
      if (orden === "desc") return b.id.localeCompare(a.id);
      return a.id.localeCompare(b.id);
    });

  const totalMonto = solicitudesCanal.reduce((acc, curr) => {
    const val = parseFloat(curr.monto.replace(/\./g, "")) || 0;
    return acc + (curr.moneda === "U$D" ? val * 1500 : val);
  }, 0);

  const totalPendientes = solicitudesCanal.filter((s) => s.estado.includes("Pendiente")).length;
  const totalAprobadas = solicitudesCanal.filter((s) => s.estado === "Aprobada").length;

  const totalPaginas = Math.max(1, Math.ceil(filtradas.length / ELEMENTOS_POR_PAGINA));
  const paginaActual = Math.min(pagina, totalPaginas);
  const filtradasPagina = filtradas.slice(
    (paginaActual - 1) * ELEMENTOS_POR_PAGINA,
    paginaActual * ELEMENTOS_POR_PAGINA,
  );

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Gestión de Solicitudes</h1>
        <button
          type="button"
          className={styles.toggleFiltersBtn}
          onClick={() => setPanelesVisibles((v) => !v)}
          aria-expanded={panelesVisibles}
          title={panelesVisibles ? "Ocultar cadena y filtros" : "Mostrar cadena y filtros"}
        >
          {panelesVisibles ? <FiChevronUp /> : <FiChevronDown />}
          {panelesVisibles ? "Ocultar filtros" : "Mostrar filtros"}
        </button>
      </div>

      {/* Colapsable: subtítulo + franja de contexto + filtros. En pantallas
          chicas (no full HD) este bloque es el que más espacio vertical le
          come a la lista, así que se puede ocultar entero con un clic y
          ver más solicitudes sin scrollear. */}
      <div className={`${styles.collapsiblePanel} ${!panelesVisibles ? styles.collapsiblePanelClosed : ""}`}>
        <div className={styles.collapsiblePanelInner}>
        <p className={styles.subtitle}>Procesá las solicitudes de línea de todas las cadenas de valor activas en el sistema.</p>

        {/* Franja de contexto: cadena seleccionada + métricas, en una sola línea */}
        <div className={styles.contextBar}>
        {loading ? (
          <>
            <div className={styles.contextChain}>
              <Skeleton width="2.5rem" height="2.5rem" radius="0.625rem" />
              <div style={{ flex: 1 }}>
                <Skeleton height="0.9rem" width="55%" />
                <Skeleton height="0.7rem" width="35%" style={{ marginTop: "0.3rem" }} />
              </div>
            </div>
            <Skeleton width="9rem" height="1.5rem" />
          </>
        ) : (
          <>
            <div className={styles.contextChain}>
              {selectedCadenaId === "all" ? (
                <div className={styles.contextChainIcon}>
                  <FiGlobe size={20} />
                </div>
              ) : selectedChain?.logo ? (
                <div className={styles.contextChainLogo}>
                  <img
                    src={
                      selectedChain.logo.startsWith("data:") || selectedChain.logo.startsWith("http")
                        ? selectedChain.logo
                        : `data:image/png;base64,${selectedChain.logo}`
                    }
                    alt={selectedChain.denominacion}
                  />
                </div>
              ) : (
                <div className={styles.contextChainIcon}>
                  <FiGrid size={20} />
                </div>
              )}
              <div className={styles.contextChainInfo}>
                <span className={styles.contextChainName}>
                  {selectedCadenaId === "all"
                    ? "Consolidado General"
                    : selectedChain?.denominacion || "Cargando..."}
                </span>
                <span className={styles.contextChainMeta}>
                  {selectedCadenaId === "all"
                    ? "Todas las cadenas de valor"
                    : `Ref: ${selectedChain?.referencia || "Sin ref"} · #${selectedChain?.cadenavalorid || selectedChain?.CadenaValorID}`}
                </span>
              </div>
              <div className={styles.contextChainActions}>
                <button
                  type="button"
                  className={styles.contextChainBtn}
                  onClick={() => {
                    setChainSearchQuery("");
                    setIsChainModalOpen(true);
                  }}
                >
                  {selectedCadenaId === "all" ? "Seleccionar cadena" : "Cambiar"} <FiChevronRight size={13} />
                </button>
                {selectedCadenaId !== "all" && (
                  <button
                    type="button"
                    className={`${styles.contextChainBtn} ${styles.contextChainBtnGhost}`}
                    onClick={() => handleSelectCadena("all")}
                  >
                    Ver todas
                  </button>
                )}
              </div>
            </div>

            <div className={styles.contextDivider} />

            <div className={styles.contextStats}>
              <div className={styles.statBlock}>
                <span className={styles.statLabel}>Líneas</span>
                <span className={styles.statValue}>{solicitudesCanal.length}</span>
              </div>
              <div className={styles.statDivider} />
              <div className={styles.statBlock}>
                <span className={styles.statLabel}>Volumen</span>
                <span className={styles.statValue}>$ {(totalMonto / 1000000).toFixed(1)}M</span>
              </div>
              <div className={styles.statDivider} />
              <div className={styles.statBlock}>
                <span className={styles.statLabel}>Pendientes</span>
                <span className={`${styles.statValue} ${styles.statValueWarning}`}>{totalPendientes}</span>
              </div>
              <div className={styles.statDivider} />
              <div className={styles.statBlock}>
                <span className={styles.statLabel}>Aprobadas</span>
                <span className={`${styles.statValue} ${styles.statValueSuccess}`}>{totalAprobadas}</span>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Barra de filtros — mismo patrón que Solicitudes.jsx del cliente */}
      <div className={styles.filterBar}>
        <div className={styles.searchBox}>
          <FiSearch className={styles.searchIcon} />
          <input
            type="text"
            placeholder="Buscar por Cliente, CUIT, Usuario o N° Solicitud..."
            value={busqueda}
            onChange={(e) => handleBusqueda(e.target.value)}
            className={styles.searchInput}
          />
        </div>

        <div className={styles.filterFieldsRow}>
          <SelectFechaSimple
            label="Desde"
            value={fechaDesde}
            onChange={handleFechaDesde}
            disableFuture
            maxDate={fechaHastaDate}
            variant="admin"
            compact
            hideErrorSpace
            className={styles.filterField}
          />
          <SelectFechaSimple
            label="Hasta"
            value={fechaHasta}
            onChange={handleFechaHasta}
            disableFuture
            minDate={fechaDesdeDate}
            variant="admin"
            compact
            hideErrorSpace
            className={styles.filterField}
          />
          <SelectSimple
            label="Estado"
            value={filtroEstado}
            onChange={handleFiltroEstado}
            options={opcionesEstado}
            isSearchable={false}
            hideErrorSpace
            compact
            variant="admin"
            className={styles.filterField}
          />
          <SelectSimple
            label="Orden"
            value={orden}
            onChange={handleOrden}
            options={opcionesOrden}
            isSearchable={false}
            hideErrorSpace
            compact
            variant="admin"
            className={styles.filterField}
          />
        </div>

        <button
          type="button"
          className={`${styles.clearFiltersBtn} ${hayFiltrosActivos ? styles.clearFiltersBtnVisible : ""}`}
          onClick={handleLimpiarFiltros}
          disabled={!hayFiltrosActivos}
          tabIndex={hayFiltrosActivos ? 0 : -1}
          title="Limpiar filtros"
          aria-label="Limpiar filtros"
        >
          <FiX />
        </button>
        </div>
        </div>
      </div>

      {/* Lista de solicitudes */}
      <div className={styles.listWrapper}>
        {loading ? (
          Array.from({ length: 5 }).map((_, i) => <SolicitudRowSkeleton key={i} />)
        ) : filtradas.length === 0 ? (
          <SinResultados
            className={styles.emptyState}
            message="No se encontraron solicitudes que coincidan con los criterios de búsqueda."
          />
        ) : (
          filtradasPagina.map((item) => {
            const isAprobada = item.tipoLimiteEstadoId === ESTADO_APROBADA;
            const isRechazada = item.tipoLimiteEstadoId === ESTADO_RECHAZADA;
            const isCancelada = item.tipoLimiteEstadoId === ESTADO_CANCELADA;
            const isPendiente = !isAprobada && !isRechazada && !isCancelada;
            const estadoKey = dotYPillClaseDesde(isAprobada, isRechazada, isCancelada);

            return (
              <div
                key={item.id}
                className={`${styles.row} ${styles.rowClickable} ${styles[`row${estadoKey}`]}`}
                onClick={() => setSolicitudDetalle(item)}
                title="Ver detalle de la solicitud"
              >
                <div className={`${styles.rowAvatar} ${styles[`avatar${estadoKey}`] || ""}`}>
                  {getIniciales(item.cliente)}
                </div>

                <div className={styles.rowIdentity}>
                  <span className={styles.rowClientName}>{item.cliente}</span>
                  <span className={styles.rowMeta}>
                    N°{item.id} · {item.creado} · {item.tipo} · CUIT {item.cuit} · {item.usuario}
                  </span>
                </div>

                <span className={`${styles.rowPill} ${styles[`pill${estadoKey}`]}`}>
                  <span className={styles.statusDot} />
                  {item.estado}
                </span>

                <div className={styles.rowAmountBlock}>
                  <span className={styles.rowAmountLabel}>Monto</span>
                  <span className={styles.rowAmount}>
                    {item.moneda || "$"} {item.monto}
                  </span>
                </div>

                <div className={styles.rowSpacer} />

                {/* "Ver detalle" ya no es un botón acá: toda la fila lo abre
                    (ver onClick arriba) - el chevron solo la señaliza. Los
                    botones que quedan son decisiones reales, por eso cortan
                    la propagación del click para no disparar el detalle
                    encima. */}
                <div className={styles.rowActions} onClick={(e) => e.stopPropagation()}>
                  {isRestricted ? (
                    <Button
                      onClick={() => setSolicitudCda(item)}
                      variant="outlineBlue"
                      size="sm"
                    >
                      <FiList /> CRITERIOS
                    </Button>
                  ) : (
                    <>
                      {isPendiente && (
                        <>
                          <Button
                            onClick={() => handleAceptar(item)}
                            variant="success"
                            size="sm"
                            title="Aprobar Solicitud"
                            disabled={actualizarEstadoMutation.isPending}
                          >
                            <FiCheck /> ACEPTAR
                          </Button>
                          <Button
                            onClick={() => handleRechazar(item)}
                            variant="danger"
                            size="sm"
                            title="Rechazar Solicitud"
                            disabled={actualizarEstadoMutation.isPending}
                          >
                            <FiX /> RECHAZAR
                          </Button>
                        </>
                      )}

                      {isAprobada && (
                        <Button
                          onClick={() => handleReintentarMigracion(item)}
                          variant="outlineBlue"
                          size="sm"
                          title="Reintentar la migración de esta línea a SGR+"
                          disabled={migrarLineaMutation.isPending}
                        >
                          <FiRefreshCw /> MIGRAR
                        </Button>
                      )}
                    </>
                  )}
                </div>

                <FiChevronRight className={styles.rowChevron} />
              </div>
            );
          })
        )}
      </div>

      {!loading && filtradas.length > 0 && (
        <Paginacion
          page={paginaActual}
          onPageChange={setPagina}
          hasMoreData={paginaActual < totalPaginas}
          knownEndPage={totalPaginas}
          variant="admin"
          totalItems={filtradas.length}
          pageSize={ELEMENTOS_POR_PAGINA}
          itemLabel="solicitudes"
        />
      )}

      {/* Mock Detail Modal */}
      <Modal
        isOpen={!!solicitudDetalle}
        onClose={() => setSolicitudDetalle(null)}
        title="DETALLE DE SOLICITUD"
        maxWidth="40rem"
        variant="blue"
      >
        {solicitudDetalle && (
          <>
            <div className={styles.modalBodyCustom}>
              {/* Solicitud Hero Card */}
              <div className={styles.solicitudHeroCard}>
                <div className={styles.solicitudAvatar}>
                  <FiFileText size={20} />
                </div>
                <div className={styles.solicitudHeaderDetails}>
                  <div className={styles.solicitudMeta}>
                    <span className={styles.solicitudNumber}>SOLICITUD N°{solicitudDetalle.id}</span>
                    <span className={`${styles.solicitudStatusBadge} ${
                      solicitudDetalle.tipoLimiteEstadoId === ESTADO_APROBADA ? styles.badgeAproved :
                      solicitudDetalle.tipoLimiteEstadoId === ESTADO_RECHAZADA ? styles.badgeRejected :
                      solicitudDetalle.tipoLimiteEstadoId === ESTADO_CANCELADA ? styles.badgeCancelled :
                      styles.badgePending
                    }`}>
                      {solicitudDetalle.estado}
                    </span>
                  </div>
                  <h3 className={styles.solicitudProduct}>{solicitudDetalle.tipo}</h3>
                </div>
                <div className={styles.solicitudAmount}>
                  <span className={styles.amountLabel}>Monto Solicitado</span>
                  <strong className={styles.amountValue}>
                    {solicitudDetalle.moneda || "$"} {solicitudDetalle.monto}
                  </strong>
                </div>
              </div>

              {/* Grid with 2 columns */}
              <div className={styles.detailsGridSplit}>
                <div className={styles.detailsBlock}>
                  <h4 className={styles.detailsBlockTitle}>Datos del Solicitante</h4>
                  <div className={styles.detailFields}>
                    <div className={styles.detailField}>
                      <span className={styles.fieldLabel}>Razón Social</span>
                      <span className={styles.fieldValue}>{solicitudDetalle.cliente}</span>
                    </div>
                    <div className={styles.detailField}>
                      <span className={styles.fieldLabel}>CUIT / Identificador</span>
                      <span className={styles.fieldValue}>{solicitudDetalle.cuit}</span>
                    </div>
                    <div className={styles.detailField}>
                      <span className={styles.fieldLabel}>Email Operador</span>
                      <span className={styles.fieldValue}>{solicitudDetalle.usuario}</span>
                    </div>
                  </div>
                </div>

                <div className={styles.detailsBlock}>
                  <h4 className={styles.detailsBlockTitle}>Detalle de la Operación</h4>
                  <div className={styles.detailFields}>
                    <div className={styles.detailField}>
                      <span className={styles.fieldLabel}>Línea / Producto</span>
                      <span className={styles.fieldValue}>{solicitudDetalle.tipo}</span>
                    </div>
                    <div className={styles.detailField}>
                      <span className={styles.fieldLabel}>Último Hito de Control</span>
                      <span className={styles.fieldValueHighlight}>{solicitudDetalle.accionPendiente}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom metadata banner */}
              <div className={styles.trazabilidadBanner}>
                <div className={styles.trazabilidadItem}>
                  <span className={styles.trazabilidadLabel}>Carga Inicial:</span>
                  <span className={styles.trazabilidadValue}>{solicitudDetalle.creado}</span>
                </div>
                <div className={styles.trazabilidadItem}>
                  <span className={styles.trazabilidadLabel}>Última Modificación:</span>
                  <span className={styles.trazabilidadValue}>{solicitudDetalle.actualizado}</span>
                </div>
                <div className={styles.trazabilidadItem}>
                  <span className={styles.trazabilidadLabel}>Canal Origen:</span>
                  <span className={styles.trazabilidadValue}>BIND Garantías Portal Web</span>
                </div>
              </div>
            </div>
            <div className={styles.modalFootCustom}>
              <Button
                variant="outlineBlue"
                size="sm"
                onClick={() => setSolicitudDetalle(null)}
              >
                Cerrar
              </Button>
            </div>
          </>
        )}
      </Modal>

      <CriteriosAceptacionModal
        isOpen={!!solicitudCda}
        onClose={() => setSolicitudCda(null)}
        solicitud={solicitudCda}
      />

      <RechazarSolicitudModal
        key={solicitudARechazar?.id ?? "none"}
        isOpen={!!solicitudARechazar}
        onClose={() => setSolicitudARechazar(null)}
        onConfirm={handleConfirmarRechazo}
        solicitud={solicitudARechazar}
        isLoading={actualizarEstadoMutation.isPending}
      />

      {/* Value Chain Selection Modal */}
      <Modal
        isOpen={isChainModalOpen}
        onClose={() => setIsChainModalOpen(false)}
        title="SELECCIONAR CADENA DE VALOR"
        maxWidth="50rem"
        variant="blue"
      >
        <div className={styles.modalChainContent}>
          <div className={styles.modalSearchWrap}>
            <FiSearch className={styles.iconSearchModal} />
            <input
              type="text"
              placeholder="Buscar cadena por denominación o referencia..."
              value={chainSearchQuery}
              onChange={(e) => setChainSearchQuery(e.target.value)}
              className={styles.modalSearchInput}
            />
          </div>

          <div className={styles.chainGridModal}>
            {/* Option: All Chains */}
            <div
              className={`${styles.chainCardModal} ${selectedCadenaId === "all" ? styles.chainCardActive : ""}`}
              onClick={() => {
                handleSelectCadena("all");
                setIsChainModalOpen(false);
              }}
            >
              <div className={styles.chainCardLogo}>
                <FiGlobe size={28} />
              </div>
              <div className={styles.chainCardModalInfo}>
                <h3>Todas las cadenas</h3>
                <p>Consolidado General de solicitudes</p>
              </div>
            </div>

            {/* Filter and map visible chains */}
            {visibleCadenas
              .filter((c) => {
                const denom = (c.denominacion || "").toLowerCase();
                const ref = (c.referencia || "").toLowerCase();
                const q = chainSearchQuery.toLowerCase();
                return denom.includes(q) || ref.includes(q);
              })
              .map((c) => {
                const id = String(c.cadenavalorid || c.CadenaValorID);
                const isSelected = String(selectedCadenaId) === id;
                return (
                  <div
                    key={id}
                    className={`${styles.chainCardModal} ${isSelected ? styles.chainCardActive : ""}`}
                    onClick={() => {
                      handleSelectCadena(id);
                      setIsChainModalOpen(false);
                    }}
                  >
                    <div className={styles.chainCardLogo}>
                      {c.logo ? (
                        <img
                          src={
                            c.logo.startsWith("data:") || c.logo.startsWith("http")
                              ? c.logo
                              : `data:image/png;base64,${c.logo}`
                          }
                          alt={c.denominacion}
                        />
                      ) : (
                        <FiGrid size={28} />
                      )}
                    </div>
                    <div className={styles.chainCardModalInfo}>
                      <h3>{c.denominacion}</h3>
                      <p>{c.referencia || `ID: #${id}`}</p>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
        <div className={styles.modalFootCustom}>
          <Button variant="outlineBlue" size="sm" onClick={() => setIsChainModalOpen(false)}>
            Cancelar
          </Button>
        </div>
      </Modal>
    </div>
  );
}
