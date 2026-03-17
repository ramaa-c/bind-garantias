import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { FiEye, FiEyeOff } from "react-icons/fi";
import "../styles/login.css";
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
  const [showPassword, setShowPassword] = useState(false);

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
    <div className="login-layout-split">
      {/* --- COLUMNA IZQUIERDA --- */}
      <section className="login-side-form">

        {/* LOGO */}
        <div className="login-global-logo">
          <img src={logoBind} alt="Logo BIND" width="120" />
        </div>

        {/* TARJETA DE LOGIN */}
        <div className="login-card-modern">
          <div className="login-header-text">
            <h2>¡Hola! Bienvenido</h2>
            <p>Ingresá tus datos para acceder a tu cuenta.</p>
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

            <div className="input-group">
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                placeholder=" "
                {...register("password")}
              />
              <label htmlFor="password">Contraseña *</label>

              <button
                type="button"
                className="toggle-password-btn"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <FiEyeOff size={20} /> : <FiEye size={20} />}
              </button>

              {errors.password && (
                <span className="error-text">{errors.password.message}</span>
              )}
            </div>

            <div className="form-actions">
              <button type="submit" className="btn-primary">
                INGRESAR
              </button>

              <button
                type="button"
                className="btn-secondary"
                onClick={() => navigate("/registro")}
              >
                REGISTRARSE
              </button>
            </div>
          </form>
        </div>
      </section>

      {/* --- COLUMNA DERECHA --- */}
      <section className="login-side-brand">
        <div className="brand-content">
          <h2 className="brand-title">Potenciando y transformando el financiamiento PyME.</h2>
          <p className="brand-subtitle">
            Accedé a la mejor financiación para tu empresa.
          </p>
        </div>
      </section>
    </div>
  );
};

export default Login;