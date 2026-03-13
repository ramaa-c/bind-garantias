import React, { useState } from "react";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate } from "react-router-dom";
import { prestamosSchema } from "../schemas/prestamosSchema";
import { ModalSms, BarraProgreso, BotonVolver } from "../components/ui";
import {
  Paso1Cuit,
  Paso2Datos,
  Paso3Simulador,
  Paso4Socios,
  Paso5Documentacion,
  Paso7Exito,
  PanelDudas,
} from "../components/features";
import styles from "./Prestamos.module.css";

export default function Prestamos() {
  const navigate = useNavigate();
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
    resolver: zodResolver(prestamosSchema),
    mode: "onChange",
    defaultValues: { moneda: "Pesos", tipoProducto: "prestamo" },
  });

  const { handleSubmit, trigger } = metodosFormulario;

  // --- NAVEGACIÓN Y FUNCIONES ---
  const handleValidarCuit = async () => {
    if (await trigger("cuit")) setPasoActual(2);
  };

  const handleVolver = () => {
    if (pasoActual === 7) setPasoActual(1);
    else setPasoActual(pasoActual - 1);
  };

  const abrirModalSms = async () => {
    if (await trigger("celular")) setMostrarModal(true);
  };
  const confirmarSms = () => setMostrarModal(false);
  const handleContinuarPaso2 = async () => {
    if (await trigger(["direccion", "provincia", "localidad", "celular"]))
      setPasoActual(3);
  };
  const onSubmitFinal = (data) => {
    console.log("Datos finales Préstamo listos:", data);
  };

  // Paso 3
  const handleCalcularSimulador = () => {
    trigger(["monto", "tipoProducto", "tipoCalculo", "plazo"]).then(
      (v) => v && setMostrarResultados(true),
    );
  };
  const handleContinuarSimulador = () => {
    setPasoActual(4);
    setFaseSocio(socios.length === 0 ? "ingresar_cuit" : "lista");
  };

  // Paso 4
  const iniciarCargaSocio = () => {
    setTempSocioCuit("");
    setTempSocioParticipacion("");
    setFaseSocio("ingresar_cuit");
  };
  const validarCuitSocio = () => {
    setTempSocioNombre("SEOANE SUAREZ MARINA");
    setFaseSocio("completar_datos");
  };
  const guardarSocio = () => {
    if (!tempSocioParticipacion) return;
    setSocios([
      ...socios,
      {
        cuit: tempSocioCuit,
        nombre: tempSocioNombre,
        participacion: tempSocioParticipacion,
      },
    ]);
    setFaseSocio("lista");
  };
  const eliminarSocio = (index) => {
    const nuevos = socios.filter((_, i) => i !== index);
    setSocios(nuevos);
    if (nuevos.length === 0) setFaseSocio("ingresar_cuit");
  };
  const continuarAlProximoPaso = () => setPasoActual(5);

  // Paso 5
  const toggleDoc = (seccion) => {
    setDocExpandido((prev) => (prev === seccion ? "" : seccion));
  };
  const validarCuitApoderado = async () => {
    if (await trigger("apoCuit")) {
      setApoNombre("GOMEZ PEREZ JUAN");
      setFaseApoderado("completar");
    }
  };
  const guardarApoderado = async () => {
    if (await trigger(["apoEmail", "apoCelular"])) setFaseApoderado("guardado");
  };

  // Paso 7
  const avanzarAlExito = async () => {
    if (await trigger("emailFacturacion")) setPasoActual(7);
  };

  return (
    <div className={styles.prestamosPage}>
      <div className={styles.formMainContainer}>
        <div className={styles.contenedorPrincipal}>
          <div className={styles.columnaFormulario}>
            {pasoActual > 1 && pasoActual < 7 && (
              <BotonVolver
                onClick={() => {
                  handleVolver();
                  if (pasoActual === 3) setMostrarResultados(false);
                }}
              />
            )}

            {pasoActual === 1 && (
              <BotonVolver
                onClick={() => navigate("/inicio")}
                texto="Volver a la lista"
              />
            )}

            {/* TARJETA PRINCIPAL FORMULARIO */}
            <div className={styles.seccionFormulario}>
              {pasoActual < 4 && (
                <BarraProgreso currentStep={pasoActual} totalSteps={3} />
              )}

              {/* FORMULARIO */}
              <FormProvider {...metodosFormulario}>
                <form
                  className={styles.formContent}
                  onSubmit={handleSubmit(onSubmitFinal)}
                >
                  <div key={pasoActual} className="animacion-paso">
                    {pasoActual === 1 && (
                      <Paso1Cuit onValidar={handleValidarCuit} />
                    )}

                    {pasoActual === 2 && (
                      <Paso2Datos
                        onVolver={handleVolver}
                        onAbrirModalSms={abrirModalSms}
                        onContinuar={handleContinuarPaso2}
                      />
                    )}

                    {pasoActual === 3 && (
                      <Paso3Simulador
                        mostrarResultados={mostrarResultados}
                        onCalcular={handleCalcularSimulador}
                        onContinuar={handleContinuarSimulador}
                      />
                    )}

                    {pasoActual === 4 && (
                      <Paso4Socios
                        faseSocio={faseSocio}
                        setFaseSocio={setFaseSocio}
                        tempSocioCuit={tempSocioCuit}
                        setTempSocioCuit={setTempSocioCuit}
                        tempSocioNombre={tempSocioNombre}
                        tempSocioParticipacion={tempSocioParticipacion}
                        setTempSocioParticipacion={setTempSocioParticipacion}
                        socios={socios}
                        iniciarCargaSocio={iniciarCargaSocio}
                        validarCuitSocio={validarCuitSocio}
                        guardarSocio={guardarSocio}
                        eliminarSocio={eliminarSocio}
                        continuarAlProximoPaso={continuarAlProximoPaso}
                      />
                    )}

                    {pasoActual === 5 && (
                      <Paso5Documentacion
                        docExpandido={docExpandido}
                        toggleDoc={toggleDoc}
                        socios={socios}
                        onVolverASocios={() => setPasoActual(4)}
                        faseApoderado={faseApoderado}
                        setFaseApoderado={setFaseApoderado}
                        apoNombre={apoNombre}
                        apoRol={apoRol}
                        setApoRol={setApoRol}
                        validarCuitApoderado={validarCuitApoderado}
                        guardarApoderado={guardarApoderado}
                        avanzarPaso6={avanzarAlExito}
                      />
                    )}

                    {pasoActual === 7 && (
                      <Paso7Exito onVolverInicio={() => setPasoActual(1)} />
                    )}
                  </div>
                </form>
              </FormProvider>
            </div>
          </div>

          {/* LADO DERECHO: PANEL DE DUDAS */}
          <PanelDudas pasoActual={pasoActual} />
        </div>
      </div>

      {/* MODAL SMS */}
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
