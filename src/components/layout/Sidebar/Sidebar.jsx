import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { FiHome, FiFileText, FiCreditCard, FiBriefcase, FiSettings } from "react-icons/fi";
import "../../../styles/layout.css";

export default function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  return (
    <aside className="sidebar-container">
      <nav className="sidebar-nav">
        
        <p className="sidebar-heading">GENERAL</p>
        <button 
          className={`sidebar-link ${isActive("/inicio") ? "active" : ""}`} 
          onClick={() => navigate("/inicio")}
        >
          <FiHome className="sidebar-icon" /> Inicio
        </button>

        <p className="sidebar-heading" style={{ marginTop: '2rem' }}>PRODUCTOS</p>
        <button 
          className={`sidebar-link ${isActive("/pagare") ? "active" : ""}`} 
          onClick={() => navigate("/pagare")}
        >
          <FiFileText className="sidebar-icon" /> Pagaré USD
        </button>
        <button 
          className={`sidebar-link ${isActive("/cheques") ? "active" : ""}`} 
          onClick={() => navigate("/cheques")}
        >
          <FiCreditCard className="sidebar-icon" /> Cheques
        </button>
        <button 
          className={`sidebar-link ${isActive("/prestamos") ? "active" : ""}`} 
          onClick={() => navigate("/prestamos")}
        >
          <FiBriefcase className="sidebar-icon" /> Préstamos
        </button>

      </nav>

      <div className="sidebar-footer">
        <button className="sidebar-link">
          <FiSettings className="sidebar-icon" /> Configuración
        </button>
      </div>
    </aside>
  );
}