import React, { useState } from "react";
import {
  FiEdit,
  FiTrash2,
  FiUserPlus,
  FiCheckCircle,
  FiChevronRight,
} from "react-icons/fi";
import {
  InputFlotante,
  Button,
  Badge,
  Avatar,
  BotonIcono,
  BuscadorCuit,
  BotonVolver,
} from "../../../../ui";
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
  editarSocio,
  continuarAlProximoPaso,
}) {
  const [errorCuit, setErrorCuit] = useState("");
  const [errorParticipacion, setErrorParticipacion] = useState("");

  const isCuitValido = tempSocioCuit?.length === 11;
  const isParticipacionValida =
    tempSocioParticipacion > 0 && tempSocioParticipacion <= 100;

  const handleValidarClick = () => {
    if (!tempSocioCuit) {
      setErrorCuit("El CUIT es obligatorio");
    } else if (tempSocioCuit.length < 11) {
      setErrorCuit("Debe contener 11 números exactos");
    } else {
      setErrorCuit("");
      validarCuitSocio();
    }
  };

  const handleGuardarClick = () => {
    if (!tempSocioParticipacion) {
      setErrorParticipacion("Ingresá un porcentaje");
    } else if (!isParticipacionValida) {
      setErrorParticipacion("Debe ser mayor a 0 y hasta 100");
    } else {
      setErrorParticipacion("");
      guardarSocio();
    }
  };

  return (
    <div className={styles.container}>
      {/* --- FASE 1: INGRESAR CUIT --- */}
      {faseSocio === "ingresar_cuit" && (
        <div className={styles.section}>
          <div className={styles.headerTitleRow}>
            <h3 className={styles.headerTitle}>
              <FiUserPlus /> Añadir nuevo socio
            </h3>
            <p className={styles.helperText}>
              Ingresá el número de CUIT/CUIL para validar su identidad en AFIP.
            </p>
          </div>

          <BuscadorCuit
            label="CUIT del Socio"
            value={tempSocioCuit}
            onChange={(e) => {
              setTempSocioCuit(e.target.value);
              if (errorCuit) setErrorCuit("");
            }}
            onValidar={handleValidarClick}
            error={errorCuit}
            esValido={isCuitValido}
            buttonText="VALIDAR CUIT"
          />

          {socios.length > 0 && (
            <div className={styles.mtMedium}>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setErrorCuit("");
                  setFaseSocio("lista");
                }}
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
          <div className={styles.topBackButtonWrapper}>
            <BotonVolver
              texto="VOLVER"
              onClick={() => {
                setErrorParticipacion("");
                socios.length === 0
                  ? setFaseSocio("ingresar_cuit")
                  : setFaseSocio("lista");
              }}
            />
          </div>

          <h3 className={styles.headerTitle}>Completar datos del socio</h3>

          <div className={styles.summaryCard}>
            {/* --- SECCIÓN SUPERIOR: DATOS DEL SOCIO --- */}
            <div className={styles.summaryTop}>
              <div className={styles.summaryStatus}>
                <FiCheckCircle size={16} />
                <span>IDENTIDAD VALIDADA</span>
              </div>
              <p className={styles.summaryName}>{tempSocioNombre}</p>
              <p className={styles.summaryCuit}>CUIT: {tempSocioCuit}</p>
            </div>

            {/* --- LÍNEA DIVISORIA --- */}
            <div className={styles.summaryDivider}></div>

            {/* --- SECCIÓN INFERIOR: PORCENTAJE (NUEVO DISEÑO) --- */}
            <div className={styles.summaryBottom}>
              <label htmlFor="participacionSocioInput" className={styles.percentageLabel}>Participación del socio</label>

              <div className={`${styles.customInputWrapper} ${errorParticipacion ? styles.wrapperError : ""}`}>
                <input
                  id="participacionSocioInput"
                  type="text"
                  className={styles.customInput}
                  maxLength={3}
                  value={tempSocioParticipacion}
                  onChange={(e) => {
                    const valorFiltro = e.target.value.replace(/\D/g, "");
                    if (valorFiltro === "" || Number(valorFiltro) <= 100) {
                      setTempSocioParticipacion(valorFiltro);
                      if (errorParticipacion) setErrorParticipacion("");
                    }
                  }}
                />
                <span className={styles.percentageSymbol}>%</span>
              </div>

              {/* Mensaje de error si hace falta */}
              {errorParticipacion && (
                <span className={styles.errorText}>{errorParticipacion}</span>
              )}
            </div>
          </div>

          <div className={styles.saveActionRowCentrado}>
            <Button
              type="button"
              variant="primary"
              onClick={handleGuardarClick}
            >
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
              <div className={styles.listItem} key={socio.cuit}>
                <div className={styles.itemLeft}>
                  <Avatar name={socio.nombre} />
                  <div className={styles.itemInfo}>
                    <p className={styles.itemName}>{socio.nombre}</p>
                    <p className={styles.itemDetails}>
                      CUIT: {socio.cuit} • Participación:{" "}
                      <span className={styles.highlight}>
                        {socio.participacion}%
                      </span>
                    </p>
                  </div>
                </div>

                <div className={styles.itemActions}>
                  <BotonIcono
                    icon={FiEdit}
                    title="Editar participación"
                    onClick={() => editarSocio(index)}
                  />
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
            <Button type="button" variant="outline" onClick={iniciarCargaSocio}>
              <FiUserPlus className={styles.iconMarginRight} /> AGREGAR SOCIO
            </Button>
            <Button
              type="button"
              variant="primary"
              iconRight={<FiChevronRight />}
              onClick={continuarAlProximoPaso}
            >
              CONTINUAR
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
