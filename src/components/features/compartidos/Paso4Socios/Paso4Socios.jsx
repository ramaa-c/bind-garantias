import React from "react";
import { FiEdit, FiTrash2, FiUserPlus, FiCheckCircle } from "react-icons/fi";
// Reemplazamos Input por InputFlotante
import { InputFlotante, Button, Badge, Avatar, BotonIcono } from "../../../ui";
import styles from "./Paso4Socios.module.css";

export default function Paso4Socios({
  faseSocio,
  setFaseSocio,
  tempSocioCuit,
  setTempSocioCuit,
  tempSocioNombre,
  tempSocioParticipacion,
  setTempSocioParticipacion,
  socios,
  iniciarCargaSocio,
  validarCuitSocio,
  guardarSocio,
  eliminarSocio,
  continuarAlProximoPaso,
}) {
  return (
    <div className={styles.container}>
      
      {/* --- FASE 1: INGRESAR CUIT --- */}
      {faseSocio === "ingresar_cuit" && (
        <div className={styles.section}>
          <h3 className={styles.headerTitle}>
            <FiUserPlus /> Añadir nuevo socio
          </h3>
          <p className={styles.helperText}>
            Ingresá el número de CUIT/CUIL para validar su identidad en AFIP.
          </p>

          <div className={styles.searchRow} style={{ marginTop: "30px", alignItems: "flex-start" }}>
            <div className={styles.searchInput}>
              <InputFlotante
                label="CUIT del Socio"
                maxLength={11}
                value={tempSocioCuit}
                esValido={tempSocioCuit.length === 11}
                onChange={(e) => setTempSocioCuit(e.target.value)}
              />
            </div>
            {/* Ajustamos el botón para que alinee con la línea del input */}
            <div style={{ marginTop: "4px" }}>
              <Button
                variant="primary"
                onClick={validarCuitSocio}
                className={styles.tallButton}
              >
                VALIDAR CUIT
              </Button>
            </div>
          </div>

          {socios.length > 0 && (
            <div className={styles.mtMedium}>
              <Button
                variant="outline"
                onClick={() => setFaseSocio("lista")}
                className={styles.borderless}
              >
                Cancelar y volver a la lista
              </Button>
            </div>
          )}
        </div>
      )}

      {/* --- FASE 2: COMPLETAR DATOS --- */}
      {faseSocio === "completar_datos" && (
        <div className={styles.section}>
          <h3 className={styles.headerTitle}>Completar datos del socio</h3>

          <div className={styles.summaryCard}>
            <div className={styles.summaryStatus}>
              <FiCheckCircle size={16} />
              <span>IDENTIDAD VALIDADA</span>
            </div>
            <p className={styles.summaryName}>{tempSocioNombre}</p>
            <p className={styles.summaryCuit}>CUIT: {tempSocioCuit}</p>
          </div>

          <div className={styles.percentageWrapper} style={{ marginTop: "40px" }}>
            <InputFlotante
              type="number"
              label="Porcentaje de participación (%)"
              value={tempSocioParticipacion}
              esValido={tempSocioParticipacion > 0 && tempSocioParticipacion <= 100}
              onChange={(e) => setTempSocioParticipacion(e.target.value)}
            />
          </div>

          <div className={styles.actionFooter}>
            <Button
              variant="outline"
              onClick={() =>
                socios.length === 0
                  ? setFaseSocio("ingresar_cuit")
                  : setFaseSocio("lista")
              }
              className={styles.borderless}
            >
              CANCELAR
            </Button>
            <Button variant="primary" onClick={guardarSocio}>
              GUARDAR SOCIO
            </Button>
          </div>
        </div>
      )}

      {/* --- FASE 3: LISTA DE SOCIOS --- */}
      {faseSocio === "lista" && (
        <div className={styles.section}>
          <div className={styles.listHeader}>
            <h3 className={`${styles.headerTitle} ${styles.noMargin}`}>
              Socios declarados
            </h3>
            <Badge>
              {socios.length} socio{socios.length > 1 ? "s" : ""}
            </Badge>
          </div>

          <div className={styles.listContainer}>
            {socios.map((socio, index) => (
              <div className={styles.listItem} key={index}>
                <div className={styles.itemLeft}>
                  <Avatar name={socio.nombre} />
                  <div className={styles.itemInfo}>
                    <p className={styles.itemName}>{socio.nombre}</p>
                    <p className={styles.itemDetails}>
                      CUIT {socio.cuit} • Participación:{" "}
                      <span className={styles.highlight}>
                        {socio.participacion}%
                      </span>
                    </p>
                  </div>
                </div>

                <div className={styles.itemActions}>
                  <BotonIcono icon={FiEdit} title="Editar participación" />
                  <BotonIcono
                    icon={FiTrash2}
                    variant="danger"
                    title="Eliminar socio"
                    onClick={() => eliminarSocio(index)}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className={styles.actionFooterBorder}>
            <Button variant="outline" onClick={iniciarCargaSocio}>
              <FiUserPlus className={styles.iconMarginRight} /> AGREGAR SOCIO
            </Button>
            <Button variant="primary" onClick={continuarAlProximoPaso}>
              CONTINUAR
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}