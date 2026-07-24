import React, { useState } from "react";
import { createPortal } from "react-dom";
import { FiMail, FiX } from "react-icons/fi";
import { useFormContext } from "react-hook-form";
import { Button } from "../../../ui/Button/Button";
import { InputSocioMasked } from "../../../ui/InputSocioMasked/InputSocioMasked";
import styles from "./FacturacionModal.module.css";
import { useEscape } from "../../../../hooks/useEscape";

export default function FacturacionModal({ isOpen, onClose, onGuardar }) {
  const {
    control,
    trigger,
    watch,
    formState: { errors },
  } = useFormContext();

  const emailValue = watch("emailfacturacion") || "";

  const [intentoGuardar, setIntentoGuardar] = useState(false);
  const [prevIsOpen, setPrevIsOpen] = useState(isOpen);

  if (isOpen !== prevIsOpen) {
    setPrevIsOpen(isOpen);
    if (isOpen) setIntentoGuardar(false);
  }

  useEscape(onClose, isOpen);

  if (!isOpen) return null;

  const handleGuardar = async (e) => {
    e.preventDefault();
    setIntentoGuardar(true);
    const okZod = await trigger("emailfacturacion");
    if (okZod) onGuardar();
  };

  const handleOverlayMouseDown = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  return createPortal(
    <div className={styles.overlay} onMouseDown={handleOverlayMouseDown}>
      <div className={styles.modalContainer} onMouseDown={(e) => e.stopPropagation()}>
        <button type="button" className={styles.btnClose} onClick={onClose} aria-label="Cerrar">
          <FiX size={20} />
        </button>

        <form className={styles.body} onSubmit={handleGuardar}>
          <div className={styles.iconWrapper}>
            <FiMail size={30} />
          </div>

          <h2 className={styles.title}>Email de Facturación</h2>
          <p className={styles.description}>
            A esta casilla vamos a enviarte las facturas y comprobantes de tu empresa.
          </p>

          <div className={styles.formSection}>
            <InputSocioMasked
              name="emailfacturacion"
              control={control}
              type="email"
              label="Email de facturación"
              icon={<FiMail />}
              error={(intentoGuardar || emailValue) ? errors?.emailfacturacion?.message : null}
              esValido={!errors?.emailfacturacion && emailValue.length > 0}
              autoComplete="email"
              inputMode="email"
            />
          </div>

          <div className={styles.btnSave}>
            <Button type="submit" variant="primary" style={{ width: "100%", minHeight: "3rem" }}>
              GUARDAR EMAIL
            </Button>
          </div>
        </form>
      </div>
    </div>,
    document.body,
  );
}
