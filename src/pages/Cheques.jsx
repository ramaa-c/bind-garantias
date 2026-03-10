import React, { useState } from "react";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { chequesSchema } from "../schemas/chequesSchema";
import "../styles/cheques.css";
import Paso1Cuit from "../components/form-steps/Paso1Cuit";
import Paso2Datos from "../components/form-steps/Paso2Datos";
import Paso3Simulador from "../components/form-steps/Paso3Simulador";
import Paso4Socios from "../components/form-steps/Paso4Socios";
import Paso5Documentacion from "../components/form-steps/Paso5Documentacion";
import Paso6Bolsa from "../components/form-steps/Paso6Bolsa";
import Paso7Exito from "../components/form-steps/Paso7Exito";
import ModalSms from "../components/ModalSms";
import PanelDudas from "../components/form-steps/PanelDudas";

export default function Cheques() {
  const [pasoActual, setPasoActual] = useState(1);
  const [mostrarModal, setMostrarModal] = useState(false);
  const [codigoSms, setCodigoSms] = useState("");
  const [mostrarResultados, setMostrarResultados] = useState(false);

  const [socios, setSocios] = useState([]);
  const [faseSocio, setFaseSocio] = useState("lista");
  const [tempSocioCuit, setTempSocioCuit] = useState("");
  const [tempSocioNombre, setTempSocioNombre] = useState("");
  const [tempSocioParticipacion, setTempSocioParticipacion] = useState("");

  const [docExpandido, setDocExpandido] = useState("estatuto");
  const [faseApoderado, setFaseApoderado] = useState("ingresar");
  const [apoNombre, setApoNombre] = useState("");
  const [apoRol, setApoRol] = useState("Representante Legal");

  const metodosFormulario = useForm({
    resolver: zodResolver(chequesSchema),
    mode: "onChange",
    defaultValues: { moneda: "Pesos", sociedadBolsa: "" },
  });

  const { handleSubmit, trigger, watch, setValue } = metodosFormulario;
  const bolsaSeleccionada = watch("sociedadBolsa", "");

  // --- NAVEGACIÓN Y FUNCIONES ---
  const handleValidarCuit = async () => { if (await trigger("cuit")) setPasoActual(2); };
  const handleVolver = () => { if (pasoActual === 7) setPasoActual(1); else setPasoActual(pasoActual - 1); };
  const abrirModalSms = async () => { if (await trigger("celular")) setMostrarModal(true); };
  const confirmarSms = () => setMostrarModal(false);
  const handleContinuarPaso2 = async () => { if (await trigger(["direccion", "provincia", "localidad", "celular"])) setPasoActual(3); };
  const onSubmitFinal = (data) => { console.log("Datos finales listos:", data); };

  // Paso 3
  const handleCalcularSimulador = () => { trigger(["monto", "tipoProducto", "tipoCalculo", "plazo"]).then(v => v && setMostrarResultados(true)); };
  const handleContinuarSimulador = () => { setPasoActual(4); setFaseSocio(socios.length === 0 ? "ingresar_cuit" : "lista"); };

  // Paso 4
  const iniciarCargaSocio = () => { setTempSocioCuit(""); setTempSocioParticipacion(""); setFaseSocio("ingresar_cuit"); };
  const validarCuitSocio = () => { setTempSocioNombre("SEOANE SUAREZ MARINA"); setFaseSocio("completar_datos"); };
  const guardarSocio = () => {
    if (!tempSocioParticipacion) return;
    setSocios([...socios, { cuit: tempSocioCuit, nombre: tempSocioNombre, participacion: tempSocioParticipacion }]);
    setFaseSocio("lista");
  };
  const eliminarSocio = (index) => {
    const nuevos = socios.filter((_, i) => i !== index);
    setSocios(nuevos);
    if (nuevos.length === 0) setFaseSocio("ingresar_cuit");
  };
  const continuarAlProximoPaso = () => setPasoActual(5);

  // Paso 5
  const toggleDoc = (seccion) => { setDocExpandido((prev) => (prev === seccion ? "" : seccion)); };
  const validarCuitApoderado = async () => { if (await trigger("apoCuit")) { setApoNombre("GOMEZ PEREZ JUAN"); setFaseApoderado("completar"); } };
  const guardarApoderado = async () => { if (await trigger(["apoEmail", "apoCelular"])) setFaseApoderado("guardado"); };
  const avanzarPaso6 = async () => { if (await trigger("emailFacturacion")) setPasoActual(6); };

  // Paso 6
  const avanzarConBolsa = async () => { if (await trigger(["sociedadBolsa", "numeroCuentaBolsa"]) && bolsaSeleccionada !== "") setPasoActual(7); };
  const avanzarSinBolsa = () => { setValue("sociedadBolsa", ""); setValue("numeroCuentaBolsa", ""); setPasoActual(7); };

  return (
    <div className="cheques-page">
      <div className="form-main-container">
        <div className="contenedor-principal">
          
          {/* LADO IZQUIERDO: FORMULARIOS */}
          <div className="seccion-formulario">
            
            {/* BOTÓN VOLVER */}
            {pasoActual >= 3 && pasoActual <= 6 && (
              <div className="back-button-container">
                <button type="button" onClick={() => { handleVolver(); if (pasoActual === 3) setMostrarResultados(false); }} className="btn-back">
                  ← Volver a la lista
                </button>
              </div>
            )}

            {/* TÍTULO Y PROGRESO */}
            {pasoActual < 4 && (
              <>
                <h1 className="cheques-title">
                  {pasoActual === 3 ? "Ya podés seleccionar el monto y tipo de financiación que estás necesitando." : "Completá los siguientes datos básicos"}
                </h1>
                <div className="progress-container">
                  <p className="progress-text">Avance de solicitud</p>
                  <div className="progress-track">
                    <div className="progress-fill" style={{ width: pasoActual === 1 ? "10%" : pasoActual === 2 ? "40%" : "80%" }}></div>
                  </div>
                </div>
              </>
            )}

            {/* FORMULARIO */}
            <FormProvider {...metodosFormulario}>
              <form className="form-content" onSubmit={handleSubmit(onSubmitFinal)}>
                
                {pasoActual === 1 && <Paso1Cuit onValidar={handleValidarCuit} />}
                
                {pasoActual === 2 && <Paso2Datos onVolver={handleVolver} onAbrirModalSms={abrirModalSms} onContinuar={handleContinuarPaso2} />}

                {pasoActual === 3 && <Paso3Simulador mostrarResultados={mostrarResultados} onCalcular={handleCalcularSimulador} onContinuar={handleContinuarSimulador} />}

                {pasoActual === 4 && (
                  <Paso4Socios 
                    faseSocio={faseSocio} setFaseSocio={setFaseSocio} tempSocioCuit={tempSocioCuit} setTempSocioCuit={setTempSocioCuit} tempSocioNombre={tempSocioNombre} tempSocioParticipacion={tempSocioParticipacion} setTempSocioParticipacion={setTempSocioParticipacion} socios={socios} iniciarCargaSocio={iniciarCargaSocio} validarCuitSocio={validarCuitSocio} guardarSocio={guardarSocio} eliminarSocio={eliminarSocio} continuarAlProximoPaso={continuarAlProximoPaso}
                  />
                )}

                {pasoActual === 5 && (
                  <Paso5Documentacion 
                    docExpandido={docExpandido} toggleDoc={toggleDoc} socios={socios} onVolverASocios={() => setPasoActual(4)} faseApoderado={faseApoderado} setFaseApoderado={setFaseApoderado} apoNombre={apoNombre} apoRol={apoRol} setApoRol={setApoRol} validarCuitApoderado={validarCuitApoderado} guardarApoderado={guardarApoderado} avanzarPaso6={avanzarPaso6}
                  />
                )}

                {pasoActual === 6 && <Paso6Bolsa avanzarConBolsa={avanzarConBolsa} avanzarSinBolsa={avanzarSinBolsa} />}

                {pasoActual === 7 && <Paso7Exito onVolverInicio={() => setPasoActual(1)} />}

              </form>
            </FormProvider>
          </div>

          {/* LADO DERECHO: PANEL DE DUDAS */}
          <PanelDudas pasoActual={pasoActual} />

        </div>
      </div>

      {/* MODAL DE SMS */}
      <ModalSms 
        isOpen={mostrarModal}
        onClose={() => setMostrarModal(false)}
        codigoSms={codigoSms}
        setCodigoSms={setCodigoSms}
        onConfirmar={confirmarSms}
      />
    </div>
  );
}