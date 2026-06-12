import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useForm, useController } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { InputSimple } from "../../../components/ui/InputSimple/InputSimple";
import { Button } from "../../../components/ui/Button/Button";
import { InputOTP } from "../../../components/ui/InputOtp/InputOtp";
import { useLogin, useLoginByCode } from "../../../hooks/useUsuario";
import { useAuthStore } from "../../../store/useAuthStore";
import { useChannel } from "../../../context/ChannelContext";
import styles from "./Login.module.css";
import logoBind from "../../../assets/images/bind-g-logo.svg";

const emailSchema = z.object({
  email: z
    .string()
    .min(1, "El email o usuario es obligatorio")
    .toLowerCase()
    .trim(),
});

const otpSchema = z.object({
  email: z
    .string()
    .min(1, "El email o usuario es obligatorio")
    .toLowerCase()
    .trim(),
  otp: z
    .string()
    .length(6, "El código debe tener exactamente 6 dígitos")
    .regex(/^\d+$/, "Solo se permiten números"),
});

const passwordSchema = z.object({
  email: z
    .string()
    .min(1, "El email o usuario es obligatorio")
    .toLowerCase()
    .trim(),
  password: z.string().min(1, "La contraseña es obligatoria"),
});

export const OtpPhase = ({
  control,
  onResend,
  isPending,
  onFallback,
}) => {
  const RESEND_SECONDS = 60;
  const [timeLeft, setTimeLeft] = useState(RESEND_SECONDS);
  const canResend = timeLeft === 0;

  const {
    field: { value, onChange },
    fieldState: { error },
  } = useController({ name: "otp", control });

  const displayError = error?.type === "server" ? error : null;

  useEffect(() => {
    if (timeLeft <= 0) return;
    const id = setInterval(() => setTimeLeft((t) => t - 1), 1000);
    return () => clearInterval(id);
  }, [timeLeft]);

  const handleResend = () => {
    setTimeLeft(RESEND_SECONDS);
    onResend();
  };

  const mm = String(Math.floor(timeLeft / 60)).padStart(2, "0");
  const ss = String(timeLeft % 60).padStart(2, "0");

  return (
    <div className={styles.phaseContainer}>
      {/* Componente OTP */}
      <InputOTP
        value={value}
        onChange={onChange}
        error={displayError}
        esValido={!error && value?.length === 6}
        disabled={isPending}
      />

      {/* Fila de reenvío */}
      <div className={styles.resendRow}>
        <span className={styles.resendLabel}>¿No llegó el código?</span>
        {canResend ? (
          <button
            type="button"
            className={styles.resendBtn}
            onClick={handleResend}
            disabled={isPending}
          >
            Reenviar código
          </button>
        ) : (
          <span className={styles.resendTimer}>
            {mm}:{ss}
          </span>
        )}
      </div>

      {/* Acción principal */}
      <Button
        type="submit"
        variant="primary"
        disabled={value?.length !== 6}
        isLoading={isPending}
      >
        {isPending ? "VERIFICANDO..." : "INGRESAR"}
      </Button>

      <div className={styles.divider}>
        <span>o</span>
      </div>

      <Button
        type="button"
        variant="ghost"
        onClick={onFallback}
        disabled={isPending}
        className={styles.ghostBtn}
      >
        Ingresar con contraseña
      </Button>
    </div>
  );
};

const EmailForCodePhase = ({ control, isPending, onFallback }) => (
  <div className={styles.phaseContainer}>
    <InputSimple
      name="email"
      control={control}
      label="Email"
      type="text"
      disabled={isPending}
    />
    <Button type="submit" variant="primary" isLoading={isPending}>
      {isPending ? "ENVIANDO CÓDIGO..." : "ENVIAR CÓDIGO"}
    </Button>
    <div className={styles.divider}>
      <span>o</span>
    </div>
    <Button
      type="button"
      variant="ghost"
      onClick={onFallback}
      disabled={isPending}
      className={styles.ghostBtn}
    >
      Ingresar con contraseña
    </Button>
  </div>
);

const CredentialsPhase = ({
  control,
  isPending,
  onRegister,
  onRecoverPassword,
  onLoginWithCode,
}) => (
  <div className={styles.phaseContainer}>
    <InputSimple
      name="email"
      control={control}
      label="Email"
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
    <Button type="submit" variant="primary" isLoading={isPending}>
      {isPending ? "INGRESANDO..." : "INGRESAR"}
    </Button>
    <div
      className={styles.recoverPasswordWrapper}
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "0.5rem",
        fontSize: "0.875rem",
        color: "var(--gray-text, #a0a0a0)",
      }}
    >
      <span>
        ¿Olvidaste tu contraseña?{" "}
        <span
          className={styles.inlineLink}
          onClick={!isPending ? onRecoverPassword : undefined}
          style={{
            cursor: isPending ? "not-allowed" : "pointer",
            opacity: isPending ? 0.6 : undefined,
          }}
        >
          Recuperar clave
        </span>
      </span>
    </div>

    <div className={styles.divider}>
      <span>o</span>
    </div>

    <Button
      type="button"
      variant="outline"
      onClick={onLoginWithCode}
      disabled={isPending}
      style={{ width: "100%" }}
    >
      Ingresar con código
    </Button>

    <div
      style={{
        marginTop: "1.5rem",
        textAlign: "center",
        fontSize: "0.875rem",
        color: "var(--gray-text, #a0a0a0)",
      }}
    >
      ¿No tenés una cuenta?{" "}
      <span
        className={styles.inlineLink}
        onClick={!isPending ? onRegister : undefined}
        style={{
          cursor: isPending ? "not-allowed" : "pointer",
          opacity: isPending ? 0.6 : undefined,
        }}
      >
        Registrate
      </span>
    </div>
  </div>
);

const Login = () => {
  const [fase, setFase] = useState("ingreso_credenciales");
  const [generatedOtp, setGeneratedOtp] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();
  const setUser = useAuthStore((state) => state.setUser);
  const { channelInfo } = useChannel();
  const { mutate: iniciarSesion, isPending: isLoginPending } = useLogin();
  const { mutate: loginByCode, isPending: solicitandoCodigo } =
    useLoginByCode();

  const isPending = isLoginPending || solicitandoCodigo;

  const currentSchema =
    fase === "ingreso_credenciales"
      ? passwordSchema
      : fase === "solicitar_codigo"
        ? emailSchema
        : otpSchema;

  const {
    control,
    handleSubmit,
    setError,
    clearErrors,
    getValues,
    trigger,
    setValue,
  } = useForm({
    resolver: zodResolver(currentSchema),
    defaultValues: { email: "", otp: "", password: "" },
    mode: "onChange",
  });

  useEffect(() => {
    const pendingEmail = sessionStorage.getItem("pendingOtpEmail");
    const expiresAt = sessionStorage.getItem("otpExpiresAt");

    if (pendingEmail && expiresAt) {
      if (Date.now() < parseInt(expiresAt, 10)) {
        setValue("email", pendingEmail);
        setFase("validacion_otp");
      } else {
        sessionStorage.removeItem("pendingOtpEmail");
        sessionStorage.removeItem("otpExpiresAt");
      }
    }

    // B) Redirección desde CrearClave
    if (location.state?.emailIngresado) {
      setValue("email", location.state.emailIngresado);
      if (location.state?.generatedOtp) {
        setGeneratedOtp(location.state.generatedOtp);
      }
      setFase("validacion_otp");
      window.history.replaceState({}, document.title);
    }
  }, [location, setValue]);

  const onSubmit = async (formData) => {
    if (fase === "solicitar_codigo") {
      const isValid = await trigger("email");
      if (!isValid) return;

      loginByCode(
        { email: formData.email, password: "" },
        {
          onSuccess: (data) => {
            setGeneratedOtp(data.password);
            sessionStorage.setItem("pendingOtpEmail", formData.email);
            sessionStorage.setItem("otpExpiresAt", Date.now() + 60000);
            setFase("validacion_otp");
            toast.success("Código enviado a tu email");
          },
          onError: (error) => {
            const status = error?.response?.status;
            const errorData = error?.response?.data;
            if (!error?.response || status >= 500) {
              toast.error("Error de servidor", {
                description: "Ocurrió un error. Intentá más tarde.",
              });
            } else {
              const message =
                errorData?.message ||
                "Error al solicitar código. Verificá los datos.";
              setError("email", { type: "server", message });
            }
          },
        },
      );
      return;
    }

    if (fase === "validacion_otp") {
      if (formData.otp === generatedOtp) {
        setUser({ email: formData.email, role: "user" });
        navigate(`/${channelInfo.id}/solicitudes`, { replace: true });
      } else {
        setError("otp", { type: "server", message: "Código incorrecto" });
      }
      return;
    }

    if (fase === "ingreso_credenciales") {
      if (formData.email === "admin" && formData.password === "admin") {
        setUser({
          email: "admin",
          role: "admin",
          nombre: "Administrador General",
        });
        navigate(`/${channelInfo.id}/admin/dashboard`, { replace: true });
        return;
      }

      iniciarSesion(
        { email: formData.email, password: formData.password },
        {
          onSuccess: () => {
            setUser({ email: formData.email, role: "user" });
            navigate(`/${channelInfo.id}/solicitudes`, { replace: true });
          },
          onError: (error) => {
            const status = error?.response?.status;
            if (!error?.response || status >= 500) {
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
        },
      );
    }
  };

  const handleResendCode = () => {
    loginByCode(
      { email: getValues("email"), password: "" },
      {
        onSuccess: (data) => {
          setGeneratedOtp(data.password);
          sessionStorage.setItem("pendingOtpEmail", getValues("email"));
          sessionStorage.setItem("otpExpiresAt", Date.now() + 60000);
          toast.success("Código reenviado");
        },
        onError: (error) => {
          const status = error?.response?.status;
          const errorData = error?.response?.data;
          if (!error?.response || status >= 500) {
            toast.error("Error de servidor", {
              description: "Ocurrió un error. Intentá más tarde.",
            });
          } else {
            const message =
              errorData?.message ||
              "Error al reenviar código. Verificá los datos.";
            setError("otp", { type: "server", message });
          }
        },
      },
    );
  };

  return (
    <div className={styles.layoutSplit}>
      <section className={styles.sideForm}>
        <div className={styles.globalLogo}>
          <div className={styles.logosWrapper}>
            <img
              src={logoBind}
              alt="Logo BIND"
              onClick={() => navigate(`/${channelInfo.id}/login`)}
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
            <p>
              {fase === "ingreso_credenciales" &&
                "Ingresá tus datos para comenzar."}
              {fase === "solicitar_codigo" &&
                "Ingresá tu email para recibir un código de acceso."}
              {fase === "validacion_otp" && (
                <>
                  Ingresá el código de 6 dígitos que enviamos a{" "}
                  <strong style={{ color: "var(--white, #fffefe)" }}>
                    {getValues("email") || sessionStorage.getItem("pendingOtpEmail")}
                  </strong>
                  .{" "}
                  <span
                    onClick={() => {
                      sessionStorage.removeItem("pendingOtpEmail");
                      sessionStorage.removeItem("otpExpiresAt");
                      clearErrors();
                      setFase("solicitar_codigo");
                    }}
                    className={styles.inlineLink}
                    style={{ fontSize: "0.85rem", marginLeft: "0.25rem" }}
                  >
                    ¿Cambiar correo?
                  </span>
                </>
              )}
            </p>
          </div>

          <form
            className={styles.formContent}
            onSubmit={handleSubmit(onSubmit)}
            noValidate
          >
            {fase === "ingreso_credenciales" && (
              <CredentialsPhase
                control={control}
                isPending={isPending}
                onRegister={() => navigate(`/${channelInfo.id}/registro`)}
                onRecoverPassword={() => navigate(`/${channelInfo.id}/recuperar-clave`)}
                onLoginWithCode={() => {
                  clearErrors();
                  setFase("solicitar_codigo");
                }}
              />
            )}
            {fase === "solicitar_codigo" && (
              <EmailForCodePhase
                control={control}
                isPending={isPending}
                onFallback={() => {
                  clearErrors();
                  setFase("ingreso_credenciales");
                }}
              />
            )}
            {fase === "validacion_otp" && (
              <OtpPhase
                control={control}
                isPending={isPending}
                onResend={handleResendCode}
                onFallback={() => {
                  sessionStorage.removeItem("pendingOtpEmail");
                  sessionStorage.removeItem("otpExpiresAt");
                  clearErrors();
                  setFase("ingreso_credenciales");
                }}
              />
            )}
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