import React, { useState } from "react";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate } from "react-router-dom";
import { chequesSchema } from "../schemas/chequesSchema";
import {
  Paso1Cuit,
  Paso2Datos,
  Paso3Simulador,
  Paso4Socios,
  Paso5Documentacion,
  Paso6Bolsa,
  Paso7Exito,
  PanelDudas,
} from "../components/features";
import { ModalSms, BarraProgreso, BotonVolver, Scroll } from "../components/ui";
import styles from "./Cheques.module.css";

export default function Cheques() {
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
    resolver: zodResolver(chequesSchema),
    mode: "onChange",
    defaultValues: {
      moneda: "Pesos",
      sociedadBolsa: "",
      cuit: "",
      direccion: "",
      provincia: "",
      localidad: "",
      celular: "",
    },
  });

  const { handleSubmit, trigger, watch, setValue } = metodosFormulario;
  const bolsaSeleccionada = watch("sociedadBolsa", "");

  // --- NAVEGACIÓN Y FUNCIONES ---
  const handleValidarCuit = async () => {
    if (await trigger("cuit")) setPasoActual(2);
  };
  
  const handleVolver = () => {
    if (pasoActual === 7) setPasoActual(1);
    else setPasoActual(pasoActual - 1);
  };

  const handleResetFlujoCompleto = () => {
    setSocios([]);
    setFaseSocio("lista");
    setFaseApoderado("ingresar");
    setApoNombre("");
    setApoRol("Representante Legal");
    setMostrarResultados(false);
    setCodigoSms("");
    setPasoActual(1);
  };

  const abrirModalSms = async () => {
    if (await trigger("celular")) setMostrarModal(true);
  };
  const confirmarSms = () => setMostrarModal(false);
  
  const handleContinuarPaso2 = async () => {
    if (await trigger(["direccion", "provincia", "localidad", "celular"]))
      setPasoActual(3);
  };

  const onSubmitFinal = (dataFormulario) => {
    const payloadFinal = {
      ...dataFormulario,
      sociosBasicos: socios,
    };
    
    setPasoActual(7);
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
  const editarSocio = (index) => {
    const socioAEditar = socios[index];
    setTempSocioCuit(socioAEditar.cuit);
    setTempSocioNombre(socioAEditar.nombre);
    setTempSocioParticipacion(socioAEditar.participacion);

    const nuevos = socios.filter((_, i) => i !== index);
    setSocios(nuevos);

    setFaseSocio("completar_datos");
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
  const avanzarPaso6 = async () => {
    if (await trigger("emailFacturacion")) setPasoActual(6);
  };

  // Paso 6
  const avanzarConBolsa = async () => {
    if (
      (await trigger(["sociedadBolsa", "numeroCuentaBolsa"])) &&
      bolsaSeleccionada !== ""
    ) {
      handleSubmit(onSubmitFinal)();
    }
  };

  const avanzarSinBolsa = () => {
    setValue("sociedadBolsa", "");
    setValue("numeroCuentaBolsa", "");
    handleSubmit(onSubmitFinal)();
  };

  return (
    <div className={styles.chequesPage}>
      <div className={styles.formMainContainer}>
        <div className={styles.contentWrapper}>
          <div className={styles.navegacionTop}>
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
          </div>

          <div className={styles.contenedorPrincipal}>
            <div className={styles.columnaFormulario}>
              <div className={styles.seccionFormulario}>

                {pasoActual === 1 && (
                  <div className={styles.bienvenidaHeader}>
                    <h1 className={styles.tituloBienvenida}>Solicitud de Línea de Cheques</h1>
                    <p className={styles.subtituloBienvenida}>
                      Comenzá validando el CUIT de tu empresa para operar en el mercado de capitales.
                    </p>
                  </div>
                )}

                {pasoActual >= 2 && pasoActual < 7 &&
                  (() => {
                    let hitoVisual = 1;
                    if (pasoActual > 3 && pasoActual <= 5) hitoVisual = 2;
                    if (pasoActual === 6) hitoVisual = 3;

                    return (
                      <BarraProgreso
                        hitos={["Datos Básicos", "Documentación", "Confirmación"]}
                        hitoActual={hitoVisual}
                      />
                    );
                  })()}

                {/* FORMULARIO */}
                <FormProvider {...metodosFormulario}>
                  <form className={styles.formContent}>
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
                          onCancelar={() => setMostrarResultados(false)}
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
                          editarSocio={editarSocio} // <--- Prop agregada!
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
                          avanzarPaso6={avanzarPaso6}
                        />
                      )}

                      {pasoActual === 6 && (
                        <Paso6Bolsa
                          avanzarConBolsa={avanzarConBolsa}
                          avanzarSinBolsa={avanzarSinBolsa}
                        />
                      )}

                      {pasoActual === 7 && (
                        <Paso7Exito onVolverInicio={handleResetFlujoCompleto} />
                      )}
                    </div>
                  </form>
                </FormProvider>
              </div>
            </div>

            {pasoActual < 7 && <PanelDudas pasoActual={pasoActual} />}
          </div>
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