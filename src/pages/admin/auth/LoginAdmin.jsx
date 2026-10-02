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
import { useAuthStore } from "../../../store/useAuthStore";
import { usuarioService } from "../../../services/usuarioService";
import { borrarTokenApi } from "../../../api/tokenApi";
import {
  MENSAJE_CUENTA_BLOQUEADA,
  DESBLOQUEO_CUENTA_ADMIN,
  avisarCuentaBloqueada,
  VIGENCIA_CODIGO_LOGIN_MS,
  mensajeCodigoLoginRechazado,
} from "../../../utils/usuarioUtils";
import styles from "../../cliente/auth/Login.module.css";
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
      <InputOTP
        value={value}
        onChange={onChange}
        error={displayError}
        esValido={!error && value?.length === 6}
        disabled={isPending}
      />

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
  </div>
);

const checkAccesoAdmin = async (email) => {
  const cleanEmail = String(email || "").toLowerCase().trim();

  try {
    const userDb = await usuarioService.obtenerPorNombreOEmail(cleanEmail);
    if (!userDb) return false;

    let registro = null;
    if (Array.isArray(userDb)) {
      registro = userDb[0] || null;
    } else if (userDb.items) {
      registro = userDb.items[0] || null;
    } else if (userDb.data) {
      registro = userDb.data[0] || null;
    } else {
      registro = userDb;
    }

    const usuarioWebId = registro?.usuariowebid || registro?.UsuarioWebID || registro?.id;
    if (!usuarioWebId) return false;

    const esAdministradorFlag = registro?.esadministrador ?? registro?.EsAdministrador;
    const esAdministrador =
      esAdministradorFlag === "1" || esAdministradorFlag === 1 || esAdministradorFlag === true;

    if (esAdministrador) return true;

    const chainsData = await usuarioService.obtenerUsuariosRelacionados({ usuarioid: usuarioWebId });
    if (!chainsData) return false;

    let listaCadenas = [];
    if (Array.isArray(chainsData)) {
      listaCadenas = chainsData;
    } else if (chainsData.items) {
      listaCadenas = chainsData.items;
    } else if (chainsData.data) {
      listaCadenas = chainsData.data;
    } else if (typeof chainsData === "object" && Object.keys(chainsData).length > 0) {
      listaCadenas = [chainsData];
    }

    return listaCadenas.length > 0;
  } catch (err) {
    console.error("Error al verificar acceso admin:", err);
    return false;
  }
};

const LoginAdmin = () => {
  const [otpPendienteInicial] = useState(leerOtpPendiente);
  const [fase, setFase] = useState(otpPendienteInicial.fase);
  const [isCheckingAdmin, setIsCheckingAdmin] = useState(false);
  const [locationSincronizada, setLocationSincronizada] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();
  const user = useAuthStore((state) => state.user);
  const setUser = useAuthStore((state) => state.setUser);

  const { mutate: iniciarSesion, isPending: isLoginPending } = useLogin();
  const { mutate: solicitarCodigo, isPending: solicitandoCodigo } =
    useSolicitarCodigoLogin();
  const { mutate: loginByCode, isPending: validandoCodigo } = useLoginByCode();

  const isPending =
    isLoginPending || solicitandoCodigo || validandoCodigo || isCheckingAdmin;

  // AdminGuard revalida contra el backend apenas se entra a /admin (esadministrador
  // / cadenas asociadas), así que este redirect es solo un atajo de UX: si el rol
  // persistido no fuera realmente admin, el guard lo rebota a "/" igual.
  useEffect(() => {
    if (user?.role === "admin") {
      navigate("/admin", { replace: true });
    }
  }, [user, navigate]);

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
        onError: async (error) => {
          const status = error?.response?.status;
          if (!error?.response || status >= 500) {
            toast.error("Error de servidor", {
              description: "Ocurrió un error. Intentá más tarde.",
            });
            return;
          }
          if (status === 406) avisarCuentaBloqueada(DESBLOQUEO_CUENTA_ADMIN);
          const message =
            status === 406
              ? MENSAJE_CUENTA_BLOQUEADA
              : "Error al solicitar código. Verificá los datos.";
          setError("email", { type: "server", message });
        },
      });
      return;
    }

    if (fase === "validacion_otp") {
      loginByCode(
        { email: formData.email, password: formData.otp },
        {
          onSuccess: async () => {
            setIsCheckingAdmin(true);
            const hasAccess = await checkAccesoAdmin(formData.email);
            setIsCheckingAdmin(false);

            if (!hasAccess) {
              borrarTokenApi();
              setError("otp", {
                type: "server",
                message: "No tenés permisos de administrador.",
              });
              return;
            }

            sessionStorage.removeItem("pendingOtpEmail");
            sessionStorage.removeItem("otpExpiresAt");
            setUser({ email: formData.email, role: "admin" }, { esNuevoLogin: true });
            navigate("/admin", { replace: true });
          },
          onError: async (error) => {
            const status = error?.response?.status;
            if (!error?.response || status >= 500) {
              toast.error("Error de servidor", {
                description: "Ocurrió un error. Intentá más tarde.",
              });
              return;
            }
            if (status === 401) {
              setError("otp", {
                type: "server",
                message: mensajeCodigoLoginRechazado(error),
              });
              return;
            }
            if (status === 406) avisarCuentaBloqueada(DESBLOQUEO_CUENTA_ADMIN);
            setError("otp", {
              type: "server",
              message:
                status === 406
                  ? MENSAJE_CUENTA_BLOQUEADA
                  : "No pudimos validar el código. Solicitá uno nuevo.",
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
            setIsCheckingAdmin(true);
            const hasAccess = await checkAccesoAdmin(formData.email);
            setIsCheckingAdmin(false);

            if (!hasAccess) {
              borrarTokenApi();
              setError("password", {
                type: "server",
                message: "No tenés permisos de administrador.",
              });
              return;
            }

            // Se asume que el back devuelve los permisos necesarios.
            setUser({ email: formData.email, role: "admin" }, { esNuevoLogin: true });
            navigate("/admin", { replace: true });
          },
          onError: async (error) => {
            const status = error?.response?.status;
            if (!error?.response || status >= 500) {
              clearErrors("password");
              toast.error("Error de servidor", {
                description: "Ocurrió un error. Intentá más tarde.",
              });
              return;
            }
            if (status === 406) {
              setError("password", {
                type: "server",
                message: MENSAJE_CUENTA_BLOQUEADA,
              });
              avisarCuentaBloqueada(DESBLOQUEO_CUENTA_ADMIN);
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
              src={logoBind}
              alt="Logo BIND"
              onClick={() => navigate("/login")}
              className={styles.clickableLogo}
            />
          </div>
        </div>

        <div className={styles.cardModern}>
          <div className={styles.headerText}>
            <h2>Acceso Administrador</h2>
            <p>
              {fase === "ingreso_credenciales" &&
                "Ingresá tus datos para acceder al panel."}
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
            Panel de <em>Administración.</em>
          </h2>
          <p className={styles.brandSubtitle}>
            Gestión de usuarios, líneas y cadenas de valor.
          </p>
        </div>
      </section>
    </div>
  );
};

export default LoginAdmin;
