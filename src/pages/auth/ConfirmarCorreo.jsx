import React, { useState, useEffect } from "react";
import { useLocation, useNavigate, Navigate } from "react-router-dom";
import { IoIosMailUnread } from "react-icons/io";
import { toast } from "sonner";
import { useResetearPassword } from "../../hooks/useUsuario";
import styles from "./Login.module.css";
import logoBind from "../../assets/images/bind-g-logo.svg";

const ConfirmarCorreo = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const emailUsuario = location.state?.usuarioSkeletor?.email || location.state?.emailIngresado;
  const usuarioSkeletor = location.state?.usuarioSkeletor || null;
  const canal = location.state?.canal || "";

  const { mutate: reenviarCorreo, isPending } = useResetearPassword();
  const [cooldown, setCooldown] = useState(60);

  useEffect(() => {
    if (cooldown > 0 && emailUsuario) {
      const timer = setTimeout(() => setCooldown((c) => c - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldown, emailUsuario]);

  if (!emailUsuario) {
    setTimeout(() => {
      toast.error("Sesión inválida", {
        description: "No se encontró información del registro. Volvé a intentarlo.",
      });
    }, 0);
    return <Navigate to="/registro" replace />;
  }

  const handleReenviar = () => {
    if (cooldown > 0 || isPending) return;

    const getCSharpIsoDate = (addYears = 0) => {
      const date = new Date();
      if (addYears) date.setFullYear(date.getFullYear() + addYears);
      return date.toISOString().split(".")[0];
    };

    const payloadReset = {
      email: emailUsuario,
      usuariowebid: 0,
      fchalta: usuarioSkeletor?.fchalta || getCSharpIsoDate(),
      fchvencimiento: usuarioSkeletor?.fchvencimiento || getCSharpIsoDate(1),
      hashseguridad: canal || "canal1",
      estado: "",
      debecambiarclave: "",
      esadministrador: "",
      denominacion: "",
    };

    reenviarCorreo(payloadReset, {
      onSuccess: () => {
        toast.success("Enlace reenviado", {
          description: "Revisá tu bandeja de entrada o la carpeta de SPAM.",
        });
        setCooldown(60);
      },
      onError: (err) => {
        toast.error("Error al reenviar", {
          description:
            err.response?.data?.message ||
            "Ocurrió un error. Intentá más tarde.",
        });
      },
    });
  };

  const isButtonDisabled = isPending || cooldown > 0;

  return (
    <div className={styles.layoutSplit}>
      <section className={styles.sideForm}>
        <div className={styles.globalLogo}>
          <img
            src={logoBind}
            alt="Logo BIND"
            width="120"
            onClick={() => navigate("/")}
            className={styles.clickableLogo}
          />
        </div>

        <div className={`${styles.cardModern} ${styles.textLeft}`}>
          <div className={styles.headerText}>
            <h2 className={styles.titleJumbo}>Revisá tu correo</h2>
            <p className={styles.textLead}>
              Te enviamos un enlace de confirmación a: <br />
              <span className={styles.boldWhiteText}>{emailUsuario}</span>
            </p>
          </div>

          <div
            className={`${styles.supportContainerModern} ${styles.supportContainerClean}`}
          >
            <p style={{ marginBottom: "0.5rem" }}>
              ¿No te llegó el correo?{" "}
              <span
                className={`${styles.linkYellow} ${isButtonDisabled ? styles.disabledLink : ""}`}
                role="button"
                tabIndex={isButtonDisabled ? -1 : 0}
                onClick={!isButtonDisabled ? handleReenviar : undefined}
                onKeyDown={(e) => {
                  if (!isButtonDisabled && (e.key === "Enter" || e.key === " ")) {
                    e.preventDefault();
                    handleReenviar();
                  }
                }}
                style={{
                  opacity: isButtonDisabled ? 0.6 : 1,
                  cursor: isButtonDisabled ? "not-allowed" : "pointer",
                }}
              >
                {isPending
                  ? "Reenviando..."
                  : cooldown > 0
                    ? `Reenviar enlace en ${cooldown}s`
                    : "Reenviar enlace"}
              </span>
            </p>
            <p>
              ¿El correo es incorrecto?{" "}
              <span
                className={`${styles.linkYellow} ${styles.linkYellowReset}`}
                role="button"
                tabIndex={0}
                onClick={() => navigate("/registro")}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    navigate("/registro");
                  }
                }}
              >
                Registrate nuevamente
              </span>
            </p>
          </div>
        </div>
      </section>

      <section className={`${styles.sideBrand} ${styles.sideBrandCentered}`}>
        <div className={styles.iconCircleWrapper}>
          <IoIosMailUnread size={180} color="var(--yellow)" strokeWidth={1} />
        </div>
      </section>
    </div>
  );
};

export default ConfirmarCorreo;