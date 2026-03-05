import React from "react";
import { useLocation } from "react-router-dom";
import { FiMail } from "react-icons/fi";
import Navbar from "../components/Navbar";
import "../styles/login.css";

const ConfirmarCorreo = () => {
  const location = useLocation();
  const emailUsuario = location.state?.emailIngresado || "tu correo";

  return (
    <div className="login-page">
      <Navbar
        texto="¿TENÉS USUARIO?"
        textoEnlace="INGRESÁ ACÁ"
        rutaDestino="/"
      />

      <main
        className="login-main flex-column"
        style={{ justifyContent: "center" }}
      >
        <h2 className="message-title">
          Antes de empezar confirmá tu correo electrónico
        </h2>

        <div className="envelope-icon">
          <FiMail size={150} color="var(--yellow)" strokeWidth={1.5} />
        </div>

        <p className="message-body">
          Te enviamos un mail a{" "}
          <span className="text-white">{emailUsuario}</span>. Si el correo es
          incorrecto registrate nuevamente con el mail corregido.
        </p>
      </main>
    </div>
  );
};

export default ConfirmarCorreo;
