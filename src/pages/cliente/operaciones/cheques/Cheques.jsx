import React, { useState, useEffect } from "react";
import { useForm, FormProvider, useWatch } from "react-hook-form";
import {
  useFormPersist,
  getPersistedFormData,
} from "../../../../hooks/useFormPersist";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate } from "react-router-dom";
import { chequesSchema } from "../../../../schemas/chequesSchema";
import { FiRotateCcw } from "react-icons/fi";
import {
  Paso1Cuit,
  Paso2Datos,
  Paso3Simulador,
  Paso4Socios,
  Paso5Documentacion,
  Paso6Bolsa,
  Paso7Exito,
  ModalConfirmacionBorrador,
} from "../../../../components/features";
import { sociosService } from "../../../../services/sociosService";
import {
  ModalSms,
  BarraProgreso,
  BotonVolver,
  Scroll,
} from "../../../../components/ui";
import { HelpDrawer } from "../../../../components/layout/HelpDrawer/HelpDrawer";
import styles from "./Cheques.module.css";
import { useCrearSocio, useActualizarSocio } from "../../../../hooks/useSocios";

const STORAGE_KEY = "draft_cheques";

export default function Cheques() {
  const navigate = useNavigate();

  const [mostrarModal, setMostrarModal] = useState(false);
  const [codigoSms, setCodigoSms] = useState("");
  const [mostrarResultados, setMostrarResultados] = useState(false);

  const [faseSocio, setFaseSocio] = useState("lista");
  const [tempSocioCuit, setTempSocioCuit] = useState("");
  const [tempSocioNombre, setTempSocioNombre] = useState("");
  const [tempSocioParticipacion, setTempSocioParticipacion] = useState("");
  const [tempSocioDataOriginal, setTempSocioDataOriginal] = useState(null);
  const [errorBackend, setErrorBackend] = useState("");

  const [docExpandido, setDocExpandido] = useState("estatuto");
  const [isModalReiniciarAbierto, setIsModalReiniciarAbierto] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);

  useEffect(() => {
    const handler = () => setIsHelpOpen((prev) => !prev);
    document.addEventListener("bindHelp:toggle", handler);
    return () => document.removeEventListener("bindHelp:toggle", handler);
  }, []);

  // --- 1. ACTUALIZAMOS DEFAULT VALUES ---
  const metodosFormulario = useForm({
    resolver: zodResolver(chequesSchema),
    mode: "onChange",
    shouldUnregister: false,
    defaultValues: getPersistedFormData(STORAGE_KEY, {
      moneda: "Pesos",
      sociedadBolsa: "",
      cuit: "",
      direccion: "",
      provincia: "",
      localidad: "",
      celular: "",
      representantes: [],
      emailFacturacion: "",
    }),
  });

  const { handleSubmit, trigger, watch, setValue, control } = metodosFormulario;

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

  const [maxPasoAlcanzado, setMaxPasoAlcanzado] = useState(pasoActual);
  useEffect(() => {
    setMaxPasoAlcanzado((m) => Math.max(m, pasoActual));
  }, [pasoActual]);

  const maxVisualAlcanzado = (() => {
    if (maxPasoAlcanzado <= 2) return 1;
    if (maxPasoAlcanzado === 3) return 2;
    if (maxPasoAlcanzado === 4) return 3;
    if (maxPasoAlcanzado === 5) return 4;
    return 5;
  })();

  const handleStepClick = (visualStep) => {
    switch (visualStep) {
      case 1: setPasoActual(1); break;
      case 2: setPasoActual(3); break;
      case 3: setPasoActual(4); break;
      case 4: setPasoActual(5); break;
      case 5: setPasoActual(6); break;
      default: break;
    }
  };

  const bolsaSeleccionada = useWatch({
    control,
    name: "sociedadBolsa",
    defaultValue: "",
  });

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
      sociedadBolsa: "",
      cuit: "",
      direccion: "",
      provincia: "",
      localidad: "",
      celular: "",
      representantes: [],
      emailFacturacion: "",
      monto: "",
      fechaPago: "",
    });
    setSocios([]);
    setFaseSocio("lista");
    setMostrarResultados(false);
    setCodigoSms("");
    setPasoActual(1);
    setMaxPasoAlcanzado(1);
  };

  const handleReiniciarAlta = () => {
    setIsModalReiniciarAbierto(true);
  };

  const confirmarReinicioAlta = () => {
    handleResetFlujoCompleto();
    setIsModalReiniciarAbierto(false);
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
  const handleCalcularSimulador = () => setMostrarResultados(true);
  const handleContinuarSimulador = () => {
    setPasoActual(4);
    setFaseSocio(socios.length === 0 ? "ingresar_cuit" : "lista");
  };

  // Paso 4
  const iniciarCargaSocio = () => {
    setTempSocioCuit("");
    setTempSocioParticipacion("");
    setTempSocioDataOriginal(null);
    setFaseSocio("ingresar_cuit");
  };

  const validarCuitSocio = async () => {
    try {
      const resp = await sociosService.obtenerSocios({
        Cuit: tempSocioCuit,
        page: 1,
        page_size: 1,
      });

      const items = Array.isArray(resp)
        ? resp
        : resp?.items || resp?.data || [];

      if (items.length > 0) {
        const socioDb = items[0];
        setTempSocioNombre(socioDb.denominacion || "Socio Encontrado");
        setTempSocioDataOriginal(socioDb);
        setFaseSocio("completar_datos");
      } else {
        setErrorBackend("Socio no encontrado en la base de datos.");
      }
    } catch (err) {
      setErrorBackend("Hubo un error al validar el socio.");
    }
  };

  const obtenerTextosCabecera = () => {
    switch (pasoActual) {
      case 1:
        return {
          t: "Solicitud de Línea de Cheques",
          s: "Completá el CUIT de tu empresa para comenzar a operar.",
        };
      case 2:
        return {
          t: "Información de la Solicitud",
          s: "Completá los datos requeridos para la validación final.",
        };
      case 3:
        return {
          t: "Configuración de la Operación",
          s: "Seleccioná el tipo de financiación que necesitas.",
        };
      case 4:
        if (faseSocio === "ingresar_cuit")
          return {
            t: "Añadir nuevo socio",
            s: "Ingresá el número de CUIT/CUIL para validar su identidad.",
          };
        if (faseSocio === "completar_datos")
          return {
            t: "Completar datos del socio",
            s: "Definí el porcentaje de participación del socio validado.",
          };
        return {
          t: "Declaración de Socios",
          s: "La suma de las participaciones debe alcanzar el 100% exacto.",
        };
      case 5:
        return {
          t: "Documentación y Representantes",
          s: "Completá la información requerida para estructurar la línea.",
        };
      case 6:
        return {
          t: "Sociedad de Bolsa",
          s: "¿Operás con alguna de estas sociedades de bolsa?",
        };
      case 7:
        return {
          t: "Solicitud Completada",
          s: "Tu trámite ha sido procesado exitosamente.",
        };
      default:
        return { t: "", s: "" };
    }
  };

  const { t: tituloCabecera, s: subtituloCabecera } = obtenerTextosCabecera();

  const guardarSocio = () => {
    const participacionNueva = Number(tempSocioParticipacion);
    if (!participacionNueva) return;

    const totalParticipacionActual = socios.reduce(
      (acc, socio) => acc + Number(socio.participacion || 0),
      0,
    );

    if (totalParticipacionActual + participacionNueva > 100) return false;

    setSocios([
      ...socios,
      {
        cuit: tempSocioCuit,
        nombre: tempSocioNombre,
        participacion: tempSocioParticipacion,
        dataOriginal: tempSocioDataOriginal,
      },
    ]);
    setFaseSocio("lista");
    return true;
  };

  const editarSocio = (index) => {
    const socioAEditar = socios[index];
    setTempSocioCuit(socioAEditar.cuit);
    setTempSocioNombre(socioAEditar.nombre);
    setTempSocioParticipacion(socioAEditar.participacion);
    setTempSocioDataOriginal(socioAEditar.dataOriginal);

    setSocios(socios.filter((_, i) => i !== index));
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

  const { mutateAsync: crearSocio } = useCrearSocio();
  const { mutateAsync: actualizarSocio } = useActualizarSocio();

  const handleGuardarSocioDb = async (socioIndex, datosFormulario) => {
    const socioTarget = socios[socioIndex];
    if (!socioTarget || !socioTarget.dataOriginal) return false;

    const payload = {
      ...socioTarget.dataOriginal,
      email: datosFormulario.email || "",
      telefono: datosFormulario.celular || "",
      calle: datosFormulario.direccion || "",
    };

    try {
      let resultado;
      if (payload.socioid) {
        resultado = await actualizarSocio(payload);
      } else {
        resultado = await crearSocio(payload);
      }

      if (resultado && (resultado.socioid || resultado.id)) {
        const nuevosSocios = [...socios];
        nuevosSocios[socioIndex].dataOriginal = resultado;
        setSocios(nuevosSocios);
        return true;
      }
      return false;
    } catch (error) {
      console.error("Error al persistir socio en DB:", error);
      return false;
    }
  };

  const avanzarPaso6 = async () => {
    const okFacturacion = await trigger("emailFacturacion");
    const representantes = metodosFormulario.getValues("representantes");
    if (okFacturacion && representantes?.length > 0) {
      setPasoActual(6);
    }
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

  const hitoVisual = (() => {
    if (pasoActual <= 2) return 1;
    if (pasoActual === 3) return 2;
    if (pasoActual === 4) return 3;
    if (pasoActual === 5) return 4;
    return 5;
  })();

  return (
    <div className={styles.chequesPage}>
      <div className={styles.formMainContainer}>
        <div className={styles.contentWrapper}>
          <div className={styles.contenedorPrincipal}>
            <div className={styles.columnaFormulario}>
              {pasoActual < 7 && (
                <BarraProgreso
                  hitos={[
                    "Empresa",
                    "Operación",
                    "Socios",
                    "Documentos",
                    "Confirmación",
                  ]}
                  hitoActual={hitoVisual}
                  maxHitoAlcanzado={maxVisualAlcanzado}
                  onStepClick={handleStepClick}
                  onVolver={
                    pasoActual > 1
                      ? () => {
                          handleVolver();
                          if (pasoActual === 3) setMostrarResultados(false);
                        }
                      : null
                  }
                  onVolverInicio={
                    pasoActual === 1 ? () => navigate("/inicio") : null
                  }
                  onReiniciar={handleReiniciarAlta}
                />
              )}

              <div className={styles.bienvenidaHeader}>
                <h1 className={styles.tituloBienvenida}>{tituloCabecera}</h1>
                <div className={styles.titleAccent} />
                <p className={styles.subtituloBienvenida}>
                  {subtituloCabecera}
                </p>
              </div>

              <div className={styles.seccionFormulario}>
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
                              value: "cheques_propios",
                              label: "Cheques propios",
                            },
                          ]}
                          mostrarTipoCalculo={true}
                          labelFecha="Fecha de pago"
                          labelMonto="Monto de cheque"
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
                          errorBackend={errorBackend}
                          setErrorBackend={setErrorBackend}
                        />
                      )}

                      {pasoActual === 5 && (
                        <Paso5Documentacion
                          docExpandido={docExpandido}
                          toggleDoc={toggleDoc}
                          socios={socios}
                          onVolverASocios={() => setPasoActual(4)}
                          avanzarPaso6={avanzarPaso6}
                          onGuardarSocioDb={handleGuardarSocioDb}
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
        isOpen={mostrarModal}
        onClose={() => setMostrarModal(false)}
        codigoSms={codigoSms}
        setCodigoSms={setCodigoSms}
        onConfirmar={confirmarSms}
      />
      <HelpDrawer
        isOpen={isHelpOpen}
        onClose={() => setIsHelpOpen(false)}
        contexto="cheques"
        pasoActual={pasoActual}
      />
    </div>
  );
}
