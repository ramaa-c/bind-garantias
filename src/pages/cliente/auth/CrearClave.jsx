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
import { Button, Spinner, InputPasswordSeguro, InputSimple } from "../../../components/ui";
import {
  useObtenerUsuarioPorEncrypt,
  useEstablecerClave,
  useResetearPassword,
  useLoginByCode,
  useReactivarUsuario,
} from "../../../hooks/useUsuario";
import { useChannel } from "../../../context/ChannelContext";
import styles from "./Login.module.css";
import logoBind from "../../../assets/images/bind-g-logo.svg";

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
  const [emailManual, setEmailManual] = useState("");
  const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

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

  const { mutate: loginByCode, isPending: solicitandoCodigo } = useLoginByCode();
  const { mutate: reactivarUsuario, isPending: reactivando } = useReactivarUsuario();

  const handleOmitir = () => {
    if (!usuario?.email || !usuario?.usuariowebid) return;

    reactivarUsuario(usuario.usuariowebid, {
      onSuccess: () => {
        loginByCode(
          { email: usuario.email, password: "" },
          {
            onSuccess: (data) => {
              toast.success("Código enviado", {
                description: "Revisá tu correo para ingresar."
              });
              navigate(`/${channelInfo.id}/login`, {
                state: { emailIngresado: usuario.email, generatedOtp: data.password }
              });
            },
            onError: (error) => {
              const isServerError = error?.response?.status >= 500;
              toast.error(isServerError ? "Error de servidor" : "Error al solicitar código", {
                description: isServerError
                  ? "El servidor no responde. Por favor, intentá nuevamente más tarde."
                  : "Ocurrió un error. Intentá más tarde.",
              });
            },
          }
        );
      },
      onError: (error) => {
        const isServerError = error?.response?.status >= 500;
        toast.error(isServerError ? "Error de servidor" : "Error al activar cuenta", {
          description: isServerError
            ? "El servidor no responde. Por favor, intentá nuevamente más tarde."
            : "No pudimos activar tu cuenta en este momento. Intentá más tarde.",
        });
      }
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

    const payloadReset = {
      email: emailManual,
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
        navigate(`/${channelInfo.id}/confirmar-correo`, {
          state: { emailIngresado: emailManual, canal: canalIntegridad, origen: "recuperar" },
        });
      },
      onError: (error) => {
        const isServerError = error?.response?.status >= 500;
        toast.error(isServerError ? "Error de servidor" : "Error al solicitar enlace", {
          description: isServerError
            ? "El servidor no responde. Por favor, intentá nuevamente más tarde."
            : "No pudimos enviar el correo. Intentá registrarte nuevamente.",
        });
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
        navigate(`/${channelInfo.id}/login`, { replace: true });
      },
      onError: (error) => {
        const isServerError = error?.response?.status >= 500;
        const errMsg = isServerError
          ? "El servidor está experimentando problemas. Por favor, intentá nuevamente más tarde."
          : "Error al establecer la credencial. Intentá más tarde.";
        toast.error(isServerError ? "Error de servidor" : "Error de activación", { 
          description: errMsg 
        });
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



            {!tokenInvalidoDeOrigen && usuario && (
              <div className={styles.successCallout}>
                <FiCheckCircle className={styles.calloutIcon} />
                <div className={styles.calloutContent}>
                  <h2 className={styles.calloutTitle}>¡Email verificado con éxito!</h2>
                  <p>
                    Tu cuenta ya está activa. Crear una contraseña es <strong>opcional</strong>. 
                    Podés configurarla ahora o saltar este paso para ingresar siempre con un código a tu correo.
                  </p>
                </div>
              </div>
            )}

            <div className={styles.formWrapper}>
              {tokenInvalidoDeOrigen && (
                <div className={styles.expiredTokenContainer}>
                  <FiAlertCircle size={48} color="var(--red)" />
                  <h3>Enlace corrupto o ausente</h3>
                  <p>El enlace de seguridad está incompleto o mal formado.</p>
                  
                  <div style={{ marginTop: "1.5rem", width: "100%", textAlign: "left" }}>
                    <InputSimple
                      name="emailManual"
                      label="Ingresá tu correo electrónico"
                      value={emailManual}
                      onChange={setEmailManual}
                      type="email"
                      disabled={solicitandoNuevo}
                      esValido={emailManual.length > 0 && isValidEmail(emailManual)}
                      error={emailManual.length > 0 && !isValidEmail(emailManual) ? { message: "Formato de correo inválido" } : null}
                    />
                  </div>

                  <Button
                    variant="primary"
                    onClick={handleSolicitarNuevoEnlace}
                    style={{ marginTop: "1.5rem", width: "100%" }}
                    isLoading={solicitandoNuevo}
                    disabled={!isValidEmail(emailManual)}
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
                    Por seguridad, los enlaces tienen un tiempo de validez limitado. Solicitá uno nuevo para continuar.
                  </p>
                  
                  <div style={{ marginTop: "1.5rem", width: "100%", textAlign: "left" }}>
                    <InputSimple
                      name="emailManual"
                      label="Ingresá tu correo electrónico"
                      value={emailManual}
                      onChange={setEmailManual}
                      type="email"
                      disabled={solicitandoNuevo}
                      esValido={emailManual.length > 0 && isValidEmail(emailManual)}
                      error={emailManual.length > 0 && !isValidEmail(emailManual) ? { message: "Formato de correo inválido" } : null}
                    />
                  </div>

                  <Button
                    variant="primary"
                    onClick={handleSolicitarNuevoEnlace}
                    style={{ marginTop: "1.5rem", width: "100%" }}
                    isLoading={solicitandoNuevo}
                    disabled={!isValidEmail(emailManual)}
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

                  <div className={styles.formActions} style={{ marginTop: "1rem", flexDirection: "column", gap: "1rem" }}>
                    <Button
                      type="submit"
                      variant="primary"
                      disabled={!isValid || guardandoClave || solicitandoCodigo || reactivando}
                      style={{ width: "100%" }}
                    >
                      {guardandoClave ? "PROCESANDO..." : "GUARDAR"}
                    </Button>
                    <div className={styles.divider}>
                      <span>o</span>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleOmitir}
                      disabled={solicitandoCodigo || guardandoClave || reactivando}
                      style={{ width: "100%" }}
                    >
                      {solicitandoCodigo || reactivando ? "PROCESANDO..." : "Omitir e ingresar con código"}
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
