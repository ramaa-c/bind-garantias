import React, { useState } from "react";
import { useForm, FormProvider } from "react-hook-form";
import { useFormPersist, getPersistedFormData } from "../hooks/useFormPersist";
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

  const [mostrarModal, setMostrarModal] = useState(false);
  const [codigoSms, setCodigoSms] = useState("");
  const [mostrarResultados, setMostrarResultados] = useState(false);

  const [faseSocio, setFaseSocio] = useState("lista");
  const [tempSocioCuit, setTempSocioCuit] = useState("");
  const [tempSocioNombre, setTempSocioNombre] = useState("");
  const [tempSocioParticipacion, setTempSocioParticipacion] = useState("");

  const [docExpandido, setDocExpandido] = useState("estatuto");
  const [faseApoderado, setFaseApoderado] = useState("ingresar");
  const [apoNombre, setApoNombre] = useState("");
  const [apoRol, setApoRol] = useState("Representante Legal");

  // --- NAVEGACIÓN Y FUNCIONES ---
  const handleValidarCuit = async () => {
    if (await trigger("cuit")) setPasoActual(2);
  };

  const handleVolver = () => {
    setPasoActual((prev) => (prev === 7 ? 1 : prev - 1));
  };

  const handleResetFlujoCompleto = () => {
    clearStorage();
    metodosFormulario.reset();
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

  const onSubmitFinal = () => {
    setPasoActual(7);
  };

  // Paso 3
  const handleCalcularSimulador = () => {
    setMostrarResultados(true);
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
    if (await trigger(["apoEmail", "apoCelular", "emailFacturacion"])) setFaseApoderado("guardado");
  };

  const avanzarAlExito = async () => {
    if (await trigger("emailFacturacion")) {
      handleSubmit(onSubmitFinal)();
    }
  };

  return (
    <div className={styles.prestamosPage}>
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
            {/* COLUMNA IZQUIERDA: FORMULARIO */}
            <div className={styles.columnaFormulario}>
              <div className={styles.seccionFormulario}>
                {pasoActual === 1 && (
                  <div className={styles.bienvenidaHeader}>
                    <h1 className={styles.tituloBienvenida}>
                      Solicitud de Préstamo
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
                          opcionesProducto={[
                            {
                              value: "prestamo",
                              label: "Préstamo",
                            },
                          ]}
                          mostrarTipoCalculo={false}
                          labelFecha="Plazo"
                          labelMonto="Monto a financiar"
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
                          editarSocio={editarSocio}
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
