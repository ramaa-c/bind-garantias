import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { FiUsers, FiBriefcase, FiPlus, FiEdit2, FiTrash2 } from "react-icons/fi";
import styles from "../../DocumentosLegajo.module.css";
import { BolsaModal } from "../BolsaModal/BolsaModal";
import { Spinner } from "../../../../../ui/Spinner/Spinner";

export function AgentesBolsaSection({
  loadingSocios,
  agentesBolsa,
  handleEliminarRelacion,
  cargarSocios,
  socioIdActivo,
}) {
  const [modalBolsaOpen, setModalBolsaOpen] = useState(false);
  const [editBolsa, setEditBolsa] = useState(null);
  const [portalTarget, setPortalTarget] = useState(null);

  useEffect(() => {
    setPortalTarget(document.getElementById("socios-header-action-portal"));
  }, []);

  return (
    <div className={styles.sociosContainer}>
      {loadingSocios ? (
        <div className={styles.emptySlot} style={{ display: "flex", flexDirection: "column", gap: "0.875rem", padding: "2rem" }}>
          <Spinner size={36} />
          <p className={styles.emptyTitle} style={{ margin: 0 }}>
            Cargando agentes de bolsa...
          </p>
        </div>
      ) : (
        <div className={styles.sectionBlock}>
          {portalTarget && createPortal(
            <button
              type="button"
              className={styles.addButton}
              onClick={() => {
                setEditBolsa(null);
                setModalBolsaOpen(true);
              }}
            >
              <FiPlus size={14} /> Vincular Agente de Bolsa
            </button>,
            portalTarget
          )}

          {agentesBolsa.length === 0 ? (
            <div
              className={styles.emptySlot}
              style={{ minHeight: "6rem", padding: "1.5rem" }}
            >
              <p className={styles.emptyTitle}>
                Sin agentes de bolsa vinculados
              </p>
              <span className={styles.emptyText}>
                Haga click en "Vincular Agente" para asociar su cuenta.
              </span>
            </div>
          ) : (
            <div className={styles.sociosList}>
              {agentesBolsa.map((bolsa) => (
                <div
                  key={bolsa.id}
                  className={styles.socioCard}
                  style={{ padding: "0.875rem 1rem" }}
                >
                  <div className={styles.socioCardHeaderRow}>
                    <div
                      className={styles.socioCardBtn}
                      style={{ cursor: "default" }}
                    >
                      <div className={styles.socioAvatar}>
                        <FiBriefcase size={16} />
                      </div>
                      <div className={styles.socioMainInfo}>
                        <span className={styles.socioName}>
                          {bolsa.nombre}
                        </span>
                        <span className={styles.socioCuit} style={{ marginTop: "0.15rem" }}>
                          Comitente:{" "}
                          <strong style={{ color: "#fff" }}>
                            {bolsa.nrosubcuentacaja || "—"}
                          </strong>
                        </span>
                      </div>
                    </div>
                    <div
                      className={styles.socioHeaderActions}
                      style={{ paddingRight: "1rem" }}
                    >
                      <button
                        type="button"
                        className={`${styles.actionBtn} ${styles.actionBtnEdit}`}
                        onClick={() => {
                          setEditBolsa(bolsa);
                          setModalBolsaOpen(true);
                        }}
                        title="Editar Cuenta Comitente"
                      >
                        <FiEdit2 size={13} />
                      </button>
                      <button
                        type="button"
                        className={`${styles.actionBtn} ${styles.actionBtnDelete}`}
                        onClick={() => handleEliminarRelacion(bolsa)}
                        title="Desvincular Agente"
                      >
                        <FiTrash2 size={13} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <BolsaModal
        isOpen={modalBolsaOpen}
        onClose={() => {
          setModalBolsaOpen(false);
          setEditBolsa(null);
        }}
        onSuccess={() => cargarSocios()}
        agenteBolsa={editBolsa}
        socioIdActivo={socioIdActivo}
      />
    </div>
  );
}
