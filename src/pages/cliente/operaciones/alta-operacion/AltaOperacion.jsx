import React, { useState, useEffect, useLayoutEffect, useMemo } from "react";
import { useForm, FormProvider, useWatch } from "react-hook-form";
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
  Paso7Exito,
  ConfirmacionBorradorModal,
} from "../../../../components/features";
import { HelpDrawer } from "../../../../components/layout/Client/HelpDrawer/HelpDrawer";
import { Alert, Spinner, LoadingScreen } from "../../../../components/ui";
import styles from "./AltaOperacion.module.css";
import { solicitudesService } from "../../../../services/solicitudesService";
import { useEmpresaActiva } from "../../../../hooks/useEmpresaActiva";
import { lineaService } from "../../../../services/lineaService";
import { cadenaValorService } from "../../../../services/cadenaValorService";
import { posicionConsolidadaService } from "../../../../services/posicionConsolidadaService";
import { catalogosService } from "../../../../services/catalogosService";
import { useChannel } from "../../../../context/useChannel";
import { useObtenerLimitesCadenaValor } from "../../../../hooks/useLinea";
import { useObtenerTodasWeb } from "../../../../hooks/useCadenaValor";
import { useTiposProducto, useMonedas } from "../../../../hooks/useCatalogos";
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
  construirMotivoRechazoAutomatico,
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
    isLoading: isLoadingEmpresa,
  } = useEmpresaActiva();

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
  const { data: monedasCatalogo } = useMonedas();
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
  // pasoActual queda en sessionStorage (ver useFormPersist), así que un
  // refresh en el paso de Éxito lo restaura en 2 - pero resumenSolicitud es
  // un useState aparte, nunca persistido, y volvía a null en ese refresh:
  // la tarjeta de "Resumen de tu solicitud" desaparecía sin que nada la
  // reemplazara (reportado el 2026-09-17). Se persiste con la misma
  // STORAGE_KEY del resto del borrador.
  const [resumenSolicitud, setResumenSolicitud] = useState(() => {
    try {
      const guardado = sessionStorage.getItem(`${STORAGE_KEY}_resumen`);
      return guardado ? JSON.parse(guardado) : null;
    } catch {
      return null;
    }
  });
  const [isModalBorradorAbierto, setIsModalBorradorAbierto] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
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

  useEffect(() => {
    if (resumenSolicitud) {
      sessionStorage.setItem(
        `${STORAGE_KEY}_resumen`,
        JSON.stringify(resumenSolicitud),
      );
    } else {
      sessionStorage.removeItem(`${STORAGE_KEY}_resumen`);
    }
  }, [resumenSolicitud]);

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
        // Este gate inicial solo bloquea por PLATAFORMA de origen
        // (TerceroViaID) ajena a la nuestra (4000000), sobre la que no
        // tenemos control (confirmado con Victor el 2026-08-13, ver
        // TERCERO_VIA_PLATAFORMA_PROPIA) — acá todavía no se sabe qué línea
        // ni qué cadena va a elegir el socio, así que no se puede aplicar
        // todavía la regla más fina de "mismo TipoLimiteID + misma
        // CadenaValorID" (esa se chequea más abajo, en enviarSolicitud, una
        // vez elegida la línea). Un socio SÍ puede tener en curso, al mismo
        // tiempo, solicitudes de tipos distintos, o el mismo tipo en otra
        // cadena — lo que no puede es repetir la misma combinación
        // (TipoLimiteID, CadenaValorID) vigente a la vez (confirmado por
        // Victor, 2026-09-15).
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
    }),
  });

  const { handleSubmit, trigger, control, setValue, getValues, watch } =
    metodosFormulario;

  const { pasoActual, setPasoActual, clearStorage } = useFormPersist({
    storageKey: STORAGE_KEY,
    watch,
  });

  const tipoProducto = useWatch({ control, name: "tipoProducto" });
  const familiaProducto = useWatch({ control, name: "familiaProducto" });
  const moneda = useWatch({ control, name: "moneda" });

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
    });
    setPasoActual(1);
    setMostrarResultados(false);
    setResumenSolicitud(null);
  };

  // El paso 2 (Éxito) es terminal: no hay nada para "retomar" ahí, a
  // diferencia del paso 1 (un formulario a medio llenar, donde sí tiene
  // sentido el draft). Si sessionStorage quedó con pasoActual=2 de una
  // solicitud ya enviada - por haber salido del wizard sin tocar "Volver a
  // la lista de solicitudes" (ej. navegando por el Sidebar) - la próxima
  // vez que se entra a este flujo (ej. "Nueva Operación" desde
  // Solicitudes.jsx) mostraba de nuevo esa pantalla de éxito vieja, con el
  // resumen de la solicitud anterior, en vez de arrancar un alta nueva
  // (reportado el 2026-09-17, justo después de cancelar una solicitud).
  // useLayoutEffect (no useEffect) para que el reset corra antes del primer
  // paint y no llegue a mostrarse ese resumen viejo ni un instante.
  useLayoutEffect(() => {
    if (pasoActual === 2) {
      handleResetFlujoCompleto();
    }
    // Solo al montar: es una corrección de un estado heredado de
    // sessionStorage, no algo que deba repetirse en cada cambio de paso.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  const enviarSolicitud = async (data) => {
    // Guarda de reentrada: el botón de "Continuar" recién queda disabled
    // (isSubmitting, ver TicketPrestamoFijo/TicketSimulacion) cuando React
    // termina de re-renderizar con enviandoSolicitud=true — pero antes de
    // eso, handleSubmit(onSubmitFinal) ya corrió la validación (async) y
    // llegó hasta acá. Un segundo click en esa ventana (usuario impaciente,
    // doble click, doble tap en mobile) disparaba esta misma función de
    // nuevo mientras la primera seguía en curso, y las dos terminaban
    // posteando la misma solicitud por separado — confirmado en vivo con
    // dos TipoLimiteSocio idénticos para el mismo alta (CUIT 30708216263,
    // 2026-09-14).
    if (enviandoSolicitud) return;
    setEnviandoSolicitud(true);
    try {
      const cleanData = data;
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

      // El email de facturación del socio ya se carga y valida desde el
      // Legajo (ver PerfilModal) - este wizard dejó de pedirlo/persistirlo
      // (cambio de flujo 2026-09-14, junto con sacar Documentos/Sociedad de
      // Bolsa de acá, ver Paso3Simulador más abajo).

      if (!lineaSeleccionada) {
        toast.error("Error al enviar", {
          description: "No se pudo determinar la línea de crédito seleccionada.",
        });
        setEnviandoSolicitud(false);
        return;
      }
      const tipoLimiteIdReal = Number(lineaSeleccionada.tipolimiteid) || 0;
      const montoLineaReal = Number(lineaSeleccionada.montolinea) || 0;

      // El chequeo de "ya tenés una solicitud en curso para esta línea"
      // (mismo TipoLimiteID + CadenaValorID, confirmado por Victor el
      // 2026-09-15) ya no se hace acá: se controla antes, en el botón
      // "Nueva Operación" de Solicitudes.jsx, para no dejar completar todo
      // el wizard y enterarse recién al final (ver tieneSolicitudPendiente
      // ahí).
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
      const motivoRechazoAutomatico = construirMotivoRechazoAutomatico(
        noAlcanzaMinimo
          ? MOTIVOS_RECHAZO_AUTOMATICO.PORCENTAJE_MINIMO_SOLICITUD
          : rechazosCdaLinea.map((e) => e.message).join("; "),
      );

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

      // Criterio confirmado por Victor (14/8/2026): el POST a
      // SolicitudEnProceso se hace SIEMPRE al dar de alta, sin importar si
      // el propio frontend ya sabe que la va a rechazar (CDA de línea /
      // PorcentajeMinimoSolicitud, ver debeRechazarseAutomaticamente más
      // arriba) — es lo que le avisa al resto del sistema que algo entró.
      // Lo que hay que hacer con un rechazo automático es informarlo con un
      // PUT a Cancelado (4) apenas se crea (ver más abajo): "el PUT mismo
      // cuando recibe un estado 3, 4 o 5 lo elimina de la tabla" de
      // SolicitudEnProceso — en TipoLimiteSocio (el registro real, creado
      // más abajo) siempre queda. Antes se saltaba directamente el POST para
      // este caso; evitaba el síntoma (fila fantasma en "Mis Solicitudes")
      // pero no seguía el flujo real esperado por el backend.
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
        terceropresentanteid: 0,
      };

      console.log(
        "[ALTA OPERACION] Payload enviado a crearSolicitudEnProceso:",
        JSON.stringify(payload, null, 2),
      );

      // sgrplus/SolicitudEnProceso no devuelve el ID creado en el body del
      // POST - devuelve el string plano "Solicitud guardada con exito"
      // (confirmado en vivo el 2026-09-15), así que el rechazo automático no
      // puede depender de un ID recién creado (nunca llegaba a dispararse,
      // dejando la fila fantasma "en proceso" para siempre - reportado en
      // vivo, CUIT 30711422753). Se ubica la fila igual que en
      // Dashboard.jsx/Solicitudes.jsx: por (Cuit, TipoLimiteID, CadenaValorID).
      await solicitudesService.crearSolicitudEnProceso(payload);

      if (debeRechazarseAutomaticamente) {
        try {
          await solicitudesService.sincronizarEstadoSolicitudEnProcesoPorClave(
            cuitLimpio,
            tipoLimiteIdReal,
            Number(cadenaSlug),
            ESTADO_RECHAZADA,
          );
        } catch (putError) {
          console.error(
            "[ALTA OPERACION] No se pudo informar el rechazo automático en SolicitudEnProceso:",
            putError,
          );
        }
      }

      // Agente de bolsa, apoderados/representantes y accionistas ya no se
      // gestionan desde este wizard (cambio de flujo 2026-09-14) - se cargan
      // y persisten enteramente desde el Legajo (SociosLegajo), antes de
      // llegar acá.

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
        // Pedido explícito: TipoLimiteSocio.SolicitudID siempre en NULL.
        solicitudid: null,
        tipolimiteriesgoid: 0,
        terceroviaid: 4000000,
        terceropresentanteid: null,
        tercerogeneradorid: 0,
      };

      const resLimite = await lineaService.crearLimiteSocio(payloadLimite);
      const tipoLimiteSocioIdCreado =
        resLimite?.tipolimitesocioid || resLimite?.id || 0;

      // AltaOperacion crea la solicitud vía servicios directos, no
      // mutaciones de react-query - sin esto, Solicitudes.jsx (que sí
      // cachea con staleTime de 5min) sigue mostrando la lista vieja al
      // volver, hasta un F5 que reinicia toda la cache. Por prefijo (sin el
      // cuit/socioId final) para no depender de que viaje representado
      // exactamente igual en ambos lugares.
      queryClient.invalidateQueries({ queryKey: ["solicitudes", "en-proceso"] });
      queryClient.invalidateQueries({ queryKey: ["limites", "socio"] });

      setResumenSolicitud({
        id: tipoLimiteSocioIdCreado,
        linea: lineaSeleccionada?.descripcion || "",
        monto: montoLimpio,
        monedaId: Number(cleanData.moneda) || 5000,
        plazo: cleanData.plazo,
      });

      setPasoActual(2);
    } catch (error) {
      console.error("[ALTA OPERACION] Error en enviarSolicitud:", error);
      toast.error("Error al enviar", {
        description:
          "Ocurrió un error al enviar la solicitud. Intentá nuevamente en unos minutos.",
      });
    } finally {
      setEnviandoSolicitud(false);
    }
  };

  const onSubmitFinal = () => {
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

  // ----- RENDERIZADO DINÁMICO DE PASOS -----
  const renderPasoDinamico = () => {
    if (pasoActual === 1) {
      // Antes esto era un par fijo (Pesos/Dólar) sin importar qué líneas
      // tuviera activas la cadena — un socio con una sola línea en pesos
      // igual podía elegir Dólar y se quedaba con "Tipo de producto" vacío
      // (opcionesProducto, más abajo, filtra por moneda y no encontraba
      // nada). Ahora se arma con el catálogo real de monedas, acotado a las
      // que de verdad tienen alguna línea activa y apta para alta nueva en
      // esta cadena (reportado el 2026-09-14, caso Banco Nación).
      const monedasConLineaActiva = new Set(
        lineasDisponibles.map((l) => Number(l.monedalineaid)),
      );
      const opcionesMoneda = (monedasCatalogo?.opciones || []).filter((o) =>
        monedasConLineaActiva.has(Number(o.value)),
      );

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
          onContinuar={async () => {
            handleSubmit(onSubmitFinal, (errors) => {
              console.error("Errores de validación del schema:", errors);
            })();
          }}
          onCancelar={() => setMostrarResultados(false)}
          opcionesMoneda={opcionesMoneda}
          opcionesProducto={opcionesProducto}
          opcionesCalculo={opcionesCalculo}
          mostrarTipoCalculo={mostrarTipoCalculo}
          disableMonto={esMontoUnico}
          montoMaximoOverride={Number(lineaSeleccionada?.montolinea) || undefined}
          labelFecha="Plazo estimado"
          labelMonto="Monto requerido"
          isSubmitting={enviandoSolicitud}
        />
      );
    }

    // Documentación, Representantes/Apoderados y Sociedad de Bolsa ya no
    // son pasos propios de este wizard (cambio de flujo 2026-09-14): se
    // gestionan enteramente en el Legajo, antes de llegar a pedir la línea.
    // "Continuar" en Paso3Simulador (arriba) ya crea la solicitud
    // directamente - acá solo queda mostrar el resultado.
    if (pasoActual === 2) {
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
      default:
        return { badge: "Alta de Línea", t: "Alta de Operación", s: "" };
    }
  };

  // Un solo paso visible (Operación) - Documentos/Bolsa ya no existen acá
  // (ver renderPasoDinamico) y Éxito nunca se muestra en el stepper, igual
  // que antes (showHeaderYStepper lo oculta).
  const hitosVisuales = ["Operación"];
  const hitoActualMapped = 1;
  const maxHitoAlcanzadoMapped = 1;
  const handleStepClickMapped = () => {};

  const showHeaderYStepper = pasoActual === 1;

  if (isLoadingEmpresa || validandoAcceso) {
    return (
      <LoadingScreen
        title="Verificando acceso"
        message="Aguardá un momento mientras validamos tu sesión..."
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
                  onVolver={null}
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
