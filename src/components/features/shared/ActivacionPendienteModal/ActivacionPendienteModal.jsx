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
          <h2 className={styles.title}>Activación de cuenta</h2>
        </div>

        <div className={styles.perforation} />

        <p className={styles.mensaje}>
          Si el correo <span className={styles.emailChip}>{email}</span> tiene
          una cuenta pendiente de activación, te enviamos un enlace para
          completarla.
        </p>
        <p className={styles.mensaje}>
          Si la cuenta ya está activa, el mismo enlace te permite crear una
          nueva contraseña.
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
            {bloqueado ? "Enviando..." : "Enviar enlace"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

export default ActivacionPendienteModal;
