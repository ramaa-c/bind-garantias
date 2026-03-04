import React from "react";
import { useNavigate } from "react-router-dom";
import logoBind from "../assets/images/Logo-BIND.webp";

const Navbar = ({ texto, textoEnlace, rutaDestino }) => {
  const navigate = useNavigate();

  return (
    <header className="login-header">
      <div
        className="header-logo-placeholder"
        onClick={() => navigate("/")}
        style={{ cursor: "pointer" }}
      >
        <img src={logoBind} alt="Logo BIND" width="150" />
      </div>

      {texto && textoEnlace && (
        <div className="header-link">
          {texto}{" "}
          <span className="link-yellow" onClick={() => navigate(rutaDestino)}>
            {textoEnlace}
          </span>
        </div>
      )}
    </header>
  );
};

export default Navbar;
