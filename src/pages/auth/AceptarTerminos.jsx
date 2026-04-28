import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../../components/ui";
import { TERMINOS_Y_CONDICIONES } from "../../constants/terminosCondiciones";
import styles from "./AceptarTerminos.module.css";

export default function AceptarTerminos() {
  const navigate = useNavigate();
  const [aceptado, setAceptado] = useState(false);

  const handleToggle = () => {
    setAceptado(!aceptado);
  };

  const handleAceptarTerminos = () => {
    if (aceptado) {
      navigate("/inicio");
    }
  };

  return (
    <div className={styles.pageContainer}>
      <div className={styles.tycContainer}>
        {TERMINOS_Y_CONDICIONES.map((seccion) => (
          <div key={seccion.id} className={styles.seccionTerminos}>
            {seccion.titulo && (
              <h3 className={styles.tituloSeccion}>{seccion.titulo}</h3>
            )}

            {seccion.esTabla ? (
              <table className={styles.tablaLegal}>
                <tbody>
                  <tr>
                    <td>Usuario</td>
                    <td>
                      Cliente que accede a la Plataforma, y que interactúa con
                      ella con total acceso a las funcionalidades que esta
                      provee. El mismo podrá darse de alta como cliente,
                      solicitar una línea de aval crediticio, así como requerir
                      pedidos de emisión de avales, todo ello sujeto a las
                      políticas vigentes y la aprobación de Garantías Bind SGR
                      (de ahora en adelante “BIND SGR”).
                    </td>
                  </tr>
                  <tr>
                    <td>Usuario Autorizado</td>
                    <td>
                      Es un usuario, que se encuentra habilitado para acceder a
                      la Plataforma y que podrá utilizar recursos específicos
                      dentro de dicho sistema. Puntualmente podrá dar de alta al
                      Cliente para que el mismo pueda ser calificado.
                    </td>
                  </tr>
                </tbody>
              </table>
            ) : (
              seccion.parrafos.map((parrafo, index) => (
                <p key={`${seccion.id}-p-${index}`}>{parrafo}</p>
              ))
            )}
          </div>
        ))}

        <div className={styles.tycFooter}>
          <label className={styles.checkboxContainer}>
            <input
              type="checkbox"
              className={styles.hiddenCheckbox}
              checked={aceptado}
              onChange={handleToggle}
            />
            <div className={styles.customCheckmark}></div>
            <span className={styles.checkboxLabel}>
              Acepto los términos y condiciones
            </span>
          </label>

          <Button
            variant="primary"
            disabled={!aceptado}
            onClick={handleAceptarTerminos}
            className={styles.btnAceptar}
          >
            CONTINUAR
          </Button>
        </div>
      </div>
    </div>
  );
}
