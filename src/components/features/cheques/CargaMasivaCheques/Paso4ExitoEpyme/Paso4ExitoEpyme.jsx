import React from "react";
import { FaExternalLinkAlt, FaFilePdf, FaCheckCircle } from "react-icons/fa";
import { ContenedorPaso } from "../../../../ui";
import styles from "./Paso4ExitoEpyme.module.css";

export const Paso4ExitoEpyme = ({
  chequesFinales = [],
  urlEpyme = "https://epyme.cajadevalores.com.ar/login",
  onDescargarInstructivo,
}) => {
  return (
    <ContenedorPaso>
      <div className={styles.container}>
        <header className={styles.header}>
          <FaCheckCircle className={styles.iconSuccess} />
          <h2 className={styles.title}>
            Estos son tus cheques digitales aprobados
          </h2>
        </header>

        <div className={styles.tableContainer}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th className={styles.th}>Monto</th>
                <th className={styles.th}>Cuit</th>
                <th className={styles.th}>Emisor</th>
              </tr>
            </thead>
            <tbody>
              {chequesFinales.map((cheque, index) => (
                <tr key={cheque.id || index}>
                  <td className={styles.td} data-label="Monto">{cheque.montoNominalFormateado}</td>
                  <td className={styles.td} data-label="CUIT">{cheque.cuit}</td>
                  <td className={styles.td} data-label="Emisor">{cheque.emisor}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className={styles.cardsGrid}>
          <a
            href={urlEpyme}
            target="_blank"
            rel="noreferrer"
            className={styles.cardPrimary}
          >
            <div className={styles.cardContent}>
              <div className={styles.cardIcon}>
                <FaExternalLinkAlt />
              </div>
              <div>
                <h4 className={styles.cardTitle}>Plataforma ePYME</h4>
                <p className={styles.cardText}>
                  Completa la operación desde este link.
                </p>
              </div>
            </div>
            <span className={styles.linkAction}>IR AL SITIO</span>
          </a>

          <div
            className={styles.cardSecondary}
            onClick={onDescargarInstructivo}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onDescargarInstructivo();
              }
            }}
          >
            <FaFilePdf className={styles.pdfIcon} />
            <div>
              <p className={styles.cardText}>
                Podés guiarte con este instructivo <br />
                <strong style={{ color: "var(--white)" }}>Descargar PDF</strong>
              </p>
            </div>
          </div>
        </div>
      </div>
    </ContenedorPaso>
  );
};
