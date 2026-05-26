import React, { useState } from "react";
import { FiAlertCircle } from "react-icons/fi";
import { toast } from "sonner";
import { Button } from "../../../../../ui";
import { usuarioService } from "../../../../../../services/usuarioService";
import { sociosService } from "../../../../../../services/sociosService";
import styles from "../../DocumentosLegajo.module.css";

export function VincularUsuarioSection({ socioIdActivo }) {
  const [emailVincular, setEmailVincular] = useState("");
  const [emailError, setEmailError] = useState("");
  const [loadingVinculacion, setLoadingVinculacion] = useState(false);

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
    let targetUserId = null;

    try {
      const userData =
        await usuarioService.obtenerPorNombreOEmail(emailNormalizado);

      targetUserId =
        userData?.usuariowebid || userData?.UsuarioWebID || userData?.id;

      if (!targetUserId) {
        setEmailError("No se encontró un usuario registrado con este correo.");
        setLoadingVinculacion(false);
        return;
      }
    } catch (err) {
      console.warn("Error buscando usuario:", err);
      setEmailError("No se encontró un usuario registrado con este correo.");
      setLoadingVinculacion(false);
      return;
    }

    try {
      const date = new Date();
      const payloadVinculo = {
        usuariowebid: targetUserId,
        socioid: socioIdActivo,
        momentocreacion: date.toISOString().split(".")[0],
      };

      await sociosService.vincularSocioUsuario(payloadVinculo);

      toast.success("Usuario vinculado exitosamente a la empresa.");
      setEmailVincular("");
    } catch (err) {
      console.error("Error al hacer POST de vinculación:", err);

      if (err.response?.status === 400 || err.response?.status === 409) {
        setEmailError("Este usuario ya se encuentra vinculado a la empresa.");
      } else {
        toast.error(
          "Ocurrió un error en el servidor al intentar vincular el usuario.",
        );
      }
    } finally {
      setLoadingVinculacion(false);
    }
  };

  return (
    <div className={styles.usuariosContainer}>
      <div className={styles.vincularForm}>
        <h5 className={styles.vincularFormTitle}>Vincular nuevo usuario</h5>
        <p className={styles.vincularFormText}>
          Ingresá el correo electrónico del usuario que deseás vincular. Este
          usuario debe estar previamente registrado en la plataforma Bind
          Garantías.
        </p>

        <div className={styles.vincularInputWrapper}>
          <div className={styles.vincularInputGroup}>
            <input
              type="email"
              className={`${styles.vincularInput} ${emailError ? styles.vincularInputError : ""}`}
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
            <Button
              type="button"
              variant="primary"
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
      </div>
    </div>
  );
}
