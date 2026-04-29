import React, { useState, useEffect } from "react";
import {
  useForm,
  FormProvider,
  useWatch,
  useFieldArray,
} from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { FiRotateCcw } from "react-icons/fi";
import { zodResolver } from "@hookform/resolvers/zod";
import { AltaOperacionSchema } from "../../schemas/AltaOperacionSchema";
import {
  useFormPersist,
  getPersistedFormData,
} from "../../hooks/useFormPersist";
import { BarraProgreso, BotonVolver } from "../../components/ui";
import {
  Paso1Cuit,
  Paso2Datos,
  Paso3Simulador,
  PanelDudas,
  BotonAyudaFlotante,
  Paso4Socios,
  Paso5Documentacion,
  Paso6Bolsa,
  Paso7Exito,
  ModalConfirmacionBorrador,
} from "../../components/features";
import styles from "../cheques/SolicitudCheques.module.css";
import { sociosService } from "../../services/sociosService";
import { solicitudesService } from "../../services/solicitudesService";

const STORAGE_KEY = "draft_alta_operacion";

export const AltaOperacion = () => {
  const navigate = useNavigate();
  const [validandoCuit, setValidandoCuit] = useState(false);
  const [validandoSocioSecundario, setValidandoSocioSecundario] =
    useState(false);
  const [enviandoSolicitud, setEnviandoSolicitud] = useState(false);
  const [mostrarResultados, setMostrarResultados] = useState(false);
  const [isModalBorradorAbierto, setIsModalBorradorAbierto] = useState(false);

  useEffect(() => {
    const borrador = localStorage.getItem(STORAGE_KEY);
    if (borrador) {
      try {
        const parsed = JSON.parse(borrador);
        if (parsed.pasoActual && parsed.pasoActual > 1) {
          setIsModalBorradorAbierto(true);
        }
      } catch (e) {
        console.error("Borrador corrupto, ignorando intercepción");
      }
    }
  }, []);

  const metodosFormulario = useForm({
    resolver: zodResolver(AltaOperacionSchema),
    mode: "onTouched",
    defaultValues: getPersistedFormData(STORAGE_KEY, {
      cuit: "",
      razonSocial: "",
      esSocioExistente: false,
      ubicacionConfirmada: false,
      direccion: "",
      localidad: "",
      celular: "",
      smsVerificado: false,
      moneda: "",
      tipoProducto: "",
      monto: "",
      plazo: "",
      sociedadBolsa: "",
      numeroCuentaBolsa: "",
      representantes: [],
      emailFacturacion: "",
      faseSocio: "ingresar_cuit",
      tempSocioCuit: "",
      tempSocioNombre: "",
      tempSocioParticipacion: "",
      tempSocioData: null,
      docExpandido: "estatuto",
      socios: [],
    }),
  });

  const { handleSubmit, trigger, control, setValue, getValues, watch } =
    metodosFormulario;

  const { pasoActual, setPasoActual, clearStorage } = useFormPersist({
    storageKey: STORAGE_KEY,
    watch,
  });

  const {
    fields: socios,
    append,
    remove,
    update,
  } = useFieldArray({
    control,
    name: "socios",
  });

  const tipoProducto = useWatch({ control, name: "tipoProducto" });
  const moneda = useWatch({ control, name: "moneda" });
  const faseSocio = useWatch({ control, name: "faseSocio" });
  const tempSocioCuit = useWatch({ control, name: "tempSocioCuit" });
  const tempSocioNombre = useWatch({ control, name: "tempSocioNombre" });
  const tempSocioParticipacion = useWatch({
    control,
    name: "tempSocioParticipacion",
  });
  const tempSocioData = useWatch({ control, name: "tempSocioData" });
  const docExpandido = useWatch({ control, name: "docExpandido" });

  const handleVolver = () => {
    setPasoActual((prev) => (prev === 1 ? 1 : prev - 1));
  };

  const handleResetFlujoCompleto = () => {
    clearStorage();
    metodosFormulario.reset({
      cuit: "",
      razonSocial: "",
      esSocioExistente: false,
      ubicacionConfirmada: false,
      direccion: "",
      localidad: "",
      celular: "",
      smsVerificado: false,
      tipoProducto: "",
      monto: "",
      plazo: "",
      sociedadBolsa: "",
      numeroCuentaBolsa: "",
      representantes: [],
      emailFacturacion: "",
      faseSocio: "ingresar_cuit",
      tempSocioCuit: "",
      tempSocioNombre: "",
      tempSocioParticipacion: "",
      tempSocioData: null,
      docExpandido: "estatuto",
      socios: [],
    });
    setPasoActual(1);
    setMostrarResultados(false);
  };

  const confirmarReinicioOperacion = () => {
    handleResetFlujoCompleto();
    setIsModalBorradorAbierto(false);
  };

  const continuarBorrador = () => {
    setIsModalBorradorAbierto(false);
  };

  const handleClickReiniciar = () => {
    setIsModalBorradorAbierto(true);
  };

  const preparePayload = (data) => {
    const {
      faseSocio,
      tempSocioCuit,
      tempSocioNombre,
      tempSocioParticipacion,
      tempSocioData,
      docExpandido,
      ...cleanData
    } = data;
    return cleanData;
  };

  const enviarSolicitud = async (data) => {
    setEnviandoSolicitud(true);
    try {
      const cleanData = preparePayload(data);
      const montoLimpio = Number(
        String(cleanData.monto || "0").replace(/\D/g, ""),
      );

      const payload = {
        solicitudenprocesoid: 0,
        fechacarga: new Date().toISOString(),
        cuit: cleanData.cuit,
        tipolimiteid: cleanData.tipoProducto === "cheque" ? 1 : 2,
        cadenavalorid: 950274,
        monedaid: Number(cleanData.moneda) || 1,
        importe: montoLimpio,
        estadosolicitud: 1,
        idexterno: 0,
        terceroviaid: cleanData.sociedadBolsa
          ? Number(cleanData.sociedadBolsa)
          : 0,
      };

      await solicitudesService.crearSolicitudEnProceso(payload);

      if (cleanData.tipoProducto === "cheque") {
        setPasoActual(7);
      } else {
        setPasoActual(6);
      }
    } catch (error) {
      console.error("Error al enviar la solicitud:", error);
      alert(
        "Hubo un error al enviar la solicitud. Por favor, intente nuevamente.",
      );
    } finally {
      setEnviandoSolicitud(false);
    }
  };

  const onSubmitFinalCheques = () => {
    enviarSolicitud(getValues());
  };

  const onSubmitFinalPrestamos = () => {
    enviarSolicitud(getValues());
  };

  const handleIrASolicitudes = () => {
    const data = getValues();
    let simbolo = "$";
    if (String(data.moneda) === "2") simbolo = "U$D";
    else if (String(data.moneda) === "500") simbolo = "€";
    else if (String(data.moneda) === "10") simbolo = "UVAS";
    else if (String(data.moneda) === "5000") simbolo = "$";

    const montoLimpio = Number(String(data.monto || "0").replace(/\D/g, ""));
    const montoFormateado = montoLimpio.toLocaleString("es-AR");

    const nuevaSolicitud = {
      id: String(Math.floor(Math.random() * 9000) + 1000),
      tipo: data.tipoProducto === "cheque" ? "Cheque" : data.tipoProducto === "pagare" ? "Pagaré" : "Préstamo",
      monto: montoFormateado,
      moneda: simbolo,
      estado: "Pendiente",
      fecha: new Date().toLocaleDateString("es-AR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      }),
    };

    handleResetFlujoCompleto();
    navigate("/solicitudes", { state: { nuevaSolicitud } });
  };

  const iniciarCargaSocio = () => {
    setValue("tempSocioCuit", "");
    setValue("tempSocioParticipacion", "");
    setValue("tempSocioData", null);
    setValue("faseSocio", "ingresar_cuit");
  };

  const validarCuitSocio = async () => {
    if (!tempSocioCuit) return;
    setValidandoSocioSecundario(true);

    try {
      let resp = await sociosService.obtenerSocios({
        Cuit: tempSocioCuit,
        page: 1,
        page_size: 10,
      });
      let socioDb = Array.isArray(resp)
        ? resp[0]
        : resp?.items?.[0] || resp?.data?.[0];

      if (!socioDb) {
        const respWeb = await sociosService.obtenerSociosWeb({
          Cuit: tempSocioCuit,
          page: 1,
          page_size: 10,
        });
        socioDb = Array.isArray(respWeb)
          ? respWeb[0]
          : respWeb?.items?.[0] || respWeb?.data?.[0];
      }

      if (socioDb) {
        setValue("tempSocioNombre", socioDb.denominacion || "Sin Razón Social");
        setValue("tempSocioData", socioDb);
        setValue("faseSocio", "completar_datos");
      } else {
        setValue("tempSocioNombre", "");
        setValue("tempSocioData", null);
        setValue("faseSocio", "completar_datos");
      }
    } catch (err) {
      console.error("Error buscando socio secundario:", err);
      metodosFormulario.setError("tempSocioCuit", {
        message: "Hubo un error de conexión al buscar el CUIT.",
      });
    } finally {
      setValidandoSocioSecundario(false);
    }
  };

  const guardarSocio = () => {
    if (!tempSocioParticipacion) return;
    append({
      cuit: tempSocioCuit,
      nombre: tempSocioNombre,
      participacion: Number(tempSocioParticipacion),
      dataOriginal: tempSocioData || {},
      email: "",
      celular: "",
      direccion: "",
      provincia: "",
      localidad: "",
    });
    setValue("faseSocio", "lista");
    setValue("tempSocioData", null);
  };

  const editarSocio = (index) => {
    const s = socios[index];
    setValue("tempSocioCuit", s.cuit);
    setValue("tempSocioNombre", s.nombre);
    setValue("tempSocioParticipacion", String(s.participacion));
    setValue("tempSocioData", s.dataOriginal);
    remove(index);
    setValue("faseSocio", "completar_datos");
  };

  const eliminarSocio = (index) => {
    remove(index);
    if (socios.length - 1 === 0) {
      setValue("faseSocio", "ingresar_cuit");
    }
  };

  const toggleDoc = (seccion) => {
    setValue("docExpandido", docExpandido === seccion ? "" : seccion);
  };

  const handleGuardarSocioDb = async (socioIndex, datosFormulario) => {
    const socioTarget = socios[socioIndex];
    try {
      const payloadPut = {
        ...socioTarget.dataOriginal,
        email: datosFormulario.email || "",
        telefono: datosFormulario.celular || "",
        calle: datosFormulario.direccion || "",
      };

      const sData = {
        ...socioTarget,
        dataOriginal: payloadPut,
        email: datosFormulario.email || "",
        celular: datosFormulario.celular || "",
        direccion: datosFormulario.direccion || "",
        provincia: datosFormulario.provincia || "",
        localidad: datosFormulario.localidad || "",
      };
      update(socioIndex, sData);
      return true;
    } catch (err) {
      console.error("Error actualizando DB de socio", err);
      return false;
    }
  };

  // ----- RENDERIZADO DINÁMICO DE PASOS -----
  const handleValidarCuit = async () => {
    const isOk = await trigger("cuit");
    if (!isOk) return;

    const cuitIngresado = getValues("cuit");
    setValidandoCuit(true);

    try {
      let resp = await sociosService.obtenerSocios({
        Cuit: cuitIngresado,
        page: 1,
        page_size: 10,
      });
      let socioDb = Array.isArray(resp)
        ? resp[0]
        : resp?.items?.[0] || resp?.data?.[0];
      let esSocioExistente = true;

      if (!socioDb) {
        const respWeb = await sociosService.obtenerSociosWeb({
          Cuit: cuitIngresado,
          page: 1,
          page_size: 10,
        });
        socioDb = Array.isArray(respWeb)
          ? respWeb[0]
          : respWeb?.items?.[0] || respWeb?.data?.[0];
        esSocioExistente = false;
      }

      if (socioDb) {
        setValue("razonSocial", socioDb.denominacion || "Sin Razón Social", {
          shouldValidate: true,
        });
        setValue("esSocioExistente", esSocioExistente);
        if (socioDb.calle) {
          setValue(
            "direccion",
            `${socioDb.calle} ${socioDb.numero || ""}`.trim(),
            { shouldValidate: true },
          );
        }
        const telefono =
          socioDb.telefono || socioDb.celular || socioDb.telefono2 || "";
        if (telefono) {
          setValue("celular", telefono, { shouldValidate: true });
        }
        if (socioDb.email || socioDb.emailfacturacion) {
          setValue(
            "emailFacturacion",
            socioDb.emailfacturacion || socioDb.email,
            { shouldValidate: true },
          );
        }
      } else {
        setValue("razonSocial", "", { shouldValidate: true });
        setValue("esSocioExistente", false);
      }
      setPasoActual(2);
    } catch (err) {
      console.error("Error buscando socio:", err);
      metodosFormulario.setError("cuit", {
        type: "manual",
        message:
          "Error de red al buscar el CUIT. Por favor, vuelva a intentarlo.",
      });
    } finally {
      setValidandoCuit(false);
    }
  };

  const renderPasoDinamico = () => {
    if (pasoActual === 1)
      return (
        <Paso1Cuit onValidar={handleValidarCuit} isLoading={validandoCuit} />
      );
    if (pasoActual === 2)
      return (
        <Paso2Datos
          onVolver={handleVolver}
          onContinuar={async () => {
            if (await trigger(["direccion", "localidad", "celular"]))
              setPasoActual(3);
          }}
        />
      );
    if (pasoActual === 3) {
      const IS_DLR = String(moneda) === "2";
      
      let opcionesProducto = [];
      let opcionesCalculo = [];
      let mostrarTipoCalculo = false;
      let disableTipoProducto = false;
      let disableTipoCalculo = false;
      let opcionesMoneda = [
        { value: "5000", label: "Pesos ($)" },
        { value: "2", label: "Dólar (U$D)" }
      ];

      if (IS_DLR) {
        opcionesProducto = [{ value: "pagare", label: "Pagaré" }];
        disableTipoProducto = true;
        mostrarTipoCalculo = true;
        opcionesCalculo = [{ value: "monto_pagare", label: "por monto de pagare" }];
        disableTipoCalculo = true;
      } else {
        opcionesProducto = [
          { value: "cheque", label: "Cheques propios" },
          { value: "prestamo", label: "Préstamos" },
        ];
        if (tipoProducto === "cheque") {
          mostrarTipoCalculo = true;
          opcionesCalculo = [
            { value: "monto_factura", label: "por monto de factura" },
            { value: "monto_cheque", label: "por monto de cheque" }
          ];
        }
      }

      return (
        <Paso3Simulador
          mostrarResultados={mostrarResultados}
          onCalcular={async () => {
            const campos = ["monto", "tipoProducto", "plazo"];
            if (mostrarTipoCalculo) campos.push("tipoCalculo");
            if (await trigger(campos)) setMostrarResultados(true);
          }}
          onContinuar={() => setPasoActual(4)}
          onCancelar={() => setMostrarResultados(false)}
          opcionesMoneda={opcionesMoneda}
          opcionesProducto={opcionesProducto}
          opcionesCalculo={opcionesCalculo}
          mostrarTipoCalculo={mostrarTipoCalculo}
          disableTipoProducto={disableTipoProducto}
          disableTipoCalculo={disableTipoCalculo}
          labelFecha="Plazo estimado"
          labelMonto="Monto requerido"
        />
      );
    }

    if (pasoActual === 4) {
      return (
        <Paso4Socios
          isLoading={validandoSocioSecundario}
          faseSocio={faseSocio}
          setFaseSocio={(fase) => setValue("faseSocio", fase)}
          tempSocioCuit={tempSocioCuit}
          setTempSocioCuit={(cuit) => setValue("tempSocioCuit", cuit)}
          tempSocioNombre={tempSocioNombre}
          tempSocioParticipacion={tempSocioParticipacion}
          setTempSocioParticipacion={(part) =>
            setValue("tempSocioParticipacion", part)
          }
          socios={socios}
          iniciarCargaSocio={iniciarCargaSocio}
          validarCuitSocio={validarCuitSocio}
          guardarSocio={guardarSocio}
          editarSocio={editarSocio}
          eliminarSocio={eliminarSocio}
          continuarAlProximoPaso={() => {
            setPasoActual(5);
          }}
        />
      );
    }
    if (pasoActual === 5) {
      return (
        <Paso5Documentacion
          docExpandido={docExpandido}
          toggleDoc={toggleDoc}
          socios={socios}
          onVolverASocios={() => setPasoActual(4)}
          avanzarPaso6={async () => {
            const ok = await trigger("emailFacturacion");
            const reps = getValues("representantes");
            if (ok && reps?.length > 0) {
              if (tipoProducto === "cheque") setPasoActual(6);
              else handleSubmit(onSubmitFinalPrestamos)();
            }
          }}
          onGuardarSocioDb={handleGuardarSocioDb}
          isSubmitting={enviandoSolicitud}
        />
      );
    }

    if (tipoProducto === "cheque") {
      if (pasoActual === 6) {
        return (
          <Paso6Bolsa
            avanzarConBolsa={async () => {
              if (await trigger(["sociedadBolsa", "numeroCuentaBolsa"]))
                handleSubmit(onSubmitFinalCheques)();
            }}
            avanzarSinBolsa={() => {
              setValue("sociedadBolsa", "");
              setValue("numeroCuentaBolsa", "");
              handleSubmit(onSubmitFinalCheques)();
            }}
            isSubmitting={enviandoSolicitud}
          />
        );
      }
      if (pasoActual === 7)
        return <Paso7Exito onVolverInicio={handleIrASolicitudes} />;
    } else if (tipoProducto === "prestamo" || tipoProducto === "pagare") {
      if (pasoActual === 6)
        return <Paso7Exito onVolverInicio={handleIrASolicitudes} />;
    }

    return null;
  };

  const renderBarraProgreso = () => {
    if (pasoActual === 1) return null;
    if (pasoActual === 7 && tipoProducto === "cheque") return null;
    if (pasoActual === 6 && (tipoProducto === "prestamo" || tipoProducto === "pagare")) return null;

    let hitos = ["DATOS", "SIMULADOR", "SOCIOS", "DOCUMENTOS"];
    let hitoActual = pasoActual - 1;

    if (tipoProducto === "cheque") {
      hitos = ["DATOS", "SIMULADOR", "SOCIOS", "DOCUMENTOS", "BOLSA"];
      hitoActual = pasoActual - 1;
    }

    return <BarraProgreso hitos={hitos} hitoActual={hitoActual} />;
  };

  const mostrarBotonVolver =
    pasoActual > 1 &&
    !(pasoActual === 7 && tipoProducto === "cheque") &&
    !(pasoActual === 6 && (tipoProducto === "prestamo" || tipoProducto === "pagare"));

  return (
    <div className={styles.pageContainer}>
      <div className={styles.formMainContainer}>
        <div className={styles.contentWrapper}>
          <div className={styles.navegacionTop}>
            <div className={styles.botonesNavegacion}>
              {mostrarBotonVolver && <BotonVolver onClick={handleVolver} />}
              {pasoActual === 1 && (
                <BotonVolver
                  onClick={() => navigate("/inicio")}
                  texto="Volver al inicio"
                />
              )}
              <BotonVolver
                onClick={handleClickReiniciar}
                icon={FiRotateCcw}
                texto="Reiniciar operación"
              />
            </div>
          </div>

          <div className={styles.contenedorPrincipal}>
            <div className={styles.columnaFormulario}>
              <div className={styles.seccionFormulario}>
                {pasoActual === 1 && (
                  <div className={styles.bienvenidaHeader}>
                    <h1 className={styles.tituloBienvenida}>Nueva Operación</h1>
                    <div className={styles.titleAccent}></div>
                    <p className={styles.subtituloBienvenida}>
                      Completá el CUIT de la empresa para iniciar la solicitud.
                    </p>
                  </div>
                )}

                {renderBarraProgreso()}

                <FormProvider {...metodosFormulario}>
                  <form
                    className={styles.formContent}
                    onSubmit={(e) => e.preventDefault()}
                  >
                    <div key={pasoActual} className="animacion-paso">
                      {renderPasoDinamico()}
                    </div>
                  </form>
                </FormProvider>
              </div>
            </div>

            {!(pasoActual === 7 && tipoProducto === "cheque") &&
              !(pasoActual === 6 && (tipoProducto === "prestamo" || tipoProducto === "pagare")) && (
                <>
                  <PanelDudas
                    contexto="alta_operacion"
                    pasoActual={pasoActual}
                  />
                  <BotonAyudaFlotante
                    contexto="alta_operacion"
                    pasoActual={pasoActual}
                  />
                </>
              )}
          </div>
        </div>
      </div>
      <ModalConfirmacionBorrador
        isOpen={isModalBorradorAbierto}
        onClose={continuarBorrador}
        onConfirm={confirmarReinicioOperacion}
        onContinueBorrador={continuarBorrador}
      />
    </div>
  );
};
