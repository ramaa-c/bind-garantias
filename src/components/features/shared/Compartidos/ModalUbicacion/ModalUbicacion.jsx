import React, { useState } from "react";
import { createPortal } from "react-dom";
import { FiMapPin, FiMap, FiX } from "react-icons/fi";
import { useFormContext } from "react-hook-form";
import { Button, InputSocioMasked, SelectSocio } from "../../../../ui";
import styles from "./ModalUbicacion.module.css";
import { useEscape } from "../../../../../hooks/useEscape";
import { useProvincias } from "../../../../../hooks/useCatalogos";

export default function ModalUbicacion({ isOpen, onClose, onGuardar }) {
  const { control, trigger, watch, formState: { errors } } = useFormContext();

  const [intentoGuardar, setIntentoGuardar] = useState(false);
  const [prevIsOpen, setPrevIsOpen] = useState(isOpen);

  const { data: provinciasData, isLoading: cargandoProvincias } = useProvincias();
  const opcionesProvincias = provinciasData?.opciones || [];

  if (isOpen !== prevIsOpen) {
    setPrevIsOpen(isOpen);
    if (isOpen) {
      setIntentoGuardar(false);
    }
  }

  useEscape(onClose, isOpen);

  if (!isOpen) return null;

  const getError = (campo) => {
    const err = errors?.[campo];
    const val = watch(campo);
    const hasValue = val !== undefined && val.toString().trim().length > 0;
    return err && (hasValue || intentoGuardar) ? err.message : null;
  };

  const getEsValido = (campo) => {
    const err = errors?.[campo];
    const val = watch(campo);
    const hasValue = val !== undefined && val.toString().trim().length > 0;
    return !err && hasValue;
  };

  const handleGuardar = async (e) => {
    e.preventDefault();
    setIntentoGuardar(true);

    const okZod = await trigger(["direccion", "provincia", "localidad"]);
    if (okZod) {
      onGuardar();
    }
  };

  const handleOverlayMouseDown = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  return createPortal(
    <div className={styles.overlay} onMouseDown={handleOverlayMouseDown}>
      <div className={styles.modalContainer} onMouseDown={(e) => e.stopPropagation()}>
        <button type="button" className={styles.btnClose} onClick={onClose}>
          <FiX size={20} />
        </button>

        <form className={styles.body} onSubmit={handleGuardar}>
          <div className={styles.iconWrapper}>
            <FiMapPin size={30} />
          </div>

          <h2 className={styles.title}>Datos de Ubicación</h2>
          <p className={styles.description}>Ingresá el domicilio fiscal de la empresa.</p>

          <div className={styles.formSection}>
            <InputSocioMasked
              name="direccion"
              control={control}
              label="Dirección"
              icon={<FiMapPin />}
              error={getError("direccion")}
              esValido={getEsValido("direccion")}
            />
            
            <div className={styles.inputRow}>
              <SelectSocio
                name="provincia"
                control={control}
                label={cargandoProvincias ? "Cargando..." : "Provincia"}
                icon={<FiMap />}
                options={opcionesProvincias}
                disabled={cargandoProvincias}
                error={getError("provincia")}
                esValido={getEsValido("provincia")}
              />

              <InputSocioMasked
                name="localidad"
                control={control}
                label="Localidad"
                icon={<FiMap />}
                error={getError("localidad")}
                esValido={getEsValido("localidad")}
              />
            </div>
          </div>

          <div className={styles.btnSave}>
            <Button type="submit" variant="primary" style={{ width: "100%", minHeight: "3rem" }}>
              GUARDAR DATOS
            </Button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}