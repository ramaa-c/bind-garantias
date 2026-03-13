// src/pages/Solicitudes.jsx

import React from "react";
import { useNavigate } from "react-router-dom";
import { FiFilter, FiList } from "react-icons/fi";
import { FaMoneyBillWave } from "react-icons/fa";

// BARRIL
import { BotonVolver } from "../components/ui";
import { TarjetaSolicitud } from "../components/features"; 

import styles from "./Solicitudes.module.css";

// --- MOCK DATA ---
const mockSolicitudes = [
  /* ... tus mismos datos mock ... */
];

export default function Solicitudes() {
  const navigate = useNavigate();

  return (
    <div className={styles.inicioPage}>
      {/* HEADER */}
      <div className={styles.solicitudesHeaderBlock}>
        <div className={styles.solicitudesHeaderContent}>
          <h2 className={styles.solicitudesTitle}>
            <FaMoneyBillWave style={{ marginRight: "10px" }} />
            SOLICITUDES
          </h2>
          <p className={styles.solicitudesSubtitle}>
            Límite de crédito: U$D 40.000 - Vencimiento de la línea: 01/11/2026
          </p>
        </div>
      </div>

      <main className={styles.inicioMainContainer}>
        <div className={styles.inicioContenedorPrincipal} style={{ maxWidth: "900px" }}>
          
          <BotonVolver onClick={() => navigate("/inicio")} texto="Volver a inicio" />

          <div className={styles.solicitudesToolbar}>
            <button className={styles.btnAction} onClick={() => navigate("/pagare")}>
              NUEVA OPERACIÓN
            </button>
            <div className={styles.solicitudesTools}>
              <button className={`${styles.iconBtn} ${styles.active}`}>
                <FiList size={24} />
              </button>
              <button className={styles.iconBtn}>
                <FiFilter size={24} />
              </button>
            </div>
          </div>

          {/* LISTA DE TARJETAS (¡Mirá qué limpio quedó esto!) */}
          <div className={styles.solicitudesList}>
            {mockSolicitudes.map((item, index) => (
              <TarjetaSolicitud key={index} solicitud={item} />
            ))}
          </div>

        </div>
      </main>
    </div>
  );
}