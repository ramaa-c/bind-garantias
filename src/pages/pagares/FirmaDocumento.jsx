import React, { useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "../../components/ui";
import ModalFirmaProceso from "../../components/features/shared/Compartidos/ModalFirmaProceso/ModalFirmaProceso";
import logoSignatura from "../../assets/images/logo-signatura.svg";
import styles from "./FirmaDocumento.module.css";

export default function FirmaDocumento() {
  const _navigate = useNavigate();

  const { idSolicitud: _idSolicitud } = useParams();

  const scrollContainerRef = useRef(null);
  const [porcentajeVisto, setPorcentajeVisto] = useState(0);

  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleScroll = () => {
    if (!scrollContainerRef.current) return;

    const { scrollTop, scrollHeight, clientHeight } =
      scrollContainerRef.current;

    if (scrollHeight <= clientHeight) {
      setPorcentajeVisto(100);
      return;
    }

    const scrolled = (scrollTop / (scrollHeight - clientHeight)) * 100;

    const porcentajeCalculado = Math.min(100, Math.max(0, scrolled));

    setPorcentajeVisto((prev) =>
      Math.max(prev, Math.round(porcentajeCalculado)),
    );
  };

  const isCompletamenteLeido = porcentajeVisto === 100;

  const handleAbrirModalFirma = () => {
    setIsModalOpen(true);
  };

  return (
    <div className={styles.firmaPage}>
      <main className={styles.firmaMainContainer}>
        <div className={styles.firmaContainer}>
          <header className={styles.firmaHeader}>
            <div>
              <div className={styles.firmaHeaderMeta}>
                <span className={styles.firmaBadge}>Firma electrónica</span>
                <span className={styles.firmaId}>OB-20436209011</span>
              </div>
              <h1 className={styles.firmaTitle}>
                Contrato de Garantía Recíproca
              </h1>
              <p className={styles.firmaSubtitle}>
                Enviado por BIND Garantías · Debe leer el documento completo
                antes de firmar.
              </p>
            </div>
          </header>

          {/* Simulador PDF */}
          <div className={styles.documentViewerWrapper}>
            <div
              className={styles.documentViewer}
              ref={scrollContainerRef}
              onScroll={handleScroll}
            >
              <h3>Oferta de Contrato de Garantía Recíproca</h3>
              {[...Array(15)].map((_, i) => (
                <p key={i}>
                  Por medio de la presente, el Banco de Servicios Financieros
                  S.A., sociedad inscripta en el Registro Público de Comercio,
                  con domicilio en la Ciudad Autónoma de Buenos Aires, establece
                  las condiciones de la presente solicitud. El Titular declara
                  conocer y aceptar que la utilización de los servicios
                  financieros implica la aceptación incondicional de todos los
                  términos y condiciones detallados en este documento. El
                  Titular será responsable de cualquier consumo que se efectúe
                  mediante los canales digitales autorizados, obligándose a
                  custodiar sus credenciales de seguridad con la máxima
                  diligencia.
                </p>
              ))}

              <div className={styles.documentFooter}>
                <img
                  src={logoSignatura}
                  alt="Signatura"
                  className={styles.signaturaLogo}
                />
                <span className={styles.signaturaText}>
                  Documento validado electrónicamente.
                </span>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* BOTTOM TRACKER BAR */}
      <div className={styles.bottomTrackerBar}>
        <div className={styles.trackerContent}>
          {!isCompletamenteLeido ? (
            <div className={styles.progressContainer}>
              <div className={styles.progressTop}>
                <span className={styles.progressHint}>
                  Desplazá para leer el documento
                </span>
                <span className={styles.progressText}>{porcentajeVisto}%</span>
              </div>
              <div className={styles.progressBarTrack}>
                <div
                  className={styles.progressBarFill}
                  style={{ width: `${porcentajeVisto}%` }}
                />
              </div>
            </div>
          ) : (
            <div className={styles.actionContainer}>
              <span className={styles.actionReady}>
                ✓ Documento leído completamente
              </span>
              <Button
                variant="primary"
                className={styles.btnFirmarGigante}
                onClick={handleAbrirModalFirma}
              >
                Firmar Documento
              </Button>
            </div>
          )}
        </div>
      </div>
      <ModalFirmaProceso
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
}
