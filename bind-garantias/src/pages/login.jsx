import React from "react";
import { useNavigate } from "react-router-dom";
import "../styles/login.css";
import logoBind from "../assets/images/Logo-BIND.webp";

const Login = () => {
  const navigate = useNavigate();

  return (
    <div className="login-page">
      <header className="login-header">
        <div className="header-logo-placeholder">
          <img src={logoBind} alt="Logo BIND" width="150" />
        </div>
        <div className="header-link">
          ¿TENÉS USUARIO?
          <span style={{cursor: 'pointer', color: 'var(--yellow)', fontWeight: 'bold', marginLeft: '0.5rem'}} onClick={() => navigate('/')}>
            INGRESÁ ACÁ
          </span>
        </div>
      </header>

      <main className="login-main">
        <div className="login-card">
          <div className="card-logo-placeholder">
            <img src={logoBind} alt="Logo BIND" width="200" />
          </div>

          <form className="login-form">
            <div className="input-group">
              <input type="email" id="email" placeholder=" " required />
              <label htmlFor="email">Email *</label>
            </div>

            <div className="input-group">
              <input type="password" id="password" placeholder=" " required />
              <label htmlFor="password">Contraseña *</label>
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