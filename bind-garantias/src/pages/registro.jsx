import React from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import Navbar from "../components/Navbar";
import "../styles/login.css";
import logoBind from "../assets/images/Logo-BIND.webp";

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
    // autenticación
    navigate("/confirmarCorreo", { state: { emailIngresado: data.email } });
  };

  return (
    <div className="login-page">
      <Navbar
        texto="¿YA TENÉS USUARIO?"
        textoEnlace="INGRESÁ ACÁ"
        rutaDestino="/"
      />

      <main className="login-main flex-column-registro">
        <div className="login-card">
          <div className="card-logo-placeholder">
            <img src={logoBind} alt="Logo BIND" />
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

            <button type="submit" className="btn-primary">
              REGISTRARSE
            </button>
          </form>
        </div>

        <div className="support-container">
          En caso de tener problemas o dudas para generar tu registro ponete en
          contacto con nosotros a{" "}
          <a
            href="mailto:comerciales@bindgarantias.com.ar"
            className="link-yellow"
          >
            comerciales@bindgarantias.com.ar
          </a>
        </div>
      </main>
    </div>
  );
};

export default Registro;
