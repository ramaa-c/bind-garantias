import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { FiMapPin, FiX } from "react-icons/fi";
import { useFormContext } from "react-hook-form";
import { Button, InputFlotante, Select } from "../../../../ui";
import styles from "./ModalUbicacion.module.css";
import { useEscape } from "../../../../../hooks/useEscape";
import { catalogosService } from "../../../../../services/catalogosService";

export default function ModalUbicacion({ isOpen, onClose, onGuardar }) {
  const { getValues, setValue, trigger } = useFormContext();

  const [dirLocal, setDirLocal] = useState("");
  const [provLocal, setProvLocal] = useState("");
  const [locLocal, setLocLocal] = useState("");
  const [intentoGuardar, setIntentoGuardar] = useState(false);

  // --- NUEVOS ESTADOS PARA LA API ---
  const [opcionesProvincias, setOpcionesProvincias] = useState([]);
  const [cargandoProvincias, setCargandoProvincias] = useState(false);
  // ----------------------------------

  const [prevIsOpen, setPrevIsOpen] = useState(isOpen);

  useEffect(() => {
    if (isOpen) {
      const cargarProvincias = async () => {
        setCargandoProvincias(true);
        try {
          const data = await catalogosService.obtenerProvincias();
          const opcionesMapeadas = data.map((prov) => ({
            value: prov.provinciaid.toString(),
            label: prov.descripcion,
          }));
          opcionesMapeadas.sort((a, b) => a.label.localeCompare(b.label));

          setOpcionesProvincias(opcionesMapeadas);
        } catch (error) {
          console.error("Error cargando provincias:", error);
        } finally {
          setCargandoProvincias(false);
        }
      };

      cargarProvincias();
    }
  }, [isOpen]);

  if (isOpen !== prevIsOpen) {
    setPrevIsOpen(isOpen);
    if (isOpen) {
      setDirLocal(getValues("direccion") || "");
      setProvLocal(getValues("provincia") || "");
      setLocLocal(getValues("localidad") || "");
      setIntentoGuardar(false);
    }
  }

  useEscape(onClose, isOpen);

  if (!isOpen) return null;

  const errorDir = intentoGuardar && dirLocal.trim().length < 5 ? "Mínimo 5 caracteres" : null;
  const errorProv = intentoGuardar && !provLocal ? "Seleccione una provincia" : null;
  const errorLoc = intentoGuardar && locLocal.trim().length < 3 ? "Requerido" : null;

  const isDirValido = !errorDir && dirLocal.trim().length >= 5;
  const isProvValido = !errorProv && provLocal !== "";
  const isLocValido = !errorLoc && locLocal.trim().length >= 3;

  const handleGuardar = async (e) => {
    e.preventDefault();
    setIntentoGuardar(true);

    if (isDirValido && isProvValido && isLocValido) {
      setValue("direccion", dirLocal, { shouldValidate: true, shouldDirty: true });
      setValue("provincia", provLocal, { shouldValidate: true, shouldDirty: true });
      setValue("localidad", locLocal, { shouldValidate: true, shouldDirty: true });

      const okZod = await trigger(["direccion", "provincia", "localidad"]);

      if (okZod) {
        onGuardar();
      }
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
            <InputFlotante
              label="Dirección"
              error={errorDir}
              esValido={isDirValido}
              value={dirLocal}
              onChange={(e) => setDirLocal(e.target.value)}
            />
            <div className={styles.inputRow}>

              <div className={styles.selectWrapper} style={{ flex: 1 }}>
                <Select
                  name="provincia"
                  placeholder={cargandoProvincias ? "Cargando..." : "Provincia"}
                  error={errorProv}
                  options={opcionesProvincias}
                  value={provLocal}
                  onChange={(val) => setProvLocal(val)}
                  disabled={cargandoProvincias}
                  isSearchable={true}
                />
              </div>

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