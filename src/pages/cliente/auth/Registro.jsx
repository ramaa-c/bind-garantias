import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { InputSimple } from "../../../components/ui/InputSimple/InputSimple";
import { Button } from "../../../components/ui/Button/Button";
import { useCrearUsuario, useResetearPassword } from "../../../hooks/useUsuario";
import {
  denominacionDesdeEmail,
  FECHA_VENCIMIENTO_USUARIO,
  esDemasiadosIntentos,
  avisarDemasiadosIntentos,
} from "../../../utils/usuarioUtils";
import { useChannel } from "../../../context/useChannel";
import { useThemeStore } from "../../../store/useThemeStore";
import styles from "./Login.module.css";
import logoBind from "../../../assets/images/bind-g-logo.svg";
import logoBindBlack from "../../../assets/images/bind-g-logo-black.svg";

// --- SCHEMA ---
const registroSchema = z.object({
  email: z
    .string()
    .min(1, { message: "El email es obligatorio" })
    .email({ message: "Formato de email inválido" })
    .toLowerCase()
    .trim(),
});

const Registro = () => {
  const navigate = useNavigate();
  const theme = useThemeStore((state) => state.theme);
  const { mutateAsync: crearUsuario, isPending: registrando } =
    useCrearUsuario();
  const { mutateAsync: reenviarCorreo, isPending: reenviando } =
    useResetearPassword();
  const { channelInfo, basePath } = useChannel();

  const {
    control,
    handleSubmit,
    setError,
    clearErrors,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(registroSchema),
    defaultValues: {
      email: "",
    },
  });

  const emailValue = useWatch({ control, name: "email" });

  useEffect(() => {
    if (errors.email?.type === "server" || errors.email?.type === "manual") {
      clearErrors("email");
    }
  }, [emailValue, clearErrors]);

  const getCSharpIsoDate = () => {
    const date = new Date();
    return date.toISOString().split(".")[0];
  };

  const onSubmit = async (data) => {
    const canalId = channelInfo.id;

    const payloadSkeletor = {
      email: data.email,
      fchalta: getCSharpIsoDate(),
      fchvencimiento: FECHA_VENCIMIENTO_USUARIO,
      hashseguridad: "",
      estado: "",
      debecambiarclave: "",
      esadministrador: "",
      denominacion: denominacionDesdeEmail(data.email),
      fronturl: window.location.origin + basePath,
    };

    const irAConfirmacion = () =>
      navigate(`${basePath}/confirmar-correo`, {
        replace: true,
        state: {
          usuarioSkeletor: payloadSkeletor,
          canal: canalId,
          origen: "registro",
        },
      });

    const avisarErrorServidor = () => {
      clearErrors("email");
      toast.error("Error de servidor", {
        description: "Ocurrió un error. Intentá más tarde.",
      });
    };

    try {
      await crearUsuario(payloadSkeletor);
      irAConfirmacion();
    } catch (error) {
      const status = error?.response?.status;

      if (esDemasiadosIntentos(error)) {
        avisarDemasiadosIntentos();
        return;
      }

      if (status === 409) {
        try {
          await reenviarCorreo({ ...payloadSkeletor, usuariowebid: 0 });
          irAConfirmacion();
        } catch (errorReenvio) {
          if (esDemasiadosIntentos(errorReenvio)) {
            avisarDemasiadosIntentos();
            return;
          }
          avisarErrorServidor();
        }
        return;
      }

      if (!error?.response || status >= 500) {
        avisarErrorServidor();
      } else {
        setError("email", {
          type: "server",
          message: "Error al registrar cuenta. Verificá los datos.",
        });
      }
    }
  };

  const isFormDisabled = registrando || reenviando;

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
              <h2>Creá tu cuenta</h2>
              <p>Ingresá tu correo electrónico para comenzar.</p>
            </div>

            <form
              className={styles.formContent}
              onSubmit={handleSubmit(onSubmit)}
              noValidate
            >
              <InputSimple
                name="email"
                control={control}
                label="Correo Electrónico"
                type="email"
                autoComplete="email"
                disabled={isFormDisabled}
              />

              <div className={styles.formActions}>
                <Button
                  type="submit"
                  variant="primary"
                  isLoading={isFormDisabled}
                  style={{ width: "100%" }}
                >
                  {registrando ? "PROCESANDO..." : "REGISTRARSE"}
                </Button>
              </div>

              {/* Navegación secundaria como enlace (Estándar UX) */}
              <div style={{ marginTop: "1.5rem", textAlign: "center", fontSize: "0.875rem", color: "var(--text-muted)" }}>
                ¿Ya tenés una cuenta?{" "}
                <span 
                  className={styles.inlineLink}
                  onClick={!isFormDisabled ? () => navigate(`${basePath}/login`) : undefined} 
                  style={{ 
                    cursor: isFormDisabled ? "not-allowed" : "pointer", 
                    opacity: isFormDisabled ? 0.6 : undefined
                  }}
                >
                  Iniciar sesión
                </span>
              </div>
            </form>

            <div className={styles.supportContainerModern}>
              <p>¿Tenés problemas o dudas para registrarte?</p>
              <p>
                Ponete en contacto con nosotros a{" "}
                <a
                  href="mailto:comerciales@bindgarantias.com.ar"
                  className={styles.linkYellow}
                >
                  comerciales@bindgarantias.com.ar
                </a>
              </p>
            </div>
          </div>
        </section>

        <section className={styles.sideBrand}>
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

export default Registro;
