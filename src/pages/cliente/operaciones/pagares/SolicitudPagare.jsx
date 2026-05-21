import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useForm, FormProvider, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  useFormPersist,
  getPersistedFormData,
} from "../../../../hooks/useFormPersist";
import { pagareSchema } from "../../../../schemas/pagareSchema";
import { BarraProgreso, BotonVolver } from "../../../../components/ui";
import { FiRotateCcw } from "react-icons/fi";
import {
  Paso1SimuladorPagare,
  Paso2AgentePagare,
  Paso3Epyme,
  Paso4ExitoPagare,
  ConfirmacionBorradorModal,
} from "../../../../components/features";
import { HelpDrawer } from "../../../../components/layout/Client/HelpDrawer/HelpDrawer";
import styles from "./SolicitudPagare.module.css";

const STORAGE_KEY = "draft_pagare";

export default function PagareUSD() {
  const navigate = useNavigate();

  const [simulacionLista, setSimulacionLista] = useState(false);
  const [isModalReiniciarAbierto, setIsModalReiniciarAbierto] = useState(false);

  const [isHelpOpen, setIsHelpOpen] = useState(false);

  useEffect(() => {
    const handler = () => setIsHelpOpen((prev) => !prev);
    document.addEventListener("bindHelp:toggle", handler);
    return () => document.removeEventListener("bindHelp:toggle", handler);
  }, []);

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

  const handleReiniciarAlta = () => {
    setIsModalReiniciarAbierto(true);
  };

  const confirmarReinicioAlta = () => {
    clearStorage();
    metodosFormulario.reset({
      moneda: "Dólar",
      tipoCalculo: "monto",
      monto: "",
      fechaPago: "",
    });
    setSimulacionLista(false);
    setPasoActual(1);
    setIsModalReiniciarAbierto(false);
  };

  const obtenerTextosCabecera = () => {
    switch (pasoActual) {
      case 1:
        return {
          t: "Simulador de Pagaré",
          s: "Calculá las condiciones de tu operación.",
        };
      case 2:
        return { t: "Agente Comercial", s: "Seleccioná la sociedad de bolsa." };
      case 3:
        return {
          t: "Firma EPYME",
          s: "Instrucciones para la firma electrónica.",
        };
      default:
        return { t: "Pagaré Bursátil", s: "" };
    }
  };

  const showHeaderYStepper = pasoActual < 4;

  return (
    <div className={styles.pagarePage}>
      <main className={styles.formMainContainer}>
        <div className={styles.contentWrapper}>
          <div className={styles.contenedorPrincipal}>
            <div className={styles.columnaFormulario}>
              {showHeaderYStepper && (
                <BarraProgreso
                  hitos={["SIMULADOR", "AGENTE", "FIRMA EPYME"]}
                  hitoActual={pasoActual}
                  onVolver={
                    pasoActual > 1
                      ? () => setPasoActual((prev) => prev - 1)
                      : null
                  }
                  onVolverInicio={
                    pasoActual === 1 ? () => navigate("/inicio") : null
                  }
                  onReiniciar={handleReiniciarAlta}
                />
              )}

              {pasoActual < 4 && (
                <div className={styles.bienvenidaHeader}>
                  <h1 className={styles.tituloBienvenida}>
                    {obtenerTextosCabecera().t}
                  </h1>
                  <div className={styles.titleAccent}></div>
                  {obtenerTextosCabecera().s && (
                    <p className={styles.subtituloBienvenida}>
                      {obtenerTextosCabecera().s}
                    </p>
                  )}
                </div>
              )}

              <div className={styles.seccionFormulario}>
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
              <HelpDrawer
                isOpen={isHelpOpen}
                onClose={() => setIsHelpOpen(false)}
                contexto="pagare"
                pasoActual={pasoActual}
              />
            )}
          </div>
        </div>
      </main>

      <ConfirmacionBorradorModal
        isOpen={isModalReiniciarAbierto}
        onClose={() => setIsModalReiniciarAbierto(false)}
        onConfirm={confirmarReinicioAlta}
        onContinueBorrador={() => setIsModalReiniciarAbierto(false)}
      />
    </div>
  );
}
