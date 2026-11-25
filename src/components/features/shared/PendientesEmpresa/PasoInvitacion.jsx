import React, { useState } from "react";
import { toast } from "sonner";
import { FiAlertTriangle, FiInfo, FiKey, FiMail, FiRefreshCw, FiUserPlus } from "react-icons/fi";
import { Button } from "../../../ui/Button/Button";
import { RESULTADO_VINCULADA } from "../../../../hooks/useUsuariosEmpresa";
import {
  EMAIL_REGEX,
  LARGO_MAXIMO_EMAIL,
  LARGO_MAXIMO_NOMBRE,
} from "../InvitarUsuarioModal/InvitarUsuarioModal";
import { PASOS_INVITACION } from "./pasosInvitacion";
import styles from "./PendientesEmpresa.module.css";

const AYUDA_MAIL = "El mail de la empresa: queda asociado al CUIT y es el que van a usar para operar.";

// Próximo paso del vendor con una empresa recién validada: invitar al
// cliente (mail de bienvenida). El formulario vive en el panel de
// pendientes, sin modal intermedio, y una vez enviado queda la espera con
// la opción de reenviar o de cambiar el mail invitado.
export function PasoInvitacion({ nombreEmpresa, invitacion, entraComoAdmin, onInvitar, onReenviar }) {
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [errores, setErrores] = useState({});
  const [enviando, setEnviando] = useState(false);
  const [reenviando, setReenviando] = useState(false);
  const [otroMail, setOtroMail] = useState(false);
  const [confirmandoReemplazo, setConfirmandoReemplazo] = useState(false);

  const enEspera = !!invitacion && !otroMail;
  const reemplazando = !!invitacion && otroMail;

  const enviar = async (e) => {
    e.preventDefault();
    const nombreLimpio = nombre.trim();
    const emailLimpio = email.trim();
    if (!EMAIL_REGEX.test(emailLimpio)) {
      setErrores({ email: "Ingresá un correo electrónico válido." });
      return;
    }
    if (reemplazando && !confirmandoReemplazo) {
      setConfirmandoReemplazo(true);
      return;
    }
    setEnviando(true);
    try {
      const { resultado, esAdministradorCuit } = await onInvitar({ email: emailLimpio, nombre: nombreLimpio });
      const rol = esAdministradorCuit ? " como administrador" : "";
      if (resultado === RESULTADO_VINCULADA) {
        toast.success("Ya tiene acceso a la empresa", {
          description: `${emailLimpio} ya tenía cuenta: quedó vinculado${rol} y le avisamos por mail.`,
        });
      } else {
        toast.success("Le enviamos una invitación", {
          description: `${emailLimpio} va a quedar vinculado${rol} cuando se registre.`,
        });
      }
      setNombre("");
      setEmail("");
      setErrores({});
      setOtroMail(false);
      setConfirmandoReemplazo(false);
    } catch (err) {
      setConfirmandoReemplazo(false);
      setErrores({ general: err?.message || "No pudimos enviar el mail. Probá de nuevo." });
    } finally {
      setEnviando(false);
    }
  };

  const reenviar = async () => {
    setReenviando(true);
    try {
      await onReenviar(invitacion);
      toast.success("Mail de bienvenida reenviado", { description: invitacion.email });
    } catch (err) {
      toast.error(err?.message || "No pudimos reenviar el mail. Probá de nuevo.");
    } finally {
      setReenviando(false);
    }
  };

  const limpiarError = () => {
    setErrores({});
    setConfirmandoReemplazo(false);
  };

  const cancelarOtroMail = () => {
    setOtroMail(false);
    setEmail("");
    setNombre("");
    setErrores({});
    setConfirmandoReemplazo(false);
  };

  const etiqueta = invitacion ? "Esperando al cliente" : `Paso 2 de ${PASOS_INVITACION.length}`;
  const titulo = enEspera
    ? `Le enviamos la bienvenida a ${invitacion.nombre || invitacion.email}`
    : reemplazando
      ? "Cambiar la invitación"
      : `Invitá a ${nombreEmpresa} a operar`;

  return (
    <>
      <div className={styles.pasoCabecera}>
        <small className={invitacion ? styles.pasoEtiquetaEspera : styles.pasoEtiqueta}>{etiqueta}</small>
        <strong>{titulo}</strong>
      </div>

      {enEspera ? (
        <div className={styles.pasoCuerpo}>
          <p className={styles.pasoEnviado}>
            <FiMail aria-hidden="true" />
            <span>
              Enviado a <b>{invitacion.email}</b>.{" "}
              {entraComoAdmin
                ? "Cuando se registre, le cedemos la administración de la empresa."
                : "Falta que se registre para operar con la empresa."}
            </span>
          </p>
          <div className={styles.pasoAcciones}>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className={styles.botonNeutro}
              onClick={reenviar}
              isLoading={reenviando}
            >
              <FiRefreshCw aria-hidden="true" /> Reenviar
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className={styles.botonNeutro}
              onClick={() => setOtroMail(true)}
              disabled={reenviando}
            >
              <FiUserPlus aria-hidden="true" /> Cambiar mail
            </Button>
          </div>
        </div>
      ) : (
        <form className={styles.pasoCuerpo} onSubmit={enviar} noValidate>
          {reemplazando && (
            <p className={styles.pasoReemplazo}>
              <FiAlertTriangle aria-hidden="true" />
              <span>
                La invitación a <b>{invitacion.email}</b> deja de valer.
              </span>
            </p>
          )}
          <label className={styles.campo}>
            <span className={styles.campoEtiqueta}>{reemplazando ? "Mail nuevo" : "Mail de la empresa"}</span>
            <input
              type="email"
              className={`${styles.campoInput} ${errores.email ? styles.campoInputError : ""}`}
              placeholder="nombre@empresa.com"
              value={email}
              maxLength={LARGO_MAXIMO_EMAIL}
              onChange={(e) => {
                setEmail(e.target.value);
                limpiarError();
              }}
              aria-invalid={!!errores.email}
              autoFocus
            />
            {errores.email ? (
              <span className={styles.campoError}>{errores.email}</span>
            ) : (
              <span className={styles.campoAyuda}>{AYUDA_MAIL}</span>
            )}
          </label>
          <label className={styles.campo}>
            <span className={styles.campoEtiqueta}>
              Nombre de la persona <span className={styles.campoOpcional}>(opcional)</span>
            </span>
            <input
              type="text"
              className={styles.campoInput}
              placeholder="Para personalizar el mail"
              value={nombre}
              maxLength={LARGO_MAXIMO_NOMBRE}
              onChange={(e) => {
                setNombre(e.target.value);
                limpiarError();
              }}
            />
          </label>
          {entraComoAdmin ? (
            <p className={styles.pasoConsecuencia}>
              <FiKey aria-hidden="true" />
              <span>
                Va a quedar como <b>administrador de {nombreEmpresa}</b> y vos dejás de administrarla.
              </span>
            </p>
          ) : (
            <p className={styles.pasoAyuda}>
              <FiInfo aria-hidden="true" />
              Entra como usuario de la empresa; si ya tiene una cuenta, le damos acceso y le avisamos por mail.
            </p>
          )}
          {errores.general && (
            <p className={styles.campoErrorGeneral} role="alert">
              {errores.general}
            </p>
          )}
          {confirmandoReemplazo ? (
            <div className={styles.pasoConfirmar} role="alert">
              <p>
                ¿Reemplazamos la invitación a <b>{invitacion.email}</b> por <b>{email.trim()}</b>?
              </p>
              <div className={styles.pasoAcciones}>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className={styles.botonNeutro}
                  onClick={() => setConfirmandoReemplazo(false)}
                  disabled={enviando}
                >
                  Volver
                </Button>
                <Button type="submit" variant="primary" size="sm" isLoading={enviando}>
                  Sí, reemplazar
                </Button>
              </div>
            </div>
          ) : reemplazando ? (
            <div className={styles.pasoAcciones}>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className={styles.botonNeutro}
                onClick={cancelarOtroMail}
                disabled={enviando}
              >
                Cancelar
              </Button>
              <Button type="submit" variant="primary" size="sm" isLoading={enviando}>
                Reemplazar invitación
              </Button>
            </div>
          ) : (
            <Button type="submit" variant="primary" size="sm" className={styles.pasoEnviar} isLoading={enviando}>
              <FiMail aria-hidden="true" /> Enviar mail de bienvenida
            </Button>
          )}
        </form>
      )}
    </>
  );
}

export default PasoInvitacion;
