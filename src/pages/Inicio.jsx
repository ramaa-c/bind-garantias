import React from "react";
import { useNavigate } from "react-router-dom";
import {
  FiTrendingUp,
  FiCalendar,
  FiClock,
  FiPlusCircle,
  FiArrowRight,
} from "react-icons/fi";
import { TbFileInvoice } from "react-icons/tb";
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
            <button className="btn-action" onClick={() => navigate("/pagare")}>
              <FiPlusCircle size={18} style={{ marginRight: "8px" }} />
              NUEVA OPERACIÓN
            </button>
          </header>

          <section className={styles.kpiGrid}>
            <div className={styles.kpiCard}>
              <div className={styles.kpiIcon}>
                <FiTrendingUp />
              </div>
              <p className={styles.kpiLabel}>Disponible (Pagaré USD)</p>
              <h2 className={`${styles.kpiValue} text-yellow`}>U$D 40.000</h2>
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
            <section>
              <div className={styles.sectionHeaderRow}>
                <h3 className={styles.sectionTitle}>Mis Líneas Activas</h3>
              </div>

              <div className={styles.lineaModernCard}>
                <div className={styles.lineaModernInfo}>
                  <h4>Línea Pagaré Bursátil</h4>
                  <p>Operá en dólares de forma ágil.</p>
                </div>
                <div>
                  <button
                    className="btn-action btn-outline btn-sm"
                    onClick={() => navigate("/pagare")}
                  >
                    UTILIZAR LÍNEA
                  </button>
                </div>
              </div>

              <div className={`${styles.lineaModernCard} ${styles.disabled}`}>
                <div className={styles.lineaModernInfo}>
                  <h4>Línea Cheques (Próximamente)</h4>
                  <p>Descuento de cheques de pago diferido.</p>
                </div>
              </div>
            </section>

            {/* COLUMNA DERECHA */}
            <section>
              <div className={styles.sectionHeaderRow}>
                <h3 className={styles.sectionTitle}>Actividad Reciente</h3>
                <button
                  className="btn-link text-sm"
                  onClick={() => navigate("/solicitudes")}
                >
                  Ver todas <FiArrowRight />
                </button>
              </div>

              <div className={styles.actividadList}>
                {solicitudesRecientes.map((sol, index) => (
                  <div className={styles.actividadItem} key={index}>
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
                  <p className="empty-text">No hay actividad reciente.</p>
                )}
              </div>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}
