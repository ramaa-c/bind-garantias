import React from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { useResetearPassword } from "../../../hooks/useUsuario";
import { InputSimple, Button, Alert } from "../../../components/ui";
import styles from "./Login.module.css";
import logoBind from "../../../assets/images/bind-g-logo.svg";

const recuperarSchema = z.object({
  email: z
    .string()
    .min(1, { message: "El email es obligatorio" })
    .email({ message: "Formato de email inválido" }),
});

const RecuperarClave = () => {
  const navigate = useNavigate();

  const {
    control,
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(recuperarSchema),
    defaultValues: { email: "" },
  });

  const {
    mutateAsync: enviarCorreoAsync,
    isPending,
    isError,
  } = useResetearPassword();

  const getCSharpIsoDate = (addYears = 0) => {
    const date = new Date();
    if (addYears) date.setFullYear(date.getFullYear() + addYears);
    return date.toISOString().split(".")[0];
  };

  const onSubmit = async (data) => {
    const payloadReset = {
      email: data.email,
      usuariowebid: 0,
      fchalta: getCSharpIsoDate(),
      fchvencimiento: getCSharpIsoDate(1),
      hashseguridad: "canal1",
      estado: "",
      debecambiarclave: "",
      esadministrador: "",
      denominacion: "",
    };

    try {
      await enviarCorreoAsync(payloadReset);
      navigate("/confirmar-correo", {
        replace: true,
        state: { emailIngresado: data.email, canal: "canal1", origen: "recuperar" },
      });
    } catch (error) {
      toast.error("Error al solicitar el enlace", {
        description: "Verificá tu correo o intentá más tarde.",
      });
    }
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
              Completá tu dirección de correo y te enviaremos un email con las
              instrucciones para crear una nueva.
            </p>
          </div>

          <form
            className={styles.formContent}
            onSubmit={handleSubmit(onSubmit)}
          >
            <InputSimple
              name="email"
              control={control}
              label="Email"
              type="text"
              disabled={isPending}
              error={isError ? "Usuario no encontrado." : undefined}
            />

            <div className={styles.formActions}>
              <Button type="submit" variant="primary" isLoading={isPending}>
                {isPending ? "Enviando..." : "Recuperar contraseña"}
              </Button>
            </div>
          </form>

          <div className={styles.supportContainerModern}>
            <p>
              En caso de tener problemas o dudas con tu cuenta podés ponerte en
              contacto con nosotros en {" "}
              <a
                href="mailto:soporte@bind.com.ar"
                className={styles.linkYellow}
              >
                soporte@bind.com.ar
              </a>
            </p>
          </div>
        </div>
      </section>

      {/* --- COLUMNA DERECHA --- */}
      <section className={styles.sideBrand}>
        <div className={styles.brandContent}>
          <h2 className={styles.brandTitle}>
            Potenciando y transformando el <em>financiamiento PyME.</em>
          </h2>
          <p className={styles.brandSubtitle}>
            Accedé a la mejor financiación para tu empresa.
          </p>
        </div>
      </section>
    </div>
  );
};

export default RecuperarClave;
