import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { IoIosMailUnread } from "react-icons/io";
import { Button } from "../components/ui";
import styles from "./Login.module.css";
import logoBind from "../assets/images/bind-g-logo.svg";

const ConfirmarCorreo = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const emailUsuario = location.state?.emailIngresado || "tu correo";

  return (
    <div className={styles.layoutSplit}>
      {/* --- COLUMNA IZQUIERDA --- */}
      <section className={styles.sideForm}>
        <div className={styles.globalLogo}>
          <img src={logoBind} alt="Logo BIND" width="120" />
        </div>

        <div className={`${styles.cardModern} ${styles.textLeft}`}>
          <div className={styles.headerText}>
            <h2 className={styles.titleJumbo}>Revisá tu correo</h2>
            <p className={styles.textLead}>
              Te enviamos un enlace de confirmación a: <br />
              <span className={styles.boldWhiteText}>{emailUsuario}</span>
            </p>
          </div>

          <div className={`${styles.formActions} ${styles.formActionsMargin}`}>
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate("/")}
            >
              VOLVER AL INICIO
            </Button>
          </div>

          {/* --- SOPORTE --- */}
          <div
            className={`${styles.supportContainerModern} ${styles.supportContainerClean}`}
          >
            <p>¿No te llegó o el correo es incorrecto?</p>
            <p>
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
