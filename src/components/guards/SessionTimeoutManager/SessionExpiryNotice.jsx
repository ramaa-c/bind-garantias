import styles from "./SessionExpiryNotice.module.css";

const pad2 = (n) => String(n).padStart(2, "0");

export const SessionExpiryNotice = ({ secondsLeft, totalSeconds }) => {
  const pct =
    totalSeconds > 0
      ? Math.max(0, Math.min(100, (secondsLeft / totalSeconds) * 100))
      : 0;
  const minutos = Math.floor(secondsLeft / 60);
  const segundos = secondsLeft % 60;
  const esCritico = secondsLeft <= 10;

  return (
    <div className={styles.wrapper}>
      <p className={styles.texto}>
        Por tu seguridad cerramos las sesiones inactivas. Si no hacés nada, tu
        sesión se va a cerrar en:
      </p>

      <div className={`${styles.timerRow} ${esCritico ? styles.critico : ""}`}>
        <span className={styles.timerValue} aria-hidden="true">
          {pad2(minutos)}:{pad2(segundos)}
        </span>
      </div>

      <div className={styles.track}>
        <div
          className={styles.fill}
          style={{ transform: `scaleX(${pct / 100})` }}
        />
      </div>

      <span className={styles.srOnly} role="status">
        Tu sesión se va a cerrar en {secondsLeft} segundos si no hacés nada.
      </span>
    </div>
  );
};

export default SessionExpiryNotice;
