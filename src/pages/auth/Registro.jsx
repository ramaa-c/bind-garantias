import React from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { InputFlotante, Button } from "../../components/ui";
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

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(registroSchema),
  });

  const onSubmit = (data) => {
    navigate("/confirmar-correo", { state: { emailIngresado: data.email } });
  };

  return (
    <div className={styles.layoutSplit}>
      
      {/* --- COLUMNA IZQUIERDA --- */}
      <section className={styles.sideForm}>
        
        {/* LOGO */}
        <div className={styles.globalLogo}>
          <img src={logoBind} alt="Logo BIND" width="120" />
        </div>

        <div className={styles.cardModern}>
          <div className={styles.headerText}>
            <h2>Creá tu cuenta</h2>
            <p>Ingresá tu correo electrónico para comenzar.</p>
          </div>

          <form className={styles.formContent} onSubmit={handleSubmit(onSubmit)}>
            
            <InputFlotante
              type="email"
              id="email"
              label="Email *"
              error={errors.email?.message}
              {...register("email")}
            />

            <div className={styles.formActions}>
              <Button type="submit" variant="primary">
                REGISTRARSE
              </Button>
              
              <Button type="button" variant="outline" onClick={() => navigate("/")}>
                YA TENGO CUENTA
              </Button>
            </div>
          </form>

          {/* --- SOPORTE --- */}
          <div className={styles.supportContainerModern}>
            <p>¿Tenés problemas o dudas para registrarte?</p>
            <p>Ponete en contacto con nosotros a{" "}
              <a href="mailto:comerciales@bindgarantias.com.ar" className={styles.linkYellow}>
                comerciales@bindgarantias.com.ar
              </a>
            </p>
          </div>
          
        </div>
      </section>

      {/* --- COLUMNA DERECHA --- */}
      <section className={styles.sideBrand}>
        <div className={styles.brandContent}>
          <h2 className={styles.brandTitle}>Potenciando y transformando el financiamiento PyME.</h2>
          <p className={styles.brandSubtitle}>
            Accedé a la mejor financiación para tu empresa.
          </p>
        </div>
      </section>

    </div>
  );
};

export default Registro;