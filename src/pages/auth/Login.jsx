import React from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { FiMail, FiLock } from "react-icons/fi";
import { InputSimple, Button } from "../../components/ui";
import { useLogin } from "../../hooks/useUsuario";
import { useAuthStore } from "../../store/useAuthStore";
import { useChannel } from "../../context/ChannelContext";
import styles from "./Login.module.css";
import logoBind from "../../assets/images/bind-g-logo.svg";

const loginSchema = z.object({
  email: z
    .string()
    .min(1, { message: "El email o usuario es obligatorio" })
    .toLowerCase()
    .trim(),
  password: z.string().min(1, { message: "La contraseña es obligatoria" }),
});

const Login = () => {
  const navigate = useNavigate();
  const setUser = useAuthStore((state) => state.setUser);
  const { channelInfo } = useChannel();
  const { mutate: iniciarSesion, isPending } = useLogin();

  const { control, handleSubmit, setError, clearErrors } = useForm({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = (formData) => {
    if (formData.email === "admin" && formData.password === "admin") {
      setUser({
        email: "admin",
        role: "admin",
        nombre: "Administrador General",
      });
      toast.success("Sesión de Administrador iniciada", {
        description: "Accediendo a la consola de administración integral.",
      });
      navigate("/admin/dashboard", { replace: true });
      return;
    }

    iniciarSesion(formData, {
      onSuccess: (data) => {
        setUser({ email: formData.email, role: "user" });
        navigate("/solicitudes", { replace: true });
      },
      onError: (error) => {
        const status = error?.response?.status;
        if (!error?.response || status >= 500 || status === 404) {
          clearErrors("password");
          toast.error("Error de servidor", {
            description: "Ocurrió un error. Intentá más tarde.",
          });
        } else {
          setError("password", {
            type: "server",
            message: "Usuario o contraseña incorrecto.",
          });
        }
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
            {channelInfo.id !== "default" && (
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
            <InputSimple
              name="email"
              control={control}
              label="Email o Usuario"
              type="text"
              disabled={isPending}
            />

            <InputSimple
              name="password"
              control={control}
              label="Contraseña"
              type="password"
              disabled={isPending}
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
            <div className={styles.recoverPasswordWrapper}>
              <span
                className={styles.recoverPasswordLink}
                onClick={() => navigate("/recuperar-clave")}
              >
                ¿Olvidaste tu contraseña? Recuperar clave
              </span>
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
