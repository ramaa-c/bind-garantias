import React, { useState, useEffect } from "react";
import { useForm, FormProvider, useWatch } from "react-hook-form";
import { useFormPersist, getPersistedFormData } from "../../hooks/useFormPersist";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate } from "react-router-dom";
import { solicitudChequesSchema } from "../../schemas/solicitudChequesSchema";
import { FiRotateCcw } from "react-icons/fi";
import {
  Paso3Simulador,
  ModalConfirmacionBorrador,
  PasoEmisor,
  PasoBolsa,
  PasoDetalles,
  PasoExito,
} from "../../components/features";
import { HelpDrawer } from "../../components/layout/HelpDrawer/HelpDrawer";
import { BarraProgreso, BotonVolver } from "../../components/ui";
import styles from "./SolicitudCheques.module.css";

const STORAGE_KEY = "draft_solicitud_cheques";

export default function SolicitudCheques() {
  const navigate = useNavigate();

  const [mostrarResultados, setMostrarResultados] = useState(false);
  const [isModalReiniciarAbierto, setIsModalReiniciarAbierto] = useState(false);

  const [isHelpOpen, setIsHelpOpen] = useState(false);

  useEffect(() => {
    const handler = () => setIsHelpOpen((prev) => !prev);
    document.addEventListener("bindHelp:toggle", handler);
    return () => document.removeEventListener("bindHelp:toggle", handler);
  }, []);

  const metodosFormulario = useForm({
    resolver: zodResolver(solicitudChequesSchema),
    mode: "onChange",
    shouldUnregister: false,
    defaultValues: getPersistedFormData(STORAGE_KEY, {
      moneda: "Pesos",
      tipoProducto: "cheques_propios",
      sociedadBolsa: "",
      emisorCuit: "",
      tipoCheque: "fisico",
    }),
  });

  const { handleSubmit, trigger, watch, setValue, control } = metodosFormulario;

  const { pasoActual, setPasoActual, clearStorage } = useFormPersist({
    storageKey: STORAGE_KEY,
    watch,
  });



  // --- NAVEGACIÓN Y FUNCIONES ---
  const handleVolver = () => {
    setPasoActual((prev) => (prev === 5 ? 1 : prev - 1));
  };

  const handleResetFlujoCompleto = () => {
    clearStorage();
    metodosFormulario.reset({
      moneda: "Pesos",
      tipoProducto: "cheques_propios",
      sociedadBolsa: "",
      emisorCuit: "",
      tipoCheque: "fisico",
      monto: "",
      fechaPago: "",
    });
    setMostrarResultados(false);
    setPasoActual(1);
  };

  const handleReiniciarAlta = () => {
    setIsModalReiniciarAbierto(true);
  };

  const confirmarReinicioAlta = () => {
    handleResetFlujoCompleto();
    setIsModalReiniciarAbierto(false);
  };

  const onSubmitFinal = () => {
    setPasoActual(5);
  };

  // Paso 1: Simulador
  const handleCalcularSimulador = () => {
    setMostrarResultados(true);
  };

  const handleContinuarSimulador = () => {
    setPasoActual(2);
  };

  // Paso 2: Emisor
  const handleContinuarEmisor = async () => {
    if (await trigger("emisorCuit")) {
      setPasoActual(3);
    }
  };

  // Paso 3: Bolsa
  const avanzarConBolsa = () => {
    setPasoActual(4);
  };



  // Paso 4: Detalles
  const handleContinuarDetalles = async () => {
    const tipo = watch("tipoCheque");

    const camposAValidar = ["tipoCheque"];
    if (tipo === "fisico") camposAValidar.push("cmc7");
    if (tipo === "echeck") camposAValidar.push("idCoelsa");

    const esValido = await trigger(camposAValidar);

    if (esValido) {
      handleSubmit(onSubmitFinal)();
    }
  };

  const obtenerTextosCabecera = () => {
    switch (pasoActual) {
      case 1:
        return { t: "Ingreso de Cheques", s: "Simulá la operación para conocer los costos estimados antes de continuar." };
      case 2:
        return { t: "Ingreso de Cheques", s: "Verificá y confirmá los datos del emisor del cheque." };
      case 3:
        return { t: "Ingreso de Cheques", s: "Seleccioná la sociedad de bolsa con la que operás." };
      case 4:
        return { t: "Ingreso de Cheques", s: "Completá los detalles finales del cheque a ingresar." };
      case 5:
        return { t: "¡Operación completada!", s: "" };
      default:
        return { t: "Ingreso de Cheques", s: "" };
    }
  };

  return (
    <div className={styles.pageContainer}>
      <div className={styles.formMainContainer}>
        <div className={styles.contentWrapper}>
          <div className={styles.navegacionTop}>
            <div className={styles.botonesNavegacion}>
              {pasoActual > 1 && pasoActual < 5 && (
                <BotonVolver
                  onClick={() => {
                    handleVolver();
                    if (pasoActual === 1) setMostrarResultados(false);
                  }}
                />
              )}

              {pasoActual === 1 && (
                <BotonVolver
                  onClick={() => navigate("/inicio")}
                  texto="Volver al inicio"
                />
              )}

              {pasoActual < 5 && (
                <BotonVolver
                  onClick={handleReiniciarAlta}
                  icon={FiRotateCcw}
                  texto="Reiniciar operación"
                />
              )}
            </div>
          </div>

          <div className={styles.contenedorPrincipal}>
            <div className={styles.columnaFormulario}>
              {pasoActual >= 1 && pasoActual < 5 && (
                <nav className={styles.stepperNav}>
                  <BarraProgreso
                    hitos={[
                      "SIMULADOR",
                      "EMISOR",
                      "SOCIEDAD DE BOLSA",
                      "DETALLES",
                    ]}
                    hitoActual={pasoActual}
                  />
                </nav>
              )}

              {pasoActual < 5 && (
                <div className={styles.bienvenidaHeader}>
                  <h1 className={styles.tituloBienvenida}>{obtenerTextosCabecera().t}</h1>
                  <div className={styles.titleAccent}></div>
                  {obtenerTextosCabecera().s && (
                    <p className={styles.subtituloBienvenida}>{obtenerTextosCabecera().s}</p>
                  )}
                </div>
              )}

              <div className={styles.seccionFormulario}>
                {/* FORMULARIO */}
                <FormProvider {...metodosFormulario}>
                  <form className={styles.formContent}>
                    <div key={pasoActual} className="animacion-paso">
                      {pasoActual === 1 && (
                        <Paso3Simulador
                          mostrarResultados={mostrarResultados}
                          onCalcular={handleCalcularSimulador}
                          onContinuar={handleContinuarSimulador}
                          onCancelar={() => setMostrarResultados(false)}
                          opcionesProducto={[
                            {
                              value: "cheques_propios",
                              label: "Cheques propios",
                            },
                            {
                              value: "cheques_terceros",
                              label: "Cheques de terceros",
                            },
                          ]}
                          mostrarTipoCalculo={true}
                          labelFecha="Fecha de pago"
                          labelMonto="Monto de cheque"
                        />
                      )}

                      {pasoActual === 2 && (
                        <PasoEmisor
                          onValidar={handleContinuarEmisor}
                          onVolver={handleVolver}
                        />
                      )}

                      {pasoActual === 3 && (
                        <PasoBolsa avanzarConBolsa={avanzarConBolsa} />
                      )}

                      {pasoActual === 4 && (
                        <PasoDetalles onContinuar={handleContinuarDetalles} />
                      )}

                      {pasoActual === 5 && (
                        <PasoExito onVolverInicio={handleResetFlujoCompleto} />
                      )}
                    </div>
                  </form>
                </FormProvider>
              </div>
            </div>

            <HelpDrawer
              isOpen={isHelpOpen}
              onClose={() => setIsHelpOpen(false)}
              contexto="solicitud_cheques"
              pasoActual={pasoActual}
            />
          </div>
        </div>
      </div>

      <ModalConfirmacionBorrador
        isOpen={isModalReiniciarAbierto}
        onClose={() => setIsModalReiniciarAbierto(false)}
        onConfirm={confirmarReinicioAlta}
      />
    </div>
  );
}
