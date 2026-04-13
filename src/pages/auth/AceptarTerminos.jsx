import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../../components/ui";
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
        <div className={styles.tycHeader}>
          <h1 className={styles.tycTitle}>Términos y Condiciones de Uso</h1>
          <p className={styles.tycSubtitle}>
            Por favor, lea detenidamente el siguiente documento antes de
            continuar.
          </p>
        </div>

        <div className={styles.scrollBox}>
          <p>
            <strong>1. Aceptación de los Términos</strong>
            <br />
            Al acceder y utilizar la plataforma BIND Garantías, usted acepta
            estar sujeto a estos Términos y Condiciones. Si no está de acuerdo
            con alguna parte de los términos, no podrá acceder a nuestros
            servicios financieros.
          </p>
          <p>
            <strong>2. Uso de la Plataforma</strong>
            <br />
            El usuario se compromete a hacer un uso adecuado y lícito de la
            plataforma, así como de los contenidos y servicios, de conformidad
            con la legislación aplicable, las buenas costumbres y el orden
            público.
          </p>
          <p>
            <strong>3. Privacidad y Datos Personales</strong>
            <br />
            El tratamiento de sus datos personales y financieros se regirá por
            nuestra estricta Política de Privacidad. Garantizamos la
            confidencialidad y el manejo seguro de la información proporcionada
            bajo normativas del BCRA.
          </p>
          <p>
            <strong>4. Operaciones y Firmas Digitales</strong>
            <br />
            Todas las operaciones validadas mediante firma electrónica o digital
            dentro de este entorno tienen carácter vinculante y validez legal
            conforme a la Ley de Firma Digital (Ley 25.506).
          </p>
          <p>
            <strong>5. Limitación de Responsabilidad</strong>
            <br />
            En ningún caso la empresa será responsable por daños indirectos,
            incidentales o consecuentes derivados del uso o la imposibilidad de
            uso del servicio por fallas técnicas externas.
          </p>
          <p>
            <strong>1. Aceptación de los Términos</strong>
            <br />
            Al acceder y utilizar la plataforma BIND Garantías, usted acepta
            estar sujeto a estos Términos y Condiciones. Si no está de acuerdo
            con alguna parte de los términos, no podrá acceder a nuestros
            servicios financieros.
          </p>
          <p>
            <strong>2. Uso de la Plataforma</strong>
            <br />
            El usuario se compromete a hacer un uso adecuado y lícito de la
            plataforma, así como de los contenidos y servicios, de conformidad
            con la legislación aplicable, las buenas costumbres y el orden
            público.
          </p>
          <p>
            <strong>3. Privacidad y Datos Personales</strong>
            <br />
            El tratamiento de sus datos personales y financieros se regirá por
            nuestra estricta Política de Privacidad. Garantizamos la
            confidencialidad y el manejo seguro de la información proporcionada
            bajo normativas del BCRA.
          </p>
          <p>
            <strong>4. Operaciones y Firmas Digitales</strong>
            <br />
            Todas las operaciones validadas mediante firma electrónica o digital
            dentro de este entorno tienen carácter vinculante y validez legal
            conforme a la Ley de Firma Digital (Ley 25.506).
          </p>
          <p>
            <strong>5. Limitación de Responsabilidad</strong>
            <br />
            En ningún caso la empresa será responsable por daños indirectos,
            incidentales o consecuentes derivados del uso o la imposibilidad de
            uso del servicio por fallas técnicas externas.
          </p>
        </div>

        <label className={styles.checkboxContainer}>
          <input
            type="checkbox"
            className={styles.hiddenCheckbox}
            checked={aceptado}
            onChange={handleToggle}
          />
          <div className={styles.customCheckmark}></div>
          <span className={styles.checkboxLabel}>
            He leído y acepto los términos y condiciones
          </span>
        </label>

        <div className={styles.tycFooter}>
          <Button
            variant="primary"
            disabled={!aceptado}
            onClick={handleAceptarTerminos}
            className={styles.btnAceptar}
          >
            Aceptar y Continuar
          </Button>
        </div>
      </div>
    </div>
  );
}
