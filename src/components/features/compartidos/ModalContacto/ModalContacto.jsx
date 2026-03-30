import React, { useState } from "react";
import {
  FiSmartphone,
  FiX,
  FiCheckCircle,
  FiMessageSquare,
} from "react-icons/fi";
import { useFormContext } from "react-hook-form";
import { Button, InputFlotante } from "../../../ui";
import styles from "./ModalContacto.module.css";
import { useEscape } from "../../../../hooks/useEscape";

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

  const handleSolicitarSms = () => {
    setIntentoSolicitarSms(true);
    if (isCelValido) {
      setValue("celular", celLocal, {
        shouldValidate: true,
        shouldDirty: true,
      });
      setFase("verificar");
    }
  };

  const handleVerificarSms = () => {
    if (codigoSms.length === 6 && !procesando) {
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

  return (
    <div
      className={styles.overlay}
      onMouseDown={handleOverlayMouseDown}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.stopPropagation();
          handleClose();
        }
      }}
    >
      <div
        className={styles.modalContainer}
        onClick={(e) => e.stopPropagation()}
        role="presentation"
        onKeyDown={(e) => e.stopPropagation()}
      >
        {!procesando && (
          <button
            className={styles.btnClose}
            onClick={handleClose}
            aria-label="Cerrar"
          >
            <FiX size={20} />
          </button>
        )}

        <div className={styles.body}>
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
                <InputFlotante
                  label="Celular (Sin 0 ni 15)"
                  maxLength={10}
                  error={errorCel}
                  esValido={isCelValido}
                  value={celLocal}
                  onChange={(e) =>
                    setCelLocal(e.target.value.replace(/\D/g, ""))
                  }
                />
              </div>
              <div className={styles.btnSave}>
                <Button
                  variant="primary"
                  onClick={handleSolicitarSms}
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
                <InputFlotante
                  label="Código de verificación"
                  value={codigoSms}
                  maxLength={6}
                  onChange={(e) =>
                    setCodigoSms(e.target.value.replace(/\D/g, ""))
                  }
                  esValido={codigoSms.length === 6}
                />
              </div>
              <div className={styles.btnSave}>
                <Button
                  variant="primary"
                  onClick={handleVerificarSms}
                  disabled={codigoSms.length < 6 || procesando}
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
        </div>
      </div>
    </div>
  );
}
