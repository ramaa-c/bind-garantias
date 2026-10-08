import React, { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { FiAlertCircle, FiMail, FiUserCheck } from "react-icons/fi";
import { toast } from "sonner";
import { Button } from "../../../../../ui/Button/Button";
import { sociosService } from "../../../../../../services/sociosService";
import styles from "../../DocumentosLegajo.module.css";

export function VincularUsuarioSection({ socioIdActivo }) {
  const queryClient = useQueryClient();
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
      await sociosService.vincularUsuarioPorEmail({
        socioId: socioIdActivo,
        email: emailNormalizado,
      });

      toast.success("Usuario vinculado exitosamente a la empresa.");
      setEmailVincular("");
      queryClient.invalidateQueries({
        queryKey: ["socioUsuario", "listaPorSocio"],
      });
    } catch (err) {
      const status = err.response?.status;
      if (status === 409) {
        setEmailError("Este usuario ya se encuentra vinculado a la empresa.");
      } else if (status === 404) {
        setEmailError(
          "No pudimos vincular este correo. Verificá que esté bien escrito y que el usuario ya esté registrado en la plataforma.",
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
              Ingresá el correo electrónico del usuario que deseás vincular.
              Este usuario debe estar previamente registrado en la
              plataforma Bind Garantías.
            </p>
          </div>
        </div>

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
      </div>
    </div>
  );
}
