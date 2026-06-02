import React, { useState, useEffect, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useForm } from "react-hook-form";
import { FiPlus, FiSearch, FiClock } from "react-icons/fi";
import { FaFileInvoiceDollar } from "react-icons/fa";
import { BotonVolver, Button, Select, Spinner, SkeletonTable } from "../../../components/ui";
import {
  TarjetaSolicitud,
  DetalleSolicitudModal,
} from "../../../components/features";
import ConfirmacionBorradorModal from "../../../components/features/shared/ConfirmacionBorradorModal/ConfirmacionBorradorModal";
import InformativoModal from "../../../components/features/shared/InformativoModal/InformativoModal";
import { HelpDrawer } from "../../../components/layout/Client/HelpDrawer/HelpDrawer";
import { useObtenerLimitesSocio } from "../../../hooks/useSolicitudes";
import { useQuery } from "@tanstack/react-query";
import { sociosService } from "../../../services/sociosService";
import { useEmpresaActiva } from "../../../hooks/useEmpresaActiva";
import { useValidarUtilizacionCore } from "../../../hooks/useSgrPlusCore";

import styles from "./Solicitudes.module.css";



const opcionesEstado = [
  { value: "todos", label: "Todos los estados" },
  { value: "pendiente", label: "Pendiente" },
  { value: "aprobada", label: "Aprobada" },
  { value: "rechazada", label: "Rechazada" },
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
  const [isHelpOpen, setIsHelpOpen] = useState(false);

  const { cuitActivo, nombreEmpresa, socioIdActivo } = useEmpresaActiva();
  const socioIdFinal = socioIdActivo || 2974;

  const { data: solicitudesReal, isLoading: cargandoSolicitudes } =
    useObtenerLimitesSocio(socioIdFinal);
  const { mutateAsync: validarUtilizacionCore } = useValidarUtilizacionCore();
  const [isVerifyingLineas, setIsVerifyingLineas] = useState(false);

  const nombreEmpresaActiva = nombreEmpresa || "Empresa Demo S.A.";

  useEffect(() => {
    const handler = () => setIsHelpOpen((prev) => !prev);
    document.addEventListener("bindHelp:toggle", handler);
    return () => document.removeEventListener("bindHelp:toggle", handler);
  }, []);

  const tieneSolicitudPendiente = useMemo(() => {
    if (!solicitudesReal || !Array.isArray(solicitudesReal)) return false;
    return solicitudesReal.some(s =>
      !s.tipolimiteestadoid || s.tipolimiteestadoid === 0 || s.tipolimiteestadoid === 1
    );
  }, [solicitudesReal]);

  const listaSolicitudes = useMemo(() => {
    const reales = (solicitudesReal || [])
      .slice()
      .sort((a, b) => (b.tipolimitesocioid || 0) - (a.tipolimitesocioid || 0))
      .map(s => ({
        id: s.tipolimitesocioid?.toString() || Math.random().toString(),
        tipo: s.tipolimiteid === 1 ? "Cheque" : s.tipolimiteid === 2 ? "Préstamo" : "Pagaré",
        monto: s.importelimite ? new Intl.NumberFormat("es-AR").format(s.importelimite) : "0",
        moneda: s.monedaid === 5000 ? "$" : s.monedaid === 2 ? "U$D" : s.monedaid === 10 ? "UVAS" : s.monedaid === 500 ? "€" : "$",
        estado: (!s.tipolimiteestadoid || s.tipolimiteestadoid === 0 || s.tipolimiteestadoid === 1) ? "Pendiente" : s.tipolimiteestadoid === 2 ? "Aprobada" : s.tipolimiteestadoid === 3 ? "Rechazada" : "Cancelada",
        fecha: s.fchvigenciadesde ? new Date(s.fchvigenciadesde).toLocaleDateString("es-AR") : "Hoy",
        socioid: s.socioid || socioIdFinal,
        cuit: cuitActivo,
        isReal: true
      }));

    return reales;
  }, [solicitudesReal, socioIdFinal, cuitActivo]);

  useEffect(() => {
    if (location.state?.nuevaSolicitud) {
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  const handleNuevaOperacion = async (ruta, draftKey) => {
    if (tieneSolicitudPendiente) {
      setModalPendienteOpen(true);
      return;
    }

    setIsVerifyingLineas(true);
    try {
      const response = await validarUtilizacionCore(socioIdFinal);
      if (response?.status === 406) {
        setModalPendienteOpen(true);
        setIsVerifyingLineas(false);
        return;
      }
    } catch (error) {
      if (error?.response?.status === 406) {
        setModalPendienteOpen(true);
        setIsVerifyingLineas(false);
        return;
      }
      // If 404 or other errors, we let it pass.
    }
    setIsVerifyingLineas(false);

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
            handleNuevaOperacion("/alta-operacion", "draft_alta_operacion")
          }
          className={styles.btnNuevaOp}
          disabled={isVerifyingLineas}
        >
          {isVerifyingLineas ? "VERIFICANDO..." : <><FiPlus style={{ marginRight: "0.5rem" }} /> NUEVA OPERACIÓN</>}
        </Button>
      </header>

      {/* CUERPO PRINCIPAL */}
      <main className={styles.main}>
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
          {cargandoSolicitudes ? (
            <SkeletonTable rows={3} />
          ) : listaSolicitudes.length > 0 ? (
            listaSolicitudes.map((item) => (
              <TarjetaSolicitud
                key={item.id}
                solicitud={item}
                onVerDetalle={setSolicitudSeleccionada}
              />
            ))
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

      <DetalleSolicitudModal
        isOpen={!!solicitudSeleccionada}
        onClose={() => setSolicitudSeleccionada(null)}
        solicitud={solicitudSeleccionada}
        nombreEmpresa={nombreEmpresaActiva}
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
