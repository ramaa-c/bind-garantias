import React, { useState, useEffect } from "react";
import { useFormContext, useFormState, useWatch } from "react-hook-form";
import { FiBriefcase, FiX } from "react-icons/fi";
import { InputFlotante, Button, BotonVolver } from "../../../ui";
import styles from "./ModalRepresentanteFacturacion.module.css";
import { useEscape } from "../../../../hooks/useEscape";

export const ModalRepresentanteFacturacion = ({
  isOpen,
  onClose,
  faseApoderado,
  setFaseApoderado,
  apoNombre,
  onValidarCuit,
  apoRol,
  setApoRol,
  onGuardarApoderado,
}) => {
  const { setValue, trigger, control } = useFormContext();
  const { errors } = useFormState({ control });

  const [errorApoCuit, setErrorApoCuit] = useState("");
  const [intentoGuardar, setIntentoGuardar] = useState(false);
  const [faseInterna, setFaseInterna] = useState(() => faseApoderado);

  const apoCuitIngresado = useWatch({ control, name: "apoCuit" }) || "";
  const apoEmailVal = useWatch({ control, name: "apoEmail" }) || "";
  const apoCelVal = useWatch({ control, name: "apoCelular" }) || "";
  const emailFacVal = useWatch({ control, name: "emailFacturacion" }) || "";

  useEffect(() => {
    if (isOpen) {
      setFaseInterna(faseApoderado);
      setIntentoGuardar(false);
    }
  }, [isOpen, faseApoderado]);

  useEscape(onClose, isOpen);

  if (!isOpen) return null;

  const validarCUIT = (cuit) => {
    if (!cuit) return false;
    const limpio = String(cuit).replace(/\D/g, "");
    if (limpio.length !== 11) return false;

    const mult = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2];
    const nums = limpio.split("").map(Number);
    const suma = mult.reduce((acc, m, i) => acc + nums[i] * m, 0);
    const mod = suma % 11;
    const digito = mod === 0 ? 0 : mod === 1 ? 9 : 11 - mod;

    return digito === nums[10];
  };

  const handleValidarApoderadoCuitClick = () => {
    if (!apoCuitIngresado || apoCuitIngresado.trim() === "") {
      setErrorApoCuit("El CUIT es obligatorio");
      return;
    }
    if (!validarCUIT(apoCuitIngresado)) {
      setErrorApoCuit("CUIT inválido o incorrecto");
      return;
    }
    setErrorApoCuit("");
    onValidarCuit();
  };

  const handleGuardarYCerrar = async () => {
    setIntentoGuardar(true);

    const okCampos = await trigger(["apoEmail", "apoCelular", "emailFacturacion"]);

    const isValid =
      okCampos &&
      apoEmailVal.trim() !== "" &&
      apoCelVal.replace(/\D/g, "").length === 10 &&
      emailFacVal.trim() !== "";

    if (isValid) {
      setFaseApoderado("guardado");
      onGuardarApoderado();
      onClose();
    }
  };

  const handleOverlayMouseDown = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  const errorEmail =
    errors.apoEmail?.message ||
    (intentoGuardar && apoEmailVal.trim() === "" ? "Requerido" : null);
  const errorCel =
    errors.apoCelular?.message ||
    (intentoGuardar && apoCelVal.replace(/\D/g, "").length < 10 ? "Requerido" : null);
  const errorEmailFac =
    errors.emailFacturacion?.message ||
    (intentoGuardar && emailFacVal.trim() === "" ? "Requerido" : null);

  const isEmailValido = !errorEmail && apoEmailVal.trim() !== "";
  const isCelValido = !errorCel && apoCelVal.replace(/\D/g, "").length === 10;
  const isEmailFacValido = !errorEmailFac && emailFacVal.trim() !== "";

  return (
    <div className={styles.overlay} onMouseDown={handleOverlayMouseDown}>
      <div className={styles.modalContainer}>
        <button className={styles.btnClose} onClick={onClose} aria-label="Cerrar">
          <FiX size={20} />
        </button>

        <div className={styles.body}>
          <div className={styles.iconWrapper}>
            <FiBriefcase size={30} />
          </div>

          <h2 className={styles.title}>Gestión y Contacto</h2>
          <p className={styles.description}>
            Designá al representante legal y configurá el contacto para facturación.
          </p>

          <div className={styles.modalLayout}>
            {/* --- SECCIÓN 1: APODERADO --- */}
            <section className={styles.sectionBlock}>


              {faseInterna === "ingresar" && (
                <div className={styles.searchBox}>
                  <div className={styles.inputWrapper}>
                    <InputFlotante
                      name="apoCuit"
                      label="CUIT"
                      maxLength={11}
                      esValido={
                        apoCuitIngresado.length === 11 &&
                        !errorApoCuit &&
                        validarCUIT(apoCuitIngresado)
                      }
                      error={errorApoCuit}
                      value={apoCuitIngresado}
                      onChange={(e) => {
                        const limpio = e.target.value.replace(/\D/g, "").slice(0, 11);
                        setValue("apoCuit", limpio, {
                          shouldValidate: true,
                          shouldDirty: true,
                        });
                        if (errorApoCuit) setErrorApoCuit("");
                      }}
                    />
                  </div>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={handleValidarApoderadoCuitClick}
                  >
                    VALIDAR
                  </Button>
                </div>
              )}

              {faseInterna === "completar" && (
                <div className={styles.completarContainer}>
                  <div className={styles.topBackButtonWrapper}>
                    <BotonVolver
                      texto="MODIFICAR CUIT"
                      onClick={() => {
                        setValue("apoCuit", "");
                        setErrorApoCuit("");
                        setFaseInterna("ingresar");
                      }}
                    />
                  </div>

                  <div className={styles.infoPill}>
                    <div className={styles.infoRow}>
                      <span className={styles.infoLabel}>CUIT:</span>
                      <span className={styles.infoValue}>{apoCuitIngresado}</span>
                    </div>
                    <div className={styles.infoRow}>
                      <span className={styles.infoLabel}>Nombre:</span>
                      <span className={styles.infoValue}>{apoNombre}</span>
                    </div>
                  </div>
                  {/* --- NUEVA SECCIÓN DE ROLES ESTÉTICA --- */}
                  <div className={styles.radioGroup}>
                    <label className={styles.radioLabel}>
                      <input
                        type="radio"
                        name="apoRol"
                        value="Apoderado"
                        checked={apoRol === "Apoderado"}
                        onChange={(e) => setApoRol(e.target.value)}
                      />
                      <div className={styles.customRadio}></div>
                      <span className={styles.radioText}>Apoderado</span>
                    </label>

                    <label className={styles.radioLabel}>
                      <input
                        type="radio"
                        name="apoRol"
                        value="Representante Legal"
                        checked={apoRol === "Representante Legal"}
                        onChange={(e) => setApoRol(e.target.value)}
                      />
                      <div className={styles.customRadio}></div>
                      <span className={styles.radioText}>Representante Legal</span>
                    </label>
                  </div>
                  {/* -------------------------------- */}

                  <div className={styles.inputRow}>
                    <InputFlotante
                      name="apoEmail"
                      label="Email Personal"
                      type="email"
                      esValido={isEmailValido}
                      error={errorEmail}
                      value={apoEmailVal}
                      onChange={(e) =>
                        setValue("apoEmail", e.target.value, {
                          shouldValidate: true,
                          shouldDirty: true,
                        })
                      }
                    />
                    <InputFlotante
                      name="apoCelular"
                      label="Celular"
                      maxLength={10}
                      esValido={isCelValido}
                      error={errorCel}
                      value={apoCelVal}
                      onChange={(e) => {
                        const limpio = e.target.value.replace(/\D/g, "").slice(0, 10);
                        setValue("apoCelular", limpio, {
                          shouldValidate: true,
                          shouldDirty: true,
                        });
                      }}
                    />
                  </div>
                </div>
              )}
            </section>

            {/* --- SECCIÓN 2: FACTURACIÓN --- */}
            {faseInterna === "completar" && (
              <section className={styles.sectionBlock}>
                <h4 className={styles.sectionTitle}>2. Contacto de Facturación</h4>
                <div className={styles.facturacionWrapper}>
                  <InputFlotante
                    name="emailFacturacion"
                    label="Email de Facturación"
                    type="email"
                    esValido={isEmailFacValido}
                    error={errorEmailFac}
                    value={emailFacVal}
                    onChange={(e) =>
                      setValue("emailFacturacion", e.target.value, {
                        shouldValidate: true,
                        shouldDirty: true,
                      })
                    }
                  />
                </div>
              </section>
            )}

            {/* --- FOOTER UNIFICADO --- */}
            {faseInterna === "completar" && (
              <div className={styles.modalFooter}>
                <Button variant="primary" size="md" onClick={handleGuardarYCerrar}>
                  GUARDAR Y CERRAR
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};