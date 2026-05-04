import React from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { InputFlotante, Button } from "../../components/ui";
import { useLogin } from "../../hooks/useUsuario";
import { useAuthStore } from "../../store/useAuthStore";

import { useChannel } from "../../context/ChannelContext";
import styles from "./Login.module.css";
import logoBind from "../../assets/images/bind-g-logo.svg";

// --- SCHEMA ---
const loginSchema = z.object({
  email: z
    .string()
    .min(1, { message: "El email es obligatorio" })
    .email({ message: "Formato de email inválido" })
    .toLowerCase()
    .trim(),
  password: z.string().min(1, { message: "La contraseña es obligatoria" }),
});

const Login = () => {
  const navigate = useNavigate();
  const setUser = useAuthStore((state) => state.setUser);
  const { channelInfo } = useChannel();
  const { mutate: iniciarSesion, isPending } = useLogin();

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = (formData) => {
    iniciarSesion(formData, {
      onSuccess: (usuarioData) => {
        setUser(usuarioData);

        if (
          usuarioData.debecambiarclave === "1" ||
          String(usuarioData.debecambiarclave).toLowerCase() === "true"
        ) {
          navigate("/crear-clave", { replace: true });
          return;
        }

        navigate("/inicio", { replace: true });
      },
      onError: (error) => {
        setError("password", {
          type: "server",
          message:
            error?.response?.data?.message ||
            "Credenciales inválidas o error de conexión.",
        });
      },
    });
  };

  return (
    <div className={styles.layoutSplit}>
      <section className={styles.sideForm}>
        <div className={styles.globalLogo}>
          <div className={styles.logosWrapper}>
            <img
              src={logoBind}
              alt="Logo BIND"
              onClick={() => navigate("/")}
              className={styles.clickableLogo}
            />
            {channelInfo.id !== 'default' && (
              <>
                <div className={styles.logoSeparator} />
                <img
                  src={channelInfo.logo}
                  alt={`Logo ${channelInfo.nombre}`}
                  className={styles.channelLogo}
                />
              </>
            )}
          </div>
        </div>

        <div className={styles.cardModern}>
          <div className={styles.headerText}>
            <h2>¡Hola! Bienvenido</h2>
            <p>Ingresá tus datos para acceder a tu cuenta.</p>
          </div>

          <form
            className={styles.formContent}
            onSubmit={handleSubmit(onSubmit)}
            noValidate
          >
            <InputFlotante
              label="Email"
              type="email"
              id="email"
              error={errors.email?.message}
              disabled={isPending}
              {...register("email")}
            />

            <InputFlotante
              label="Contraseña"
              type="password"
              id="password"
              error={errors.password?.message}
              disabled={isPending}
              {...register("password")}
            />

            <div className={styles.formActions}>
              <Button type="submit" variant="primary" disabled={isPending}>
                {isPending ? "VERIFICANDO..." : "INGRESAR"}
              </Button>

              <Button
                type="button"
                variant="outline"
                onClick={() => navigate("/registro")}
                disabled={isPending}
              >
                REGISTRARSE
              </Button>
            </div>
          </form>
        </div>
      </section>

      <section className={styles.sideBrand}>
        <div className={styles.blobBlue}></div>
        <div className={styles.blobYellow}></div>
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

export default Login;
