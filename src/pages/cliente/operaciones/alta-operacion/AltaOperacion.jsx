import React, { useState, useEffect, useRef } from "react";
import {
  useForm,
  FormProvider,
  useWatch,
  useFieldArray,
} from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { FiRotateCcw } from "react-icons/fi";
import { toast } from "sonner";
import { zodResolver } from "@hookform/resolvers/zod";
import { AltaOperacionSchema } from "../../../../schemas/AltaOperacionSchema";
import {
  useFormPersist,
  getPersistedFormData,
} from "../../../../hooks/useFormPersist";
import { BarraProgreso, BotonVolver } from "../../../../components/ui";
import {
  Paso3Simulador,
  Paso4Socios,
  Paso5Documentacion,
  Paso6Bolsa,
  Paso7Exito,
  ConfirmacionBorradorModal,
} from "../../../../components/features";
import { HelpDrawer } from "../../../../components/layout/Client/HelpDrawer/HelpDrawer";
import { Alert, Spinner } from "../../../../components/ui";
import styles from "./AltaOperacion.module.css";
import { solicitudesService } from "../../../../services/solicitudesService";
import { useEmpresaActiva } from "../../../../hooks/useEmpresaActiva";
import { lineaService } from "../../../../services/lineaService";
import { afipService } from "../../../../services/afipService";
import { tercerosService } from "../../../../services/tercerosService";
import { catalogosService } from "../../../../services/catalogosService";

const STORAGE_KEY = "draft_alta_operacion";

export const AltaOperacion = () => {
  const navigate = useNavigate();
  const [enviandoSolicitud, setEnviandoSolicitud] = useState(false);
  const [mostrarResultados, setMostrarResultados] = useState(false);
  const [isModalBorradorAbierto, setIsModalBorradorAbierto] = useState(false);
  const [isLoadingAFIP, setIsLoadingAFIP] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [buscandoSocios, setBuscandoSocios] = useState(false);
  const [resetKey, setResetKey] = useState(0);
  const [validandoAcceso, setValidandoAcceso] = useState(true);

  useEffect(() => {
    const handler = () => setIsHelpOpen((prev) => !prev);
    document.addEventListener("bindHelp:toggle", handler);
    return () => document.removeEventListener("bindHelp:toggle", handler);
  }, []);

  const { cuitActivo, socioIdActivo, isLoading: isLoadingEmpresa } = useEmpresaActiva();
  const sociosPrecargadosRef = useRef(false);

  useEffect(() => {
    if (isLoadingEmpresa) return;

    if (!cuitActivo) {
      setValidandoAcceso(false);
      return;
    }

    let isMounted = true;
    const verificarAcceso = async () => {
      try {
        const solicitudes = await solicitudesService.obtenerSolicitudesEnProceso(cuitActivo);
        const solicitudesArray = Array.isArray(solicitudes)
          ? solicitudes
          : solicitudes?.data || [];
        const tieneSolicitudEnProceso = solicitudesArray.some(
          (s) => s.estadosolicitud === 1 || s.estado === "En Proceso",
        );

        if (tieneSolicitudEnProceso && isMounted) {
          toast.error("Acceso denegado", {
            description: "Ya tenés una solicitud de línea en análisis. Debés esperar a que se procese.",
          });
          navigate("/solicitudes");
        } else if (isMounted) {
          setValidandoAcceso(false);
        }
      } catch (err) {
        if (isMounted) setValidandoAcceso(false);
      }
    };

    verificarAcceso();
    return () => {
      isMounted = false;
    };
  }, [cuitActivo, isLoadingEmpresa, navigate]);

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

  const [maxPasoAlcanzado, setMaxPasoAlcanzado] = useState(pasoActual);
  useEffect(() => {
    setMaxPasoAlcanzado((m) => Math.max(m, pasoActual));
  }, [pasoActual]);

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

  useEffect(() => {
    if (!socioIdActivo || sociosPrecargadosRef.current) return;

    const precargarSocios = async () => {
      sociosPrecargadosRef.current = true;
      setBuscandoSocios(true);
      
      const currentSocios = getValues("socios");
      const currentReps = getValues("representantes");
      if ((currentSocios && currentSocios.length > 0) || (currentReps && currentReps.length > 0)) {
        setBuscandoSocios(false);
        return;
      }

      try {
        let relaciones = [];
        try {
          relaciones = await tercerosService.obtenerRelacionesDeSocioSGRPlus(socioIdActivo);
          if (!relaciones || (Array.isArray(relaciones) && relaciones.length === 0)) {
            relaciones = await tercerosService.obtenerRelacionesDeSocio(socioIdActivo);
          }
        } catch (sgrErr) {
          relaciones = await tercerosService.obtenerRelacionesDeSocio(socioIdActivo);
        }

        const relacionesArray = Array.isArray(relaciones) ? relaciones : [];
        if (relacionesArray.length === 0) return;

        const sociosCargados = [];
        const representantesCargados = [];
        const cuitsAccionistasYaCargados = new Set(
          (getValues("socios") || []).map((s) => s.cuit)
        );
        const cuitsRepsYaCargados = new Set(
          (getValues("representantes") || []).map((r) => r.cuit)
        );

        const now = new Date();

        for (const rel of relacionesArray) {
          const fd = rel.fechadesde || rel.FechaDesde;
          const fh = rel.fechahasta || rel.FechaHasta;
          if (fh && fh !== "") {
            const expirationDate = new Date(fh);
            const startDate = fd ? new Date(fd) : null;
            
            // Si fechahasta coincide con fechadesde (por tiempo o día calendario), no está expirado!
            const isSameAsStart = startDate && (
              expirationDate.getTime() === startDate.getTime() ||
              expirationDate.toISOString().split('T')[0] === startDate.toISOString().split('T')[0]
            );
            
            if (!isSameAsStart && expirationDate < now) {
              continue; // Expired, skip
            }
          }

          const terceroId = rel.terceroid || rel.tercerorelacionadoid || rel.TerceroRelacionadoID;
          if (!terceroId) continue;

          try {
            let tercero = null;
            try {
              tercero = await tercerosService.obtenerTerceroPorId(terceroId);
            } catch (apiErr) {
              tercero = await tercerosService.obtenerTerceroPorIdSGRPlus(terceroId);
            }

            if (tercero) {
              const cuit = tercero.cuit || tercero.Cuit || tercero.nrodocumento || tercero.documento || "";
              const tiporel = rel.tiporelacionsocioid || rel.TipoRelacionSocioID || rel.tiporelacionsocioId;
              const tiporelNum = Number(tiporel);

              if (tiporelNum === 25) {
                if (cuit && !cuitsAccionistasYaCargados.has(cuit)) {
                  cuitsAccionistasYaCargados.add(cuit);

                  let afipData = null;
                  try {
                    afipData = await afipService.obtenerConstanciaInscripcion(cuit);
                  } catch (e) {
                    console.warn("No se pudo obtener AFIP extra para", cuit);
                  }

                  const terceroMergeado = {
                    ...tercero,
                    datosgenerales: afipData ? afipData.datosgenerales : null
                  };

                  sociosCargados.push({
                    cuit,
                    nombre: tercero.denominacion || tercero.Denominacion || tercero.nombre || tercero.Nombre || tercero.razonsocial || "Sin nombre",
                    participacion: String(rel.porcacciones || rel.participacion || rel.Participacion || "0"),
                    dataOriginal: terceroMergeado,
                    tercerorelacionadoid: terceroId,
                    preloadedFromDb: true,
                  });
                }
              } else if (tiporelNum === 210 || tiporelNum === 230) {
                if (cuit && !cuitsRepsYaCargados.has(cuit)) {
                  cuitsRepsYaCargados.add(cuit);

                  representantesCargados.push({
                    cuit,
                    nombre: tercero.denominacion || tercero.Denominacion || tercero.nombre || tercero.Nombre || tercero.razonsocial || "Sin nombre",
                    rol: tiporelNum === 230 ? "Representante Legal" : "Apoderado",
                    email: tercero.mail || tercero.Mail || "",
                    celular: tercero.telefono || tercero.Telefono || "",
                  });
                }
              } else if (tiporelNum === 21) {
                setValue("sociedadBolsa", String(terceroId));
                setValue("numeroCuentaBolsa", rel.nrosubcuentacaja || rel.NroSubcuentaCaja || "");
              }
            }
          } catch (err) {
            console.error("Error loading specific relation detail:", terceroId, err);
          }
        }

        if (sociosCargados.length > 0) {
          sociosCargados.forEach((s) => append(s));
          setValue("faseSocio", "lista");
        }
        if (representantesCargados.length > 0) {
          setValue("representantes", representantesCargados);
        }
      } catch (error) {
        console.error("Error in precargarSocios flow:", error);
      } finally {
        setBuscandoSocios(false);
      }
    };

    precargarSocios();
  }, [socioIdActivo, getValues, append, setValue, resetKey]);

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
    sociosPrecargadosRef.current = false;
    setResetKey((prev) => prev + 1);
    setPasoActual(1);
    setMaxPasoAlcanzado(1);
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
      
      const unAnioMasRel = new Date();
      unAnioMasRel.setFullYear(unAnioMasRel.getFullYear() + 1);
      const unAnioMasStr = unAnioMasRel.toISOString().split(".")[0];

      const payload = {
        solicitudenprocesoid: 0,
        fechacarga: new Date().toISOString().split(".")[0],
        cuit: cuitActivo
          ? String(cuitActivo).replace(/\D/g, "")
          : "33711316839",
        tipolimiteid: cleanData.tipoProducto === "cheque" ? 1 : cleanData.tipoProducto === "prestamo" ? 2 : 3,
        cadenavalorid: 950274,
        monedaid: Number(cleanData.moneda) || 5000,
        importe: montoLimpio,
        estadosolicitud: 1,
        idexterno: 0,
        terceroviaid: 4000000,
      };

      // Guardar solicitud en proceso (POST)
      const resSolicitud = await solicitudesService.crearSolicitudEnProceso(payload);
      const solicitudIdCreada = resSolicitud?.solicitudenprocesoid || resSolicitud?.id || 0;

      // Guardar la relación con la sociedad de bolsa elegida (Agente de Bolsa)
      if (socioIdActivo && cleanData.sociedadBolsa) {
        const ahoraRel = new Date().toISOString().split(".")[0];
        const payloadRelacionBolsa = {
          socioid: socioIdActivo,
          tercerosrelacionados: [
            {
              sociotercerorelacionid: 0,
              socioid: socioIdActivo,
              terceroid: Number(cleanData.sociedadBolsa),
              tiporelacionsocioid: 21, // "Es su Agente de Bolsa"
              fechadesde: ahoraRel,
              fechahasta: unAnioMasStr,
              porcacciones: 0,
              nroinscripcion: "",
              condicionescomerciales: "",
              cbu: "",
              provinciaid: 0,
              nrosubcuentacaja: String(cleanData.numeroCuentaBolsa || ""),
              sucursalid: 0,
              default: "1",
              subtiporelacionsocioid: 0,
              telefono: "",
              momento: ahoraRel,
            },
          ],
        };
        try {
          await tercerosService.guardarRelacionesDeSocio(payloadRelacionBolsa);
        } catch (relError) {
          console.error("❌ [ALTA OPERACION] Error al guardar relación de agente de bolsa:", relError);
        }
      }

      // Guardar la relación con los representantes / apoderados elegidos
      if (socioIdActivo && cleanData.representantes && cleanData.representantes.length > 0) {
        const ahoraRel = new Date().toISOString().split(".")[0];
        for (const rep of cleanData.representantes) {
          try {
            const cuitLimpio = String(rep.cuit).replace(/\D/g, "");
            if (!cuitLimpio) continue;

            let terceroId = null;
            // 1. Intentar buscar si el tercero ya existe por CUIT
            try {
              const existentes = await tercerosService.obtenerTerceros({
                Cuit: cuitLimpio,
              });
              const arr = Array.isArray(existentes)
                ? existentes
                : existentes?.data || [];
              if (arr.length > 0) {
                terceroId =
                  arr[0].tercerorelacionadoid ||
                  arr[0].TerceroRelacionadoID ||
                  arr[0].id;
              }
            } catch (buscarErr) {
              console.warn(`⚠️ [ALTA OPERACION] No se pudo buscar tercero con CUIT ${cuitLimpio}:`, buscarErr);
            }

            // 2. Si no existe, crearlo
            if (!terceroId) {
              const payloadTercero = {
                tercerorelacionadoid: 0,
                denominacion: rep.nombre || "",
                cuit: cuitLimpio,
                bcraid: 0,
                tipopersonaid: 1, // Persona física
                tipodocumentoid: 0,
                numerodocumento: cuitLimpio,
                estadocivilid: 0,
                ciudadid: 0,
                telefono: rep.celular || "",
                conyuge: "",
                actividad: "",
                contacto: "",
                nrocuenta: "",
                codigomercado: "",
                calle: "",
                numero: 0,
                piso: "",
                departamento: "",
                codpos: "",
                descripcionreducida: (rep.nombre || "").substring(0, 20),
                mail: rep.email || "",
              };
              const terceroResult = await tercerosService.crearTercero(payloadTercero);
              terceroId = terceroResult?.tercerorelacionadoid || terceroResult?.id;
            }

            // 3. Guardar la relación con el socio
            if (terceroId) {
              const payloadRelacionRep = {
                socioid: socioIdActivo,
                tercerosrelacionados: [
                  {
                    sociotercerorelacionid: 0,
                    socioid: socioIdActivo,
                    terceroid: terceroId,
                    tiporelacionsocioid: rep.rol === "Apoderado" ? 210 : 230, // 210: Apoderado de Socio, 230: Representante Legal (Gerente Gral)
                    fechadesde: ahoraRel,
                    fechahasta: unAnioMasStr,
                    porcacciones: 0,
                    nroinscripcion: "",
                    condicionescomerciales: "",
                    cbu: "",
                    provinciaid: 0,
                    nrosubcuentacaja: "",
                    sucursalid: 0,
                    default: "0",
                    subtiporelacionsocioid: 0,
                    telefono: rep.celular || "",
                    momento: ahoraRel,
                  },
                ],
              };
              await tercerosService.guardarRelacionesDeSocio(payloadRelacionRep);
            }
          } catch (repError) {
            console.error(`❌ [ALTA OPERACION] Error al procesar representante ${rep.nombre}:`, repError);
          }
        }
      }

      let importeEnPesos = Math.round(montoLimpio);
      if (Number(cleanData.moneda) === 2) {
        const hoy = "2026-04-08";
        try {
          const cotizacionData = await catalogosService.obtenerCotizacion({ moneda: 2, fecha: hoy, tipoCotizacion: 50 });

          const valorCotizacion = Array.isArray(cotizacionData)
            ? (cotizacionData[0]?.cotizacion || cotizacionData[0]?.Cotizacion || 0)
            : (cotizacionData?.cotizacion || cotizacionData?.Cotizacion || 0);

          if (valorCotizacion > 0) {
            importeEnPesos = Math.round(montoLimpio * valorCotizacion);
          }
        } catch (e) {
        }
      }

      const fchDesde = new Date().toISOString().split(".")[0];
      const unAnioMas = new Date();
      unAnioMas.setFullYear(unAnioMas.getFullYear() + 1);
      const fchHasta = unAnioMas.toISOString().split(".")[0];

      const payloadLimite = {
        tipolimitesocioid: 0,
        socioid: socioIdActivo || 0,
        tipolimiteid: cleanData.tipoProducto === "cheque" ? 1 : cleanData.tipoProducto === "prestamo" ? 2 : 3,
        fchvigenciadesde: fchDesde,
        fchvigenciahasta: fchHasta,
        monedaid: Number(cleanData.moneda) || 5000,
        importelimite: importeEnPesos,
        importeutilizado: 0,
        tipolimiteestadoid: 0,
        observaciones: "",
        sucursalid: 0,
        terceromercadoid: 0,
        destfondosid: 0,
        tipocomisionid: 0,
        porcentajecomision: 0,
        importecargado: importeEnPesos,
        avalid: 0,
        propuesta: "",
        resolucion: "",
        tipolimitesolicitudid: 0,
        importemonex: Number(cleanData.moneda) === 2 ? Math.round(montoLimpio) : 0,
        tipolibradorid: 0,
        contratoid: 0,
        cadenavalorid: 0,
        equipocomercialid: 0,
        solicitudid: solicitudIdCreada,
        tipolimiteriesgoid: 0,
        terceroviaid: 4000000,
        terceropresentanteid: cleanData.sociedadBolsa ? Number(cleanData.sociedadBolsa) : 0,
        tercerogeneradorid: 0
      };

      await lineaService.crearLimiteSocio({ coleccionlinea: [payloadLimite] });

      if (cleanData.tipoProducto === "cheque") {
        setPasoActual(5);
      } else {
        setPasoActual(4);
      }
    } catch (error) {
      toast.error("Error al enviar", {
        description: "Hubo un error al enviar la solicitud. Revisá la consola para más detalles.",
      });
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
      tipo:
        data.tipoProducto === "cheque"
          ? "Cheque"
          : data.tipoProducto === "pagare"
            ? "Pagaré"
            : "Préstamo",
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

  const iniciarCargaSocio = () => {
    setValue("tempSocioCuit", "");
    setValue("tempSocioNombre", "");
    setValue("tempSocioParticipacion", "");
    setValue("tempSocioData", null);
    setValue("faseSocio", "ingresar_cuit");
  };

  const validarCuitSocio = async () => {
    setIsLoadingAFIP(true);
    try {
      const dataAfip =
        await afipService.obtenerConstanciaInscripcion(tempSocioCuit);

      if (dataAfip && dataAfip.datosgenerales) {
        const dg = dataAfip.datosgenerales;
        const nombreSocio =
          dg.razonsocial ||
          `${dg.nombre} ${dg.apellido}`.trim() ||
          "Socio validado";
        setValue("tempSocioNombre", nombreSocio);
        setValue("tempSocioData", dataAfip);
        setValue("faseSocio", "completar_datos");
      } else {
        toast.error("CUIT no encontrado", {
          description: "El CUIT ingresado no fue encontrado en los padrones de AFIP.",
        });
      }
    } catch (error) {
      toast.error("Error de validación", {
        description: "No se pudo validar el CUIT en este momento. Reintentá más tarde.",
      });
    } finally {
      setIsLoadingAFIP(false);
    }
  };

  const guardarSocio = () => {
    const indexSocioEditado = socios.findIndex((s) => s.cuit === tempSocioCuit);

    let socioExistente = {};
    if (indexSocioEditado >= 0) {
      socioExistente = socios[indexSocioEditado];
    }

    const nuevoSocio = {
      ...socioExistente,
      cuit: tempSocioCuit,
      nombre: tempSocioNombre,
      participacion: tempSocioParticipacion,
      dataOriginal: tempSocioData,
    };

    if (indexSocioEditado >= 0) {
      update(indexSocioEditado, nuevoSocio);
    } else {
      append(nuevoSocio);
    }

    setValue("faseSocio", "lista");
  };

  const eliminarSocio = (index) => {
    remove(index);
    if (socios.length === 1) {
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

      if (!terceroId && !socioTarget.preloadedFromDb) {
        const dg = socioTarget.dataOriginal?.datosgenerales || {};
        const dom = dg.domiciliofiscal || {};

        const payloadTercero = {
          tercerorelacionadoid: 0,
          denominacion: socioTarget.nombre || "",
          cuit: String(socioTarget.cuit).replace(/\D/g, ""),
          bcraid: 0,
          tipopersonaid:
            dg.tipopersona === "FISICA"
              ? 1
              : dg.tipopersona === "JURIDICA"
                ? 2
                : 0,
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

        const cuitLimpio = String(socioTarget.cuit).replace(/\D/g, "");
        try {
          const existentes = await tercerosService.obtenerTerceros({
            Cuit: cuitLimpio,
          });
          const arr = Array.isArray(existentes)
            ? existentes
            : existentes?.data || [];
          if (arr.length > 0) {
            terceroId =
              arr[0].tercerorelacionadoid ||
              arr[0].TerceroRelacionadoID ||
              arr[0].id;
          }
        } catch (buscarErr) {
        }

        if (!terceroId) {
          const terceroResult =
            await tercerosService.crearTercero(payloadTercero);
          terceroId = terceroResult?.tercerorelacionadoid || terceroResult?.id;
        }

        if (!terceroId) {
          return false;
        }

        if (socioIdActivo) {
          const ahora = new Date().toISOString().split(".")[0];
          const unAnioMasSocio = new Date();
          unAnioMasSocio.setFullYear(unAnioMasSocio.getFullYear() + 1);
          const unAnioMasStrSocio = unAnioMasSocio.toISOString().split(".")[0];
          
          const payloadRelacion = {
            socioid: socioIdActivo,
            tercerosrelacionados: [
              {
                sociotercerorelacionid: 0,
                socioid: socioIdActivo,
                terceroid: terceroId,
                tiporelacionsocioid: 25, // Accionista / Socio
                fechadesde: ahora,
                fechahasta: unAnioMasStrSocio,
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
              },
            ],
          };

          try {
            await tercerosService.guardarRelacionesDeSocio(payloadRelacion);
          } catch (relError) {
          }
        }
      }

      const sData = {
        ...socioTarget,
        tercerorelacionadoid: terceroId,
        preloadedFromDb: true,
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
          setTempSocioParticipacion={(val) =>
            setValue("tempSocioParticipacion", val)
          }
          socios={socios}
          iniciarCargaSocio={iniciarCargaSocio}
          validarCuitSocio={validarCuitSocio}
          guardarSocio={guardarSocio}
          eliminarSocio={eliminarSocio}
          editarSocio={editarSocio}
          continuarAlProximoPaso={() => setPasoActual(2)}
          isLoading={isLoadingAFIP}
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
        { value: "2", label: "Dólar (U$D)" },
      ];

      if (IS_DLR) {
        opcionesProducto = [{ value: "pagare", label: "Pagaré" }];
        disableTipoProducto = true;
        mostrarTipoCalculo = true;
        opcionesCalculo = [
          { value: "monto_pagare", label: "por monto de pagare" },
        ];
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
            { value: "monto_cheque", label: "por monto de cheque" },
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
                // 1. Validar que no haya Solicitudes en Proceso (Comentado para pruebas)
                /*
                const solicitudes =
                  await solicitudesService.obtenerSolicitudesEnProceso(
                    cuitActivo || "33711316839",
                  );
                const solicitudesArray = Array.isArray(solicitudes)
                  ? solicitudes
                  : solicitudes?.data || [];
                const tieneSolicitudEnProceso = solicitudesArray.some(
                  (s) => s.estadosolicitud === 1 || s.estado === "En Proceso",
                );

                if (tieneSolicitudEnProceso) {
                  toast.warning("Solicitud en curso", {
                    description: "Ya tenés una solicitud de línea en análisis. Debés esperar a que se procese antes de crear una nueva.",
                  });
                  setEnviandoSolicitud(false);
                  return;
                }

                // 2. Validar que no tenga ya un TipoLimite activo para este producto (Comentado para pruebas)
                /*
                const tipoLimiteRequeridoId =
                  tipoProducto === "cheque"
                    ? 1
                    : tipoProducto === "prestamo"
                      ? 2
                      : 3;
                const lineas = await lineaService.obtenerLimitesPorSocio(
                  socioIdActivo || 2974,
                );
                const lineasArray = Array.isArray(lineas)
                  ? lineas
                  : lineas?.data || [];

                const lineaActivaMismoProducto = lineasArray.find(
                  (l) =>
                    l.tipolimiteid === tipoLimiteRequeridoId &&
                    l.tipolimiteestadoid === 1,
                );

                if (lineaActivaMismoProducto) {
                  toast.warning("Línea activa", {
                    description: `Ya tenés una línea de ${tipoProducto} activa. No es posible solicitar una nueva.`,
                  });
                  setEnviandoSolicitud(false);
                  return;
                }
                */

                setMostrarResultados(true);
              } catch (error) {
                console.error("Error en validación previa:", error);
                toast.error("Error de conexión", {
                  description: "Ocurrió un error al validar tus datos. Por favor intentá nuevamente.",
                });
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
              else
                handleSubmit(onSubmitFinalPrestamos, (errors) => {
                  console.error("Errores de validación del schema:", errors);
                })();
            }
          }}
          onGuardarSocioDb={handleGuardarSocioDb}
          isSubmitting={enviandoSolicitud}
          socioId={socioIdActivo}
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
                  console.error("Errores de validación del schema:", errors);
                })();
            }}
            avanzarSinBolsa={() => {
              setValue("sociedadBolsa", "");
              setValue("numeroCuentaBolsa", "");
              handleSubmit(onSubmitFinalCheques, (errors) => {
                console.error("Errores de validación del schema:", errors);
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
    if (
      pasoActual === 4 &&
      (tipoProducto === "prestamo" || tipoProducto === "pagare")
    )
      return null;

    let hitos = ["SOCIOS", "MONTOS", "DOCUMENTOS"];
    let hitoActual = pasoActual - 1;

    if (tipoProducto === "cheque") {
      hitos = ["SOCIOS", "MONTOS", "DOCUMENTOS", "BOLSA"];
      hitoActual = pasoActual - 1;
    }

    return (
      <nav className={styles.stepperNav}>
        <BarraPills hitos={hitos} hitoActual={pasoActual} />
      </nav>
    );
  };

  const obtenerTextosCabecera = () => {
    switch (pasoActual) {
      case 1:
        return {
          t: "Declaración de Socios",
          s: "Revisá y confirmá la composición societaria.",
        };
      case 2:
        return {
          t: "Alta de Operación",
          s: "Seleccioná el tipo de operación y las condiciones.",
        };
      case 3:
        return {
          t: "Documentación Requerida",
          s: "Adjuntá los respaldos de la operación.",
        };
      case 4:
        return { t: "Sociedad de Bolsa", s: "Confirmá tu cuenta comitente." };
      case 5:
        return {
          t: "Operación Confirmada",
          s: "La solicitud fue enviada con éxito.",
        };
      default:
        return { t: "Alta de Operación", s: "" };
    }
  };

  const hitosVisuales =
    tipoProducto === "cheque"
      ? ["Socios", "Operación", "Documentos", "Bolsa"]
      : ["Socios", "Operación", "Documentos"];

  const showHeaderYStepper =
    !(pasoActual === 5 && tipoProducto === "cheque") &&
    !(
      pasoActual === 4 &&
      (tipoProducto === "prestamo" || tipoProducto === "pagare")
    );

  const mostrarBotonVolver =
    pasoActual > 1 &&
    !(pasoActual === 5 && tipoProducto === "cheque") &&
    !(
      pasoActual === 4 &&
      (tipoProducto === "prestamo" || tipoProducto === "pagare")
    );

  if (isLoadingEmpresa || validandoAcceso) {
    return (
      <div className={styles.operacionPage}>
        <div className={styles.formMainContainer} style={{ alignItems: "center", justifyContent: "center" }}>
          <Spinner size={60} />
        </div>
      </div>
    );
  }

  if (buscandoSocios) {
    return (
      <div className={styles.operacionPage}>
        <div className={styles.formMainContainer} style={{ alignItems: "center", justifyContent: "center" }}>
          <Spinner size={60} />
        </div>
      </div>
    );
  }

  return (
    <div className={styles.operacionPage}>
      <div className={styles.formMainContainer}>
        <div className={styles.contentWrapper}>
          <div className={styles.contenedorPrincipal}>
            <div className={`${styles.columnaFormulario} ${!showHeaderYStepper ? styles.columnaCentrada : ""}`}>
              {showHeaderYStepper && (
                <BarraProgreso
                  hitos={hitosVisuales}
                  hitoActual={pasoActual}
                  maxHitoAlcanzado={maxPasoAlcanzado}
                  onStepClick={setPasoActual}
                  onVolver={mostrarBotonVolver ? handleVolver : null}
                  onVolverInicio={
                    pasoActual === 1 ? () => navigate("/solicitudes") : null
                  }
                  onReiniciar={handleClickReiniciar}
                />
              )}

              {showHeaderYStepper && (
                <div className={styles.bienvenidaHeader}>
                  <h1 className={styles.tituloBienvenida}>
                    {obtenerTextosCabecera().t}
                  </h1>
                  <div className={styles.titleAccent}></div>
                  {obtenerTextosCabecera().s && (
                    <p className={styles.subtituloBienvenida}>
                      {obtenerTextosCabecera().s}
                    </p>
                  )}
                </div>
              )}

              <div className={styles.seccionFormulario}>
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
          </div>
        </div>
      </div>

      <ConfirmacionBorradorModal
        isOpen={isModalBorradorAbierto}
        onClose={continuarBorrador}
        onConfirm={confirmarReinicioOperacion}
        onContinueBorrador={continuarBorrador}
      />
      <HelpDrawer
        isOpen={isHelpOpen}
        onClose={() => setIsHelpOpen(false)}
        contexto="alta_operacion"
        pasoActual={pasoActual}
      />
    </div>
  );
};
