import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FiFileText,
  FiBriefcase,
  FiDollarSign,
  FiArrowRight,
  FiTrendingUp,
  FiCalendar,
  FiActivity,
} from "react-icons/fi";
import { TbFileInvoice } from "react-icons/tb";
import { Button } from "../../../components/ui";
import ConfirmacionBorradorModal from "../../../components/features/shared/ConfirmacionBorradorModal/ConfirmacionBorradorModal";
import styles from "./Inicio.module.css";
import { useObtenerTodas } from "../../../hooks/useCadenaValor";
import Spinner from "../../../components/ui/Spinner/Spinner";

// Mocks

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

export default function Inicio() {
  const navigate = useNavigate();
  const [flujoPendiente, setFlujoPendiente] = useState(null);
  const [draftKeyPendiente, setDraftKeyPendiente] = useState(null);

  const [activeTab, setActiveTab] = useState("propias");

  // --- PAGINACIÓN HÍBRIDA ---
  const [currentPage, setCurrentPage] = useState(1);
  const visualItemsPerPage = 10; // En el inicio mostramos de a 10 para que rinda el espacio
  const chunkFactor = 2; // Traemos 2 páginas del server (20 items) por vez
  const serverItemsPerPage = visualItemsPerPage * chunkFactor;
  const serverPage = Math.ceil(currentPage / chunkFactor);

  const { data: lineasData = [], isLoading } = useObtenerTodas(serverPage, serverItemsPerPage);

  // Normalización de data (soporta array directo o envuelto en {items: []})
  let lineasList = [];
  let totalServerItems = 0;
  if (Array.isArray(lineasData)) {
    lineasList = lineasData;
    totalServerItems = lineasData.length;
  } else if (lineasData?.items && Array.isArray(lineasData.items)) {
    lineasList = lineasData.items;
    totalServerItems = lineasData.total || lineasData.totalCount || lineasData.items.length;
  }

  const isServerPaginated = totalServerItems !== lineasList.length;
  const absoluteTotal = isServerPaginated ? totalServerItems : lineasList.length;
  const totalPages = Math.ceil(absoluteTotal / visualItemsPerPage);

  const relativeVisualPage = isServerPaginated ? (currentPage - 1) % chunkFactor : (currentPage - 1);
  const currentLines = lineasList.slice(
    relativeVisualPage * visualItemsPerPage, 
    (relativeVisualPage + 1) * visualItemsPerPage
  );

  const prevPage = () => setCurrentPage((prev) => Math.max(prev - 1, 1));
  const nextPage = () => setCurrentPage((prev) => Math.min(prev + 1, totalPages));

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
    <div className={styles.inicioPage}>
      <main className={styles.inicioMainContainer}>
        <div className={styles.inicioContentWrapper}>
          {/* ── HEADER ── */}
          <header className={styles.inicioHeader}>
            <div>
              <h1 className={styles.inicioGreeting}>
                Hola, <em>Asesoramiento</em>
              </h1>
              <p className={styles.inicioSubGreeting}>
                Resumen de líneas de crédito activas
              </p>
            </div>
          </header>

          {/* ── BOTTOM GRID ── */}
          <div className={styles.inicioBottomGrid}>
            {/* COLUMNA IZQUIERDA */}
            <section className={styles.leftColumn}>
              <div className={styles.sectionHeaderRow}>
                <div className={styles.tabsContainer}>
                  <button
                    className={`${styles.tabButton} ${activeTab === "propias" ? styles.tabActive : ""}`}
                    onClick={() => setActiveTab("propias")}
                  >
                    Mis Líneas
                  </button>
                  <button
                    className={`${styles.tabButton} ${activeTab === "terceros" ? styles.tabActive : ""}`}
                    onClick={() => setActiveTab("terceros")}
                  >
                    Terceros
                  </button>
                </div>
              </div>

              <div className={styles.taskCardsGrid}>
                {activeTab === "propias" && (
                  <>
                    {/* Tarjeta Pagaré */}
                    <div className={styles.taskCard}>
                      <div className={styles.taskCardIcon}>
                        <FiFileText />
                      </div>
                      <div className={styles.taskCardBody}>
                        <h3 className={styles.taskCardTitle}>
                          Ingresar Pagaré en USD
                        </h3>
                        <p className={styles.taskCardDescription}>
                          Emití y negociá pagarés bursátiles en dólares de forma
                          ágil y sencilla.
                        </p>
                      </div>
                      <div className={styles.taskCardActions}>
                        <Button
                          variant="primary"
                          size="xs"
                          onClick={() =>
                            handleNuevaOperacion("/pagare", "draft_pagare")
                          }
                        >
                          Nueva Operación
                          <FiArrowRight />
                        </Button>
                        <Button
                          variant="outline"
                          size="xs"
                          onClick={() => navigate("/solicitudes")}
                        >
                          Solicitudes
                        </Button>
                      </div>
                    </div>

                    {/* Tarjeta Cheques */}
                    <div className={styles.taskCard}>
                      <div className={styles.taskCardIcon}>
                        <FiBriefcase />
                      </div>
                      <div className={styles.taskCardBody}>
                        <h3 className={styles.taskCardTitle}>
                          Solicitar Línea de Cheques
                        </h3>
                        <p className={styles.taskCardDescription}>
                          Descontá tus cheques de pago diferido y obtené
                          liquidez inmediata para tu negocio.
                        </p>
                      </div>
                      <div className={styles.taskCardActions}>
                        <Button
                          variant="primary"
                          size="xs"
                          onClick={() =>
                            handleNuevaOperacion("/cheques", "draft_cheques")
                          }
                        >
                          Nueva Operación
                          <FiArrowRight />
                        </Button>
                        <Button
                          variant="outline"
                          size="xs"
                          onClick={() => navigate("/solicitudes")}
                        >
                          Solicitudes
                        </Button>
                      </div>
                    </div>

                    {/* Tarjeta Préstamos */}
                    <div className={styles.taskCard}>
                      <div className={styles.taskCardIcon}>
                        <FiDollarSign />
                      </div>
                      <div className={styles.taskCardBody}>
                        <h3 className={styles.taskCardTitle}>
                          Solicitar Línea de Préstamos
                        </h3>
                        <p className={styles.taskCardDescription}>
                          Accedé a líneas de crédito a medida para financiar tus
                          proyectos de inversión.
                        </p>
                      </div>
                      <div className={styles.taskCardActions}>
                        <Button
                          variant="primary"
                          size="xs"
                          onClick={() =>
                            handleNuevaOperacion(
                              "/prestamos",
                              "draft_prestamos",
                            )
                          }
                        >
                          Nueva Operación
                          <FiArrowRight />
                        </Button>
                        <Button
                          variant="outline"
                          size="xs"
                          onClick={() => navigate("/solicitudes")}
                        >
                          Solicitudes
                        </Button>
                      </div>
                    </div>
                  </>
                )}

                {activeTab === "terceros" && (
                  <>
                    <div className={styles.taskCard}>
                      <div className={styles.taskCardIcon}>
                        <FiBriefcase />
                      </div>
                      <div className={styles.taskCardBody}>
                        <h3 className={styles.taskCardTitle}>
                          Operaciones con Cheques
                        </h3>
                        <p className={styles.taskCardDescription}>
                          Gestioná cheques de terceros, operalos de forma
                          individual o realizá cargas masivas.
                        </p>
                      </div>
                      <div className={styles.taskCardActions}>
                        <Button
                          variant="primary"
                          size="xs"
                          onClick={() =>
                            handleNuevaOperacion(
                              "/solicitud-cheques",
                              "draft_cheques_terceros",
                            )
                          }
                        >
                          Operar Cheques
                          <FiArrowRight />
                        </Button>
                        <Button
                          variant="primary"
                          size="xs"
                          onClick={() => navigate("/carga-masiva-cheques")}
                        >
                          Carga Masiva
                          <FiArrowRight />
                        </Button>
                        <Button
                          variant="outline"
                          size="xs"
                          onClick={() => navigate("/solicitudes")}
                        >
                          Solicitudes
                        </Button>
                      </div>
                    </div>

                    <div className={styles.taskCard}>
                      <div className={styles.taskCardIcon}>
                        <FiFileText />
                      </div>
                      <div className={styles.taskCardBody}>
                        <h3 className={styles.taskCardTitle}>
                          Operaciones con Pagarés
                        </h3>
                        <p className={styles.taskCardDescription}>
                          Emití y negociá pagarés de terceros de forma ágil y
                          centralizada.
                        </p>
                      </div>
                      <div className={styles.taskCardActions}>
                        <Button
                          variant="primary"
                          size="xs"
                          onClick={() =>
                            handleNuevaOperacion(
                              "/solicitud-pagare",
                              "draft_pagare"
                            )
                          }
                        >
                          Operar Pagaré
                          <FiArrowRight />
                        </Button>
                        <Button
                          variant="outline"
                          size="xs"
                          onClick={() => navigate("/solicitudes")}
                        >
                          Solicitudes
                        </Button>
                      </div>
                    </div>

                    <div className={styles.taskCard}>
                      <div className={styles.taskCardIcon}>
                        <FiDollarSign />
                      </div>
                      <div className={styles.taskCardBody}>
                        <h3 className={styles.taskCardTitle}>
                          Préstamos a Terceros
                        </h3>
                        <p className={styles.taskCardDescription}>
                          Gestioná las líneas de crédito y préstamos habilitados
                          para terceros.
                        </p>
                      </div>
                      <div className={styles.taskCardActions}>
                        <Button
                          variant="primary"
                          size="xs"
                          onClick={() =>
                            handleNuevaOperacion(
                              "/prestamos-seleccionables",
                              "draft_prestamos"
                            )
                          }
                        >
                          Seleccionables
                          <FiArrowRight />
                        </Button>
                        <Button
                          variant="primary"
                          size="xs"
                          onClick={() =>
                            handleNuevaOperacion(
                              "/prestamos-fijos",
                              "draft_prestamos_fijos"
                            )
                          }
                        >
                          Préstamos Fijos
                          <FiArrowRight />
                        </Button>
                        <Button
                          variant="outline"
                          size="xs"
                          onClick={() => navigate("/solicitudes")}
                        >
                          Solicitudes
                        </Button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </section>

            {/* COLUMNA DERECHA */}
            <section className={styles.rightColumn}>
              <div className={styles.sectionHeaderRow}>
                <h3 className={styles.sectionTitle}>Líneas Activas</h3>
              </div>

              <div className={styles.actividadCard}>
                <div className={`${styles.actividadList} ${styles.scrollableList}`}>
                  {isLoading ? (
                    <div className={styles.loadingWrapper}>
                       <Spinner size={60} />
                       <p>Actualizando líneas...</p>
                    </div>
                  ) : (
                    <>
                      {currentLines.map((linea) => (
                        <div 
                          className={`${styles.actividadItem} ${styles.actividadItemClickable}`} 
                          key={linea.cadenavalorid}
                          onClick={() => navigate(`/cadenas-valor/${linea.cadenavalorid}`)}
                        >
                          <div className={styles.actividadIcon}>
                            <FiBriefcase className={
                              linea?.estado?.toLowerCase() === "aprobada"
                                ? styles.iconAprobado
                                : styles.iconEsperando
                            } />
                          </div>
                          <div className={styles.actividadDetails}>
                            <p className={styles.actividadTitle}>
                              {linea.denominacion} <span>· {linea.descripcion}</span>
                            </p>
                            <p className={styles.actividadMonto}>
                              {linea.moneda === "Dolares Estadounidenses" ? "U$D" : "$"} {linea?.montomaximo?.toLocaleString('es-AR')}
                            </p>
                          </div>
                          <div
                            className={`${styles.actividadStatus} ${
                              linea?.estado?.toLowerCase() === "aprobada"
                                ? styles.statusAprobado
                                : styles.statusEsperando
                            }`}
                          >
                            {linea.estado}
                          </div>
                        </div>
                      ))}

                      {currentLines.length === 0 && (
                        <p className={styles.emptyText}>No hay líneas activas.</p>
                      )}
                    </>
                  )}
                </div>

                {!isLoading && totalPages > 1 && (
                  <div className={styles.miniPagination}>
                    <button onClick={prevPage} disabled={currentPage === 1}>
                      <FiArrowRight style={{ transform: 'rotate(180deg)' }} />
                    </button>
                    <span>Pág. {currentPage} de {totalPages}</span>
                    <button onClick={nextPage} disabled={currentPage === totalPages}>
                      <FiArrowRight />
                    </button>
                  </div>
                )}
              </div>
            </section>
          </div>
        </div>
      </main>

      <ConfirmacionBorradorModal
        isOpen={!!flujoPendiente}
        onClose={handleCloseModalOnly}
        onConfirm={handleConfirmStartNew}
        onContinueBorrador={handleCloseContinueDraft}
      />
    </div>
  );
}
