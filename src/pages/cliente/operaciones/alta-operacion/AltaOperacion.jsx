import React, { useState, useEffect, useRef } from "react";
import {
  useForm,
  FormProvider,
  useWatch,
  useFieldArray,
} from "react-hook-form";
import { useNavigate, useParams } from "react-router-dom";
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
import { Alert, Spinner, LoadingScreen } from "../../../../components/ui";
import styles from "./AltaOperacion.module.css";
import { solicitudesService } from "../../../../services/solicitudesService";
import { sociosService } from "../../../../services/sociosService";
import { useEmpresaActiva } from "../../../../hooks/useEmpresaActiva";
import { lineaService } from "../../../../services/lineaService";
import { afipService } from "../../../../services/afipService";
import { tercerosService } from "../../../../services/tercerosService";
import { catalogosService } from "../../../../services/catalogosService";
import { socioArchivoService } from "../../../../services/socioArchivoService";
import { useChannel } from "../../../../context/ChannelContext";
import { useRequisitos } from "../../../../hooks/useRequisitos";

const STORAGE_KEY = "draft_alta_operacion";

const generarIdAleatorio = () => String(Math.floor(Math.random() * 9000) + 1000);

export const AltaOperacion = () => {
  const navigate = useNavigate();
  const { channelInfo } = useChannel();
  const { cadenaSlug } = useParams();

  const {
    cuitActivo,
    socioIdActivo,
    tipoPersonaId,
    nombreEmpresa,
    isLoading: isLoadingEmpresa,
  } = useEmpresaActiva();

  const { requisitos } = useRequisitos(Number(cadenaSlug), tipoPersonaId ?? null, nombreEmpresa);
  const [enviandoSolicitud, setEnviandoSolicitud] = useState(false);

  useEffect(() => {
    if (requisitos?.relaciones?.accionistas === 0 && pasoActual === 1) {
      setPasoActual(2);
    }
  }, [requisitos, pasoActual, setPasoActual]);
  const [mostrarResultados, setMostrarResultados] = useState(false);
  const [isModalBorradorAbierto, setIsModalBorradorAbierto] = useState(false);
  const [isLoadingAFIP, setIsLoadingAFIP] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [buscandoSocios, setBuscandoSocios] = useState(false);
  const [resetKey, setResetKey] = useState(0);
  const [validandoAcceso, setValidandoAcceso] = useState(true);
  const [archivosBackend, setArchivosBackend] = useState([]);

  const handleContinuarSocios = async () => {
    const sociosList = getValues("socios") || [];
    if (sociosList.length === 0) {
      toast.error("Debe declarar al menos un socio.");
      return;
    }
    setPasoActual(2);
  };

  useEffect(() => {
    const handler = () => setIsHelpOpen((prev) => !prev);
    document.addEventListener("bindHelp:toggle", handler);
    return () => document.removeEventListener("bindHelp:toggle", handler);
  }, []);

  const sociosPrecargadosRef = useRef(false);

  useEffect(() => {
    if (!socioIdActivo) return;
    const cargarArchivosBackend = async () => {
      try {
        const archivosExistentes = await socioArchivoService.obtenerArchivos(socioIdActivo);
        const arr = Array.isArray(archivosExistentes) ? archivosExistentes : [];
        setArchivosBackend(arr);
      } catch (err) {
        console.warn("No se pudieron cargar archivos del backend:", err);
      }
    };
    cargarArchivosBackend();
  }, [socioIdActivo]);

  useEffect(() => {
    if (isLoadingEmpresa) return;

    if (!cuitActivo) {
      setValidandoAcceso(false);
      return;
    }

    let isMounted = true;
    const verificarAcceso = async () => {
      try {
        const solicitudes =
          await solicitudesService.obtenerSolicitudesEnProceso(cuitActivo);
        const solicitudesArray = Array.isArray(solicitudes)
          ? solicitudes
          : solicitudes?.data || [];
        const tieneSolicitudEnProceso = solicitudesArray.some(
          (s) => s.estadosolicitud === 1 || s.estado === "En Proceso",
        );

        if (tieneSolicitudEnProceso && isMounted) {
          toast.error("Acceso denegado", {
            description:
              "Ya tenés una solicitud de línea en análisis. Debés esperar a que se procese.",
          });
          navigate(`/${channelInfo?.id}/solicitudes`);
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

  const cargarSociosDesdeDB = async (force = false) => {
    if (!socioIdActivo) return;
    if (!force && sociosPrecargadosRef.current) return;

    sociosPrecargadosRef.current = true;
    setBuscandoSocios(true);

    if (force) {
      setValue("socios", []);
      setValue("representantes", []);
    }

    try {
      try {
        const archivosExistentes = await socioArchivoService.obtenerArchivos(socioIdActivo);
        setArchivosBackend(Array.isArray(archivosExistentes) ? archivosExistentes : []);
      } catch (err) {
        console.warn("No se pudieron recargar los archivos de DNI del backend:", err);
      }

      let relacionesSGR = [];
      let relacionesLocal = [];

      try {
        relacionesSGR =
          await tercerosService.obtenerRelacionesDeSocioSGRPlus(
            socioIdActivo,
          );
      } catch (e) {
        console.warn("No se pudo obtener relaciones de SGRPlus", e);
      }

      try {
        relacionesLocal =
          await tercerosService.obtenerRelacionesDeSocio(socioIdActivo);
      } catch (e) {
        console.warn("No se pudo obtener relaciones locales", e);
      }

      const arrSgr = Array.isArray(relacionesSGR) ? relacionesSGR : [];
      const arrLocal = Array.isArray(relacionesLocal) ? relacionesLocal : [];

      const mapaRel = new Map();
      [...arrSgr, ...arrLocal].forEach((r) => {
        const tid =
          r.terceroid || r.tercerorelacionadoid || r.TerceroRelacionadoID;
        const rid =
          r.tiporelacionsocioid ||
          r.TipoRelacionSocioID ||
          r.tiporelacionsocioId;
        if (tid && rid) {
          const key = `${tid}-${rid}`;
          const existing = mapaRel.get(key);
          if (existing) {
            const existingMomento = new Date(existing.momento || existing.Momento || 0).getTime();
            const currentMomento = new Date(r.momento || r.Momento || 0).getTime();
            const existingId = Number(existing.sociotercerorelacionid || existing.SocioTerceroRelacionID || 0);
            const currentId = Number(r.sociotercerorelacionid || r.SocioTerceroRelacionID || 0);
            
            if (currentMomento > existingMomento || (currentMomento === existingMomento && currentId > existingId)) {
              mapaRel.set(key, r);
            }
          } else {
            mapaRel.set(key, r);
          }
        }
      });

      const relacionesArray = Array.from(mapaRel.values());
      if (relacionesArray.length === 0) {
        if (force) {
          setValue("socios", []);
          setValue("faseSocio", "ingresar_cuit");
        }
        return;
      }

      const sociosCargados = [];
      const representantesCargados = [];
      const cuitsAccionistasYaCargados = new Set(
        force ? [] : (getValues("socios") || []).map((s) => s.cuit),
      );
      const cuitsRepsYaCargados = new Set(
        force ? [] : (getValues("representantes") || []).map((r) => r.cuit),
      );

      const now = new Date();

      for (const rel of relacionesArray) {
        const fd = rel.fechadesde || rel.FechaDesde;
        const fh = rel.fechahasta || rel.FechaHasta;
        if (fh && fh !== "") {
          const expirationDate = new Date(fh);
          const startDate = fd ? new Date(fd) : null;

          const isSameAsStart =
            startDate &&
            (expirationDate.getTime() === startDate.getTime() ||
              expirationDate.toISOString().split("T")[0] ===
                startDate.toISOString().split("T")[0]);

          if (!isSameAsStart && expirationDate < now) {
            continue;
          }
        }

        const terceroId =
          rel.terceroid ||
          rel.tercerorelacionadoid ||
          rel.TerceroRelacionadoID;
        if (!terceroId) continue;

        try {
          let tercero = null;
          try {
            tercero = await tercerosService.obtenerTerceroPorId(terceroId);
            if (!tercero || !tercero.denominacion || !tercero.cuit) {
              const terceroSGR = await tercerosService.obtenerTerceroPorIdSGRPlus(terceroId);
              if (terceroSGR && (terceroSGR.denominacion || terceroSGR.cuit)) {
                tercero = terceroSGR;
              }
            }
          } catch (apiErr) {
            try {
              tercero = await tercerosService.obtenerTerceroPorIdSGRPlus(terceroId);
            } catch (sgrErr) {
              console.warn("No se pudo obtener tercero de SGRPlus", sgrErr);
            }
          }

          if (tercero) {
            const cuit =
              tercero.cuit ||
              tercero.Cuit ||
              tercero.nrodocumento ||
              tercero.numerodocumento ||
              tercero.NumeroDocumento ||
              tercero.documento ||
              "";
            const tiporel =
              rel.tiporelacionsocioid ||
              rel.TipoRelacionSocioID ||
              rel.tiporelacionsocioId;
            const tiporelNum = Number(tiporel);

            if (tiporelNum === 25) {
              const cuitLimpioSocio = String(cuit).replace(/\D/g, "");
              const cuitLimpioEmpresa = cuitActivo
                ? String(cuitActivo).replace(/\D/g, "")
                 : "";

              if (
                cuit &&
                cuitLimpioSocio !== cuitLimpioEmpresa &&
                (!cuitsAccionistasYaCargados.has(cuit) || force)
              ) {
                cuitsAccionistasYaCargados.add(cuit);

                let afipData = null;
                try {
                  afipData =
                    await afipService.obtenerConstanciaInscripcion(cuit);
                } catch (e) {
                  console.warn("No se pudo obtener AFIP extra para", cuit);
                }

                const terceroMergeado = {
                  ...tercero,
                  datosgenerales: afipData ? afipData.datosgenerales : null,
                };

                const email =
                  tercero.mail ||
                  tercero.Mail ||
                  terceroMergeado.datosgenerales?.email ||
                  "";
                const celular =
                  tercero.telefono ||
                  tercero.Telefono ||
                  rel.telefono ||
                  "";
                const direccion =
                  tercero.calle ||
                  tercero.Calle ||
                  tercero.direccion ||
                  terceroMergeado.datosgenerales?.domiciliofiscal?.direccion ||
                  "";
                const localidad =
                  tercero.contacto ||
                  terceroMergeado.datosgenerales?.domiciliofiscal?.localidad ||
                  "";
                const provinciaid =
                  rel.provinciaid ||
                  terceroMergeado.datosgenerales?.domiciliofiscal?.descripcionprovincia ||
                  "";

                sociosCargados.push({
                  cuit,
                  nombre:
                    tercero.denominacion ||
                    tercero.Denominacion ||
                    tercero.nombre ||
                    tercero.Nombre ||
                    tercero.razonsocial ||
                    "Sin nombre",
                  participacion: String(
                    rel.porcacciones ||
                      rel.participacion ||
                      rel.Participacion ||
                      "0",
                  ),
                  email,
                  celular,
                  direccion,
                  localidad,
                  provinciaid: String(provinciaid),
                  dataOriginal: terceroMergeado,
                  tercerorelacionadoid: terceroId,
                  preloadedFromDb: true,
                  relacion: rel,
                });
              }
            } else if (tiporelNum === 210 || tiporelNum === 230) {
              if (cuit && (!cuitsRepsYaCargados.has(cuit) || force)) {
                cuitsRepsYaCargados.add(cuit);

                representantesCargados.push({
                  cuit,
                  nombre:
                    tercero.denominacion ||
                    tercero.Denominacion ||
                    tercero.nombre ||
                    tercero.Nombre ||
                    tercero.razonsocial ||
                    "Sin nombre",
                  rol:
                    tiporelNum === 230 ? "Representante Legal" : "Apoderado",
                  email: tercero.mail || tercero.Mail || "",
                  celular: tercero.telefono || tercero.Telefono || "",
                });
              }
            } else if (tiporelNum === 21) {
              setValue("sociedadBolsa", String(terceroId));
              setValue(
                "numeroCuentaBolsa",
                rel.nrosubcuentacaja || rel.NroSubcuentaCaja || "",
              );
            }
          }
        } catch (err) {
          console.error(
            "Error loading specific relation detail:",
            terceroId,
            err,
          );
        }
      }

      if (sociosCargados.length > 0) {
        setValue("socios", sociosCargados);
        setValue("faseSocio", "lista");
      } else {
        if (force) {
          setValue("socios", []);
          setValue("faseSocio", "ingresar_cuit");
        }
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

  useEffect(() => {
    if (socioIdActivo) {
      cargarSociosDesdeDB();
    }
  }, [socioIdActivo, resetKey]);

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
      const cuitLimpio = cuitActivo
        ? String(cuitActivo).replace(/\D/g, "")
        : "33711316839";

      let finalSocioId = socioIdActivo;

      // Si no se encuentra el ID real del socio, bloqueamos el envío de la solicitud
      if (!finalSocioId) {
        toast.error("Error al enviar", {
          description: "No se pudo determinar el ID real del socio. La solicitud no se puede procesar.",
        });
        setEnviandoSolicitud(false);
        return;
      }

      // El email de facturación se pide y valida como obligatorio en el
      // Paso 5 (ver Paso5Documentacion), pero nunca se persistía en
      // ningún lado - se descartaba apenas se enviaba la solicitud. El PUT
      // a /Socio reemplaza el registro entero, así que hay que partir del
      // socio ya guardado (no solo de `cleanData`) para no pisarle el
      // resto de los campos con vacíos.
      if (cleanData.emailFacturacion) {
        try {
          const socioActual = await sociosService.obtenerSocioPorId(finalSocioId);
          if (socioActual && socioActual.emailfacturacion !== cleanData.emailFacturacion) {
            await sociosService.actualizarSocio({
              ...socioActual,
              socioid: finalSocioId,
              emailfacturacion: cleanData.emailFacturacion,
            });
          }
        } catch (emailError) {
          console.error(
            "[ALTA OPERACION] Error al actualizar el email de facturación:",
            emailError,
          );
        }
      }

      const montoLimpio = Number(cleanData.monto) || 0;

      const unAnioMasRel = new Date();
      unAnioMasRel.setFullYear(unAnioMasRel.getFullYear() + 1);
      const unAnioMasStr = unAnioMasRel.toISOString().split(".")[0];

      const payload = {
        solicitudenprocesoid: 0,
        fechacarga: new Date().toISOString().split(".")[0],
        cuit: cuitLimpio,
        tipolimiteid:
          cleanData.tipoProducto === "cheque"
            ? 1
            : cleanData.tipoProducto === "prestamo"
              ? 2
              : 3,
        cadenavalorid: Number(cadenaSlug),
        monedaid: Number(cleanData.moneda) || 5000,
        importe: montoLimpio,
        estadosolicitud: 1,
        idexterno: 0,
        terceroviaid: 4000000,
        terceropresentanteid: cleanData.sociedadBolsa
          ? Number(cleanData.sociedadBolsa)
          : 0,
      };

      console.log(
        "[ALTA OPERACION] Payload enviado a crearSolicitudEnProceso:",
        JSON.stringify(payload, null, 2),
      );

      const resSolicitud =
        await solicitudesService.crearSolicitudEnProceso(payload);
      const solicitudIdCreada =
        resSolicitud?.solicitudenprocesoid || resSolicitud?.id || 0;

      if (finalSocioId && cleanData.sociedadBolsa) {
        const ahoraRel = new Date().toISOString().split(".")[0];
        const payloadRelacionBolsa = {
          socioid: finalSocioId,
          tercerosrelacionados: [
            {
              sociotercerorelacionid: 0,
              socioid: finalSocioId,
              terceroid: Number(cleanData.sociedadBolsa),
              tiporelacionsocioid: 21,
              fechadesde: ahoraRel,
              fechahasta: unAnioMasStr,
              porcacciones: 0,
              nroinscripcion: "",
              condicionescomerciales: "",
              cbu: "",
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
          console.error(
            "[ALTA OPERACION] Error al guardar relación de agente de bolsa:",
            relError,
          );
        }
      }

      // Los representantes/apoderados ya se persisten (tercero + SocioTerceroRelacion)
      // desde RepresentanteModal.onConfirmSave al momento de agregarlos/editarlos en el
      // Paso5 (o ya venían precargados de la DB vía cargarSociosDesdeDB). Volver a
      // guardarlos acá duplicaba la relación en cada envío de solicitud.

      let importeEnPesos = Math.round(montoLimpio);
      if (Number(cleanData.moneda) === 2) {
        const hoy = "2026-04-08";
        try {
          const cotizacionData = await catalogosService.obtenerCotizacion({
            moneda: 2,
            fecha: hoy,
            tipoCotizacion: 50,
          });

          const valorCotizacion = Array.isArray(cotizacionData)
            ? cotizacionData[0]?.cotizacion ||
              cotizacionData[0]?.Cotizacion ||
              0
            : cotizacionData?.cotizacion || cotizacionData?.Cotizacion || 0;

          if (valorCotizacion > 0) {
            importeEnPesos = Math.round(montoLimpio * valorCotizacion);
          }
        } catch (e) {}
      }

      const fchDesde = new Date().toISOString().split(".")[0];
      const unAnioMas = new Date();
      unAnioMas.setFullYear(unAnioMas.getFullYear() + 1);
      const fchHasta = unAnioMas.toISOString().split(".")[0];

      const payloadLimite = {
        tipolimitesocioid: 0,
        socioid: finalSocioId,
        tipolimiteid:
          cleanData.tipoProducto === "cheque"
            ? 1
            : cleanData.tipoProducto === "prestamo"
              ? 2
              : 3,
        fchvigenciadesde: fchDesde,
        fchvigenciahasta: fchHasta,
        monedaid: Number(cleanData.moneda) || 5000,
        importelimite: importeEnPesos,
        importeutilizado: 0,
        tipolimiteestadoid: 9,
        observaciones: "",
        sucursalid: 0,
        terceromercadoid: 400004,
        destfondosid: 320,
        tipocomisionid: 0,
        porcentajecomision: 0,
        importecargado: importeEnPesos,
        avalid: 0,
        propuesta: "",
        resolucion: "",
        tipolimitesolicitudid: 1,
        importemonex:
          Number(cleanData.moneda) === 2 ? Math.round(montoLimpio) : 0,
        tipolibradorid: 2,
        contratoid: null,
        cadenavalorid: Number(cadenaSlug) || 0,
        equipocomercialid: null,
        solicitudid: solicitudIdCreada,
        tipolimiteriesgoid: 0,
        terceroviaid: 4000000,
        terceropresentanteid: null,
        tercerogeneradorid: 0,
      };

      await lineaService.crearLimiteSocio({ coleccionlinea: [payloadLimite] });

      if (cleanData.tipoProducto === "cheque") {
        setPasoActual(5);
      } else {
        setPasoActual(4);
      }
    } catch (error) {
      console.error("[ALTA OPERACION] Error en enviarSolicitud:", error);
      toast.error("Error al enviar", {
        description:
          "Hubo un error al enviar la solicitud. Revisá la consola para más detalles.",
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
      id: generarIdAleatorio(),
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
    navigate(`/${channelInfo?.id}/solicitudes`, { state: { nuevaSolicitud } });
  };

  const eliminarSocio = async (index) => {
    const socioTarget = socios[index];
    if (socioTarget.preloadedFromDb || socioTarget.relacion) {
      try {
        const ayer = new Date();
        ayer.setDate(ayer.getDate() - 1);
        const ayerStr = ayer.toISOString().split(".")[0];

        const payload = {
          ...socioTarget.relacion,
          fechahasta: ayerStr,
          FechaHasta: ayerStr,
        };
        await tercerosService.actualizarRelacionDeSocio(payload);
        toast.success("Socio desvinculado del legajo.");
      } catch (err) {
        console.error("Error al desvincular socio:", err);
        toast.error("Ocurrió un error al intentar desvincular al socio.");
        return;
      }
    }
    remove(index);
    if (socios.length === 1) {
      setValue("faseSocio", "ingresar_cuit");
    }
  };

  const toggleDoc = (seccion) => {
    setValue("docExpandido", docExpandido === seccion ? "" : seccion);
  };

  // ----- RENDERIZADO DINÁMICO DE PASOS -----
  const renderPasoDinamico = () => {
    if (pasoActual === 1) {
      return (
        <Paso4Socios
          socios={socios}
          eliminarSocio={eliminarSocio}
          continuarAlProximoPaso={handleContinuarSocios}
          socioIdActivo={socioIdActivo}
          archivosBackend={archivosBackend}
          cargarSociosDesdeDB={cargarSociosDesdeDB}
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
              setMostrarResultados(true);
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
            
            const isRepRequired = requisitos?.relaciones?.representantes === 1;
            const tieneRepresentantes = reps?.length > 0;
            const canAdvanceReps = !isRepRequired || tieneRepresentantes || requisitos?.relaciones?.representantes === 0;

            if (!canAdvanceReps && isRepRequired) {
              toast.error("Debe declarar al menos un representante legal o apoderado.");
              return;
            }

            if (ok && canAdvanceReps) {
              if (tipoProducto === "cheque" && requisitos?.relaciones?.agentesBolsa !== 0) {
                setPasoActual(4);
              } else if (tipoProducto === "cheque") {
                handleSubmit(onSubmitFinalCheques, (errors) => {
                  console.error("Errores de validación del schema:", errors);
                })();
              } else {
                handleSubmit(onSubmitFinalPrestamos, (errors) => {
                  console.error("Errores de validación del schema:", errors);
                })();
              }
            }
          }}
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

    let hitos = ["ACCIONISTAS", "MONTOS", "DOCUMENTOS"];
    let hitoActual = pasoActual - 1;

    if (tipoProducto === "cheque") {
      hitos = ["ACCIONISTAS", "MONTOS", "DOCUMENTOS", "BOLSA"];
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
          badge: "Alta de Línea",
          t: "Declaración de Accionistas",
          s: "Revisá y confirmá la composición accionaria.",
        };
      case 2:
        return {
          badge: "Alta de Línea",
          t: "Alta de Operación",
          s: "Seleccioná el tipo de operación y las condiciones.",
        };
      case 3:
        return {
          badge: "Alta de Línea",
          t: "Documentación Requerida",
          s: "Adjuntá los respaldos de la operación.",
        };
      case 4:
        return {
          badge: "Alta de Línea",
          t: "Sociedad de Bolsa",
          s: "Confirmá tu cuenta comitente.",
        };
      case 5:
        return {
          badge: "Alta de Línea",
          t: "Operación Confirmada",
          s: "La solicitud fue enviada con éxito.",
        };
      default:
        return { badge: "Alta de Línea", t: "Alta de Operación", s: "" };
    }
  };

  const stepToHitoMap = useMemo(() => {
    const map = [];
    if (requisitos?.relaciones?.accionistas !== 0) map.push(1);
    map.push(2);
    map.push(3);
    if (tipoProducto === "cheque" && requisitos?.relaciones?.agentesBolsa !== 0) {
      map.push(4);
    }
    return map;
  }, [requisitos, tipoProducto]);

  const hitoActualMapped = useMemo(() => {
    const idx = stepToHitoMap.indexOf(pasoActual);
    return idx !== -1 ? idx + 1 : 1;
  }, [stepToHitoMap, pasoActual]);

  const maxHitoAlcanzadoMapped = useMemo(() => {
    const idx = stepToHitoMap.indexOf(maxPasoAlcanzado);
    return idx !== -1 ? idx + 1 : 1;
  }, [stepToHitoMap, maxPasoAlcanzado]);

  const handleStepClickMapped = (hitoNum) => {
    const targetStep = stepToHitoMap[hitoNum - 1];
    if (targetStep) {
      setPasoActual(targetStep);
    }
  };

  const handleVolverMapped = () => {
    const currentIdx = stepToHitoMap.indexOf(pasoActual);
    if (currentIdx > 0) {
      setPasoActual(stepToHitoMap[currentIdx - 1]);
    }
  };

  const hitosVisuales = useMemo(() => {
    const list = [];
    if (requisitos?.relaciones?.accionistas !== 0) {
      list.push("Accionistas");
    }
    list.push("Operación");
    list.push("Documentos");
    if (tipoProducto === "cheque" && requisitos?.relaciones?.agentesBolsa !== 0) {
      list.push("Bolsa");
    }
    return list;
  }, [requisitos, tipoProducto]);

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
      <LoadingScreen
        title="Verificando acceso"
        message="Aguardá un momento mientras validamos tu sesión..."
        absolute={true}
      />
    );
  }

  if (buscandoSocios) {
    return (
      <LoadingScreen
        title="Buscando socios"
        message="Obteniendo la información de la empresa..."
        absolute={true}
      />
    );
  }

  // Eliminamos variables isOverlayLoading obsoletas.

  return (
    <div className={styles.operacionPage}>
      <div className={styles.formMainContainer}>
        <div className={styles.contentWrapper}>
          <div className={styles.contenedorPrincipal}>
            <div
              className={`${styles.columnaFormulario} ${!showHeaderYStepper ? styles.columnaCentrada : ""}`}
            >
              {showHeaderYStepper && (
                <BarraProgreso
                  hitos={hitosVisuales}
                  hitoActual={hitoActualMapped}
                  maxHitoAlcanzado={maxHitoAlcanzadoMapped}
                  onStepClick={handleStepClickMapped}
                  onVolver={mostrarBotonVolver ? handleVolverMapped : null}
                  onVolverInicio={
                    pasoActual === 1 || (requisitos?.relaciones?.accionistas === 0 && pasoActual === 2)
                      ? () => navigate(`/${channelInfo?.id}/solicitudes`)
                      : null
                  }
                  onReiniciar={handleClickReiniciar}
                />
              )}

              {showHeaderYStepper && (
                <div className={styles.bienvenidaHeader}>
                  {obtenerTextosCabecera().badge && (
                    <span className={styles.bienvenidaBadge}>
                      {obtenerTextosCabecera().badge}
                    </span>
                  )}
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
