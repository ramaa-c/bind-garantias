import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiFilter, FiList, FiPlus } from "react-icons/fi";
import { FaMoneyBillWave } from "react-icons/fa";

import { BotonVolver, Button } from "../components/ui";
import { TarjetaSolicitud } from "../components/features";
import ModalConfirmacionBorrador from "../components/features/compartidos/ModalConfirmacionBorrador/ModalConfirmacionBorrador";

import styles from "./Solicitudes.module.css";

// Mocks
const mockSolicitudes = [
  {
    id: "4362",
    tipo: "Pagaré USD",
    monto: "40.000",
    estado: "Aprobada",
    fecha: "18/03/2026",
  },
  {
    id: "4361",
    tipo: "Cheque",
    monto: "150.000",
    estado: "Pendiente",
    fecha: "15/03/2026",
  },
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
      ) {
        return false;
      }
      if (Array.isArray(value) && value.length === 0) {
        return false;
      }
      return true;
    });
  } catch {
    return false;
  }
};

export default function Solicitudes() {
  const navigate = useNavigate();

  const [flujoPendiente, setFlujoPendiente] = useState(null);
  const [draftKeyPendiente, setDraftKeyPendiente] = useState(null);

  const handleNuevaOperacion = (ruta, draftKey) => {
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
    if (flujoPendiente) {
      navigate(flujoPendiente);
    }
    setFlujoPendiente(null);
    setDraftKeyPendiente(null);
  };

  const handleCloseContinueDraft = () => {
    if (flujoPendiente) {
      navigate(flujoPendiente);
    }
    setFlujoPendiente(null);
    setDraftKeyPendiente(null);
  };

  const handleCloseModalOnly = () => {
    setFlujoPendiente(null);
    setDraftKeyPendiente(null);
  };

  return (
    <div className={styles.pageContainer}>
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <div className={styles.titleGroup}>
            <div className={styles.iconCircle}>
              <FaMoneyBillWave />
            </div>
            <div>
              <h1 className={styles.title}>Mis Solicitudes</h1>
              <p className={styles.subtitle}>
                Gestioná y hacé el seguimiento de tus operaciones.
              </p>
            </div>
          </div>

          <div className={styles.creditInfo}>
            <span className={styles.creditLabel}>
              Límite de crédito disponible
            </span>
            <span className={styles.creditAmount}>U$D 40.000</span>
            <span className={styles.creditExpiry}>Vence: 01/11/2026</span>
          </div>
        </div>
      </header>

      <main className={styles.main}>
        <div className={styles.content}>
          <div className={styles.navigationRow}>
            <BotonVolver
              onClick={() => navigate("/inicio")}
              texto="Volver al inicio"
            />
          </div>

          <div className={styles.toolbar}>
            <Button
              variant="primary"
              onClick={() => handleNuevaOperacion("/pagare", "draft_pagare")}
              className={styles.btnNuevaOp}
            >
              <FiPlus style={{ marginRight: "8px" }} /> NUEVA OPERACIÓN
            </Button>

            <div className={styles.filterGroup}>
              <button className={`${styles.iconBtn} ${styles.active}`}>
                <FiList size={20} />
                <span>Lista</span>
              </button>
              <button className={styles.iconBtn}>
                <FiFilter size={20} />
                <span>Filtrar</span>
              </button>
            </div>
          </div>

          {/* LISTA DE SOLICITUDES */}
          <div className={styles.listContainer}>
            {mockSolicitudes.length > 0 ? (
              mockSolicitudes.map((item) => (
                <TarjetaSolicitud key={item.id} solicitud={item} />
              ))
            ) : (
              <div className={styles.emptyState}>
                <p>No tenés solicitudes activas en este momento.</p>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Modal Interceptor */}
      <ModalConfirmacionBorrador
        isOpen={!!flujoPendiente}
        onClose={handleCloseModalOnly}
        onConfirm={handleConfirmStartNew}
        onContinueBorrador={handleCloseContinueDraft}
      />
    </div>
  );
}
