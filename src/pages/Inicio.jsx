import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FiFileText,
  FiBriefcase,
  FiDollarSign,
  FiArrowRight,
  FiTrendingUp,
  FiCalendar,
  FiClock,
} from "react-icons/fi";
import { TbFileInvoice } from "react-icons/tb";
import { Button } from "../components/ui";
import ModalConfirmacionBorrador from "../components/features/compartidos/ModalConfirmacionBorrador/ModalConfirmacionBorrador";
import styles from "./Inicio.module.css";

// Mocks
const solicitudesRecientes = [
  {
    id: "4362",
    tipo: "Pagaré USD",
    monto: "40.000",
    estado: "esperando",
    texto: "Esperando Docs",
  },
  {
    id: "4361",
    tipo: "Cheque",
    monto: "15.000",
    estado: "aprobado",
    texto: "Aprobado",
  },
];

export default function Inicio() {
  const navigate = useNavigate();
  const [flujoPendiente, setFlujoPendiente] = useState(null);
  const [draftKeyPendiente, setDraftKeyPendiente] = useState(null);

  const handleNuevaOperacion = (ruta, draftKey) => {
    const hasDraft =
      sessionStorage.getItem(`${draftKey}_data`) ||
      sessionStorage.getItem(`${draftKey}_paso`);

    if (hasDraft) {
      setFlujoPendiente(ruta);
      setDraftKeyPendiente(draftKey);
    } else {
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

  return (
    <div className={styles.inicioPage}>
      <main className={styles.inicioMainContainer}>
        <div className={styles.inicioContentWrapper}>
          <header className={styles.inicioHeader}>
            <div>
              <h1 className={styles.inicioGreeting}>Hola, Asesoramiento</h1>
              <p className={styles.inicioSubGreeting}>
                Aquí tenés el resumen de tus líneas de crédito.
              </p>
            </div>
          </header>

          <section className={styles.kpiGrid}>
            <div className={styles.kpiCard}>
              <div className={styles.kpiIcon}>
                <FiTrendingUp />
              </div>
              <p className={styles.kpiLabel}>Disponible (Pagaré USD)</p>
              <h2 className={`${styles.kpiValue} ${styles.textYellow}`}>U$D 40.000</h2>
            </div>

            <div className={styles.kpiCard}>
              <div className={styles.kpiIcon} style={{ color: "#aaa" }}>
                <TbFileInvoice />
              </div>
              <p className={styles.kpiLabel}>Límite Total Aprobado</p>
              <h2 className={styles.kpiValue}>U$D 40.000</h2>
            </div>

            <div className={styles.kpiCard}>
              <div className={styles.kpiIcon} style={{ color: "#ff5252" }}>
                <FiCalendar />
              </div>
              <p className={styles.kpiLabel}>Próximo Vencimiento</p>
              <h2 className={styles.kpiValue}>01/11/2026</h2>
            </div>
          </section>

          <div className={styles.inicioBottomGrid}>
            {/* COLUMNA IZQUIERDA */}
            <section className={styles.leftColumn}>
              <div className={styles.sectionHeaderRow}>
                <h3 className={styles.sectionTitle}>Mis Líneas Activas</h3>
              </div>

              <div className={styles.taskCardsGrid}>
            {/* Tarjeta Pagaré */}
            <div className={styles.taskCard}>
              <div className={styles.taskCardHeader}>
                <div className={styles.taskCardIcon}>
                  <FiFileText />
                </div>
                <h3 className={styles.taskCardTitle}>Pagaré</h3>
              </div>
              <p className={styles.taskCardDescription}>
                Emití y negociá pagarés bursátiles en dólares de forma ágil y
                sencilla.
              </p>
              <div className={styles.taskCardFooter}>
                <Button
                  variant="primary"
                  onClick={() =>
                    handleNuevaOperacion("/pagare", "draft_pagare")
                  }
                >
                  Nueva Operación
                  <FiArrowRight style={{ marginLeft: "0.5rem" }} />
                </Button>
                <Button
                  variant="outline"
                  onClick={() => navigate("/solicitudes")}
                >
                  Solicitudes
                </Button>
              </div>
            </div>

            {/* Tarjeta Cheques */}
            <div className={styles.taskCard}>
              <div className={styles.taskCardHeader}>
                <div className={styles.taskCardIcon}>
                  <FiBriefcase />
                </div>
                <h3 className={styles.taskCardTitle}>Cheques</h3>
              </div>
              <p className={styles.taskCardDescription}>
                Descontá tus cheques de pago diferido y obtené liquidez
                inmediata para tu negocio.
              </p>
              <div className={styles.taskCardFooter}>
                <Button
                  variant="primary"
                  onClick={() =>
                    handleNuevaOperacion("/cheques", "draft_cheques")
                  }
                >
                  Nueva Operación
                  <FiArrowRight style={{ marginLeft: "0.5rem" }} />
                </Button>
                <Button
                  variant="outline"
                  onClick={() => navigate("/solicitudes")}
                >
                  Solicitudes
                </Button>
              </div>
            </div>

            {/* Tarjeta Préstamos */}
            <div className={styles.taskCard}>
              <div className={styles.taskCardHeader}>
                <div className={styles.taskCardIcon}>
                  <FiDollarSign />
                </div>
                <h3 className={styles.taskCardTitle}>Préstamos</h3>
              </div>
              <p className={styles.taskCardDescription}>
                Accedé a líneas de crédito a medida para financiar tus proyectos
                de inversión.
              </p>
              <div className={styles.taskCardFooter}>
                <Button
                  variant="primary"
                  onClick={() =>
                    handleNuevaOperacion("/prestamos", "draft_prestamos")
                  }
                >
                  Nueva Operación
                  <FiArrowRight style={{ marginLeft: "0.5rem" }} />
                </Button>
                <Button
                  variant="outline"
                  onClick={() => navigate("/solicitudes")}
                >
                  Solicitudes
                </Button>
              </div>
            </div>
              </div>
            </section>

            {/* COLUMNA DERECHA */}
            <section className={styles.rightColumn}>
              <div className={styles.sectionHeaderRow}>
                <h3 className={styles.sectionTitle}>Actividad Reciente</h3>
                <Button variant="link" size="sm" onClick={() => navigate("/solicitudes")}>
                  Ver todas <FiArrowRight style={{ marginLeft: "4px" }} />
                </Button>
              </div>

              <div className={styles.actividadList}>
                {solicitudesRecientes.map((sol) => (
                  <div className={styles.actividadItem} key={sol.id}>
                    <div className={styles.actividadIcon}>
                      <FiClock
                        color={
                          sol.estado === "esperando"
                            ? "var(--yellow)"
                            : "#4caf50"
                        }
                      />
                    </div>
                    <div className={styles.actividadDetails}>
                      <p className={styles.actividadTitle}>
                        Solicitud N° {sol.id} <span>• {sol.tipo}</span>
                      </p>
                      <p className={styles.actividadMonto}>U$D {sol.monto}</p>
                    </div>
                    <div
                      className={`${styles.actividadStatus} ${
                        sol.estado === "esperando"
                          ? styles.statusEsperando
                          : styles.statusAprobado
                      }`}
                    >
                      {sol.texto}
                    </div>
                  </div>
                ))}

                {solicitudesRecientes.length === 0 && (
                  <p className={styles.emptyText}>No hay actividad reciente.</p>
                )}
              </div>
            </section>
          </div>
        </div>
      </main>

      {/* Modal Interceptor */}
      <ModalConfirmacionBorrador
        isOpen={!!flujoPendiente}
        onClose={handleCloseContinueDraft}
        onConfirm={handleConfirmStartNew}
      />
    </div>
  );
}