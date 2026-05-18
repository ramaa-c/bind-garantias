import React, { useState, useEffect, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useForm } from "react-hook-form";
import { FiPlus, FiSearch } from "react-icons/fi";
import { FaMoneyBillWave } from "react-icons/fa";
import { BotonVolver, Button, Select, Spinner } from "../../components/ui";
import { TarjetaSolicitud, ModalDetalleSolicitud } from "../../components/features";
import ModalConfirmacionBorrador from "../../components/features/shared/Compartidos/ModalConfirmacionBorrador/ModalConfirmacionBorrador";
import { useObtenerLimitesSocio } from "../../hooks/useSolicitudes";
import { useQuery } from "@tanstack/react-query";
import { sociosService } from "../../services/sociosService";
import { useEmpresaActiva } from "../../hooks/useEmpresaActiva";

import styles from "./Solicitudes.module.css";

const mockSolicitudesBase = [
  {
    id: "4362",
    tipo: "Pagaré USD",
    monto: "40.000",
    moneda: "U$D",
    estado: "Aprobada",
    fecha: "18/03/2026",
  },
  {
    id: "4361",
    tipo: "Cheque",
    monto: "150.000",
    moneda: "$",
    estado: "Rechazada",
    fecha: "15/03/2026",
  },
  {
    id: "4360",
    tipo: "Línea de Crédito",
    monto: "250.000",
    moneda: "$",
    estado: "Cancelada",
    fecha: "10/02/2026",
  },
];

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
    return Object.values(data).some((value) => {
      if (
        value === "" ||
        value === null ||
        value === undefined ||
        value === false
      )
        return false;
      if (Array.isArray(value) && value.length === 0) return false;
      return true;
    });
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

  const { cuitActivo, nombreEmpresa, socioIdActivo } = useEmpresaActiva();
  const socioIdFinal = socioIdActivo || 2974; // Fallback demo si no hay socioIdActivo
  
  const { data: solicitudesReal, isLoading: cargandoSolicitudes } = useObtenerLimitesSocio(socioIdFinal);

  const nombreEmpresaActiva = nombreEmpresa || "Empresa Demo S.A.";

  // Verificar si hay solicitud en proceso para el socio activo
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

    return [...reales, ...mockSolicitudesBase];
  }, [solicitudesReal]);

  useEffect(() => {
    if (location.state?.nuevaSolicitud) {
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  const handleNuevaOperacion = (ruta, draftKey) => {
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
            <FaMoneyBillWave />
          </div>
          <div className={styles.titleWrapper}>
            <h1 className={styles.title}>Mis Solicitudes</h1>
            <p className={styles.subtitle}>
              Gestioná tus operaciones.
            </p>
          </div>
        </div>

        <Button
          variant="primary"
          size="sm"
          onClick={() => handleNuevaOperacion("/alta-operacion", "draft_alta_operacion")}
          className={styles.btnNuevaOp}
        >
          <FiPlus style={{ marginRight: "0.5rem" }} /> NUEVA OPERACIÓN
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
            <div className={styles.loadingContainer}>
              <Spinner size="xl" />
              <p>Cargando solicitudes...</p>
            </div>
          ) : listaSolicitudes.length > 0 ? (
            listaSolicitudes.map((item) => (
              <TarjetaSolicitud key={item.id} solicitud={item} onVerDetalle={setSolicitudSeleccionada} />
            ))
          ) : (
            <div className={styles.emptyState}>
              <p>No tenés solicitudes activas en este momento.</p>
            </div>
          )}
        </div>
      </main>

      <ModalConfirmacionBorrador
        isOpen={!!flujoPendiente}
        onClose={handleCloseModalOnly}
        onConfirm={handleConfirmStartNew}
        onContinueBorrador={handleCloseContinueDraft}
      />
      <ModalDetalleSolicitud
        isOpen={!!solicitudSeleccionada}
        onClose={() => setSolicitudSeleccionada(null)}
        solicitud={solicitudSeleccionada}
        nombreEmpresa={nombreEmpresaActiva}
      />

      {/* Modal: solicitud en proceso */}
      {modalPendienteOpen && (
        <div
          style={{
            position: "fixed", inset: 0, zIndex: 9999,
            background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)",
            display: "flex", alignItems: "center", justifyContent: "center",
            padding: "1rem",
          }}
          onClick={() => setModalPendienteOpen(false)}
        >
          <div
            style={{
              background: "#1a1a1a", border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: "1rem", padding: "2.5rem 2rem",
              maxWidth: "26rem", width: "100%",
              display: "flex", flexDirection: "column", alignItems: "center",
              gap: "1.25rem", textAlign: "center",
              boxShadow: "0 24px 48px rgba(0,0,0,0.5)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{
              width: "3.5rem", height: "3.5rem", borderRadius: "50%",
              background: "rgba(255, 193, 7, 0.1)", border: "2px solid rgba(255, 193, 7, 0.25)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "1.5rem",
            }}>⏳</div>
            <h3 style={{ color: "#fff", margin: 0, fontSize: "1.15rem", fontWeight: 700 }}>
              Solicitud en proceso
            </h3>
            <p style={{ color: "#888", margin: 0, fontSize: "0.875rem", lineHeight: 1.6 }}>
              Ya tenés una solicitud de línea en análisis. Debés esperar a que se apruebe o rechace antes de crear una nueva.
            </p>
            <button
              onClick={() => setModalPendienteOpen(false)}
              style={{
                background: "var(--yellow, #f4f500)", color: "#000",
                border: "none", borderRadius: "0.625rem", padding: "0.75rem 2.5rem",
                fontWeight: 700, fontSize: "0.875rem", cursor: "pointer",
                marginTop: "0.25rem", transition: "filter 0.15s",
              }}
              onMouseOver={(e) => e.target.style.filter = "brightness(1.1)"}
              onMouseOut={(e) => e.target.style.filter = "none"}
            >
              Entendido
            </button>
          </div>
        </div>
      )}
    </div>
  );
}