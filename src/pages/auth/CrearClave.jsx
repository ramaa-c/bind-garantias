import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import {
  FiCheckCircle,
  FiCircle,
  FiXCircle,
  FiAlertCircle,
  FiLock,
} from "react-icons/fi";
import { FaUserLock } from "react-icons/fa";
import { Button, Spinner, InputPasswordSeguro, InputSimple } from "../../components/ui";
import {
  useObtenerUsuarioPorEncrypt,
  useEstablecerClave,
  useResetearPassword,
} from "../../hooks/useUsuario";
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

  const tokenIntegridad =
    typeof window !== "undefined" && window.location.hash
      ? `${token || ""}${window.location.hash}`
      : token || "";

  const canalIntegridad = canal || "default";

  const tokenInvalidoDeOrigen = !tokenIntegridad || tokenIntegridad.length < 10;

  const {
    data: usuario,
    isLoading: verificandoToken,
    isError: tokenExpirado,
  } = useObtenerUsuarioPorEncrypt(tokenIntegridad);

  const { mutate: establecerClave, isPending: guardandoClave } =
    useEstablecerClave();

  const { mutate: resetearPassword, isPending: solicitandoNuevo } =
    useResetearPassword();

  const handleSolicitarNuevoEnlace = () => {
    const savedEmail =
      localStorage.getItem("emailIngresado") ||
      sessionStorage.getItem("emailIngresado");

    if (!savedEmail) {
      navigate("/registro");
      return;
    }

    const getCSharpIsoDate = (addYears = 0) => {
      const date = new Date();
      if (addYears) date.setFullYear(date.getFullYear() + addYears);
      return date.toISOString().split(".")[0];
    };

    const payloadReset = {
      email: savedEmail,
      usuariowebid: 0,
      fchalta: getCSharpIsoDate(),
      fchvencimiento: getCSharpIsoDate(1),
      hashseguridad: canalIntegridad || "canal1",
      estado: "",
      debecambiarclave: "",
      esadministrador: "",
      denominacion: "",
    };

    resetearPassword(payloadReset, {
      onSuccess: () => {
        navigate("/confirmar-correo", {
          state: { emailIngresado: savedEmail, canal: canalIntegridad },
        });
      },
      onError: () => {
        toast.error("Error al solicitar enlace", {
          description:
            "No pudimos enviar el correo. Intentá registrarte nuevamente.",
        });
        navigate("/registro");
      },
    });
  };

  const {
    control,
    handleSubmit,
    watch,
    formState: { isValid, errors },
    setError,
  } = useForm({
    resolver: zodResolver(passwordSchema),
    mode: "onChange",
  });

  const passwordValue = watch("password") || "";
  const confirmPasswordValue = watch("confirmPassword") || "";

  const onSubmit = (formData) => {
    const payload = {
      usuarioid: usuario?.usuariowebid,
      data: {
        oldpassword: "",
        newpassword: formData.password,
      },
    };

    establecerClave(payload, {
      onSuccess: () => {
        toast.success("Contraseña establecida correctamente", {
          description: "Tu cuenta ha sido activada. Ya podés iniciar sesión.",
          duration: 5000,
        });
        navigate("/", { replace: true });
      },
      onError: () => {
        const errMsg = "Error al establecer la credencial. Intentá más tarde.";
        toast.error("Error de activación", { description: errMsg });
        setError("root.serverError", { type: "manual", message: errMsg });
      },
    });
  };

  const mostrarErrorFaltaUsuario =
    !usuario && tokenExpirado && !verificandoToken;

  return (
    <>
      {verificandoToken && !tokenInvalidoDeOrigen ? (
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            minHeight: "100vh",
            backgroundColor: "var(--color-background, #121212)",
          }}
        >
          <Spinner />
        </div>
      ) : (
        <div className={styles.loginContainer}>
          {/* ── COLUMNA IZQUIERDA: FORMULARIO ── */}
          <section className={styles.loginFormSection}>
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

            <div className={styles.loginHeader}>
              <h1 className={styles.loginTitle}>Crear nueva contraseña</h1>
              <p className={styles.loginSubtitle}>
                Establecé las credenciales para acceder a tu cuenta.
              </p>
            </div>

            <div className={styles.formWrapper}>
              {tokenInvalidoDeOrigen && (
                <div className={styles.expiredTokenContainer}>
                  <FiAlertCircle size={48} color="var(--red)" />
                  <h3>Enlace corrupto o ausente</h3>
                  <p>El enlace de seguridad está incompleto o mal formado.</p>
                  <Button
                    variant="primary"
                    onClick={handleSolicitarNuevoEnlace}
                    style={{ marginTop: "1.5rem" }}
                    disabled={solicitandoNuevo}
                  >
                    {solicitandoNuevo ? "SOLICITANDO..." : "SOLICITAR NUEVO ENLACE"}
                  </Button>
                </div>
              )}

              {mostrarErrorFaltaUsuario && !tokenInvalidoDeOrigen && (
                <div className={styles.expiredTokenContainer}>
                  <FiAlertCircle size={48} color="var(--red)" />
                  <h3>El enlace ha expirado o es inválido</h3>
                  <p>
                    No pudimos recuperar tu información. Solicitá un nuevo enlace
                    para continuar.
                  </p>
                  <Button
                    variant="primary"
                    onClick={handleSolicitarNuevoEnlace}
                    style={{ marginTop: "1.5rem" }}
                    disabled={solicitandoNuevo}
                  >
                    {solicitandoNuevo ? "SOLICITANDO..." : "SOLICITAR NUEVO ENLACE"}
                  </Button>
                </div>
              )}

              {/* Formulario principal */}
              {!tokenInvalidoDeOrigen && usuario && (
                <form onSubmit={handleSubmit(onSubmit)} noValidate>
                  <div className={styles.inputGroup}>
                    <Controller
                      name="password"
                      control={control}
                      render={({ field }) => (
                        <InputPasswordSeguro
                          {...field}
                          label="Nueva Contraseña"
                          currentValue={passwordValue}
                          email={usuario?.email || ""}
                          esValido={!errors.password && !!passwordValue}
                          disabled={guardandoClave}
                        />
                      )}
                    />
                  </div>

                  <div
                    className={styles.inputGroup}
                    style={{ marginTop: "1.5rem", position: "relative" }}
                  >
                    <InputSimple
                      name="confirmPassword"
                      control={control}
                      label="Confirmar Contraseña"
                      type="password"
                      esValido={
                        !!confirmPasswordValue &&
                        passwordValue === confirmPasswordValue
                      }
                      error={errors.confirmPassword}
                      disabled={guardandoClave}
                    />

                    {confirmPasswordValue.length > 0 &&
                      passwordValue === confirmPasswordValue && (
                        <span className={styles.successMsgMatch}>
                          Las contraseñas coinciden
                        </span>
                      )}
                  </div>

                  <div className={styles.formActions} style={{ marginTop: "1rem" }}>
                    <Button
                      type="submit"
                      variant="primary"
                      disabled={!isValid || guardandoClave}
                    >
                      {guardandoClave ? "PROCESANDO..." : "GUARDAR"}
                    </Button>
                  </div>
                </form>
              )}
            </div>
          </section>

          <section className={`${styles.sideBrand} ${styles.sideBrandCentered}`}>
            <div className={styles.crearClaveBrandContent}>
              <div className={styles.heroIconWrapper}>
                <FaUserLock
                  className={styles.heroIcon}
                  size={80}
                  strokeWidth={1.5}
                />
              </div>
              <h2 className={styles.brandTitleLarge}>
                Tu acceso,
                <br />
                <em className={styles.brandEm}>seguro.</em>
              </h2>
            </div>
          </section>
        </div>
      )}
    </>
  );
};

export default CrearClave;
