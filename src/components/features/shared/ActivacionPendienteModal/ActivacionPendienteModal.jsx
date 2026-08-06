import React, { useRef, useState } from "react";
import { FiMail } from "react-icons/fi";
import { Modal } from "../../../ui/Modal/Modal";
import { Button } from "../../../ui/Button/Button";
import styles from "./ActivacionPendienteModal.module.css";

export function ActivacionPendienteModal({
  isOpen,
  onClose,
  email,
  onReenviar,
  isLoading = false,
}) {
  const isReenviandoRef = useRef(false);
  const [isReenviando, setIsReenviando] = useState(false);

  const bloqueado = isLoading || isReenviando;

  const handleReenviarClick = async () => {
    if (isReenviandoRef.current || bloqueado) return;
    isReenviandoRef.current = true;
    setIsReenviando(true);
    try {
      await onReenviar();
    } finally {
      isReenviandoRef.current = false;
      setIsReenviando(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="440px"
      variant="confirm"
      preventClose={bloqueado}
    >
      <div className={styles.dialog}>
        <div className={styles.sealRow}>
          <div className={styles.seal}>
            <FiMail />
          </div>
          <h2 className={styles.title}>Cuenta pendiente de activación</h2>
        </div>

        <div className={styles.perforation} />

        <p className={styles.mensaje}>
          El correo{" "}
          <span className={styles.emailChip}>{email}</span> ya está
          registrado, pero todavía no se completó la activación de la cuenta.
        </p>
        <p className={styles.mensaje}>
          Te reenviamos el enlace de verificación para terminar el proceso
          desde ahí.
        </p>

        <div className={styles.perforation} />

        <div className={styles.actions}>
          <Button variant="outline" onClick={onClose} disabled={bloqueado}>
            Cancelar
          </Button>
          <Button
            variant="primary"
            onClick={handleReenviarClick}
            disabled={bloqueado}
            isLoading={bloqueado}
          >
            {bloqueado ? "Reenviando..." : "Reenviar correo"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

export default ActivacionPendienteModal;
