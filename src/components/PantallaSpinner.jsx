import ComponenteSpinner from "./ComponenteSpinner";

export default function PantallaSpinner({ size = 70 }) {
  return (
    <div style={styles.overlay}>
      <ComponenteSpinner size={size} />
    </div>
  );
}

const styles = {
  overlay: {
    position: "fixed",
    inset: 0,
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    background: "rgba(255,255,255,0.6)",
    backdropFilter: "blur(4px)",
    zIndex: 9999
  }
};