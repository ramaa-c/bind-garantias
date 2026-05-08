import React, { useState, useEffect, useRef } from "react";
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
import { BarraPills, BotonVolver } from "../../components/ui";
import {
  Paso3Simulador,
  PanelDudas,
  BotonAyudaFlotante,
  Paso4Socios,
  Paso5Documentacion,
  Paso6Bolsa,
  Paso7Exito,
  ModalConfirmacionBorrador,
} from "../../components/features";
import { Alert } from "../../components/ui";
import styles from "../cheques/SolicitudCheques.module.css";
import { sociosService } from "../../services/sociosService";
import { solicitudesService } from "../../services/solicitudesService";
import { useEmpresaActiva } from "../../hooks/useEmpresaActiva";
import { lineaService } from "../../services/lineaService";
import { afipService } from "../../services/afipService";
import { tercerosService } from "../../services/tercerosService";

const STORAGE_KEY = "draft_alta_operacion";

export const AltaOperacion = () => {
  const navigate = useNavigate();
  const [enviandoSolicitud, setEnviandoSolicitud] = useState(false);
  const [mostrarResultados, setMostrarResultados] = useState(false);
  const [isModalBorradorAbierto, setIsModalBorradorAbierto] = useState(false);
  const [isLoadingAFIP, setIsLoadingAFIP] = useState(false);
  const [errorSocioBackend, setErrorSocioBackend] = useState("");

  const { cuitActivo, socioIdActivo } = useEmpresaActiva();
  const sociosPrecargadosRef = useRef(false);

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

  // --- Precarga de socios existentes desde el backend ---
  useEffect(() => {
    if (!socioIdActivo || sociosPrecargadosRef.current) return;
    sociosPrecargadosRef.current = true; // Marcar inmediatamente para evitar doble ejecución
    
    const currentSocios = getValues("socios");
    if (currentSocios && currentSocios.length > 0) return;

    const precargarSocios = async () => {
      try {
        const relaciones = await tercerosService.obtenerRelacionesDeSocio(socioIdActivo);
        const relacionesArray = Array.isArray(relaciones) ? relaciones : [];
        
        if (relacionesArray.length === 0) return;

        const sociosCargados = [];
        const cuitsYaCargados = new Set((getValues("socios") || []).map(s => s.cuit));

        for (const rel of relacionesArray) {
          const terceroId = rel.terceroid || rel.tercerorelacionadoid || rel.TerceroRelacionadoID;
          if (!terceroId) continue;

          try {
            const tercero = await tercerosService.obtenerTerceroPorId(terceroId);
            if (tercero) {
              const cuit = tercero.cuit || tercero.Cuit || "";
              if (cuitsYaCargados.has(cuit)) continue; // Evitar duplicados
              cuitsYaCargados.add(cuit);
              sociosCargados.push({
                cuit,
                nombre: tercero.denominacion || tercero.Denominacion || tercero.nombre || "Sin nombre",
                participacion: String(rel.porcacciones || rel.participacion || rel.Participacion || "0"),
                dataOriginal: tercero,
                tercerorelacionadoid: terceroId,
                preloadedFromDb: true,
              });
            }
          } catch (err) {
            console.warn(`No se pudo cargar tercero ${terceroId}:`, err);
          }
        }

        if (sociosCargados.length > 0) {
          sociosCargados.forEach((s) => append(s));
          setValue("faseSocio", "lista");
          console.log(`✅ ${sociosCargados.length} socio(s) precargado(s) desde la base de datos.`);
        }
      } catch (error) {
        console.warn("No se pudieron precargar los socios existentes:", error);
      }
    };

    precargarSocios();
  }, [socioIdActivo]);

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
      const montoLimpio = Number(cleanData.monto) || 0;

      const payload = {
        solicitudenprocesoid: 0,
        fechacarga: new Date().toISOString().split(".")[0],
        cuit: cuitActivo ? String(cuitActivo).replace(/\D/g, "") : "33711316839",
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

      console.log("Enviando Solicitud Payload:", payload);
      await solicitudesService.crearSolicitudEnProceso(payload);

      if (cleanData.tipoProducto === "cheque") {
        setPasoActual(5);
      } else {
        setPasoActual(4);
      }
    } catch (error) {
      console.error("Error al enviar la solicitud:", error);
      alert("Hubo un error al enviar la solicitud. Por favor, intentá nuevamente más tarde.");
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

    const montoLimpio = Number(data.monto) || 0;
    const montoFormateado = montoLimpio.toLocaleString("es-AR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

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
    sessionStorage.setItem("last_used_cuit", data.cuit);
    navigate("/solicitudes", { state: { nuevaSolicitud } });
  };

  // Handlers para socios
  const iniciarCargaSocio = () => {
    setValue("tempSocioCuit", "");
    setValue("tempSocioNombre", "");
    setValue("tempSocioParticipacion", "");
    setValue("tempSocioData", null);
    setValue("faseSocio", "ingresar_cuit");
    setErrorSocioBackend("");
  };

  const validarCuitSocio = async () => {
    setIsLoadingAFIP(true);
    setErrorSocioBackend("");
    try {
      const dataAfip = await afipService.obtenerConstanciaInscripcion(tempSocioCuit);
      
      if (dataAfip && dataAfip.datosgenerales) {
        const dg = dataAfip.datosgenerales;
        const nombreSocio = dg.razonsocial || `${dg.nombre} ${dg.apellido}`.trim() || "Socio validado";
        setValue("tempSocioNombre", nombreSocio);
        setValue("tempSocioData", dataAfip);
        setValue("faseSocio", "completar_datos");
      } else {
        setErrorSocioBackend("El CUIT ingresado no fue encontrado en los padrones de AFIP.");
      }
    } catch (error) {
      console.error("Error al validar CUIT en AFIP", error);
      setErrorSocioBackend("No se pudo validar el CUIT en este momento. Por favor, reintentá más tarde o verificá tu conexión.");
    } finally {
      setIsLoadingAFIP(false);
    }
  };

  const guardarSocio = () => {
    const nuevoSocio = {
      cuit: tempSocioCuit,
      nombre: tempSocioNombre,
      participacion: tempSocioParticipacion,
      dataOriginal: tempSocioData,
    };
    
    const indexSocioEditado = socios.findIndex(s => s.cuit === tempSocioCuit);
    if (indexSocioEditado >= 0) {
      update(indexSocioEditado, nuevoSocio);
    } else {
      append(nuevoSocio);
    }
    
    setValue("faseSocio", "lista");
  };

  const eliminarSocio = (index) => {
    remove(index);
    if (socios.length === 1) { // 1 before removal means 0 after
      setValue("faseSocio", "ingresar_cuit");
    }
  };

  const editarSocio = (index) => {
    const socio = socios[index];
    setValue("tempSocioCuit", socio.cuit);
    setValue("tempSocioNombre", socio.nombre);
    setValue("tempSocioParticipacion", socio.participacion);
    setValue("tempSocioData", socio.dataOriginal);
    setValue("faseSocio", "completar_datos");
  };

  const toggleDoc = (seccion) => {
    setValue("docExpandido", docExpandido === seccion ? "" : seccion);
  };

  const handleGuardarSocioDb = async (socioIndex, datosFormulario) => {
    const socioTarget = socios[socioIndex];
    try {
      let terceroId = socioTarget.tercerorelacionadoid || null;

      // Si el socio NO viene precargado de la DB, lo creamos
      if (!terceroId && !socioTarget.preloadedFromDb) {
        const dg = socioTarget.dataOriginal?.datosgenerales || {};
        const dom = dg.domiciliofiscal || {};

        const payloadTercero = {
          tercerorelacionadoid: 0,
          denominacion: socioTarget.nombre || "",
          cuit: String(socioTarget.cuit).replace(/\D/g, ""),
          bcraid: 0,
          tipopersonaid: dg.tipopersona === "FISICA" ? 1 : dg.tipopersona === "JURIDICA" ? 2 : 0,
          tipodocumentoid: 0,
          numerodocumento: String(socioTarget.cuit).replace(/\D/g, ""),
          estadocivilid: 0,
          ciudadid: 0,
          telefono: datosFormulario.celular || "",
          conyuge: "",
          actividad: "",
          contacto: "",
          nrocuenta: "",
          codigomercado: "",
          calle: datosFormulario.direccion || dom.direccion || "",
          numero: 0,
          piso: "",
          departamento: "",
          codpos: dom.codpostal || "",
          descripcionreducida: (socioTarget.nombre || "").substring(0, 20),
          mail: datosFormulario.email || "",
        };

        // Primero buscar si el tercero ya existe por CUIT
        const cuitLimpio = String(socioTarget.cuit).replace(/\D/g, "");
        try {
          const existentes = await tercerosService.obtenerTerceros({ Cuit: cuitLimpio });
          const arr = Array.isArray(existentes) ? existentes : (existentes?.data || []);
          if (arr.length > 0) {
            terceroId = arr[0].tercerorelacionadoid || arr[0].TerceroRelacionadoID || arr[0].id;
            console.log("✅ Tercero ya existente encontrado, ID:", terceroId);
          }
        } catch (buscarErr) {
          console.warn("No se pudo buscar tercero existente, se intentará crear:", buscarErr);
        }

        // Si no existe, crearlo
        if (!terceroId) {
          console.log("📤 POST TerceroRelacionado:", payloadTercero);
          const terceroResult = await tercerosService.crearTercero(payloadTercero);
          terceroId = terceroResult?.tercerorelacionadoid || terceroResult?.id;
          console.log("📥 Respuesta TerceroRelacionado:", terceroResult);
        }

        if (!terceroId) {
          console.error("No se obtuvo ID del tercero creado.");
          return false;
        }

        // Vincular tercero con la empresa activa
        console.log("🔍 socioIdActivo:", socioIdActivo);
        if (socioIdActivo) {
          const ahora = new Date().toISOString().split(".")[0];
          const payloadRelacion = {
            socioid: socioIdActivo,
            tercerosrelacionados: [
              {
                sociotercerorelacionid: 0,
                socioid: socioIdActivo,
                terceroid: terceroId,
                tiporelacionsocioid: 0,
                fechadesde: ahora,
                fechahasta: ahora,
                porcacciones: Number(socioTarget.participacion) || 0,
                nroinscripcion: "",
                condicionescomerciales: "",
                cbu: "",
                provinciaid: 0,
                nrosubcuentacaja: "",
                sucursalid: 0,
                default: "0",
                subtiporelacionsocioid: 0,
                telefono: datosFormulario.celular || "",
                momento: ahora,
              }
            ],
          };

          console.log("📤 POST SocioTerceroRelacion:", payloadRelacion);
          try {
            const relResult = await tercerosService.guardarRelacionesDeSocio(payloadRelacion);
            console.log("📥 Respuesta SocioTerceroRelacion:", relResult);
          } catch (relError) {
            console.error("❌ Error en POST SocioTerceroRelacion:", relError);
            console.error("Response data:", relError?.response?.data);
          }
        } else {
          console.error("⚠️ No se pudo vincular el tercero: socioIdActivo es null/undefined");
        }

        console.log(`✅ Socio "${socioTarget.nombre}" persistido (terceroId: ${terceroId})`);
      }

      // Actualizar el socio en el formulario con los datos completos
      const sData = {
        ...socioTarget,
        tercerorelacionadoid: terceroId,
        preloadedFromDb: true, // Ya está en la DB
        email: datosFormulario.email || "",
        celular: datosFormulario.celular || "",
        direccion: datosFormulario.direccion || "",
        provincia: datosFormulario.provincia || "",
        localidad: datosFormulario.localidad || "",
      };
      update(socioIndex, sData);
      return true;
    } catch (err) {
      console.error("Error persistiendo socio:", err);
      // Aún así guardamos localmente para no perder los datos
      const sData = {
        ...socioTarget,
        email: datosFormulario.email || "",
        celular: datosFormulario.celular || "",
        direccion: datosFormulario.direccion || "",
        provincia: datosFormulario.provincia || "",
        localidad: datosFormulario.localidad || "",
      };
      update(socioIndex, sData);
      return false;
    }
  };

  // ----- RENDERIZADO DINÁMICO DE PASOS -----
  const renderPasoDinamico = () => {
    if (pasoActual === 1) {
      return (
        <Paso4Socios
          faseSocio={faseSocio}
          setFaseSocio={(val) => setValue("faseSocio", val)}
          tempSocioCuit={tempSocioCuit}
          setTempSocioCuit={(val) => setValue("tempSocioCuit", val)}
          tempSocioNombre={tempSocioNombre}
          tempSocioParticipacion={tempSocioParticipacion}
          setTempSocioParticipacion={(val) => setValue("tempSocioParticipacion", val)}
          socios={socios}
          iniciarCargaSocio={iniciarCargaSocio}
          validarCuitSocio={validarCuitSocio}
          guardarSocio={guardarSocio}
          eliminarSocio={eliminarSocio}
          editarSocio={editarSocio}
          continuarAlProximoPaso={() => setPasoActual(2)}
          isLoading={isLoadingAFIP}
          errorBackend={errorSocioBackend}
          setErrorBackend={setErrorSocioBackend}
        />
      );
    }

    if (pasoActual === 2) {
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
            
            const esValido = await trigger(campos);
            
            if (esValido) {
              setEnviandoSolicitud(true);
              try {
                // 1. Validar que no haya Solicitudes en Proceso
                const solicitudes = await solicitudesService.obtenerSolicitudesEnProceso(cuitActivo || "33711316839");
                const solicitudesArray = Array.isArray(solicitudes) ? solicitudes : (solicitudes?.data || []);
                const tieneSolicitudEnProceso = solicitudesArray.some(s => s.estadosolicitud === 1 || s.estado === "En Proceso");

                if (tieneSolicitudEnProceso) {
                  alert("Ya tenés una solicitud de línea en análisis. Debés esperar a que se apruebe o rechace antes de crear una nueva.");
                  setEnviandoSolicitud(false);
                  return;
                }

                // 2. Validar que no tenga ya un TipoLimite activo para este producto
                const tipoLimiteRequeridoId = tipoProducto === "cheque" ? 1 : (tipoProducto === "prestamo" ? 2 : 3);
                const lineas = await lineaService.obtenerLimitesPorSocio(socioIdActivo || 2974);
                const lineasArray = Array.isArray(lineas) ? lineas : (lineas?.data || []);
                
                const lineaActivaMismoProducto = lineasArray.find(
                  (l) => l.tipolimiteid === tipoLimiteRequeridoId && l.tipolimiteestadoid === 1
                );

                if (lineaActivaMismoProducto) {
                  alert(`Ya tenés una línea de ${tipoProducto} activa por un importe de $${lineaActivaMismoProducto.importelimite}. No es posible pedir una nueva línea.`);
                  setEnviandoSolicitud(false);
                  return;
                }

                setMostrarResultados(true);
              } catch (error) {
                console.error("Error en validación previa:", error);
                alert("Ocurrió un error de conexión al validar tus datos. Por favor intentá nuevamente.");
              } finally {
                setEnviandoSolicitud(false);
              }
            }
          }}
          onContinuar={() => setPasoActual(3)}
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

    if (pasoActual === 3) {
      return (
        <Paso5Documentacion
          docExpandido={docExpandido}
          toggleDoc={toggleDoc}
          socios={socios}
          onVolverASocios={() => setPasoActual(2)}
          avanzarPaso6={async () => {
            const ok = await trigger("emailFacturacion");
            const reps = getValues("representantes");
            if (ok && reps?.length > 0) {
              if (tipoProducto === "cheque") setPasoActual(4);
              else handleSubmit(onSubmitFinalPrestamos, (errors) => {
                console.error("❌ Errores de validación del schema:", errors);
              })();
            }
          }}
          onGuardarSocioDb={handleGuardarSocioDb}
          isSubmitting={enviandoSolicitud}
        />
      );
    }

    if (tipoProducto === "cheque") {
      if (pasoActual === 4) {
        return (
          <Paso6Bolsa
            avanzarConBolsa={async () => {
              if (await trigger(["sociedadBolsa", "numeroCuentaBolsa"]))
                handleSubmit(onSubmitFinalCheques, (errors) => {
                  console.error("❌ Errores de validación del schema:", errors);
                })();
            }}
            avanzarSinBolsa={() => {
              setValue("sociedadBolsa", "");
              setValue("numeroCuentaBolsa", "");
              handleSubmit(onSubmitFinalCheques, (errors) => {
                console.error("❌ Errores de validación del schema:", errors);
              })();
            }}
            isSubmitting={enviandoSolicitud}
          />
        );
      }
      if (pasoActual === 5)
        return <Paso7Exito onVolverInicio={handleIrASolicitudes} />;
    } else if (tipoProducto === "prestamo" || tipoProducto === "pagare") {
      if (pasoActual === 4)
        return <Paso7Exito onVolverInicio={handleIrASolicitudes} />;
    }

    return null;
  };

  const renderBarraProgreso = () => {
    if (pasoActual === 5 && tipoProducto === "cheque") return null;
    if (pasoActual === 4 && (tipoProducto === "prestamo" || tipoProducto === "pagare")) return null;

    let hitos = ["SOCIOS", "MONTOS", "DOCUMENTOS"];
    let hitoActual = pasoActual - 1;

    if (tipoProducto === "cheque") {
      hitos = ["SOCIOS", "MONTOS", "DOCUMENTOS", "BOLSA"];
      hitoActual = pasoActual - 1;
    }

    return <BarraPills hitos={hitos} hitoActual={pasoActual} />;
  };

  const mostrarBotonVolver =
    pasoActual > 1 &&
    !(pasoActual === 5 && tipoProducto === "cheque") &&
    !(pasoActual === 4 && (tipoProducto === "prestamo" || tipoProducto === "pagare"));

  return (
    <div className={styles.pageContainer}>
      <div className={styles.formMainContainer}>
        <div className={styles.contentWrapper}>
          <div className={styles.navegacionTop}>
            <div className={styles.botonesNavegacion}>
              {mostrarBotonVolver && <BotonVolver onClick={handleVolver} />}
              {pasoActual === 1 && (
                <BotonVolver
                  onClick={() => navigate("/solicitudes")}
                  texto="Volver a lista"
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
                      Declaración de socios de la empresa.
                    </p>
                  </div>
                )}

                {pasoActual === 2 && (
                  <div className={styles.bienvenidaHeader}>
                    <h1 className={styles.tituloBienvenida}>Nueva Operación</h1>
                    <div className={styles.titleAccent}></div>
                    <p className={styles.subtituloBienvenida}>
                      Ingresá los montos y condiciones de tu operación.
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

            {!(pasoActual === 5 && tipoProducto === "cheque") &&
              !(pasoActual === 4 && (tipoProducto === "prestamo" || tipoProducto === "pagare")) && (
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
