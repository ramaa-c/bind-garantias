import React, { useState } from "react";
import { toast } from "sonner";
import { FiCheck, FiInfo, FiMail, FiRefreshCw, FiUserPlus } from "react-icons/fi";
import { Button } from "../../../ui/Button/Button";
import { RESULTADO_VINCULADA } from "../../../../hooks/useUsuariosEmpresa";
import {
  EMAIL_REGEX,
  LARGO_MAXIMO_EMAIL,
  LARGO_MAXIMO_NOMBRE,
} from "../InvitarUsuarioModal/InvitarUsuarioModal";
import { PASOS_INVITACION } from "./pasosInvitacion";
import styles from "./PendientesEmpresa.module.css";

// Próximo paso del vendor con una empresa recién validada: invitar al
// cliente (mail de bienvenida). El formulario vive en el panel de
// pendientes, sin modal intermedio, y una vez enviado queda la espera con
// la opción de reenviar.
export function PasoInvitacion({ nombreEmpresa, invitacion, entraComoAdmin, onInvitar, onReenviar }) {
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [errores, setErrores] = useState({});
  const [enviando, setEnviando] = useState(false);
  const [reenviando, setReenviando] = useState(false);
  const [otroMail, setOtroMail] = useState(false);

  const enEspera = !!invitacion && !otroMail;
  const pasoActual = invitacion ? 2 : 1;

  const enviar = async (e) => {
    e.preventDefault();
    const nombreLimpio = nombre.trim();
    const emailLimpio = email.trim();
    const nuevosErrores = {};
    if (!nombreLimpio) nuevosErrores.nombre = "Ingresá el nombre de la persona.";
    if (!EMAIL_REGEX.test(emailLimpio)) nuevosErrores.email = "Ingresá un correo electrónico válido.";
    if (Object.keys(nuevosErrores).length > 0) {
      setErrores(nuevosErrores);
      return;
    }
    setEnviando(true);
    try {
      const resultado = await onInvitar({ email: emailLimpio, nombre: nombreLimpio });
      if (resultado === RESULTADO_VINCULADA) {
        toast.success("Le dimos acceso a la empresa", {
          description: `${emailLimpio} ya tenía cuenta: puede ingresar cuando quiera.`,
        });
      } else {
        toast.success("Mail de bienvenida enviado", { description: emailLimpio });
      }
      setNombre("");
      setEmail("");
      setErrores({});
      setOtroMail(false);
    } catch (err) {
      setErrores({ general: err.message || "No pudimos enviar el mail. Probá de nuevo." });
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

  const limpiarError = () => setErrores({});

  return (
    <>
      <div className={styles.pasoCabecera}>
        <small className={enEspera ? styles.pasoEtiquetaEspera : styles.pasoEtiqueta}>
          {enEspera ? "Esperando al cliente" : `Próximo paso · ${pasoActual + 1} de ${PASOS_INVITACION.length}`}
        </small>
        <strong>
          {enEspera ? `Le enviamos la bienvenida a ${invitacion.nombre || invitacion.email}` : `Invitá a ${nombreEmpresa} a operar`}
        </strong>
      </div>

      {enEspera ? (
        <div className={styles.pasoCuerpo}>
          <p className={styles.pasoEnviado}>
            <FiMail aria-hidden="true" />
            <span>
              Enviado a <b>{invitacion.email}</b>. Falta que se registre para operar con la empresa.
            </span>
          </p>
          <div className={styles.pasoAcciones}>
            <Button type="button" variant="outline" size="sm" onClick={reenviar} isLoading={reenviando}>
              <FiRefreshCw aria-hidden="true" /> Reenviar mail
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={() => setOtroMail(true)} disabled={reenviando}>
              <FiUserPlus aria-hidden="true" /> Invitar a otro mail
            </Button>
          </div>
        </div>
      ) : (
        <form className={styles.pasoCuerpo} onSubmit={enviar} noValidate>
          <label className={styles.campo}>
            <span className={styles.campoEtiqueta}>Nombre y apellido</span>
            <input
              type="text"
              className={`${styles.campoInput} ${errores.nombre ? styles.campoInputError : ""}`}
              placeholder="Ana Pérez"
              value={nombre}
              maxLength={LARGO_MAXIMO_NOMBRE}
              onChange={(e) => {
                setNombre(e.target.value);
                limpiarError();
              }}
              autoFocus
            />
            {errores.nombre && <span className={styles.campoError}>{errores.nombre}</span>}
          </label>
          <label className={styles.campo}>
            <span className={styles.campoEtiqueta}>Mail de la empresa</span>
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
            />
            {errores.email && <span className={styles.campoError}>{errores.email}</span>}
          </label>
          <p className={styles.pasoAyuda}>
            <FiInfo aria-hidden="true" />
            {entraComoAdmin
              ? "Indicá el mail de la empresa que quedará asociado a ese CUIT y es el que deben utilizar para operar."
              : "Entra como usuario de la empresa; si ya tiene una cuenta, le damos acceso directamente."}
          </p>
          {errores.general && <p className={styles.campoErrorGeneral}>{errores.general}</p>}
          <div className={styles.pasoAcciones}>
            {otroMail && (
              <Button type="button" variant="outline" size="sm" onClick={() => setOtroMail(false)} disabled={enviando}>
                Cancelar
              </Button>
            )}
            <Button type="submit" variant="primary" size="sm" className={styles.pasoEnviar} isLoading={enviando}>
              <FiMail aria-hidden="true" /> Enviar mail de bienvenida
            </Button>
          </div>
        </form>
      )}

      <ol className={styles.pasoLista} aria-label="Recorrido con el cliente">
        {PASOS_INVITACION.map((paso, i) => {
          const estado = i < pasoActual ? "hecho" : i === pasoActual ? "actual" : "futuro";
          return (
            <li key={paso} className={styles[`paso_${estado}`]} aria-current={estado === "actual" ? "step" : undefined}>
              <span className={styles.pasoMarca} aria-hidden="true">
                {estado === "hecho" && <FiCheck />}
              </span>
              {paso}
            </li>
          );
        })}
      </ol>
    </>
  );
}

export default PasoInvitacion;
