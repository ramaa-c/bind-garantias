import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import { FiCalendar, FiFileText } from "react-icons/fi";
import "../styles/cheques.css";
import "../styles/inicio.css";

export default function Inicio() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("lineas");

  return (
    <div className="inicio-page">
      <Navbar usuario="asesoramiento@mailinator.com" />

      {/* --- Banner principal --- */}
      <section className="inicio-hero">
        <div className="inicio-hero-content">
          <div className="hero-card">
            <p className="hero-eyebrow">ASESORAMIENTO BIND</p>
            <h1 className="hero-title">
              Disponible: <br />
              <span className="text-yellow">U$D 0</span>
            </h1>

            <div className="hero-details">
              <p className="hero-detail-item">
                <FiFileText /> Pagaré
              </p>
              <p className="hero-detail-item">
                Límite de crédito: U$D 40.000 - Vencimiento de la línea:
                01/11/2026
              </p>
            </div>
          </div>
        </div>
      </section>

      <main className="inicio-main-container">
        <div className="inicio-contenedor-principal">
          {/* Pestañas */}
          <div className="tabs-header">
            <button
              className={`tab-btn ${activeTab === "lineas" ? "active" : ""}`}
              onClick={() => setActiveTab("lineas")}
            >
              Líneas
            </button>
            <button
              className={`tab-btn ${activeTab === "legajo" ? "active" : ""}`}
              onClick={() => setActiveTab("legajo")}
            >
              Legajo
            </button>
            <button
              className={`tab-btn ${activeTab === "tasas" ? "active" : ""}`}
              onClick={() => setActiveTab("tasas")}
            >
              Tasas
            </button>
          </div>

          {/* Pestaña Activa */}
          <div className="tab-content">
            {activeTab === "lineas" && (
              <div className="linea-card-container">
                <div className="linea-card-header">
                  <span className="linea-date">
                    <FiCalendar /> Fecha de vencimiento: 01/11/2026
                  </span>
                  <h3 className="linea-title">
                    Línea: Pagaré USD disponible{" "}
                    <span className="text-yellow">U$D 40.000</span>
                  </h3>
                  <p className="linea-subtitle">Límite de crédito: 40.000</p>
                </div>

                <div className="linea-card-body">
                  <h4 className="linea-body-title">Línea pagaré</h4>
                  <div className="linea-actions">
                    <button
                      className="btn-action btn-outline btn-sm"
                      onClick={() => navigate("/solicitudes")}
                    >
                      SOLICITUDES
                    </button>
                    <button
                      className="btn-action btn-sm"
                      onClick={() => navigate("/pagare-usd")}
                    >
                      NUEVA OPERACIÓN
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "legajo" && <div className="empty-state-box"></div>}

            {activeTab === "tasas" && <div className="empty-state-box"></div>}
          </div>
        </div>
      </main>
    </div>
  );
}
