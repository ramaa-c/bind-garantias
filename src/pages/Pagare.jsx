import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { pagareSchema } from "../schemas/pagareSchema";
import "../styles/cheques.css";
import "../styles/pagare.css";
import PanelDudasPagare from "../components/features/pagare/PanelDudasPagare";
import Paso1SimuladorPagare from "../components/features/pagare/Paso1SimuladorPagare";
import Paso2AgentePagare from "../components/features/pagare/Paso2AgentePagare";
import Paso3Epyme from "../components/features/pagare/Paso3Epyme";
import Paso4ExitoPagare from "../components/features/pagare/Paso4ExitoPagare";

export default function PagareUSD() {
  const navigate = useNavigate();
  const [pasoActual, setPasoActual] = useState(1);
  const [simulacionLista, setSimulacionLista] = useState(false);

  const metodosFormulario = useForm({
    resolver: zodResolver(pagareSchema),
    mode: "onChange",
    defaultValues: { moneda: "Dólar", tipoCalculo: "monto" },
  });

  const { handleSubmit, trigger, watch } = metodosFormulario;
  const montoWatch = watch("monto") || 0;

  // --- CONTROLADORES ---
  const handleCalcularSimulacion = async () => {
    const esValido = await trigger(["monto", "fechaPago"]);
    if (esValido) setSimulacionLista(true);
  };

  const avanzarPaso = async (camposAValidar, siguientePaso) => {
    const esValido = await trigger(camposAValidar);
    if (esValido) setPasoActual(siguientePaso);
  };

  const onSubmitFinal = (data) => {
    console.log("Operación Finalizada:", data);
    setPasoActual(4);
  };

  return (
    <div className="pagare-page">
      <div className="pagare-main-container">
        <div
          className={`pagare-contenedor-principal ${pasoActual === 4 ? "is-success" : ""}`}
        >
          {/* LADO IZQUIERDO: FORMULARIOS */}
          <div className="pagare-seccion-formulario">
            {/* VOLVER */}
            {pasoActual > 1 && pasoActual < 4 && (
              <div className="back-button-container">
                <button
                  type="button"
                  onClick={() => setPasoActual(pasoActual - 1)}
                  className="btn-back"
                >
                  ← Volver al paso anterior
                </button>
              </div>
            )}
            {pasoActual === 1 && (
              <div className="back-button-container">
                <button
                  type="button"
                  onClick={() => navigate("/inicio")}
                  className="btn-back"
                >
                  ← Volver a la lista
                </button>
              </div>
            )}

            {/* TÍTULOS */}
            <h1 className="pagare-title">
              {pasoActual === 1 &&
                "Ingresás el monto del pagaré y la fecha de pago"}
              {pasoActual === 2 &&
                "Seleccioná al agente de bolsa con quien operás"}
              {pasoActual === 3 &&
                "Generá el pagaré en Epyme y completá la operación"}
              {pasoActual === 4 && "¡Felicitaciones!"}
            </h1>

            {/* PROGRESO */}
            {pasoActual < 4 && (
              <div className="progress-container">
                <p className="progress-text">Avance de solicitud</p>
                <div className="progress-track">
                  <div
                    className="progress-fill"
                    style={{
                      width:
                        pasoActual === 1
                          ? "33%"
                          : pasoActual === 2
                            ? "66%"
                            : "100%",
                    }}
                  ></div>
                </div>
              </div>
            )}

            {/* FORMULARIO */}
            <FormProvider {...metodosFormulario}>
              <form
                className="pagare-form-content"
                onSubmit={handleSubmit(onSubmitFinal)}
              >
                {pasoActual === 1 && (
                  <Paso1SimuladorPagare
                    simulacionLista={simulacionLista}
                    setSimulacionLista={setSimulacionLista}
                    montoWatch={montoWatch}
                    handleCalcularSimulacion={handleCalcularSimulacion}
                    setPasoActual={setPasoActual}
                  />
                )}

                {pasoActual === 2 && (
                  <Paso2AgentePagare avanzarPaso={avanzarPaso} />
                )}

                {pasoActual === 3 && <Paso3Epyme />}

                {pasoActual === 4 && (
                  <Paso4ExitoPagare
                    onVolverLista={() => navigate("/solicitudes")}
                  />
                )}
              </form>
            </FormProvider>
          </div>

          {/* LADO DERECHO: PANEL DUDAS */}
          <PanelDudasPagare pasoActual={pasoActual} />
        </div>
      </div>
    </div>
  );
}
