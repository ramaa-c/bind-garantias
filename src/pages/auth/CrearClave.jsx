import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
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
import { InputAuth, Button } from "../../components/ui";
import {
  useObtenerUsuarioPorEncrypt,
  useEstablecerClave,
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

// Definición de requisitos
const PASSWORD_RULES = [
  { id: "minLength",  label: "12 caracteres", test: (v) => v.length >= 12 },
  { id: "lowercase",  label: "1 minúscula",   test: (v) => /[a-z]/.test(v) },
  { id: "uppercase",  label: "1 mayúscula",   test: (v) => /[A-Z]/.test(v) },
  { id: "number",     label: "1 número",      test: (v) => /[0-9]/.test(v) },
  { id: "special",    label: "1 símbolo",     test: (v) => /[!_.*@#$%^&()\-+]/.test(v) },
];

const CrearClave = () => {
  const { canal: canalRouter } = useParams();
  const { channelInfo } = useChannel();
  const navigate = useNavigate();

  const [tokenIntegridad] = useState(() => {
    if (typeof window === "undefined") return "";
    const savedToken = sessionStorage.getItem("secure_recovery_token") || "";
    sessionStorage.removeItem("secure_recovery_token");
    return savedToken;
  });

  const [canalIntegridad] = useState(() => {
    if (typeof window === "undefined") return canalRouter || "";
    const savedCanal =
      sessionStorage.getItem("secure_recovery_canal") || canalRouter;
    sessionStorage.removeItem("secure_recovery_canal");
    return savedCanal;
  });

  const {
    data: queryUsuario,
    isLoading: queryVerificandoToken,
    isError: queryTokenExpirado,
  } = useObtenerUsuarioPorEncrypt(tokenIntegridad);

  // --- MODO DESARROLLO VISUAL (Cambiar a false al terminar el diseño) ---
  const DEV_MODE = true;
  const tokenInvalidoDeOrigen = DEV_MODE ? false : (!tokenIntegridad || tokenIntegridad.length < 10);
  const usuario = DEV_MODE ? { usuariowebid: 999 } : queryUsuario;
  const verificandoToken = DEV_MODE ? false : queryVerificandoToken;
  const tokenExpirado = DEV_MODE ? false : queryTokenExpirado;
  // -----------------------------------------------------------------------

  const { mutate: establecerClave, isPending: guardandoClave } =
    useEstablecerClave();

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

  const passedRulesCount = PASSWORD_RULES.filter(rule => rule.test(passwordValue)).length;
  
  const getBarColor = (count) => {
    if (count <= 2) return "#ff5252"; // Rojo
    if (count <= 4) return "#ffb142"; // Amarillo
    return "#4ade80"; // Verde
  };

  const onSubmit = (formData) => {
    const payload = {
      usuarioid: usuario?.usuariowebid,
      data: {
        newpassword: formData.password,
      },
    };

    establecerClave(payload, {
      onSuccess: () => {
        toast.success("Contraseña establecida correctamente", {
          description: "Tu cuenta ha sido activada. Ya podés iniciar sesión.",
          duration: 5000,
        });
        navigate("/login", { replace: true });
      },
      onError: (err) => {
        const errMsg =
          err.response?.data?.message || "Error al establecer la credencial.";
        toast.error("Error de activación", { description: errMsg });
        setError("root.serverError", { type: "manual", message: errMsg });
      },
    });
  };

  const mostrarErrorFaltaUsuario =
    !usuario && errorObteniendoUsuario && !verificandoToken;

  return (
    <div className={styles.loginContainer}>
      {/* ── COLUMNA IZQUIERDA: FORMULARIO ── */}
      <section className={styles.loginFormSection}>
        <div className={styles.loginHeader}>
          <div className={styles.logosWrapper} style={{ justifyContent: "center", marginBottom: "2.5rem" }}>
            <img src={logoBind} alt="Logo BIND" className={styles.logo} style={{ margin: 0, height: "4rem", width: "auto" }} />
            {channelInfo.id !== "default" && (
              <>
                <div className={styles.logoSeparator} />
                <img src={channelInfo.logo} alt={`Logo ${channelInfo.nombre}`} className={styles.channelLogo} style={{ height: "4rem" }} />
              </>
            )}
          </div>
          <h1 className={styles.loginTitle}>Crear nueva contraseña</h1>
          <p className={styles.loginSubtitle}>
            Establecé las credenciales para acceder a tu cuenta.
          </p>
        </div>

        <div className={styles.formWrapper}>
          {/* Estado: token inválido */}
          {tokenInvalidoDeOrigen && (
            <div className={styles.expiredTokenContainer}>
              <FiAlertCircle size={48} color="var(--red)" />
              <h3>Enlace corrupto o ausente</h3>
              <p>El enlace de seguridad está incompleto o mal formado.</p>
              <Button variant="primary" onClick={() => navigate("/registro")} style={{ marginTop: "1.5rem" }}>
                SOLICITAR NUEVO ENLACE
              </Button>
            </div>
          )}

          {/* Estado: validando */}
          {verificandoToken && !tokenInvalidoDeOrigen && (
            <div className={styles.loadingStatePlaceholder}>
              <p>Validando enlace de seguridad...</p>
            </div>
          )}

          {/* Estado: token expirado */}
          {tokenExpirado && !verificandoToken && !tokenInvalidoDeOrigen && (
            <div className={styles.expiredTokenContainer}>
              <FiAlertCircle size={48} color="var(--red)" />
              <h3>El enlace ha expirado o es inválido</h3>
              <p>
                Por seguridad, los enlaces de activación tienen una validez de 5
                minutos.
              </p>
              <Button variant="primary" onClick={() => navigate("/registro")} style={{ marginTop: "1.5rem" }}>
                SOLICITAR NUEVO ENLACE
              </Button>
            </div>
          )}

          {/* Formulario principal */}
          {!verificandoToken && !tokenExpirado && !tokenInvalidoDeOrigen && usuario && (
            <form onSubmit={handleSubmit(onSubmit)} noValidate>
              {/* Input 1: Nueva contraseña */}
              <div className={styles.inputGroup}>
                <InputAuth
                  name="password"
                  control={control}
                  label="Nueva Contraseña"
                  type="password"
                  icon={<FiLock size={20} />}
                  esValido={!!passwordValue && passedRulesCount === 5}
                  hideError
                  disabled={guardandoClave}
                />

                {/* ── SEGMENTOS CON LABELS ── */}
                <div className={styles.strengthSegments}>
                  {PASSWORD_RULES.map((rule) => {
                    const passed = passwordValue ? rule.test(passwordValue) : false;
                    return (
                      <div key={rule.id} className={styles.strengthSegmentWrapper}>
                        <div
                          className={`${styles.strengthSegment} ${
                            passed ? styles.strengthSegmentOn : styles.strengthSegmentOff
                          }`}
                          style={passed ? { backgroundColor: "#4ade80" } : {}}
                        />
                        <span className={`${styles.segmentLabel} ${
                          passed ? styles.segmentLabelOn : styles.segmentLabelOff
                        }`}>
                          {rule.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>



              {/* Input 2: Confirmar contraseña */}
              <div className={styles.inputGroup} style={{ marginTop: "1rem", position: "relative" }}>
                <InputAuth
                  name="confirmPassword"
                  control={control}
                  label="Confirmar Contraseña"
                  type="password"
                  icon={<FiLock size={20} />}
                  esValido={!!confirmPasswordValue && passwordValue === confirmPasswordValue}
                  disabled={guardandoClave}
                />
                
                {/* ── FEEDBACK COINCIDENCIA ── */}
                {confirmPasswordValue.length > 0 && passwordValue === confirmPasswordValue && (
                  <span className={styles.successMsgMatch}>Las contraseñas coinciden</span>
                )}
              </div>

              {/* Error de servidor */}
              {errors.root?.serverError && (
                <div className={styles.serverErrorAlert}>
                  <FiXCircle /> {errors.root.serverError.message}
                </div>
              )}

              {/* Botón */}
              <div className={styles.formActions} style={{ marginTop: "1rem" }}>
                <Button
                  type="submit"
                  variant="primary"
                  disabled={!isValid || guardandoClave}
                >
                  {guardandoClave ? "PROCESANDO..." : "ACTIVAR CUENTA"}
                </Button>
              </div>
            </form>
          )}
        </div>
      </section>

      {/* ── COLUMNA DERECHA: BRANDING ── */}
      <section className={`${styles.sideBrand} ${styles.sideBrandCentered}`}>
        <div className={styles.crearClaveBrandContent}>
          <div className={styles.shieldIconWrapper}>
            <FiLock size={44} color="var(--yellow, #f4f500)" strokeWidth={1.5} />
          </div>
          <h2 className={styles.brandTitleLarge}>
            Tu acceso,<br /><em className={styles.brandEm}>seguro.</em>
          </h2>
        </div>
      </section>
    </div>
  );
};

export default CrearClave;
