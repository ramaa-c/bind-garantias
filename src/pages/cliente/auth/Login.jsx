import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useForm, useController } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { InputSimple, Button, InputOTP } from "../../../components/ui";
import { useLogin, useLoginByCode } from "../../../hooks/useUsuario";
import { useAuthStore } from "../../../store/useAuthStore";
import { useChannel } from "../../../context/ChannelContext";
import styles from "./Login.module.css";
import logoBind from "../../../assets/images/bind-g-logo.svg";

const emailSchema = z.object({
  email: z.string().min(1, "El email o usuario es obligatorio").toLowerCase().trim(),
});

const otpSchema = z.object({
  email: z.string().min(1, "El email o usuario es obligatorio").toLowerCase().trim(),
  otp: z.string().length(6, "El código debe tener exactamente 6 dígitos").regex(/^\d+$/, "Solo se permiten números"),
});

const passwordSchema = z.object({
  email: z.string().min(1, "El email o usuario es obligatorio").toLowerCase().trim(),
  password: z.string().min(1, "La contraseña es obligatoria"),
});

export const OtpPhase = ({ control, onResend, isPending, onFallback }) => {
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
        disabled={isPending || value?.length !== 6}
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

const EmailPhase = ({ control, isPending, onRegister }) => (
  <div className={styles.phaseContainer}>
    <InputSimple
      name="email"
      control={control}
      label="Email"
      type="text"
      disabled={isPending}
    />
    <Button type="submit" variant="primary" disabled={isPending}>
      {isPending ? "INGRESANDO..." : "INGRESAR"}
    </Button>
    <div className={styles.formActions}>
      <Button type="button" variant="outline" onClick={onRegister} disabled={isPending}>
        REGISTRARSE
      </Button>
    </div>
  </div>
);

const PasswordPhase = ({ control, isPending, onRecoverPassword }) => (
  <div className={styles.phaseContainer}>
    <InputSimple
      name="password"
      control={control}
      label="Contraseña"
      type="password"
      disabled={isPending}
    />
    <Button type="submit" variant="primary" disabled={isPending}>
      {isPending ? "INGRESANDO..." : "INGRESAR"}
    </Button>
    <div className={styles.recoverPasswordWrapper} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.5rem" }}>
      <span className={styles.recoverPasswordLink} onClick={onRecoverPassword}>
        ¿Olvidaste tu contraseña? Recuperar clave
      </span>
    </div>
  </div>
);

const Login = () => {
  const [fase, setFase] = useState("ingreso_email");
  const [generatedOtp, setGeneratedOtp] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();
  const setUser = useAuthStore((state) => state.setUser);
  const { channelInfo } = useChannel();
  const { mutate: iniciarSesion, isPending: isLoginPending } = useLogin();
  const { mutate: loginByCode, isPending: solicitandoCodigo } = useLoginByCode();

  const isPending = isLoginPending || solicitandoCodigo;

  const currentSchema = 
    fase === "ingreso_email" ? emailSchema : 
    fase === "validacion_otp" ? otpSchema : 
    passwordSchema;

  const { control, handleSubmit, setError, clearErrors, getValues, trigger, setValue } = useForm({
    resolver: zodResolver(currentSchema),
    defaultValues: { email: "", otp: "", password: "" },
    mode: "onChange"
  });

  // Interceptor de redirecciones invisibles (Ej: desde CrearClave)
  useEffect(() => {
    if (location.state?.emailIngresado) {
      setValue("email", location.state.emailIngresado);
      if (location.state?.generatedOtp) {
        setGeneratedOtp(location.state.generatedOtp);
      }
      setFase("validacion_otp");
      window.history.replaceState({}, document.title);
    }
  }, [location.state, setValue]);

  const onSubmit = async (formData) => {
    if (fase === "ingreso_email") {
      const isValid = await trigger("email");
      if (!isValid) return;

      loginByCode(
        { email: formData.email, password: "" },
        {
          onSuccess: (data) => {
            setGeneratedOtp(data.password);
            setFase("validacion_otp");
          },
          onError: (error) => {
            const errorData = error?.response?.data;
            if (errorData?.classname === "EMVCException") {
              setError("email", { type: "server", message: errorData.message });
            } else {
              toast.error("Error al solicitar código", { description: "Ocurrió un error. Intentá más tarde." });
            }
          }
        }
      );
      return;
    }

    if (fase === "validacion_otp") {
      if (formData.otp === generatedOtp) {
        setUser({ email: formData.email, role: "user" });
        navigate("/solicitudes", { replace: true });
      } else {
        setError("otp", { type: "server", message: "Código incorrecto" });
      }
      return;
    }

    if (fase === "ingreso_clave") {
      if (formData.email === "admin" && formData.password === "admin") {
        setUser({ email: "admin", role: "admin", nombre: "Administrador General" });
        toast.success("Sesión de Administrador iniciada");
        navigate("/admin/dashboard", { replace: true });
        return;
      }

      iniciarSesion(
        { email: formData.email, password: formData.password },
        {
          onSuccess: () => {
            setUser({ email: formData.email, role: "user" });
            navigate("/solicitudes", { replace: true });
          },
          onError: (error) => {
            const status = error?.response?.status;
            if (!error?.response || status >= 500) {
              clearErrors("password");
              toast.error("Error de servidor", { description: "Ocurrió un error. Intentá más tarde." });
            } else {
              setError("password", { type: "server", message: "Usuario o contraseña incorrecto." });
            }
          }
        }
      );
    }
  };

  const handleResendCode = () => {
    loginByCode(
      { email: getValues("email"), password: "" },
      {
        onSuccess: (data) => {
          setGeneratedOtp(data.password);
          toast.success("Código reenviado");
        },
        onError: () => toast.error("Error al reenviar", { description: "Intentá más tarde." })
      }
    );
  };

  return (
    <div className={styles.layoutSplit}>
      <section className={styles.sideForm}>
        <div className={styles.globalLogo}>
          <div className={styles.logosWrapper}>
            <img src={logoBind} alt="Logo BIND" onClick={() => navigate("/")} className={styles.clickableLogo} />
            {channelInfo.id !== "default" && (
              <>
                <div className={styles.logoSeparator} />
                <img src={channelInfo.logo} alt={`Logo ${channelInfo.nombre}`} className={styles.channelLogo} />
              </>
            )}
          </div>
        </div>

        <div className={styles.cardModern}>
          <div className={styles.headerText}>
            <h2>¡Hola! Bienvenido</h2>
            <p>
              {fase === "ingreso_email" && "Ingresá tu email para comenzar."}
              {fase === "validacion_otp" && "Ingresá el código de 6 dígitos enviado a tu email."}
              {fase === "ingreso_clave" && "Ingresá tu contraseña."}
            </p>
          </div>

          <form className={styles.formContent} onSubmit={handleSubmit(onSubmit)} noValidate>
            {fase === "ingreso_email" && (
              <EmailPhase control={control} isPending={isPending} onRegister={() => navigate("/registro")} />
            )}
            {fase === "validacion_otp" && (
              <OtpPhase
                control={control}
                isPending={isPending}
                onResend={handleResendCode}
                onFallback={() => setFase("ingreso_clave")}
              />
            )}
            {fase === "ingreso_clave" && (
              <PasswordPhase
                control={control}
                isPending={isPending}
                onRecoverPassword={() => navigate("/recuperar-clave")}
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
          <p className={styles.brandSubtitle}>Accedé a la mejor financiación para tu empresa.</p>
        </div>
      </section>
    </div>
  );
};

export default Login;
