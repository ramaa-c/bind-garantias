import React, { useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { FiX, FiUser, FiCheck, FiPenTool, FiDownload } from "react-icons/fi";
import { Button } from "../../../../ui";
import { useEscape } from "../../../../../hooks/useEscape";
import styles from "./ModalFirmaProceso.module.css";
import logoAfip from "../../../../../assets/images/afip.svg";

export default function ModalFirmaProceso({ isOpen, onClose }) {
  const navigate = useNavigate();
  const [paso, setPaso] = useState(1);

  useEscape(onClose, isOpen);

  if (!isOpen) return null;

  const handleNextStep = () => {
    setPaso((prev) => prev + 1);
  };

  const handleFinalizar = () => {
    setPaso(1);
    onClose();
    navigate("/inicio");
  };

  return createPortal(
    <div className={styles.modalOverlay} onMouseDown={onClose}>
      <div className={styles.modalContent} onMouseDown={(e) => e.stopPropagation()}>
        {paso < 3 && (
          <button type="button" className={styles.closeButton} onClick={onClose}>
            <FiX />
          </button>
        )}

        <div className={styles.stepper}>
          {/* Paso 1: Identidad */}
          <div className={styles.stepItem}>
            <div
              className={`${styles.stepCircle} ${paso >= 1 ? (paso > 1 ? styles.completed : styles.active) : ""}`}
            >
              {paso > 1 ? <FiCheck /> : <FiUser />}
            </div>
            <span
              className={`${styles.stepLabel} ${paso >= 1 ? styles.active : ""}`}
            >
              Identidad
            </span>
          </div>
          <div className={styles.stepperLine} />

          {/* Paso 2: Firmar */}
          <div className={styles.stepItem}>
            <div
              className={`${styles.stepCircle} ${paso >= 2 ? (paso > 2 ? styles.completed : styles.active) : ""}`}
            >
              {paso > 2 ? <FiCheck /> : <FiPenTool />}
            </div>
            <span
              className={`${styles.stepLabel} ${paso >= 2 ? styles.active : ""}`}
            >
              Firmar
            </span>
          </div>
          <div className={styles.stepperLine} />

          {/* Paso 3: Completado */}
          <div className={styles.stepItem}>
            <div
              className={`${styles.stepCircle} ${paso === 3 ? styles.completed : ""}`}
            >
              <FiCheck />
            </div>
            <span
              className={`${styles.stepLabel} ${paso === 3 ? styles.active : ""}`}
            >
              Completado
            </span>
          </div>
        </div>

        {/* CONTENIDO DINÁMICO POR PASO */}
        <div className={styles.stepBody}>
          {paso === 1 && (
            <>
              <h3 className={styles.stepTitle}>
                Por favor valide su identidad
              </h3>
              <div className={styles.userDataBox}>
                <span>asesoramiento@bindgarantias.com.ar</span>
                <FiCheck color="var(--yellow)" />
              </div>
              <Button
                type="button"
                variant="primary"
                className={`${styles.btnAccion} ${styles.btnAfip}`}
                onClick={handleNextStep}
              >
                Validar AFIP{" "}
                <img src={logoAfip} alt="AFIP" className={styles.logoAfip} />
              </Button>
              <p className={styles.userInfoText}>
                Registrado como BIND ASESORAMIENTO <br />
                CUIT 30-71111111-2
              </p>
            </>
          )}

          {paso === 2 && (
            <>
              <h3 className={styles.stepTitle}>Identidad verificada</h3>
              <p className={styles.userInfoText}>
                Al presionar el botón debajo, usted confirma la firma
                electrónica de este documento.
              </p>
              <Button
                type="button"
                variant="primary"
                className={styles.btnAccion}
                onClick={handleNextStep}
              >
                Firmar Documento
              </Button>
            </>
          )}

          {paso === 3 && (
            <>
              <h3 className={styles.stepTitle}>¡Gracias por firmar!</h3>
              <p className={styles.userInfoText}>
                El documento ha sido firmado electrónicamente con éxito.
                Recibirá una copia en su correo.
              </p>
              <Button
                type="button"
                variant="outline"
                className={styles.btnAccion}
                onClick={() => console.log("Descargando PDF...")}
              >
                <FiDownload style={{ marginRight: "8px" }} /> Descargar Copia
              </Button>
              <Button
                type="button"
                variant="primary"
                className={styles.btnAccion}
                onClick={handleFinalizar}
              >
                Finalizar
              </Button>
            </>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
