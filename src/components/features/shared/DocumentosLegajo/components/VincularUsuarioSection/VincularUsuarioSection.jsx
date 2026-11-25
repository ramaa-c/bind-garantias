import React, { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { FiAlertCircle, FiMail, FiUserCheck } from "react-icons/fi";
import { toast } from "sonner";
import { Button } from "../../../../../ui/Button/Button";
import { sociosService } from "../../../../../../services/sociosService";
import { usuarioVinculacionService } from "../../../../../../services/usuarioVinculacionService";
import { useChannel } from "../../../../../../context/useChannel";
import { mensajeDeApi } from "../../../../../../utils/mensajesError";
import styles from "../../DocumentosLegajo.module.css";

// `compacto`: sin tarjeta ni encabezado propios, para cuando el contenedor
// ya los pone (tarjeta "Accesos" de Perfil corporativo). El panel admin
// sigue usando la versión completa como pestaña.
// El cliente suma personas con POST api/UsuarioVinculacion (la API invita o
// vincula según el correo); el Admin general sigue usando porEmail.
export function VincularUsuarioSection({ socioIdActivo, cuit, compacto = false }) {
  const queryClient = useQueryClient();
  const { basePath } = useChannel();
  const [emailVincular, setEmailVincular] = useState("");
  const [emailError, setEmailError] = useState("");
  const [loadingVinculacion, setLoadingVinculacion] = useState(false);
  const isAdmin =
    typeof window !== "undefined" && window.location.pathname.includes("/admin");

  const handleVincularUsuario = async (e) => {
    if (e) e.preventDefault();
    setEmailError("");

    const emailNormalizado = emailVincular.trim();

    if (!emailNormalizado) {
      setEmailError("Por favor, ingresá un correo electrónico.");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailNormalizado)) {
      setEmailError("El formato del correo electrónico no es válido.");
      return;
    }

    setLoadingVinculacion(true);

    try {
      if (isAdmin) {
        await sociosService.vincularUsuarioPorEmail({
          socioId: socioIdActivo,
          email: emailNormalizado,
        });
        toast.success("Usuario vinculado exitosamente a la empresa.");
      } else {
        const respuesta = await usuarioVinculacionService.invitar({
          cuit,
          email: emailNormalizado.toLowerCase(),
          fronturl: window.location.origin + basePath,
        });
        const datos = Array.isArray(respuesta) ? respuesta[0] : respuesta;
        const vinculada = String(datos?.resultado ?? "").trim().toUpperCase() === "VINCULADA";
        toast.success(vinculada ? "Ya tiene acceso a la empresa" : "Le enviamos una invitación", {
          description: vinculada
            ? `${emailNormalizado} ya tenía cuenta: le avisamos por mail.`
            : `${emailNormalizado} va a quedar vinculado cuando se registre.`,
        });
        queryClient.invalidateQueries({ queryKey: ["usuarioVinculacion", "lista"] });
      }

      setEmailVincular("");
      queryClient.invalidateQueries({
        queryKey: ["socioUsuario", "listaPorSocio"],
      });
    } catch (err) {
      const status = err.response?.status;
      if (status === 409) {
        setEmailError(mensajeDeApi(err, "Este usuario ya se encuentra vinculado a la empresa."));
      } else if (status === 403 && !isAdmin) {
        setEmailError("Solo los administradores de la empresa pueden sumar personas.");
      } else if (status === 400 && !isAdmin) {
        setEmailError(mensajeDeApi(err, "Revisá el correo ingresado."));
      } else if (status === 404) {
        setEmailError(
          isAdmin
            ? "No pudimos vincular este correo. Verificá que esté bien escrito y que el usuario ya esté registrado en la plataforma."
            : "No encontramos la empresa entre las que podés administrar.",
        );
      } else if (status === 429) {
        setEmailError("Demasiados intentos. Intentá nuevamente más tarde.");
      } else {
        toast.error(
          "Ocurrió un error en el servidor al intentar vincular el usuario.",
        );
      }
    } finally {
      setLoadingVinculacion(false);
    }
  };

  const formulario = (
    <div className={styles.vincularInputWrapper}>
      <div className={styles.vincularInputGroup}>
        <div className={styles.vincularInputField}>
          <FiMail className={styles.vincularInputFieldIcon} size={14} />
          <input
            type="email"
            className={`${styles.vincularInput} ${isAdmin ? styles.vincularInputAdmin : ""} ${emailError ? styles.vincularInputError : ""}`}
            placeholder="ejemplo@correo.com"
            value={emailVincular}
            onChange={(e) => {
              setEmailVincular(e.target.value);
              if (emailError) setEmailError("");
            }}
            disabled={loadingVinculacion}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleVincularUsuario();
              }
            }}
          />
        </div>
        <Button
          type="button"
          variant={isAdmin ? "blue" : "primary"}
          size="sm"
          onClick={handleVincularUsuario}
          disabled={loadingVinculacion}
        >
          {loadingVinculacion ? "Vinculando..." : "Vincular usuario"}
        </Button>
      </div>
      <div className={styles.errorContainer}>
        {emailError && (
          <span className={styles.errorMessage}>
            <FiAlertCircle size={12} /> {emailError}
          </span>
        )}
      </div>
    </div>
  );

  if (compacto) {
    return (
      <div className={styles.vincularCompacto}>
        <p className={styles.vincularCompactoTexto}>
          Sumá a otra persona a esta empresa con su correo. Si todavía no
          tiene cuenta en Bind Garantías, le enviamos una invitación para que
          se registre.
        </p>
        {formulario}
      </div>
    );
  }

  return (
    <div className={styles.usuariosContainer}>
      <div className={styles.vincularForm}>
        <div className={styles.vincularFormHeader}>
          <span className={`${styles.vincularFormIcon} ${isAdmin ? styles.vincularFormIconAdmin : ""}`}>
            <FiUserCheck size={16} />
          </span>
          <div className={styles.vincularFormHeaderText}>
            <h5 className={styles.vincularFormTitle}>Vincular nuevo usuario</h5>
            <p className={styles.vincularFormText}>
              {isAdmin
                ? "Ingresá el correo electrónico del usuario que deseás vincular. Este usuario debe estar previamente registrado en la plataforma Bind Garantías."
                : "Ingresá el correo de la persona. Si ya tiene cuenta queda vinculada; si no, le enviamos una invitación para que se registre."}
            </p>
          </div>
        </div>

        {formulario}
      </div>
    </div>
  );
}
