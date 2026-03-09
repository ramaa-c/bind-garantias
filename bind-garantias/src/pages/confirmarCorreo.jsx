import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { FiMail } from "react-icons/fi";
import { IoIosMailUnread } from "react-icons/io";
import "../styles/login.css";
import logoBind from "../assets/images/bind-g-logo.svg";

const ConfirmarCorreo = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const emailUsuario = location.state?.emailIngresado || "tu correo";

  return (
    <div className="login-layout-split">
      
      {/* --- COLUMNA IZQUIERDA --- */}
      <section className="login-side-form">
        <div className="login-card-modern" style={{ textAlign: "left" }}>
          
          <div className="card-logo-placeholder" style={{ justifyContent: "flex-start", padding: 0, marginBottom: "2rem" }}>
            <img src={logoBind} alt="Logo BIND" width="200" />
          </div>

          <div className="login-header-text">
            <h2 style={{ fontSize: "2.5rem", marginBottom: "1rem" }}>Revisá tu correo</h2>
            <p style={{ fontSize: "1.1rem", lineHeight: "1.6" }}>
              Te enviamos un enlace de confirmación a: <br />
              <span className="text-white" style={{ fontWeight: "bold" }}>{emailUsuario}</span>
            </p>
          </div>

          <div className="form-actions" style={{ marginTop: "2rem" }}>
            <button
              type="button"
              className="btn-secondary"
              onClick={() => navigate("/")}
            >
              VOLVER AL INICIO
            </button>
          </div>

          {/* --- SOPORTE --- */}
          <div className="support-container-modern" style={{ textAlign: "left", marginTop: "3rem", borderTop: "none", paddingTop: 0 }}>
            <p>¿No te llegó o el correo es incorrecto?</p>
            <p>
              <span 
                className="link-yellow" 
                onClick={() => navigate("/registro")}
                style={{ cursor: "pointer", marginLeft: 0 }}
              >
                Registrate nuevamente
              </span>
            </p>
          </div>

        </div>
      </section>

      {/* --- COLUMNA DERECHA --- */}
      <section className="login-side-brand" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        
        <div style={{
          backgroundColor: 'rgba(244, 245, 0, 0.05)',
          borderRadius: '50%',
          padding: '4rem',
          boxShadow: '0 0 50px rgba(244, 245, 0, 0.1)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center'
        }}>
          <IoIosMailUnread size={180} color="var(--yellow)" strokeWidth={1} />
        </div>

      </section>

    </div>
  );
};

export default ConfirmarCorreo;