import React, { useState } from "react";
import { useForm, FormProvider } from "react-hook-form";
import { useFormPersist, getPersistedFormData } from "../hooks/useFormPersist";
import { zodResolver } from "@hookform/resolvers/zod";
import { FiRotateCcw } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import { prestamosSchema } from "../schemas/prestamosSchema";
import { ModalSms, BarraProgreso, BotonVolver } from "../components/ui";
import { PanelDudas, ModalConfirmacionBorrador } from "../components/features";
import styles from "./Prestamos.module.css";
import { PrestamosPasos } from "./PrestamosPasos";

const STORAGE_KEY = "draft_prestamos";

export default function Prestamos() {
  const navigate = useNavigate();

  const metodosFormulario = useForm({
    resolver: zodResolver(prestamosSchema),
    mode: "onChange",
    shouldUnregister: false,
    defaultValues: getPersistedFormData(STORAGE_KEY, {
      moneda: "Pesos",
      tipoProducto: "prestamo",
      tipoCalculo: "",
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
      tipoProducto: "prestamo",
      tipoCalculo: "",
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

  const handleReiniciarAlta = () => {
    setIsModalReiniciarAbierto(true);
  };

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

  const onSubmitFinal = () => {
    setPasoActual(7);
  };

  // Paso 3
  const handleCalcularSimulador = async () => {
    if (await trigger(["monto", "tipoProducto", "plazo"])) {
      updateUiState({ mostrarResultados: true });
    }
  };

  const handleContinuarSimulador = async () => {
    if (await trigger(["monto", "tipoProducto", "plazo"])) {
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
    const socioAEditar = socios[index];
    updateUiState({
      tempSocioCuit: socioAEditar.cuit,
      tempSocioNombre: socioAEditar.nombre,
      tempSocioParticipacion: socioAEditar.participacion,
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

  return (
    <div className={styles.prestamosPage}>
      <div className={styles.formMainContainer}>
        <div className={styles.contentWrapper}>
          <div className={styles.navegacionTop}>
            <div className={styles.botonesNavegacion}>
              {pasoActual > 1 && pasoActual < 7 && (
                <BotonVolver
                  onClick={() => {
                    handleVolver();
                    if (pasoActual === 3)
                      updateUiState({ mostrarResultados: false });
                  }}
                />
              )}
              {pasoActual === 1 && (
                <BotonVolver
                  onClick={() => navigate("/inicio")}
                  texto="Volver a la lista"
                />
              )}
              {pasoActual < 7 && (
                <BotonVolver
                  icon={FiRotateCcw}
                  onClick={handleReiniciarAlta}
                  texto="Reiniciar alta"
                />
              )}
            </div>
            <div></div>
          </div>

          <div className={styles.contenedorPrincipal}>
            <div className={styles.columnaFormulario}>
              <div className={styles.seccionFormulario}>
                {pasoActual === 1 && (
                  <div className={styles.bienvenidaHeader}>
                    <h1 className={styles.tituloBienvenida}>
                      Solicitud de Línea de Préstamo
                    </h1>
                    <p className={styles.subtituloBienvenida}>
                      Obtené financiación para tu empresa de forma ágil y 100%
                      online.
                    </p>
                  </div>
                )}

                {pasoActual >= 2 &&
                  pasoActual < 7 &&
                  (() => {
                    let hitoVisual = 1;
                    if (pasoActual === 3) hitoVisual = 2;
                    if (pasoActual === 4) hitoVisual = 3;
                    if (pasoActual === 5) hitoVisual = 4;
                    return (
                      <BarraProgreso
                        hitos={["Empresa", "Operación", "Socios", "Documentos"]}
                        hitoActual={hitoVisual}
                      />
                    );
                  })()}

                <FormProvider {...metodosFormulario}>
                  <form className={styles.formContent}>
                    <div key={pasoActual} className="animacion-paso">
                      <PrestamosPasos
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
            {pasoActual < 7 && <PanelDudas pasoActual={pasoActual} />}
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
