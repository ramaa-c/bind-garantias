import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { getPasswordScore } from "../../utils/PasswordSeguro";
import { FiShield } from "react-icons/fi";
import { InputFlotante, Button, InputPasswordSeguro } from "../../components/ui";
import styles from "./Login.module.css";
import logoBind from "../../assets/images/bind-g-logo.svg";

const getClaveSchema = (emailUsuario) => {
  return z.object({
    password: z.string()
      .min(12, { message: "Mínimo 12 caracteres" })
      .regex(/[a-z]/, { message: "Falta una minúscula" })
      .regex(/[A-Z]/, { message: "Falta una mayúscula" })
      .regex(/[0-9]/, { message: "Falta un número" })
      .regex(/[!_.*@#$%^&()\-+]/, { message: "Falta un caracter especial" })
      .refine((val) => {
        const score = getPasswordScore(val, emailUsuario);
        return score >= 3; 
      }, { message: "La contraseña es muy fácil de adivinar" }),
    
    confirmPassword: z.string(),
  }).refine((data) => data.password === data.confirmPassword, {
    message: "Las contraseñas no coinciden",
    path: ["confirmPassword"], 
  });
};

const CrearClave = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const emailUsuario = location.state?.emailIngresado || "ejemplo@mailinator.com";

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isValid, dirtyFields },
  } = useForm({
    resolver: zodResolver(getClaveSchema(emailUsuario)),
    mode: "onChange",
  });

  const currentPassword = useWatch({ control, name: "password", defaultValue: "" });

  const isPasswordValid = !errors.password && dirtyFields.password;

  const onSubmit = () => {
    // llamada api
  };

  return (
    <div className={styles.layoutSplit}>
      {/* --- COLUMNA IZQUIERDA --- */}
      <section className={styles.sideForm}>
        <div className={styles.globalLogo}>
          <img src={logoBind} alt="Logo BIND" width="120" onClick={() => navigate("/")} style={{ cursor: "pointer" }} />
        </div>

        <div className={styles.cardModern}>
          <div className={styles.headerText}>
            <h2>Creá tu contraseña</h2>
            <p>
              Para el usuario:{" "}
              <strong className={styles.boldWhiteText}>{emailUsuario}</strong>
            </p>
          </div>

          <form
            className={styles.formContent}
            onSubmit={handleSubmit(onSubmit)}
          >
            <InputPasswordSeguro
              label="Contraseña"
              id="password"
              currentValue={currentPassword}
              email={emailUsuario}
              esValido={isPasswordValid}
              {...register("password")}
            />

            <div className={styles.formFieldSpacing}>
              <InputFlotante
                label="Confirmar contraseña"
                type="password"
                id="confirmPassword"
                error={errors.confirmPassword?.message}
                {...register("confirmPassword")}
              />
            </div>

            <div className={`${styles.formActions} ${styles.formActionsMargin}`}>
              <Button
                type="submit"
                variant="primary"
                disabled={!isValid}
                className={!isValid ? styles.btnDisabled : ""}
              >
                CREAR E INGRESAR
              </Button>
            </div>
          </form>
        </div>
      </section>

      {/* --- COLUMNA DERECHA --- */}
      <section className={`${styles.sideBrand} ${styles.sideBrandCentered}`}>
        <div className={styles.shieldIconWrapper}>
          <FiShield size={80} color="var(--yellow)" strokeWidth={1.5} />
        </div>

        <div className={styles.brandContentCentered}>
          <h2 className={styles.brandTitleLarge}>
            Protegé tu cuenta.
          </h2>
          <p className={styles.brandSubtitle}>
            Usá una contraseña fuerte y única. Nunca compartas tus credenciales
            de acceso con terceros.
          </p>
        </div>
      </section>
    </div>
  );
};

export default CrearClave;