import React, { useEffect, useState } from "react";
import { FiPower, FiClock, FiEdit3, FiEye, FiSave, FiTool, FiLock } from "react-icons/fi";
import { toast } from "sonner";
import { Switch, Button } from "../../components/ui";
import { ConfirmacionModal } from "../../components/features/shared/ConfirmacionModal/ConfirmacionModal";
import { useModoOffline } from "../../hooks/useModoOffline";
import {
  activarModoOffline,
  desactivarModoOffline,
  actualizarMensajeOffline,
  MENSAJE_OFFLINE_DEFAULT,
} from "../../utils/modoOffline";
import logoBind from "../../assets/images/bind-g-logo.svg";
import styles from "./ModoOffline.module.css";

const MAX_MENSAJE = 280;

const formatearDuracion = (ms) => {
  const totalSeg = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(totalSeg / 3600);
  const m = Math.floor((totalSeg % 3600) / 60);
  const s = totalSeg % 60;
  const pad = (n) => String(n).padStart(2, "0");
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
};

export default function ModoOffline() {
  const config = useModoOffline();
  const [mensaje, setMensaje] = useState(() => config.mensaje || MENSAJE_OFFLINE_DEFAULT);
  const [mensajeSincronizado, setMensajeSincronizado] = useState(config.mensaje);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [accionPendiente, setAccionPendiente] = useState(null);
  const [ahora, setAhora] = useState(() => Date.now());

  if (config.mensaje !== mensajeSincronizado) {
    setMensajeSincronizado(config.mensaje);
    setMensaje(config.mensaje || MENSAJE_OFFLINE_DEFAULT);
  }

  useEffect(() => {
    if (!config.activo) return undefined;
    const intervalId = setInterval(() => setAhora(Date.now()), 1000);
    return () => clearInterval(intervalId);
  }, [config.activo]);

  const mensajeSinGuardar = mensaje.trim() !== (config.mensaje || MENSAJE_OFFLINE_DEFAULT).trim();

  const pedirConfirmacion = () => {
    setAccionPendiente(config.activo ? "desactivar" : "activar");
    setConfirmOpen(true);
  };

  const confirmarAccion = () => {
    if (accionPendiente === "activar") {
      activarModoOffline(mensaje);
      toast.success("Modo offline activado", {
        description: "La plataforma cliente ahora muestra la pantalla de mantenimiento en este navegador.",
      });
    } else {
      desactivarModoOffline();
      toast.success("La plataforma cliente volvió a estar online");
    }
    setConfirmOpen(false);
    setAccionPendiente(null);
  };

  const guardarMensaje = () => {
    actualizarMensajeOffline(mensaje);
    toast.success("Mensaje actualizado");
  };

  const fechaFormateada = config.fechaActivacion
    ? new Intl.DateTimeFormat("es-AR", { dateStyle: "short", timeStyle: "short" }).format(
        new Date(config.fechaActivacion),
      )
    : null;

  const duracionOffline =
    config.activo && config.fechaActivacion
      ? formatearDuracion(ahora - new Date(config.fechaActivacion).getTime())
      : null;

  const mensajePreview = mensaje.trim() || MENSAJE_OFFLINE_DEFAULT;
  const porcentajeCaracteres = Math.min(100, (mensaje.length / MAX_MENSAJE) * 100);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1>Modo Offline</h1>
          <p>
            Poné la plataforma cliente fuera de servicio para todos los usuarios y mostrales un
            mensaje de mantenimiento. El panel de administración sigue funcionando normalmente.
          </p>
        </div>
      </div>

      <div className={`${styles.statusHero} ${config.activo ? styles.statusOffline : styles.statusOnline}`}>
        <div className={styles.statusGlow} />

        <div className={styles.statusHeroLeft}>
          <div className={styles.statusIconWrap}>
            <FiPower size={24} />
          </div>
          <div className={styles.statusInfo}>
            <span className={styles.statusLabel}>
              <span className={styles.pulseDot} />
              Estado actual
            </span>
            <h2>{config.activo ? "Offline — Fuera de servicio" : "Online — Operando normalmente"}</h2>
            <div className={styles.statusMetaRow}>
              {config.activo && fechaFormateada && (
                <span className={styles.statusMeta}>
                  <FiClock /> Desde el {fechaFormateada}
                </span>
              )}
              {duracionOffline && <span className={styles.durationBadge}>{duracionOffline} fuera de servicio</span>}
            </div>
          </div>
        </div>

        <div className={styles.statusHeroRight}>
          <span className={styles.switchHint}>{config.activo ? "Volver a online" : "Activar offline"}</span>
          <Switch checked={config.activo} onChange={pedirConfirmacion} variant="admin" size="lg" />
        </div>
      </div>

      <div className={styles.workspace}>
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <div className={styles.cardIconWrap}>
              <FiEdit3 size={18} />
            </div>
            <div className={styles.cardHeaderText}>
              <h3>Mensaje para los usuarios</h3>
              <p>Es lo que van a ver todos los clientes mientras la plataforma esté offline.</p>
            </div>
          </div>

          <textarea
            className={styles.textarea}
            value={mensaje}
            onChange={(e) => setMensaje(e.target.value)}
            rows={5}
            maxLength={MAX_MENSAJE}
            placeholder={MENSAJE_OFFLINE_DEFAULT}
          />
          <div className={styles.progressTrack}>
            <div className={styles.progressFill} style={{ width: `${porcentajeCaracteres}%` }} />
          </div>
          <div className={styles.messageFooter}>
            <span className={styles.charCount}>
              {mensaje.length}/{MAX_MENSAJE}
            </span>
            <Button variant="blue" size="sm" disabled={!mensajeSinGuardar} onClick={guardarMensaje}>
              <FiSave /> Guardar mensaje
            </Button>
          </div>
        </div>

        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <div className={styles.cardIconWrap}>
              <FiEye size={18} />
            </div>
            <div className={styles.cardHeaderText}>
              <h3>Vista previa para el cliente</h3>
              <p>Así van a ver la pantalla de mantenimiento los usuarios de la plataforma.</p>
            </div>
            <span className={styles.liveBadge}>
              <span className={styles.liveDot} /> En vivo
            </span>
          </div>

          <div className={styles.previewFrame}>
            <div className={styles.previewBrowserBar}>
              <div className={styles.trafficLights}>
                <span className={styles.trafficRed} />
                <span className={styles.trafficYellow} />
                <span className={styles.trafficGreen} />
              </div>
              <div className={styles.addressBar}>
                <FiLock size={10} /> plataforma.bindgarantias.com
              </div>
            </div>
            <div className={styles.previewContent}>
              <img src={logoBind} alt="Logo BIND Garantías" className={styles.previewLogo} />
              <div className={styles.previewIconWrap}>
                <FiTool size={30} />
              </div>
              <h4 className={styles.previewTitle}>Plataforma en mantenimiento</h4>
              <p className={styles.previewMessage}>{mensajePreview}</p>
              <span className={styles.previewHint}>
                Esta página se actualiza sola apenas el servicio vuelva a estar disponible.
              </span>
            </div>
          </div>
        </div>
      </div>

      <ConfirmacionModal
        isOpen={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={confirmarAccion}
        titulo={accionPendiente === "activar" ? "Activar modo offline" : "Volver a poner la plataforma online"}
        mensaje={
          accionPendiente === "activar"
            ? "Vas a bloquear el acceso de todos los usuarios a la plataforma cliente en este navegador. Van a ver el mensaje configurado hasta que lo desactives. ¿Confirmás?"
            : "Los usuarios van a poder volver a acceder normalmente a la plataforma cliente. ¿Confirmás?"
        }
        variant="blue"
        tone={accionPendiente === "activar" ? "danger" : "neutral"}
        confirmText={accionPendiente === "activar" ? "ACTIVAR OFFLINE" : "VOLVER A ONLINE"}
        cancelText="CANCELAR"
      />
    </div>
  );
}
