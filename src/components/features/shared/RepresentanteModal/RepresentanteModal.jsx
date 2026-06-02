import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { FiBriefcase, FiX, FiMail, FiSmartphone, FiCreditCard, FiEdit2 } from "react-icons/fi";
import { InputSocioMasked, Button } from "../../../ui";
import styles from "./RepresentanteModal.module.css";
import { useEscape } from "../../../../hooks/useEscape";
import { afipService } from "../../../../services/afipService";
import { tercerosService } from "../../../../services/tercerosService";
import { sociosService } from "../../../../services/sociosService";

export const RepresentanteModal = ({
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
  const [validando, setValidando] = useState(false);


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

  const handleValidarCuit = async (e) => {
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
    setValidando(true);


    const cuitLimpio = String(cuit).replace(/\D/g, "");

    try {
      // 1. Buscar primero en la base de datos de terceros
      let terceroEncontrado = null;
      try {
        const existentes = await tercerosService.obtenerTerceros({ Cuit: cuitLimpio });
        const arr = Array.isArray(existentes) ? existentes : existentes?.data || [];
        if (arr.length > 0) {
          terceroEncontrado = arr[0];
        }
      } catch (dbErr) {
        console.warn("[RepresentanteModal] Error consultando terceros en base de datos local:", dbErr);
      }

      if (terceroEncontrado) {
        setNombre(
          terceroEncontrado.denominacion ||
          terceroEncontrado.razonsocial ||
          terceroEncontrado.nombre ||
          "Representante del Sistema"
        );
        if (terceroEncontrado.mail || terceroEncontrado.email) {
          setEmail(terceroEncontrado.mail || terceroEncontrado.email);
        }
        if (terceroEncontrado.telefono) {
          setCelular(terceroEncontrado.telefono);
        }
        setFaseInterna("completar");
        setValidando(false);
        return;
      }

      // 2. Si no existe localmente, fallback a AFIP
      let respAfip = null;
      try {
        respAfip = await afipService.obtenerConstanciaInscripcion(cuitLimpio);
      } catch (afipErr) {
        console.warn("[RepresentanteModal] AFIP no disponible, probando fallback a LUFE Entidad:", afipErr);

        
        try {
          const lufeEntidad = await sociosService.obtenerEntidadLufe(cuitLimpio);
          if (lufeEntidad && lufeEntidad.success) {
            respAfip = sociosService.normalizarLufeAEstructuraAfip(lufeEntidad);
          }
        } catch (lufeErr) {
          console.error("[RepresentanteModal] LUFE Entidad también falló:", lufeErr);
        }
      }

      if (respAfip && respAfip.datosgenerales) {
        const { nombre: nombreGenerado, razonsocial } = respAfip.datosgenerales;
        
        let nombreRepresentante = "Representante Validado";
        
        if (razonsocial) {
          nombreRepresentante = razonsocial;
        } else if (nombreGenerado) {
          nombreRepresentante = nombreGenerado;
        }
          
        setNombre(nombreRepresentante);
        
        if (respAfip.datosgenerales.email) {
          setEmail(respAfip.datosgenerales.email);
        }
        if (respAfip.datosgenerales.telefono) {
          setCelular(respAfip.datosgenerales.telefono);
        }
      } else {
        setNombre("No inscripto en AFIP/LUFE");
      }
      setFaseInterna("completar");
    } catch (err) {
      console.error("Error validando representante:", err);
      setNombre("Error al validar representante");
      setFaseInterna("completar");
    } finally {
      setValidando(false);
    }
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

  return createPortal(
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
                    <InputSocioMasked
                      name="cuit"
                      label="CUIT"
                      icon={<FiCreditCard />}
                      mask="00-00000000-0"
                      esValido={
                        cuit?.length === 11 && !errores.cuit && validarCUIT(cuit)
                      }
                      error={errores.cuit}
                      value={cuit || ""}
                      disabled={validando}
                      onChange={(val) => {
                        const limpio = val ? String(val).replace(/\D/g, "").slice(0, 11) : "";
                        setCuit(limpio);
                        
                        if (errores.cuit) {
                          setErrores({ ...errores, cuit: null });
                        }
                      }}
                    />
                  </div>
                  <Button
                    type="button"
                    variant="primary"
                    size="sm"
                    onClick={handleValidarCuit}
                    isLoading={validando}
                  >
                    {validando ? "BUSCANDO..." : "VALIDAR"}
                  </Button>
                </div>
              )}

              {faseInterna === "completar" && (
                <div className={styles.completarContainer}>
                  
                  <div className={styles.infoPill}>
                    <div className={styles.pillHeader}>
                      <div className={styles.infoRow} style={{ marginBottom: 0 }}>
                        <span className={styles.infoLabel}>CUIT:</span>
                        <span className={styles.infoValue}>{cuit}</span>
                      </div>
                      
                      {!representanteInicial && (
                        <button
                          type="button"
                          className={styles.editButton}
                          onClick={() => {
                            setCuit("");
                            setErrores({});
                            setFaseInterna("ingresar");
                          }}
                          title="Modificar CUIT"
                          aria-label="Modificar CUIT"
                        >
                          <FiEdit2 size={16} />
                        </button>
                      )}
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
                    <InputSocioMasked
                      name="modalRepEmail_unique"
                      label="Email Personal"
                      type="email"
                      icon={<FiMail />}
                      error={errores.email}
                      esValido={isEmailValido}
                      value={email}
                      onChange={(val) => {
                        setEmail(val);
                        if (errores.email)
                          setErrores({ ...errores, email: null });
                      }}
                    />
                    <InputSocioMasked
                      name="modalRepCelular_unique"
                      label="Celular (Sin 0 ni 15)"
                      autoComplete="off"
                      icon={<FiSmartphone />}
                      mask={[
                        { mask: "00 0000-0000" },
                        { mask: "000 000-0000" }
                      ]}
                      error={errores.celular}
                      esValido={isCelularValido}
                      value={celular}
                      onChange={(val) => {
                        setCelular(val);
                        if (errores.celular) {
                          setErrores({ ...errores, celular: null });
                        }
                      }}
                    />
                  </div>
                </div>
              )}
            </section>

            {faseInterna === "completar" && (
              <div className={styles.modalFooter}>
                <Button
                  type="button"
                  variant="primary"
                  size="md"
                  onClick={handleGuardarYCerrar}
                >
                  GUARDAR REPRESENTANTE
                </Button>
              </div>
            )}
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};
