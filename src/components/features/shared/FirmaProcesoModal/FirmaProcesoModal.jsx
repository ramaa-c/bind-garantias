import React, { useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { FiX, FiUser, FiCheck, FiPenTool, FiDownload } from "react-icons/fi";
import { Button } from "../../../ui";
import { useEscape } from "../../../../hooks/useEscape";
import styles from "./FirmaProcesoModal.module.css";
import logoAfip from "../../../../assets/images/afip.svg";
import { useChannel } from "../../../../context/ChannelContext";

const PASOS = [
  { label: "Identidad", icon: <FiUser size={15} /> },
  { label: "Firmar", icon: <FiPenTool size={15} /> },
  { label: "Listo", icon: <FiCheck size={15} /> },
];

export default function FirmaProcesoModal({ isOpen, onClose }) {
  const navigate = useNavigate();
  const { channelInfo } = useChannel();
  const [paso, setPaso] = useState(1);

  useEscape(onClose, isOpen);
  if (!isOpen) return null;

  const handleFinalizar = () => {
    setPaso(1);
    onClose();
    navigate(`/${channelInfo?.id || "default"}/inicio`);
  };

  return createPortal(
    <div className={styles.overlay} onMouseDown={onClose}>
      <div className={styles.modal} onMouseDown={(e) => e.stopPropagation()}>
        {paso < 3 && (
          <button type="button" className={styles.closeBtn} onClick={onClose}>
            <FiX size={16} />
          </button>
        )}

        <div className={styles.modalMeta}>
          <span className={styles.modalBadge}>Firma electrónica</span>
        </div>

        <div className={styles.stepper}>
          {PASOS.map((p, i) => {
            const num = i + 1;
            const isActive = paso === num;
            const isDone = paso > num;
            return (
              <React.Fragment key={p.label}>
                <div className={styles.stepItem}>
                  <div
                    className={`${styles.stepCircle} ${isActive ? styles.stepActive : ""} ${isDone ? styles.stepDone : ""}`}
                  >
                    {isDone ? <FiCheck size={14} /> : p.icon}
                  </div>
                  <span
                    className={`${styles.stepLabel} ${isActive || isDone ? styles.stepLabelActive : ""}`}
                  >
                    {p.label}
                  </span>
                </div>
                {i < PASOS.length - 1 && (
                  <div
                    className={`${styles.stepLine} ${isDone ? styles.stepLineDone : ""}`}
                  />
                )}
              </React.Fragment>
            );
          })}
        </div>

        {/* CUERPO */}
        <div className={styles.body}>
          {/* PASO 1 */}
          {paso === 1 && (
            <>
              <h3 className={styles.bodyTitle}>Validá tu identidad</h3>
              <p className={styles.bodyText}>
                Antes de firmar, confirme que usted es el titular registrado en
                la plataforma.
              </p>
              <div className={styles.identityCard}>
                <span className={styles.identityEmail}>
                  asesoramiento@bindgarantias.com.ar
                </span>
                <FiCheck size={14} color="#4caf50" />
              </div>
              <p className={styles.identityName}>
                BIND ASESORAMIENTO · CUIT 30-71111111-2
              </p>
              <Button
                type="button"
                variant="primary"
                className={styles.btnAction}
                onClick={() => setPaso(2)}
              >
                Validar con AFIP
                <img src={logoAfip} alt="AFIP" className={styles.logoAfip} />
              </Button>
            </>
          )}

          {/* PASO 2 */}
          {paso === 2 && (
            <>
              <div className={styles.successIcon}>
                <FiCheck size={24} />
              </div>
              <h3 className={styles.bodyTitle}>Identidad verificada</h3>
              <p className={styles.bodyText}>
                Al presionar el botón confirma la firma electrónica de este
                documento. Esta acción es irrevocable.
              </p>
              <div className={styles.legalNotice}>
                La firma electrónica tiene plena validez jurídica conforme a la
                Ley 25.506 de Firma Digital de la República Argentina.
              </div>
              <Button
                type="button"
                variant="primary"
                className={styles.btnAction}
                onClick={() => setPaso(3)}
              >
                <FiPenTool size={14} /> Firmar Documento
              </Button>
            </>
          )}

          {/* PASO 3 */}
          {paso === 3 && (
            <>
              <div
                className={`${styles.successIcon} ${styles.successIconDone}`}
              >
                <FiCheck size={24} />
              </div>
              <h3 className={styles.bodyTitle}>¡Documento firmado!</h3>
              <p className={styles.bodyText}>
                El documento ha sido firmado electrónicamente con éxito.
                Recibirá una copia en su correo electrónico registrado.
              </p>
              <div className={styles.btnGroup}>
                <Button
                  type="button"
                  variant="outline"
                  className={styles.btnAction}
                >
                  <FiDownload size={13} /> Descargar copia
                </Button>
                <Button
                  type="button"
                  variant="primary"
                  className={styles.btnAction}
                  onClick={handleFinalizar}
                >
                  Finalizar
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}
