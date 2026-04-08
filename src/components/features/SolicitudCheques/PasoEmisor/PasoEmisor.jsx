import React, { useState } from "react";
import { useFormContext } from "react-hook-form";
import { Input, Button, ContenedorPaso } from "../../../ui";
import styles from "./PasoEmisor.module.css";

export default function PasoEmisor({ onValidar }) {
  const {
    register,
    formState: { errors },
  } = useFormContext();

  const [razonSocial, setRazonSocial] = useState("");
  const [validando, setValidando] = useState(false);

  const handleLocalValidar = async () => {
    setValidando(true);
    // Simulamos un delay de carga
    setTimeout(() => {
      setRazonSocial("EMPRESA SIMULADA S.A.");
      setValidando(false);
    }, 800);
  };

  return (
    <ContenedorPaso
      titulo="Datos del Emisor"
      descripcion="Ingresá el CUIT del emisor del cheque para validar su información."
    >
      <div className={styles.formContainer}>
        <div className={styles.inputGroup}>
          <Input
            label="CUIT del Emisor"
            placeholder="Sin guiones"
            error={errors.emisorCuit?.message}
            {...register("emisorCuit")}
          />
          <div className={styles.btnValidarWrapper}>
            <Button
              type="button"
              variant="outline"
              onClick={handleLocalValidar}
              disabled={validando}
            >
              {validando ? "Validando..." : "Validar CUIT"}
            </Button>
          </div>
        </div>

        {razonSocial && (
          <div className={styles.razonSocialContainer}>
            <Input
              label="Razón Social"
              value={razonSocial}
              readOnly
              disabled
            />
          </div>
        )}
      </div>

      <div className={styles.actions}>
        <Button type="button" variant="primary" onClick={onValidar}>
          CONTINUAR
        </Button>
      </div>
    </ContenedorPaso>
  );
}
