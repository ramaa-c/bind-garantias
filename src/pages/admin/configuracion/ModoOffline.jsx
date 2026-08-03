import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import { FiPower, FiClock, FiCpu, FiUser, FiRefreshCw, FiAlertTriangle, FiWifiOff } from "react-icons/fi";
import { toast } from "sonner";
import { Switch } from "../../../components/ui";
import { ConfirmacionModal } from "../../../components/features/shared/ConfirmacionModal/ConfirmacionModal";
import { useAuthStore } from "../../../store/useAuthStore";
import { useObtenerStatusPlataforma, useActualizarStatusPlataforma } from "../../../hooks/useStatusPlataforma";
import { useObtenerUsuarioPorId } from "../../../hooks/useUsuario";
import {
  INTEGRACIONES,
  obtenerUltimoStatus,
  construirHistorialConCambios,
  esOffline,
  integracionActiva,
  crearPayloadStatus,
  formatearMomento,
} from "../../../utils/statusPlataforma";
import styles from "./ModoOffline.module.css";

const NombreUsuario = ({ usuarioid }) => {
  const { data } = useObtenerUsuarioPorId(usuarioid);
  if (!usuarioid) return "Usuario desconocido";
  const partes = [data?.denominacion, data?.email].filter(Boolean);
  return partes.length > 0 ? partes.join(" - ") : `Usuario #${usuarioid}`;
};

const formatearDuracion = (ms) => {
  const totalSeg = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(totalSeg / 3600);
  const m = Math.floor((totalSeg % 3600) / 60);
  const s = totalSeg % 60;
  const pad = (n) => String(n).padStart(2, "0");
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
};

export default function ModoOffline() {
  const user = useAuthStore((state) => state.user);
  const usuarioWebId = user?.usuarioWebId || 0;

  const { data, isLoading, isFetching, isError, refetch } = useObtenerStatusPlataforma();
  const { mutate, isPending } = useActualizarStatusPlataforma();

  const ultimoStatus = obtenerUltimoStatus(data);
  const historial = construirHistorialConCambios(data).slice(0, 8);
  const offline = esOffline(ultimoStatus);

  // Sin ultimoStatus no hay forma de saber el estado real: mostrar la UI
  // interactiva ahí caería en los defaults de esOffline/integracionActiva
  // (todo "online", todo "activo"), que no reflejan la realidad, con
  // switches que además arman el payload de guardado a partir de esos
  // mismos defaults. Se bloquea toda la pantalla en vez de arriesgar eso.
  // Si en cambio hay un estado previo (falló solo un refetch en segundo
  // plano), se sigue mostrando esos datos reales pero pausando las
  // acciones hasta reconectar.
  const sinDatos = isError && !ultimoStatus;
  const datosDesactualizados = isError && !!ultimoStatus;
  const accionesPausadas = isPending || datosDesactualizados;

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [ahora, setAhora] = useState(() => Date.now());

  const integracionesCardRef = useRef(null);
  const [alturaIntegraciones, setAlturaIntegraciones] = useState(null);

  useEffect(() => {
    if (!offline) return undefined;
    const intervalId = setInterval(() => setAhora(Date.now()), 1000);
    return () => clearInterval(intervalId);
  }, [offline]);

  useLayoutEffect(() => {
    const el = integracionesCardRef.current;
    if (!el) return undefined;
    const actualizarAltura = () => setAlturaIntegraciones(el.offsetHeight);
    actualizarAltura();
    const observer = new ResizeObserver(actualizarAltura);
    observer.observe(el);
    return () => observer.disconnect();
  }, [isLoading]);

  const enviarCambio = (cambios, mensajeExito) => {
    if (!usuarioWebId) {
      toast.error("No se pudo identificar tu usuario", {
        description: "Iniciá sesión con una cuenta de administrador válida para registrar el cambio.",
      });
      return;
    }
    mutate(crearPayloadStatus(ultimoStatus, cambios, usuarioWebId), {
      onSuccess: () => toast.success(mensajeExito),
      onError: () =>
        toast.error("No se pudo actualizar el estado", {
          description: "Verificá la conexión con el servidor e intentá de nuevo.",
        }),
    });
  };

  const confirmarAccion = () => {
    const activandoOffline = !offline;
    enviarCambio(
      { statusgeneral: activandoOffline ? "0" : "1" },
      activandoOffline ? "Modo offline activado" : "La plataforma cliente volvió a estar online",
    );
    setConfirmOpen(false);
  };

  const handleToggleIntegracion = (campo) => {
    const activa = integracionActiva(ultimoStatus, campo);
    const integracion = INTEGRACIONES.find((i) => i.campo === campo);
    enviarCambio(
      { [campo.toLowerCase()]: activa ? "0" : "1" },
      `${integracion?.nombre} ${activa ? "desactivada" : "activada"}`,
    );
  };

  const handleRefrescar = async () => {
    const resultado = await refetch();
    if (resultado.status === "success") {
      toast.success("Estado actualizado");
    } else {
      toast.error("No se pudo actualizar el estado");
    }
  };

  const fechaFormateada = ultimoStatus?.momento ? formatearMomento(ultimoStatus.momento) : null;

  const duracionOffline =
    offline && ultimoStatus?.momento
      ? formatearDuracion(ahora - new Date(ultimoStatus.momento).getTime())
      : null;

  if (isLoading) {
    return (
      <div className={styles.container}>
        <div className={styles.loadingState}>Cargando estado de la plataforma...</div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1>Modo Offline</h1>
          <p>
            Poné la plataforma cliente fuera de servicio y controlá sus integraciones externas en
            tiempo real. El panel de administración sigue funcionando normalmente.
          </p>
        </div>
        <button
          type="button"
          className={styles.btnRefresh}
          onClick={handleRefrescar}
          disabled={isFetching}
        >
          <FiRefreshCw className={isFetching ? styles.spinning : ""} /> Actualizar
        </button>
      </div>

      {sinDatos ? (
        <div className={styles.unavailableState}>
          <div className={styles.unavailableGlow} />
          <div className={styles.unavailableIconWrap}>
            <FiWifiOff size={24} />
          </div>
          <h2>No se pudo conectar con el servidor</h2>
          <p>
            No pudimos obtener el estado de la plataforma ni su historial de cambios. Por
            seguridad, no se muestra ni se permite modificar nada hasta reestablecer la conexión.
          </p>
          <button
            type="button"
            className={styles.unavailableRetryBtn}
            onClick={handleRefrescar}
            disabled={isFetching}
          >
            <FiRefreshCw className={isFetching ? styles.spinning : ""} /> Reintentar
          </button>
        </div>
      ) : (
        <>
          {datosDesactualizados && (
            <div className={styles.staleBanner}>
              <FiAlertTriangle size={15} />
              <span>
                Sin conexión con el servidor: se muestra el último estado conocido y las acciones
                quedan pausadas hasta reconectar.
              </span>
            </div>
          )}

          <div className={`${styles.statusHero} ${offline ? styles.statusOffline : styles.statusOnline}`}>
            <div className={styles.statusGlow} />

            <div className={styles.statusHeroLeft}>
              <div className={styles.statusIconWrap}>
                <FiPower size={19} />
              </div>
              <div className={styles.statusInfo}>
                <span className={styles.statusLabel}>
                  <span className={styles.pulseDot} />
                  Estado actual
                </span>
                <h2>{offline ? "Offline — Fuera de servicio" : "Online — Operando normalmente"}</h2>
                <div className={styles.statusMetaRow}>
                  {fechaFormateada && (
                    <span className={styles.statusMeta}>
                      <FiClock /> {offline ? "Desde el" : "Último cambio:"} {fechaFormateada}
                    </span>
                  )}
                  {ultimoStatus && (
                    <span className={styles.statusMeta}>
                      <FiUser /> <NombreUsuario usuarioid={ultimoStatus.usuariowebid} />
                      {usuarioWebId && Number(ultimoStatus.usuariowebid) === Number(usuarioWebId) ? " (vos)" : ""}
                    </span>
                  )}
                  {duracionOffline && <span className={styles.durationBadge}>{duracionOffline} fuera de servicio</span>}
                </div>
              </div>
            </div>

            <div className={styles.statusHeroRight}>
              <span className={styles.switchHint}>{offline ? "Volver a poner online" : "Poner fuera de servicio"}</span>
              <Switch
                checked={offline}
                onChange={() => setConfirmOpen(true)}
                variant="admin"
                size="lg"
                disabled={accionesPausadas}
              />
            </div>
          </div>

          <div className={styles.workspace}>
            <div className={styles.card} ref={integracionesCardRef}>
              <div className={styles.cardHeader}>
                <div className={styles.cardIconWrap}>
                  <FiCpu size={18} />
                </div>
                <div className={styles.cardHeaderText}>
                  <h3>Integraciones externas</h3>
                  <p>Apagá puntualmente una integración si está fallando, sin sacar de servicio toda la plataforma.</p>
                </div>
              </div>

              <div className={styles.warnCallout}>
                <span className={styles.warnIconWrap}>
                  <FiAlertTriangle size={14} />
                </span>
                <p className={styles.warnText}>
                  <strong>No se resuelve solo:</strong> las solicitudes que dependen
                  de este chequeo van a quedar trabadas como pendientes hasta que la
                  reactives. Además, no alcanza con reactivarla: un admin va a tener
                  que volver a ejecutar el CDA desde el legajo del socio para que
                  se destrabe.
                </p>
              </div>

              <div className={styles.integracionesList}>
                {INTEGRACIONES.map(({ campo, nombre, descripcion }) => {
                  const activa = integracionActiva(ultimoStatus, campo);
                  return (
                    <div key={campo} className={styles.integracionRow}>
                      <div className={styles.integracionInfo}>
                        <span className={`${styles.dot} ${activa ? styles.dotOn : styles.dotOff}`} />
                        <div className={styles.integracionTexto}>
                          <span className={styles.integracionNombre}>{nombre}</span>
                          <span className={styles.integracionDescripcion}>{descripcion}</span>
                        </div>
                      </div>
                      <Switch
                        checked={activa}
                        onChange={() => handleToggleIntegracion(campo)}
                        variant="admin"
                        disabled={accionesPausadas}
                      />
                    </div>
                  );
                })}
              </div>
            </div>

            <div
              className={styles.card}
              style={alturaIntegraciones ? { maxHeight: alturaIntegraciones } : undefined}
            >
              <div className={styles.cardHeader}>
                <div className={styles.cardIconWrap}>
                  <FiClock size={18} />
                </div>
                <div className={styles.cardHeaderText}>
                  <h3>Historial de cambios</h3>
                  <p>Últimos movimientos, tanto del estado general como de cada integración.</p>
                </div>
              </div>

              <div className={styles.historialList}>
                {historial.length === 0 && (
                  <span className={styles.historialVacio}>Todavía no hay cambios registrados.</span>
                )}
                {historial.map((item) => {
                  const esNegativo = item.cambios.some(
                    (cambio) => cambio.includes("OFFLINE") || cambio.includes("desactivada"),
                  );
                  return (
                    <div key={item.statusplataformaid} className={styles.historialItem}>
                      <span className={`${styles.dot} ${esNegativo ? styles.dotOff : styles.dotOn}`} />
                      <div className={styles.historialInfo}>
                        <span className={styles.historialEstado}>{item.cambios.join(", ")}</span>
                        <span className={styles.historialMeta}>
                          {formatearMomento(item.momento)} · <NombreUsuario usuarioid={item.usuariowebid} />
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </>
      )}

      <ConfirmacionModal
        isOpen={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={confirmarAccion}
        titulo={offline ? "Volver a poner la plataforma online" : "Activar modo offline"}
        mensaje={
          offline
            ? "Los usuarios van a poder volver a acceder normalmente a la plataforma cliente. ¿Confirmás?"
            : "Vas a bloquear el acceso de todos los usuarios a la plataforma cliente. Van a ver la pantalla de mantenimiento hasta que lo desactives. ¿Confirmás?"
        }
        variant="blue"
        tone={offline ? "neutral" : "danger"}
        confirmText={offline ? "VOLVER A ONLINE" : "ACTIVAR OFFLINE"}
        cancelText="CANCELAR"
        isLoading={isPending}
      />
    </div>
  );
}
