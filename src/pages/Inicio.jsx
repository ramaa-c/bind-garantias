import React from "react";
import { useNavigate } from "react-router-dom";
import { FiTrendingUp, FiCalendar, FiClock, FiPlusCircle, FiArrowRight } from "react-icons/fi";
import { TbFileInvoice } from "react-icons/tb";
import "../styles/cheques.css";
import "../styles/inicio.css";

// Mocks rápidos para el dashboard
const solicitudesRecientes = [
  { id: "4362", tipo: "Pagaré USD", monto: "40.000", estado: "esperando", texto: "Esperando Docs" },
  { id: "4361", tipo: "Cheque", monto: "15.000", estado: "aprobado", texto: "Aprobado" },
];

export default function Inicio() {
  const navigate = useNavigate();

  return (
    <div className="inicio-page">

      <main className="inicio-main-container">
        <div className="inicio-content-wrapper">
          
          {/* HEADER: Saludo y Acciones Globales */}
          <header className="inicio-header">
            <div>
              <h1 className="inicio-greeting">Hola, Asesoramiento</h1>
              <p className="inicio-sub-greeting">Aquí tenés el resumen de tus líneas de crédito.</p>
            </div>
            <button className="btn-action" onClick={() => navigate("/pagare")}>
              <FiPlusCircle size={18} style={{ marginRight: '8px' }}/> 
              NUEVA OPERACIÓN
            </button>
          </header>

          {/* GRID DE KPIs (Métricas clave) */}
          <section className="kpi-grid">
            <div className="kpi-card">
              <div className="kpi-icon"><FiTrendingUp /></div>
              <p className="kpi-label">Disponible (Pagaré USD)</p>
              <h2 className="kpi-value text-yellow">U$D 40.000</h2>
            </div>
            
            <div className="kpi-card">
              <div className="kpi-icon" style={{ color: '#aaa' }}><TbFileInvoice /></div>
              <p className="kpi-label">Límite Total Aprobado</p>
              <h2 className="kpi-value">U$D 40.000</h2>
            </div>

            <div className="kpi-card">
              <div className="kpi-icon" style={{ color: '#ff5252' }}><FiCalendar /></div>
              <p className="kpi-label">Próximo Vencimiento</p>
              <h2 className="kpi-value">01/11/2026</h2>
            </div>
          </section>

          {/* LAYOUT INFERIOR: Dividido en 2 columnas en desktop */}
          <div className="inicio-bottom-grid">
            
            {/* COLUMNA IZQUIERDA: Tus Líneas */}
            <section className="inicio-section">
              <div className="section-header-row">
                <h3 className="section-title">Mis Líneas Activas</h3>
              </div>
              
              <div className="linea-modern-card">
                <div className="linea-modern-info">
                  <h4>Línea Pagaré Bursátil</h4>
                  <p>Operá en dólares de forma ágil.</p>
                </div>
                <div className="linea-modern-actions">
                  <button className="btn-action btn-outline btn-sm" onClick={() => navigate("/pagare")}>
                    UTILIZAR LÍNEA
                  </button>
                </div>
              </div>
              
              {/* Espacio para futuras líneas (ej: Cheques) */}
              <div className="linea-modern-card disabled">
                <div className="linea-modern-info">
                  <h4>Línea Cheques (Próximamente)</h4>
                  <p>Descuento de cheques de pago diferido.</p>
                </div>
              </div>
            </section>

            {/* COLUMNA DERECHA: Actividad Reciente */}
            <section className="inicio-section">
              <div className="section-header-row">
                <h3 className="section-title">Actividad Reciente</h3>
                <button className="btn-link text-sm" onClick={() => navigate("/solicitudes")}>
                  Ver todas <FiArrowRight />
                </button>
              </div>

              <div className="actividad-list">
                {solicitudesRecientes.map((sol, index) => (
                  <div className="actividad-item" key={index}>
                    <div className="actividad-icon">
                      <FiClock color={sol.estado === 'esperando' ? 'var(--yellow)' : '#4caf50'} />
                    </div>
                    <div className="actividad-details">
                      <p className="actividad-title">Solicitud N° {sol.id} <span>• {sol.tipo}</span></p>
                      <p className="actividad-monto">U$D {sol.monto}</p>
                    </div>
                    <div className={`actividad-status status-${sol.estado}`}>
                      {sol.texto}
                    </div>
                  </div>
                ))}
                
                {solicitudesRecientes.length === 0 && (
                  <p className="empty-text">No hay actividad reciente.</p>
                )}
              </div>
            </section>

          </div>
        </div>
      </main>
    </div>
  );
}