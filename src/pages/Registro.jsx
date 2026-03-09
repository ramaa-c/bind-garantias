import React from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import "../styles/login.css";
import logoBind from "../assets/images/bind-g-logo.svg";

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
    <div className="login-layout-split">
      
      {/* --- COLUMNA IZQUIERDA --- */}
      <section className="login-side-form">
        <div className="login-card-modern">
          <div className="card-logo-placeholder" style={{ justifyContent: 'flex-start', padding: 0 }}>
            <img src={logoBind} alt="Logo BIND" width="200" />
          </div>

          <div className="login-header-text">
            <h2>Creá tu cuenta</h2>
            <p>Ingresá tu correo electrónico para comenzar a operar.</p>
          </div>

          <form className="login-form" onSubmit={handleSubmit(onSubmit)}>
            <div className="input-group">
              <input
                type="email"
                id="email"
                placeholder=" "
                {...register("email")}
              />
              <label htmlFor="email">Email *</label>
              {errors.email && (
                <span className="error-text">{errors.email.message}</span>
              )}
            </div>

            <div className="form-actions">
              <button type="submit" className="btn-primary">
                REGISTRARSE
              </button>
              
              <button
                type="button"
                className="btn-secondary"
                onClick={() => navigate("/")}
              >
                YA TENGO CUENTA
              </button>
            </div>
          </form>

          {/* --- SOPORTE --- */}
          <div className="support-container-modern">
            <p>¿Tenés problemas o dudas para registrarte?</p>
            <p>Ponete en contacto con nosotros a{" "}
              <a href="mailto:comerciales@bindgarantias.com.ar" className="link-yellow">
                comerciales@bindgarantias.com.ar
              </a>
            </p>
          </div>
          
        </div>
      </section>

      {/* --- COLUMNA DERECHA --- */}
      <section className="login-side-brand">
        <div className="brand-content">
          <h2 className="brand-title">Potenciá el crecimiento de tu empresa.</h2>
          <p className="brand-subtitle">
            Unite a la plataforma que simplifica y agiliza la obtención de avales para PyMEs en el mercado de capitales.
          </p>
        </div>
      </section>

    </div>
  );
};

export default Registro;