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
import { FaAngleLeft } from "react-icons/fa";

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
        
        {/* ELIMINAMOS TODOS LOS CONDICIONALES ACÁ. ES UN DIV PLANO. */}
        <div className="pagare-contenedor-principal">
          
          <div className="columna-formulario">
            {pasoActual > 1 && pasoActual < 4 && (
              <div className="back-button-container">
                <button
                  type="button"
                  onClick={() => setPasoActual(pasoActual - 1)}
                  className="btn-back"
                >
                  <FaAngleLeft size={16} /> Volver al paso anterior
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
                  <FaAngleLeft size={16} /> Volver a la lista
                </button>
              </div>
            )}

            {/* SE MANTIENE EL MISMO COLOR Y BORDE EN TODOS LOS PASOS */}
            <div className="pagare-seccion-formulario">
              
              {pasoActual < 4 && (
                <h1 className="pagare-title">
                  {pasoActual === 1 && "Ingresás el monto del pagaré y la fecha de pago"}
                  {pasoActual === 2 && "Seleccioná al agente de bolsa con quien operás"}
                  {pasoActual === 3 && "Generá el pagaré en Epyme y completá la operación"}
                </h1>
              )}

              {pasoActual < 4 && (
                <div className="progress-container">
                  <p className="progress-text">Avance de solicitud</p>
                  <div className="progress-track">
                    <div
                      className="progress-fill"
                      style={{
                        width:
                          pasoActual === 1 ? "33%" : pasoActual === 2 ? "66%" : "100%",
                      }}
                    ></div>
                  </div>
                </div>
              )}

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
          </div>

          {/* LADO DERECHO: PANEL DUDAS (Sin restricciones) */}
          <PanelDudasPagare pasoActual={pasoActual} />
          
        </div>
      </div>
    </div>
  );
}