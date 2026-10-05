import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useForm, useController } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { InputSimple } from "../../../components/ui/InputSimple/InputSimple";
import { Button } from "../../../components/ui/Button/Button";
import { InputOTP } from "../../../components/ui/InputOtp/InputOtp";
import { useLogin, useLoginByCode, useSolicitarCodigoLogin } from "../../../hooks/useUsuario";
import { usuarioService } from "../../../services/usuarioService";
import { cerrarSesionApi } from "../../../api/tokenApi";
import { useAuthStore } from "../../../store/useAuthStore";
import { useThemeStore } from "../../../store/useThemeStore";
import { useChannel } from "../../../context/useChannel";
import {
  extraerRegistroUsuario,
  esAdministradorActivo,
  esUsuarioBloqueado,
  MENSAJE_CUENTA_BLOQUEADA,
  DESBLOQUEO_CUENTA_CLIENTE,
  avisarCuentaBloqueada,
  VIGENCIA_CODIGO_LOGIN_MS,
  mensajeCodigoLoginRechazado,
} from "../../../utils/usuarioUtils";
import styles from "./Login.module.css";
import logoBind from "../../../assets/images/bind-g-logo.svg";
import logoBindBlack from "../../../assets/images/bind-g-logo-black.svg";

const ESTADO_CUENTA_BLOQUEADA = 406;

const MENSAJE_ADMIN_EN_CLIENTE =
  "Esta cuenta es de administración y no puede operar como cliente. Registrate con un correo distinto para acceder desde acá.";

const leerOtpPendiente = () => {
  const pendingEmail = sessionStorage.getItem("pendingOtpEmail");
  const expiresAt = sessionStorage.getItem("otpExpiresAt");

  if (pendingEmail && expiresAt) {
    if (Date.now() < parseInt(expiresAt, 10)) {
      return { fase: "validacion_otp", email: pendingEmail };
    }
    sessionStorage.removeItem("pendingOtpEmail");
    sessionStorage.removeItem("otpExpiresAt");
  }

  return { fase: "ingreso_credenciales", email: "" };
};

const parsearCadenas = (data) => {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  if (data.items) return data.items;
  if (data.data) return data.data;
  if (typeof data === "object" && Object.keys(data).length > 0) return [data];
  return [];
};

// Un usuario vinculado a una o más cadenas de valor (UsuarioCadenaValor) es
// un admin restringido (ve el panel admin acotado a sus propias cadenas —
// ver useAdminRestrictions) aunque nunca haya entrado por /login de admin:
// entra por el login normal de SU banco, como cualquier cliente, y de acá
// hay que mandarlo al admin en vez de a su legajo (que ni siquiera tiene,
// porque no es dueño de ningún Socio). AdminGuard no valida el "role" que
// se setea al loguear, así que no hace falta nada especial del lado del
// guard — solo decidir bien el destino acá.
const resolverAccesoPostLogin = async (email, basePath) => {
  try {
    const usuarioDb = await usuarioService.obtenerPorNombreOEmail(email);
    const registro = extraerRegistroUsuario(usuarioDb);

    if (esUsuarioBloqueado(registro)) {
      return { permitido: false, motivo: "bloqueada", destino: null };
    }

    // Un Administrador General no tiene Socio ni legajo propio: su cuenta es
    // exclusivamente del panel admin y no corresponde que entre por el login
    // de un banco, aunque el backend valide bien sus credenciales
    // (SGRPLUSPLA-195). OJO: esto NO alcanza a los admin restringidos, que
    // no llevan esta marca y sí entran por acá (ver más abajo).
    if (esAdministradorActivo(registro)) {
      return { permitido: false, motivo: "admin", destino: null };
    }

    const usuarioWebId =
      registro?.usuariowebid ?? registro?.UsuarioWebID ?? registro?.id ?? null;
    if (!usuarioWebId) return { permitido: true, destino: `${basePath}/legajo` };

    // ⚠️ El backend filtra por el param "usuarioid" (no "usuariowebid") —
    // ver el mismo aviso en useAdminRestrictions.js.
    const cadenasData = await usuarioService.obtenerUsuariosRelacionados({
      usuarioid: usuarioWebId,
    });
    const tieneCadenas = parsearCadenas(cadenasData).length > 0;
    return {
      permitido: true,
      destino: tieneCadenas ? "/admin" : `${basePath}/legajo`,
    };
  } catch {
    // Ante cualquier falla de esta verificación extra, seguir el camino
    // normal en vez de bloquear el login por completo.
    return { permitido: true, destino: `${basePath}/legajo` };
  }
};

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
      autoComplete="username"
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
      autoComplete="username"
      disabled={isPending}
    />
    <InputSimple
      name="password"
      control={control}
      label="Contraseña"
      type="password"
      autoComplete="current-password"
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
        color: "var(--text-muted)",
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
        color: "var(--text-muted)",
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
  const [otpPendienteInicial] = useState(leerOtpPendiente);
  const [fase, setFase] = useState(otpPendienteInicial.fase);
  const [locationSincronizada, setLocationSincronizada] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();
  const setUser = useAuthStore((state) => state.setUser);
  const theme = useThemeStore((state) => state.theme);
  const { channelInfo, basePath } = useChannel();
  const { mutate: iniciarSesion, isPending: isLoginPending } = useLogin();
  const { mutate: solicitarCodigo, isPending: solicitandoCodigo } =
    useSolicitarCodigoLogin();
  const { mutate: loginByCode, isPending: validandoCodigo } = useLoginByCode();

  const isPending = isLoginPending || solicitandoCodigo || validandoCodigo;

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
    defaultValues: { email: otpPendienteInicial.email, otp: "", password: "" },
    mode: "onChange",
  });

  // Redirección desde CrearClave
  if (location.state?.emailIngresado && location !== locationSincronizada) {
    setLocationSincronizada(location);
    setFase("validacion_otp");
  }

  useEffect(() => {
    if (location.state?.emailIngresado) {
      setValue("email", location.state.emailIngresado);
      window.history.replaceState({}, document.title);
    }
  }, [location, setValue]);

  const onSubmit = async (formData) => {
    if (fase === "solicitar_codigo") {
      const isValid = await trigger("email");
      if (!isValid) return;

      solicitarCodigo(formData.email, {
        onSuccess: () => {
          sessionStorage.setItem("pendingOtpEmail", formData.email);
          sessionStorage.setItem("otpExpiresAt", Date.now() + VIGENCIA_CODIGO_LOGIN_MS);
          setFase("validacion_otp");
          toast.success("Código enviado a tu email");
        },
        onError: (error) => {
          const status = error?.response?.status;
          if (!error?.response || status >= 500) {
            toast.error("Error de servidor", {
              description: "Ocurrió un error. Intentá más tarde.",
            });
            return;
          }
          if (status === ESTADO_CUENTA_BLOQUEADA) {
            setError("email", { type: "server", message: MENSAJE_CUENTA_BLOQUEADA });
            avisarCuentaBloqueada(DESBLOQUEO_CUENTA_CLIENTE);
            return;
          }
          setError("email", {
            type: "server",
            message: "Error al solicitar código. Verificá los datos.",
          });
        },
      });
      return;
    }

    if (fase === "validacion_otp") {
      loginByCode(
        { email: formData.email, password: formData.otp },
        {
          onSuccess: async () => {
            const acceso = await resolverAccesoPostLogin(formData.email, basePath);
            if (!acceso.permitido) {
              cerrarSesionApi();
              if (acceso.motivo === "bloqueada") {
                setError("email", { type: "server", message: MENSAJE_CUENTA_BLOQUEADA });
                avisarCuentaBloqueada(DESBLOQUEO_CUENTA_CLIENTE);
              } else {
                setError("email", { type: "server", message: MENSAJE_ADMIN_EN_CLIENTE });
              }
              return;
            }
            sessionStorage.removeItem("pendingOtpEmail");
            sessionStorage.removeItem("otpExpiresAt");
            setUser({ email: formData.email, role: "user" }, { esNuevoLogin: true });
            navigate(acceso.destino, { replace: true });
          },
          onError: (error) => {
            const status = error?.response?.status;
            if (!error?.response || status >= 500) {
              toast.error("Error de servidor", {
                description: "Ocurrió un error. Intentá más tarde.",
              });
              return;
            }
            if (status === ESTADO_CUENTA_BLOQUEADA) {
              setError("otp", { type: "server", message: MENSAJE_CUENTA_BLOQUEADA });
              avisarCuentaBloqueada(DESBLOQUEO_CUENTA_CLIENTE);
              return;
            }
            if (status === 401) {
              setError("otp", {
                type: "server",
                message: mensajeCodigoLoginRechazado(error),
              });
              return;
            }
            setError("otp", {
              type: "server",
              message: "No pudimos validar el código. Solicitá uno nuevo.",
            });
          },
        },
      );
      return;
    }

    if (fase === "ingreso_credenciales") {
      iniciarSesion(
        { email: formData.email, password: formData.password },
        {
          onSuccess: async () => {
            const acceso = await resolverAccesoPostLogin(formData.email, basePath);
            if (!acceso.permitido) {
              cerrarSesionApi();
              if (acceso.motivo === "bloqueada") {
                setError("password", { type: "server", message: MENSAJE_CUENTA_BLOQUEADA });
                avisarCuentaBloqueada(DESBLOQUEO_CUENTA_CLIENTE);
              } else {
                setError("password", { type: "server", message: MENSAJE_ADMIN_EN_CLIENTE });
              }
              return;
            }
            setUser({ email: formData.email, role: "user" }, { esNuevoLogin: true });
            navigate(acceso.destino, { replace: true });
          },
          onError: (error) => {
            const status = error?.response?.status;
            if (!error?.response || status >= 500) {
              clearErrors("password");
              toast.error("Error de servidor", {
                description: "Ocurrió un error. Intentá más tarde.",
              });
              return;
            }
            if (status === ESTADO_CUENTA_BLOQUEADA) {
              setError("password", { type: "server", message: MENSAJE_CUENTA_BLOQUEADA });
              avisarCuentaBloqueada(DESBLOQUEO_CUENTA_CLIENTE);
              return;
            }
            setError("password", {
              type: "server",
              message: "Usuario o contraseña incorrecto.",
            });
          },
        },
      );
    }
  };

  const handleResendCode = () => {
    solicitarCodigo(getValues("email"), {
      onSuccess: () => {
        sessionStorage.setItem("pendingOtpEmail", getValues("email"));
        sessionStorage.setItem("otpExpiresAt", Date.now() + VIGENCIA_CODIGO_LOGIN_MS);
        toast.success("Código reenviado");
      },
      onError: (error) => {
        const status = error?.response?.status;
        if (!error?.response || status >= 500) {
          toast.error("Error de servidor", {
            description: "Ocurrió un error. Intentá más tarde.",
          });
        } else if (status === ESTADO_CUENTA_BLOQUEADA) {
          setError("otp", { type: "server", message: MENSAJE_CUENTA_BLOQUEADA });
          avisarCuentaBloqueada(DESBLOQUEO_CUENTA_CLIENTE);
        } else {
          setError("otp", {
            type: "server",
            message: "Error al reenviar código. Verificá los datos.",
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
              src={theme === "light" ? logoBindBlack : logoBind}
              alt="Logo BIND"
              onClick={() => navigate(channelInfo?.id && channelInfo.id !== "default" ? `${basePath}/login` : "/login")}
              className={styles.clickableLogo}
            />
            {channelInfo.id !== "default" && channelInfo.logo && (
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
                onRegister={() => navigate(`${basePath}/registro`)}
                onRecoverPassword={() => navigate(`${basePath}/recuperar-clave`)}
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
