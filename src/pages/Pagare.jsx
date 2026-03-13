import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { pagareSchema } from "../schemas/pagareSchema";
import { BarraProgreso, BotonVolver } from "../components/ui";
import {
  PanelDudasPagare,
  Paso1SimuladorPagare,
  Paso2AgentePagare,
  Paso3Epyme,
  Paso4ExitoPagare,
} from "../components/features";
import styles from "./Pagare.module.css";

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
    <div className={styles.pagarePage}>
      <div className={styles.pagareMainContainer}>
        <div className={styles.pagareContenedorPrincipal}>
          <div className={styles.columnaFormulario}>
            {pasoActual > 1 && pasoActual < 4 && (
              <BotonVolver onClick={() => setPasoActual(pasoActual - 1)} />
            )}

            {pasoActual === 1 && (
              <BotonVolver
                onClick={() => navigate("/inicio")}
                texto="Volver a la lista"
              />
            )}

            <div className={styles.pagareSeccionFormulario}>
              {pasoActual < 4 && (
                <h1 className={styles.pagareTitle}>
                  {pasoActual === 1 &&
                    "Ingresás el monto del pagaré y la fecha de pago"}
                  {pasoActual === 2 &&
                    "Seleccioná al agente de bolsa con quien operás"}
                  {pasoActual === 3 &&
                    "Generá el pagaré en Epyme y completá la operación"}
                </h1>
              )}

              {/* PROGRESO */}
              {pasoActual < 4 && (
                <BarraProgreso currentStep={pasoActual} totalSteps={3} />
              )}

              {/* FORMULARIO */}
              <FormProvider {...metodosFormulario}>
                <form
                  className={styles.pagareFormContent}
                  onSubmit={handleSubmit(onSubmitFinal)}
                >
                  <div key={pasoActual} className="animacion-paso">
                    {pasoActual === 1 && (
                      <Paso1SimuladorPagare
                        simulacionLista={simulacionLista}
                        setSimulacionLista={setSimulacionLista}
                        montoWatch={montoWatch}
                        handleCalcularSimulacion={handleCalcularSimulacion}
                        setPasoActual={setPasoActual}
                      />
                    )}
                  </div>

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

          <PanelDudasPagare pasoActual={pasoActual} />
        </div>
      </div>
    </div>
  );
}
