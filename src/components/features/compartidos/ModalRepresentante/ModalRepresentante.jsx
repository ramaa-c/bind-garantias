import React, { useState, useEffect } from "react";
import { FiBriefcase, FiX } from "react-icons/fi";
import { InputFlotante, Button, BotonVolver } from "../../../ui";
import styles from "./ModalRepresentante.module.css";
import { useEscape } from "../../../../hooks/useEscape";

export const ModalRepresentante = ({
  isOpen,
  onClose,
  representanteInicial = null,
  onGuardar,
}) => {
  const [faseInterna, setFaseInterna] = useState("ingresar");
  const [cuit, setCuit] = useState("");
  const [nombre, setNombre] = useState("");
  const [rol, setRol] = useState("Representante Legal");
  const [email, setEmail] = useState("");
  const [celular, setCelular] = useState("");

  const [errores, setErrores] = useState({});

  useEffect(() => {
    if (isOpen) {
      if (representanteInicial) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setCuit(representanteInicial.cuit);

        setNombre(representanteInicial.nombre);

        setRol(representanteInicial.rol);

        setEmail(representanteInicial.email);

        setCelular(representanteInicial.celular);

        setFaseInterna("completar");
      } else {

        setCuit("");

        setNombre("");

        setRol("Representante Legal");

        setEmail("");

        setCelular("");

        setFaseInterna("ingresar");
      }

      setErrores({});
    }
  }, [isOpen, representanteInicial]);

  useEscape(onClose, isOpen);

  if (!isOpen) return null;

  const validarCUIT = (cuitVal) => {
    if (!cuitVal) return false;
    const limpio = String(cuitVal).replace(/\D/g, "");
    if (limpio.length !== 11) return false;
    const mult = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2];
    const nums = limpio.split("").map(Number);
    const suma = mult.reduce((acc, m, i) => acc + nums[i] * m, 0);
    const mod = suma % 11;
    const digito = mod === 0 ? 0 : mod === 1 ? 9 : 11 - mod;
    return digito === nums[10];
  };

  // --- VALIDACIONES TIEMPO REAL ---
  const isEmailValido =
    !errores.email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const isCelularValido = !errores.celular && celular.length === 10;

  const handleValidarCuit = (e) => {
    if (e) e.preventDefault();
    if (!cuit || cuit.trim() === "") {
      setErrores({ cuit: "El CUIT es obligatorio" });
      return;
    }
    if (!validarCUIT(cuit)) {
      setErrores({ cuit: "CUIT inválido o incorrecto" });
      return;
    }
    setErrores({});
    // MOCK
    setNombre("GOMEZ PEREZ JUAN");
    setFaseInterna("completar");
  };

  const handleGuardarYCerrar = (e) => {
    if (e) e.preventDefault();
    const nuevosErrores = {};
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      nuevosErrores.email = "Email inválido";
    }
    if (!celular || celular.replace(/\D/g, "").length !== 10) {
      nuevosErrores.celular = "Debe tener 10 dígitos";
    }

    if (Object.keys(nuevosErrores).length > 0) {
      setErrores(nuevosErrores);
      return;
    }

    onGuardar({ cuit, nombre, rol, email, celular });
    onClose();
  };

  const handleOverlayMouseDown = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <div className={styles.overlay} onMouseDown={handleOverlayMouseDown}>
      <div className={styles.modalContainer} onMouseDown={(e) => e.stopPropagation()}>
        <button
          type="button"
          className={styles.btnClose}
          onClick={onClose}
          aria-label="Cerrar"
        >
          <FiX size={20} />
        </button>

        <form className={styles.body} onSubmit={(e) => {
          e.preventDefault();
          if (faseInterna === "ingresar") {
            handleValidarCuit(e);
          } else {
            handleGuardarYCerrar(e);
          }
        }}>
          <div className={styles.iconWrapper}>
            <FiBriefcase size={30} />
          </div>

          <h2 className={styles.title}>Gestión de Representante</h2>
          <p className={styles.description}>
            Designá al representante legal o apoderado para operar.
          </p>

          <div className={styles.modalLayout}>
            <section className={styles.sectionBlock}>
              {faseInterna === "ingresar" && (
                <div className={styles.searchBox}>
                  <div className={styles.inputWrapper}>
                    <InputFlotante
                      name="cuit"
                      label="CUIT"
                      maxLength={11}
                      esValido={
                        cuit.length === 11 && !errores.cuit && validarCUIT(cuit)
                      }
                      error={errores.cuit}
                      value={cuit}
                      onChange={(e) => {
                        const limpio = e.target.value
                          .replace(/\D/g, "")
                          .slice(0, 11);
                        setCuit(limpio);
                        if (errores.cuit)
                          setErrores({ ...errores, cuit: null });
                      }}
                    />
                  </div>
                  <Button
                    type="submit"
                    variant="primary"
                    size="sm"
                  >
                    VALIDAR
                  </Button>
                </div>
              )}

              {faseInterna === "completar" && (
                <div className={styles.completarContainer}>
                  {!representanteInicial && (
                    <div className={styles.topBackButtonWrapper}>
                      <BotonVolver
                        texto="MODIFICAR CUIT"
                        onClick={() => {
                          setCuit("");
                          setErrores({});
                          setFaseInterna("ingresar");
                        }}
                      />
                    </div>
                  )}

                  <div className={styles.infoPill}>
                    <div className={styles.infoRow}>
                      <span className={styles.infoLabel}>CUIT:</span>
                      <span className={styles.infoValue}>{cuit}</span>
                    </div>
                    <div className={styles.infoRow}>
                      <span className={styles.infoLabel}>Nombre:</span>
                      <span className={styles.infoValue}>{nombre}</span>
                    </div>
                  </div>

                  <div className={styles.radioGroup}>
                    <label className={styles.radioLabel}>
                      <input
                        type="radio"
                        value="Apoderado"
                        checked={rol === "Apoderado"}
                        onChange={(e) => setRol(e.target.value)}
                      />
                      <div className={styles.customRadio}></div>
                      <span className={styles.radioText}>Apoderado</span>
                    </label>

                    <label className={styles.radioLabel}>
                      <input
                        type="radio"
                        value="Representante Legal"
                        checked={rol === "Representante Legal"}
                        onChange={(e) => setRol(e.target.value)}
                      />
                      <div className={styles.customRadio}></div>
                      <span className={styles.radioText}>
                        Representante Legal
                      </span>
                    </label>
                  </div>

                  <div className={styles.inputRow}>
                    <InputFlotante
                      name="modalRepEmail_unique"
                      label="Email Personal"
                      type="email"
                      error={errores.email}
                      esValido={isEmailValido}
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        if (errores.email)
                          setErrores({ ...errores, email: null });
                      }}
                    />
                    <InputFlotante
                      name="modalRepCelular_unique"
                      label="Celular"
                      maxLength={10}
                      autoComplete="off"
                      error={errores.celular}
                      esValido={isCelularValido}
                      value={celular}
                      onChange={(e) => {
                        const limpio = e.target.value
                          .replace(/\D/g, "")
                          .slice(0, 10);
                        setCelular(limpio);
                        if (errores.celular)
                          setErrores({ ...errores, celular: null });
                      }}
                    />
                  </div>
                </div>
              )}
            </section>

            {faseInterna === "completar" && (
              <div className={styles.modalFooter}>
                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                >
                  GUARDAR REPRESENTANTE
                </Button>
              </div>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};
