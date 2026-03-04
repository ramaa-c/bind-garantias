import React from 'react';
import '../styles/login.css'; 
import logoBind from '../assets/images/Logo-BIND.webp';

const Registro = () => {
  return (
    <div className="login-page">
      <header className="login-header">
        <div className="header-logo-placeholder">
          <img src={logoBind} alt="Logo" width="150" />
        </div>
        <div className="header-link">
          ¿YA TENÉS USUARIO? <a href="/ingresar">INGRESÁ ACÁ</a>
        </div>
      </header>

      <main className="login-main">
        <div className="login-card">
          <div className="card-logo-placeholder">
            <img src={logoBind} alt="Logo BIND" width="200" />
          </div>

          <form className="login-form">
            <div className="input-group">
              <input 
                type="email" 
                id="email" 
                placeholder=" " 
                required 
              />
              <label htmlFor="email">Email *</label>
            </div>

            <button type="submit" className="btn-primary">
              REGISTRARSE
            </button>
            <button 
              type="button" 
              className="btn-secondary"
              onClick={() => window.location.href = '/login.jsx'}
            >
              VOLVER AL LOGIN
            </button>
          </form>
        </div>
      </main>
    </div>
  );
};

export default Registro;