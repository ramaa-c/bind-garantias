import React from "react";
import { useNavigate } from "react-router-dom";
import logoBind from "../assets/images/bind-g-logo.svg";
import { FaRegUserCircle } from "react-icons/fa";

const Navbar = ({ texto, textoEnlace, rutaDestino, usuario }) => {
  const navigate = useNavigate();

  return (
    <header
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "0 4rem",
        backgroundColor: "var(--carbon-black)",
        borderBottom: "1px solid var(--graphite)",
        minHeight: "80px",
      }}
    >
      {/* Logo */}
      <div
        onClick={() => navigate("/")}
        style={{
          display: "flex",
          alignItems: "center",
          cursor: "pointer",
          padding: "0.5rem 0",
        }}
      >
        <img
          src={logoBind}
          alt="Logo BIND"
          style={{ height: "60px", width: "auto", objectFit: "contain" }}
        />
      </div>

      {/* Lado Derecho */}
      {usuario ? (
        <div style={{ fontSize: "0.95rem", color: "var(--white)", display: "flex", alignItems: "center", gap: "10px" }}>
          <span style={{ color: "#aaa" }}><FaRegUserCircle size={20} color={"var(--yellow)"} /></span> {usuario}
        </div>
      ) : (
        texto &&
        textoEnlace && (
          <div style={{ fontSize: "0.9rem", color: "var(--white)" }}>
            {texto}{" "}
            <span 
              className="link-yellow"
              onClick={() => navigate(rutaDestino)}
              style={{ color: "var(--yellow)", fontWeight: "bold", marginLeft: "0.5rem", cursor: "pointer" }}
            >
              {textoEnlace}
            </span>
          </div>
        )
      )}
    </header>
  );
};

export default Navbar;