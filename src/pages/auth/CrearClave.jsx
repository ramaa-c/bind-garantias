import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { FiShield, FiCheckCircle, FiXCircle } from "react-icons/fi";
import { InputPasswordSeguro, Button } from "../../components/ui";
import { useEstablecerClave } from "../../hooks/useUsuario";
import { useChannel } from "../../context/ChannelContext";
import styles from "./Login.module.css";
import logoBind from "../../assets/images/bind-g-logo.svg";

const passwordSchema = z
  .object({
    password: z
      .string()
      .min(12, { message: "Mínimo 12 caracteres" })
      .regex(/[a-z]/, { message: "Incluir una minúscula" })
      .regex(/[A-Z]/, { message: "Incluir una mayúscula" })
      .regex(/[0-9]/, { message: "Incluir un número" })
      .regex(/[!_.*@#$%^&()\-+]/, { message: "Incluir un caracter especial" }),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Las contraseñas no coinciden",
    path: ["confirmPassword"],
  });

const CrearClave = () => {
  const { canal, token } = useParams();
  const { channelInfo } = useChannel();
  const navigate = useNavigate();
  const { mutate, isPending } = useEstablecerClave();

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    setError,
  } = useForm({
    resolver: zodResolver(passwordSchema),
    mode: "onChange",
  });

  const onSubmit = (data) => {
    mutate(
      {
        token,
        canal,
        password: data.password,
      },
      {
        onSuccess: () => {
          toast.success("Contraseña establecida correctamente", {
            description: "Tu cuenta ha sido activada. Ya podés iniciar sesión.",
            duration: 5000,
          });
          navigate("/login");
        },
        onError: (err) => {
          const errMsg =
            err.response?.data?.message || "Token inválido o expirado.";
          toast.error("Error de activación", { description: errMsg });
          setError("root.serverError", { type: "manual", message: errMsg });
        },
      },
    );
  };

  return (
    <div className={styles.loginContainer}>
      <section className={styles.loginFormSection}>
        <div className={styles.loginHeader}>
          <div className={styles.logosWrapper} style={{ justifyContent: 'center', marginBottom: '2rem' }}>
            <img src={logoBind} alt="Logo BIND" className={styles.logo} style={{ margin: 0, height: '2.5rem', width: 'auto' }} />
            {channelInfo.id !== 'default' && (
              <>
                <div className={styles.logoSeparator} />
                <img src={channelInfo.logo} alt={`Logo ${channelInfo.nombre}`} className={styles.channelLogo} style={{ height: '2.5rem' }} />
              </>
            )}
          </div>
          <h1 className={styles.loginTitle}>Crear nueva contraseña</h1>
          <p className={styles.loginSubtitle}>
            Establecé las credenciales para acceder a tu cuenta.
          </p>
        </div>

        <div className={styles.formWrapper}>
          <form onSubmit={handleSubmit(onSubmit)} noValidate>
            <div className={styles.inputGroup}>
              <InputPasswordSeguro
                label="Nueva Contraseña"
                error={errors.password?.message}
                disabled={isPending}
                {...register("password")}
              />
            </div>

            <div className={styles.inputGroup}>
              <InputPasswordSeguro
                label="Confirmar Contraseña"
                error={errors.confirmPassword?.message}
                disabled={isPending}
                {...register("confirmPassword")}
              />
            </div>

            {errors.root?.serverError && (
              <div className={styles.serverErrorAlert}>
                <FiXCircle /> {errors.root.serverError.message}
              </div>
            )}

            <div className={styles.formActions}>
              <Button
                type="submit"
                variant="primary"
                disabled={!isValid || isPending}
              >
                {isPending ? "PROCESANDO..." : "ACTIVAR CUENTA"}
              </Button>
            </div>
          </form>
        </div>
      </section>

      <section className={`${styles.sideBrand} ${styles.sideBrandCentered}`}>
        <div className={styles.shieldIconWrapper}>
          <FiShield size={80} color="var(--yellow)" strokeWidth={1.5} />
        </div>
        <div className={styles.brandContentCentered}>
          <h2 className={styles.brandTitleLarge}>Seguridad garantizada.</h2>
          <ul className={styles.securityList}>
            <li>
              <FiCheckCircle /> Mínimo 12 caracteres
            </li>
            <li>
              <FiCheckCircle /> Complejidad alfanumérica
            </li>
            <li>
              <FiCheckCircle /> Caracteres especiales
            </li>
          </ul>
        </div>
      </section>
    </div>
  );
};

export default CrearClave;
