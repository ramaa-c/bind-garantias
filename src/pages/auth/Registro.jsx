import React from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";

import { InputFlotante, Button } from "../../components/ui";
import { useCrearUsuario } from "../../hooks/useUsuario";
import styles from "./Login.module.css";
import logoBind from "../../assets/images/bind-g-logo.svg";

// --- SCHEMA ---
const registroSchema = z.object({
  email: z
    .string()
    .min(1, { message: "El email es obligatorio" })
    .email({ message: "Formato de email inválido" })
    .toLowerCase()
    .trim(),
});

const Registro = () => {
  const navigate = useNavigate();
  const { mutateAsync: crearUsuario, isPending } = useCrearUsuario();

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(registroSchema),
  });

  const onSubmit = async (data) => {
    const getCSharpIsoDate = (addYears = 0) => {
      const date = new Date();
      if (addYears) date.setFullYear(date.getFullYear() + addYears);
      return date.toISOString().split(".")[0];
    };

    const payloadSkeletor = {
      email: data.email,
      usuariowebid: 0,
      fchalta: getCSharpIsoDate(),
      fchvencimiento: getCSharpIsoDate(1),
      hashseguridad: "",
      estado: "",
      debecambiarclave: "",
      esadministrador: "",
      denominacion: "",
    };

    try {
      await crearUsuario(payloadSkeletor);

      toast.success(
        "¡Registro exitoso! Revisá tu casilla de correo para continuar.",
      );

      navigate("/login", { replace: true });
    } catch (error) {
      if (error?.response?.status === 409) {
        setError("email", {
          type: "server",
          message: "Este correo ya se encuentra registrado.",
        });
      } else {
        setError("email", {
          type: "server",
          message:
            error?.response?.data?.message ||
            "Error de conexión. Intentá nuevamente.",
        });
      }
    }
  };

  return (
    <div className={styles.layoutSplit}>
      <section className={styles.sideForm}>
        <div className={styles.globalLogo}>
          <img
            src={logoBind}
            alt="Logo BIND"
            width="120"
            className={styles.clickableLogo}
            onClick={() => navigate("/")}
          />
        </div>

        <div className={styles.cardModern}>
          <div className={styles.headerText}>
            <h2>Creá tu cuenta</h2>
            <p>Ingresá tu correo electrónico para comenzar.</p>
          </div>

          <form
            className={styles.formContent}
            onSubmit={handleSubmit(onSubmit)}
            noValidate
          >
            <InputFlotante
              type="email"
              id="email"
              label="Email *"
              error={errors.email?.message}
              disabled={isPending}
              {...register("email")}
            />

            <div className={styles.formActions}>
              <Button type="submit" variant="primary" disabled={isPending}>
                {isPending ? "REGISTRANDO..." : "REGISTRARSE"}
              </Button>

              <Button
                type="button"
                variant="outline"
                onClick={() => navigate("/login")}
                disabled={isPending}
              >
                YA TENGO CUENTA
              </Button>
            </div>
          </form>

          <div className={styles.supportContainerModern}>
            <p>¿Tenés problemas o dudas para registrarte?</p>
            <p>
              Ponete en contacto con nosotros a{" "}
              <a
                href="mailto:comerciales@bindgarantias.com.ar"
                className={styles.linkYellow}
              >
                comerciales@bindgarantias.com.ar
              </a>
            </p>
          </div>
        </div>
      </section>

      <section className={styles.sideBrand}>
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

export default Registro;
