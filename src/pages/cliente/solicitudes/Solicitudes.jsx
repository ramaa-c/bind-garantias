import React, { useState, useEffect, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useForm } from "react-hook-form";
import { FiPlus, FiSearch, FiClock } from "react-icons/fi";
import { FaFileInvoiceDollar } from "react-icons/fa";
import { toast } from "sonner";
import { BotonVolver, Button, Select, Spinner, SkeletonTable } from "../../../components/ui";
import {
  TarjetaSolicitud,
  DetalleSolicitudModal,
  LegajoUniversalBar,
  BloqueoLegajoModal
} from "../../../components/features";
import ConfirmacionBorradorModal from "../../../components/features/shared/ConfirmacionBorradorModal/ConfirmacionBorradorModal";
import InformativoModal from "../../../components/features/shared/InformativoModal/InformativoModal";
import { ConfirmacionModal } from "../../../components/features/shared/ConfirmacionModal/ConfirmacionModal";
import { HelpDrawer } from "../../../components/layout/Client/HelpDrawer/HelpDrawer";
import { useValidacionLegajo } from "../../../hooks/useValidacionLegajo";
import { useObtenerLimitesSocio, useObtenerSolicitudesEnProceso } from "../../../hooks/useSolicitudes";
import { useActualizarLimiteSocio } from "../../../hooks/useLinea";
import { useQuery } from "@tanstack/react-query";
import { sociosService } from "../../../services/sociosService";
import { useEmpresaActiva } from "../../../hooks/useEmpresaActiva";
import { useChannel } from "../../../context/ChannelContext";
import {
  ESTADO_PENDIENTE,
  ESTADO_CANCELADA,
  estadoTextoDesde,
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
  const { channelInfo } = useChannel();

  const { control, register } = useForm({
    defaultValues: {
      busqueda: "",
      estado: "",
      orden: "desc",
    },
  });

  const [flujoPendiente, setFlujoPendiente] = useState(null);
  const [draftKeyPendiente, setDraftKeyPendiente] = useState(null);
  const [solicitudSeleccionada, setSolicitudSeleccionada] = useState(null);
  const [modalPendienteOpen, setModalPendienteOpen] = useState(false);
  const [modalBloqueoLegajoOpen, setModalBloqueoLegajoOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);

  const { isValid, faltanDocumentos, faltanLegajo } = useValidacionLegajo();

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
    const hasProcesoPendiente = Array.isArray(solicitudesEnProceso) && solicitudesEnProceso.length > 0;
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
        socioid: socioIdFinal,
        cuit: cuitActivo,
        isReal: true,
        solicitudid: sp.solicitudenprocesoid,
      }));

    return [...reales, ...pendientes].sort((a, b) => (Number(b.solicitudid) || 0) - (Number(a.solicitudid) || 0));
  }, [solicitudesReal, solicitudesEnProceso, socioIdFinal, cuitActivo]);

  const [solicitudACancelar, setSolicitudACancelar] = useState(null);
  const actualizarLimiteMutation = useActualizarLimiteSocio();

  const handleConfirmarCancelacion = async () => {
    if (!solicitudACancelar?.raw) return;
    try {
      await actualizarLimiteMutation.mutateAsync({
        ...solicitudACancelar.raw,
        tipolimiteestadoid: ESTADO_CANCELADA,
      });
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
    if (!isValid) {
      setModalBloqueoLegajoOpen(true);
      return;
    }

    if (tieneSolicitudPendiente) {
      setModalPendienteOpen(true);
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
            handleNuevaOperacion(`/${channelInfo?.id || "default"}/alta-operacion`, "draft_alta_operacion")
          }
          className={styles.btnNuevaOp}
        >
          <><FiPlus style={{ marginRight: "0.5rem" }} /> NUEVA OPERACIÓN</>
        </Button>
      </header>

      {/* CUERPO PRINCIPAL */}
      <main className={styles.main}>
        <LegajoUniversalBar />
        
        <div className={styles.toolbar}>
          <div className={styles.filtersWrapper}>
            <div className={styles.searchBox}>
              <FiSearch className={styles.searchIcon} />
              <input
                type="text"
                placeholder="Buscar por nombre o CUIT..."
                className={styles.searchInput}
                {...register("busqueda")}
              />
            </div>

            <div className={styles.selectGroup}>
              <div className={styles.customSelectWrapper}>
                <Select
                  name="estado"
                  control={control}
                  options={opcionesEstado}
                  placeholder="Estado"
                  isSearchable={false}
                  hideErrorSpace
                />
              </div>

              <div className={styles.customSelectWrapper}>
                <Select
                  name="orden"
                  control={control}
                  options={opcionesOrden}
                  placeholder="Orden"
                  isSearchable={false}
                  hideErrorSpace
                />
              </div>
            </div>
          </div>
        </div>
        <div className={styles.listContainer}>
          {isLoadingData ? (
            <SkeletonTable rows={3} />
          ) : listaSolicitudes.length > 0 ? (
            listaSolicitudes.map((item) => {
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
                            label: "Cancelar",
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
              <p>No tenés solicitudes activas en este momento.</p>
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

      <BloqueoLegajoModal
        isOpen={modalBloqueoLegajoOpen}
        onClose={() => setModalBloqueoLegajoOpen(false)}
        faltanDocumentos={faltanDocumentos}
        faltanLegajo={faltanLegajo}
        onGoToSocios={() => navigate(`/${channelInfo?.id || "default"}/legajo`)}
        onGoToDocumentacion={() => navigate(`/${channelInfo?.id || "default"}/documentacion`)}
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

      <HelpDrawer
        isOpen={isHelpOpen}
        onClose={() => setIsHelpOpen(false)}
        contexto="inicio"
      />
    </div>
  );
}
