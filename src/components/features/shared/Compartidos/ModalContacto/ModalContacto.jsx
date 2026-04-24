import React, { useState } from "react";
import { createPortal } from "react-dom";
import {
  FiSmartphone,
  FiX,
  FiCheckCircle,
  FiMessageSquare,
} from "react-icons/fi";
import { useFormContext } from "react-hook-form";
import { Button, InputSocioMasked } from "../../../../ui";
import styles from "./ModalContacto.module.css";
import { useEscape } from "../../../../../hooks/useEscape";

export default function ModalContacto({ isOpen, onClose, onGuardar }) {
  const { getValues, setValue } = useFormContext();

  const [fase, setFase] = useState("ingresar");
  const [intentoSolicitarSms, setIntentoSolicitarSms] = useState(false);
  const [procesando, setProcesando] = useState(false);
  const [codigoSms, setCodigoSms] = useState("");
  const [celLocal, setCelLocal] = useState("");

  const [prevIsOpen, setPrevIsOpen] = useState(isOpen);

  if (isOpen !== prevIsOpen) {
    setPrevIsOpen(isOpen);
    if (isOpen) {
      setCelLocal(getValues("celular") || "");
      setFase("ingresar");
      setCodigoSms("");
      setProcesando(false);
      setIntentoSolicitarSms(false);
    }
  }

  const handleClose = () => {
    if (procesando) return;
    setFase("ingresar");
    setCodigoSms("");
    onClose();
  };

  useEscape(handleClose, isOpen);

  if (!isOpen) return null;

  const errorCel =
    intentoSolicitarSms && celLocal.length < 10
      ? "Debe tener 10 números"
      : null;
  const isCelValido = !errorCel && celLocal.length === 10;

  const handleSolicitarSms = (e) => {
    if (e) e.preventDefault();
    setIntentoSolicitarSms(true);
    if (isCelValido) {
      setValue("celular", celLocal, {
        shouldValidate: true,
        shouldDirty: true,
      });
      setFase("verificar");
    }
  };

  const handleVerificarSms = (e) => {
    if (e) e.preventDefault();
    if (codigoSms.length === 4 && !procesando) {
      setProcesando(true);
      setFase("exito");

      setTimeout(() => {
        onGuardar();
        setTimeout(() => {
          setFase("ingresar");
          setCodigoSms("");
          setProcesando(false);
        }, 300);
      }, 1200);
    }
  };

  const handleOverlayMouseDown = (e) => {
    if (e.target === e.currentTarget) handleClose();
  };

  return createPortal(
    <div
      className={styles.overlay}
      onMouseDown={handleOverlayMouseDown}
    >
      <div
        className={styles.modalContainer}
        onMouseDown={(e) => e.stopPropagation()}
      >
        {!procesando && (
          <button
            type="button"
            className={styles.btnClose}
            onClick={handleClose}
            aria-label="Cerrar"
          >
            <FiX size={20} />
          </button>
        )}

        <form className={styles.body} onSubmit={(e) => {
          e.preventDefault();
          if (fase === "ingresar") {
            handleSolicitarSms(e);
          } else if (fase === "verificar") {
            handleVerificarSms(e);
          }
        }}>
          {fase === "ingresar" && (
            <>
              <div className={styles.iconWrapper}>
                <FiSmartphone size={30} />
              </div>
              <h2 className={styles.title}>Verificá tu celular</h2>
              <p className={styles.description}>
                Ingresá tu número. Te enviaremos un SMS con un código de
                validación.
              </p>
              <div className={styles.formSection}>
                <InputSocioMasked
                  label="Celular (Sin 0 ni 15)"
                  mask={[
                    { mask: "00 0000-0000" },
                    { mask: "000 000-0000" }
                  ]}
                  unmask={true}
                  error={errorCel}
                  esValido={isCelValido}
                  value={celLocal}
                  onChange={(val) => setCelLocal(typeof val === 'string' ? val : val.target?.value || "")}
                  icon={<FiSmartphone />}
                />
              </div>
              <div className={styles.btnSave}>
                <Button
                  type="button"
                  variant="primary"
                  onClick={handleSolicitarSms}
                  disabled={procesando || celLocal.length < 10}
                  style={{ width: "100%", minHeight: "3rem" }}
                >
                  ENVIAR CÓDIGO SMS
                </Button>
              </div>
            </>
          )}

          {fase === "verificar" && (
            <>
              <div className={styles.iconWrapperSuccess}>
                <FiMessageSquare size={30} />
              </div>
              <h2 className={styles.title}>Código enviado</h2>
              <p className={styles.description}>
                Ingresalo a continuación. <br />
                <span
                  className={styles.linkEdit}
                  role="button"
                  tabIndex={0}
                  onClick={() => setFase("ingresar")}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      setFase("ingresar");
                    }
                  }}
                >
                  ¿Te equivocaste de número?
                </span>
              </p>
              <div className={styles.formSection}>
                <InputSocioMasked
                  label="Código de verificación"
                  mask="0000"
                  unmask={true}
                  value={codigoSms}
                  esValido={codigoSms.length === 4}
                  onChange={(val) => setCodigoSms(typeof val === 'string' ? val : val.target?.value || "")}
                  icon={<FiMessageSquare />}
                />
              </div>
              <div className={styles.btnSave}>
                <Button
                  type="button"
                  variant="primary"
                  onClick={handleVerificarSms}
                  disabled={codigoSms.length < 4 || procesando}
                  style={{ width: "100%", minHeight: "3rem" }}
                >
                  VERIFICAR IDENTIDAD
                </Button>
              </div>
              <p className={styles.resendText}>
                ¿No recibiste el código?{" "}
                <span className={styles.resendLink}>Reenviar SMS</span>
              </p>
            </>
          )}

          {fase === "exito" && (
            <div
              style={{ animation: "scaleIn 0.5s ease", textAlign: "center" }}
            >
              <div
                className={styles.iconWrapperSuccess}
                style={{ margin: "0 auto 20px auto" }}
              >
                <FiCheckCircle size={40} />
              </div>
              <h2 className={styles.title}>¡Celular Verificado!</h2>
              <p className={styles.description}>
                Guardando tus datos para continuar...
              </p>
            </div>
          )}
        </form>
      </div>
    </div>,
    document.body
  );
}
