import React from "react";
import { useFormContext, Controller, useWatch } from "react-hook-form";
import { FiBriefcase, FiCheckCircle, FiArrowRight } from "react-icons/fi";
import { InputFlotante, Button, ContenedorPaso } from "../../../ui";
import styles from "./PasoBolsa.module.css";

const sociedades = [
  { id: "tarallo", nombre: "Tarallo S.A.", icono: <FiBriefcase /> },
  { id: "otra", nombre: "Otra Sociedad de Bolsa", icono: <FiBriefcase /> },
];

export default function PasoBolsa({ avanzarConBolsa, avanzarSinBolsa }) {
  const {
    register,
    control,
    formState: { errors },
    setValue,
  } = useFormContext();

  const cuentaBolsa = useWatch({
    control,
    name: "numeroCuentaBolsa",
    defaultValue: "",
  });

  return (
    <ContenedorPaso
      titulo="Sociedad de Bolsa"
      descripcion="¿Operás con alguna de estas sociedades de bolsa?"
    >
      <Controller
        name="sociedadBolsa"
        control={control}
        render={({ field: { onChange, value } }) => (
          <div className={styles.listContainer}>
            {sociedades.map((sociedad) => {
              const isSelected = value === sociedad.nombre;

              const handleSelect = () => {
                if (isSelected) {
                  onChange("");
                  setValue("numeroCuentaBolsa", "");
                } else {
                  onChange(sociedad.nombre);
                }
              };

              return (
                <React.Fragment key={sociedad.id}>
                  <div
                    className={`${styles.listItem} ${isSelected ? styles.listItemSelected : ""}`}
                    role="button"
                    tabIndex={0}
                    onClick={handleSelect}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        handleSelect();
                      }
                    }}
                  >
                    <div className={styles.itemLeft}>
                      <span className={styles.agentIcon}>{sociedad.icono}</span>
                      <span className={styles.itemName}>{sociedad.nombre}</span>
                    </div>
                    <div>
                      {isSelected ? (
                        <FiCheckCircle className={styles.checkIcon} />
                      ) : (
                        <div className={styles.emptyCircle}></div>
                      )}
                    </div>
                  </div>

                  {isSelected && (
                    <div className={styles.expandedArea}>
                      <div className={styles.inputWrapper}>
                        <InputFlotante
                          label={`Número de cuenta en ${sociedad.nombre}`}
                          esValido={cuentaBolsa.length >= 4}
                          error={errors.numeroCuentaBolsa?.message}
                          {...register("numeroCuentaBolsa")}
                        />
                      </div>

                      <div className={styles.btnActionWrapper}>
                        <Button
                          type="button"
                          variant="primary"
                          onClick={avanzarConBolsa}
                        >
                          CONFIRMAR Y AVANZAR
                        </Button>
                      </div>
                    </div>
                  )}
                </React.Fragment>
              );
            })}
          </div>
        )}
      />

      <div className={styles.altSection}>
        <p className={styles.altText}>
          ¿No tenés cuenta en ninguna de las opciones anteriores?
        </p>
        <div className={styles.altButtonWrapper}>
          <Button type="button" variant="outline" onClick={avanzarSinBolsa}>
            CONTINUAR SIN SOCIEDAD DE BOLSA{" "}
            <FiArrowRight className={styles.iconRight} />
          </Button>
        </div>
      </div>
    </ContenedorPaso>
  );
}
