import React, { useState } from "react";
import { FiLink, FiAlertTriangle } from "react-icons/fi";
import { Modal } from "../../../ui/Modal/Modal";
import { Button } from "../../../ui/Button/Button";
import styles from "./VinculacionModal.module.css";

// Confirmación de "esta es mi empresa" antes de vincularla al usuario (es
// irreversible). A diferencia del ConfirmacionModal genérico, muestra la
// empresa destacada y exige marcar un check antes de habilitar Confirmar,
// para evitar confirmaciones por error. Un vendor no vincula "su" empresa
// sino una que va a gestionar: mismos pasos, textos en tercera persona.
export default function VinculacionModal({
  isOpen,
  onClose,
  onConfirm,
  nombreEmpresa,
  cuit,
  esVendor = false,
}) {
  const [confirmado, setConfirmado] = useState(false);
  const [prevIsOpen, setPrevIsOpen] = useState(isOpen);

  // Cada vez que se abre arranca sin marcar.
  if (isOpen !== prevIsOpen) {
    setPrevIsOpen(isOpen);
    if (isOpen) setConfirmado(false);
  }

  const inicial = (nombreEmpresa || "").trim().charAt(0).toUpperCase() || "?";

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="32.5rem"
      hideCloseButton
      footer={
        <div className={styles.acciones}>
          <Button variant="outline" onClick={onClose} className={styles.boton}>
            Volver a revisar
          </Button>
          <Button
            variant="primary"
            onClick={onConfirm}
            disabled={!confirmado}
            className={styles.boton}
          >
            Confirmar y continuar
          </Button>
        </div>
      }
    >
      <div className={styles.cuerpo}>
        <div className={styles.cabecera}>
          <span className={styles.icono} aria-hidden="true">
            <FiLink />
          </span>
          <h2 className={styles.titulo}>{esVendor ? "Confirmá la empresa" : "Confirmá tu empresa"}</h2>
        </div>

        <p className={styles.texto}>
          {esVendor
            ? "Vas a sumar esta empresa a las que gestionás:"
            : "Vas a vincular esta empresa a tu usuario:"}
        </p>

        <div className={styles.empresa}>
          <span className={styles.avatar} aria-hidden="true">
            {inicial}
          </span>
          <div className={styles.empresaTexto}>
            <strong>{nombreEmpresa}</strong>
            <span>CUIT {cuit}</span>
          </div>
        </div>

        <p className={styles.aviso}>
          <FiAlertTriangle aria-hidden="true" />
          {esVendor
            ? "Una vez que confirmes queda vinculada a tu usuario. Asegurate de que sea la correcta."
            : "Una vez que confirmes no vas a poder cambiarla. Asegurate de que sea la correcta."}
        </p>

        <label
          className={`${styles.check} ${confirmado ? styles.checkMarcado : ""}`}
        >
          <input
            type="checkbox"
            checked={confirmado}
            onChange={(e) => setConfirmado(e.target.checked)}
          />
          <span>
            {esVendor
              ? "Confirmo que es la empresa que voy a gestionar y que los datos son correctos."
              : "Confirmo que esta es mi empresa y que los datos son correctos."}
          </span>
        </label>
      </div>
    </Modal>
  );
}
