import React, { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { useForm, useWatch } from "react-hook-form";
import { FiPlus, FiSearch, FiClock, FiX, FiXCircle, FiSliders, FiChevronDown } from "react-icons/fi";
import { FaFileInvoiceDollar } from "react-icons/fa";
import { toast } from "sonner";
import {
  Alert,
  BotonVolver,
  Button,
  SelectSimple,
  SelectFechaSimple,
  Spinner,
  SkeletonTable,
} from "../../../components/ui";
import {
  TarjetaSolicitud,
  DetalleSolicitudModal,
  LegajoUniversalBar,
} from "../../../components/features";
import { FilaSolicitudHistorial } from "../../../components/features/solicitudes/FilaSolicitudHistorial/FilaSolicitudHistorial";
import ConfirmacionBorradorModal from "../../../components/features/shared/ConfirmacionBorradorModal/ConfirmacionBorradorModal";
import InformativoModal from "../../../components/features/shared/InformativoModal/InformativoModal";
import { ConfirmacionModal } from "../../../components/features/shared/ConfirmacionModal/ConfirmacionModal";
import { HelpDrawer } from "../../../components/layout/Client/HelpDrawer/HelpDrawer";
import { useObtenerLimitesSocio, useObtenerSolicitudesEnProceso } from "../../../hooks/useSolicitudes";
import { useActualizarLimiteSocio } from "../../../hooks/useLinea";
import { useVerificarHabilitacionNuevaOperacion } from "../../../hooks/useVerificarHabilitacionSolicitudes";
import { solicitudesService } from "../../../services/solicitudesService";
import { useEmpresaActiva } from "../../../hooks/useEmpresaActiva";
import { useChannel } from "../../../context/useChannel";
import { mensajeNegocio } from "../../../utils/mensajesError";
import { useTiposProducto } from "../../../hooks/useCatalogos";
import { useAccesoDashboardCliente } from "../../../hooks/useAccesoDashboardCliente";
import { etiquetaFamiliaDeLinea } from "../../../utils/familiaLinea";
import { importeOriginalDeLimite, simboloMoneda } from "../../../utils/monedaUtils";
import {
  ESTADO_PENDIENTE,
  ESTADO_CANCELADA,
  ESTADO_RECHAZADA,
  estadoTextoDesde,
  esEstadoEnCurso,
  MOTIVO_CANCELACION_SOCIO,
  MENSAJE_SOLICITUD_OTRA_PLATAFORMA,
  procesosVigentes,
  procesosHuerfanosPorRechazoAutomatico,
} from "../../../utils/estadoLimiteSocio";

import styles from "./Solicitudes.module.css";



const opcionesEstado = [
  { value: "todos", label: "Todos los estados" },
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
  estado: "todos",
  orden: "desc",
  fechaDesde: "",
  fechaHasta: "",
};

// SelectFechaSimple entrega el valor ya como ISO completo (no un simple
// "yyyy-mm-dd"), así que para el límite superior del rango hay que llevar la
// hora local al final del día explícitamente en vez de asumir un formato.
const finDelDia = (fecha) => {
  const d = new Date(fecha);
  d.setHours(23, 59, 59, 999);
  return d;
};

// Extrae la parte numérica del id propio del item para ordenar: id más
// grande = más reciente.
const idNumerico = (item) => parseInt(String(item.id), 10) || 0;

const hasMeaningfulData = (dataString) => {
  if (!dataString) return false;
  try {
    const data = JSON.parse(dataString);
    if (typeof data !== "object" || data === null) return false;

    // Campos de negocio reales donde el usuario ingresa información
    const meaningfulKeys = [
      "cuit",
      "razonSocial",
      "direccion",
      "provincia",
      "provinciaid",
      "localidad",
      "celular",
      "monto",
      "plazo",
      "sociedadBolsa",
      "numeroCuentaBolsa",
      "emailFacturacion",
    ];

    // Verificar si alguno de los campos de texto/número/select de negocio tiene valor
    const hasMeaningfulField = meaningfulKeys.some((key) => {
      const value = data[key];
      return value !== "" && value !== null && value !== undefined && value !== false;
    });

    if (hasMeaningfulField) return true;

    // Verificar si las listas de socios o representantes tienen elementos
    const listKeys = ["representantes", "socios"];
    const hasMeaningfulList = listKeys.some((key) => {
      const value = data[key];
      return Array.isArray(value) && value.length > 0;
    });

    return hasMeaningfulList;
  } catch {
    return false;
  }
};

export default function Solicitudes() {
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const { basePath } = useChannel();

  const { control, register, setValue, reset } = useForm({
    defaultValues: FILTROS_POR_DEFECTO,
  });
  const filtros = useWatch({ control });

  const fechaDesdeDate = filtros.fechaDesde ? new Date(filtros.fechaDesde) : undefined;
  const fechaHastaDate = filtros.fechaHasta ? new Date(filtros.fechaHasta) : undefined;

  const hayFiltrosActivos =
    !!filtros.busqueda ||
    (filtros.estado && filtros.estado !== "todos") ||
    (filtros.orden && filtros.orden !== "desc") ||
    !!filtros.fechaDesde ||
    !!filtros.fechaHasta;

  const handleLimpiarFiltros = () => reset(FILTROS_POR_DEFECTO);

  const [filtrosMovilAbiertos, setFiltrosMovilAbiertos] = useState(false);
  const cantidadFiltrosActivos = [
    filtros.estado && filtros.estado !== "todos",
    filtros.orden && filtros.orden !== "desc",
    !!filtros.fechaDesde,
    !!filtros.fechaHasta,
  ].filter(Boolean).length;

  const [flujoPendiente, setFlujoPendiente] = useState(null);
  const [draftKeyPendiente, setDraftKeyPendiente] = useState(null);
  const [solicitudSeleccionada, setSolicitudSeleccionada] = useState(null);
  const [modalPendienteOpen, setModalPendienteOpen] = useState(false);
  const [modalNuevaOperacionBloqueada, setModalNuevaOperacionBloqueada] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);

  const {
    habilitada: nuevaOperacionHabilitada,
    motivo: motivoNuevaOperacionBloqueada,
    cuitVerificado: cuitNuevaOperacionVerificado,
  } = useVerificarHabilitacionNuevaOperacion();

  const { cuitActivo, nombreEmpresa, socioIdActivo } = useEmpresaActiva();
  const socioIdFinal = socioIdActivo || 0;

  const { data: solicitudesReal, isLoading: cargandoSolicitudes } =
    useObtenerLimitesSocio(socioIdFinal);
  const { data: solicitudesEnProceso, isLoading: cargandoProceso } =
    useObtenerSolicitudesEnProceso(cuitActivo);
  const { data: tiposLimiteGlobal, isLoading: cargandoTiposLimite } = useTiposProducto();

  const isLoadingData = cargandoSolicitudes || cargandoProceso || cargandoTiposLimite;

  const { solicitudEnOtraPlataforma, cargando: cargandoAccesoDashboard } = useAccesoDashboardCliente();
  const [modalOtraPlataformaOpen, setModalOtraPlataformaOpen] = useState(false);
  const [avisoOtraPlataformaCerrado, setAvisoOtraPlataformaCerrado] = useState(false);
  const claveAvisoOtraPlataforma = `bind_aviso_otra_plataforma_${cuitActivo || ""}`;

  const avisoOtraPlataformaYaVisto = (() => {
    try {
      return sessionStorage.getItem(claveAvisoOtraPlataforma) === "1";
    } catch {
      return false;
    }
  })();

  const mostrarModalOtraPlataforma =
    modalOtraPlataformaOpen ||
    (solicitudEnOtraPlataforma &&
      !!cuitActivo &&
      !avisoOtraPlataformaCerrado &&
      !avisoOtraPlataformaYaVisto);

  const cerrarModalOtraPlataforma = () => {
    try {
      sessionStorage.setItem(claveAvisoOtraPlataforma, "1");
    } catch {
      // no-op
    }
    setAvisoOtraPlataformaCerrado(true);
    setModalOtraPlataformaOpen(false);
  };

  const nombreEmpresaActiva = nombreEmpresa || "Empresa Demo S.A.";

  useEffect(() => {
    const handler = () => setIsHelpOpen((prev) => !prev);
    document.addEventListener("bindHelp:toggle", handler);
    return () => document.removeEventListener("bindHelp:toggle", handler);
  }, []);

  // Se bloquea el botón "Nueva Operación" (no el submit al final del
  // wizard) apenas exista CUALQUIER solicitud en curso — de cualquier línea,
  // cadena o plataforma. Es más estricto que la regla real del backend (que
  // permite convivir varias siempre que no repitan TipoLimiteID+CadenaValorID,
  // ver AltaOperacion.jsx), pero evita que el socio entre a todo el wizard
  // para recién enterarse al final de que esa línea puntual ya tenía una
  // pendiente. mirar solicitudesEnProceso (no solo TipoLimiteSocio) cubre
  // además el caso borde de una SolicitudEnProceso que ya se creó pero cuyo
  // TipoLimiteSocio todavía no llegó a persistirse (falla parcial en
  // AltaOperacion.jsx).
  const tieneSolicitudPendiente = useMemo(() => {
    const hasRealPendiente =
      Array.isArray(solicitudesReal) && solicitudesReal.some((s) => esEstadoEnCurso(s.tipolimiteestadoid));
    const hasProcesoPendiente =
      procesosVigentes(solicitudesEnProceso, solicitudesReal).length > 0;
    return hasRealPendiente || hasProcesoPendiente;
  }, [solicitudesReal, solicitudesEnProceso]);

  const procesosHuerfanos = useMemo(
    () => procesosHuerfanosPorRechazoAutomatico(solicitudesEnProceso, solicitudesReal),
    [solicitudesEnProceso, solicitudesReal],
  );

  const huerfanosIntentadosRef = useRef(new Set());

  useEffect(() => {
    const claveProceso = (p) => `${cuitActivo}-${p.tipolimiteid}-${p.cadenavalorid}`;
    const pendientes = procesosHuerfanos.filter(
      (p) => !huerfanosIntentadosRef.current.has(claveProceso(p)),
    );
    if (!cuitActivo || pendientes.length === 0) return;
    pendientes.forEach((p) => huerfanosIntentadosRef.current.add(claveProceso(p)));

    const cerrarHuerfanos = async () => {
      for (const proceso of pendientes) {
        try {
          await solicitudesService.sincronizarEstadoSolicitudEnProcesoPorClave(
            cuitActivo,
            proceso.tipolimiteid,
            proceso.cadenavalorid,
            ESTADO_RECHAZADA,
          );
        } catch (syncErr) {
          console.error(
            "[Solicitudes] No se pudo cerrar la SolicitudEnProceso de un rechazo automático:",
            syncErr,
          );
        }
      }
      queryClient.invalidateQueries({ queryKey: ["solicitudes", "en-proceso"] });
    };
    cerrarHuerfanos();
  }, [cuitActivo, procesosHuerfanos, queryClient]);

  // SolicitudEnProceso ya no se muestra acá: pasó a ser una tabla de control
  // interno entre plataformas, sin ninguna fila propia en pantalla (decisión
  // confirmada el 2026-09-15) - lo que el socio ve es directamente
  // TipoLimiteSocio, la única fuente real de sus solicitudes.
  const listaSolicitudes = useMemo(() => {
    return (solicitudesReal || []).map((s) => {
      const tipoLimiteEstadoId = Number(s.tipolimiteestadoid ?? ESTADO_PENDIENTE);
      return {
        id: s.tipolimitesocioid?.toString() || "",
        tipo: etiquetaFamiliaDeLinea(tiposLimiteGlobal, s.tipolimiteid),
        lineaNombre:
          tiposLimiteGlobal?.raw?.find((t) => Number(t.tipolimiteid) === Number(s.tipolimiteid))
            ?.descripcion || "",
        monto: new Intl.NumberFormat("es-AR").format(importeOriginalDeLimite(s)),
        moneda: simboloMoneda(s.monedaid),
        estado: estadoTextoDesde(tipoLimiteEstadoId),
        tipoLimiteEstadoId,
        fecha: s.fchvigenciadesde ? new Date(s.fchvigenciadesde).toLocaleDateString("es-AR") : "Hoy",
        fechaISO: s.fchvigenciadesde || null,
        socioid: s.socioid || socioIdFinal,
        cuit: cuitActivo,
        raw: s,
      };
    });
  }, [solicitudesReal, socioIdFinal, cuitActivo, tiposLimiteGlobal]);

  const listaFiltrada = useMemo(() => {
    const texto = (filtros.busqueda || "").trim().toLowerCase();
    const estadoFiltro = filtros.estado;
    const desde = filtros.fechaDesde ? new Date(filtros.fechaDesde) : null;
    const hasta = filtros.fechaHasta ? finDelDia(filtros.fechaHasta) : null;

    const filtradas = listaSolicitudes.filter((item) => {
      if (texto) {
        const matchTexto =
          (item.cuit || "").toLowerCase().includes(texto) ||
          (item.id || "").toLowerCase().includes(texto) ||
          (item.tipo || "").toLowerCase().includes(texto);
        if (!matchTexto) return false;
      }

      if (estadoFiltro && estadoFiltro !== "todos") {
        if ((item.estado || "").toLowerCase() !== estadoFiltro) return false;
      }

      if (desde || hasta) {
        // Sin fecha real no hay forma de ubicarla en el rango elegido, así
        // que si están filtrando por fecha la excluimos en vez de mostrarla
        // de todos modos.
        if (!item.fechaISO) return false;
        const fechaItem = new Date(item.fechaISO);
        if (desde && fechaItem < desde) return false;
        if (hasta && fechaItem > hasta) return false;
      }

      return true;
    });

    return filtradas.sort((a, b) => {
      const diff = idNumerico(b) - idNumerico(a);
      return filtros.orden === "asc" ? -diff : diff;
    });
  }, [listaSolicitudes, filtros.busqueda, filtros.estado, filtros.fechaDesde, filtros.fechaHasta, filtros.orden]);

  const solicitudesEnCurso = useMemo(
    () =>
      listaSolicitudes
        .filter((s) => esEstadoEnCurso(s.tipoLimiteEstadoId))
        .sort((a, b) => idNumerico(b) - idNumerico(a)),
    [listaSolicitudes],
  );

  const gruposHistorial = useMemo(() => {
    const grupos = [];
    const porClave = new Map();
    listaFiltrada
      .filter((s) => !esEstadoEnCurso(s.tipoLimiteEstadoId))
      .forEach((s) => {
        const fecha = s.fechaISO ? new Date(s.fechaISO) : null;
        const valida = fecha && !Number.isNaN(fecha.getTime());
        const clave = valida ? `${fecha.getFullYear()}-${fecha.getMonth()}` : "sin-fecha";
        if (!porClave.has(clave)) {
          const mes = valida
            ? new Intl.DateTimeFormat("es-AR", { month: "long", year: "numeric" }).format(fecha)
            : "Sin fecha";
          const grupo = { clave, titulo: mes.charAt(0).toUpperCase() + mes.slice(1).replace(" de ", " "), items: [] };
          porClave.set(clave, grupo);
          grupos.push(grupo);
        }
        porClave.get(clave).items.push(s);
      });
    return grupos;
  }, [listaFiltrada]);

  const [solicitudACancelar, setSolicitudACancelar] = useState(null);
  const actualizarLimiteMutation = useActualizarLimiteSocio();

  const handleConfirmarCancelacion = async () => {
    if (!solicitudACancelar?.raw) return;
    try {
      await actualizarLimiteMutation.mutateAsync({
        ...solicitudACancelar.raw,
        tipolimiteestadoid: ESTADO_CANCELADA,
        observaciones: MOTIVO_CANCELACION_SOCIO,
      });

      // Igual que en Dashboard.jsx (admin): todo cambio de estado en
      // TipoLimiteSocio se refleja también en SolicitudEnProceso — ambas
      // tablas usan literalmente el mismo catálogo (2026-08-18), así que no
      // hace falta traducir el valor. TipoLimiteSocio.SolicitudID viaja
      // siempre en null, así que la fila se ubica por (Cuit, TipoLimiteID,
      // CadenaValorID) en vez de por ID. No bloquea la cancelación si falla,
      // queda solo logueado — es una sincronización secundaria.
      const tipoLimiteId =
        solicitudACancelar.raw?.tipolimiteid ?? solicitudACancelar.raw?.TipoLimiteID;
      const cadenaValorId =
        solicitudACancelar.raw?.cadenavalorid ?? solicitudACancelar.raw?.CadenaValorID;
      if (tipoLimiteId && cadenaValorId && cuitActivo) {
        solicitudesService
          .sincronizarEstadoSolicitudEnProcesoPorClave(cuitActivo, tipoLimiteId, cadenaValorId, ESTADO_CANCELADA)
          .catch((syncErr) => {
            console.error(
              `[Solicitudes] No se pudo sincronizar el estado en SolicitudEnProceso para la solicitud N°${solicitudACancelar.id}:`,
              syncErr,
            );
          })
          .finally(() => {
            // Sin esto, useObtenerSolicitudesEnProceso (staleTime 5min) sigue
            // devolviendo la fila ya sincronizada/borrada del lado del
            // backend, y tieneSolicitudPendiente sigue bloqueando "Nueva
            // Operación" aunque la cancelación haya funcionado (reportado en
            // vivo, 2026-09-15).
            queryClient.invalidateQueries({ queryKey: ["solicitudes", "en-proceso"] });
          });
      }

      toast.success(`Solicitud N°${solicitudACancelar.id} cancelada`, {
        description: "Ya podés iniciar una nueva operación.",
      });
      setSolicitudACancelar(null);
    } catch (err) {
      toast.error("No se pudo cancelar la solicitud: " + mensajeNegocio(err, err.message));
    }
  };

  useEffect(() => {
    if (location.state?.nuevaSolicitud) {
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  const handleNuevaOperacion = async (ruta, draftKey) => {
    // Esta pantalla solo es alcanzable cuando la cadena tiene línea activa
    // (ver OnboardingGuard/useAccesoDashboardCliente) — en ese caso, cargar
    // una solicitud no depende de tener legajo/documentación completos: es
    // justamente el primer paso del flujo, antes de pedirle al cliente más
    // datos que capaz no hacían falta si el CDA de la línea rechaza.
    if (solicitudEnOtraPlataforma) {
      setModalOtraPlataformaOpen(true);
      return;
    }

    if (tieneSolicitudPendiente) {
      setModalPendienteOpen(true);
      return;
    }

    // SGRPlusCore/ValidarUtilizacion + AptaNuevaLinea: ya no bloquean la
    // pantalla entera (ver useVerificarHabilitacionSolicitudes), solo el
    // inicio de una operación nueva.
    if (!nuevaOperacionHabilitada) {
      setModalNuevaOperacionBloqueada(true);
      return;
    }

    const dataString = sessionStorage.getItem(`${draftKey}_data`);
    const pasoString = sessionStorage.getItem(`${draftKey}_paso`);
    const currentPaso = parseInt(pasoString, 10) || 1;

    const hasMeaningful = hasMeaningfulData(dataString);
    const hasAdvancedStep = currentPaso > 1;

    if (hasAdvancedStep || hasMeaningful) {
      setFlujoPendiente(ruta);
      setDraftKeyPendiente(draftKey);
    } else {
      sessionStorage.removeItem(`${draftKey}_data`);
      sessionStorage.removeItem(`${draftKey}_paso`);
      sessionStorage.removeItem(`${draftKey}_lista`);
      navigate(ruta);
    }
  };

  // Vendor: "Iniciar operación" desde su panel entra a la empresa y pide
  // abrir el alta acá, con todas las validaciones de siempre. Se dispara una
  // sola vez y recién cuando los datos y la habilitación de ESTA empresa
  // terminaron de cargar.
  const iniciarOperacionPedida = !!location.state?.iniciarOperacion;
  const iniciarOperacionAtendidaRef = useRef(false);
  const listoParaIniciarOperacion =
    iniciarOperacionPedida &&
    !!cuitActivo &&
    !isLoadingData &&
    !cargandoAccesoDashboard &&
    cuitNuevaOperacionVerificado === cuitActivo;

  useEffect(() => {
    if (!listoParaIniciarOperacion || iniciarOperacionAtendidaRef.current) return;
    iniciarOperacionAtendidaRef.current = true;
    navigate(location.pathname, { replace: true, state: null });
    handleNuevaOperacion(`${basePath}/alta-operacion`, "draft_alta_operacion");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [listoParaIniciarOperacion]);

  const handleConfirmStartNew = () => {
    if (draftKeyPendiente) {
      sessionStorage.removeItem(`${draftKeyPendiente}_data`);
      sessionStorage.removeItem(`${draftKeyPendiente}_paso`);
      sessionStorage.removeItem(`${draftKeyPendiente}_lista`);
    }
    if (flujoPendiente) navigate(flujoPendiente);
    setFlujoPendiente(null);
    setDraftKeyPendiente(null);
  };

  const handleCloseContinueDraft = () => {
    if (flujoPendiente) navigate(flujoPendiente);
    setFlujoPendiente(null);
    setDraftKeyPendiente(null);
  };

  const handleCloseModalOnly = () => {
    setFlujoPendiente(null);
    setDraftKeyPendiente(null);
  };

  return (
    <div className={styles.pageContainer}>
      {/* HEADER COMPACTO */}
      <header className={styles.compactHeader}>
        <div className={styles.headerLeft}>
          <div className={styles.iconCircleSmall}>
            <FaFileInvoiceDollar />
          </div>
          <div className={styles.titleWrapper}>
            <h1 className={styles.title}>Mis solicitudes</h1>
            <p className={styles.subtitle}>Seguí el estado de tus operaciones y cargá una nueva.</p>
          </div>
        </div>

        <Button
          variant="primary"
          size="sm"
          onClick={() =>
            handleNuevaOperacion(`${basePath}/alta-operacion`, "draft_alta_operacion")
          }
          className={styles.btnNuevaOp}
        >
          <><FiPlus style={{ marginRight: "0.5rem" }} /> NUEVA OPERACIÓN</>
        </Button>
      </header>

      {/* CUERPO PRINCIPAL */}
      <main className={styles.main}>
        {solicitudEnOtraPlataforma ? (
          <Alert variant="warning" icon={FiClock} className={styles.avisoOtraPlataforma}>
            {MENSAJE_SOLICITUD_OTRA_PLATAFORMA} Si necesitás ayuda, escribinos a{" "}
            <a href="mailto:soporte@bind.com.ar" className={styles.avisoLink}>
              soporte@bind.com.ar
            </a>
            .
          </Alert>
        ) : (
          <LegajoUniversalBar context="solicitudes" />
        )}
        
        <div className={styles.listContainer}>
          {isLoadingData ? (
            <SkeletonTable rows={3} />
          ) : listaSolicitudes.length === 0 ? (
            <div className={styles.emptyState}>
              <p>Todavía no tenés solicitudes. Cargá la primera con "Nueva operación".</p>
            </div>
          ) : (
            <>
              {solicitudesEnCurso.length > 0 && (
                <section className={styles.seccion} aria-labelledby="solicitudes-en-curso">
                  <h2 id="solicitudes-en-curso" className={`${styles.seccionTitulo} ${styles.seccionTituloEnCurso}`}>
                    En curso
                  </h2>
                  {solicitudesEnCurso.map((item) => (
                    <TarjetaSolicitud
                      key={item.id}
                      solicitud={item}
                      onVerDetalle={setSolicitudSeleccionada}
                      acciones={
                        item.raw
                          ? [
                              {
                                label: "Cancelar",
                                variant: "danger",
                                onClick: () => setSolicitudACancelar(item),
                              },
                            ]
                          : undefined
                      }
                    />
                  ))}
                </section>
              )}

              <section className={styles.seccion} aria-labelledby="solicitudes-historial">
                <div className={styles.historialCabecera}>
                  <h2 id="solicitudes-historial" className={styles.seccionTitulo}>
                    Historial
                  </h2>
                  <div className={styles.filterBar}>
                    <div className={styles.searchBox}>
                      <FiSearch className={styles.searchIcon} />
                      <input
                        type="text"
                        placeholder="Buscar por N° de solicitud o CUIT..."
                        className={styles.searchInput}
                        {...register("busqueda")}
                      />
                    </div>

                    <button
                      type="button"
                      className={`${styles.filtrosToggle} ${filtrosMovilAbiertos ? styles.filtrosToggleActivo : ""}`}
                      onClick={() => setFiltrosMovilAbiertos((abiertos) => !abiertos)}
                      aria-expanded={filtrosMovilAbiertos}
                      aria-controls="solicitudes-filtros"
                    >
                      <FiSliders aria-hidden="true" />
                      Filtros
                      {cantidadFiltrosActivos > 0 && (
                        <span className={styles.filtrosBadge}>{cantidadFiltrosActivos}</span>
                      )}
                      <FiChevronDown
                        className={`${styles.filtrosChevron} ${filtrosMovilAbiertos ? styles.filtrosChevronAbierto : ""}`}
                        aria-hidden="true"
                      />
                    </button>

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

                <div
                  id="solicitudes-filtros"
                  className={`${styles.filterFieldsRow} ${filtrosMovilAbiertos ? styles.filterFieldsRowAbierta : ""}`}
                >
                  <SelectFechaSimple
                    label="Desde"
                    value={filtros.fechaDesde}
                    onChange={(val) => setValue("fechaDesde", val, { shouldDirty: true })}
                    disableFuture
                    maxDate={fechaHastaDate}
                    variant="client"
                    compact
                    hideErrorSpace
                    className={styles.filterField}
                  />
                  <SelectFechaSimple
                    label="Hasta"
                    value={filtros.fechaHasta}
                    onChange={(val) => setValue("fechaHasta", val, { shouldDirty: true })}
                    disableFuture
                    minDate={fechaDesdeDate}
                    variant="client"
                    compact
                    hideErrorSpace
                    className={styles.filterField}
                  />
                  <SelectSimple
                    name="estado"
                    control={control}
                    label="Estado"
                    options={opcionesEstado}
                    variant="client"
                    compact
                    hideErrorSpace
                    className={styles.filterField}
                  />
                  <SelectSimple
                    name="orden"
                    control={control}
                    label="Orden"
                    options={opcionesOrden}
                    variant="client"
                    compact
                    hideErrorSpace
                    className={styles.filterField}
                  />
                </div>


                {gruposHistorial.length === 0 ? (
                  <div className={styles.historialVacio}>
                    {hayFiltrosActivos
                      ? "No encontramos solicitudes con esos filtros."
                      : "Cuando una solicitud se resuelva, la vas a ver acá."}
                  </div>
                ) : (
                  gruposHistorial.map((grupo) => (
                    <div key={grupo.clave} className={styles.grupoMes}>
                      <h3 className={styles.mesTitulo}>{grupo.titulo}</h3>
                      {grupo.items.map((item) => (
                        <FilaSolicitudHistorial
                          key={item.id}
                          solicitud={item}
                          onVerDetalle={setSolicitudSeleccionada}
                        />
                      ))}
                    </div>
                  ))
                )}
              </section>
            </>
          )}
        </div>
      </main>

      <div className={styles.nuevaOpMovil} data-cta-fijo>
        <Button
          variant="primary"
          size="md"
          onClick={() => handleNuevaOperacion(`${basePath}/alta-operacion`, "draft_alta_operacion")}
          className={styles.nuevaOpMovilBoton}
        >
          <FiPlus /> Nueva operación
        </Button>
      </div>

      <ConfirmacionBorradorModal
        isOpen={!!flujoPendiente}
        onClose={handleCloseModalOnly}
        onConfirm={handleConfirmStartNew}
        onContinueBorrador={handleCloseContinueDraft}
      />

      <DetalleSolicitudModal
        isOpen={!!solicitudSeleccionada}
        onClose={() => setSolicitudSeleccionada(null)}
        solicitud={solicitudSeleccionada}
        nombreEmpresa={nombreEmpresaActiva}
      />

      <ConfirmacionModal
        isOpen={!!solicitudACancelar}
        onClose={() => setSolicitudACancelar(null)}
        onConfirm={handleConfirmarCancelacion}
        isLoading={actualizarLimiteMutation.isPending}
        tone="danger"
        titulo={`¿Cancelar la Solicitud N° ${solicitudACancelar?.id ?? ""}?`}
        mensaje="La solicitud se cierra y no se puede retomar. Una vez cancelada, vas a poder iniciar una nueva operación."
        icono={<FiXCircle />}
        confirmText="Sí, cancelar"
        cancelText="Volver"
      />

      <InformativoModal
        isOpen={modalPendienteOpen}
        onClose={() => setModalPendienteOpen(false)}
        icon={<FiClock />}
        variant="warning"
        title="Solicitud en proceso"
        description="Ya tenés una solicitud de línea en análisis. Debés esperar a que se valide o cancelarla antes de crear una nueva."
        buttonText="Entendido"
      />

      <InformativoModal
        isOpen={mostrarModalOtraPlataforma}
        onClose={cerrarModalOtraPlataforma}
        icon={<FiClock />}
        variant="warning"
        title="Tenés una solicitud en curso"
        description={`${MENSAJE_SOLICITUD_OTRA_PLATAFORMA} Si necesitás ayuda, escribinos a soporte@bind.com.ar.`}
        buttonText="Entendido"
        maxWidth="30rem"
      />

      <InformativoModal
        isOpen={modalNuevaOperacionBloqueada}
        onClose={() => setModalNuevaOperacionBloqueada(false)}
        icon={<FiClock />}
        variant="warning"
        title="No podés iniciar una operación nueva"
        description={
          motivoNuevaOperacionBloqueada ||
          "No podés iniciar una nueva operación en este momento."
        }
        buttonText="Entendido"
      />

      <HelpDrawer
        isOpen={isHelpOpen}
        onClose={() => setIsHelpOpen(false)}
        contexto="inicio"
      />
    </div>
  );
}
