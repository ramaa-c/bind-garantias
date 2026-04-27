import React, { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { getPasswordScore } from "../../utils/PasswordSeguro";
import { FiShield } from "react-icons/fi";

import {
  InputFlotante,
  Button,
  InputPasswordSeguro,
} from "../../components/ui";
import { useCambiarPassword } from "../../hooks/useUsuario";
import { useAuthStore } from "../../store/useAuthStore";

import styles from "./Login.module.css";
import logoBind from "../../assets/images/bind-g-logo.svg";

// --- SCHEMA ---
const getClaveSchema = (emailUsuario) => {
  return z
    .object({
      password: z
        .string()
        .min(12, { message: "Mínimo 12 caracteres" })
        .regex(/[a-z]/, { message: "Falta una minúscula" })
        .regex(/[A-Z]/, { message: "Falta una mayúscula" })
        .regex(/[0-9]/, { message: "Falta un número" })
        .regex(/[!_.*@#$%^&()\-+]/, { message: "Falta un caracter especial" })
        .refine(
          (val) => {
            const score = getPasswordScore(val, emailUsuario);
            return score >= 3;
          },
          { message: "La contraseña es muy fácil de adivinar" },
        ),

      confirmPassword: z.string(),
    })
    .refine((data) => data.password === data.confirmPassword, {
      message: "Las contraseñas no coinciden",
      path: ["confirmPassword"],
    });
};

const CrearClave = () => {
  const navigate = useNavigate();

  const user = useAuthStore((state) => state.user);
  const setUser = useAuthStore((state) => state.setUser);

  const emailUsuario = user?.email || "usuario@bind.com.ar";

  const { mutate: actualizarClave, isPending } = useCambiarPassword();

  const {
    register,
    handleSubmit,
    control,
    setError,
    formState: { errors, isValid, dirtyFields },
  } = useForm({
    resolver: zodResolver(getClaveSchema(emailUsuario)),
    mode: "onChange",
  });

  const currentPassword = useWatch({
    control,
    name: "password",
    defaultValue: "",
  });
  const isPasswordValid = !errors.password && dirtyFields.password;

  useEffect(() => {
    if (!user) {
      navigate("/login", { replace: true });
    }
  }, [user, navigate]);

  const onSubmit = (data) => {
    if (!user) return;

    const payloadCompleto = {
      ...user,
      hashseguridad: data.password,
      debecambiarclave: "0",
    };

    actualizarClave(payloadCompleto, {
      onSuccess: (updatedUser) => {
        setUser(updatedUser || payloadCompleto);
        navigate("/", { replace: true });
      },
      onError: (error) => {
        setError("root.serverError", {
          type: "manual",
          message:
            error?.response?.data?.message ||
            "Ocurrió un error al intentar cambiar la clave. Intente nuevamente.",
        });
      },
    });
  };

  if (!user) return null;

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
            noValidate
          >
            <InputPasswordSeguro
              label="Contraseña"
              id="password"
              currentValue={currentPassword}
              email={emailUsuario}
              esValido={isPasswordValid}
              disabled={isPending}
              {...register("password")}
            />

            <div className={styles.formFieldSpacing}>
              <InputFlotante
                label="Confirmar contraseña"
                type="password"
                id="confirmPassword"
                error={errors.confirmPassword?.message}
                disabled={isPending}
                {...register("confirmPassword")}
              />
            </div>

            {errors.root?.serverError && (
              <div className={styles.serverErrorAlert}>
                {errors.root.serverError.message}
              </div>
            )}

            <div
              className={`${styles.formActions} ${styles.formActionsMargin}`}
            >
              <Button
                type="submit"
                variant="primary"
                disabled={!isValid || isPending}
                className={!isValid || isPending ? styles.btnDisabled : ""}
              >
                {isPending ? "ACTUALIZANDO..." : "CREAR E INGRESAR"}
              </Button>
            </div>
          </form>
        </div>
      </section>

      <section className={`${styles.sideBrand} ${styles.sideBrandCentered}`}>
        <div className={styles.shieldIconWrapper}>
          <FiShield size={80} color="var(--yellow)" strokeWidth={1.5} />
        </div>

        <div className={styles.brandContentCentered}>
          <h2 className={styles.brandTitleLarge}>Protegé tu cuenta.</h2>
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
