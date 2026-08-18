import React, { useState, useEffect, useMemo, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { FiCheckCircle, FiChevronRight, FiArrowRight, FiRefreshCw, FiAlertTriangle } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useChannel } from "../../../../context/ChannelContext";
import { useValidacionLegajo } from "../../../../hooks/useValidacionLegajo";
import { useEmpresaActiva } from "../../../../hooks/useEmpresaActiva";
import { useEstaMigradoEnSgrPlus, useSocioWebPorId, useEstadoCdaSocio } from "../../../../hooks/useSocios";
import { useLegajoModalStore } from "../../../../store/useLegajoModalStore";
import { sociosService } from "../../../../services/sociosService";
import { Button } from "../../../ui/Button/Button";
import { MigracionExitosaModal } from "../MigracionExitosaModal/MigracionExitosaModal";
import { EstadoMigracionModal } from "../EstadoMigracionModal/EstadoMigracionModal";
import { ConfirmacionModal } from "../ConfirmacionModal/ConfirmacionModal";
import styles from "./LegajoUniversalBar.module.css";

// adminMode/socioIdActivo/tipoPersonaId/nombreEmpresa/cadenaId: mismos
// overrides opcionales que ya acepta useValidacionLegajo, para poder montar
// esta barra también en EmpresaDetalle.jsx (admin) — ahí no hay usuario
// cliente logueado del que sacar el socio activo. En admin no se muestra la
// tarjeta completa (navegación a pestañas de cliente no aplica ahí) ni se
// auto-migra nunca: solo se ofrece sincronizar (banner + confirmación) si el
// propio admin edita algo durante la visita — ver hayCambiosSinSincronizar.
// En cliente, en cambio, sigue auto-sincronizando en silencio (sin pedir
// confirmación) apenas detecta ese mismo cambio — ver el useEffect de abajo.
export function LegajoUniversalBar({
  context,
  adminMode = false,
  socioIdActivo: socioIdOverride,
  tipoPersonaId: tipoPersonaIdOverride,
  nombreEmpresa: nombreEmpresaOverride,
  cadenaId: cadenaIdOverride,
}) {
  const empresaActiva = useEmpresaActiva(adminMode);
  const socioIdActivo = adminMode ? socioIdOverride : empresaActiva.socioIdActivo;
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { channelInfo } = useChannel();

  const {
    isValid,
    errores,
    totalRequisitos,
    totalDocumentosObligatorios,
    totalLegajoObligatorios,
    requisitosCompletados,
    isLoading,
    faltanDocumentos,
    faltanLegajo,
    socioLegajoData,
    tipoPersonaId,
    cadenaId,
  } = useValidacionLegajo({
    adminMode,
    socioIdActivo: socioIdOverride,
    tipoPersonaId: tipoPersonaIdOverride,
    nombreEmpresa: nombreEmpresaOverride,
    cadenaId: cadenaIdOverride,
  });

  // Datos del Socio en sí (no de sus terceros) — se usan tanto para saber si
  // "los datos de la empresa" cambiaron (ver fingerprint) como para el CUIT
  // que necesita el chequeo de migración real de abajo. Sirve para ambos
  // modos: en admin, useEmpresaActiva(true) no trae nada (está "skippeado").
  const { data: socioWeb, isLoading: loadingSocioWeb } = useSocioWebPorId(socioIdActivo);

  // Única fuente de verdad de si el legajo YA se migró de verdad al core:
  // consultar directamente sgrplus/Socios?Cuit=X — si el CUIT aparece ahí es
  // porque el socio efectivamente vive en el core (confirmado en vivo:
  // devuelve [] para un socio recién creado que todavía no migró, y el
  // registro completo para uno que sí). Antes acá "sincronizado" se
  // calculaba solo con "no cambió nada desde que se abrió la pantalla"
  // (fingerprint vs. baseline) sin chequear nada contra el backend — eso
  // daba un falso "Sincronizado" apenas se recargaba la página después de un
  // intento de migración que en realidad falló (confirmado en vivo el
  // 2026-08-11: POST Socio/Migrar tiró 500, y al hacer F5 la barra igual
  // mostró "Sincronizado" porque no había ningún cambio LOCAL pendiente).
  const { data: migradoEnBackend = false, isLoading: loadingMigradoEnBackend } =
    useEstaMigradoEnSgrPlus(socioWeb?.cuit);

  // Estado del CDA de PANTALLA_INGRESO_CUIT del socio en sí (no de sus
  // terceros — ver estadoCdaMap para eso). Desde el 2026-08-13 esto ya NO
  // bloquea el acceso a la cuenta (OnboardingGuard dejó de usarlo para
  // eso) — el socio puede entrar y completar todo su legajo igual. Lo que
  // sigue bloqueando es la migración a SGR+ (ver cdaSocioAprobado más
  // abajo) y se le avisa con un banner permanente mientras no esté
  // aprobado (acordado con el equipo el 2026-08-13).
  // cadenaId se le pasa para el caso de "cero CDAs vinculados" (nunca se
  // había probado antes, reportado por BIND el 2026-08-14): sin ningún CDA
  // configurado para esta pantalla+cadena no hay nada que validar, así que
  // cuenta como aprobado en vez de quedar en pendiente para siempre.
  const { data: estadoCdaSocio, isPending: loadingEstadoCdaSocio } =
    useEstadoCdaSocio(socioIdActivo, cadenaId);
  const cdaSocioAprobado = estadoCdaSocio === "aprobado";
  const cdaSocioNoAprobado =
    !adminMode && !loadingEstadoCdaSocio && !!estadoCdaSocio && !cdaSocioAprobado;

  const [isMigrating, setIsMigrating] = useState(false);
  const [lastAttemptedFingerprint, setLastAttemptedFingerprint] = useState("");
  const [showMigracionExitosa, setShowMigracionExitosa] = useState(false);
  const [showEstadoMigracion, setShowEstadoMigracion] = useState(false);
  const modalesLegajoAbiertos = useLegajoModalStore((s) => s.modalesAbiertos);

  const fingerprint = useMemo(() => {
    // loadingSocioWeb tiene que estar acá: si no, el primer render calcula
    // datosEmpresaKey vacío (socioWeb todavía no llegó), eso queda grabado
    // como baseline, y en cuanto socioWeb resuelve el fingerprint "cambia"
    // solo — un cambio fantasma que dispara una remigración sin que nadie
    // haya tocado nada (mismo tipo de bug que loadingEstadoCda en
    // useValidacionLegajo.js).
    if (!socioIdActivo || isLoading || loadingSocioWeb) return "";
    // A propósito NO incluye documentos: se puede reemplazar/agregar/borrar
    // los que sea sin que eso dispare una remigración — los documentos ya
    // cuentan para el % de completitud (useValidacionLegajo) y para la
    // PRIMERA migración (isValid ya los exige), pero una vez migrado, un
    // socio ya se considera al día en SGR+ aunque siga tocando documentos.
    // Solo remigra por cambios de terceros (altas/bajas/edición) o de los
    // datos de la empresa en sí (ver datosEmpresaKey) — acordado con Victor
    // el 2026-08-11.
    const datosEmpresaKey = socioWeb
      ? [
          socioWeb.denominacion,
          socioWeb.email,
          socioWeb.emailfacturacion,
          socioWeb.telefono,
          socioWeb.telefono2,
          socioWeb.telefono3,
          socioWeb.calle,
          socioWeb.numero,
          socioWeb.piso,
          socioWeb.departamento,
          socioWeb.partido,
          socioWeb.codpos,
          socioWeb.ciudadid,
          socioWeb.tamanioempresaid,
          socioWeb.situacionbcraid,
          socioWeb.tipocanalcomercializacionid,
          socioWeb.fechainicioactividades,
          socioWeb.fechacierreejercicio,
        ].join("-")
      : "";
    // Incluye TODOS los campos editables de la persona (no solo unos pocos):
    // cualquier cambio en el legajo de un accionista/representante/agente
    // (nombre, CUIT, domicilio completo, ciudad, participación, etc.) tiene
    // que volver a disparar la migración a SGR+. Si un campo editable queda
    // afuera de esta huella, un cambio en ESE campo pasa desapercibido y el
    // sistema cree erróneamente que sigue sincronizado.
    const personaFingerprint = (p) =>
      [
        p.terceroid || p.id,
        p.nombre || "",
        p.cuit || "",
        p.email || "",
        p.telefono || p.celular || "",
        p.direccion || p.calle || "",
        p.numero || "",
        p.piso || "",
        p.departamento || "",
        p.codpos || "",
        p.ciudadid || "",
        p.provinciaid || "",
        p.participacion || 0,
        p.nrosubcuentacaja || "",
        p.rolId || "",
      ].join("-");

    const accionistasKey = (socioLegajoData?.accionistas || [])
      .map(personaFingerprint)
      .join("|");
    const representantesKey = (socioLegajoData?.representantes || [])
      .map(personaFingerprint)
      .join("|");
    const agentesKey = (socioLegajoData?.agentesBolsa || [])
      .map(personaFingerprint)
      .join("|");
    return `${datosEmpresaKey}#${accionistasKey}#${representantesKey}#${agentesKey}`;
  }, [socioIdActivo, socioWeb, socioLegajoData, isLoading, loadingSocioWeb]);

  // Se confía en el dato tal como se lo trae al abrir la pantalla — nunca se
  // migra solo por eso, ni en cliente ni en admin, sin importar si es la
  // primera vez que se ve este socio en este navegador/dispositivo. Antes el
  // cliente usaba localStorage para esto: cualquier motivo por el que ese
  // registro no estuviera (otro dispositivo, caché borrada, etc.) hacía que
  // se re-disparara la migración al entrar aunque nada hubiera cambiado —
  // mismo síntoma que tenía admin. `baseline` guarda la huella con la que se
  // entró (en memoria, dura lo que dure esta visita a la pantalla) y recién
  // se considera que hay algo para sincronizar si la huella cambia DESPUÉS
  // de esa foto inicial — es decir, si se completó/editó algo mientras la
  // pantalla seguía montada.
  const [baseline, setBaseline] = useState(null);
  useEffect(() => {
    if (!fingerprint || baseline !== null) return;
    setBaseline(fingerprint);
  }, [fingerprint, baseline]);

  // Aviso "¡Felicitaciones!" del CLIENTE: dispara apenas su legajo pasa a
  // estar completo, sin importar si la migración a SGR+ (que ni sabe que
  // existe) sale bien o mal en ese momento — acordado con Victor el
  // 2026-08-12. isValidBaselineRef guarda si YA estaba completo al abrir la
  // pantalla (mismo patrón que `baseline` arriba, con ref en vez de state
  // porque acá no hace falta re-renderizar por esto): solo cuenta como
  // "recién completado" si pasa de incompleto a completo DURANTE esta
  // visita — si ya entraba completo, no vuelve a mostrarse.
  const isValidBaselineRef = useRef(null);
  useEffect(() => {
    if (adminMode || isLoading) return;
    if (isValidBaselineRef.current === null) {
      isValidBaselineRef.current = isValid;
      return;
    }
    if (isValid && !isValidBaselineRef.current) {
      setShowMigracionExitosa(true);
      isValidBaselineRef.current = true;
    }
  }, [adminMode, isValid, isLoading]);

  // TODO(SocioCertificadoPYME): reemplazar por un GET real al nuevo
  // endpoint SocioCertificadoPYME cuando exista (todavía no está publicado
  // - ver Paso1Cuit.jsx). Regla pedida: si CertificadoVigente pasó pero el
  // socio no tiene nada ahí (integración caída/bajada), se lo deja cargar
  // legajo y documentación igual (ver SociosView/DocumentacionView), pero
  // la migración a SGR+ queda bloqueada hasta que sí tenga. Por ahora
  // siempre true (no bloquea) para no frenar las migraciones que ya
  // funcionaban mientras el endpoint no exista.
  const tieneCertificadoPyme = true;

  const cambioPendienteRaw =
    baseline !== null &&
    fingerprint !== baseline &&
    isValid &&
    totalRequisitos > 0 &&
    cdaSocioAprobado &&
    tieneCertificadoPyme;

  // Espacia los intentos de sincronización: el primer POST a /Socio/Migrar
  // de esta visita dispara apenas se detecta un cambio real, pero cualquier
  // intento SIGUIENTE (ej. si el fingerprint vuelve a moverse poco después
  // del éxito del primero — el backend puede normalizar/reformatear algún
  // dato al guardar, y eso alcanza para que el refetch post-migración calcule
  // una huella distinta a la que se guardó como baseline) tiene que esperar
  // al menos 1 minuto desde que arrancó el intento anterior. `ultimoIntentoAtRef`
  // arranca en 0 (sin intentos todavía) para no demorar el primer disparo.
  const ultimoIntentoAtRef = useRef(0);
  const [hayCambiosSinSincronizar, setHayCambiosSinSincronizar] = useState(false);
  useEffect(() => {
    if (!cambioPendienteRaw) {
      setHayCambiosSinSincronizar(false);
      return;
    }
    const restante = Math.max(0, 60000 - (Date.now() - ultimoIntentoAtRef.current));
    if (restante === 0) {
      setHayCambiosSinSincronizar(true);
      return;
    }
    const timeoutId = setTimeout(() => setHayCambiosSinSincronizar(true), restante);
    return () => clearTimeout(timeoutId);
  }, [cambioPendienteRaw, fingerprint]);

  // Además de "algo cambió desde que se abrió la pantalla", también hay que
  // reintentar si el legajo ya está completo/válido pero el backend todavía
  // no lo tiene migrado — cubre tanto el primer intento como el caso de un
  // intento anterior que falló silenciosamente (ver migradoEnBackend arriba):
  // sin esto, sin un cambio LOCAL nuevo de por medio, nunca se reintentaba.
  const faltaMigrarEnBackend =
    !loadingSocioWeb &&
    !loadingMigradoEnBackend &&
    !migradoEnBackend &&
    isValid &&
    totalRequisitos > 0 &&
    cdaSocioAprobado &&
    tieneCertificadoPyme;

  const [confirmMigrarOpen, setConfirmMigrarOpen] = useState(false);

  // Lógica compartida por el auto-migrado silencioso del cliente y el botón
  // de confirmación del admin — solo cambia QUIÉN dispara la llamada (ver
  // autoMigrar/migrarAhora más abajo) y si el error se muestra (silent=true
  // para el auto-migrado del cliente: no tiene sentido exponerle a un
  // cliente un error 500 de una sincronización que ni sabe que existe —
  // igual queda logueado, y un admin puede reintentarlo a mano). Un éxito
  // siempre corre la baseline al fingerprint actual (es la nueva foto
  // "confiable") y refresca la consulta a sgrplus/Socios para que
  // migradoEnBackend se actualice sin esperar al próximo reload.
  const sincronizarConSgrPlus = async (silent = false) => {
    ultimoIntentoAtRef.current = Date.now();
    setIsMigrating(true);
    const toastId = silent ? null : toast.loading("Sincronizando legajo con SGR+...");
    try {
      const response = await sociosService.enviarASgrPlus(socioIdActivo);
      if (response.success) {
        if (toastId) toast.dismiss(toastId);
        // Solo para admin (silent=false, ver migrarAhora): a él sí le
        // corresponde enterarse de la migración real. El aviso del cliente
        // NO depende de esto — se dispara aparte apenas su legajo queda
        // completo, migre o no migre en el momento (ver el useEffect de
        // isValid más abajo, acordado con Victor el 2026-08-12).
        if (!silent) setShowMigracionExitosa(true);
        setBaseline(fingerprint);
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: ["socioLegajoCompleto"] }),
          queryClient.invalidateQueries({ queryKey: ["socioArchivos"] }),
          queryClient.invalidateQueries({ queryKey: ["sgrplus", "socios", "porCuit"] }),
        ]);
      } else {
        throw new Error(response.message || "Error al sincronizar");
      }
    } catch (err) {
      console.error("[LegajoUniversalBar] Error al sincronizar legajo con SGR+:", err);
      if (silent) {
        if (toastId) toast.dismiss(toastId);
      } else {
        const errorMessage =
          err.response?.data?.message || err.message || "No se pudo sincronizar con SGR+.";
        toast.error("Error de sincronización con SGR+", { id: toastId, description: errorMessage });
      }
    } finally {
      setIsMigrating(false);
    }
  };

  const migrarAhora = async () => {
    try {
      await sincronizarConSgrPlus();
    } finally {
      setConfirmMigrarOpen(false);
    }
  };

  // ── CLIENTE: auto-sincroniza en silencio apenas hay algo nuevo para
  // mandar (comportamiento de cara al usuario sin cambios) — "algo nuevo" es
  // un cambio local desde que se entró (`hayCambiosSinSincronizar`) O que el
  // backend todavía no tiene el legajo migrado aunque ya esté completo
  // (`faltaMigrarEnBackend` — cubre el primer intento Y un reintento tras un
  // F5 si el intento anterior falló). El admin usa el flujo de confirmación
  // de arriba en su lugar (ver el return de adminMode más abajo).
  useEffect(() => {
    if (adminMode) return;
    if (!(hayCambiosSinSincronizar || faltaMigrarEnBackend) || isMigrating || isLoading || loadingSocioWeb || loadingMigradoEnBackend || loadingEstadoCdaSocio) return;

    // En "legajo" (a diferencia de "documentacion") completar el último
    // requisito puede pasar DENTRO de una modal propia (Representante,
    // SocioAccionista, Bolsa) que todavía sigue abierta — incluso mientras
    // esa modal corre su propia validación de CDA. Si se dispara la
    // migración (y el aviso de éxito) en ese momento, el usuario lo ve
    // superpuesto a una modal que ni terminó de guardar. Se pospone hasta
    // que no quede ninguna abierta; ver useLegajoModalStore.
    if (context === "legajo" && modalesLegajoAbiertos > 0) {
      console.log(
        `[LegajoUniversalBar] Hay ${modalesLegajoAbiertos} modal(es) de legajo abierta(s): se pospone la migración hasta que se cierren.`,
      );
      return;
    }

    if (lastAttemptedFingerprint === fingerprint) {
      console.log(`[LegajoUniversalBar] Ya se intentó migrar la huella actual y falló. Esperando cambios antes de reintentar.`);
      return;
    }

    const lockKey = `migrando_sgr_${socioIdActivo}`;
    if (sessionStorage.getItem(lockKey) === "true") {
      console.log(`[LegajoUniversalBar] Migración en progreso en otra pestaña o instancia. Abortando duplicado.`);
      return;
    }

    const autoMigrar = async () => {
      sessionStorage.setItem(lockKey, "true");
      setLastAttemptedFingerprint(fingerprint);
      console.log(`[LegajoUniversalBar] Iniciando migración automática a SGR+ para el socio ${socioIdActivo}...`);
      console.log(`[LegajoUniversalBar] Huella actual:`, fingerprint);
      try {
        await sincronizarConSgrPlus(true);
      } finally {
        sessionStorage.removeItem(lockKey);
      }
    };

    autoMigrar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [adminMode, hayCambiosSinSincronizar, faltaMigrarEnBackend, isMigrating, isLoading, loadingSocioWeb, loadingMigradoEnBackend, loadingEstadoCdaSocio, context, modalesLegajoAbiertos, lastAttemptedFingerprint, fingerprint, socioIdActivo]);

  // ── ADMIN: auto-migra (con feedback, no en silencio) SOLO por
  // faltaMigrarEnBackend — el caso de "el legajo ya estaba completo y ahora
  // el CDA se aprobó" (ej. un admin reejecuta/fuerza un CDA desde
  // EmpresaDetalle sin tocar ningún dato del socio). No usa
  // hayCambiosSinSincronizar: una edición real de datos hecha por el propio
  // admin sigue requiriendo el banner + confirmación de abajo, porque ahí sí
  // tiene sentido que revise antes de mandar al core. Se le pasa silent=false
  // a sincronizarConSgrPlus a propósito: a diferencia del cliente, el admin
  // está mirando esta pantalla en el momento, así que corresponde mostrarle
  // el toast de carga/éxito/error igual que en el botón manual.
  useEffect(() => {
    if (!adminMode) return;
    if (!faltaMigrarEnBackend || isMigrating || isLoading || loadingSocioWeb || loadingMigradoEnBackend || loadingEstadoCdaSocio) return;
    if (modalesLegajoAbiertos > 0) return;
    if (lastAttemptedFingerprint === fingerprint) return;

    const lockKey = `migrando_sgr_${socioIdActivo}`;
    if (sessionStorage.getItem(lockKey) === "true") return;

    const autoMigrarAdmin = async () => {
      sessionStorage.setItem(lockKey, "true");
      setLastAttemptedFingerprint(fingerprint);
      try {
        await sincronizarConSgrPlus(false);
      } finally {
        sessionStorage.removeItem(lockKey);
      }
    };

    autoMigrarAdmin();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [adminMode, faltaMigrarEnBackend, isMigrating, isLoading, loadingSocioWeb, loadingMigradoEnBackend, loadingEstadoCdaSocio, modalesLegajoAbiertos, lastAttemptedFingerprint, fingerprint, socioIdActivo]);

  const hasMandatoryInContext =
    (context === "documentacion" && totalDocumentosObligatorios > 0) ||
    (context === "legajo" && totalLegajoObligatorios > 0) ||
    !context;

  // Se renderiza sin importar si la barra decide ocultarse en este contexto:
  // la migración puede completarse en cualquier momento y el aviso tiene que
  // verse sí o sí, no solo cuando la barra también está visible.
  const migracionExitosaModal = (
    <MigracionExitosaModal
      isOpen={showMigracionExitosa}
      onClose={() => setShowMigracionExitosa(false)}
      adminMode={adminMode}
    />
  );

  // Igual que el modal de arriba: se calcula una sola vez y se incluye en
  // TODOS los caminos de return (incluido el early-return de abajo), para
  // que se vea sin importar si el legajo todavía está incompleto o si esta
  // pantalla en particular no tiene requisitos configurados. El acceso a la
  // cuenta ya no depende del CDA (ver OnboardingGuard.jsx), así que este es
  // el único lugar donde el cliente se entera de que tiene que comunicarse
  // con BIND.
  const cdaWarningBanner = cdaSocioNoAprobado ? (
    <div className={styles.cdaWarningBanner}>
      <FiAlertTriangle className={styles.cdaWarningIcon} />
      <span className={styles.cdaWarningText}>
        No superaste las validaciones de aceptación correspondientes. Comunicate con BIND Garantías para que las revisemos.
      </span>
    </div>
  ) : null;

  // En admin no se muestra la tarjeta completa (navegación a pestañas de
  // cliente, botones "Ir"/"Ver qué falta"): en su lugar, un banner que solo
  // aparece si ESTE admin cambió algo desde que abrió la pantalla (ver
  // hayCambiosSinSincronizar) — nunca al entrar, ni por datos que ya venían
  // así del backend.
  if (adminMode) {
    return (
      <>
        {migracionExitosaModal}
        {hayCambiosSinSincronizar && (
          <div className={styles.adminSyncBanner}>
            <FiRefreshCw className={styles.adminSyncIcon} />
            <span className={styles.adminSyncText}>
              Hay cambios en el legajo que todavía no se sincronizaron con SGR+.
            </span>
            <Button
              variant="blue"
              size="sm"
              isLoading={isMigrating}
              onClick={() => setConfirmMigrarOpen(true)}
            >
              Guardar y migrar
            </Button>
          </div>
        )}
        <ConfirmacionModal
          isOpen={confirmMigrarOpen}
          onClose={() => setConfirmMigrarOpen(false)}
          onConfirm={migrarAhora}
          titulo="Sincronizar con SGR+"
          mensaje="Se van a guardar los cambios de esta empresa y sincronizarlos con el sistema core (SGR+). ¿Confirmás?"
          confirmText="Guardar y migrar"
          cancelText="Cancelar"
          variant="blue"
        />
      </>
    );
  }

  if (isLoading || totalRequisitos === 0 || !hasMandatoryInContext) {
    return (
      <>
        {migracionExitosaModal}
        {cdaWarningBanner}
      </>
    );
  }

  const isContextInvalid =
    (context === "documentacion" && faltanDocumentos) ||
    (context === "legajo" && faltanLegajo) ||
    (!context && !isValid);

  const porcentaje = Math.round((requisitosCompletados / totalRequisitos) * 100);

  const getMissingActionMessage = () => {
    if (isValid) return "Todos los requisitos han sido completados correctamente.";

    if (context === "documentacion" && !faltanDocumentos && faltanLegajo) {
      return "¡Documentos listos! Te falta completar información en la pestaña Legajo.";
    }
    if (context === "legajo" && !faltanLegajo && faltanDocumentos) {
      return "¡Datos de legajo listos! Te falta subir documentos obligatorios en Documentación.";
    }
    if (faltanDocumentos && faltanLegajo) {
      return "Te falta subir documentos obligatorios y completar datos de personas en el legajo.";
    }

    if (faltanLegajo && !faltanDocumentos) {
      const textErrores = errores.join(" ").toLowerCase();
      const faltanAcc = textErrores.includes("accionista") || textErrores.includes("participación");
      const faltanRep = textErrores.includes("representante") || textErrores.includes("apoderado");
      const etiquetaRep = Number(tipoPersonaId) === 1 ? "apoderado" : "representantes legales";

      if (faltanAcc && faltanRep) return `Te falta completar datos de accionistas y ${etiquetaRep}.`;
      if (faltanAcc) return "Te falta completar datos o documentos de los accionistas obligatorios.";
      if (faltanRep) return `Te falta completar datos de ${etiquetaRep === "apoderado" ? "tu apoderado" : "los representantes legales"}.`;
      return "Te falta completar algunos datos requeridos del legajo.";
    }

    if (faltanDocumentos && !faltanLegajo) {
      return "Te falta subir algunos documentos comerciales/impositivos obligatorios.";
    }

    return `Completados ${requisitosCompletados} de ${totalRequisitos} requisitos.`;
  };

  return (
    <>
      {migracionExitosaModal}
      {cdaWarningBanner}
      <EstadoMigracionModal
        isOpen={showEstadoMigracion}
        onClose={() => setShowEstadoMigracion(false)}
      />
      <div
        className={`${styles.container} ${isValid ? styles.containerValid : (isContextInvalid ? styles.containerInvalid : "")}`}
        role="button"
        tabIndex={0}
        onClick={() => setShowEstadoMigracion(true)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setShowEstadoMigracion(true);
          }
        }}
      >
        <div className={`${styles.ring} ${isValid ? styles.ringGlowSuccess : styles.ringGlowWarning}`}>
          <svg viewBox="0 0 36 36" className={styles.ringChart}>
            <path
              className={styles.ringTrack}
              d="M18 2.0845
                a 15.9155 15.9155 0 0 1 0 31.831
                a 15.9155 15.9155 0 0 1 0 -31.831"
            />
            <path
              className={`${styles.ringFill} ${isValid ? styles.ringFillSuccess : styles.ringFillWarning}`}
              strokeDasharray={`${porcentaje}, 100`}
              d="M18 2.0845
                a 15.9155 15.9155 0 0 1 0 31.831
                a 15.9155 15.9155 0 0 1 0 -31.831"
            />
            <text x="18" y="21.5" className={styles.ringLabel}>{porcentaje}%</text>
          </svg>
        </div>

        <div className={styles.textGroup}>
          <span className={styles.title}>
            {isValid ? "Legajo verificado" : "Legajo incompleto"}
          </span>
          <span className={styles.subtitle}>{getMissingActionMessage()}</span>
        </div>

        <div className={styles.cta}>
          {!isValid ? (
            context ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className={styles.ctaBtn}
                iconRight={<FiChevronRight size={14} />}
              >
                Ver qué falta
              </Button>
            ) : (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  const basePath = `/${channelInfo?.id || "default"}`;
                  if (faltanLegajo) {
                    navigate(`${basePath}/legajo`);
                  } else if (faltanDocumentos) {
                    navigate(`${basePath}/documentacion`);
                  }
                }}
                className={styles.ctaBtn}
                iconRight={<FiArrowRight size={14} />}
              >
                Ir
              </Button>
            )
          ) : (
            // La migración a SGR+ es un detalle interno — de cara al
            // cliente alcanza con decir que ya completó todo, sin mencionar
            // sincronización/migración ni su estado (acordado con Victor el
            // 2026-08-12). isMigrating/migradoEnBackend se siguen calculando
            // arriba para la lógica de reintento, solo dejaron de
            // mostrarse acá.
            <span className={`${styles.statusChip} ${styles.statusChipSuccess}`}>
              <FiCheckCircle size={13} />
              Datos completos
            </span>
          )}
        </div>
      </div>
    </>
  );
}

export default LegajoUniversalBar;
