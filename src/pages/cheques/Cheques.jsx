import React, { useState } from "react";
import { useForm, FormProvider, useWatch } from "react-hook-form";
import {
  useFormPersist,
  getPersistedFormData,
} from "../../hooks/useFormPersist";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate } from "react-router-dom";
import { chequesSchema } from "../../schemas/chequesSchema";
import { FiRotateCcw } from "react-icons/fi";
import {
  Paso1Cuit,
  Paso2Datos,
  Paso3Simulador,
  Paso4Socios,
  Paso5Documentacion,
  Paso6Bolsa,
  Paso7Exito,
  PanelDudas,
  BotonAyudaFlotante,
  ModalConfirmacionBorrador,
} from "../../components/features";
import { sociosService } from "../../services/sociosService";
import {
  ModalSms,
  BarraProgreso,
  BotonVolver,
  Scroll,
} from "../../components/ui";
import styles from "./Cheques.module.css";
import { useCrearSocio, useActualizarSocio } from "../../hooks/useSocios";

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

  const [docExpandido, setDocExpandido] = useState("estatuto");
  const [isModalReiniciarAbierto, setIsModalReiniciarAbierto] = useState(false);

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
      const response = await sociosService.obtenerSocios({
        Cuit: tempSocioCuit,
        page: 1,
        page_size: 10,
      });

      const resultados = Array.isArray(response)
        ? response
        : response?.items || response?.data || [];

      if (resultados.length > 0) {
        setTempSocioNombre(resultados[0].denominacion);
        setTempSocioDataOriginal(resultados[0]);
      } else {
        setTempSocioNombre("SEOANE SUAREZ MARINA (Mock AFIP)");
        setTempSocioDataOriginal(null);
      }
    } catch (error) {
      console.error("Error al buscar el socio:", error);
      setTempSocioNombre("SEOANE SUAREZ MARINA (Error Back)");
      setTempSocioDataOriginal(null);
    }

    setFaseSocio("completar_datos");
  };

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

  // --- Mutaciones de Socios ---
  const { mutateAsync: crearSocio } = useCrearSocio();
  const { mutateAsync: actualizarSocio } = useActualizarSocio();

  const handleGuardarSocioDb = async (socioIndex, datosFormulario) => {
    const socioTarget = socios[socioIndex];

    try {
      if (socioTarget.dataOriginal) {
        const payloadPut = {
          ...socioTarget.dataOriginal,
          email: datosFormulario.email || "",
          telefono: datosFormulario.celular || "",
          calle: datosFormulario.direccion || "",
        };

        await actualizarSocio(payloadPut);

        const nuevosSocios = [...socios];
        nuevosSocios[socioIndex].dataOriginal = payloadPut;
        setSocios(nuevosSocios);
      } else {
        const payloadPost = {
          socioid: 0,
          entidadid: 0,
          tiposocioid: 0,
          cuit: socioTarget.cuit || "",
          denominacion: socioTarget.nombre || "",
          calle: datosFormulario.direccion || "",
          numero: 0,
          piso: "",
          departamento: "",
          ciudadid: 0,
          telefono: datosFormulario.celular || "",
          fax: "",
          email: datosFormulario.email || "",
          tipopersonaid: 0,
          tipocarteraid: 0,
          sectorcontableid: 0,
          tipoactividadbcraid: 0,
          tipoactividadsepymeid: 0,
          marcavinculacion: "0",
          situacionbcraid: 0,
          fechabaja: null,
          motivobajaid: 0,
          socioestadoid: 0,
          codpos: "",
          tamanioempresaid: 0,
          fechacierreejercicio: null,
          legajo: 0,
          tiporegimenivaid: 0,
          actividadespecifica: "",
          partido: "",
          telefono2: "",
          telefono3: "",
          visitado: "",
          scoringcomercial: "",
          partidoid: 0,
          fechainicioactividades: new Date().toISOString(),
          tipoactividadglobalid: 0,
          tipocanalcomercializacionid: 0,
          emailfacturacion: "",
          minapoderadosrequeridos: 0,
          tipocondicionfianzaid: 0,
          jsoncondicionfianza: "",
        };

        const nuevoSocioDb = await crearSocio(payloadPost);

        const nuevosSocios = [...socios];
        nuevosSocios[socioIndex].dataOriginal = nuevoSocioDb;
        setSocios(nuevosSocios);
      }
      return true;
    } catch (error) {
      console.error("Error al guardar el socio:", error);
      throw error;
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

  return (
    <div className={styles.chequesPage}>
      <div className={styles.formMainContainer}>
        <div className={styles.contentWrapper}>
          <div className={styles.navegacionTop}>
            <div className={styles.botonesNavegacion}>
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
              {pasoActual < 7 && (
                <BotonVolver
                  onClick={handleReiniciarAlta}
                  icon={FiRotateCcw}
                  texto="Reiniciar alta"
                />
              )}
            </div>
          </div>

          <div className={styles.contenedorPrincipal}>
            <div className={styles.columnaFormulario}>
              <div className={styles.seccionFormulario}>
                {pasoActual === 1 && (
                  <div className={styles.bienvenidaHeader}>
                    <h1 className={styles.tituloBienvenida}>
                      Solicitud de Línea de Cheques
                    </h1>
                    <div className={styles.titleAccent}></div>
                    <p className={styles.subtituloBienvenida}>
                      Comenzá validando el CUIT de tu empresa para operar en el
                      mercado de capitales.
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
                    if (pasoActual === 6) hitoVisual = 5;
                    return (
                      <BarraProgreso
                        hitos={[
                          "EMPRESA",
                          "OPERACIÓN",
                          "SOCIOS",
                          "DOCUMENTOS",
                          "CONFIRMACIÓN",
                        ]}
                        hitoActual={hitoVisual}
                      />
                    );
                  })()}

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
            {pasoActual < 7 && (
              <>
                <PanelDudas contexto="cheques" pasoActual={pasoActual} />
                <BotonAyudaFlotante
                  contexto="cheques"
                  pasoActual={pasoActual}
                />
              </>
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
        isOpen={mostrarModal}
        onClose={() => setMostrarModal(false)}
        codigoSms={codigoSms}
        setCodigoSms={setCodigoSms}
        onConfirmar={confirmarSms}
      />
    </div>
  );
}
