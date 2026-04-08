import React, { useState } from "react";
import { useFormContext, useWatch } from "react-hook-form";
import { FiCheckCircle } from "react-icons/fi";
import { BuscadorCuit, Button, BotonVolver } from "../../../ui";
import styles from "./PasoEmisor.module.css";

export default function PasoEmisor({ onValidar }) {
  const {
    control,
    setValue,
    trigger,
  } = useFormContext();

  const [faseEmisor, setFaseEmisor] = useState("ingresar_cuit");
  const [razonSocial, setRazonSocial] = useState("");
  const [errorCuitLocal, setErrorCuitLocal] = useState("");
  const [validando, setValidando] = useState(false);

  const cuitActual = useWatch({ control, name: "emisorCuit" });
  const isCuitValido = cuitActual?.length === 11;

  const handleValidarClick = async () => {
    if (!cuitActual) {
      setErrorCuitLocal("El CUIT es obligatorio");
      return;
    }

    // Validamos con Zod primero
    const pasaZod = await trigger("emisorCuit");
    if (!pasaZod) return;

    setErrorCuitLocal("");
    setValidando(true);

    // Simulamos la llamada a la base de datos
    setTimeout(() => {
      setRazonSocial("AGROPECUARIA PAMPEANA S.A.");
      setValidando(false);
      setFaseEmisor("validado");
    }, 800);
  };

  const handleModificarCuit = () => {
    setValue("emisorCuit", "");
    setRazonSocial("");
    setFaseEmisor("ingresar_cuit");
  };

  return (
    <div className={styles.container}>

      {/* --- REEMPLAZO DEL CONTENEDOR PASO POR EL ESTILO DEL PASO 4 --- */}
      <div className={styles.headerTitleRow}>
        <h3 className={styles.headerTitle}>Datos del Emisor</h3>
        <p className={styles.helperText}>
          Ingresá el CUIT del emisor del cheque para validar su información.
        </p>
      </div>

      {/* --- FASE 1: BUSCADOR DE CUIT --- */}
      {faseEmisor === "ingresar_cuit" && (
        <div className={styles.sectionAnimada}>
          <BuscadorCuit
            label="CUIT del Emisor"
            value={cuitActual || ""}
            onChange={(e) => {
              setValue("emisorCuit", e.target.value);
              if (errorCuitLocal) setErrorCuitLocal("");
            }}
            onValidar={handleValidarClick}
            error={errorCuitLocal}
            esValido={isCuitValido}
            buttonText={validando ? "VALIDANDO..." : "VALIDAR CUIT"}
          />
        </div>
      )}

      {/* --- FASE 2: TARJETA DE RESULTADO --- */}
      {faseEmisor === "validado" && (
        <div className={styles.sectionAnimada}>
          <div className={styles.topBackButtonWrapper}>
            <BotonVolver
              texto="MODIFICAR CUIT"
              onClick={handleModificarCuit}
            />
          </div>

          <div className={styles.summaryCard}>
            <div className={styles.summaryTop}>
              <div className={styles.summaryStatus}>
                <FiCheckCircle size={16} />
                <span>EMISOR ENCONTRADO</span>
              </div>
              <p className={styles.summaryName}>{razonSocial}</p>
              <p className={styles.summaryCuit}>CUIT: {cuitActual}</p>
            </div>
          </div>

          <div className={styles.actions}>
            <Button type="button" variant="primary" onClick={onValidar}>
              CONTINUAR
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}