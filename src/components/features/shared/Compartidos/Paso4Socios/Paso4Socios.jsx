import React, { useState } from "react";
import {
  FiEdit,
  FiTrash2,
  FiUserPlus,
  FiCheckCircle,
  FiChevronRight,
  FiUser,
} from "react-icons/fi";
import {
  InputFlotante,
  Button,
  Badge,
  Avatar,
  BotonIcono,
  BuscadorCuit,
  Alert,
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
  isLoading,
}) {
  const [errorCuit, setErrorCuit] = useState("");
  const [errorParticipacion, setErrorParticipacion] = useState("");

  const isCuitValido = tempSocioCuit?.length === 11;

  const totalGuardado = socios.reduce(
    (acc, s) => acc + Number(s.participacion),
    0,
  );
  const restante = 100 - totalGuardado;

  // --- HANDLERS ---
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
    const valorNum = Number(tempSocioParticipacion);

    if (!tempSocioParticipacion) {
      setErrorParticipacion("Ingresá un porcentaje");
    } else if (valorNum <= 0 || valorNum > 100) {
      setErrorParticipacion("Debe ser entre 1 y 100");
    } else if (valorNum > restante) {
      setErrorParticipacion(`No puede superar el 100% total.`);
    } else {
      setErrorParticipacion("");
      guardarSocio();
    }
  };

  const handleVolverAEdicion = () => {
    setErrorParticipacion("");
    socios.length === 0 ? setFaseSocio("ingresar_cuit") : setFaseSocio("lista");
  };

  return (
    <div className={styles.container}>
      {/* --- FASE 1: INGRESAR CUIT --- */}
      {faseSocio === "ingresar_cuit" && (
        <div className={styles.section}>


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
            isLoading={isLoading}
          />

          {socios.length > 0 && (
            <div className={styles.saveActionRowCentrado} style={{ marginTop: "1rem" }}>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setErrorCuit("");
                  setFaseSocio("lista");
                }}
              >
                CANCELAR Y VOLVER
              </Button>
            </div>
          )}
        </div>
      )}

      {/* --- FASE 2: COMPLETAR DATOS --- */}
      {faseSocio === "completar_datos" && (
        <div className={styles.section}>


          <div className={styles.summaryCard}>
            <div className={styles.summaryTop}>
              <button
                type="button"
                className={styles.editIconBtn}
                onClick={handleVolverAEdicion}
                title="Editar identidad"
              >
                <FiEdit size={18} />
              </button>

              <div className={styles.summaryStatus}>
                <FiCheckCircle size={16} />
                <span>IDENTIDAD VALIDADA</span>
              </div>
              <p className={styles.summaryName}>{tempSocioNombre}</p>
              <p className={styles.summaryCuit}>CUIT: {tempSocioCuit}</p>
            </div>

            <div className={styles.summaryDivider}></div>

            <div className={styles.summaryBottom}>
              <div className={styles.labelColumn}>
                <label
                  htmlFor="participacionSocioInput"
                  className={styles.percentageLabel}
                >
                  Participación del socio
                </label>
                <span
                  className={`${styles.availableText} ${restante === 0 ? styles.availableTextError : ""
                    }`}
                >
                  {restante > 0 ? `Disponible: ${restante}%` : "Cupo completo"}
                </span>
              </div>

              <div
                className={`${styles.customInputWrapper} ${errorParticipacion ? styles.wrapperError : ""
                  }`}
              >
                <input
                  id="participacionSocioInput"
                  type="text"
                  className={styles.customInput}
                  placeholder="0"
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

              <div className={styles.errorContainer}>
                {errorParticipacion && (
                  <span className={styles.errorText}>{errorParticipacion}</span>
                )}
              </div>
            </div>
          </div>

          <div className={styles.saveActionRowCentrado}>
            <Button
              type="button"
              variant="primary"
              onClick={handleGuardarClick}
              disabled={restante === 0 && !tempSocioParticipacion}
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

            <div className={styles.statsGroup}>
              <Badge>
                {socios.length} socio{socios.length > 1 ? "s" : ""}
              </Badge>
              <span
                className={`${styles.totalText} ${totalGuardado === 100 ? styles.totalTextSuccess : ""
                  }`}
              >
                Total: {totalGuardado}% / 100%
              </span>
            </div>
          </div>

          <div className={styles.listContainer}>
            {socios.map((socio, index) => (
              <div className={styles.listItem} key={socio.cuit}>
                <div className={styles.itemLeft}>
                  <Avatar name={socio.nombre} icon={FiUser} />
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
            {totalGuardado !== 100 && (
              <span className={styles.warningText}>
                Debe completar el 100% para continuar
              </span>
            )}
            <Button
              type="button"
              variant="outline"
              onClick={iniciarCargaSocio}
              disabled={totalGuardado >= 100}
            >
              <FiUserPlus className={styles.iconMarginRight} /> AGREGAR SOCIO
            </Button>
            <Button
              type="button"
              variant="primary"
              iconRight={<FiChevronRight />}
              onClick={continuarAlProximoPaso}
              disabled={totalGuardado !== 100}
            >
              CONTINUAR
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
