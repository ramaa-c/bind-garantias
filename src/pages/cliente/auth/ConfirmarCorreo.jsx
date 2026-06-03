import React, { useState, useEffect } from "react";
import { useLocation, useNavigate, Navigate } from "react-router-dom";
import { HiOutlineMailOpen, HiClock } from "react-icons/hi";
import { toast } from "sonner";
import { useResetearPassword } from "../../../hooks/useUsuario";
import { useChannel } from "../../../context/ChannelContext";
import styles from "./Login.module.css";
import logoBind from "../../../assets/images/bind-g-logo.svg";

const RESEND_SECONDS = 60;
const pad = (n) => String(n).padStart(2, "0");
const fmt = (t) => `${pad(Math.floor(t / 60))}:${pad(t % 60)}`;

const ConfirmarCorreo = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { channelInfo } = useChannel();

  const emailUsuario =
    location.state?.usuarioSkeletor?.email || location.state?.emailIngresado;
  const usuarioSkeletor = location.state?.usuarioSkeletor || null;
  const canal = location.state?.canal || "";
  const origen = location.state?.origen || "registro";

  const { mutate: reenviarCorreo, isPending } = useResetearPassword();
  const [timeLeft, setTimeLeft] = useState(RESEND_SECONDS);

  useEffect(() => {
    if (!emailUsuario || timeLeft <= 0) return;
    const id = setTimeout(() => setTimeLeft((t) => t - 1), 1000);
    return () => clearTimeout(id);
  }, [timeLeft, emailUsuario]);

  const canResend = timeLeft === 0 && !isPending;

  const handleReenviar = () => {
    if (!canResend) return;

    const getCSharpIsoDate = (addYears = 0) => {
      const date = new Date();
      if (addYears) date.setFullYear(date.getFullYear() + addYears);
      return date.toISOString().split(".")[0];
    };

    reenviarCorreo(
      {
        email: emailUsuario,
        usuariowebid: 0,
        fchalta: usuarioSkeletor?.fchalta || getCSharpIsoDate(),
        fchvencimiento: usuarioSkeletor?.fchvencimiento || getCSharpIsoDate(1),
        hashseguridad: canal || "canal1",
        estado: "",
        debecambiarclave: "",
        esadministrador: "",
        denominacion: "",
      },
      {
        onSuccess: () => {
          toast.success("Enlace reenviado", {
            description: "Revisá tu bandeja de entrada o la carpeta de SPAM.",
          });
          setTimeLeft(RESEND_SECONDS);
        },
        onError: () => {
          toast.error("Error al reenviar", {
            description: "Ocurrió un error. Intentá más tarde.",
          });
        },
      },
    );
  };

  if (!emailUsuario) {
    setTimeout(() => {
      toast.error("Sesión inválida", {
        description:
          "No se encontró información del registro. Volvé a intentarlo.",
      });
    }, 0);
    return <Navigate to="/registro" replace />;
  }

  return (
    <div className={styles.layoutSplit}>
      {/* ── COLUMNA FORMULARIO ── */}
      <section className={styles.sideForm}>
        <div className={styles.globalLogo}>
          <div className={styles.logosWrapper}>
            <img
              src={logoBind}
              alt="Logo BIND"
              onClick={() => navigate("/")}
              className={styles.clickableLogo}
            />
            {channelInfo?.id !== "default" && (
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
          {/* Header */}
          <div className={styles.headerText}>
            <h2>Revisá tu correo</h2>
            <p>
              Enviamos un enlace a esta dirección. Hacé clic en el enlace para
              continuar con el proceso.
            </p>
          </div>

          {/* Email destacado */}
          <div className={styles.emailDestacado}>
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <rect x="2" y="4" width="20" height="16" rx="2" />
              <path d="m2 7 8.5 6a2 2 0 0 0 3 0L22 7" />
            </svg>
            {emailUsuario}
          </div>

          {/* Pasos guía */}
          <div className={styles.instrucciones}>
            <div className={styles.instruccionItem}>
              <span className={styles.instruccionNum}>1</span>
              <p className={styles.instruccionTxt}>
                Abrí tu casilla de <strong>{emailUsuario}</strong>
              </p>
            </div>
            <div className={styles.instruccionItem}>
              <span className={styles.instruccionNum}>2</span>
              <p className={styles.instruccionTxt}>
                Buscá un correo de <strong>BIND</strong> con las instrucciones.
              </p>
            </div>
            <div className={styles.instruccionItem}>
              <span className={styles.instruccionNum}>3</span>
              <p className={styles.instruccionTxt}>
                Si no lo encontrás, revisá la carpeta de{" "}
                <strong>SPAM o correo no deseado</strong>
              </p>
            </div>
          </div>

          {/* Fila de reenvío — mismo patrón que OtpPhase */}
          <div className={styles.resendRow}>
            <span className={styles.resendLabel}>¿No te llegó el correo?</span>
            {canResend ? (
              <button
                type="button"
                className={styles.resendBtn}
                onClick={handleReenviar}
                disabled={isPending}
              >
                {isPending ? "Reenviando..." : "Reenviar enlace"}
              </button>
            ) : (
              <span className={styles.resendTimer}>{fmt(timeLeft)}</span>
            )}
          </div>

          {/* Correo incorrecto */}
          <div className={styles.supportContainerModern}>
            <p>
              ¿El correo es incorrecto?{" "}
              <span
                className={styles.linkYellow}
                role="button"
                tabIndex={0}
                onClick={() => navigate(origen === "recuperar" ? "/recuperar-clave" : "/registro")}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    navigate(origen === "recuperar" ? "/recuperar-clave" : "/registro");
                  }
                }}
              >
                Volver al paso anterior
              </span>
            </p>
          </div>
        </div>
      </section>

      {/* ── COLUMNA MARCA ── */}
      <section className={`${styles.sideBrand} ${styles.sideBrandCentered}`}>
        <div className={styles.confirmarCorreoBrandContent}>
          <div className={styles.heroIconWrapper}>
            <HiOutlineMailOpen
              className={styles.heroIcon}
              size={96}
              strokeWidth={1.2}
            />
          </div>
          <h2 className={styles.brandTitleLarge} style={{ maxWidth: "100%" }}>
            Revisá tu <em className={styles.brandEm}>bandeja de entrada</em>
          </h2>
          <div style={{ marginTop: "1rem", padding: "0.75rem 1rem", background: "rgba(245, 244, 0, 0.08)", border: "1px solid rgba(245, 244, 0, 0.15)", borderRadius: "0.75rem", display: "inline-block" }}>
            <p className={styles.brandSubtitle} style={{ color: "var(--white, #fff)", fontWeight: "600", fontSize: "0.95rem", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.4rem" }}>
              <HiClock size={18} style={{ color: "var(--color-amarillo-bind, #f5f400)" }} /> El enlace expira en 5 minutos.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default ConfirmarCorreo;
