import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm, FormProvider, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useFormPersist, getPersistedFormData } from "../hooks/useFormPersist";
import { pagareSchema } from "../schemas/pagareSchema";
import { BarraProgreso, BotonVolver } from "../components/ui";
import {
  Paso1SimuladorPagare,
  Paso2AgentePagare,
  Paso3Epyme,
  Paso4ExitoPagare,
  PanelDudas,
} from "../components/features";
import styles from "./Pagare.module.css";

const STORAGE_KEY = "draft_pagare";

export default function PagareUSD() {
  const navigate = useNavigate();

  const [simulacionLista, setSimulacionLista] = useState(false);

  const metodosFormulario = useForm({
    resolver: zodResolver(pagareSchema),
    mode: "onChange",
    defaultValues: getPersistedFormData(STORAGE_KEY, {
      moneda: "Dólar",
      tipoCalculo: "monto",
    }),
  });

  const { handleSubmit, trigger, watch, control } = metodosFormulario;

  const { pasoActual, setPasoActual, clearStorage } = useFormPersist({
    storageKey: STORAGE_KEY,
    watch,
  });

  const montoWatch = useWatch({ control, name: "monto", defaultValue: 0 });

  const handleCalcularSimulacion = async () => {
    const esValido = await trigger(["monto", "fechaPago"]);
    if (esValido) setSimulacionLista(true);
  };

  const avanzarPaso = async (camposAValidar, siguientePaso) => {
    const esValido = await trigger(camposAValidar);
    if (esValido) setPasoActual(siguientePaso);
  };

  const onSubmitFinal = () => {
    setPasoActual(4);
  };

  const handleVolverLista = () => {
    clearStorage();
    navigate("/solicitudes");
  };

  return (
    <div className={styles.pagarePage}>
      <main className={styles.formMainContainer}>
        <div className={styles.contentWrapper}>
          <div className={styles.navegacionTop}>
            {pasoActual > 1 && pasoActual < 4 && (
              <BotonVolver onClick={() => setPasoActual((prev) => prev - 1)} />
            )}
            {pasoActual === 1 && (
              <BotonVolver
                onClick={() => navigate("/inicio")}
                texto="Volver a la lista"
              />
            )}
          </div>

          <div className={styles.contenedorPrincipal}>
            <div className={styles.columnaFormulario}>
              <div className={styles.seccionFormulario}>
                {pasoActual < 4 && (
                  <h1 className={styles.tituloVista}>
                    {pasoActual === 1 &&
                      "Ingresás el monto del pagaré y la fecha de pago"}
                    {pasoActual === 2 &&
                      "Seleccioná al agente de bolsa con quien operás"}
                    {pasoActual === 3 &&
                      "Generá el pagaré en Epyme y completá la operación"}
                  </h1>
                )}

                {pasoActual < 4 && (
                  <BarraProgreso
                    hitos={["Simulador", "Agente", "Firma Epyme"]}
                    hitoActual={pasoActual}
                  />
                )}

                <FormProvider {...metodosFormulario}>
                  <form
                    className={styles.formContent}
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
                      {pasoActual === 2 && (
                        <Paso2AgentePagare avanzarPaso={avanzarPaso} />
                      )}
                      {pasoActual === 3 && <Paso3Epyme />}
                      {pasoActual === 4 && (
                        <Paso4ExitoPagare onVolverLista={handleVolverLista} />
                      )}
                    </div>
                  </form>
                </FormProvider>
              </div>
            </div>

            {pasoActual < 4 && (
              <PanelDudas contexto="pagare" pasoActual={pasoActual} />
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
