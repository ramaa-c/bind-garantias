import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  useForm,
  FormProvider,
  useWatch,
  useFieldArray,
} from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { FiRotateCcw } from "react-icons/fi";
import { toast } from "sonner";
import { zodResolver } from "@hookform/resolvers/zod";
import { AltaOperacionSchema } from "../../../../schemas/AltaOperacionSchema";
import {
  useFormPersist,
  getPersistedFormData,
} from "../../../../hooks/useFormPersist";
import { BarraProgreso, BotonVolver, Button } from "../../../../components/ui";
import {
  Paso3Simulador,
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
import { cadenaValorService } from "../../../../services/cadenaValorService";
import { posicionConsolidadaService } from "../../../../services/posicionConsolidadaService";
import { afipService } from "../../../../services/afipService";
import { tercerosService } from "../../../../services/tercerosService";
import { catalogosService } from "../../../../services/catalogosService";
import { useChannel } from "../../../../context/ChannelContext";
import { useRequisitos } from "../../../../hooks/useRequisitos";
import { useObtenerLimitesCadenaValor } from "../../../../hooks/useLinea";
import { useObtenerTodasWeb } from "../../../../hooks/useCadenaValor";
import { useTiposProducto } from "../../../../hooks/useCatalogos";
import { useObtenerLimiteSocioPorCuit } from "../../../../hooks/usePosicionConsolidada";
import { useObtenerVariableParametrizacion } from "../../../../hooks/useVariablesParametrizacion";
import { useCdaEngine } from "../../../../hooks/useCdaEngine";
import { useObtenerPorNombreOEmail } from "../../../../hooks/useUsuario";
import { useAuthStore } from "../../../../store/useAuthStore";
import { PANTALLA_LINEAS } from "../../../../utils/pantallasCda";
import { useCadenaActiva } from "../../../../hooks/useCadenaActiva";

import {
  TERCERO_VIA_PLATAFORMA_PROPIA,
  ESTADO_PENDIENTE,
  ESTADO_RECHAZADA,
  MOTIVOS_RECHAZO_AUTOMATICO,
} from "../../../../utils/estadoLimiteSocio";

const STORAGE_KEY = "draft_alta_operacion_v2";

const generarIdAleatorio = () => String(Math.floor(Math.random() * 9000) + 1000);

export const AltaOperacion = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { basePath } = useChannel();
  const { cadenaSlug } = useCadenaActiva();

  const {
    cuitActivo,
    socioIdActivo,
    tipoPersonaId,
    nombreEmpresa,
    isLoading: isLoadingEmpresa,
  } = useEmpresaActiva();

  const { requisitos } = useRequisitos(Number(cadenaSlug), tipoPersonaId ?? null, nombreEmpresa);

  // Líneas reales de la cadena (TipoLimiteCadenaValor): reemplazan el viejo
  // selector hardcodeado "Cheques propios/Préstamos/Pagaré" - el usuario
  // elige directamente la línea configurada por el admin, con su propio
  // MontoLinea/ValoresPorDefecto. Solo las activas y aptas para nueva línea
  // pueden originar una solicitud nueva (así se definió AptaNuevaLinea).
  const { data: lineasCadenaData } = useObtenerLimitesCadenaValor(
    Number(cadenaSlug) || undefined,
  );

  // EquipoComercialID de la propia cadena: TipoLimiteSocio.EquipoComercialid
  // no puede viajar en null/0 (el backend lo persiste como 0, y al migrar la
  // línea a SGR+ eso rompe la FK_TipoLimiteSocio_Equipo contra
  // dbo.EquipoComercial). Se usa el de la cadena porque la solicitud nace
  // ahí, no de un vendedor asignado a mano.
  //
  // ⚠️ Antes esto se leía de useObtenerCadenaPorId (GET
  // CadenaValor/Obtener/{id}) — confirmado en vivo el 2026-08-14 que ESE
  // endpoint no devuelve EquipoComercialID en absoluto (devuelve
  // CadenaValorID/Denominacion/Descripcion/Moneda/MontoMaximo/Vigencia*/
  // Estado, nada más), así que equipoComercialCadena daba siempre 0 sin
  // importar lo que estuviera cargado en la cadena. GET api/cadenavalor
  // (la lista completa, la misma que usa ActivarCadenaModal/Dashboard) sí
  // lo trae, así que se resuelve desde ahí.
  const { data: cadenasWeb } = useObtenerTodasWeb();
  const equipoComercialCadena = useMemo(() => {
    const cadenaIdNum = Number(cadenaSlug) || 0;
    const cadena = (cadenasWeb || []).find(
      (c) => Number(c.cadenavalorid ?? c.CadenaValorID) === cadenaIdNum,
    );
    return Number(cadena?.equipocomercialid ?? cadena?.EquipoComercialID ?? 0);
  }, [cadenasWeb, cadenaSlug]);
  const lineasDisponibles = useMemo(() => {
    const arr = Array.isArray(lineasCadenaData) ? lineasCadenaData : [];
    return arr.filter(
      (l) => String(l.activa) === "1" && String(l.aptanuevalinea) === "1",
    );
  }, [lineasCadenaData]);

  // Catálogo global de TipoLimite: no tiene un campo "familia" propio
  // (cheque/préstamo/pagaré), así que se infiere por palabra clave de su
  // Descripcion - es la única señal real disponible, y de ella dependen el
  // paso de Sociedad de Bolsa, la documentación requerida y qué handler de
  // submit corre.
  const { data: tiposLimiteGlobal } = useTiposProducto();
  const familiaDeLinea = (tipoLimiteId) => {
    const item = tiposLimiteGlobal?.raw?.find(
      (t) => Number(t.tipolimiteid) === Number(tipoLimiteId),
    );
    const desc = (item?.descripcion || "").toUpperCase();
    if (desc.includes("CHEQUE")) return "cheque";
    if (desc.includes("PAGARE")) return "pagare";
    return "prestamo";
  };

  // Posición consolidada del socio (todas sus líneas, todas las cadenas):
  // fuente del "utilizado" para las reglas de monto por línea (ver más abajo,
  // efecto de auto-completado y enviarSolicitud).
  const { data: limitesSocioData } = useObtenerLimiteSocioPorCuit(cuitActivo);

  // Catálogo global de variables de parametrización de la plataforma (aún
  // solo tiene esta variable). No bloquea la carga de la solicitud: si el
  // monto pedido no llega al mínimo, se envía igual pero queda rechazada
  // automáticamente (ver enviarSolicitud).
  const { valor: porcentajeMinimoSolicitud } = useObtenerVariableParametrizacion(
    "PorcentajeMinimoSolicitud",
  );

  // UsuarioID requerido por cda/execute (ver useCdaEngine) - mismo patrón
  // que Paso1Cuit.jsx para resolver el UsuarioWebID del usuario logueado.
  const user = useAuthStore((state) => state.user);
  const { data: usuarioDb } = useObtenerPorNombreOEmail(user?.email);
  const usuarioWebId = usuarioDb?.usuariowebid || usuarioDb?.UsuarioWebID || usuarioDb?.id;
  const { ejecutarValidaciones } = useCdaEngine();

  const [enviandoSolicitud, setEnviandoSolicitud] = useState(false);
  const [mostrarResultados, setMostrarResultados] = useState(false);
  const [resumenSolicitud, setResumenSolicitud] = useState(null);
  const [isModalBorradorAbierto, setIsModalBorradorAbierto] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [buscandoSocios, setBuscandoSocios] = useState(false);
  const [resetKey, setResetKey] = useState(0);
  const [validandoAcceso, setValidandoAcceso] = useState(true);
  // Reemplaza el viejo patrón de toast + navigate: en vez de sacar al socio
  // de la pantalla, se le muestra el motivo en pantalla y se bloquea el botón
  // de continuar. Agrupa todos los motivos que impiden un alta nueva (ya
  // tiene una solicitud en análisis, o ya superó el % de utilización
  // permitido en alguna línea existente).
  const [bloqueoAcceso, setBloqueoAcceso] = useState({
    bloqueado: false,
    motivo: "",
  });

  useEffect(() => {
    const handler = () => setIsHelpOpen((prev) => !prev);
    document.addEventListener("bindHelp:toggle", handler);
    return () => document.removeEventListener("bindHelp:toggle", handler);
  }, []);

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
        const solicitudes =
          await solicitudesService.obtenerSolicitudesEnProceso(cuitActivo);
        const solicitudesArray = Array.isArray(solicitudes)
          ? solicitudes
          : solicitudes?.data || [];
        // El bloqueo es por PLATAFORMA de origen (TerceroViaID), no por
        // cadena: un socio puede tener varias solicitudes en curso al mismo
        // tiempo dentro de NUESTRA plataforma (4000000), en distintas
        // cadenas o incluso en la misma — lo único que hay que evitar es
        // dejarlo arrancar acá si ya tiene una en curso en OTRA plataforma,
        // sobre la que no tenemos control (confirmado con Victor el
        // 2026-08-13). Ver TERCERO_VIA_PLATAFORMA_PROPIA.
        //
        // Ya no hace falta mirar EstadoSolicitud acá: el backend borra la
        // fila de SolicitudEnProceso apenas deja de estar en Inicial o
        // EnProceso (confirmado el 2026-08-18) — que la fila exista ya
        // implica que sigue activa, sin importar el valor del campo.
        const tieneSolicitudEnProceso = solicitudesArray.some(
          (s) => Number(s.terceroviaid) !== TERCERO_VIA_PLATAFORMA_PROPIA,
        );

        if (tieneSolicitudEnProceso) {
          if (isMounted) {
            setBloqueoAcceso({
              bloqueado: true,
              motivo:
                "Ya tenés una solicitud de línea en análisis en otra plataforma.",
            });
            setValidandoAcceso(false);
          }
          return;
        }

        // Chequeo por línea: ninguna línea EXISTENTE del socio en esta
        // cadena puede tener su propio Utilizado/Límite por encima de
        // CadenaValor.PorcentajeMaximoUtilizado (chequeo por línea
        // individual, no agregado - así lo evalúa el excel de referencia).
        // Va junto con el resto de los motivos que bloquean el alta (arriba).
        try {
          const cuitLimpio = String(cuitActivo).replace(/\D/g, "");
          const [lineasSocio, cadenaData] = await Promise.all([
            posicionConsolidadaService.obtenerLimiteSocioPorCuit(cuitLimpio),
            cadenaValorService.obtenerPorId(Number(cadenaSlug)),
          ]);

          const lineasArr = Array.isArray(lineasSocio) ? lineasSocio : [];
          const lineasCadena = lineasArr.filter(
            (l) => Number(l.cadenavalorid) === Number(cadenaSlug),
          );
          const porcentajeMaximoCadena = Number(
            cadenaData?.porcentajemaximoutilizado ??
              cadenaData?.PorcentajeMaximoUtilizado ??
              0,
          );

          if (porcentajeMaximoCadena > 0) {
            const lineaExcedida = lineasCadena.find((l) => {
              const limiteLinea = Number(l.importelimite) || 0;
              if (limiteLinea <= 0) return false;
              const utilizadoLinea = Number(l.importeutilizado) || 0;
              return (
                (utilizadoLinea / limiteLinea) * 100 > porcentajeMaximoCadena
              );
            });

            if (lineaExcedida && isMounted) {
              setBloqueoAcceso({
                bloqueado: true,
                motivo: `Una línea existente (${lineaExcedida.descripcion || "sin descripción"}) ya superó el ${porcentajeMaximoCadena}% de utilización permitido.`,
              });
              setValidandoAcceso(false);
              return;
            }
          }

          // Chequeo agregado: la suma de lo utilizado entre todas las líneas
          // de esta cadena no puede superar CadenaValor.MontoMaximoUtilizado.
          // A diferencia del chequeo por línea, este es independiente del
          // monto que se vaya a pedir en la nueva solicitud - si ya está en
          // el tope, se bloquea el alta directamente (no se topea el monto).
          const montoMaximoUtilizadoCadena = Number(
            cadenaData?.montomaximoutilizado ??
              cadenaData?.MontoMaximoUtilizado ??
              0,
          );

          if (montoMaximoUtilizadoCadena > 0) {
            const utilizadoTotalCadena = lineasCadena.reduce(
              (acc, l) => acc + (Number(l.importeutilizado) || 0),
              0,
            );

            if (utilizadoTotalCadena > montoMaximoUtilizadoCadena && isMounted) {
              setBloqueoAcceso({
                bloqueado: true,
                motivo: "Ya se alcanzó el monto máximo utilizado permitido para esta cadena.",
              });
              setValidandoAcceso(false);
              return;
            }
          }
        } catch (validacionError) {
          console.error(
            "[ALTA OPERACION] Error al validar utilización por línea:",
            validacionError,
          );
        }

        if (isMounted) setValidandoAcceso(false);
      } catch {
        if (isMounted) setValidandoAcceso(false);
      }
    };

    verificarAcceso();
    return () => {
      isMounted = false;
    };
  }, [cuitActivo, isLoadingEmpresa, cadenaSlug]);


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
      familiaProducto: "",
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

  const { fields: socios } = useFieldArray({
    control,
    name: "socios",
  });

  const tipoProducto = useWatch({ control, name: "tipoProducto" });
  const familiaProducto = useWatch({ control, name: "familiaProducto" });
  const moneda = useWatch({ control, name: "moneda" });
  const docExpandido = useWatch({ control, name: "docExpandido" });

  // Línea real (TipoLimiteCadenaValor) que corresponde al tipoProducto
  // elegido - tipoProducto ahora es el TipoLimiteCadenaValorID, no un
  // string "cheque"/"prestamo"/"pagare".
  const lineaSeleccionada = useMemo(
    () =>
      lineasDisponibles.find(
        (l) => String(l.tipolimitecadenavalorid) === String(tipoProducto),
      ),
    [lineasDisponibles, tipoProducto],
  );

  useEffect(() => {
    const familia = lineaSeleccionada
      ? familiaDeLinea(lineaSeleccionada.tipolimiteid)
      : "";
    setValue("familiaProducto", familia);
    // familiaDeLinea se recalcula cada render a partir de tiposLimiteGlobal,
    // que sí está en las deps - no hace falta agregar la función en sí.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lineaSeleccionada, tiposLimiteGlobal, setValue]);

  // Utilizado del socio para esta línea puntual (mismo TipoLimiteID, misma
  // cadena) - sale de PosicionConsolidada/ObtenerLimiteSocio, sumando todas
  // las TipoLimiteSocio existentes para esa combinación.
  const utilizadoLineaSeleccionada = useMemo(() => {
    if (!lineaSeleccionada) return 0;
    const arr = Array.isArray(limitesSocioData) ? limitesSocioData : [];
    return arr
      .filter(
        (l) =>
          Number(l.cadenavalorid) === Number(cadenaSlug) &&
          Number(l.tipolimiteid) === Number(lineaSeleccionada.tipolimiteid),
      )
      .reduce((acc, l) => acc + (Number(l.importeutilizado) || 0), 0);
  }, [limitesSocioData, lineaSeleccionada, cadenaSlug]);

  const esMontoUnico = String(lineaSeleccionada?.valorespordefecto) === "1";

  // Regla: si la línea es de Monto Único, la solicitud se autocompleta con
  // MontoLinea - utilizado y el socio no puede modificarlo (ver disableMonto
  // en el <Paso3Simulador> más abajo).
  useEffect(() => {
    if (!lineaSeleccionada || !esMontoUnico) return;
    const montoLineaNum = Number(lineaSeleccionada.montolinea) || 0;
    const disponibleLinea = Math.max(
      0,
      montoLineaNum - utilizadoLineaSeleccionada,
    );
    setValue("monto", disponibleLinea, { shouldValidate: true });
  }, [lineaSeleccionada, esMontoUnico, utilizadoLineaSeleccionada, setValue]);

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
        const socioActual = await sociosService.obtenerSocioPorId(socioIdActivo);
        const emailFact = socioActual?.emailfacturacion || "";
        if (emailFact && !getValues("emailFacturacion")) {
          setValue("emailFacturacion", emailFact);
        }
      } catch (err) {
        console.warn("No se pudo obtener el email de facturación del socio:", err);
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
          } catch {
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
                } catch {
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

                const calleRep = tercero.calle || tercero.Calle || "";
                representantesCargados.push({
                  id: terceroId,
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
                  celular:
                    tercero.telefono || tercero.Telefono || rel.telefono || "",
                  direccion: calleRep || tercero.direccion || "",
                  calle: calleRep,
                  numero: tercero.numero || 0,
                  piso: tercero.piso || "",
                  departamento: tercero.departamento || "",
                  ciudad: tercero.ciudad || "",
                  ciudadid: tercero.ciudadid || 0,
                  codpos: tercero.codpos || "",
                  provinciaid: rel.provinciaid || tercero.provinciaid || "",
                  preloadedFromDb: true,
                  relacion: rel,
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
      familiaProducto: "",
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
    setResumenSolicitud(null);
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
      faseSocio: _faseSocio,
      tempSocioCuit: _tempSocioCuit,
      tempSocioNombre: _tempSocioNombre,
      tempSocioParticipacion: _tempSocioParticipacion,
      tempSocioData: _tempSocioData,
      docExpandido: _docExpandido,
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

      if (!lineaSeleccionada) {
        toast.error("Error al enviar", {
          description: "No se pudo determinar la línea de crédito seleccionada.",
        });
        setEnviandoSolicitud(false);
        return;
      }
      const tipoLimiteIdReal = Number(lineaSeleccionada.tipolimiteid) || 0;
      const montoLineaReal = Number(lineaSeleccionada.montolinea) || 0;

      let montoLimpio = Number(cleanData.monto) || 0;

      // Regla: el monto ingresado (antes de descontar lo utilizado) nunca
      // puede superar el Monto de la Línea.
      if (montoLineaReal > 0 && montoLimpio > montoLineaReal) {
        toast.error("Monto no disponible", {
          description: `El monto ingresado supera el máximo de la línea (${montoLineaReal.toLocaleString("es-AR")}).`,
        });
        setEnviandoSolicitud(false);
        return;
      }

      // Si la línea NO es de Monto Único, lo que efectivamente se solicita
      // es el monto ingresado neto de lo ya utilizado en esa línea (no el
      // monto ingresado a secas). Si es Monto Único, montoLimpio ya llega
      // autocompletado como MontoLinea - utilizado (ver efecto más arriba),
      // así que no hace falta restar de nuevo.
      if (!esMontoUnico) {
        montoLimpio = montoLimpio - utilizadoLineaSeleccionada;
      }

      if (montoLimpio <= 0) {
        toast.error("Monto no disponible", {
          description: "El monto solicitado ya está cubierto por lo utilizado en esta línea.",
        });
        setEnviandoSolicitud(false);
        return;
      }

      // Regla: el monto solicitado debe representar al menos el
      // PorcentajeMinimoSolicitud de la línea. No impide cargar la
      // solicitud: si no lo alcanza, se guarda directamente rechazada y el
      // motivo queda visible en DetalleSolicitudModal (no se avisa acá).
      const porcentajeSolicitado =
        montoLineaReal > 0 ? (montoLimpio / montoLineaReal) * 100 : 100;
      const noAlcanzaMinimo =
        porcentajeMinimoSolicitud > 0 &&
        porcentajeSolicitado < porcentajeMinimoSolicitud;

      // Regla: CDA de PANTALLA_LINEAS sobre la línea elegida (vinculado por
      // cadena entera en LineasCda.jsx, ver CdaPanel.jsx). Mismo criterio
      // que PorcentajeMinimoSolicitud: no impide cargar la solicitud, si
      // rechaza se envía igual pero queda rechazada automáticamente. Se
      // reusa el motor ya probado en el onboarding (useCdaEngine), pasando
      // LineaID en vez de SocioID/TerceroID - es el mismo parámetro real
      // que ya acepta cda/execute. Un error de sistema o "pendiente"
      // (integración caída) NO rechaza, se deja pasar igual que en el resto
      // de los CDAs de la app - solo un rechazo de negocio real bloquea.
      const resultCdaLinea = await ejecutarValidaciones(
        PANTALLA_LINEAS,
        { lineaId: tipoLimiteIdReal },
        Number(cadenaSlug),
        usuarioWebId,
      );
      const rechazosCdaLinea = resultCdaLinea.success
        ? []
        : resultCdaLinea.errors.filter(
            (e) => e.isInvalidante && !e.isPendiente && !e.isSystemError,
          );
      const cdaLineaRechazada = rechazosCdaLinea.length > 0;

      const debeRechazarseAutomaticamente = noAlcanzaMinimo || cdaLineaRechazada;
      const motivoRechazoAutomatico = noAlcanzaMinimo
        ? MOTIVOS_RECHAZO_AUTOMATICO.PORCENTAJE_MINIMO_SOLICITUD
        : rechazosCdaLinea.map((e) => e.message).join("; ");

      // Convertido a pesos ANTES de crear nada: si la validación de cupo de
      // la cadena (más abajo) rechaza la operación, no queremos dejar una
      // SolicitudEnProceso huérfana sin línea asociada.
      let importeEnPesos = Math.round(montoLimpio);
      if (Number(cleanData.moneda) === 2) {
        const ayer = new Date();
        ayer.setDate(ayer.getDate() - 1);
        const fechaCotizacion = ayer.toISOString().split("T")[0];
        try {
          const cotizacionData = await catalogosService.obtenerCotizacion({
            moneda: 2,
            fecha: fechaCotizacion,
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
        } catch {
          // Fallback: si no se puede obtener la cotización, se omite la conversión a pesos
        }
      }

      // El chequeo del disponible agregado de la cadena (MontoMaximoUtilizado)
      // ya se validó al entrar a la pantalla (ver verificarAcceso) - si ya
      // estaba en el tope, el alta queda bloqueada antes de llegar acá.

      const unAnioMasRel = new Date();
      unAnioMasRel.setFullYear(unAnioMasRel.getFullYear() + 1);
      const unAnioMasStr = unAnioMasRel.toISOString().split(".")[0];

      // Si ya sabemos que se rechaza (CDA de línea / PorcentajeMinimoSolicitud,
      // ver debeRechazarseAutomaticamente más arriba), directamente no se crea
      // la SolicitudEnProceso: no tiene sentido mandarla "EnProceso" al core
      // para un pedido que el propio frontend ya rechazó, y hacerlo dejaba una
      // fila fantasma que nada volvía a actualizar — "Mis Solicitudes"
      // terminaba mostrando la misma solicitud dos veces con estados
      // contradictorios (una "Pendiente" huérfana, otra "Rechazada" real).
      // Reportado y decidido con el equipo el 2026-08-27. solicitudIdCreada
      // queda en 0 acá y se completa más abajo con el ID del TipoLimiteSocio
      // real una vez creado, para seguir teniendo un "N° de solicitud" que
      // mostrar en el resumen de éxito.
      let solicitudIdCreada = 0;

      if (!debeRechazarseAutomaticamente) {
        const payload = {
          solicitudenprocesoid: 0,
          fechacarga: new Date().toISOString().split(".")[0],
          cuit: cuitLimpio,
          tipolimiteid: tipoLimiteIdReal,
          cadenavalorid: Number(cadenaSlug),
          monedaid: Number(cleanData.moneda) || 5000,
          importe: montoLimpio,
          // EstadoSolicitud=2 (EnProceso): la solicitud se está enviando con
          // éxito y queda esperando la respuesta del administrador — no es
          // un simple "Inicial" (1), que quedaría reservado para un estado
          // previo al envío que este flujo no tiene (confirmado con el
          // equipo el 2026-08-18). Ver mapearAEstadoSolicitudEnProceso en
          // utils/estadoLimiteSocio.js para el resto del catálogo.
          estadosolicitud: 2,
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
        solicitudIdCreada =
          resSolicitud?.solicitudenprocesoid || resSolicitud?.id || 0;
      }

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

      const fchDesde = new Date().toISOString().split(".")[0];
      const unAnioMas = new Date();
      unAnioMas.setFullYear(unAnioMas.getFullYear() + 1);
      const fchHasta = unAnioMas.toISOString().split(".")[0];

      const payloadLimite = {
        tipolimitesocioid: 0,
        socioid: finalSocioId,
        tipolimiteid: tipoLimiteIdReal,
        fchvigenciadesde: fchDesde,
        fchvigenciahasta: fchHasta,
        monedaid: Number(cleanData.moneda) || 5000,
        importelimite: importeEnPesos,
        importeutilizado: 0,
        // Nuestro propio estado de aprobación (ver utils/estadoLimiteSocio),
        // no el TipoLimiteEstadoID heredado de SGR+. Si no llegó al
        // PorcentajeMinimoSolicitud o el CDA de la línea rechazó, queda
        // rechazada automáticamente.
        tipolimiteestadoid: debeRechazarseAutomaticamente ? ESTADO_RECHAZADA : ESTADO_PENDIENTE,
        observaciones: debeRechazarseAutomaticamente ? motivoRechazoAutomatico : "",
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
          Number(cleanData.moneda) === 2
            ? Math.round(montoLimpio)
            : importeEnPesos,
        tipolibradorid: 2,
        contratoid: null,
        cadenavalorid: Number(cadenaSlug) || 0,
        equipocomercialid: equipoComercialCadena || null,
        // Pedido explícito: TipoLimiteSocio.SolicitudID siempre en NULL, no
        // el SolicitudEnProcesoID recién creado (ver solicitudIdCreada, que
        // sigue usándose para el resumen y como referencia en pantalla).
        solicitudid: null,
        tipolimiteriesgoid: 0,
        terceroviaid: 4000000,
        terceropresentanteid: null,
        tercerogeneradorid: 0,
      };

      const resLimite = await lineaService.crearLimiteSocio(payloadLimite);

      // No hay SolicitudEnProceso de la cual sacar un ID (ver más arriba):
      // se usa el ID del TipoLimiteSocio recién creado, que es exactamente
      // el mismo tipo de número que ya se muestra como "N° de solicitud"
      // para las solicitudes reales en Solicitudes.jsx.
      if (debeRechazarseAutomaticamente) {
        solicitudIdCreada = resLimite?.tipolimitesocioid || resLimite?.id || 0;
      }

      // AltaOperacion crea la solicitud vía servicios directos, no
      // mutaciones de react-query - sin esto, Solicitudes.jsx (que sí
      // cachea con staleTime de 5min) sigue mostrando la lista vieja al
      // volver, hasta un F5 que reinicia toda la cache. Por prefijo (sin el
      // cuit/socioId final) para no depender de que viaje representado
      // exactamente igual en ambos lugares.
      queryClient.invalidateQueries({ queryKey: ["solicitudes", "en-proceso"] });
      queryClient.invalidateQueries({ queryKey: ["limites", "socio"] });

      setResumenSolicitud({
        id: solicitudIdCreada,
        linea: lineaSeleccionada?.descripcion || "",
        monto: montoLimpio,
        monedaId: Number(cleanData.moneda) || 5000,
        plazo: cleanData.plazo,
      });

      if (cleanData.familiaProducto === "cheque") {
        setPasoActual(4);
      } else {
        setPasoActual(3);
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
        data.familiaProducto === "cheque"
          ? "Cheque"
          : data.familiaProducto === "pagare"
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
    navigate(`${basePath}/solicitudes`, { state: { nuevaSolicitud } });
  };

  const toggleDoc = (seccion) => {
    setValue("docExpandido", docExpandido === seccion ? "" : seccion);
  };

  // ----- RENDERIZADO DINÁMICO DE PASOS -----
  const renderPasoDinamico = () => {
    if (pasoActual === 1) {
      const opcionesMoneda = [
        { value: "5000", label: "Pesos ($)" },
        { value: "2", label: "Dólar (U$D)" },
      ];

      // El selector "Tipo de producto" ahora lista las líneas reales de la
      // cadena (TipoLimiteCadenaValor), acotadas a la moneda elegida - ya
      // no es un set fijo de "cheque/prestamo/pagare".
      const opcionesProducto = lineasDisponibles
        .filter((l) => Number(l.monedalineaid) === Number(moneda))
        .map((l) => ({
          value: String(l.tipolimitecadenavalorid),
          label: l.descripcion || `Línea #${l.tipolimitecadenavalorid}`,
        }));

      const mostrarTipoCalculo = familiaProducto === "cheque";
      const opcionesCalculo = mostrarTipoCalculo
        ? [
            { value: "monto_factura", label: "por monto de factura" },
            { value: "monto_cheque", label: "por monto de cheque" },
          ]
        : [];

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
          onContinuar={() => setPasoActual(2)}
          onCancelar={() => setMostrarResultados(false)}
          opcionesMoneda={opcionesMoneda}
          opcionesProducto={opcionesProducto}
          opcionesCalculo={opcionesCalculo}
          mostrarTipoCalculo={mostrarTipoCalculo}
          disableMonto={esMontoUnico}
          montoMaximoOverride={Number(lineaSeleccionada?.montolinea) || undefined}
          labelFecha="Plazo estimado"
          labelMonto="Monto requerido"
        />
      );
    }

    if (pasoActual === 2) {
      return (
        <Paso5Documentacion
          docExpandido={docExpandido}
          toggleDoc={toggleDoc}
          socios={socios}
          onVolverASocios={() => setPasoActual(1)}
          avanzarPaso6={async () => {
            const ok = await trigger("emailFacturacion");
            const reps = getValues("representantes");
            
            // Apoderado (210) y Representante Legal (230) son requisitos
            // independientes desde la parametrización - acá se combinan
            // porque este paso todavía junta la carga de ambos roles en
            // un solo bloque (ver Paso5Documentacion).
            const repLegalAplica = Number(tipoPersonaId) !== 1;
            const isRepRequired =
              requisitos?.relaciones?.apoderados === 1 ||
              (repLegalAplica && requisitos?.relaciones?.representanteLegal === 1);
            const tieneRepresentantes = reps?.length > 0;
            const canAdvanceReps = !isRepRequired || tieneRepresentantes;

            if (!canAdvanceReps && isRepRequired) {
              toast.error("Debe declarar al menos un representante legal o apoderado.");
              return;
            }

            if (ok && canAdvanceReps) {
              if (familiaProducto === "cheque" && requisitos?.relaciones?.agentesBolsa !== 0) {
                setPasoActual(3);
              } else if (familiaProducto === "cheque") {
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

    if (familiaProducto === "cheque") {
      if (pasoActual === 3) {
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
      if (pasoActual === 4)
        return (
          <Paso7Exito
            resumen={resumenSolicitud}
            onVolverInicio={handleIrASolicitudes}
          />
        );
    } else if (familiaProducto === "prestamo" || familiaProducto === "pagare") {
      if (pasoActual === 3)
        return (
          <Paso7Exito
            resumen={resumenSolicitud}
            onVolverInicio={handleIrASolicitudes}
          />
        );
    }

    return null;
  };

  const obtenerTextosCabecera = () => {
    switch (pasoActual) {
      case 1:
        return {
          badge: "Alta de Línea",
          t: "Alta de Operación",
          s: "Seleccioná el tipo de operación y las condiciones.",
        };
      case 2:
        return {
          badge: "Alta de Línea",
          t: "Documentación Requerida",
          s: "Adjuntá los respaldos de la operación.",
        };
      case 3:
        return {
          badge: "Alta de Línea",
          t: "Sociedad de Bolsa",
          s: "Confirmá tu cuenta comitente.",
        };
      case 4:
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
    const map = [1, 2];
    if (familiaProducto === "cheque" && requisitos?.relaciones?.agentesBolsa !== 0) {
      map.push(3);
    }
    return map;
  }, [requisitos, familiaProducto]);

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
    const list = ["Operación", "Documentos"];
    if (familiaProducto === "cheque" && requisitos?.relaciones?.agentesBolsa !== 0) {
      list.push("Bolsa");
    }
    return list;
  }, [requisitos, familiaProducto]);

  const showHeaderYStepper =
    !(pasoActual === 4 && familiaProducto === "cheque") &&
    !(
      pasoActual === 3 &&
      (familiaProducto === "prestamo" || familiaProducto === "pagare")
    );

  const mostrarBotonVolver =
    pasoActual > 1 &&
    !(pasoActual === 4 && familiaProducto === "cheque") &&
    !(
      pasoActual === 3 &&
      (familiaProducto === "prestamo" || familiaProducto === "pagare")
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

  // En vez de sacar al socio de la pantalla con un toast + navigate, se
  // muestra el motivo en pantalla y se bloquea la acción de continuar - así
  // no queda la sensación de un error inesperado, sino de una funcionalidad
  // temporalmente no disponible.
  if (bloqueoAcceso.bloqueado) {
    return (
      <div className={styles.operacionPage}>
        <div className={styles.formMainContainer}>
          <div className={styles.contentWrapper}>
            <div className={styles.bloqueoCard}>
              <h2 className={styles.bloqueoTitulo}>
                Alta de operación no disponible
              </h2>
              <Alert variant="warning">
                Por el momento no está disponible esta funcionalidad.
                Comunicate con el equipo de soporte para más información.
                {bloqueoAcceso.motivo ? ` (${bloqueoAcceso.motivo})` : ""}
              </Alert>
              <Button variant="primary" disabled className={styles.bloqueoBoton}>
                Continuar
              </Button>
            </div>
          </div>
        </div>
      </div>
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
                    pasoActual === 1
                      ? () => navigate(`${basePath}/solicitudes`)
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
