import React, { useState, useEffect, useMemo, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { FiCheckCircle, FiChevronRight, FiArrowRight, FiRefreshCw } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useChannel } from "../../../../context/ChannelContext";
import { useValidacionLegajo } from "../../../../hooks/useValidacionLegajo";
import { useEmpresaActiva } from "../../../../hooks/useEmpresaActiva";
import { useEstaMigradoEnSgrPlus } from "../../../../hooks/useSocios";
import { useLegajoModalStore } from "../../../../store/useLegajoModalStore";
import { sociosService } from "../../../../services/sociosService";
import { Button } from "../../../ui/Button/Button";
import Spinner from "../../../ui/Spinner/Spinner";
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
    archivosBackend,
    socioLegajoData,
    tipoPersonaId,
  } = useValidacionLegajo({
    adminMode,
    socioIdActivo: socioIdOverride,
    tipoPersonaId: tipoPersonaIdOverride,
    nombreEmpresa: nombreEmpresaOverride,
    cadenaId: cadenaIdOverride,
  });

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
  const cuitActivo = adminMode ? null : empresaActiva.cuitActivo;
  const { data: migradoEnBackend = false, isLoading: loadingMigradoEnBackend } =
    useEstaMigradoEnSgrPlus(cuitActivo);

  const [isMigrating, setIsMigrating] = useState(false);
  const [lastAttemptedFingerprint, setLastAttemptedFingerprint] = useState("");
  const [showMigracionExitosa, setShowMigracionExitosa] = useState(false);
  const [showEstadoMigracion, setShowEstadoMigracion] = useState(false);
  const modalesLegajoAbiertos = useLegajoModalStore((s) => s.modalesAbiertos);

  const fingerprint = useMemo(() => {
    if (!socioIdActivo || isLoading) return "";
    const archivosKey = (archivosBackend || [])
      .map((a) => {
        const refDate = a.fchreferencia || a.FchReferencia || "";
        const refText = a.referencia || a.Referencia || "";
        return `${a.socioarchivoid || a.id}-${a.nombrearchivo || a.nombre || a.descripcion || ""}-${refDate}-${refText}`;
      })
      .join("|");
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
    return `${archivosKey}#${accionistasKey}#${representantesKey}#${agentesKey}`;
  }, [socioIdActivo, archivosBackend, socioLegajoData, isLoading]);

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

  const cambioPendienteRaw =
    baseline !== null && fingerprint !== baseline && isValid && totalRequisitos > 0;

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
    !loadingMigradoEnBackend && !migradoEnBackend && isValid && totalRequisitos > 0;

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
        setShowMigracionExitosa(true);
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
    if (!(hayCambiosSinSincronizar || faltaMigrarEnBackend) || isMigrating || isLoading || loadingMigradoEnBackend) return;

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
  }, [adminMode, hayCambiosSinSincronizar, faltaMigrarEnBackend, isMigrating, isLoading, loadingMigradoEnBackend, context, modalesLegajoAbiertos, lastAttemptedFingerprint, fingerprint, socioIdActivo]);

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
    />
  );

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
    return migracionExitosaModal;
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
          ) : isMigrating ? (
            <span className={styles.statusChip}>
              <Spinner size={13} />
              Sincronizando
            </span>
          ) : migradoEnBackend ? (
            <span className={`${styles.statusChip} ${styles.statusChipSuccess}`}>
              <FiCheckCircle size={13} />
              Sincronizado
            </span>
          ) : (
            <span className={styles.statusChip}>Sincronización pendiente</span>
          )}
        </div>
      </div>
    </>
  );
}

export default LegajoUniversalBar;
