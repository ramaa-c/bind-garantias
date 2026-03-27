import React, { useState } from "react";
import { useFormContext, useFormState } from "react-hook-form";
import { FiCheckCircle, FiEdit, FiBriefcase, FiX } from "react-icons/fi";
import { InputFlotante, Button, BotonVolver, Modal } from "../../../ui";
import styles from "./ModalRepresentanteFacturacion.module.css";

export const ModalRepresentanteFacturacion = ({
  isOpen,
  onClose,
  faseApoderado,
  setFaseApoderado,
  apoNombre,
  onValidarCuit,
  onGuardarApoderado,
}) => {
  const { register, watch, setValue, trigger, control } = useFormContext();
  const { errors, dirtyFields } = useFormState({ control });

  const [errorApoCuit, setErrorApoCuit] = useState("");
  const [intentoGuardarApo, setIntentoGuardarApo] = useState(false);

  const apoCuitIngresado = watch("apoCuit") || "";
  const apoEmailVal = watch("apoEmail") || "";
  const apoCelVal = watch("apoCelular") || "";

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
      onGuardarApoderado();
    }
  };

  const { onChange, ...restCuit } = register("apoCuit");

  const errorEmail =
    errors.apoEmail?.message ||
    (intentoGuardarApo && apoEmailVal.trim() === "" ? "Requerido" : null);
  const errorCel =
    errors.apoCelular?.message ||
    (intentoGuardarApo && apoCelVal.replace(/\D/g, "").length < 10
      ? "Requerido"
      : null);
  const isEmailValido =
    !errorEmail &&
    apoEmailVal.trim() !== "" &&
    (dirtyFields.apoEmail || intentoGuardarApo);
  const isCelValido =
    !errorCel &&
    apoCelVal.replace(/\D/g, "").length === 10 &&
    (dirtyFields.apoCelular || intentoGuardarApo);

  const { onChange: onCelChange, ...restCel } = register("apoCelular");

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      overlayClassName={styles.overlay}
      modalClassName={styles.modalContainer}
      hideCloseButton={true}
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

              {faseApoderado === "ingresar" && (
                <div className={styles.searchBox}>
                  <div className={styles.inputWrapper}>
                    <InputFlotante
                      label="CUIT del apoderado"
                      maxLength={11}
                      esValido={
                        apoCuitIngresado.length === 11 &&
                        !errorApoCuit &&
                        validarCUIT(apoCuitIngresado)
                      }
                      error={errorApoCuit}
                      {...restCuit}
                      value={apoCuitIngresado}
                      onChange={(e) => {
                        const limpio = e.target.value
                          .replace(/\D/g, "")
                          .slice(0, 11);
                        e.target.value = limpio;
                        onChange(e);
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

              {faseApoderado === "completar" && (
                <div className={styles.completarContainer}>
                  <div className={styles.topBackButtonWrapper}>
                    <BotonVolver
                      texto="CANCELAR"
                      onClick={() => {
                        setValue("apoCuit", "");
                        setErrorApoCuit("");
                        setFaseApoderado("ingresar");
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
                      label="Email Personal"
                      type="email"
                      esValido={isEmailValido}
                      error={errorEmail}
                      {...register("apoEmail")}
                    />
                    <InputFlotante
                      label="Celular"
                      maxLength={10}
                      esValido={isCelValido}
                      error={errorCel}
                      {...restCel}
                      onChange={(e) => {
                        e.target.value = e.target.value
                          .replace(/\D/g, "")
                          .slice(0, 10);
                        onCelChange(e);
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

              {faseApoderado === "guardado" && (
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
                    onClick={() => setFaseApoderado("completar")}
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
                  label="Email de Facturación"
                  type="email"
                  esValido={
                    !errors.emailFacturacion && dirtyFields.emailFacturacion
                  }
                  error={errors.emailFacturacion?.message}
                  {...register("emailFacturacion")}
                />
              </div>
            </section>

            {/* --- FOOTER --- */}
            <div className={styles.modalFooter}>
              <Button
                variant="primary"
                size="md"
                onClick={async () => {
                  await trigger("emailFacturacion");
                  onClose();
                }}
              >
                GUARDAR Y CERRAR
              </Button>
            </div>
        </div>
      </div>
    </Modal>
  );
};