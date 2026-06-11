import React, { useState, useEffect } from "react";
import { FiEdit, FiCheck } from "react-icons/fi";
import { toast } from "sonner";
import { useObtenerCdasPorCadenaId } from "../../../../hooks/useCadenaValor";
import { InputSimple, Button, Spinner, Modal } from "../../../ui";
import { CadenaHeaderCard } from "../CadenaHeaderCard/CadenaHeaderCard";
import styles from "./CdaPanel.module.css";

export const CdaPanel = ({ activeItem }) => {
  const { data: cdas, isLoading: isLoadingCdas } = useObtenerCdasPorCadenaId(
    activeItem?.cadenavalorid
  );

  const [localCdasStatus, setLocalCdasStatus] = useState({});
  const [customRechazoMsgs, setCustomRechazoMsgs] = useState({});
  const [editingCda, setEditingCda] = useState(null);
  const [tempRechazoMsg, setTempRechazoMsg] = useState("");

  const cdasList = Array.isArray(cdas) ? cdas : cdas?.items || cdas?.data || [];

  useEffect(() => {
    const status = {};
    cdasList.forEach(cda => {
      status[cda.cdaid] = true;
    });
    setLocalCdasStatus(status);
  }, [cdas]);

  const handleToggleCda = (cdaId) => {
    setLocalCdasStatus(prev => {
      const nextStatus = !prev[cdaId];
      const targetCdaDesc = cdasList.find(c => c.cdaid === cdaId)?.descripcion || `CDA ID ${cdaId}`;
      toast.success(`CDA "${targetCdaDesc}" ${nextStatus ? 'habilitado' : 'deshabilitado'} (Simulado)`);
      return {
        ...prev,
        [cdaId]: nextStatus
      };
    });
  };

  if (isLoadingCdas) {
    return (
      <div style={{ padding: "2rem", display: "flex", justifyContent: "center" }}>
        <Spinner size={50} />
      </div>
    );
  }

  return (
    <div>
      <CadenaHeaderCard
        denominacion={activeItem?.denominacion}
        logo={activeItem?.logo}
        referencia={activeItem?.referencia}
        cadenavalorid={activeItem?.cadenavalorid}
        cuittercero={activeItem?.cuittercero}
      />
      <p style={{ fontSize: "0.825rem", color: "#8b949e", marginBottom: "1.25rem", lineHeight: "1.4" }}>
        Seleccioná los CDAs que se deben ejecutar durante la validación de esta cadena de valor. Las modificaciones son simuladas en este panel de control.
      </p>
      <div className={styles.cdasSection}>
        <div className={styles.cdasTitle}>Configuración de CDAs</div>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", marginTop: "1rem" }}>
          {cdasList.length === 0 ? (
            <div style={{ padding: "2rem", textAlign: "center", color: "#8b949e", border: "1px dashed #30363d", borderRadius: "0.5rem" }}>
              No hay CDAs vinculados a esta cadena de valor.
            </div>
          ) : (
            cdasList.map((cda) => {
              const isChecked = localCdasStatus[cda.cdaid] !== false;
              const mensajeRechazoActual = customRechazoMsgs[cda.cdaid] !== undefined
                ? customRechazoMsgs[cda.cdaid]
                : cda.mensajerechazo;

              return (
                <div
                  key={cda.cdaid}
                  className={`${styles.cdaCard} ${isChecked ? styles.cdaCardChecked : ""}`}
                >
                  <div className={styles.checkboxWrapper} onClick={() => handleToggleCda(cda.cdaid)}>
                    <div className={`${styles.customCheckbox} ${isChecked ? styles.checked : ""}`}>
                      {isChecked && <FiCheck size={14} className={styles.checkmarkIcon} />}
                    </div>
                  </div>
                  <div
                    className={styles.cdaContent}
                    onClick={() => handleToggleCda(cda.cdaid)}
                  >
                    <strong className={styles.cdaTitleText}>{cda.descripcion}</strong>
                    {mensajeRechazoActual && (
                      <span className={styles.cdaRechazoText}>
                        Mensaje rechazo: {mensajeRechazoActual}
                      </span>
                    )}
                  </div>
                  <div className={styles.actionsWrapper}>
                    <button
                      type="button"
                      title="Editar mensaje de rechazo"
                      className={styles.btnActionEdit}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setEditingCda(cda);
                        setTempRechazoMsg(mensajeRechazoActual || "");
                      }}
                    >
                      <FiEdit size={12} />
                    </button>
                    <span className={`${styles.cdaStatusBadge} ${isChecked ? styles.badgeActive : styles.badgeInactive}`}>
                      {isChecked ? "Activo" : "Inactivo"}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      <Modal
        isOpen={!!editingCda}
        onClose={() => setEditingCda(null)}
        title="EDITAR MENSAJE DE RECHAZO"
        maxWidth="500px"
        variant="blue"
      >
        {editingCda && (
          <>
            <p style={{ fontSize: "0.875rem", color: "#8b949e", marginBottom: "1.25rem" }}>
              Modifique el mensaje que se mostrará cuando se rechace la validación de este CDA:
            </p>
            <div style={{ marginBottom: "1rem" }}>
              <strong style={{ color: "#ffffff", display: "block", marginBottom: "0.5rem", fontSize: "0.9rem" }}>
                {editingCda.descripcion}
              </strong>
            </div>
            <InputSimple
              label="Mensaje de Rechazo"
              value={tempRechazoMsg}
              onChange={val => setTempRechazoMsg(val)}
            />
            <div className={styles.modalFooter}>
              <Button variant="outlineBlue" onClick={() => setEditingCda(null)}>
                CANCELAR
              </Button>
              <Button
                variant="blue"
                onClick={() => {
                  setCustomRechazoMsgs(prev => ({
                    ...prev,
                    [editingCda.cdaid]: tempRechazoMsg
                  }));
                  setEditingCda(null);
                  toast.success("Mensaje de rechazo actualizado (Simulado)");
                }}
              >
                GUARDAR
              </Button>
            </div>
          </>
        )}
      </Modal>
    </div>
  );
};
