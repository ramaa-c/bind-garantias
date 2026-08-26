import React, { useState, useMemo, useEffect } from "react";
import { createPortal } from "react-dom";
import { FiMapPin, FiMap, FiX } from "react-icons/fi";
import { useFormContext } from "react-hook-form";
import { Button } from "../../../ui/Button/Button";
import { InputSocioMasked } from "../../../ui/InputSocioMasked/InputSocioMasked";
import { SelectSocio } from "../../../ui/SelectSocio/SelectSocio";
import styles from "./UbicacionModal.module.css";
import { useEscape } from "../../../../hooks/useEscape";
import { useProvincias, useCiudades, usePartidos } from "../../../../hooks/useCatalogos";
import { useSincronizarCatalogoPorTexto } from "../../../../hooks/useSincronizarCatalogoPorTexto";

export default function UbicacionModal({ isOpen, onClose, onGuardar }) {
  const {
    control,
    trigger,
    watch,
    setValue,
    clearErrors,
    formState: { errors },
  } = useFormContext();

  const [intentoGuardar, setIntentoGuardar] = useState(false);
  const [prevIsOpen, setPrevIsOpen] = useState(isOpen);

  const { data: provinciasData, isLoading: cargandoProvincias } =
    useProvincias();
  const opcionesProvincias = provinciasData?.opciones || [];

  const currentProvincia = watch("provincia");

  // Fetch cities and localities based on selected province
  const { data: ciudadesData, isLoading: cargandoCiudades } =
    useCiudades(currentProvincia);
  const opcionesCiudades = useMemo(
    () => ciudadesData?.opciones || [],
    [ciudadesData],
  );
  const ciudadesRaw = useMemo(() => ciudadesData?.raw || [], [ciudadesData]);

  const { data: partidosData, isLoading: cargandoPartidos } =
    usePartidos(currentProvincia);
  const opcionesLocalidades = useMemo(
    () => partidosData?.opciones || [],
    [partidosData],
  );

  const currentCiudad = watch("ciudad");
  const currentCiudadId = watch("ciudadid");
  const currentLocalidadId = watch("localidadid");

  // Ciudad se filtra por la provincia elegida (useCiudades recibe
  // currentProvincia) - ver useSincronizarCatalogoPorTexto para el detalle
  // de como se resuelve/limpia ciudadid a partir del texto que puede venir
  // de AFIP/Nosis.
  useSincronizarCatalogoPorTexto({
    cargando: cargandoCiudades,
    opciones: opcionesCiudades,
    valorTexto: currentCiudad,
    valorId: currentCiudadId,
    campoTexto: "ciudad",
    campoId: "ciudadid",
    setValue,
  });

  // Localidad (Partido) ya NO se elige a mano ni se matchea por texto: cada
  // Ciudad trae su propio PartidoID (confirmado en vivo contra
  // catalogos/Ciudad - viene poblado), así que se deriva directo apenas se
  // resuelve la Ciudad. El select queda deshabilitado (ver más abajo).
  useEffect(() => {
    if (cargandoCiudades || cargandoPartidos || !currentCiudadId) return;

    const ciudadElegida = ciudadesRaw.find(
      (c) => String(c.ciudadid) === String(currentCiudadId),
    );
    if (!ciudadElegida) return;

    const partidoIdDerivado = Number(ciudadElegida.partidoid) || 0;
    if (Number(currentLocalidadId) === partidoIdDerivado) return;

    const partidoMatch = opcionesLocalidades.find(
      (p) => Number(p.value) === partidoIdDerivado,
    );

    setValue("localidadid", partidoIdDerivado, {
      shouldValidate: true,
      shouldDirty: true,
    });
    setValue("localidad", partidoMatch?.label || "", {
      shouldValidate: true,
      shouldDirty: true,
    });
  }, [
    cargandoCiudades,
    cargandoPartidos,
    currentCiudadId,
    currentLocalidadId,
    ciudadesRaw,
    opcionesLocalidades,
    setValue,
  ]);

  if (isOpen !== prevIsOpen) {
    setPrevIsOpen(isOpen);
    if (isOpen) {
      setIntentoGuardar(false);
    }
  }

  useEscape(onClose, isOpen);

  if (!isOpen) return null;

  // `ciudadid`/`localidadid` usan 0 como "sin seleccionar" - sin el
  // `val !== 0`, ese 0 pasaba `hasValue` igual (Number(0).toString() es
  // "0", un string no vacío), mostrando el error de esos dos selects apenas
  // se completaban en segundo plano (ver useSincronizarCatalogoPorTexto),
  // sin que el usuario hubiera tocado nada todavía.
  const getError = (campo) => {
    if (campo === "numero" && watch("sinNumero")) return null;
    const err = errors?.[campo];
    const val = watch(campo);
    const hasValue =
      val !== undefined && val !== null && val !== 0 && val.toString().trim().length > 0;
    return err && (hasValue || intentoGuardar) ? err.message : null;
  };

  const getEsValido = (campo) => {
    if (campo === "numero" && watch("sinNumero")) return true;
    const err = errors?.[campo];
    const val = watch(campo);
    const hasValue =
      val !== undefined && val !== null && val !== 0 && val.toString().trim().length > 0;
    return !err && hasValue;
  };

  const handleGuardar = async (e) => {
    e.preventDefault();
    setIntentoGuardar(true);

    const okZod = await trigger([
      "calle",
      "numero",
      "provincia",
      "ciudadid",
      "localidadid",
    ]);

    if (okZod) {
      const calleVal = watch("calle") || "";
      const numeroVal = watch("numero") || "";
      const pisoVal = watch("piso") || "";
      const deptoVal = watch("departamento") || "";

      // Reconstruct full direccion for backward compatibility
      let fullDir = calleVal;
      if (numeroVal && Number(numeroVal) > 0) fullDir += ` ${numeroVal}`;
      if (pisoVal) fullDir += ` Piso:${pisoVal}`;
      if (deptoVal) fullDir += ` Dpto:${deptoVal}`;

      setValue("direccion", fullDir, {
        shouldDirty: true,
        shouldValidate: true,
      });

      // Keep provinciaid in sync with selected provincia ID
      const provVal = watch("provincia");
      if (provVal) {
        setValue("provinciaid", Number(provVal) || 0, {
          shouldDirty: true,
          shouldValidate: true,
        });
      }

      // Keep ciudad and localidad text in sync with selected IDs
      const ciudadidVal = watch("ciudadid");
      if (ciudadidVal) {
        const selectedCiudad = opcionesCiudades.find(
          (c) => String(c.value) === String(ciudadidVal)
        );
        if (selectedCiudad) {
          setValue("ciudad", selectedCiudad.label, { shouldDirty: true });
        }
      }

      const localidadidVal = watch("localidadid");
      if (localidadidVal) {
        const selectedLocalidad = opcionesLocalidades.find(
          (l) => String(l.value) === String(localidadidVal)
        );
        if (selectedLocalidad) {
          setValue("localidad", selectedLocalidad.label, { shouldDirty: true });
        }
      }

      onGuardar();
    }
  };

  const handleOverlayMouseDown = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  return createPortal(
    <div className={styles.overlay} onMouseDown={handleOverlayMouseDown}>
      <div
        className={styles.modalContainer}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <button type="button" className={styles.btnClose} onClick={onClose}>
          <FiX size={20} />
        </button>

        <form className={styles.body} onSubmit={handleGuardar}>
          <div className={styles.iconWrapper}>
            <FiMapPin size={30} />
          </div>

          <h2 className={styles.title}>Datos de Ubicación</h2>
          <p className={styles.description}>
            Ingresá el domicilio fiscal de la empresa.
          </p>

          <div className={styles.formSection}>
            <InputSocioMasked
              name="calle"
              control={control}
              label="Calle / Avenida"
              icon={<FiMapPin />}
              error={getError("calle")}
              esValido={getEsValido("calle")}
            />

            <div className={styles.inputRow3}>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                <InputSocioMasked
                  name="numero"
                  control={control}
                  label="Número de calle"
                  type="number"
                  error={getError("numero")}
                  esValido={getEsValido("numero")}
                  disabled={watch("sinNumero")}
                />
                <label className={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    className={styles.customCheckbox}
                    checked={watch("sinNumero")}
                    onChange={(e) => {
                      setValue("sinNumero", e.target.checked, { shouldValidate: true, shouldDirty: true });
                      if (e.target.checked) {
                        setValue("numero", "", { shouldValidate: true, shouldDirty: true });
                        clearErrors("numero");
                      } else {
                        trigger("numero");
                      }
                    }}
                  />
                  Sin número
                </label>
              </div>

              <InputSocioMasked
                name="piso"
                control={control}
                label="Piso"
                error={getError("piso")}
                esValido={getEsValido("piso")}
              />

              <InputSocioMasked
                name="departamento"
                control={control}
                label="Depto / Oficina"
                error={getError("departamento")}
                esValido={getEsValido("departamento")}
              />
            </div>

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

              <SelectSocio
                name="localidadid"
                control={control}
                label={cargandoPartidos ? "Cargando..." : "Localidad"}
                icon={<FiMap />}
                options={opcionesLocalidades}
                isLoading={cargandoPartidos}
                disabled
                error={getError("localidadid")}
                esValido={getEsValido("localidadid")}
              />
            </div>

            <div className={styles.inputRow}>
              <SelectSocio
                name="ciudadid"
                control={control}
                label={cargandoCiudades ? "Cargando..." : "Ciudad"}
                icon={<FiMap />}
                options={opcionesCiudades}
                isLoading={cargandoCiudades}
                error={getError("ciudadid")}
                esValido={getEsValido("ciudadid")}
              />

              <InputSocioMasked
                name="codpos"
                control={control}
                label="Código Postal"
                error={getError("codpos")}
                esValido={getEsValido("codpos")}
              />
            </div>
          </div>

          <div className={styles.btnSave}>
            <Button
              type="submit"
              variant="primary"
              style={{ width: "100%", minHeight: "3rem" }}
            >
              GUARDAR DATOS
            </Button>
          </div>
        </form>
      </div>
    </div>,
    document.body,
  );
}