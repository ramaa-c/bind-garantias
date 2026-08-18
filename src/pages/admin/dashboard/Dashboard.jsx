import React, { useMemo, useState } from "react";
import { FiSearch, FiCheck, FiX, FiEye, FiFileText, FiBriefcase, FiTrendingUp, FiClock, FiCheckCircle, FiList, FiGlobe, FiGrid, FiChevronRight, FiRefreshCw } from "react-icons/fi";
import { toast } from "sonner";
import { Button } from "../../../components/ui/Button/Button";
import { Badge } from "../../../components/ui/Badge/Badge";
import { Modal } from "../../../components/ui/Modal/Modal";
import { SinResultados } from "../../../components/ui/SinResultados/SinResultados";
import { TarjetaMetrica } from "../../../components/ui/TarjetaMetrica/TarjetaMetrica";
import { SelectSimple } from "../../../components/ui";
import { SkeletonTable, Skeleton } from "../../../components/ui";
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
  { value: "desc", label: "Más Recientes (N° Desc)" },
  { value: "asc", label: "Más Antiguas (N° Asc)" },
];

export default function Dashboard() {
  const [busqueda, setBusqueda] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("todos");
  const [orden, setOrden] = useState("desc");
  const [selectedCadenaId, setSelectedCadenaId] = useState("all");

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
        actualizado: fchVigenciaHasta
          ? new Date(fchVigenciaHasta).toLocaleString("es-AR")
          : "Reciente",
        tags: ["Canal Activo", "Legajo validado"],
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

  const filtradas = solicitudesCanal
    .filter((s) => {
      const matchTexto =
        s.cliente.toLowerCase().includes(busqueda.toLowerCase()) ||
        s.cuit.includes(busqueda) ||
        s.id.includes(busqueda) ||
        s.usuario.toLowerCase().includes(busqueda.toLowerCase());

      if (filtroEstado === "todos") return matchTexto;
      return (
        matchTexto &&
        s.estado.toLowerCase().includes(filtroEstado.toLowerCase())
      );
    })
    .sort((a, b) => {
      if (orden === "desc") return b.id.localeCompare(a.id);
      return a.id.localeCompare(b.id);
    });

  const totalMonto = solicitudesCanal.reduce((acc, curr) => {
    const val = parseFloat(curr.monto.replace(/\./g, "")) || 0;
    return acc + (curr.moneda === "U$D" ? val * 1500 : val);
  }, 0);

  return (
    <div className={styles.dashboardContainer}>
      {/* Header and top KPI widgets */}
      <div className={styles.headerTitle}>
        <div>
          <h1>Gestión de Solicitudes</h1>
          <p>
            Procesá las solicitudes de línea de todas las cadenas de valor
            activas en el sistema.
          </p>
        </div>
      </div>

      <div className={styles.topSectionSplit}>
        {/* Left Column: Selected Chain Card */}
        <div className={styles.selectedChainCardContainer}>
          {loading ? (
            <div className={styles.chainSelectorCard}>
              <div className={styles.chainCardHeader}>
                <Skeleton width="48px" height="48px" radius="0.625rem" />
                <div style={{ flex: 1 }}>
                  <Skeleton height="1.1875rem" width="60%" style={{ marginBottom: '0.15rem' }} />
                  <Skeleton height="0.8rem" width="40%" style={{ marginTop: '0.2rem' }} />
                </div>
              </div>
              <div>
                <Skeleton height="0.8375rem" width="90%" style={{ marginBottom: '0.4rem' }} />
                <Skeleton height="0.8375rem" width="70%" />
              </div>
              <div className={styles.btnRow}>
                <Skeleton height="32px" width="120px" radius="6px" />
              </div>
            </div>
          ) : selectedCadenaId === "all" ? (
            <div className={`${styles.chainSelectorCard} ${styles.globalConsolidatedCard}`}>
              <div className={styles.chainCardHeader}>
                <div className={styles.globalIconWrapper}>
                  <FiGlobe size={24} />
                </div>
                <div>
                  <h2 className={styles.chainCardTitle}>Consolidado General</h2>
                  <p className={styles.chainCardSubtitle}>Todas las Cadenas de Valor</p>
                </div>
              </div>
              <p className={styles.chainCardDescription}>
                Supervisando solicitudes de todas las cadenas comerciales activas en el portal.
              </p>
              <Button
                onClick={() => {
                  setChainSearchQuery("");
                  setIsChainModalOpen(true);
                }}
                variant="blue"
                size="sm"
                className={styles.changeChainBtn}
              >
                Seleccionar Cadena <FiChevronRight />
              </Button>
            </div>
          ) : (
            <div className={styles.chainSelectorCard}>
              <div className={styles.chainCardHeader}>
                {selectedChain?.logo ? (
                  <div className={styles.selectedChainLogoWrapper}>
                    <img
                      src={
                        selectedChain.logo.startsWith("data:") || selectedChain.logo.startsWith("http")
                          ? selectedChain.logo
                          : `data:image/png;base64,${selectedChain.logo}`
                      }
                      alt={selectedChain.denominacion}
                      className={styles.selectedChainLogo}
                    />
                  </div>
                ) : (
                  <div className={styles.globalIconWrapper}>
                    <FiGrid size={24} />
                  </div>
                )}
                <div>
                  <h2 className={styles.chainCardTitle}>{selectedChain?.denominacion || "Cargando..."}</h2>
                  <p className={styles.chainCardSubtitle}>Referencia: {selectedChain?.referencia || "Sin Ref"}</p>
                </div>
              </div>
              <p className={styles.chainCardDescription}>
                Visualizando solicitudes de la cadena comercial seleccionada. ID: #{selectedChain?.cadenavalorid || selectedChain?.CadenaValorID}.
              </p>
              <div className={styles.btnRow}>
                <Button
                  onClick={() => {
                    setChainSearchQuery("");
                    setIsChainModalOpen(true);
                  }}
                  variant="outlineBlue"
                  size="sm"
                  className={styles.changeChainBtn}
                >
                  Cambiar Cadena <FiChevronRight />
                </Button>
                <Button
                  onClick={() => setSelectedCadenaId("all")}
                  variant="ghost"
                  size="sm"
                  className={styles.viewAllBtn}
                >
                  Ver Todas
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Compact Metrics Grid (2x2) */}
        <div className={styles.compactMetricsGrid}>
          <TarjetaMetrica
            className={styles.kpiCardCompact}
            labelClassName={styles.kpiLabelCompact}
            valueClassName={styles.kpiValueCompact}
            icon={FiBriefcase}
            label="Líneas"
            value={solicitudesCanal.length}
            isLoading={loading}
          />
          <TarjetaMetrica
            className={styles.kpiCardCompact}
            labelClassName={styles.kpiLabelCompact}
            valueClassName={styles.kpiValueCompact}
            icon={FiTrendingUp}
            label="Volumen"
            value={`$ ${(totalMonto / 1000000).toFixed(1)}M`}
            isLoading={loading}
          />
          <TarjetaMetrica
            className={styles.kpiCardCompact}
            labelClassName={styles.kpiLabelCompact}
            valueClassName={styles.kpiValueWarningCompact}
            icon={FiClock}
            label="Pendientes"
            value={solicitudesCanal.filter((s) => s.estado.includes("Pendiente")).length}
            isLoading={loading}
          />
          <TarjetaMetrica
            className={styles.kpiCardCompact}
            labelClassName={styles.kpiLabelCompact}
            valueClassName={styles.kpiValueSuccessCompact}
            icon={FiCheckCircle}
            label="Aprobadas"
            value={solicitudesCanal.filter((s) => s.estado === "Aprobada").length}
            isLoading={loading}
          />
        </div>
      </div>

      {/* Controls & Filter toolbar */}
      <div className={styles.toolbarCard}>
        <div className={styles.searchWrap}>
          <FiSearch className={styles.iconSearch} />
          <input
            type="text"
            placeholder="Buscar por Cliente, CUIT, Usuario o N° Solicitud..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className={styles.inputSearch}
          />
        </div>

        <div className={styles.filtersGroup}>
          <div className={styles.customSelectWrapper}>
            <SelectSimple
              label="Estado"
              value={filtroEstado}
              onChange={setFiltroEstado}
              options={opcionesEstado}
              placeholder="Estado"
              isSearchable={false}
              hideErrorSpace
              size="sm"
            />
          </div>

          <div className={styles.customSelectWrapper}>
            <SelectSimple
              label="Orden"
              value={orden}
              onChange={setOrden}
              options={opcionesOrden}
              placeholder="Orden"
              isSearchable={false}
              hideErrorSpace
              size="sm"
            />
          </div>
        </div>
      </div>

      {/* Main Operations List mimicking user screenshot */}
      <div className={styles.listWrapper}>
        {loading ? (
          <SkeletonTable rows={4} />
        ) : filtradas.length === 0 ? (
          <SinResultados
            className={styles.emptyState}
            message="No se encontraron solicitudes que coincidan con los criterios de búsqueda."
          />
        ) : (
          filtradas.map((item) => {
            const isAprobada = item.tipoLimiteEstadoId === ESTADO_APROBADA;
            const isRechazada = item.tipoLimiteEstadoId === ESTADO_RECHAZADA;
            const isCancelada = item.tipoLimiteEstadoId === ESTADO_CANCELADA;
            const isPendiente = !isAprobada && !isRechazada && !isCancelada;

            return (
              <div
                key={item.id}
                className={`${styles.itemRow} ${
                  isAprobada
                    ? styles.rowApproved
                    : isRechazada
                      ? styles.rowRejected
                      : isCancelada
                        ? styles.rowCancelled
                        : styles.rowPending
                }`}
              >
                <div className={styles.rowMain}>
                  {/* Left Column: Data Info */}
                  <div className={styles.infoCol}>
                    <div className={styles.rowHeaderInfo}>
                      <span className={styles.tipoText}>{item.tipo}</span>
                      <div className={styles.tagsWrap}>
                        {item.tags?.map((t) => {
                          const lowerT = t.toLowerCase();
                          let tagStyle = styles.tagBadge;
                          if (lowerT.includes("activo") || lowerT.includes("validado") || lowerT.includes("aceptados")) {
                            tagStyle = `${styles.tagBadge} ${styles.tagSuccess}`;
                          } else if (lowerT.includes("pendiente") || lowerT.includes("revisión")) {
                            tagStyle = `${styles.tagBadge} ${styles.tagWarning}`;
                          } else if (lowerT.includes("nuevo")) {
                            tagStyle = `${styles.tagBadge} ${styles.tagInfo}`;
                          }
                          
                          return (
                            <Badge key={t} className={tagStyle}>
                              {t}
                            </Badge>
                          );
                        })}
                      </div>
                    </div>

                    <h2 className={styles.solicitudHeading}>
                      Solicitud N°{item.id} por{" "}
                      <span className={styles.montoHighlight}>
                        {item.moneda || "$"} {item.monto}
                      </span>
                    </h2>

                    <div className={styles.detailsGrid}>
                      <div>
                        <span className={styles.detailLabel}>Cliente:</span>{" "}
                        <span className={styles.detailStrong}>
                          {item.cliente} ({item.cuit})
                        </span>
                      </div>
                      <div>
                        <span className={styles.detailLabel}>Usuario:</span>{" "}
                        <span className={styles.detailText}>
                          {item.usuario}
                        </span>
                      </div>
                      <div>
                        <span className={styles.detailLabel}>Estado:</span>{" "}
                        <Badge
                          className={`${styles.statusPill} ${
                            isAprobada
                              ? styles.pillApproved
                              : isRechazada
                                ? styles.pillRejected
                                : isCancelada
                                  ? styles.pillCancelled
                                  : styles.pillPending
                          }`}
                        >
                          {item.estado}
                        </Badge>
                      </div>
                      <div className={styles.fullSpan}>
                        <span className={styles.detailLabel}>
                          Acción pendiente:
                        </span>{" "}
                        <span className={styles.actionHighlight}>
                          {item.accionPendiente}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Actions & Timestamps */}
                  <div className={styles.actionCol}>
                    <div className={styles.timestamps}>
                      <div>Creado: {item.creado}</div>
                      <div>Actualizado: {item.actualizado}</div>
                    </div>

                    <div className={styles.buttonsWrap}>
                      {isRestricted ? (
                        <>
                          <Button
                            onClick={() => setSolicitudCda(item)}
                            variant="outlineBlue"
                            size="sm"
                            className={styles.btnCdaCustom}
                          >
                            <FiList /> CRITERIOS
                          </Button>
                          <Button
                            onClick={() => setSolicitudDetalle(item)}
                            variant="ghost"
                            size="sm"
                            className={styles.btnDetailCustom}
                          >
                            <FiEye /> VER DETALLE
                          </Button>
                        </>
                      ) : (
                        <>
                          {isPendiente && (
                            <div className={styles.quickDecisions}>
                              <Button
                                onClick={() => handleAceptar(item)}
                                variant="success"
                                size="xs"
                                className={styles.btnAcceptCustom}
                                title="Aprobar Solicitud"
                                disabled={actualizarEstadoMutation.isPending}
                              >
                                <FiCheck /> ACEPTAR
                              </Button>
                              <Button
                                onClick={() => handleRechazar(item)}
                                variant="danger"
                                size="xs"
                                className={styles.btnRejectCustom}
                                title="Rechazar Solicitud"
                                disabled={actualizarEstadoMutation.isPending}
                              >
                                <FiX /> RECHAZAR
                              </Button>
                            </div>
                          )}

                          {isAprobada && (
                            <Button
                              onClick={() => handleReintentarMigracion(item)}
                              variant="outlineBlue"
                              size="xs"
                              title="Reintentar la migración de esta línea a SGR+"
                              disabled={migrarLineaMutation.isPending}
                            >
                              <FiRefreshCw /> REINTENTAR MIGRACIÓN
                            </Button>
                          )}

                          <Button
                            onClick={() => setSolicitudDetalle(item)}
                            variant="ghost"
                            size="sm"
                            className={styles.btnDetailCustom}
                          >
                            <FiEye /> VER DETALLE
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

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
                setSelectedCadenaId("all");
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
                      setSelectedCadenaId(id);
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
