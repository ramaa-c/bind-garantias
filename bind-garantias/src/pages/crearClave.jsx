import React from "react";
import { useNavigate } from "react-router-dom";
import "../styles/login.css";
import logoBind from "../assets/images/Logo-BIND.webp";

const CrearPassword = () => {
  const navigate = useNavigate();

  return (
    <div className="login-page">
      <header className="login-header">
        <div className="header-logo-placeholder">
          <img src={logoBind} alt="Logo BIND" />
        </div>
        <div className="header-link">
          ¿TENÉS USUARIO?{" "}
          <span className="link-yellow" onClick={() => navigate("/")}>
            INGRESÁ ACÁ
          </span>
        </div>
      </header>

      <main className="login-main flex-column">
        <h2 className="user-display-text">
          Tu usuario es <span className="text-white">ejemplo@mailinator.com</span>
        </h2>

        <div className="login-card">
          <div className="card-logo-placeholder">
            <img src={logoBind} alt="Logo BIND" />
          </div>

          <p className="card-instruction-text">
            Ahora creá tu contraseña para poder volver a ingresar al sistema y
            consultar el estado de tu solicitud.
          </p>

          <form className="login-form">
            <div className="input-group">
              <input type="password" id="password" placeholder=" " required />
              <label htmlFor="password">Contraseña *</label>
            </div>

            <div className="input-group">
              <input type="password" id="confirm-password" placeholder=" " required />
              <label htmlFor="confirm-password">Confirmar contraseña *</label>
            </div>

            <button type="submit" className="btn-primary">
              INGRESAR
            </button>
          </form>
        </div>
      </main>
    </div>
  );
};

export default CrearPassword;