import React, { useState } from "react";
import { FiAlertTriangle } from "react-icons/fi";
import { Modal } from "../../../ui/Modal/Modal";
import { Button } from "../../../ui/Button/Button";
import { InputSimple } from "../../../ui/InputSimple/InputSimple";
import styles from "./RechazarSolicitudModal.module.css";

// El motivo escrito acá queda en TipoLimiteSocio.Observaciones (mismo campo
// que ya lee DetalleSolicitudModal.jsx del lado cliente para mostrar "Motivo
// del rechazo") — sin este paso, rechazar no dejaba ningún registro y el
// cliente siempre veía "No se registró un motivo específico".
// El caller monta esto con key={solicitud?.id ?? "none"} (ver Dashboard.jsx)
// para que el motivo arranque vacío en cada apertura, sin necesitar un
// useEffect que resetee estado.
export function RechazarSolicitudModal({ isOpen, onClose, onConfirm, solicitud, isLoading = false }) {
  const [motivo, setMotivo] = useState("");

  const handleConfirmar = () => {
    if (!motivo.trim() || isLoading) return;
    onConfirm(motivo.trim());
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Rechazar solicitud"
      maxWidth="480px"
      variant="blue"
      preventClose={isLoading}
    >
      <div className={styles.content}>
        <div className={styles.warningRow}>
          <FiAlertTriangle size={16} className={styles.warningIcon} />
          <p className={styles.lead}>
            Vas a rechazar la Solicitud N°{solicitud?.id}. El motivo que
            escribas acá lo va a ver el cliente en el detalle de su
            solicitud.
          </p>
        </div>

        <InputSimple
          type="textarea"
          label="Motivo del rechazo"
          value={motivo}
          onChange={setMotivo}
          variant="admin"
          disabled={isLoading}
          hideErrorSpace
        />

        <div className={styles.actions}>
          <Button variant="outlineBlue" onClick={onClose} disabled={isLoading}>
            Cancelar
          </Button>
          <Button
            variant="danger"
            onClick={handleConfirmar}
            isLoading={isLoading}
            disabled={!motivo.trim()}
          >
            Rechazar solicitud
          </Button>
        </div>
      </div>
    </Modal>
  );
}

export default RechazarSolicitudModal;
