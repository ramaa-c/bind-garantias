import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  FiUsers,
  FiUser,
  FiPlus,
  FiChevronDown,
  FiEdit2,
  FiTrash2,
  FiMail,
  FiPhone,
  FiInfo,
} from "react-icons/fi";
import styles from "../../DocumentosLegajo.module.css";
import { RepresentanteModal } from "../../../RepresentanteModal/RepresentanteModal";
import { TerceroCdaEstado } from "../TerceroCdaEstado/TerceroCdaEstado";
import { Spinner } from "../../../../../ui/Spinner/Spinner";

export function RepresentantesSection({
  loadingSocios,
  representantes,
  handleEliminarRelacion,
  cargarSocios,
  socioIdActivo,
  tipoPersonaId,
}) {
  const [modalRepresentanteOpen, setModalRepresentanteOpen] = useState(false);
  const [editRepresentante, setEditRepresentante] = useState(null);
  const [expandedRep, setExpandedRep] = useState(null);
  const [portalTarget, setPortalTarget] = useState(null);
  const isAdmin =
    typeof window !== "undefined" && window.location.pathname.includes("/admin");
  // Persona Física llama "Apoderado" a este rol (mismo dato, ver
  // RepresentanteModal/useValidacionLegajo). Solo cambia el texto genérico
  // de la sección: el badge de cada fila ya distingue por rolId aparte.
  const esPersonaFisica = Number(tipoPersonaId) === 1;
  const etiqueta = esPersonaFisica ? "Apoderado" : "Representante";

  useEffect(() => {
    setPortalTarget(document.getElementById("socios-header-action-portal"));
  }, []);

  return (
    <div className={styles.sociosContainer}>
      {loadingSocios ? (
        <div className={styles.emptySlot} style={{ display: "flex", flexDirection: "column", gap: "0.875rem", padding: "2rem" }}>
          <Spinner size={36} />
          <p className={styles.emptyTitle} style={{ margin: 0 }}>
            Cargando {esPersonaFisica ? "apoderado" : "representantes legales"}...
          </p>
        </div>
      ) : (
        <div className={styles.sectionBlock}>
          {portalTarget && createPortal(
            <button
              type="button"
              className={`${styles.addButton} ${isAdmin ? styles.addButtonAdmin : ""}`}
              onClick={() => {
                setEditRepresentante(null);
                setModalRepresentanteOpen(true);
              }}
            >
              <FiPlus size={14} /> Agregar {etiqueta}
            </button>,
            portalTarget
          )}

          {representantes.length === 0 ? (
            <div
              className={styles.emptySlot}
              style={{ minHeight: "6rem", padding: "1.5rem" }}
            >
              <p className={styles.emptyTitle}>
                Sin {esPersonaFisica ? "apoderado registrado" : "representantes registrados"}
              </p>
              <span className={styles.emptyText}>
                Haga click en "Agregar {etiqueta}" para dar de alta.
              </span>
            </div>
          ) : (
            <div className={styles.sociosList}>
              {representantes.map((rep) => (
                <div key={rep.id} className={styles.socioCard}>
                  <div className={styles.socioCardHeaderRow}>
                    <button
                      type="button"
                      className={styles.socioCardBtn}
                      onClick={() =>
                        setExpandedRep(expandedRep === rep.id ? null : rep.id)
                      }
                    >
                      <div className={styles.socioAvatar}>
                        <FiUser size={16} />
                      </div>
                      <div className={styles.socioMainInfo}>
                        <span className={styles.socioName}>{rep.nombre}</span>
                        <span className={styles.socioCuit}>
                          CUIT: {rep.cuit}
                        </span>
                        <span
                          className={`${styles.roleBadge} ${styles.roleBadgeMobile} ${rep.rolId === 230 ? styles.roleRepresentante : styles.roleApoderado}`}
                        >
                          {rep.rolId === 230
                            ? "Representante Legal"
                            : "Apoderado"}
                        </span>
                      </div>
                      <span
                        className={`${styles.roleBadge} ${styles.roleBadgeDesktop} ${rep.rolId === 230 ? styles.roleRepresentante : styles.roleApoderado}`}
                      >
                        {rep.rolId === 230
                          ? "Representante Legal"
                          : "Apoderado"}
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
                        onClick={() => {
                          setEditRepresentante(rep);
                          setModalRepresentanteOpen(true);
                        }}
                        title={`Editar ${etiqueta}`}
                      >
                        <FiEdit2 size={13} />
                      </button>
                      <button
                        type="button"
                        className={`${styles.actionBtn} ${styles.actionBtnDelete}`}
                        onClick={() => handleEliminarRelacion(rep)}
                        title={`Eliminar ${etiqueta}`}
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
                      <div className={styles.socioDetail}>
                        <FiInfo className={styles.socioDetailIcon} />
                        <div>
                          <span className={styles.socioDetailLabel}>
                            Relación
                          </span>
                          <span className={styles.socioDetailVal}>
                            {rep.rolId === 230
                              ? "Representante Legal (Gerente Gral)"
                              : "Apoderado de Socio"}
                          </span>
                        </div>
                      </div>
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
              ))}
            </div>
          )}
        </div>
      )}

      <RepresentanteModal
        isOpen={modalRepresentanteOpen}
        onClose={() => {
          setModalRepresentanteOpen(false);
          setEditRepresentante(null);
        }}
        onSuccess={() => cargarSocios()}
        representante={editRepresentante}
        socioIdActivo={socioIdActivo}
        tipoPersonaId={tipoPersonaId}
      />
    </div>
  );
}
