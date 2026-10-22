import React from "react";
import { FiLock } from "react-icons/fi";
import { Modal } from "../../../ui/Modal/Modal";
import { Button } from "../../../ui/Button/Button";
import styles from "./AvisoBloqueoLegajoModal.module.css";

// Aviso "fuerte" (igual criterio que MigracionExitosaModal, en ámbar)
// para el caso opuesto: el socio no pasó el CDA de PANTALLA_INGRESO_CUIT y
// no va a poder cargar ni modificar nada del legajo/documentación hasta que
// se resuelva. Se dispara una sola vez al entrar a la pantalla de Legajo
// (ver SociosView.jsx) - la razón sigue visible después en el banner de
// LegajoUniversalBar, esto es solo para que no pase desapercibido.
export function AvisoBloqueoLegajoModal({ isOpen, onClose, motivos = [] }) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} maxWidth="460px" variant="confirm">
      <div className={styles.content}>
        <div className={styles.head}>
          <span className={styles.tile} aria-hidden="true">
            <FiLock />
          </span>
          <div className={styles.texto}>
            <h2 className={styles.title}>No podés avanzar por ahora</h2>
            <p className={styles.mensaje}>
              Podés moverte entre Legajo y Documentación para revisar tus datos,
              pero no vas a poder cargar ni modificar nada hasta que se resuelva
              lo siguiente:
            </p>
          </div>
        </div>

        <ul className={styles.listaMotivos}>
          {motivos.map((motivo) => (
            <li key={motivo}>{motivo}</li>
          ))}
        </ul>

        <div className={styles.footer}>
          <Button variant="primary" onClick={onClose}>
            Entendido
          </Button>
        </div>
      </div>
    </Modal>
  );
}

export default AvisoBloqueoLegajoModal;
