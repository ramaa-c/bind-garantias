import React from "react";
import { Modal } from "../../../../components/ui/Modal/Modal";
import styles from "./TasasModal.module.css";

const TASAS_DATA = [
  { plazo: "De 0 a 30 días", tasa: "2.217,71%" },
  { plazo: "De 31 a 60 días", tasa: "2.228,40%" },
  { plazo: "De 61 a 90 días", tasa: "2.382,97%" },
  { plazo: "De 91 a 120 días", tasa: "2.434,73%" },
  { plazo: "De 121 a 150 días", tasa: "2.582,17%" },
  { plazo: "De 151 a 180 días", tasa: "2.656,60%" },
  { plazo: "De 181 a 210 días", tasa: "2.797,73%" },
  { plazo: "De 211 a 240 días", tasa: "2.870,00%" },
  { plazo: "De 241 a 270 días", tasa: "3.100,00%" },
  { plazo: "De 271 a 300 días", tasa: "2.833,10%" },
  { plazo: "De 301 a 330 días", tasa: "2.900,00%" },
  { plazo: "De 331 a 360 días", tasa: "3.000,00%" },
];

export const TasasModal = ({ isOpen, onClose }) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Tasas promedio mercado SGR" maxWidth="800px">
      <div className={styles.container}>
        <p className={styles.subtitle}>
          Tasa promedio mercado SGR del día 27/04/2026 *
        </p>

        <h3 className={styles.sectionTitle}>Cheques</h3>

        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Plazo</th>
                <th>Tasa promedio mercado SGR</th>
              </tr>
            </thead>
            <tbody>
              {TASAS_DATA.map((row) => (
                <tr key={row.plazo}>
                  <td>{row.plazo}</td>
                  <td>{row.tasa}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className={styles.disclaimer}>
          *(Se informa como referencia la tasa promedio ponderada del mercado SGR
          operada el 27/04/2026. En caso de no contar con tasa para algún plazo
          para el 27/04/2026 se informa la última tasa promedio operada)
        </div>
      </div>
    </Modal>
  );
};
