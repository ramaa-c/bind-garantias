import React, { useState } from "react";
import { FiMapPin, FiX } from "react-icons/fi";
import { useFormContext } from "react-hook-form";
import { Button, InputFlotante } from "../../../ui";
import styles from "./ModalUbicacion.module.css";
import { useEscape } from "../../../../hooks/useEscape";

export default function ModalUbicacion({ isOpen, onClose, onGuardar }) {
  const { getValues, setValue, trigger } = useFormContext();

  const [dirLocal, setDirLocal] = useState("");
  const [provLocal, setProvLocal] = useState("");
  const [locLocal, setLocLocal] = useState("");
  const [intentoGuardar, setIntentoGuardar] = useState(false);

  const [prevIsOpen, setPrevIsOpen] = useState(isOpen);

  if (isOpen && !prevIsOpen) {
    setDirLocal(getValues("direccion") || "");
    setProvLocal(getValues("provincia") || "");
    setLocLocal(getValues("localidad") || "");
    setIntentoGuardar(false);
    setPrevIsOpen(true);
  } else if (!isOpen && prevIsOpen) {
    setPrevIsOpen(false);
  }

  useEscape(onClose, isOpen);

  if (!isOpen) return null;

  const errorDir =
    intentoGuardar && dirLocal.trim().length < 5 ? "Mínimo 5 caracteres" : null;
  const errorProv =
    intentoGuardar && provLocal.trim().length < 3 ? "Requerido" : null;
  const errorLoc =
    intentoGuardar && locLocal.trim().length < 3 ? "Requerido" : null;

  const isDirValido = !errorDir && dirLocal.trim().length >= 5;
  const isProvValido = !errorProv && provLocal.trim().length >= 3;
  const isLocValido = !errorLoc && locLocal.trim().length >= 3;

  const handleGuardar = async () => {
    setIntentoGuardar(true);

    if (isDirValido && isProvValido && isLocValido) {
      setValue("direccion", dirLocal, {
        shouldValidate: true,
        shouldDirty: true,
      });
      setValue("provincia", provLocal, {
        shouldValidate: true,
        shouldDirty: true,
      });
      setValue("localidad", locLocal, {
        shouldValidate: true,
        shouldDirty: true,
      });

      const okZod = await trigger(["direccion", "provincia", "localidad"]);

      if (okZod) {
        onGuardar();
      }
    }
  };

  const handleOverlayMouseDown = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <div className={styles.overlay} onMouseDown={handleOverlayMouseDown}>
      <div className={styles.modalContainer}>
        <button className={styles.btnClose} onClick={onClose}>
          <FiX size={20} />
        </button>

        <div className={styles.body}>
          <div className={styles.iconWrapper}>
            <FiMapPin size={30} />
          </div>

          <h2 className={styles.title}>Datos de Ubicación</h2>
          <p className={styles.description}>
            Ingresá el domicilio fiscal de la empresa.
          </p>

          <div className={styles.formSection}>
            <InputFlotante
              label="Dirección"
              error={errorDir}
              esValido={isDirValido}
              value={dirLocal}
              onChange={(e) => setDirLocal(e.target.value)}
            />
            <div className={styles.inputRow}>
              <InputFlotante
                label="Provincia"
                error={errorProv}
                esValido={isProvValido}
                value={provLocal}
                onChange={(e) => setProvLocal(e.target.value)}
              />
              <InputFlotante
                label="Localidad"
                error={errorLoc}
                esValido={isLocValido}
                value={locLocal}
                onChange={(e) => setLocLocal(e.target.value)}
              />
            </div>
          </div>

          <div className={styles.btnSave}>
            <Button
              variant="primary"
              onClick={handleGuardar}
              style={{ width: "100%", minHeight: "3rem" }}
            >
              GUARDAR DATOS
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
