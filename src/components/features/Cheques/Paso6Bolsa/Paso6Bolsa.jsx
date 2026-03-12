import React from "react";
import { useFormContext, Controller } from "react-hook-form";
import { FiBriefcase, FiCheckCircle, FiArrowRight } from "react-icons/fi";
import { Input, Button } from "../../../ui";
import styles from "./Paso6Bolsa.module.css";

const sociedades = [
  { id: "tarallo", nombre: "Tarallo S.A.", icono: <FiBriefcase /> },
  { id: "otra", nombre: "Otra Sociedad de Bolsa", icono: <FiBriefcase /> },
];

export default function Paso6Bolsa({ avanzarConBolsa, avanzarSinBolsa }) {
  const {
    register,
    control,
    formState: { errors },
    setValue,
  } = useFormContext();

  return (
    <div className={styles.container}>
      
      <h3 className={styles.title}>
        ¿Operás con alguna de estas sociedades de bolsa?
      </h3>

      <Controller
        name="sociedadBolsa"
        control={control}
        render={({ field: { onChange, value } }) => (
          <div className={styles.listContainer}>
            {sociedades.map((sociedad) => {
              const isSelected = value === sociedad.nombre;

              return (
                <React.Fragment key={sociedad.id}>
                  
                  {/* TARJETA SELECCIONABLE */}
                  <div
                    className={`${styles.listItem} ${isSelected ? styles.listItemSelected : ""}`}
                    onClick={() => {
                      if (isSelected) {
                        onChange("");
                        setValue("numeroCuentaBolsa", "");
                      } else {
                        onChange(sociedad.nombre);
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

                  {/* FORMULARIO DESPLEGABLE  */}
                  {isSelected && (
                    <div className={styles.expandedArea}>
                      <div className={styles.inputWrapper}>
                        <Input
                          label={`Número de cuenta en ${sociedad.nombre} *`}
                          placeholder="Ej: 12345678"
                          error={errors.numeroCuentaBolsa?.message}
                          {...register("numeroCuentaBolsa")}
                        />
                      </div>

                      <div>
                        <Button type="button" variant="primary" onClick={avanzarConBolsa}>
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

      {/* CAMINO ALTERNATIVO */}
      <div className={styles.altSection}>
        <p className={styles.altText}>
          ¿No tenés cuenta en ninguna de las opciones anteriores?
        </p>
        <div className={styles.altButtonWrapper}>
          <Button type="button" variant="outline" onClick={avanzarSinBolsa}>
            CONTINUAR SIN SOCIEDAD DE BOLSA <FiArrowRight className={styles.iconRight} />
          </Button>
        </div>
      </div>

    </div>
  );
}