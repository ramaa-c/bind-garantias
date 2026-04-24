import React from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { InputFlotante, Button } from "../../components/ui";
import { useCrearUsuario } from "../../hooks/useUsuario";
import styles from "./Login.module.css";
import logoBind from "../../assets/images/bind-g-logo.svg";

const registroSchema = z.object({
  email: z
    .string()
    .min(1, { message: "El email es obligatorio" })
    .email({ message: "Formato de email inválido" }),
});

const Registro = () => {
  const navigate = useNavigate();
  const { mutateAsync: crearUsuario, isPending } = useCrearUsuario();

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(registroSchema),
  });

const onSubmit = async (data) => {
    const getCSharpIsoDate = (addYears = 0) => {
      const date = new Date();
      if (addYears) date.setFullYear(date.getFullYear() + addYears);
      return date.toISOString().split('.')[0]; 
    };

    const payloadSkeletor = {
      usuarioid: "", 
      email: data.email,
      usuariowebid: 0,
      fchalta: getCSharpIsoDate(),            
      fchvencimiento: getCSharpIsoDate(1),    
      hashseguridad: "",
      estado: "",
      debecambiarclave: "",
      esadministrador: "", 
      denominacion: "",
    };

    try {
      await crearUsuario(payloadSkeletor);
      navigate("/confirmar-correo", { state: { emailIngresado: data.email } });
    } catch (error) {
      console.error("Fallo al registrar usuario:", error);
      
      if (error?.response?.status === 409) {
        setError("email", { 
          type: "manual", 
          message: "Este correo ya se encuentra registrado en el sistema." 
        });
      } else {
        setError("root", { 
          type: "server", 
          message: "Ocurrió un error al intentar registrarte. Intentá nuevamente." 
        });
      }
    }
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
            style={{ cursor: "pointer" }}
          />
        </div>

        <div className={styles.cardModern}>
          <div className={styles.headerText}>
            <h2>Creá tu cuenta</h2>
            <p>Ingresá tu correo electrónico para comenzar.</p>
          </div>

          <form
            className={styles.formContent}
            onSubmit={handleSubmit(onSubmit)}
          >
            <InputFlotante
              type="email"
              id="email"
              label="Email *"
              error={errors.email?.message}
              disabled={isPending}
              {...register("email")}
            />

            {errors.root && (
              <div
                style={{
                  color: "var(--red, #e74c3c)",
                  fontSize: "0.85rem",
                  marginTop: "-0.5rem",
                  marginBottom: "0.5rem",
                }}
              >
                {errors.root.message}
              </div>
            )}

            <div className={styles.formActions}>
              <Button type="submit" variant="primary" disabled={isPending}>
                {isPending ? "REGISTRANDO..." : "REGISTRARSE"}
              </Button>

              <Button
                type="button"
                variant="outline"
                onClick={() => navigate("/")}
                disabled={isPending}
              >
                YA TENGO CUENTA
              </Button>
            </div>
          </form>

          {/* --- SOPORTE --- */}
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

export default Registro;
