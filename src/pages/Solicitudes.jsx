import React from "react";
import { useNavigate } from "react-router-dom";
import { FiCalendar, FiFilter, FiList } from "react-icons/fi";
import { FaMoneyBillWave } from "react-icons/fa";
import "../styles/cheques.css";
import "../styles/solicitudes.css";

// --- MOCK DATA ---
const mockSolicitudes = [
  {
    id: "4362",
    monto: "40.000",
    fechaAlta: "13/04/2022 13:31",
    vencimiento: "31/05/2023",
    estado: "esperando",
    estadoTexto: "ESPERANDO DOCUMENTACIÓN",
    acciones: ["CONTINUAR", "CANCELAR", "VER DETALLE"],
  },
  {
    id: "436298",
    monto: "40.000",
    fechaAlta: "13/04/2022 13:21",
    vencimiento: null,
    estado: "rechazado",
    estadoTexto: "RECHAZADO",
    acciones: ["VER DETALLE"],
  },
  {
    id: "436229",
    monto: "40.000",
    fechaAlta: "13/04/2022 13:31",
    vencimiento: null,
    estado: "aprobado",
    estadoTexto: "APROBADO",
    acciones: ["VER DETALLE"],
  },
];

export default function Solicitudes() {
  const navigate = useNavigate();

  const getStatusClass = (estado) => {
    switch (estado) {
      case "esperando":
        return "status-waiting";
      case "rechazado":
        return "status-rejected";
      case "aprobado":
        return "status-approved";
      default:
        return "";
    }
  };

  return (
    <div className="inicio-page">
      {/* HEADER */}
      <div className="solicitudes-header-block">
        <div className="solicitudes-header-content">
          <h2 className="solicitudes-title">
            <FaMoneyBillWave style={{ marginRight: "10px" }} />
            SOLICITUDES
          </h2>
          <p className="solicitudes-subtitle">
            Límite de crédito: U$D 40.000 - Vencimiento de la línea: 01/11/2026
          </p>
        </div>
      </div>

      <main className="inicio-main-container">
        <div
          className="inicio-contenedor-principal"
          style={{ maxWidth: "900px" }}
        >
          {/* NAVEGACIÓN Y ACCIONES SUPERIORES */}
          <div
            className="back-button-container"
            style={{ marginBottom: "20px" }}
          >
            <button
              type="button"
              onClick={() => navigate("/inicio")}
              className="btn-back"
            >
              ← Volver a inicio
            </button>
          </div>

          <div className="solicitudes-toolbar">
            <button className="btn-action" onClick={() => navigate("/pagare")}>
              NUEVA OPERACIÓN
            </button>
            <div className="solicitudes-tools">
              <button className="icon-btn active">
                <FiList size={24} />
              </button>
              <button className="icon-btn">
                <FiFilter size={24} />
              </button>
            </div>
          </div>

          {/* LISTA DE TARJETAS */}
          <div className="solicitudes-list">
            {mockSolicitudes.map((item, index) => (
              <div
                className={`solicitud-card ${getStatusClass(item.estado)}`}
                key={index}
              >
                <div className="solicitud-card-header">
                  <div
                    className={`solicitud-status-badge ${getStatusClass(item.estado)}`}
                  >
                    <span className="status-dot"></span>
                    {item.estadoTexto}
                  </div>
                  <div className="solicitud-date">
                    <FiCalendar /> {item.fechaAlta}
                  </div>
                </div>

                <div className="solicitud-card-body">
                  <div className="solicitud-info">
                    <h3 className="solicitud-main-text">
                      Solicitud N° {item.id} por U$D {item.monto}
                    </h3>
                    {item.vencimiento && (
                      <p className="solicitud-sub-text">
                        Fecha de vencimiento: {item.vencimiento}
                      </p>
                    )}
                  </div>

                  <div className="solicitud-actions">
                    {item.acciones.map((accion, i) => (
                      <button
                        key={i}
                        className={`btn-link ${accion === "CONTINUAR" ? "action-primary" : "action-secondary"}`}
                        onClick={() =>
                          console.log(
                            `Acción: ${accion} en Solicitud ${item.id}`,
                          )
                        }
                      >
                        {accion}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
