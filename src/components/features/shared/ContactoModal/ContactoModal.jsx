import React, { useState, useEffect } from "react";
import {
  FiSmartphone,
  FiCheckCircle,
  FiMessageSquare,
  FiCheck,
} from "react-icons/fi";
import { useFormContext, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { Modal } from "../../../ui/Modal/Modal";
import { Button } from "../../../ui/Button/Button";
import { InputSocioMasked } from "../../../ui/InputSocioMasked/InputSocioMasked";
import { InputOTP } from "../../../ui/InputOtp/InputOtp";
import styles from "./ContactoModal.module.css";
import { useValidarNumero } from "../../../../hooks/useSms";
import { mensajeDeApi } from "../../../../utils/mensajesError";

const COOLDOWN_SEGUNDOS = 60;
const LONGITUD_CODIGO_DEFECTO = 6;

export default function ContactoModal({ isOpen, onClose, onGuardar, textoCancelar = "Cancelar", descripcion }) {
  const { getValues, setValue, control } = useFormContext();
  const { mutate: validarNumero, isPending: enviandoSms } = useValidarNumero();

  const celularVerificado = useWatch({ control, name: "celularVerificado" }) || "";

  const [fase, setFase] = useState("ingresar");
  const [intentoSolicitarSms, setIntentoSolicitarSms] = useState(false);
  const [procesando, setProcesando] = useState(false);
  const [codigoSms, setCodigoSms] = useState("");
  const [celLocal, setCelLocal] = useState("");
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
    setFase("ingresar");
    setCodigoSms("");
    onClose();
  };

  if (!isOpen) return null;

  const errorCel =
    intentoSolicitarSms && celLocal.length < 10
      ? "Debe tener 10 números"
      : null;
  const isCelValido = !errorCel && celLocal.length === 10;
  const longitudCodigo = LONGITUD_CODIGO_DEFECTO;
  const celularYaValidado = isCelValido && celLocal === celularVerificado;

  const enviarSms = (numero) => {
    validarNumero(
      { nroTelefono: numero, codigo: "" },
      {
        onSuccess: () => {
          setSmsDesactivada(false);
          setCodigoSms("");
          setErrorCodigo(null);
          setFase("verificar");
          setSegundosRestantes(COOLDOWN_SEGUNDOS);
        },
        onError: (error) => {
          const status = error?.response?.status;
          if (status === 406) {
            setSmsDesactivada(true);
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
              status === 429
                ? mensajeDeApi(error, "Esperá un minuto antes de pedir otro código.")
                : status === 400
                  ? mensajeDeApi(error, "El número no es válido.")
                  : status === 404
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

    const completarVerificacion = () => {
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

    // Integración de SMS apagada: no hay código que comparar.
    if (smsDesactivada) {
      completarVerificacion();
      return;
    }

    // El código lo compara la API: queda registrado que este usuario verificó
    // este celular, y PUT Socio lo exige para cambiarlo.
    validarNumero(
      { nroTelefono: celLocal, codigo: codigoSms },
      {
        onSuccess: completarVerificacion,
        onError: (error) => {
          const status = error?.response?.status;
          if (status === 400) {
            setErrorCodigo(
              mensajeDeApi(error, "El código ingresado no es correcto. Revisalo o pedí uno nuevo."),
            );
          } else if (status === 429) {
            setErrorCodigo(mensajeDeApi(error, "Demasiados intentos. Pedí un código nuevo."));
          } else if (error?.response) {
            toast.error("No se pudo verificar el código", {
              description: "Ocurrió un error al validar el código. Intentá más tarde.",
            });
          }
        },
      },
    );
  };

  const mm = String(Math.floor(segundosRestantes / 60)).padStart(2, "0");
  const ss = String(segundosRestantes % 60).padStart(2, "0");

  const pasoActual = fase === "ingresar" ? 1 : 2;
  // Mismo formato que la máscara del input: AMBA (11) es 2+4+4, el resto
  // 3+3+4.
  const celularMostrado = celLocal.startsWith("11")
    ? `${celLocal.slice(0, 2)} ${celLocal.slice(2, 6)}-${celLocal.slice(6)}`
    : `${celLocal.slice(0, 3)} ${celLocal.slice(3, 6)}-${celLocal.slice(6)}`;

  const footer =
    fase === "ingresar" ? (
      <div className={styles.footer}>
        <Button
          type="button"
          variant="outline"
          onClick={handleClose}
          disabled={enviandoSms}
          className={styles.footerBtn}
        >
          {textoCancelar}
        </Button>
        <Button
          type="button"
          variant="primary"
          onClick={handleSolicitarSms}
          disabled={enviandoSms || celLocal.length < 10}
          isLoading={enviandoSms}
          className={styles.footerBtn}
        >
          {enviandoSms
            ? "ENVIANDO..."
            : celularYaValidado
              ? "Continuar"
              : "Enviar código"}
        </Button>
      </div>
    ) : fase === "verificar" ? (
      <div className={styles.footer}>
        <Button
          type="button"
          variant="outline"
          onClick={() => setFase("ingresar")}
          disabled={procesando}
          className={styles.footerBtn}
        >
          Cambiar número
        </Button>
        <Button
          type="button"
          variant="primary"
          onClick={handleVerificarSms}
          disabled={codigoSms.length !== longitudCodigo || procesando}
          className={styles.footerBtn}
        >
          Verificar
        </Button>
      </div>
    ) : null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      maxWidth="30rem"
      preventClose={procesando || enviandoSms}
      footer={footer}
    >
      <form
        className={styles.body}
        onSubmit={(e) => {
          e.preventDefault();
          if (fase === "ingresar") {
            handleSolicitarSms(e);
          } else if (fase === "verificar") {
            handleVerificarSms(e);
          }
        }}
      >
        {fase !== "exito" && (
          <div className={styles.header}>
            <span className={styles.iconWrapper} aria-hidden="true">
              {fase === "ingresar" ? (
                <FiSmartphone size={20} />
              ) : (
                <FiMessageSquare size={20} />
              )}
            </span>
            <div className={styles.headerTexto}>
              <span className={styles.paso}>Paso {pasoActual} de 2</span>
              <h2 className={styles.title}>
                {fase === "ingresar" ? "Verificá tu celular" : "Ingresá el código"}
              </h2>
            </div>
          </div>
        )}

        {fase !== "exito" && (
          <div className={styles.progreso} aria-hidden="true">
            <span className={`${styles.progresoTramo} ${styles.progresoActivo}`} />
            <span
              className={`${styles.progresoTramo} ${pasoActual === 2 ? styles.progresoActivo : ""}`}
            />
          </div>
        )}

        {fase === "ingresar" && (
          <>
            <p className={styles.description}>
              {descripcion || "Ingresá tu número y te enviamos un SMS con un código de validación."}
            </p>
            <div className={styles.formSection}>
              <InputSocioMasked
                label="Celular (sin 0 ni 15)"
                mask={[{ mask: "00 0000-0000" }, { mask: "000 000-0000" }]}
                unmask={true}
                error={errorCel}
                esValido={isCelValido}
                value={celLocal}
                onChange={(val) =>
                  setCelLocal(typeof val === "string" ? val : val.target?.value || "")
                }
                icon={<FiSmartphone />}
                disabled={enviandoSms}
              />
            </div>
            {celularYaValidado && (
              <p className={styles.yaValidadoHint}>
                <FiCheckCircle size={14} aria-hidden="true" /> Este número ya fue
                validado.
              </p>
            )}
          </>
        )}

        {fase === "verificar" && (
          <>
            <p className={styles.description}>
              {smsDesactivada ? (
                "Confirmá para continuar con la verificación."
              ) : (
                <>
                  Te enviamos un código por SMS al{" "}
                  <strong className={styles.numero}>{celularMostrado}</strong>.
                </>
              )}
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
            <div className={styles.resendRow}>
              <span className={styles.resendLabel}>¿No recibiste el código?</span>
              {segundosRestantes > 0 ? (
                <span className={styles.resendTimer}>
                  Reenviar en {mm}:{ss}
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
          <div className={styles.exito} role="status">
            <span className={styles.exitoIcono} aria-hidden="true">
              <FiCheck size={30} />
            </span>
            <h2 className={styles.title}>¡Celular verificado!</h2>
            <p className={styles.description}>
              Guardando tus datos para continuar...
            </p>
          </div>
        )}
      </form>
    </Modal>
  );
}
