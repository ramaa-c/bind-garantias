import React, { useState } from "react";
import { toast } from "sonner";
import { FiMail, FiInfo } from "react-icons/fi";
import { Button, Modal } from "../../../ui";
import { RESULTADO_VINCULADA } from "../../../../hooks/useUsuariosEmpresa";
import styles from "./InvitarUsuarioModal.module.css";

export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const LARGO_MAXIMO_NOMBRE = 75;
export const LARGO_MAXIMO_EMAIL = 100;

export function InvitarUsuarioModal({ isOpen, onClose, onInvitar, entraComoAdmin, invitacionPendiente }) {
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [errores, setErrores] = useState({});
  const [enviando, setEnviando] = useState(false);

  const limpiar = () => {
    setNombre("");
    setEmail("");
    setErrores({});
  };

  const cerrar = () => {
    if (enviando) return;
    limpiar();
    onClose();
  };

  const enviar = async (e) => {
    e.preventDefault();
    const nombreLimpio = nombre.trim();
    const emailLimpio = email.trim();
    const nuevosErrores = {};
    if (!EMAIL_REGEX.test(emailLimpio)) nuevosErrores.email = "Ingresá un correo electrónico válido.";
    if (Object.keys(nuevosErrores).length > 0) {
      setErrores(nuevosErrores);
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
      setEnviando(false);
      limpiar();
      onClose();
    } catch (err) {
      setEnviando(false);
      setErrores({ general: err.message || "No pudimos enviar la invitación. Probá de nuevo." });
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={cerrar}
      title="Invitar usuario"
      subtitle="Va a poder operar en esta empresa"
      maxWidth="30rem"
      preventClose={enviando}
      footer={
        <div className={styles.modalAcciones}>
          <Button type="button" variant="outline" size="md" onClick={cerrar} disabled={enviando}>
            Cancelar
          </Button>
          <Button type="submit" form="form-invitar-usuario" variant="primary" size="md" isLoading={enviando}>
            <FiMail /> Enviar invitación
          </Button>
        </div>
      }
    >
      <form id="form-invitar-usuario" className={styles.formInvitar} onSubmit={enviar} noValidate>
        <label className={styles.campo}>
          <span className={styles.campoLabel}>Nombre y apellido (opcional)</span>
          <input
            type="text"
            className={`${styles.campoInput} ${errores.nombre ? styles.campoInputError : ""}`}
            placeholder="Ana Pérez"
            value={nombre}
            maxLength={LARGO_MAXIMO_NOMBRE}
            onChange={(e) => {
              setNombre(e.target.value);
              setErrores({});
            }}
            autoFocus
          />
          {errores.nombre && <span className={styles.campoError}>{errores.nombre}</span>}
        </label>

        <label className={styles.campo}>
          <span className={styles.campoLabel}>Correo electrónico</span>
          <input
            type="email"
            className={`${styles.campoInput} ${errores.email ? styles.campoInputError : ""}`}
            placeholder="nombre@empresa.com"
            value={email}
            maxLength={LARGO_MAXIMO_EMAIL}
            onChange={(e) => {
              setEmail(e.target.value);
              setErrores({});
            }}
          />
          {errores.email && <span className={styles.campoError}>{errores.email}</span>}
        </label>

        {errores.general && <p className={styles.errorGeneral}>{errores.general}</p>}

        <p className={styles.notaInvitar}>
          <FiInfo aria-hidden="true" />
          Si la persona ya tiene una cuenta, le damos acceso y le avisamos por mail. Si no, le enviamos un mail para
          que se registre.{" "}
          {entraComoAdmin
            ? "Va a quedar como administrador de la empresa y vos dejás de administrarla. Indicá el mail de la empresa que quedará asociado a ese CUIT y es el que deben utilizar para operar."
            : "Entra como usuario; una vez vinculada, podés hacerla administradora."}
        </p>

        {entraComoAdmin && invitacionPendiente && (
          <p className={styles.notaInvitar}>
            <FiInfo aria-hidden="true" />
            Ya invitaste a {invitacionPendiente}. Si invitás a otro mail, esa invitación deja de valer y solo queda la
            nueva.
          </p>
        )}
      </form>
    </Modal>
  );
}

export default InvitarUsuarioModal;
