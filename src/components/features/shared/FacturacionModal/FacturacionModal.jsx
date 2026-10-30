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
    <Modal isOpen={isOpen} onClose={onClose} maxWidth="30rem" variant="confirm">
      <form className={styles.body} onSubmit={handleGuardar} noValidate>
        <div className={styles.head}>
          <span className={styles.tile} aria-hidden="true">
            <FiMail />
          </span>
          <div className={styles.texto}>
            <h2 className={styles.title}>Email de facturación</h2>
            <p className={styles.description}>
              A esta casilla vamos a enviarte las facturas y comprobantes de tu empresa.
            </p>
          </div>
        </div>

        <div className={styles.formSection}>
          <InputSocioMasked
            name="emailfacturacion"
            control={control}
            type="email"
            label="Email"
            icon={<FiMail />}
            error={(intentoGuardar || emailValue) ? errors?.emailfacturacion?.message : null}
            esValido={!errors?.emailfacturacion && emailValue.length > 0}
            autoComplete="email"
            inputMode="email"
          />
        </div>

        <div className={styles.footer}>
          <Button type="button" variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" variant="primary" disabled={!dirtyFields?.emailfacturacion}>
            Guardar
          </Button>
        </div>
      </form>
    </Modal>
  );
}
