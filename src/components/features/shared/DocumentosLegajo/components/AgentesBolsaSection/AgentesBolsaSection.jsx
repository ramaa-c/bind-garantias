import React, { useState } from "react";
import { FiUsers, FiBriefcase, FiPlus, FiEdit2, FiTrash2 } from "react-icons/fi";
import styles from "../../DocumentosLegajo.module.css";
import { BolsaModal } from "../BolsaModal/BolsaModal";
import { Spinner } from "../../../../../ui";

export function AgentesBolsaSection({
  loadingSocios,
  agentesBolsa,
  handleEliminarRelacion,
  cargarSocios,
  socioIdActivo,
}) {
  const [modalBolsaOpen, setModalBolsaOpen] = useState(false);
  const [editBolsa, setEditBolsa] = useState(null);

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
          <div className={styles.sectionHeader}>
            <div className={styles.sectionHeaderLeft}>
              <FiBriefcase className={styles.sectionIcon} size={18} />
              <h5 className={styles.sectionTitle}>
                Agentes de Bolsa
              </h5>
            </div>
            <button
              type="button"
              className={styles.addButton}
              onClick={() => {
                setEditBolsa(null);
                setModalBolsaOpen(true);
              }}
            >
              <FiPlus size={14} /> Vincular Agente de Bolsa
            </button>
          </div>

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
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: "1rem",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.75rem",
                      }}
                    >
                      <div className={styles.socioAvatar}>
                        <FiBriefcase size={16} />
                      </div>
                      <div>
                        <span
                          className={styles.socioName}
                          style={{ display: "block" }}
                        >
                          {bolsa.nombre}
                        </span>
                        <span
                          className={styles.socioCuit}
                          style={{
                            display: "block",
                            marginTop: "0.15rem",
                          }}
                        >
                          Comitente:{" "}
                          <strong style={{ color: "#fff" }}>
                            {bolsa.nrosubcuentacaja || "—"}
                          </strong>
                        </span>
                      </div>
                    </div>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.5rem",
                      }}
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
