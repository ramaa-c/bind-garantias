import React, { useState, useEffect, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useForm, useWatch } from "react-hook-form";
import { FiPlus, FiSearch, FiClock, FiX } from "react-icons/fi";
import { FaFileInvoiceDollar } from "react-icons/fa";
import { toast } from "sonner";
import {
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
import ConfirmacionBorradorModal from "../../../components/features/shared/ConfirmacionBorradorModal/ConfirmacionBorradorModal";
import InformativoModal from "../../../components/features/shared/InformativoModal/InformativoModal";
import { ConfirmacionModal } from "../../../components/features/shared/ConfirmacionModal/ConfirmacionModal";
import { HelpDrawer } from "../../../components/layout/Client/HelpDrawer/HelpDrawer";
import { useValidacionLegajo } from "../../../hooks/useValidacionLegajo";
import { useObtenerLimitesSocio, useObtenerSolicitudesEnProceso } from "../../../hooks/useSolicitudes";
import { useActualizarLimiteSocio } from "../../../hooks/useLinea";
import { useVerificarHabilitacionNuevaOperacion } from "../../../hooks/useVerificarHabilitacionSolicitudes";
import { solicitudesService } from "../../../services/solicitudesService";
import { useEmpresaActiva } from "../../../hooks/useEmpresaActiva";
import { useChannel } from "../../../context/ChannelContext";
import {
  ESTADO_PENDIENTE,
  ESTADO_CANCELADA,
  estadoTextoDesde,
  TERCERO_VIA_PLATAFORMA_PROPIA,
} from "../../../utils/estadoLimiteSocio";

import styles from "./Solicitudes.module.css";



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

  const [flujoPendiente, setFlujoPendiente] = useState(null);
  const [draftKeyPendiente, setDraftKeyPendiente] = useState(null);
  const [solicitudSeleccionada, setSolicitudSeleccionada] = useState(null);
  const [modalPendienteOpen, setModalPendienteOpen] = useState(false);
  const [modalNuevaOperacionBloqueada, setModalNuevaOperacionBloqueada] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);

  const { isValid } = useValidacionLegajo();
  const {
    habilitada: nuevaOperacionHabilitada,
    motivo: motivoNuevaOperacionBloqueada,
  } = useVerificarHabilitacionNuevaOperacion();

  const { cuitActivo, nombreEmpresa, socioIdActivo } = useEmpresaActiva();
  const socioIdFinal = socioIdActivo || 0;

  const { data: solicitudesReal, isLoading: cargandoSolicitudes } =
    useObtenerLimitesSocio(socioIdFinal);
  const { data: solicitudesEnProceso, isLoading: cargandoProceso } =
    useObtenerSolicitudesEnProceso(cuitActivo);

  const isLoadingData = cargandoSolicitudes || cargandoProceso;

  const nombreEmpresaActiva = nombreEmpresa || "Empresa Demo S.A.";

  useEffect(() => {
    const handler = () => setIsHelpOpen((prev) => !prev);
    document.addEventListener("bindHelp:toggle", handler);
    return () => document.removeEventListener("bindHelp:toggle", handler);
  }, []);

  const tieneSolicitudPendiente = useMemo(() => {
    const hasRealPendiente = Array.isArray(solicitudesReal) && solicitudesReal.some(s =>
      Number(s.tipolimiteestadoid ?? ESTADO_PENDIENTE) === ESTADO_PENDIENTE
    );
    // Igual que en AltaOperacion.jsx: el bloqueo es por PLATAFORMA de origen
    // (TerceroViaID), no por la simple existencia de una SolicitudEnProceso.
    // Dentro de NUESTRA plataforma (4000000) un socio puede tener varias en
    // curso a la vez; lo único que bloquea es una en curso en OTRA
    // plataforma (confirmado con Victor el 2026-08-13). Ya no hace falta
    // mirar EstadoSolicitud: el backend borra la fila apenas deja de estar
    // en Inicial o EnProceso (confirmado el 2026-08-18), así que su sola
    // presencia ya implica que sigue activa.
    const hasProcesoPendiente =
      Array.isArray(solicitudesEnProceso) &&
      solicitudesEnProceso.some(
        (s) => Number(s.terceroviaid) !== TERCERO_VIA_PLATAFORMA_PROPIA,
      );
    return hasRealPendiente || hasProcesoPendiente;
  }, [solicitudesReal, solicitudesEnProceso]);

  const listaSolicitudes = useMemo(() => {
    const reales = (solicitudesReal || [])
      .map(s => {
        const tipoLimiteEstadoId = Number(s.tipolimiteestadoid ?? ESTADO_PENDIENTE);
        return {
          id: s.tipolimitesocioid?.toString() || "",
          tipo: s.tipolimiteid === 1 ? "Cheque" : s.tipolimiteid === 2 ? "Préstamo" : "Pagaré",
          monto: s.importelimite ? new Intl.NumberFormat("es-AR").format(s.importelimite) : "0",
          moneda: s.monedaid === 5000 ? "$" : s.monedaid === 2 ? "U$D" : s.monedaid === 10 ? "UVAS" : s.monedaid === 500 ? "€" : "$",
          estado: estadoTextoDesde(tipoLimiteEstadoId),
          tipoLimiteEstadoId,
          fecha: s.fchvigenciadesde ? new Date(s.fchvigenciadesde).toLocaleDateString("es-AR") : "Hoy",
          fechaISO: s.fchvigenciadesde || null,
          socioid: s.socioid || socioIdFinal,
          cuit: cuitActivo,
          isReal: true,
          solicitudid: s.solicitudid,
          raw: s,
        };
      });

    const pendientes = (solicitudesEnProceso || [])
      .filter(sp => !reales.some(r => Number(r.solicitudid) === sp.solicitudenprocesoid))
      .map(sp => ({
        id: `sp-${sp.solicitudenprocesoid}`,
        tipo: sp.tipolimiteid === 1 ? "Cheque" : sp.tipolimiteid === 2 ? "Préstamo" : "Pagaré",
        monto: sp.importe ? new Intl.NumberFormat("es-AR").format(sp.importe) : "0",
        moneda: sp.monedaid === 5000 ? "$" : sp.monedaid === 2 ? "U$D" : sp.monedaid === 10 ? "UVAS" : sp.monedaid === 500 ? "€" : "$",
        estado: "Pendiente",
        fecha: sp.fechacarga ? new Date(sp.fechacarga).toLocaleDateString("es-AR") : "Hoy",
        fechaISO: sp.fechacarga || null,
        socioid: socioIdFinal,
        cuit: cuitActivo,
        isReal: true,
        solicitudid: sp.solicitudenprocesoid,
      }));

    return [...reales, ...pendientes].sort((a, b) => (Number(b.solicitudid) || 0) - (Number(a.solicitudid) || 0));
  }, [solicitudesReal, solicitudesEnProceso, socioIdFinal, cuitActivo]);

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
      const diff = (Number(b.solicitudid) || 0) - (Number(a.solicitudid) || 0);
      return filtros.orden === "asc" ? -diff : diff;
    });
  }, [listaSolicitudes, filtros.busqueda, filtros.estado, filtros.fechaDesde, filtros.fechaHasta, filtros.orden]);

  const [solicitudACancelar, setSolicitudACancelar] = useState(null);
  const actualizarLimiteMutation = useActualizarLimiteSocio();

  const handleConfirmarCancelacion = async () => {
    if (!solicitudACancelar?.raw) return;
    try {
      await actualizarLimiteMutation.mutateAsync({
        ...solicitudACancelar.raw,
        tipolimiteestadoid: ESTADO_CANCELADA,
      });

      // Igual que en Dashboard.jsx (admin): todo cambio de estado en
      // TipoLimiteSocio se refleja también en SolicitudEnProceso — ambas
      // tablas usan literalmente el mismo catálogo (2026-08-18), así que no
      // hace falta traducir el valor. No bloquea la cancelación si falla,
      // queda solo logueado — es una sincronización secundaria.
      const solicitudEnProcesoId =
        solicitudACancelar.raw?.solicitudid ?? solicitudACancelar.raw?.SolicitudID;
      if (solicitudEnProcesoId && cuitActivo) {
        solicitudesService
          .sincronizarEstadoSolicitudEnProceso(cuitActivo, solicitudEnProcesoId, ESTADO_CANCELADA)
          .catch((syncErr) => {
            console.error(
              `[Solicitudes] No se pudo sincronizar el estado en SolicitudEnProceso para la solicitud N°${solicitudACancelar.id}:`,
              syncErr,
            );
          });
      }

      toast.success(`Solicitud N°${solicitudACancelar.id} cancelada`, {
        description: "Ya podés iniciar una nueva operación.",
      });
      setSolicitudACancelar(null);
    } catch (err) {
      toast.error("No se pudo cancelar la solicitud: " + err.message);
    }
  };

  useEffect(() => {
    if (location.state?.nuevaSolicitud) {
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  const handleNuevaOperacion = async (ruta, draftKey) => {
    // El botón ya queda disabled mientras !isValid (ver más abajo) - esto
    // es solo una guarda defensiva por si isValid cambia justo entre el
    // último render y el click. Antes acá se abría BloqueoLegajoModal;
    // ahora el botón bloqueado ya deja claro que no se puede, así que no
    // hace falta explicarlo de nuevo con una modal.
    if (!isValid) return;

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
            <h1 className={styles.title}>Mis Solicitudes</h1>
            <p className={styles.subtitle}>Gestioná tus operaciones.</p>
          </div>
        </div>

        <Button
          variant="primary"
          size="sm"
          onClick={() =>
            handleNuevaOperacion(`${basePath}/alta-operacion`, "draft_alta_operacion")
          }
          className={styles.btnNuevaOp}
          disabled={!isValid}
          title={!isValid ? "Completá tu legajo y documentación al 100% para poder operar." : undefined}
        >
          <><FiPlus style={{ marginRight: "0.5rem" }} /> NUEVA OPERACIÓN</>
        </Button>
      </header>

      {/* CUERPO PRINCIPAL */}
      <main className={styles.main}>
        <LegajoUniversalBar context="solicitudes" />
        
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

          <div className={styles.filterFieldsRow}>
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
        <div className={styles.listContainer}>
          {isLoadingData ? (
            <SkeletonTable rows={3} />
          ) : listaFiltrada.length > 0 ? (
            listaFiltrada.map((item) => {
              // Solo se puede cancelar una solicitud real (ya tiene
              // TipoLimiteSocio, no un simple borrador en proceso) que
              // todavía esté pendiente de validación.
              const puedeCancelar =
                !!item.raw && item.tipoLimiteEstadoId === ESTADO_PENDIENTE;
              return (
                <TarjetaSolicitud
                  key={item.id}
                  solicitud={item}
                  onVerDetalle={setSolicitudSeleccionada}
                  acciones={
                    puedeCancelar
                      ? [
                          {
                            label: "Cancelar solicitud",
                            variant: "danger",
                            onClick: () => setSolicitudACancelar(item),
                          },
                        ]
                      : undefined
                  }
                />
              );
            })
          ) : (
            <div className={styles.emptyState}>
              <p>
                {listaSolicitudes.length > 0
                  ? "No encontramos solicitudes con esos filtros."
                  : "No tenés solicitudes activas en este momento."}
              </p>
            </div>
          )}
        </div>
      </main>

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
        titulo="Cancelar solicitud"
        mensaje={`¿Seguro que querés cancelar la Solicitud N°${solicitudACancelar?.id}? Vas a poder iniciar una nueva operación una vez cancelada.`}
        confirmText="Sí, cancelar"
        cancelText="Volver"
      />

      <InformativoModal
        isOpen={modalPendienteOpen}
        onClose={() => setModalPendienteOpen(false)}
        icon={<FiClock style={{ color: "var(--yellow, #f4f500)" }} />}
        variant="warning"
        title="Solicitud en proceso"
        description="Ya tenés una solicitud de línea en análisis. Debés esperar a que se valide o cancelarla antes de crear una nueva."
        buttonText="Entendido"
      />

      <InformativoModal
        isOpen={modalNuevaOperacionBloqueada}
        onClose={() => setModalNuevaOperacionBloqueada(false)}
        icon={<FiClock style={{ color: "var(--yellow, #f4f500)" }} />}
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
