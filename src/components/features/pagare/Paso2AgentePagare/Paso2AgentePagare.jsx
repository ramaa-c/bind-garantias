import React from "react";
import { useFormContext, Controller } from "react-hook-form";
import { FiBriefcase, FiCheckCircle } from "react-icons/fi";
import { Button } from "../../../ui";
import styles from "./Paso2AgentePagare.module.css";

const agentes = [
  { id: "industrial", nombre: "Industrial Valores S.A.", icono: <FiBriefcase /> },
  { id: "bullmarket", nombre: "Bull Market Brokers", icono: <FiBriefcase /> },
  { id: "balanz", nombre: "Balanz Capital", icono: <FiBriefcase /> },
];

export default function Paso2AgentePagare({ avanzarPaso }) {
  const {
    control,
    formState: { errors },
  } = useFormContext();

  return (
    <div className={styles.container}>
      <Controller
        name="agenteBolsa"
        control={control}
        defaultValue=""
        render={({ field: { onChange, value } }) => (
          <div className={styles.listContainer}>
            {agentes.map((agente) => {
              const isSelected = value === agente.id;
              
              return (
                <div
                  key={agente.id}
                  className={`${styles.listItem} ${isSelected ? styles.listItemSelected : ""}`}
                  onClick={() => onChange(agente.id)}
                >
                  <div className={styles.itemLeft}>
                    <span className={styles.agentIcon}>{agente.icono}</span>
                    <span className={styles.itemName}>{agente.nombre}</span>
                  </div>

                  <div className={styles.itemRight}>
                    {isSelected ? (
                      <FiCheckCircle className={styles.checkIcon} />
                    ) : (
                      <div className={styles.emptyCircle}></div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      />

      {errors.agenteBolsa && (
        <span className={styles.errorText}>
          {errors.agenteBolsa.message}
        </span>
      )}

      <div className={styles.actionsRight}>
        <Button
          type="button"
          variant="primary"
          onClick={() => avanzarPaso(["agenteBolsa"], 3)}
        >
          CONTINUAR
        </Button>
      </div>
    </div>
  );
}