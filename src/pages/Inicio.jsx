import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FiFileText,
  FiBriefcase,
  FiDollarSign,
  FiArrowRight,
} from "react-icons/fi";
import { Button } from "../components/ui";
import ModalConfirmacionBorrador from "../components/features/compartidos/ModalConfirmacionBorrador/ModalConfirmacionBorrador";
import styles from "./Inicio.module.css";

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
                ¿Qué operación deseas realizar hoy?
              </p>
            </div>
          </header>

          <section className={styles.taskCardsGrid}>
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
                  Iniciar solicitud
                  <FiArrowRight style={{ marginLeft: "0.5rem" }} />
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
                  Iniciar solicitud
                  <FiArrowRight style={{ marginLeft: "0.5rem" }} />
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
                  Iniciar solicitud
                  <FiArrowRight style={{ marginLeft: "0.5rem" }} />
                </Button>
              </div>
            </div>
          </section>
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