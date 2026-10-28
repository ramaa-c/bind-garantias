import React, { useState } from "react";
import { FiEye, FiFileText, FiX } from "react-icons/fi";
import { Modal } from "../../../ui/Modal/Modal";
import { Button } from "../../../ui/Button/Button";
import { InputSimple } from "../../../ui/InputSimple/InputSimple";
import { FichaModal } from "../FichaModal/FichaModal";
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
      icono={<FiX />}
      tono="peligro"
      maxWidth="520px"
      variant="blue"
      preventClose={isLoading}
      footer={
        <>
          <Button variant="adminNeutro" onClick={onClose} disabled={isLoading}>
            Cancelar
          </Button>
          <Button variant="adminPeligro" onClick={handleConfirmar} isLoading={isLoading} disabled={!motivo.trim()}>
            Rechazar solicitud
          </Button>
        </>
      }
    >
      <div className={styles.content}>
        <FichaModal
          nombre={`Solicitud N° ${solicitud?.id ?? ""}${solicitud?.cliente ? ` · ${solicitud.cliente}` : ""}`}
          detalle={[solicitud?.tipo, solicitud?.monto && `${solicitud.moneda || ""} ${solicitud.monto}`.trim()].filter(Boolean).join(" · ")}
          icono={<FiFileText />}
        />

        <div className={styles.campo}>
          <InputSimple
            type="textarea"
            label="Motivo del rechazo"
            value={motivo}
            onChange={setMotivo}
            variant="admin"
            disabled={isLoading}
            hideErrorSpace
          />
          <span className={styles.ayuda}>
            <FiEye aria-hidden="true" />
            El cliente ve este motivo en el detalle de su solicitud.
          </span>
        </div>
      </div>
    </Modal>
  );
}

export default RechazarSolicitudModal;
