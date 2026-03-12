import React from "react";
import { useFormContext, Controller } from "react-hook-form";
import { FiBriefcase, FiCheckCircle, FiHash, FiArrowRight } from "react-icons/fi";

const sociedades = [
  { id: "tarallo", nombre: "Tarallo S.A.", icono: <FiBriefcase /> },
  { id: "otra", nombre: "Otra Sociedad de Bolsa", icono: <FiBriefcase /> },
];

export default function Paso6Bolsa({ avanzarConBolsa, avanzarSinBolsa }) {
  const {
    register,
    control,
    formState: { errors },
    setValue, // Agregamos setValue para poder limpiar el input de la cuenta si deselecciona
  } = useFormContext();

  return (
    <div className="paso-6-animado">
      
      <h3 className="step-subtitle white" style={{ marginBottom: "2rem" }}>
        ¿Operás con alguna de estas sociedades de bolsa?
      </h3>

      <Controller
        name="sociedadBolsa"
        control={control}
        render={({ field: { onChange, value } }) => (
          <div className="agent-list-container" style={{ maxHeight: "none", maxWidth: "100%" }}>
            {sociedades.map((sociedad) => {
              const isSelected = value === sociedad.nombre;

              return (
                <React.Fragment key={sociedad.id}>
                  {/* LA TARJETA */}
                  <div
                    className={`agent-list-item ${isSelected ? "selected" : ""}`}
                    onClick={() => {
                      if (isSelected) {
                        // Si ya estaba seleccionada, la DESELECCIONAMOS y limpiamos el número de cuenta
                        onChange("");
                        setValue("numeroCuentaBolsa", "");
                      } else {
                        // Si no estaba seleccionada, la SELECCIONAMOS
                        onChange(sociedad.nombre);
                      }
                    }}
                    style={{ 
                      marginBottom: isSelected ? "0" : "12px",
                      borderBottomLeftRadius: isSelected ? "0" : "8px",
                      borderBottomRightRadius: isSelected ? "0" : "8px",
                    }}
                  >
                    <div className="agent-item-left">
                      <span className="agent-icon">{sociedad.icono}</span>
                      <span className="agent-name">{sociedad.nombre}</span>
                    </div>
                    <div className="agent-item-right">
                      {isSelected ? (
                        <FiCheckCircle className="check-icon active" />
                      ) : (
                        <div className="empty-circle"></div>
                      )}
                    </div>
                  </div>

                  {/* ÁREA EXPANDIDA (Input + Botón Continuar) */}
                  {isSelected && (
                    <div 
                      className="anim-fade-in" 
                      style={{ 
                        padding: "25px 20px", 
                        backgroundColor: "rgba(244, 245, 0, 0.02)", 
                        border: "1px solid var(--yellow)", 
                        borderTop: "1px dashed rgba(244, 245, 0, 0.2)", 
                        borderBottomLeftRadius: "8px", 
                        borderBottomRightRadius: "8px",
                        marginBottom: "12px",
                        display: "flex",
                        flexDirection: "column",
                        gap: "20px"
                      }}
                    >
                      <div className="form-group-spaced input-width-md" style={{ margin: 0 }}>
                        <label className="form-label" style={{ color: "var(--white)" }}>
                          Número de cuenta en {sociedad.nombre} *
                        </label>
                        <div className="input-with-icon">
                          <FiHash className="input-icon" style={{ fontSize: "1.1rem" }} />
                          <input
                            type="text"
                            placeholder="Ej: 12345678"
                            className="form-input form-input-pl"
                            style={{ marginBottom: 0 }}
                            {...register("numeroCuentaBolsa")}
                          />
                        </div>
                        {errors.numeroCuentaBolsa && (
                          <span className="error-text-absolute" style={{ bottom: "-22px" }}>
                            {errors.numeroCuentaBolsa.message}
                          </span>
                        )}
                      </div>

                      <div>
                        <button
                          type="button"
                          onClick={avanzarConBolsa}
                          className="btn-action"
                          style={{ padding: "10px 25px", fontSize: "0.95rem" }}
                        >
                          CONFIRMAR Y AVANZAR
                        </button>
                      </div>
                    </div>
                  )}
                </React.Fragment>
              );
            })}
          </div>
        )}
      />

      {/* RUTA ALTERNATIVA */}
      <div 
        className="alternative-path-section" 
        style={{ 
          marginTop: "3rem", 
          paddingTop: "2rem", 
          borderTop: "1px dashed #333",
          display: "flex",
          flexDirection: "column",
          gap: "15px"
        }}
      >
        <p className="form-label muted" style={{ margin: 0, fontSize: "0.95rem" }}>
          ¿No tenés cuenta en ninguna de las opciones anteriores?
        </p>
        <div>
          <button
            type="button"
            onClick={avanzarSinBolsa}
            className="btn-outline action-secondary"
            style={{ display: "inline-flex", alignItems: "center", gap: "10px", padding: "12px 25px" }}
          >
            CONTINUAR SIN SOCIEDAD DE BOLSA <FiArrowRight />
          </button>
        </div>
      </div>

    </div>
  );
}