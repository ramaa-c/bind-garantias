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
  useObtenerEstadoPorEncrypt,
  useEstablecerClave,
  useResetearPassword,
  useReactivarUsuario,
} from "../../../hooks/useUsuario";
import { useChannel } from "../../../context/useChannel";
import { useThemeStore } from "../../../store/useThemeStore";
import {
  denominacionDesdeEmail,
  FECHA_VENCIMIENTO_USUARIO,
  esDemasiadosIntentos,
  avisarDemasiadosIntentos,
  esRespuestaBloqueoAdmin,
  avisarBloqueoAdmin,
} from "../../../utils/usuarioUtils";
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
  const { channelInfo, basePath } = useChannel();
  const theme = useThemeStore((state) => state.theme);
  const navigate = useNavigate();
  const [emailManual, setEmailManual] = useState("");
  const [emailManualTouched, setEmailManualTouched] = useState(false);
  const [enlaceInvalidado, setEnlaceInvalidado] = useState(false);
  const [bloqueoAdminDetectado, setBloqueoAdminDetectado] = useState(false);
  const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const tokenIntegridad =
    typeof window !== "undefined" && window.location.hash
      ? `${token || ""}${window.location.hash}`
      : token || "";

  const tokenInvalidoDeOrigen = !tokenIntegridad || tokenIntegridad.length < 10;

  const {
    data: estadoCuenta,
    isLoading: verificandoEstado,
    isError: estadoError,
  } = useObtenerEstadoPorEncrypt(tokenIntegridad);

  const { mutate: establecerClave, isPending: guardandoClave } =
    useEstablecerClave();

  const { mutate: resetearPassword, isPending: solicitandoNuevo } =
    useResetearPassword();

  const { mutate: reactivarUsuario, isPending: reactivando } =
    useReactivarUsuario();

  const marcarEnlaceVencido = () => {
    setEnlaceInvalidado(true);
    toast.error("El enlace expiró o no es válido", {
      description: "Solicitá uno nuevo para continuar.",
    });
  };

  const marcarBloqueoAdmin = () => {
    setBloqueoAdminDetectado(true);
    avisarBloqueoAdmin();
  };

  const irALoginConCodigo = () =>
    navigate(`${basePath}/login`, {
      state: { faseInicial: "solicitar_codigo" },
    });

  const handleIngresarConCodigo = () => {
    reactivarUsuario(tokenIntegridad, {
      onSuccess: () => {
        toast.success("Cuenta activada", {
          description: "Ingresá tu correo para recibir un código de acceso.",
        });
        irALoginConCodigo();
      },
      onError: (error) => {
        const status = error?.response?.status;
        if (esRespuestaBloqueoAdmin(error)) {
          marcarBloqueoAdmin();
          return;
        }
        if (status === 406) {
          marcarEnlaceVencido();
          return;
        }
        if (status === 409) {
          toast.info("Tu cuenta ya está activa", {
            description: "Ingresá tu correo para recibir un código de acceso.",
          });
          irALoginConCodigo();
          return;
        }
        const isServerError = !error?.response || status >= 500;
        toast.error(
          isServerError ? "Error de servidor" : "No pudimos activar tu cuenta",
          {
            description:
              status === 404
                ? "No encontramos una cuenta asociada a este enlace."
                : status === 423
                  ? "Tu cuenta está bloqueada. Creá una nueva contraseña para desbloquearla."
                  : "Ocurrió un error. Intentá más tarde.",
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

    const getCSharpIsoDate = () => {
      const date = new Date();
      return date.toISOString().split(".")[0];
    };

    const canalId = channelInfo.id;

    const payloadReset = {
      email: emailManual,
      usuariowebid: 0,
      fchalta: getCSharpIsoDate(),
      fchvencimiento: FECHA_VENCIMIENTO_USUARIO,
      hashseguridad: "",
      estado: "",
      debecambiarclave: "",
      esadministrador: "",
      denominacion: denominacionDesdeEmail(emailManual),
      fronturl: window.location.origin + basePath,
    };

    const irAConfirmacion = () =>
      navigate(`${basePath}/confirmar-correo`, {
        state: {
          emailIngresado: emailManual,
          canal: canalId,
          origen: "recuperar",
        },
      });

    resetearPassword(payloadReset, {
      onSuccess: irAConfirmacion,
      onError: (error) => {
        if (!error?.response || error.response.status >= 500) {
          toast.error("Error de servidor", {
            description:
              "El servidor no responde. Por favor, intentá nuevamente más tarde.",
          });
          return;
        }
        if (esDemasiadosIntentos(error)) {
          avisarDemasiadosIntentos();
          return;
        }
        irAConfirmacion();
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
    establecerClave(
      { encrypt: tokenIntegridad, newPassword: formData.password },
      {
        onSuccess: () => {
          toast.success("Contraseña establecida correctamente", {
            description: cuentaPendiente
              ? "Tu cuenta fue activada. Ya podés iniciar sesión."
              : cuentaBloqueada
                ? "Tu cuenta fue desbloqueada. Ya podés iniciar sesión."
                : "Ya podés iniciar sesión con tu nueva contraseña.",
            duration: 5000,
          });
          navigate(`${basePath}/login`, { replace: true });
        },
        onError: (error) => {
          const status = error?.response?.status;
          if (esRespuestaBloqueoAdmin(error)) {
            marcarBloqueoAdmin();
            return;
          }
          if (status === 406) {
            marcarEnlaceVencido();
            return;
          }
          const isServerError = !error?.response || status >= 500;
          const mensajeBackend = error?.response?.data?.message;
          const errMsg =
            status === 404
              ? "No encontramos una cuenta asociada a este enlace."
              : status === 400 && mensajeBackend
                ? mensajeBackend
                : isServerError
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
      },
    );
  };

  const cuentaBloqueadaPorAdmin =
    !tokenInvalidoDeOrigen &&
    (estadoCuenta === "bloqueada_admin" || bloqueoAdminDetectado);

  const enlaceVencido =
    !tokenInvalidoDeOrigen &&
    !verificandoEstado &&
    !cuentaBloqueadaPorAdmin &&
    (estadoCuenta === "expirado" ||
      estadoCuenta === "inexistente" ||
      estadoError ||
      enlaceInvalidado);

  const enlaceUtilizable =
    !tokenInvalidoDeOrigen && !enlaceVencido && !cuentaBloqueadaPorAdmin;
  const cuentaPendiente = enlaceUtilizable && estadoCuenta === "pendiente";
  const cuentaBloqueada = enlaceUtilizable && estadoCuenta === "bloqueada";
  const cuentaActiva = enlaceUtilizable && estadoCuenta === "activa";
  const cuentaRequiereAccion = cuentaPendiente || cuentaBloqueada;
  const mostrarFormulario = cuentaActiva || cuentaRequiereAccion;

  const mostrarErrorFaltaUsuario = enlaceVencido;

  const avisoEstadoCuenta = cuentaPendiente
    ? {
        tono: "warning",
        Icono: FiAlertTriangle,
        titulo: "Activá tu cuenta",
        texto:
          "Tu cuenta está pendiente de activación. Al crear tu contraseña queda activa y lista para usar.",
      }
    : cuentaBloqueada
      ? {
          tono: "warning",
          Icono: FiAlertTriangle,
          titulo: "Cuenta bloqueada",
          texto:
            "Tu cuenta se bloqueó por superar el máximo de intentos. Al crear una nueva contraseña se desbloquea.",
        }
      : {
          tono: "neutral",
          Icono: FiLock,
          titulo: "Actualizando tu acceso",
          texto:
            "Tu cuenta sigue activa mientras hacés este cambio. Podés seguir usando tus accesos actuales hasta confirmar la nueva contraseña.",
        };

  useEffect(() => {
    if (!cuentaRequiereAccion) return;

    const avisarAntesDeCerrar = (e) => {
      e.preventDefault();
      e.returnValue = "";
    };

    window.addEventListener("beforeunload", avisarAntesDeCerrar);
    return () =>
      window.removeEventListener("beforeunload", avisarAntesDeCerrar);
  }, [cuentaRequiereAccion]);

  return (
    <>
      {verificandoEstado && !tokenInvalidoDeOrigen ? (
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
              (mostrarErrorFaltaUsuario || cuentaBloqueadaPorAdmin) &&
              !tokenInvalidoDeOrigen
                ? styles.loginFormSectionCentered
                : ""
            }`}
          >
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
              {mostrarFormulario && (
                <div
                  className={styles.successCallout}
                  style={{ marginBottom: 0 }}
                >
                  <FiCheckCircle className={styles.calloutIcon} />
                  <div className={styles.calloutContent}>
                    {cuentaActiva ? (
                      <>
                        <h2 className={styles.calloutTitle}>
                          Restablecé tu contraseña
                        </h2>
                        <p>
                          Ingresá tu nueva contraseña a continuación.
                        </p>
                      </>
                    ) : cuentaBloqueada ? (
                      <>
                        <h2 className={styles.calloutTitle}>
                          Desbloqueá tu cuenta
                        </h2>
                        <p>
                          Creá una nueva contraseña para desbloquear tu cuenta.
                        </p>
                      </>
                    ) : (
                      <>
                        <h2 className={styles.calloutTitle}>
                          Activá tu cuenta
                        </h2>
                        <p>
                          Creá tu contraseña para activar tu cuenta, o ingresá
                          con un código a tu correo.
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
                        autoComplete="email"
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

                {cuentaBloqueadaPorAdmin && (
                  <div className={styles.expiredTokenContainer}>
                    <FiLock size={48} color="var(--error-red)" />
                    <h3>Tu cuenta fue bloqueada por un administrador</h3>
                    <p>
                      Por seguridad, no podés desbloquearla desde este enlace.
                      Contactá a soporte para recuperar el acceso.
                    </p>

                    <Button
                      variant="primary"
                      onClick={() => navigate(`${basePath}/login`, { replace: true })}
                      style={{ marginTop: "1.5rem", width: "100%" }}
                    >
                      VOLVER AL INICIO
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
                        autoComplete="email"
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
                {mostrarFormulario && (
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
                            email=""
                            esValido={!errors.password && !!passwordValue}
                            disabled={guardandoClave}
                            autoComplete="new-password"
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
                        autoComplete="new-password"
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
                        disabled={!isValid || guardandoClave || reactivando}
                        style={{ width: "100%" }}
                      >
                        {guardandoClave ? "PROCESANDO..." : "GUARDAR"}
                      </Button>
                      {cuentaPendiente && (
                        <>
                          <div className={styles.divider}>
                            <span>o</span>
                          </div>
                          <Button
                            type="button"
                            variant="outline"
                            onClick={handleIngresarConCodigo}
                            disabled={reactivando || guardandoClave}
                            style={{ width: "100%" }}
                          >
                            {reactivando
                              ? "PROCESANDO..."
                              : "Ingresar con código"}
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
              {mostrarFormulario && (
                <div
                  className={styles.brandStatusCard}
                  data-tone={avisoEstadoCuenta.tono}
                >
                  <div className={styles.brandStatusIconWrap}>
                    <avisoEstadoCuenta.Icono />
                  </div>
                  <div>
                    <h3 className={styles.brandStatusTitle}>
                      {avisoEstadoCuenta.titulo}
                    </h3>
                    <p className={styles.brandStatusText}>
                      {avisoEstadoCuenta.texto}
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
