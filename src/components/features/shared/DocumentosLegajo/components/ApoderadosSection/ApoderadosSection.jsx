import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  FiUser,
  FiPlus,
  FiChevronDown,
  FiEdit2,
  FiTrash2,
  FiMail,
  FiPhone,
  FiMapPin,
  FiAlertCircle,
} from "react-icons/fi";
import styles from "../../DocumentosLegajo.module.css";
import { ApoderadoModal } from "../../../ApoderadoModal/ApoderadoModal";
import { TerceroCdaEstado } from "../TerceroCdaEstado/TerceroCdaEstado";
import { Spinner } from "../../../../../ui/Spinner/Spinner";

// Solo Apoderado (TipoRelacionSocioID 210) - aplica tanto a persona física
// como jurídica. Representante Legal tiene su propia pestaña/sección (ver
// RepresentantesSection). No pide DNI frente/dorso (a diferencia de
// Accionistas): este modal no tiene forma de cargarlo, ver useValidacionLegajo.
export function ApoderadosSection({
  loadingSocios,
  apoderados,
  handleEliminarRelacion,
  cargarSocios,
  socioIdActivo,
}) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editApoderado, setEditApoderado] = useState(null);
  const [expandedRep, setExpandedRep] = useState(null);
  const [portalTarget, setPortalTarget] = useState(null);
  const isAdmin =
    typeof window !== "undefined" && window.location.pathname.includes("/admin");

  const abrirModal = (rep = null) => {
    setEditApoderado(rep);
    setModalOpen(true);
  };
  const cerrarModal = () => {
    setModalOpen(false);
    setEditApoderado(null);
  };

  useEffect(() => {
    setPortalTarget(document.getElementById("socios-header-action-portal"));
  }, []);

  return (
    <div className={styles.sociosContainer}>
      {loadingSocios ? (
        <div className={styles.emptySlot} style={{ display: "flex", flexDirection: "column", gap: "0.875rem", padding: "2rem" }}>
          <Spinner size={36} />
          <p className={styles.emptyTitle} style={{ margin: 0 }}>
            Cargando apoderados...
          </p>
        </div>
      ) : (
        <div className={styles.sectionBlock}>
          {portalTarget && createPortal(
            <button
              type="button"
              className={`${styles.addButton} ${isAdmin ? styles.addButtonAdmin : ""}`}
              onClick={() => abrirModal()}
            >
              <FiPlus size={14} /> Agregar Apoderado
            </button>,
            portalTarget
          )}

          {apoderados.length === 0 ? (
            <div
              className={styles.emptySlot}
              style={{ minHeight: "6rem", padding: "1.5rem" }}
            >
              <p className={styles.emptyTitle}>Sin apoderados registrados</p>
              <span className={styles.emptyText}>
                Haga click en "Agregar Apoderado" para dar de alta.
              </span>
            </div>
          ) : (
            <div className={styles.sociosList}>
              {apoderados.map((rep) => {
                const faltantes = [];
                const sEmail = rep.email || rep.mail || rep.Mail || "";
                const sCel = rep.celular || rep.telefono || rep.Telefono || "";
                const sDir = rep.direccion || rep.calle || "";
                const sProv = rep.provincia || rep.provinciaid || "";

                if (!sEmail) faltantes.push("Email");
                if (!sCel) faltantes.push("Teléfono");
                if (!sDir || !sProv) faltantes.push("Domicilio completo");

                const cuitLimpio = String(rep.cuit || "").replace(/\D/g, "");
                if (!cuitLimpio) faltantes.push("CUIT válido");

                return (
                <div key={rep.id} className={`${styles.socioCard} ${faltantes.length > 0 ? styles.socioCardWarning : styles.socioCardSuccess}`}>
                  <div className={styles.socioCardHeaderRow}>
                    <button
                      type="button"
                      className={styles.socioCardBtn}
                      onClick={() =>
                        setExpandedRep(expandedRep === rep.id ? null : rep.id)
                      }
                    >
                      {faltantes.length > 0 && (
                        <div className={styles.socioWarningWrapper}>
                          <FiAlertCircle className={styles.socioWarningIcon} />
                          <div className={styles.socioWarningTooltip}>
                            <strong>Faltan datos obligatorios:</strong>
                            <ul>
                              {faltantes.map((f, i) => (
                                <li key={i}>{f}</li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      )}
                      <div className={styles.socioAvatar}>
                        <FiUser size={16} />
                      </div>
                      <div className={styles.socioMainInfo}>
                        <span className={styles.socioName}>{rep.nombre}</span>
                        <span className={styles.socioCuit}>
                          CUIT: {rep.cuit}
                        </span>
                        <span
                          className={`${styles.roleBadge} ${styles.roleBadgeMobile} ${styles.roleApoderado}`}
                        >
                          Apoderado
                        </span>
                      </div>
                      <span
                        className={`${styles.roleBadge} ${styles.roleBadgeDesktop} ${styles.roleApoderado}`}
                      >
                        Apoderado
                      </span>
                      <FiChevronDown
                        className={`${styles.socioChevron} ${expandedRep === rep.id ? styles.socioChevronOpen : ""}`}
                      />
                    </button>
                    <div
                      className={styles.socioHeaderActions}
                      style={{ paddingRight: "1rem" }}
                    >
                      <button
                        type="button"
                        className={`${styles.actionBtn} ${styles.actionBtnEdit} ${isAdmin ? styles.actionBtnEditAdmin : ""}`}
                        onClick={() => abrirModal(rep)}
                        title="Editar Apoderado"
                      >
                        <FiEdit2 size={13} />
                      </button>
                      <button
                        type="button"
                        className={`${styles.actionBtn} ${styles.actionBtnDelete}`}
                        onClick={() => handleEliminarRelacion(rep)}
                        title="Eliminar Apoderado"
                      >
                        <FiTrash2 size={13} />
                      </button>
                    </div>
                  </div>

                  <div
                    className={`${styles.socioExpand} ${expandedRep === rep.id ? styles.socioExpandOpen : ""}`}
                  >
                    <div className={styles.socioDetailGrid}>
                      {rep.email && (
                        <div className={styles.socioDetail}>
                          <FiMail className={styles.socioDetailIcon} />
                          <div>
                            <span className={styles.socioDetailLabel}>
                              Email
                            </span>
                            <span className={styles.socioDetailVal}>
                              {rep.email}
                            </span>
                          </div>
                        </div>
                      )}
                      {rep.telefono && (
                        <div className={styles.socioDetail}>
                          <FiPhone className={styles.socioDetailIcon} />
                          <div>
                            <span className={styles.socioDetailLabel}>
                              Celular / Teléfono
                            </span>
                            <span className={styles.socioDetailVal}>
                              {rep.telefono}
                            </span>
                          </div>
                        </div>
                      )}
                      {rep.direccion && (
                        <div className={styles.socioDetail}>
                          <FiMapPin className={styles.socioDetailIcon} />
                          <div>
                            <span className={styles.socioDetailLabel}>
                              Dirección
                            </span>
                            <span className={styles.socioDetailVal}>
                              {rep.direccion}
                              {rep.codpos ? ` (${rep.codpos})` : ""}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                    {isAdmin && (
                      <TerceroCdaEstado
                        terceroId={rep.id}
                        cuit={rep.cuit}
                        socioIdActivo={socioIdActivo}
                      />
                    )}
                  </div>
                </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      <ApoderadoModal
        isOpen={modalOpen}
        onClose={cerrarModal}
        onSuccess={() => cargarSocios()}
        representante={editApoderado}
        socioIdActivo={socioIdActivo}
      />
    </div>
  );
}
