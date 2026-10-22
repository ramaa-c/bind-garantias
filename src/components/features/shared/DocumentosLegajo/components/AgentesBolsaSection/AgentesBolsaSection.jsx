import React, { useState } from "react";
import { createPortal } from "react-dom";
import { FiBriefcase, FiPlus } from "react-icons/fi";
import styles from "../../DocumentosLegajo.module.css";
import s from "../TerceroCard/TerceroCard.module.css";
import { TerceroCard, TerceroEmpty } from "../TerceroCard/TerceroCard";
import { BolsaModal } from "../BolsaModal/BolsaModal";
import { Spinner } from "../../../../../ui/Spinner/Spinner";
import { usePortalTarget } from "../../../../../../hooks/usePortalTarget";

export function AgentesBolsaSection({
  loadingSocios,
  agentesBolsa,
  handleEliminarRelacion,
  cargarSocios,
  socioIdActivo,
}) {
  const [modalBolsaOpen, setModalBolsaOpen] = useState(false);
  const [editBolsa, setEditBolsa] = useState(null);
  const portalTarget = usePortalTarget("socios-header-action-portal");
  const isAdmin =
    typeof window !== "undefined" && window.location.pathname.includes("/admin");

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
              className={`${styles.addButton} ${isAdmin ? styles.addButtonAdmin : ""}`}
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
            <TerceroEmpty
              icon={<FiBriefcase size={20} />}
              titulo="Todavía no vinculaste agentes de bolsa"
              hint="Usá «Vincular Agente de Bolsa» para asociar tu cuenta comitente."
            />
          ) : (
            <div className={s.lista}>
              {/* Sin validación de datos propia: tarjeta neutra, sin chip de
                  estado ni detalle desplegable (como antes). */}
              {agentesBolsa.map((bolsa) => (
                <TerceroCard
                  key={bolsa.id}
                  nombre={bolsa.nombre}
                  detalle={
                    <>
                      Comitente:{" "}
                      <strong style={{ color: "var(--white)" }}>
                        {bolsa.nrosubcuentacaja || "—"}
                      </strong>
                    </>
                  }
                  validado={false}
                  isAdmin={isAdmin}
                  onEdit={() => {
                    setEditBolsa(bolsa);
                    setModalBolsaOpen(true);
                  }}
                  onDelete={() => handleEliminarRelacion(bolsa)}
                  editTitle="Editar Cuenta Comitente"
                  deleteTitle="Desvincular Agente"
                />
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
