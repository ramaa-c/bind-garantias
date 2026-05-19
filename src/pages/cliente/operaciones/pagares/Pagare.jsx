import React, { useState, useEffect } from "react";
import { useForm, FormProvider } from "react-hook-form";
import {
  useFormPersist,
  getPersistedFormData,
} from "../../../../hooks/useFormPersist";
import { zodResolver } from "@hookform/resolvers/zod";
import { FiRotateCcw } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import { prestamosSchema } from "../../../../schemas/prestamosSchema";
import { ModalSms, BarraProgreso, BotonVolver } from "../../../../components/ui";
import { ModalConfirmacionBorrador } from "../../../../components/features";
import { HelpDrawer } from "../../../../components/layout/HelpDrawer/HelpDrawer";
import styles from "../prestamos/Prestamos.module.css";
import { PagarePasos } from "./PagarePasos";

const STORAGE_KEY = "draft_pagare";

export default function Pagare() {
  const navigate = useNavigate();

  const metodosFormulario = useForm({
    resolver: zodResolver(prestamosSchema),
    mode: "onChange",
    shouldUnregister: false,
    defaultValues: getPersistedFormData(STORAGE_KEY, {
      moneda: "Pesos",
      tipoProducto: "pagare",
      tipoCalculo: "por_monto_pagare",
      monto: "",
      plazo: "",
      fechaPago: "",
      cuit: "",
      direccion: "",
      provincia: "",
      localidad: "",
      celular: "",
      representantes: [],
      emailFacturacion: "",
    }),
  });

  const { handleSubmit, trigger, watch } = metodosFormulario;

  const {
    pasoActual,
    setPasoActual,
    listaExtra: socios,
    setListaExtra: setSocios,
    clearStorage,
  } = useFormPersist({
    storageKey: STORAGE_KEY,
    watch,
  });

  const [isModalReiniciarAbierto, setIsModalReiniciarAbierto] = useState(false);

  const [uiState, setUiState] = useState({
    mostrarModal: false,
    codigoSms: "",
    mostrarResultados: false,
    faseSocio: "lista",
    tempSocioCuit: "",
    tempSocioNombre: "",
    tempSocioParticipacion: "",
    docExpandido: "estatuto",
  });

  const [isHelpOpen, setIsHelpOpen] = useState(false);

  useEffect(() => {
    const handler = () => setIsHelpOpen((prev) => !prev);
    document.addEventListener("bindHelp:toggle", handler);
    return () => document.removeEventListener("bindHelp:toggle", handler);
  }, []);

  const updateUiState = (updates) => {
    setUiState((prev) => ({ ...prev, ...updates }));
  };

  // --- NAVEGACIÓN Y FUNCIONES ---
  const handleValidarCuit = async () => {
    if (await trigger("cuit")) setPasoActual(2);
  };

  const handleVolver = () => {
    setPasoActual((prev) => (prev === 7 ? 1 : prev - 1));
  };

  const handleResetFlujoCompleto = () => {
    clearStorage();
    metodosFormulario.reset({
      moneda: "Pesos",
      tipoProducto: "pagare",
      tipoCalculo: "por_monto_pagare",
      monto: "",
      plazo: "",
      fechaPago: "",
      cuit: "",
      direccion: "",
      provincia: "",
      localidad: "",
      celular: "",
      representantes: [],
      emailFacturacion: "",
    });
    setSocios([]);
    updateUiState({
      faseSocio: "lista",
      mostrarResultados: false,
      codigoSms: "",
    });
    setPasoActual(1);
  };

  const handleReiniciarAlta = () => setIsModalReiniciarAbierto(true);
  const confirmarReinicioAlta = () => {
    handleResetFlujoCompleto();
    setIsModalReiniciarAbierto(false);
  };

  const abrirModalSms = async () => {
    if (await trigger("celular")) updateUiState({ mostrarModal: true });
  };
  const confirmarSms = () => updateUiState({ mostrarModal: false });

  const handleContinuarPaso2 = async () => {
    if (await trigger(["direccion", "provincia", "localidad", "celular"]))
      setPasoActual(3);
  };

  const onSubmitFinal = () => setPasoActual(7);

  // Paso 3
  const handleCalcularSimulador = async () => {
    if (await trigger(["monto", "tipoProducto"])) {
      updateUiState({ mostrarResultados: true });
    }
  };

  const handleContinuarSimulador = async () => {
    if (await trigger(["monto", "tipoProducto"])) {
      setPasoActual(4);
      updateUiState({
        faseSocio: socios.length === 0 ? "ingresar_cuit" : "lista",
      });
    }
  };

  // Paso 4
  const iniciarCargaSocio = () => {
    updateUiState({
      tempSocioCuit: "",
      tempSocioParticipacion: "",
      faseSocio: "ingresar_cuit",
    });
  };
  const validarCuitSocio = () => {
    updateUiState({
      tempSocioNombre: "SEOANE SUAREZ MARINA",
      faseSocio: "completar_datos",
    });
  };
  const guardarSocio = () => {
    if (!uiState.tempSocioParticipacion) return;
    setSocios([
      ...socios,
      {
        cuit: uiState.tempSocioCuit,
        nombre: uiState.tempSocioNombre,
        participacion: uiState.tempSocioParticipacion,
      },
    ]);
    updateUiState({ faseSocio: "lista" });
  };
  const editarSocio = (index) => {
    const socio = socios[index];
    updateUiState({
      tempSocioCuit: socio.cuit,
      tempSocioNombre: socio.nombre,
      tempSocioParticipacion: socio.participacion,
      faseSocio: "completar_datos",
    });
    setSocios(socios.filter((_, i) => i !== index));
  };
  const eliminarSocio = (index) => {
    const nuevos = socios.filter((_, i) => i !== index);
    setSocios(nuevos);
    if (nuevos.length === 0) updateUiState({ faseSocio: "ingresar_cuit" });
  };
  const continuarAlProximoPaso = () => setPasoActual(5);

  // Paso 5
  const toggleDoc = (seccion) => {
    updateUiState({
      docExpandido: uiState.docExpandido === seccion ? "" : seccion,
    });
  };
  const avanzarAlExito = async () => {
    const okFacturacion = await trigger("emailFacturacion");
    const representantes = metodosFormulario.getValues("representantes");
    if (okFacturacion && representantes?.length > 0) {
      handleSubmit(onSubmitFinal)();
    }
  };

  const obtenerTextosCabecera = () => {
    switch (pasoActual) {
      case 1:
        return {
          t: "Validación de Empresa",
          s: "Ingresá el CUIT para comenzar.",
        };
      case 2:
        return {
          t: "Datos de la Operación",
          s: "Completá la información del pagaré.",
        };
      case 3:
        return {
          t: "Declaración de Socios",
          s: "Validá la composición societaria.",
        };
      case 4:
        return {
          t: "Declaración de Socios",
          s: "Ajustá los porcentajes de participación.",
        };
      case 5:
        return {
          t: "Documentación Requerida",
          s: "Adjuntá los respaldos de la operación.",
        };
      case 6:
        return { t: "Confirmación", s: "Revisá los datos antes de finalizar." };
      default:
        return { t: "Solicitud de Pagaré", s: "" };
    }
  };

  const showHeaderYStepper = pasoActual < 7;
  const hitoVisual = (() => {
    if (pasoActual <= 2) return 1;
    if (pasoActual === 3 || pasoActual === 4) return 2;
    if (pasoActual === 5) return 3;
    if (pasoActual === 6) return 4;
    return 1;
  })();
  return (
    <div className={styles.prestamosPage}>
      <div className={styles.formMainContainer}>
        <div className={styles.contentWrapper}>
          <div className={styles.contenedorPrincipal}>
            <div className={styles.columnaFormulario}>
              {showHeaderYStepper && (
                <BarraProgreso
                  hitos={["EMPRESA", "SOCIOS", "DOCUMENTOS", "CONFIRMACIÓN"]}
                  hitoActual={hitoVisual}
                  onVolver={
                    pasoActual > 1
                      ? () => {
                          handleVolver();
                          if (pasoActual === 3)
                            updateUiState({ mostrarResultados: false });
                        }
                      : null
                  }
                  onVolverInicio={
                    pasoActual === 1 ? () => navigate("/inicio") : null
                  }
                  onReiniciar={handleReiniciarAlta}
                />
              )}

              {pasoActual < 7 && (
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
                    onSubmit={(e) => e.preventDefault()}
                  >
                    <div key={pasoActual} className="animacion-paso">
                      <PagarePasos
                        pasoActual={pasoActual}
                        uiState={uiState}
                        updateUiState={updateUiState}
                        socios={socios}
                        handleValidarCuit={handleValidarCuit}
                        handleVolver={() => setPasoActual((prev) => prev - 1)}
                        abrirModalSms={abrirModalSms}
                        handleContinuarPaso2={handleContinuarPaso2}
                        handleCalcularSimulador={handleCalcularSimulador}
                        handleContinuarSimulador={handleContinuarSimulador}
                        iniciarCargaSocio={iniciarCargaSocio}
                        validarCuitSocio={validarCuitSocio}
                        guardarSocio={guardarSocio}
                        editarSocio={editarSocio}
                        eliminarSocio={eliminarSocio}
                        continuarAlProximoPaso={continuarAlProximoPaso}
                        toggleDoc={toggleDoc}
                        avanzarAlExito={avanzarAlExito}
                        handleResetFlujoCompleto={handleResetFlujoCompleto}
                      />
                    </div>
                  </form>
                </FormProvider>
              </div>
            </div>

            {pasoActual < 7 && (
              <HelpDrawer
                isOpen={isHelpOpen}
                onClose={() => setIsHelpOpen(false)}
                contexto="pagare"
                pasoActual={pasoActual}
              />
            )}
          </div>
        </div>
      </div>

      <ModalConfirmacionBorrador
        isOpen={isModalReiniciarAbierto}
        onClose={() => setIsModalReiniciarAbierto(false)}
        onConfirm={confirmarReinicioAlta}
        onContinueBorrador={() => setIsModalReiniciarAbierto(false)}
      />
      <ModalSms
        isOpen={uiState.mostrarModal}
        onClose={() => updateUiState({ mostrarModal: false })}
        codigoSms={uiState.codigoSms}
        setCodigoSms={(cod) => updateUiState({ codigoSms: cod })}
        onConfirmar={confirmarSms}
      />
    </div>
  );
}
