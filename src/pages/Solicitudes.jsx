import React from "react";
import { useNavigate } from "react-router-dom";
import { FiFilter, FiList, FiPlus } from "react-icons/fi";
import { FaMoneyBillWave } from "react-icons/fa";

import { BotonVolver, Button } from "../components/ui";

import { TarjetaSolicitud } from "../components/features";

import styles from "./Solicitudes.module.css";

const mockSolicitudes = [
  { id: "4362", tipo: "Pagaré USD", monto: "40.000", estado: "Aprobada", fecha: "18/03/2026" },
  { id: "4361", tipo: "Cheque", monto: "150.000", estado: "Pendiente", fecha: "15/03/2026" },
];

export default function Solicitudes() {
  const navigate = useNavigate();

  return (
    <div className={styles.pageContainer}>
      {/* HEADER TIPO DASHBOARD */}
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <div className={styles.titleGroup}>
            <div className={styles.iconCircle}>
              <FaMoneyBillWave />
            </div>
            <div>
              <h1 className={styles.title}>Mis Solicitudes</h1>
              <p className={styles.subtitle}>Gestioná y hacé el seguimiento de tus operaciones.</p>
            </div>
          </div>

          <div className={styles.creditInfo}>
            <span className={styles.creditLabel}>Límite de crédito disponible</span>
            <span className={styles.creditAmount}>U$D 40.000</span>
            <span className={styles.creditExpiry}>Vence: 01/11/2026</span>
          </div>
        </div>
      </header>

      <main className={styles.main}>
        <div className={styles.content}>

          <div className={styles.navigationRow}>
            <BotonVolver onClick={() => navigate("/inicio")} texto="Volver al inicio" />
          </div>

          <div className={styles.toolbar}>
            <Button
              variant="primary"
              onClick={() => navigate("/pagare")}
              className={styles.btnNuevaOp}
            >
              <FiPlus style={{ marginRight: '8px' }} /> NUEVA OPERACIÓN
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
    </div>
  );
}