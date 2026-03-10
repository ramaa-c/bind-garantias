import React, { useState } from "react";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  FiTrash2,
  FiEdit,
  FiCheckCircle,
  FiAlertCircle,
  FiXCircle,
  FiHome,
} from "react-icons/fi";
import "../styles/cheques.css";

// --- IMPORTAMOS TODOS LOS PASOS MODULARIZADOS ---
import Paso1Cuit from "../components/form-steps/Paso1Cuit";
import Paso2Datos from "../components/form-steps/Paso2Datos";
import Paso3Simulador from "../components/form-steps/Paso3Simulador";
import Paso4Socios from "../components/form-steps/Paso4Socios";
import Paso5Documentacion from "../components/form-steps/Paso5Documentacion";
import Paso6Bolsa from "../components/form-steps/Paso6Bolsa";
import Paso7Exito from "../components/form-steps/Paso7Exito";

// --- ESQUEMA ZOD ---
const chequesSchema = z.object({
  cuit: z.string().regex(/^\d{11}$/, { message: "Debe contener 11 números sin guiones" }),
  direccion: z.string().min(3, { message: "La dirección es obligatoria" }),
  provincia: z.string().min(3, { message: "La provincia es obligatoria" }),
  localidad: z.string().min(3, { message: "La localidad es obligatoria" }),
  celular: z.string().regex(/^\d{10}$/, { message: "Debe contener 10 números" }),
  moneda: z.string().min(1, { message: "Requerido" }),
  tipoProducto: z.string().min(1, { message: "Requerido" }),
  tipoCalculo: z.string().min(1, { message: "Requerido" }),
  monto: z.coerce.number().min(1000, { message: "El monto mínimo es $1000" }),
  plazo: z.string().min(1, { message: "Requerido" }),  
  apoCuit: z.string().regex(/^\d{11}$/, { message: "Debe contener 11 números" }).optional().or(z.literal("")),
  apoEmail: z.string().email({ message: "Email inválido" }).optional().or(z.literal("")),
  apoCelular: z.string().regex(/^\d{10}$/, { message: "Debe contener 10 números" }).optional().or(z.literal("")),
  emailFacturacion: z.string().email({ message: "Email inválido" }).min(1, { message: "Requerido" }),
  sociedadBolsa: z.string().optional(),
  numeroCuentaBolsa: z.string().optional(),
}).superRefine((data, ctx) => {
  if (data.sociedadBolsa && data.sociedadBolsa !== "" && !data.numeroCuentaBolsa) {
    ctx.addIssue({
      path: ["numeroCuentaBolsa"],
      message: "El número de cuenta es obligatorio",
      code: z.ZodIssueCode.custom,
    });
  }
});

export default function Cheques() {
  const [pasoActual, setPasoActual] = useState(1);
  const [mostrarModal, setMostrarModal] = useState(false);
  const [codigoSms, setCodigoSms] = useState("");
  const [mostrarResultados, setMostrarResultados] = useState(false);

  // --- ESTADOS DE PASOS ---
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

  // Funciones Paso 3
  const handleCalcularSimulador = () => { trigger(["monto", "tipoProducto", "tipoCalculo", "plazo"]).then(v => v && setMostrarResultados(true)); };
  const handleContinuarSimulador = () => { setPasoActual(4); setFaseSocio(socios.length === 0 ? "ingresar_cuit" : "lista"); };

  // Funciones Paso 4
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

  // Funciones Paso 5
  const toggleDoc = (seccion) => { setDocExpandido((prev) => (prev === seccion ? "" : seccion)); };
  const validarCuitApoderado = async () => { if (await trigger("apoCuit")) { setApoNombre("GOMEZ PEREZ JUAN"); setFaseApoderado("completar"); } };
  const guardarApoderado = async () => { if (await trigger(["apoEmail", "apoCelular"])) setFaseApoderado("guardado"); };
  const avanzarPaso6 = async () => { if (await trigger("emailFacturacion")) setPasoActual(6); };

  // Funciones Paso 6
  const avanzarConBolsa = async () => { if (await trigger(["sociedadBolsa", "numeroCuentaBolsa"]) && bolsaSeleccionada !== "") setPasoActual(7); };
  const avanzarSinBolsa = () => { setValue("sociedadBolsa", ""); setValue("numeroCuentaBolsa", ""); setPasoActual(7); };

  return (
    <div className="cheques-page">

      {/* BANNER DINÁMICO */}
      <section className="cheques-banner">
        {pasoActual === 7 ? (
          <div className="banner-content-approved">
            <h1 className="banner-title banner-title-xl">¡Felicitaciones!<br />Tu solicitud está pre-aprobada</h1>
            <p className="banner-subtitle banner-subtitle-highlight">Te contamos los pasos a seguir</p>
          </div>
        ) : pasoActual >= 4 ? (
          <div className="banner-content-approved">
            <h1 className="banner-title">
              {pasoActual === 4 ? "¡Vamos bien. Tu solicitud está pre-aprobada!" : pasoActual === 5 ? "Completá el legajo digital de la empresa para continuar" : "¿Tiene cuenta en alguna de estas sociedades de bolsa?"}
            </h1>
            {pasoActual === 4 && (<p className="banner-subtitle">Completá información de tus socios para continuar</p>)}
          </div>
        ) : (
          <h2>[ Espacio para banner ]</h2>
        )}
      </section>

      <div className="form-main-container">
        <div className="contenedor-principal">
          <div className="seccion-formulario">
            
            {/* BOTÓN VOLVER GENERAL */}
            {pasoActual >= 3 && pasoActual <= 6 && (
              <div className="back-button-container">
                <button type="button" onClick={() => { handleVolver(); if (pasoActual === 3) setMostrarResultados(false); }} className="btn-back">← Volver a la lista</button>
              </div>
            )}

            {/* TÍTULO Y PROGRESO */}
            {pasoActual < 4 && (
              <>
                <h1 className="cheques-title">{pasoActual === 3 ? "Ya podés seleccionar el monto y tipo de financiación que estás necesitando." : "Completá los siguientes datos básicos"}</h1>
                <div className="progress-container">
                  <p className="progress-text">Avance de solicitud</p>
                  <div className="progress-track"><div className="progress-fill" style={{ width: pasoActual === 1 ? "10%" : pasoActual === 2 ? "40%" : "80%" }}></div></div>
                </div>
              </>
            )}

            {/* FORMULARIO MODULARIZADO */}
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

          {/* PANEL DERECHO */}
          {pasoActual !== 7 && (
            <div className="panel-dudas">
              <h3 className="panel-dudas-title">Dudas frecuentes</h3>
              <ul className="faq-list">
                {pasoActual === 4 || pasoActual === 5 ? (
                  <>
                    <li className="faq-item">¿Por qué debo declarar a mis socios?</li>
                    <li className="faq-item">¿Qué pasa si un socio es extranjero?</li>
                  </>
                ) : (
                  <>
                    <li className="faq-item">¿Qué es el CUIT?</li>
                    <li className="faq-item">¿Cómo verifico mi CUIT?</li>
                  </>
                )}
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* MODAL SMS */}
      {mostrarModal && (
        <div className="modal-overlay">
          <div className="modal-box">
            <div className="modal-header">
              <h3 className="modal-title">Ingresá el código de verificación</h3>
              <button onClick={() => setMostrarModal(false)} className="modal-close">✖</button>
            </div>
            <div className="modal-body">
              <p className="modal-text">Te enviamos un sms con un código de verificación para que valides tu celular.</p>
              <label className="modal-label">Código verificación *</label>
              <input type="text" value={codigoSms} onChange={(e) => setCodigoSms(e.target.value)} className="modal-input" />
              <div className="modal-footer">
                <button onClick={() => setMostrarModal(false)} className="btn-cancel">CANCELAR</button>
                <button onClick={confirmarSms} className="btn-action btn-modal-confirm">ACEPTAR</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}