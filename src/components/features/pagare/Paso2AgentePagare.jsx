import React from "react";
import { useFormContext, Controller } from "react-hook-form";
import { FiBriefcase, FiCheckCircle } from "react-icons/fi";

const agentes = [
  {
    id: "industrial",
    nombre: "Industrial Valores S.A.",
    icono: <FiBriefcase />,
  },
  { id: "bullmarket", nombre: "Bull Market Brokers", icono: <FiBriefcase /> },
  { id: "balanz", nombre: "Balanz Capital", icono: <FiBriefcase /> },
];

export default function Paso2AgentePagare({ avanzarPaso }) {
  const {
    control,
    formState: { errors },
  } = useFormContext();

  return (
    <div className="pagare-paso-animado">
      <Controller
        name="agenteBolsa"
        control={control}
        defaultValue=""
        render={({ field: { onChange, value } }) => (
          <div className="agent-list-container">
            {agentes.map((agente) => (
              <div
                key={agente.id}
                className={`agent-list-item ${value === agente.id ? "selected" : ""}`}
                onClick={() => onChange(agente.id)}
              >
                <div className="agent-item-left">
                  <span className="agent-icon">{agente.icono}</span>
                  <span className="agent-name">{agente.nombre}</span>
                </div>

                <div className="agent-item-right">
                  {value === agente.id ? (
                    <FiCheckCircle className="check-icon active" />
                  ) : (
                    <div className="empty-circle"></div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      />

      {errors.agenteBolsa && (
        <span
          className="error-text-centered"
          style={{ position: "relative", bottom: 0, marginTop: "10px" }}
        >
          {errors.agenteBolsa.message}
        </span>
      )}

      <div className="pagare-actions-right">
        <button
          type="button"
          className="btn-action"
          onClick={() => avanzarPaso(["agenteBolsa"], 3)}
        >
          CONTINUAR
        </button>
      </div>
    </div>
  );
}
