import React, { useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "../../../../components/ui";
import ModalFirmaProceso from "../../../../components/features/shared/Compartidos/ModalFirmaProceso/ModalFirmaProceso";
import logoSignatura from "../../../../assets/images/logo-signatura.svg";
import styles from "./FirmaDocumento.module.css";

export default function FirmaDocumento() {
  const _navigate = useNavigate();
  const { idSolicitud: _idSolicitud } = useParams();

  const scrollRef = useRef(null);
  const [progreso, setProgreso] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleScroll = () => {
    if (!scrollRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
    if (scrollHeight <= clientHeight) {
      setProgreso(100);
      return;
    }
    const pct = Math.min(
      100,
      Math.round((scrollTop / (scrollHeight - clientHeight)) * 100),
    );
    setProgreso((prev) => Math.max(prev, pct));
  };

  const leido = progreso === 100;

  return (
    <div className={styles.page}>
      <div className={styles.document}>
        {/* ENCABEZADO */}
        <header className={styles.docHeader}>
          <div className={styles.docHeaderMeta}>
            <span className={styles.docBadge}>Firma electrónica</span>
            <span className={styles.docVersion}>Contrato OB-20436209011</span>
          </div>
          <h1 className={styles.docTitle}>Contrato de Garantía Recíproca</h1>
          <p className={styles.docSubtitle}>
            Enviado por <strong>BIND Garantías</strong>. Debe leer el documento
            completo antes de poder firmarlo.
          </p>
          <div className={styles.progressBar}>
            <div
              className={styles.progressFill}
              style={{ width: `${progreso}%` }}
            />
          </div>
          <div className={styles.progressMeta}>
            <span className={styles.progressLabel}>{progreso}% leído</span>
            {leido && (
              <span className={styles.progressDone}>✓ Listo para firmar</span>
            )}
          </div>
        </header>

        {/* VISOR */}
        <div className={styles.docBody}>
          <div
            className={styles.viewer}
            ref={scrollRef}
            onScroll={handleScroll}
          >
            <div className={styles.viewerContent}>
              <h3 className={styles.viewerTitle}>
                Oferta de Contrato de Garantía Recíproca
              </h3>

              {[...Array(15)].map((_, i) => (
                <p key={i} className={styles.viewerParagraph}>
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

              <div className={styles.viewerFooter}>
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

        {/* FOOTER DE FIRMA */}
        <footer className={styles.docFooter}>
          {!leido ? (
            <div className={styles.footerPending}>
              <div className={styles.footerTrack}>
                <div
                  className={styles.footerFill}
                  style={{ width: `${progreso}%` }}
                />
              </div>
              <span className={styles.footerHint}>
                Desplace el documento para habilitiar la firma
              </span>
            </div>
          ) : (
            <div className={styles.footerReady}>
              <span className={styles.footerReadyText}>
                Documento leído al 100% — puede proceder con la firma
              </span>
              <Button
                variant="primary"
                className={styles.btnFirmar}
                onClick={() => setIsModalOpen(true)}
              >
                Firmar Documento
              </Button>
            </div>
          )}
        </footer>
      </div>

      <ModalFirmaProceso
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
}
