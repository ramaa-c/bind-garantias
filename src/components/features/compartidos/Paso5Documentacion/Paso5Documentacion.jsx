import React, { useState } from "react";
import { useFormContext } from "react-hook-form";
import { FiCheckCircle, FiEdit, FiAlertCircle, FiUser } from "react-icons/fi";
import {
  InputFlotante,
  Button,
  Acordeon,
  CargaArchivos,
  Alert,
  Modal,
} from "../../../ui";
import styles from "./Paso5Documentacion.module.css";

export default function Paso5Documentacion({
  docExpandido,
  toggleDoc,
  socios,
  onVolverASocios,
  faseApoderado,
  setFaseApoderado,
  apoNombre,
  apoRol,
  setApoRol,
  validarCuitApoderado,
  guardarApoderado,
  avanzarPaso6,
}) {
  const {
    register,
    watch,
    formState: { errors },
  } = useFormContext();

  const apoCuitIngresado = watch("apoCuit", "");
  const [archivos, setArchivos] = useState({});
  const [draggingKey, setDraggingKey] = useState(null);
  const [socioActivoIndex, setSocioActivoIndex] = useState(null);
  const handleFileUpload = (key, file) => {
    if (file) {
      const sizeMB = (file.size / (1024 * 1024)).toFixed(2) + " MB";
      const fileToStore = Object.assign(file, { formattedSize: sizeMB });
      setArchivos((prev) => ({ ...prev, [key]: fileToStore }));
    }
  };
  const handleFileRemove = (key) => {
    setArchivos((prev) => {
      const nuevos = { ...prev };
      delete nuevos[key];
      return nuevos;
    });
  };
  const renderCargaArchivo = (key, title, subtitle) => {
    return (
      <div className={styles.dropzoneWrapper}>
        <input
          type="file"
          id={`file-input-${key}`}
          style={{ display: "none" }}
          onChange={(e) => handleFileUpload(key, e.target.files[0])}
        />
        <CargaArchivos
          title={title}
          subtitle={subtitle}
          file={
            archivos[key]
              ? { name: archivos[key].name, size: archivos[key].formattedSize }
              : null
          }
          onClick={() => document.getElementById(`file-input-${key}`).click()}
          onRemove={() => handleFileRemove(key)}
          isDragging={draggingKey === key}
          onDragOver={(e) => {
            e.preventDefault();
            setDraggingKey(key);
          }}
          onDragLeave={() => setDraggingKey(null)}
          onDrop={(e) => {
            e.preventDefault();
            setDraggingKey(null);
            if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
              handleFileUpload(key, e.dataTransfer.files[0]);
            }
          }}
        />
      </div>
    );
  };

  const isSocioCompleto = (index) => {
    const sEmail = watch(`socios.${index}.email`);
    const sCel = watch(`socios.${index}.celular`);
    const sDir = watch(`socios.${index}.direccion`);
    const dniFrenteSubido = archivos[`socio-${index}-frente`];
    const dniDorsoSubido = archivos[`socio-${index}-dorso`];

    return !!(sEmail && sCel && sDir && dniFrenteSubido && dniDorsoSubido);
  };

  return (
    <div className={styles.container}>
      {/* SECCIÓN 1: DOCUMENTACIÓN EMPRESA */}
      <h3 className={styles.title}>Documentación requerida</h3>

      <Acordeon
        title="Estatuto"
        status={archivos["estatuto"] ? "check" : "default"}
        defaultOpen={true}
      >
        <div className={styles.documentRow}>
          {renderCargaArchivo(
            "estatuto",
            "Subir archivo",
            "PDF o ZIP menor a 5MB",
          )}
          <div className={styles.docInfoBox}>
            Los estatutos son las normas por las que se regirá el funcionamiento
            de la entidad.
          </div>
        </div>
      </Acordeon>

      <Acordeon
        title="Último Balance exigible, certificado"
        status={archivos["balance"] ? "check" : "alert"}
      >
        <div className={styles.documentRow}>
          {renderCargaArchivo(
            "balance",
            "Subir archivo",
            "PDF o ZIP menor a 5MB",
          )}
          <div className={styles.docInfoBox}>
            Este informe debe ser auditado por un contador.
          </div>
        </div>
      </Acordeon>

      <Acordeon
        title="Acta de designación de autoridades"
        status={archivos["acta"] ? "check" : "alert"}
      >
        <div className={styles.documentRow}>
          {renderCargaArchivo("acta", "Subir archivo", "PDF o ZIP menor a 5MB")}
          <div className={styles.docInfoBox}>
            Copia certificada del acta de asamblea donde se designan las
            autoridades vigentes.
          </div>
        </div>
      </Acordeon>

      <Acordeon title="Poderes" status={archivos["poderes"] ? "check" : "warn"}>
        <div className={styles.documentRow}>
          {renderCargaArchivo(
            "poderes",
            "Subir archivo",
            "PDF o ZIP menor a 5MB",
          )}
          <div className={styles.docInfoBox}>
            Copia de los poderes otorgados para operar y representar a la
            sociedad.
          </div>
        </div>
      </Acordeon>

      <hr className={styles.divider} />

      {/* SECCIÓN 2: TAREAS DE SOCIOS */}
      <h3 className={`${styles.title} ${styles.titleSmallMargin}`}>
        Completá la información y documentación de cada socio.
      </h3>

      {socios.length === 0 ? (
        <Alert variant="warning" layout="box">
          No hay socios cargados para completar información.
        </Alert>
      ) : (
        socios.map((socio, index) => {
          const estaCompleto = isSocioCompleto(index);

          return (
            <div className={styles.socioCard} key={index}>
              <div className={styles.socioCardInfo}>
                <div
                  className={`${styles.socioAvatar} ${estaCompleto ? styles.avatarReady : styles.avatarPending}`}
                >
                  {estaCompleto ? <FiCheckCircle /> : <FiAlertCircle />}
                </div>
                <div className={styles.socioData}>
                  <h4>{socio.nombre}</h4>
                  <p>
                    CUIT: {socio.cuit} • Participación: {socio.participacion}%
                  </p>
                </div>
              </div>

              <Button
                variant={estaCompleto ? "outline" : "primary"}
                onClick={() => setSocioActivoIndex(index)}
              >
                {estaCompleto ? "Modificar" : "Completar datos"}
              </Button>
            </div>
          );
        })
      )}

      <hr className={styles.divider} />

      {/* SECCIÓN 3: Representante Legal */}
      <h3 className={styles.title}>Representante Legal / Apoderado</h3>

      {faseApoderado === "ingresar" && (
        <div
          className={styles.searchContainer}
          style={{ alignItems: "flex-start", marginTop: "20px" }}
        >
          <div className={styles.col}>
            <InputFlotante
              label="CUIT del apoderado"
              maxLength={11}
              esValido={apoCuitIngresado.length === 11}
              error={errors.apoCuit?.message}
              {...register("apoCuit")}
            />
          </div>
          <div style={{ marginTop: "4px" }}>
            <Button
              variant="primary"
              className={styles.tallButton}
              onClick={validarCuitApoderado}
            >
              VALIDAR
            </Button>
          </div>
        </div>
      )}

      {faseApoderado === "completar" && (
        <div className={styles.container}>
          <div className={styles.row} style={{ marginTop: "30px" }}>
            <div className={styles.col}>
              <InputFlotante
                label="Cuit"
                value={apoCuitIngresado}
                readOnly
                disabled
                esValido={true}
              />
            </div>
            <div className={styles.col}>
              <InputFlotante
                label="Nombre y Apellido"
                value={apoNombre}
                readOnly
                disabled
                esValido={true}
              />
            </div>
          </div>
          <div className={styles.row} style={{ marginTop: "40px" }}>
            <div className={styles.col}>
              <InputFlotante
                label="Email"
                type="email"
                esValido={watch("apoEmail")?.includes("@")}
                {...register("apoEmail")}
              />
            </div>
            <div className={styles.col}>
              <InputFlotante
                label="Celular"
                esValido={watch("apoCelular")?.length >= 10}
                {...register("apoCelular")}
              />
            </div>
          </div>
          <div className={styles.actionsFlex} style={{ marginTop: "20px" }}>
            <Button
              variant="outline"
              className={styles.borderless}
              onClick={() => setFaseApoderado("ingresar")}
            >
              CANCELAR
            </Button>
            <Button variant="primary" onClick={guardarApoderado}>
              GUARDAR
            </Button>
          </div>
        </div>
      )}

      {faseApoderado === "guardado" && (
        <div className={styles.summaryCard}>
          <div className={styles.summaryInfo}>
            <div className={styles.summaryStatus}>
              <FiCheckCircle size={16} />
              <span>IDENTIDAD VALIDADA</span>
            </div>
            <p className={styles.summaryName}>
              {apoNombre} - {apoRol}
            </p>
          </div>
          <Button
            variant="outline"
            onClick={() => setFaseApoderado("completar")}
          >
            <FiEdit /> Editar
          </Button>
        </div>
      )}

      <hr className={styles.divider} />

      {/* SECCIÓN 4: Facturación */}
      <div className={styles.billingSection}>
        <h3 className={styles.titleSmall}>MAIL DE FACTURACIÓN:</h3>
        <div
          className={styles.billingInputWrapper}
          style={{ marginTop: "40px" }}
        >
          <InputFlotante
            label="Email"
            type="email"
            esValido={watch("emailFacturacion")?.includes("@")}
            {...register("emailFacturacion")}
          />
        </div>
      </div>

      <div className={styles.actionsRight}>
        <Button variant="primary" onClick={avanzarPaso6}>
          CONTINUAR
        </Button>
      </div>

      <Modal
        isOpen={socioActivoIndex !== null}
        onClose={() => setSocioActivoIndex(null)}
        title={
          socioActivoIndex !== null
            ? `Datos de ${socios[socioActivoIndex].nombre}`
            : ""
        }
        maxWidth="700px"
      >
        {socioActivoIndex !== null && (
          <div className={styles.modalSocioBody}>
            <h4 className={styles.modalSectionTitle}>
              1. Información de contacto
            </h4>
            <div className={styles.row}>
              <div className={styles.col}>
                <InputFlotante
                  label="Email"
                  type="email"
                  esValido={watch(`socios.${socioActivoIndex}.email`)?.includes(
                    "@",
                  )}
                  {...register(`socios.${socioActivoIndex}.email`)}
                />
              </div>
              <div className={styles.col}>
                <InputFlotante
                  label="Celular"
                  esValido={
                    watch(`socios.${socioActivoIndex}.celular`)?.length >= 10
                  }
                  {...register(`socios.${socioActivoIndex}.celular`)}
                />
              </div>
            </div>

            <div className={styles.row}>
              <div className={styles.col}>
                <InputFlotante
                  label="Dirección"
                  esValido={
                    watch(`socios.${socioActivoIndex}.direccion`)?.length > 5
                  }
                  {...register(`socios.${socioActivoIndex}.direccion`)}
                />
              </div>
            </div>

            <div className={styles.row}>
              <div className={styles.col}>
                <InputFlotante
                  label="Provincia"
                  esValido={
                    watch(`socios.${socioActivoIndex}.provincia`)?.length > 2
                  }
                  {...register(`socios.${socioActivoIndex}.provincia`)}
                />
              </div>
              <div className={styles.col}>
                <InputFlotante
                  label="Localidad"
                  esValido={
                    watch(`socios.${socioActivoIndex}.localidad`)?.length > 2
                  }
                  {...register(`socios.${socioActivoIndex}.localidad`)}
                />
              </div>
            </div>

            <h4 className={styles.modalSectionTitle}>2. Identidad (DNI)</h4>
            <div className={styles.dropzoneGrid}>
              {renderCargaArchivo(
                `socio-${socioActivoIndex}-frente`,
                "DNI Frente",
                "Imagen clara y legible",
              )}
              {renderCargaArchivo(
                `socio-${socioActivoIndex}-dorso`,
                "DNI Dorso",
                "Imagen clara y legible",
              )}
            </div>

            <div className={styles.actionsFlex} style={{ marginTop: "40px" }}>
              <Button
                variant="primary"
                onClick={() => setSocioActivoIndex(null)}
              >
                GUARDAR Y CERRAR
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
