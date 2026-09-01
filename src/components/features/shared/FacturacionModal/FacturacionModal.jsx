import React, { useState } from "react";
import { FiMail } from "react-icons/fi";
import { useFormContext } from "react-hook-form";
import { Modal } from "../../../ui/Modal/Modal";
import { Button } from "../../../ui/Button/Button";
import { InputSocioMasked } from "../../../ui/InputSocioMasked/InputSocioMasked";
import styles from "./FacturacionModal.module.css";

export default function FacturacionModal({ isOpen, onClose, onGuardar }) {
  const {
    control,
    trigger,
    watch,
    formState: { errors, dirtyFields },
  } = useFormContext();

  const emailValue = watch("emailfacturacion") || "";

  const [intentoGuardar, setIntentoGuardar] = useState(false);
  const [prevIsOpen, setPrevIsOpen] = useState(isOpen);

  if (isOpen !== prevIsOpen) {
    setPrevIsOpen(isOpen);
    if (isOpen) setIntentoGuardar(false);
  }

  const handleGuardar = async (e) => {
    e.preventDefault();
    setIntentoGuardar(true);
    const okZod = await trigger("emailfacturacion");
    if (okZod) onGuardar();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} maxWidth="28rem">
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
          <Button
            type="submit"
            variant="primary"
            disabled={!dirtyFields?.emailfacturacion}
            style={{ width: "100%", minHeight: "3rem" }}
          >
            GUARDAR EMAIL
          </Button>
        </div>
      </form>
    </Modal>
  );
}
