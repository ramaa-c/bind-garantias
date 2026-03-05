import React from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import "../styles/login.css";
import logoBind from "../assets/images/Logo-BIND.webp";
import Navbar from "../components/Navbar";

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
    // autenticación
  };

  return (
    <div className="login-page">
      <Navbar
        texto="¿NO TENÉS USUARIO?"
        textoEnlace="REGISTRATE ACÁ"
        rutaDestino="/registro"
      />

      <main className="login-main">
        <div className="login-card">
          <div className="card-logo-placeholder">
            <img src={logoBind} alt="Logo BIND" width="200" />
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
                type="password"
                id="password"
                placeholder=" "
                {...register("password")}
              />
              <label htmlFor="password">Contraseña *</label>
              {errors.password && (
                <span className="error-text">{errors.password.message}</span>
              )}
            </div>

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
          </form>
        </div>
      </main>
    </div>
  );
};

export default Login;
