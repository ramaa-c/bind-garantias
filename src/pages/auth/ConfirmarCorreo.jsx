import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { IoIosMailUnread } from "react-icons/io";
import { toast } from "sonner";
import { Button } from "../../components/ui";
import { useResetearPassword } from "../../hooks/useUsuario";
import styles from "./Login.module.css";
import logoBind from "../../assets/images/bind-g-logo.svg";

const ConfirmarCorreo = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const usuarioSkeletor = location.state?.usuarioSkeletor || null;
  const canal = location.state?.canal || "";
  const emailUsuario =
    usuarioSkeletor?.email || location.state?.emailIngresado || "tu correo";

  const { mutate: reenviarCorreo, isPending } = useResetearPassword();

  const handleReenviar = () => {
    if (emailUsuario === "tu correo") {
      toast.error("No tenemos registro de tu sesión.", {
        description: "Por favor, registrate nuevamente.",
      });
      navigate("/registro");
      return;
    }

    const getCSharpIsoDate = () => new Date().toISOString().split(".")[0];

    const payloadReset = {
      email: emailUsuario,
      usuariowebid: 0,
      fchalta: usuarioSkeletor?.fchalta || getCSharpIsoDate(),
      fchvencimiento: usuarioSkeletor?.fchvencimiento || getCSharpIsoDate(),
      hashseguridad: canal,
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

  return (
    <div className={styles.layoutSplit}>
      {/* --- COLUMNA IZQUIERDA --- */}
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

          {/* --- SOPORTE --- */}
          <div
            className={`${styles.supportContainerModern} ${styles.supportContainerClean}`}
          >
            <p style={{ marginBottom: "0.5rem" }}>
              ¿No te llegó el correo?{" "}
              <span
                className={`${styles.linkYellow} ${isPending ? styles.disabledLink : ""}`}
                role="button"
                tabIndex={isPending ? -1 : 0}
                onClick={!isPending ? handleReenviar : undefined}
                onKeyDown={(e) => {
                  if (!isPending && (e.key === "Enter" || e.key === " ")) {
                    e.preventDefault();
                    handleReenviar();
                  }
                }}
                style={{
                  opacity: isPending ? 0.6 : 1,
                  cursor: isPending ? "not-allowed" : "pointer",
                }}
              >
                {isPending ? "Reenviando..." : "Reenviar enlace"}
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

      {/* --- COLUMNA DERECHA --- */}
      <section className={`${styles.sideBrand} ${styles.sideBrandCentered}`}>
        <div className={styles.iconCircleWrapper}>
          <IoIosMailUnread size={180} color="var(--yellow)" strokeWidth={1} />
        </div>
      </section>
    </div>
  );
};

export default ConfirmarCorreo;
