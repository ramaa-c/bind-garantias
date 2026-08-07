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
  FiXCircle,
} from "react-icons/fi";
import styles from "../../DocumentosLegajo.module.css";
import { RepresentanteLegalModal } from "../../../RepresentanteLegalModal/RepresentanteLegalModal";
import { TerceroCdaEstado } from "../TerceroCdaEstado/TerceroCdaEstado";
import { Spinner } from "../../../../../ui/Spinner/Spinner";
import { useEstadoCdaTerceros } from "../../../../../../hooks/useTerceros";

// Solo Representante Legal (TipoRelacionSocioID 230, persona jurídica) -
// Apoderado tiene su propia pestaña/sección (ver ApoderadosSection), no
// aparece más acá. No pide DNI frente/dorso (a diferencia de Accionistas):
// este modal no tiene forma de cargarlo, ver useValidacionLegajo.
export function RepresentantesSection({
  loadingSocios,
  representantes,
  handleEliminarRelacion,
  cargarSocios,
  socioIdActivo,
}) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editRepresentante, setEditRepresentante] = useState(null);
  const [expandedRep, setExpandedRep] = useState(null);
  const [portalTarget, setPortalTarget] = useState(null);
  const isAdmin =
    typeof window !== "undefined" && window.location.pathname.includes("/admin");

  const { data: estadoCdaMap } = useEstadoCdaTerceros(representantes.map((r) => r.id));

  const abrirModal = (rep = null) => {
    setEditRepresentante(rep);
    setModalOpen(true);
  };
  const cerrarModal = () => {
    setModalOpen(false);
    setEditRepresentante(null);
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
            Cargando representantes legales...
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
              <FiPlus size={14} /> Agregar Representante Legal
            </button>,
            portalTarget
          )}

          {representantes.length === 0 ? (
            <div
              className={styles.emptySlot}
              style={{ minHeight: "6rem", padding: "1.5rem" }}
            >
              <p className={styles.emptyTitle}>Sin representantes registrados</p>
              <span className={styles.emptyText}>
                Haga click en "Agregar Representante Legal" para dar de alta.
              </span>
            </div>
          ) : (
            <div className={styles.sociosList}>
              {representantes.map((rep) => {
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

                const cdaRechazado = estadoCdaMap?.get(Number(rep.id)) === "rechazado";

                return (
                <div key={rep.id} className={`${styles.socioCard} ${cdaRechazado ? styles.socioCardRejected : faltantes.length > 0 ? styles.socioCardWarning : styles.socioCardSuccess}`}>
                  {cdaRechazado && (
                    <div className={styles.socioRejectedBanner}>
                      <FiXCircle size={14} />
                      <span>Esta persona no superó las validaciones de aceptación correspondientes. Comunicate con nosotros para que la revisemos.</span>
                    </div>
                  )}
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
                          className={`${styles.roleBadge} ${styles.roleBadgeMobile} ${styles.roleRepresentante}`}
                        >
                          Representante Legal
                        </span>
                      </div>
                      <span
                        className={`${styles.roleBadge} ${styles.roleBadgeDesktop} ${styles.roleRepresentante}`}
                      >
                        Representante Legal
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
                        title="Editar Representante Legal"
                      >
                        <FiEdit2 size={13} />
                      </button>
                      <button
                        type="button"
                        className={`${styles.actionBtn} ${styles.actionBtnDelete}`}
                        onClick={() => handleEliminarRelacion(rep)}
                        title="Eliminar Representante Legal"
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

      <RepresentanteLegalModal
        isOpen={modalOpen}
        onClose={cerrarModal}
        onSuccess={() => cargarSocios()}
        representante={editRepresentante}
        socioIdActivo={socioIdActivo}
      />
    </div>
  );
}
