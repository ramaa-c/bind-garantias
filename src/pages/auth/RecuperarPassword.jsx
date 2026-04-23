import React from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useMutation } from "@tanstack/react-query";
import { InputFlotante, Button, Alert } from "../../components/ui";
import styles from "./Login.module.css";
import logoBind from "../../assets/images/bind-g-logo.svg";

const recuperarSchema = z.object({
  email: z
    .string()
    .min(1, { message: "El email es obligatorio" })
    .email({ message: "Formato de email inválido" }),
});

const RecuperarPassword = () => {
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(recuperarSchema),
    defaultValues: { email: "" }
  });

  const enviarCorreoMutation = useMutation({
    mutationFn: async (data) => {
      const response = await fetch("/api/auth/recuperar-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error("No encontramos una cuenta asociada a este correo.");
        }
        if (response.status >= 500) {
          throw new Error("Ocurrió un error en el servidor. Intentá nuevamente más tarde.");
        }
        throw new Error("Ocurrió un error inesperado al intentar recuperar la contraseña.");
      }
      
      return response.json();
    },
  });

  const onSubmit = (data) => {
    enviarCorreoMutation.mutate(data);
  };

  return (
    <div className={styles.layoutSplit}>
      {/* --- COLUMNA IZQUIERDA --- */}
      <section className={styles.sideForm}>
        <div className={styles.globalLogo}>
          <img 
            src={logoBind} 
            alt="Logo BIND" 
            onClick={() => navigate("/")} 
            style={{ cursor: "pointer" }} 
          />
        </div>

        <div className={styles.cardModern}>
          <div className={styles.headerText}>
            <h2>¿Olvidaste tu contraseña?</h2>
            <p>
              Completá tu dirección de correo y te enviaremos un email con las instrucciones para crear una nueva.
            </p>
          </div>

          <form
            className={styles.formContent}
            onSubmit={handleSubmit(onSubmit)}
          >
            {enviarCorreoMutation.isError && (
              <Alert variant="error" className={styles.formFieldSpacing}>
                {enviarCorreoMutation.error.message}
              </Alert>
            )}

            {enviarCorreoMutation.isSuccess && (
              <Alert variant="success" className={styles.formFieldSpacing}>
                ¡Listo! Te enviamos un email con las instrucciones para crear una nueva contraseña.
              </Alert>
            )}

            <InputFlotante
              label="Email"
              type="email"
              id="email"
              error={errors.email?.message}
              {...register("email")}
            />

            <div className={styles.formActions}>
              <Button 
                type="submit" 
                variant="primary"
                disabled={enviarCorreoMutation.isPending}
              >
                {enviarCorreoMutation.isPending ? "Enviando..." : "Recuperar contraseña"}
              </Button>

            </div>
          </form>

          <div className={styles.supportContainerModern}>
            <p>
              En caso de tener problemas o dudas con tu cuenta podés ponerte en contacto 
              con nosotros en{" "}
              <a href="mailto:soporte@bind.com.ar" className={styles.linkYellow}>
                soporte@bind.com.ar
              </a>
            </p>
          </div>
        </div>
      </section>

      {/* --- COLUMNA DERECHA --- */}
      <section className={styles.sideBrand}>
        <div className={styles.blobBlue}></div>
        <div className={styles.blobYellow}></div>
        <div className={styles.brandContent}>
          <h2 className={styles.brandTitle}>
            Potenciando y transformando el financiamiento PyME.
          </h2>
          <p className={styles.brandSubtitle}>
            Accedé a la mejor financiación para tu empresa.
          </p>
        </div>
      </section>
    </div>
  );
};

export default RecuperarPassword;
