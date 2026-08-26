import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  FiSmartphone,
  FiX,
  FiCheckCircle,
  FiMessageSquare,
} from "react-icons/fi";
import { useFormContext, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { Button } from "../../../ui/Button/Button";
import { InputSocioMasked } from "../../../ui/InputSocioMasked/InputSocioMasked";
import { InputOTP } from "../../../ui/InputOtp/InputOtp";
import styles from "./ContactoModal.module.css";
import { useEscape } from "../../../../hooks/useEscape";
import { useValidarNumero } from "../../../../hooks/useSms";

const COOLDOWN_SEGUNDOS = 60;
const LONGITUD_CODIGO_DEFECTO = 6;

export default function ContactoModal({ isOpen, onClose, onGuardar }) {
  const { getValues, setValue, control } = useFormContext();
  const { mutate: validarNumero, isPending: enviandoSms } = useValidarNumero();

  const celularVerificado = useWatch({ control, name: "celularVerificado" }) || "";

  const [fase, setFase] = useState("ingresar");
  const [intentoSolicitarSms, setIntentoSolicitarSms] = useState(false);
  const [procesando, setProcesando] = useState(false);
  const [codigoSms, setCodigoSms] = useState("");
  const [celLocal, setCelLocal] = useState("");
  const [codigoReal, setCodigoReal] = useState(null);
  const [smsDesactivada, setSmsDesactivada] = useState(false);
  const [errorCodigo, setErrorCodigo] = useState(null);
  const [segundosRestantes, setSegundosRestantes] = useState(0);

  const [prevIsOpen, setPrevIsOpen] = useState(isOpen);

  if (isOpen !== prevIsOpen) {
    setPrevIsOpen(isOpen);
    if (isOpen) {
      setCelLocal(getValues("celular") || "");
      setFase("ingresar");
      setCodigoSms("");
      setProcesando(false);
      setIntentoSolicitarSms(false);
      setCodigoReal(null);
      setSmsDesactivada(false);
      setErrorCodigo(null);
      setSegundosRestantes(0);
    }
  }

  useEffect(() => {
    if (segundosRestantes <= 0) return undefined;
    const id = setTimeout(() => setSegundosRestantes((s) => s - 1), 1000);
    return () => clearTimeout(id);
  }, [segundosRestantes]);

  const handleClose = () => {
    if (procesando || enviandoSms) return;
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
  const longitudCodigo = codigoReal ? codigoReal.length : LONGITUD_CODIGO_DEFECTO;
  const celularYaValidado = isCelValido && celLocal === celularVerificado;

  const enviarSms = (numero) => {
    validarNumero(
      { nroTelefono: numero, codigo: "" },
      {
        onSuccess: (data) => {
          setSmsDesactivada(false);
          setCodigoReal(data?.codigo || "");
          setCodigoSms("");
          setErrorCodigo(null);
          setFase("verificar");
          setSegundosRestantes(COOLDOWN_SEGUNDOS);
        },
        onError: (error) => {
          const status = error?.response?.status;
          if (status === 406) {
            setSmsDesactivada(true);
            setCodigoReal(null);
            setCodigoSms("");
            setErrorCodigo(null);
            setFase("verificar");
            setSegundosRestantes(COOLDOWN_SEGUNDOS);
            return;
          }
          // Error de red: ya lo notifica el interceptor de axios.
          if (!error?.response) return;
          toast.error("Error al enviar el código", {
            description:
              status === 404
                ? "No se pudo enviar el SMS. Intentá de nuevo en unos segundos."
                : "Ocurrió un error al validar el número. Intentá más tarde.",
          });
        },
      },
    );
  };

  const handleSolicitarSms = (e) => {
    if (e) e.preventDefault();
    setIntentoSolicitarSms(true);
    if (!isCelValido || enviandoSms) return;

    setValue("celular", celLocal, {
      shouldValidate: true,
      shouldDirty: true,
    });

    // Este número exacto ya pasó la validación por SMS antes: no tiene
    // sentido (ni cupo) reenviar otro código para lo mismo.
    if (celularYaValidado) {
      onGuardar();
      return;
    }

    enviarSms(celLocal);
  };

  const handleReenviarSms = () => {
    if (segundosRestantes > 0 || enviandoSms) return;
    enviarSms(celLocal);
  };

  const handleVerificarSms = (e) => {
    if (e) e.preventDefault();
    if (codigoSms.length !== longitudCodigo || procesando) return;

    if (!smsDesactivada && codigoSms !== codigoReal) {
      setErrorCodigo("Código incorrecto");
      return;
    }

    setValue("celularVerificado", celLocal, { shouldDirty: true });
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
  };

  const handleOverlayMouseDown = (e) => {
    if (e.target === e.currentTarget) handleClose();
  };

  const mm = String(Math.floor(segundosRestantes / 60)).padStart(2, "0");
  const ss = String(segundosRestantes % 60).padStart(2, "0");

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
                  disabled={enviandoSms}
                />
              </div>
              {celularYaValidado && (
                <p className={styles.yaValidadoHint}>
                  <FiCheckCircle size={14} /> Este número ya fue validado.
                </p>
              )}
              <div className={styles.btnSave}>
                <Button
                  type="button"
                  variant="primary"
                  onClick={handleSolicitarSms}
                  disabled={enviandoSms || celLocal.length < 10}
                  style={{ width: "100%", minHeight: "3rem" }}
                >
                  {enviandoSms
                    ? "ENVIANDO..."
                    : celularYaValidado
                      ? "CONTINUAR"
                      : "ENVIAR CÓDIGO SMS"}
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
                <InputOTP
                  value={codigoSms}
                  onChange={(val) => {
                    setErrorCodigo(null);
                    setCodigoSms(val);
                  }}
                  error={errorCodigo}
                  esValido={codigoSms.length === longitudCodigo && !errorCodigo}
                  disabled={procesando || enviandoSms}
                  length={longitudCodigo}
                />
              </div>
              <div className={styles.btnSave}>
                <Button
                  type="button"
                  variant="primary"
                  onClick={handleVerificarSms}
                  disabled={codigoSms.length !== longitudCodigo || procesando}
                  style={{ width: "100%", minHeight: "3rem" }}
                >
                  VERIFICAR IDENTIDAD
                </Button>
              </div>
              <div className={styles.resendRow}>
                <span className={styles.resendLabel}>¿No recibiste el código?</span>
                {segundosRestantes > 0 ? (
                  <span className={styles.resendTimer}>
                    {mm}:{ss}
                  </span>
                ) : (
                  <button
                    type="button"
                    className={styles.resendBtn}
                    onClick={handleReenviarSms}
                    disabled={enviandoSms}
                  >
                    {enviandoSms ? "Reenviando..." : "Reenviar SMS"}
                  </button>
                )}
              </div>
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
