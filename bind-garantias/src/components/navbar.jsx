import React from "react";
import { useNavigate } from "react-router-dom";
import logoBind from "../assets/images/Logo-BIND.webp";

const Navbar = ({ texto, textoEnlace, rutaDestino, usuario }) => {
  const navigate = useNavigate();

  return (
    <header className="login-header">
      <div
        className="header-logo-placeholder"
        onClick={() => navigate("/")}
        style={{ cursor: "pointer", border: "none", padding: 0 }}
      >
        <img
          src={logoBind}
          alt="Logo BIND"
          style={{ maxHeight: "40px", width: "auto", objectFit: "contain" }}
        />
      </div>

      {usuario ? (
        <div
          className="header-link"
          style={{ fontWeight: "normal", color: "var(--white)" }}
        >
          {usuario}
        </div>
      ) : (
        texto &&
        textoEnlace && (
          <div className="header-link">
            {texto}{" "}
            <span className="link-yellow" onClick={() => navigate(rutaDestino)}>
              {textoEnlace}
            </span>
          </div>
        )
      )}
    </header>
  );
};

export default Navbar;
