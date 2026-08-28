import React, { useState, useEffect } from "react";
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
  FiAlertTriangle,
  FiLock,
} from "react-icons/fi";
import { FaUserLock } from "react-icons/fa";
import {
  Button,
  Spinner,
  InputPasswordSeguro,
  InputSimple,
} from "../../../components/ui";
import {
  useObtenerUsuarioPorEncrypt,
  useEstablecerClave,
  useResetearPassword,
  useLoginByCode,
  useReactivarUsuario,
} from "../../../hooks/useUsuario";
import { useChannel } from "../../../context/ChannelContext";
import { useThemeStore } from "../../../store/useThemeStore";
import styles from "./CrearClave.module.css";
import logoBind from "../../../assets/images/bind-g-logo.svg";
import logoBindBlack from "../../../assets/images/bind-g-logo-black.svg";

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
  const { token } = useParams();
  const { channelInfo } = useChannel();
  const theme = useThemeStore((state) => state.theme);
  const navigate = useNavigate();
  const [emailManual, setEmailManual] = useState("");
  const [emailManualTouched, setEmailManualTouched] = useState(false);
  const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const tokenIntegridad =
    typeof window !== "undefined" && window.location.hash
      ? `${token || ""}${window.location.hash}`
      : token || "";

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

  const { mutate: loginByCode, isPending: solicitandoCodigo } =
    useLoginByCode();
  const { mutate: reactivarUsuario, isPending: reactivando } =
    useReactivarUsuario();

  const handleOmitir = () => {
    if (!usuario?.email || !usuario?.usuariowebid) return;

    reactivarUsuario(usuario.usuariowebid, {
      onSuccess: () => {
        loginByCode(
          { email: usuario.email, password: "" },
          {
            onSuccess: (data) => {
              toast.success("Código enviado", {
                description: "Revisá tu correo para ingresar.",
              });
              navigate(`/${channelInfo.id}/login`, {
                state: {
                  emailIngresado: usuario.email,
                  generatedOtp: data.password,
                },
              });
            },
            onError: (error) => {
              const isServerError = error?.response?.status >= 500;
              toast.error(
                isServerError
                  ? "Error de servidor"
                  : "Error al solicitar código",
                {
                  description: isServerError
                    ? "El servidor no responde. Por favor, intentá nuevamente más tarde."
                    : "Ocurrió un error. Intentá más tarde.",
                },
              );
            },
          },
        );
      },
      onError: (error) => {
        const isServerError = error?.response?.status >= 500;
        toast.error(
          isServerError ? "Error de servidor" : "Error al activar cuenta",
          {
            description: isServerError
              ? "El servidor no responde. Por favor, intentá nuevamente más tarde."
              : "No pudimos activar tu cuenta en este momento. Intentá más tarde.",
          },
        );
      },
    });
  };

  const handleSolicitarNuevoEnlace = () => {
    if (!emailManual) {
      toast.error("Ingresá tu correo para continuar");
      return;
    }

    const getCSharpIsoDate = (addYears = 0) => {
      const date = new Date();
      if (addYears) date.setFullYear(date.getFullYear() + addYears);
      return date.toISOString().split(".")[0];
    };

    const canalId = channelInfo.id;

    const payloadReset = {
      email: emailManual,
      usuariowebid: 0,
      fchalta: getCSharpIsoDate(),
      fchvencimiento: getCSharpIsoDate(1),
      hashseguridad: canalId,
      estado: "",
      debecambiarclave: "",
      esadministrador: "",
      denominacion: canalId,
    };

    resetearPassword(payloadReset, {
      onSuccess: () => {
        navigate(`/${channelInfo.id}/confirmar-correo`, {
          state: {
            emailIngresado: emailManual,
            canal: canalId,
            origen: "recuperar",
          },
        });
      },
      onError: (error) => {
        const isServerError = error?.response?.status >= 500;
        toast.error(
          isServerError ? "Error de servidor" : "Error al solicitar enlace",
          {
            description: isServerError
              ? "El servidor no responde. Por favor, intentá nuevamente más tarde."
              : "No pudimos enviar el correo. Intentá registrarte nuevamente.",
          },
        );
        if (!isServerError) {
          navigate(`/${channelInfo.id}/registro`);
        }
      },
    });
  };

  const {
    control,
    handleSubmit,
    watch,
    trigger,
    formState: { isValid, errors },
    setError,
  } = useForm({
    resolver: zodResolver(passwordSchema),
    mode: "onChange",
  });

  const passwordValue = watch("password") || "";
  const confirmPasswordValue = watch("confirmPassword") || "";

  // React Hook Form, con resolver, solo actualiza el estado de error del
  // campo que efectivamente cambió — aunque zod ya revalidó el objeto
  // completo y sabe que ahora coinciden (o no), RHF no propaga esa
  // corrección a "confirmPassword" solo porque el que cambió fue
  // "password". Sin este trigger manual, si "confirmPassword" ya tenía el
  // error "no coinciden" (path del .refine() del schema) y el usuario
  // corrige "password" — no "confirmPassword" — para que vuelvan a
  // coincidir, el mensaje queda pegado para siempre; incluso vaciando los
  // dos campos de nuevo. Se dispara solo si "confirmPassword" ya tiene
  // valor o ya tiene un error viejo (no ambos en false): si no, tipear la
  // primera letra de "password" ya marcaría "no coinciden" contra un
  // "confirmPassword" que el usuario todavía ni tocó.
  useEffect(() => {
    if (confirmPasswordValue || errors.confirmPassword) {
      trigger("confirmPassword");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [passwordValue, trigger]);

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
        navigate(`/${channelInfo.id}/login`, { replace: true });
      },
      onError: (error) => {
        const isServerError = error?.response?.status >= 500;
        const errMsg = isServerError
          ? "El servidor está experimentando problemas. Por favor, intentá nuevamente más tarde."
          : "Error al establecer la credencial. Intentá más tarde.";
        toast.error(
          isServerError ? "Error de servidor" : "Error de activación",
          {
            description: errMsg,
          },
        );
        setError("root.serverError", { type: "manual", message: errMsg });
      },
    });
  };

  const mostrarErrorFaltaUsuario =
    !usuario && tokenExpirado && !verificandoToken;

  // String(estado) !== "1", no !== 1: el backend puede devolver "estado" como
  // string ("1") en vez de number (ver la misma comparación, ya defensiva,
  // en usuarioService.js/esCuentaPendienteActivacion). Con el !== 1 estricto
  // anterior, una cuenta activa con estado:"1" caía siempre en la rama de
  // "pendiente de activación" acá — nunca en la de "restablecer contraseña".
  const cuentaPendienteActivacion =
    !tokenInvalidoDeOrigen && !!usuario && String(usuario.estado) !== "1";

  useEffect(() => {
    if (!cuentaPendienteActivacion) return;

    const avisarAntesDeCerrar = (e) => {
      e.preventDefault();
      e.returnValue = "";
    };

    window.addEventListener("beforeunload", avisarAntesDeCerrar);
    return () =>
      window.removeEventListener("beforeunload", avisarAntesDeCerrar);
  }, [cuentaPendienteActivacion]);

  return (
    <>
      {verificandoToken && !tokenInvalidoDeOrigen ? (
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            minHeight: "100vh",
            backgroundColor: "var(--bg-primario)",
          }}
        >
          <Spinner />
        </div>
      ) : (
        <div className={styles.loginContainer}>
          {/* ── COLUMNA IZQUIERDA: FORMULARIO ── */}
          <section
            className={`${styles.loginFormSection} ${
              mostrarErrorFaltaUsuario && !tokenInvalidoDeOrigen
                ? styles.loginFormSectionCentered
                : ""
            }`}
          >
            <div className={styles.globalLogo}>
              <div className={styles.logosWrapper}>
                <img
                  src={theme === "light" ? logoBindBlack : logoBind}
                  alt="Logo BIND"
                  onClick={() => navigate(channelInfo?.id && channelInfo.id !== "default" ? `/${channelInfo.id}/login` : "/login")}
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

            <div
              style={{
                width: "100%",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "1.25rem",
                marginTop: "3.5rem",
              }}
            >
              {!tokenInvalidoDeOrigen && usuario && (
                <div
                  className={styles.successCallout}
                  style={{ marginBottom: 0 }}
                >
                  <FiCheckCircle className={styles.calloutIcon} />
                  <div className={styles.calloutContent}>
                    {/* usuario.estado === 1 ya significa "cuenta activa"
                        (ver esCuentaPendienteActivacion en usuarioService.js
                        y cuentaPendienteActivacion acá abajo, que dependen
                        de esta misma comparación) — este link es el único
                        lugar del sistema que activa cuentas nuevas, así que
                        si la cuenta YA está activa es porque estamos acá por
                        "Recuperar clave", no por una activación. Antes el
                        texto de las dos ramas estaba invertido: le decía
                        "¡Email verificado con éxito! ... opcional" a una
                        cuenta sin activar, mientras más abajo el cartel de
                        "Activación pendiente" advertía lo contrario en el
                        mismo render. */}
                    {!cuentaPendienteActivacion ? (
                      <>
                        <h2 className={styles.calloutTitle}>
                          Restablecé tu contraseña
                        </h2>
                        <p>
                          Ingresá tu nueva contraseña a continuación. Recordá
                          que siempre podés seguir ingresando con un código a
                          tu correo si lo preferís.
                        </p>
                      </>
                    ) : (
                      <>
                        <h2 className={styles.calloutTitle}>
                          ¡Email verificado con éxito!
                        </h2>
                        <p>
                          Para activar tu cuenta, creá tu contraseña o elegí
                          ingresar con un código a tu correo. Si creás una
                          contraseña, después también vas a poder seguir
                          usando el código de acceso cuando prefieras.
                        </p>
                      </>
                    )}
                  </div>
                </div>
              )}

              <div className={styles.formWrapper}>
                {tokenInvalidoDeOrigen && (
                  <div className={styles.expiredTokenContainer}>
                    <FiAlertCircle size={48} color="var(--error-red)" />
                    <h3>Enlace corrupto o ausente</h3>
                    <p>El enlace de seguridad está incompleto o mal formado.</p>

                    <div
                      style={{
                        marginTop: "1.5rem",
                        width: "100%",
                        textAlign: "left",
                      }}
                    >
                      <InputSimple
                        name="emailManual"
                        label="Ingresá tu correo electrónico"
                        value={emailManual}
                        onChange={setEmailManual}
                        type="email"
                        disabled={solicitandoNuevo}
                        esValido={
                          emailManual.length > 0 && isValidEmail(emailManual)
                        }
                        error={
                          emailManual.length > 0 && !isValidEmail(emailManual)
                            ? { message: "Formato de correo inválido" }
                            : null
                        }
                      />
                    </div>

                    <Button
                      variant="primary"
                      onClick={handleSolicitarNuevoEnlace}
                      style={{ marginTop: "1.5rem", width: "100%" }}
                      isLoading={solicitandoNuevo}
                      disabled={!isValidEmail(emailManual)}
                    >
                      {solicitandoNuevo
                        ? "SOLICITANDO..."
                        : "SOLICITAR NUEVO ENLACE"}
                    </Button>
                  </div>
                )}

                {mostrarErrorFaltaUsuario && !tokenInvalidoDeOrigen && (
                  <div className={styles.expiredTokenContainer}>
                    <FiAlertCircle size={48} color="var(--error-red)" />
                    <h3>El enlace ha expirado o es inválido</h3>
                    <p>
                      Por seguridad, los enlaces tienen un tiempo de validez
                      limitado. Solicitá uno nuevo para continuar.
                    </p>

                    <div
                      style={{
                        marginTop: "1.5rem",
                        width: "100%",
                        textAlign: "left",
                      }}
                    >
                      <InputSimple
                        name="emailManual"
                        label="Ingresá tu correo electrónico"
                        value={emailManual}
                        onChange={setEmailManual}
                        onBlur={() => setEmailManualTouched(true)}
                        type="email"
                        disabled={solicitandoNuevo}
                        esValido={
                          emailManual.length > 0 && isValidEmail(emailManual)
                        }
                        error={
                          emailManualTouched &&
                          emailManual.length > 0 &&
                          !isValidEmail(emailManual)
                            ? { message: "Formato de correo inválido" }
                            : null
                        }
                      />
                    </div>

                    <Button
                      variant="primary"
                      onClick={handleSolicitarNuevoEnlace}
                      style={{ marginTop: "1.5rem", width: "100%" }}
                      isLoading={solicitandoNuevo}
                      disabled={!isValidEmail(emailManual)}
                    >
                      {solicitandoNuevo
                        ? "SOLICITANDO..."
                        : "SOLICITAR NUEVO ENLACE"}
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
                          passwordValue === confirmPasswordValue &&
                          !errors.confirmPassword
                        }
                        error={errors.confirmPassword}
                        disabled={guardandoClave}
                      />

                      {/* !errors.confirmPassword es necesario acá, no solo
                          decorativo: al editar el PRIMER campo (password) en
                          vez de este, `watch()` ya refleja el match en este
                          mismo render, pero errors.confirmPassword (lo
                          resuelve el .refine() del schema vía zodResolver,
                          async) todavía no se actualizó - sin este guard,
                          el mensaje de éxito aparecía superpuesto arriba del
                          error rojo todavía vigente en vez de esperar a que
                          se termine de limpiar. */}
                      {confirmPasswordValue.length > 0 &&
                        passwordValue === confirmPasswordValue &&
                        !errors.confirmPassword && (
                          <span className={styles.successMsgMatch}>
                            Las contraseñas coinciden
                          </span>
                        )}
                    </div>

                    <div
                      className={styles.formActions}
                      style={{
                        marginTop: "1rem",
                        flexDirection: "column",
                        gap: "1rem",
                      }}
                    >
                      <Button
                        type="submit"
                        variant="primary"
                        disabled={
                          !isValid ||
                          guardandoClave ||
                          solicitandoCodigo ||
                          reactivando
                        }
                        style={{ width: "100%" }}
                      >
                        {guardandoClave ? "PROCESANDO..." : "GUARDAR"}
                      </Button>
                      {cuentaPendienteActivacion && (
                        <>
                          <div className={styles.divider}>
                            <span>o</span>
                          </div>
                          <Button
                            type="button"
                            variant="outline"
                            onClick={handleOmitir}
                            disabled={
                              solicitandoCodigo ||
                              guardandoClave ||
                              reactivando
                            }
                            style={{ width: "100%" }}
                          >
                            {solicitandoCodigo || reactivando
                              ? "PROCESANDO..."
                              : "Omitir e ingresar con código"}
                          </Button>
                        </>
                      )}
                    </div>
                  </form>
                )}
              </div>

            </div>
          </section>

          <section
            className={`${styles.sideBrand} ${styles.sideBrandCentered}`}
          >
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

              {/* Reemplaza al viejo warningCallout que vivía pegado abajo
                  del todo en la columna izquierda (con el formulario largo,
                  no entraba en una pantalla de full HD sin scroll). Acá
                  siempre está a la vista, sin pelear espacio con el
                  formulario, y cambia de tono según por qué se llegó a esta
                  pantalla en vez de ser un mensaje genérico fijo. */}
              {!tokenInvalidoDeOrigen && usuario && (
                <div
                  className={styles.brandStatusCard}
                  data-tone={cuentaPendienteActivacion ? "warning" : "neutral"}
                >
                  <div className={styles.brandStatusIconWrap}>
                    {cuentaPendienteActivacion ? <FiAlertTriangle /> : <FiLock />}
                  </div>
                  <div>
                    <h3 className={styles.brandStatusTitle}>
                      {cuentaPendienteActivacion
                        ? "Activación pendiente"
                        : "Actualizando tu acceso"}
                    </h3>
                    <p className={styles.brandStatusText}>
                      {cuentaPendienteActivacion
                        ? 'Si salís sin crear una contraseña o usar "Omitir e ingresar con código", vas a necesitar un nuevo enlace.'
                        : "Tu cuenta sigue activa mientras hacés este cambio. Podés seguir usando tus accesos actuales hasta confirmar la nueva contraseña."}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </section>
        </div>
      )}
    </>
  );
};

export default CrearClave;
