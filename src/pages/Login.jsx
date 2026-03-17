import React from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { InputFlotante, Button } from "../components/ui";
import styles from "./Login.module.css";
import logoBind from "../assets/images/bind-g-logo.svg";

const loginSchema = z.object({
  email: z
    .string()
    .min(1, { message: "El email es obligatorio" })
    .email({ message: "Formato de email inválido" }),
  password: z.string().min(1, { message: "La contraseña es obligatoria" }),
});

const Login = () => {
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = (data) => {
    console.log("Autenticando...", data);
    // Lógica de autenticación
  };

  return (
    <div className={styles.layoutSplit}>
      {/* --- COLUMNA IZQUIERDA --- */}
      <section className={styles.sideForm}>
        <div className={styles.globalLogo}>
          <img src={logoBind} alt="Logo BIND" width="120" />
        </div>

        <div className={styles.cardModern}>
          <div className={styles.headerText}>
            <h2>¡Hola! Bienvenido</h2>
            <p>Ingresá tus datos para acceder a tu cuenta.</p>
          </div>

          <form
            className={styles.formContent}
            onSubmit={handleSubmit(onSubmit)}
          >
            <InputFlotante
              label="Email"
              type="email"
              id="email"
              error={errors.email?.message}
              {...register("email")}
            />

            <InputFlotante
              label="Contraseña"
              type="password"
              id="password"
              error={errors.password?.message}
              {...register("password")}
            />

            <div className={styles.formActions}>
              <Button type="submit" variant="primary">
                INGRESAR
              </Button>

              <Button
                type="button"
                variant="outline"
                onClick={() => navigate("/registro")}
              >
                REGISTRARSE
              </Button>
            </div>
          </form>
        </div>
      </section>

      {/* --- COLUMNA DERECHA --- */}
      <section className={styles.sideBrand}>
        <div className={styles.brandContent}>
          <h2 className={styles.brandTitle}>
            Potenciando y transformando el financiamiento PyME.
          </h2>
          <p className={styles.brandSubtitle}>
            Accedé a la mejor financiación para tu empresa.
          </p>
        </div>
      </section>
    </div>
  );
};

export default Login;
