import React, { useState } from "react";
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
import { RepresentanteModal } from "../RepresentanteModal/RepresentanteModal";

export function RepresentantesSection({
  loadingSocios,
  representantes,
  handleEliminarRelacion,
  cargarSocios,
  socioIdActivo,
}) {
  const [modalRepresentanteOpen, setModalRepresentanteOpen] = useState(false);
  const [editRepresentante, setEditRepresentante] = useState(null);
  const [expandedRep, setExpandedRep] = useState(null);

  return (
    <div className={styles.sociosContainer}>
      {loadingSocios ? (
        <div className={styles.emptySlot}>
          <FiUsers size={20} className={styles.emptyIcon} />
          <p className={styles.emptyTitle}>
            Cargando representantes legales...
          </p>
        </div>
      ) : (
        <div className={styles.sectionBlock}>
          <div className={styles.sectionHeader}>
            <div className={styles.sectionHeaderLeft}>
              <FiUser className={styles.sectionIcon} size={18} />
              <h5 className={styles.sectionTitle}>
                Representantes Legales y Apoderados
              </h5>
            </div>
            <button
              type="button"
              className={styles.addButton}
              onClick={() => {
                setEditRepresentante(null);
                setModalRepresentanteOpen(true);
              }}
            >
              <FiPlus size={14} /> Agregar Representante
            </button>
          </div>

          {representantes.length === 0 ? (
            <div
              className={styles.emptySlot}
              style={{ minHeight: "6rem", padding: "1.5rem" }}
            >
              <p className={styles.emptyTitle}>
                Sin representantes registrados
              </p>
              <span className={styles.emptyText}>
                Haga click en "Agregar Representante" para dar de alta.
              </span>
            </div>
          ) : (
            <div className={styles.sociosList}>
              {representantes.map((rep) => (
                <div key={rep.id} className={styles.socioCard}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      width: "100%",
                    }}
                  >
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
                      </div>
                      <span
                        className={`${styles.roleBadge} ${rep.rolId === 230 ? styles.roleRepresentante : styles.roleApoderado}`}
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
                        className={`${styles.actionBtn} ${styles.actionBtnEdit}`}
                        onClick={() => {
                          setEditRepresentante(rep);
                          setModalRepresentanteOpen(true);
                        }}
                        title="Editar Representante"
                      >
                        <FiEdit2 size={13} />
                      </button>
                      <button
                        type="button"
                        className={`${styles.actionBtn} ${styles.actionBtnDelete}`}
                        onClick={() => handleEliminarRelacion(rep)}
                        title="Eliminar Representante"
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
      />
    </div>
  );
}
