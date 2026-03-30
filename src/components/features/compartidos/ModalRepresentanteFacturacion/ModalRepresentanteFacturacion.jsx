import React, { useState } from "react";
import { useFormContext, useFormState, useWatch } from "react-hook-form";
import { FiCheckCircle, FiEdit, FiBriefcase, FiX } from "react-icons/fi";
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
  onGuardarApoderado,
}) => {
  const { setValue, trigger, control } = useFormContext();
  const { errors } = useFormState({ control });

  const [errorApoCuit, setErrorApoCuit] = useState("");
  const [intentoGuardarApo, setIntentoGuardarApo] = useState(false);
  const [faseInterna, setFaseInterna] = useState(faseApoderado);

  const apoCuitIngresado = useWatch({ control, name: "apoCuit" }) || "";
  const apoEmailVal = useWatch({ control, name: "apoEmail" }) || "";
  const apoCelVal = useWatch({ control, name: "apoCelular" }) || "";
  const emailFacVal = useWatch({ control, name: "emailFacturacion" }) || "";

  const [prevIsOpen, setPrevIsOpen] = useState(isOpen);

  if (isOpen !== prevIsOpen) {
    setPrevIsOpen(isOpen);
    if (isOpen) {
      setFaseInterna(faseApoderado);
    }
  }

  useEscape(onClose, isOpen);

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

  const handleGuardarApoderadoFase2 = async () => {
    setIntentoGuardarApo(true);
    const okZod = await trigger(["apoEmail", "apoCelular"]);

    if (
      okZod &&
      apoEmailVal.trim() !== "" &&
      apoCelVal.replace(/\D/g, "").length === 10
    ) {
      setIntentoGuardarApo(false);
      setFaseInterna("guardado");
    }
  };

  const handleGuardarYCerrar = async () => {
    let apoderadoOk = faseInterna === "guardado";

    if (faseInterna === "completar") {
      setIntentoGuardarApo(true);
      const okApo = await trigger(["apoEmail", "apoCelular"]);
      if (
        okApo &&
        apoEmailVal.trim() !== "" &&
        apoCelVal.replace(/\D/g, "").length === 10
      ) {
        setIntentoGuardarApo(false);
        setFaseInterna("guardado");
        apoderadoOk = true;
      }
    }

    const facturacionOk = await trigger("emailFacturacion");

    if (apoderadoOk && facturacionOk && emailFacVal.trim() !== "") {
      setFaseApoderado("guardado");
      onGuardarApoderado();
      onClose();
    }
  };

  const errorEmail =
    errors.apoEmail?.message ||
    (intentoGuardarApo && apoEmailVal.trim() === "" ? "Requerido" : null);
  const errorCel =
    errors.apoCelular?.message ||
    (intentoGuardarApo && apoCelVal.replace(/\D/g, "").length < 10
      ? "Requerido"
      : null);

  const isEmailValido = !errorEmail && apoEmailVal.trim() !== "";
  const isCelValido = !errorCel && apoCelVal.replace(/\D/g, "").length === 10;

  const handleOverlayMouseDown = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onMouseDown={handleOverlayMouseDown}>
      <div
        className={styles.modalContainer}
        onClick={(e) => e.stopPropagation()}
      >
        <button className={styles.btnClose} onClick={onClose}>
          <FiX size={20} />
        </button>

        <div className={styles.body}>
          <div className={styles.iconWrapper}>
            <FiBriefcase size={30} />
          </div>

          <h2 className={styles.title}>Gestión y Contacto</h2>
          <p className={styles.description}>
            Designá al representante legal y configurá el contacto para
            facturación.
          </p>

          <div className={styles.modalLayout}>
            {/* --- SECCIÓN 1: APODERADO --- */}
            <section className={styles.sectionBlock}>
              <h4 className={styles.sectionTitle}>
                1. Representante Legal / Apoderado
              </h4>

              {faseInterna === "ingresar" && (
                <div className={styles.searchBox}>
                  <div className={styles.inputWrapper}>
                    <InputFlotante
                      name="apoCuit"
                      label="CUIT del apoderado"
                      maxLength={11}
                      esValido={
                        apoCuitIngresado.length === 11 &&
                        !errorApoCuit &&
                        validarCUIT(apoCuitIngresado)
                      }
                      error={errorApoCuit}
                      value={apoCuitIngresado}
                      onChange={(e) => {
                        const limpio = e.target.value
                          .replace(/\D/g, "")
                          .slice(0, 11);
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
                      texto="CANCELAR"
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
                      <span className={styles.infoValue}>
                        {apoCuitIngresado}
                      </span>
                    </div>
                    <div className={styles.infoRow}>
                      <span className={styles.infoLabel}>Nombre:</span>
                      <span className={styles.infoValue}>{apoNombre}</span>
                    </div>
                  </div>

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
                        const limpio = e.target.value
                          .replace(/\D/g, "")
                          .slice(0, 10);
                        setValue("apoCelular", limpio, {
                          shouldValidate: true,
                          shouldDirty: true,
                        });
                      }}
                    />
                  </div>

                  <div className={styles.saveActionRowCentrado}>
                    <Button
                      variant="primary"
                      onClick={handleGuardarApoderadoFase2}
                    >
                      GUARDAR DATOS
                    </Button>
                  </div>
                </div>
              )}

              {faseInterna === "guardado" && (
                <div className={styles.successCard}>
                  <div className={styles.successInfo}>
                    <div className={styles.successIconWrapper}>
                      <FiCheckCircle className={styles.successIcon} />
                    </div>
                    <div className={styles.successText}>
                      <p className={styles.successName}>{apoNombre}</p>
                      <p className={styles.successRole}>
                        Identidad Validada ({apoCuitIngresado})
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setFaseInterna("completar")}
                  >
                    <FiEdit /> MODIFICAR
                  </Button>
                </div>
              )}
            </section>

            {/* --- SECCIÓN 2: FACTURACIÓN --- */}
            <section className={styles.sectionBlock}>
              <h4 className={styles.sectionTitle}>
                2. Contacto de Facturación
              </h4>
              <div className={styles.facturacionWrapper}>
                <InputFlotante
                  name="emailFacturacion"
                  label="Email de Facturación"
                  type="email"
                  esValido={
                    !errors.emailFacturacion && emailFacVal.trim().length > 0
                  }
                  error={errors.emailFacturacion?.message}
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

            {/* --- FOOTER --- */}
            <div className={styles.modalFooter}>
              <Button
                variant="primary"
                size="md"
                onClick={handleGuardarYCerrar}
              >
                GUARDAR Y CERRAR
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
