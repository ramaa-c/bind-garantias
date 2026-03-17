import React, { useState, useEffect } from "react";
import { useFormContext, useFormState } from "react-hook-form";
import { FiCheckCircle, FiEdit, FiAlertCircle } from "react-icons/fi";
import {
  InputFlotante,
  Button,
  Acordeon,
  CargaArchivos,
  Alert,
  Modal,
} from "../../../ui";
import ModalSocio from "../../../features/Compartidos/ModalSocio/ModalSocio";
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
    control,
    setValue,
    trigger,
    clearErrors,
    getValues,
  } = useFormContext();
  const { errors, dirtyFields } = useFormState({ control });

  const apoCuitIngresado = watch("apoCuit", "");
  const [archivos, setArchivos] = useState({});
  const [draggingKey, setDraggingKey] = useState(null);

  const sociosFormValues = watch("socios") || [];
  const [socioActivoIndex, setSocioActivoIndex] = useState(null);

  const [backupSocio, setBackupSocio] = useState({});
  const [backupArchivos, setBackupArchivos] = useState({});

  const socioActivoValues = watch(`socios.${socioActivoIndex}`);

  const [errorApoCuit, setErrorApoCuit] = useState("");
  const [errorGlobal, setErrorGlobal] = useState("");
  const [intentoAvanzar, setIntentoAvanzar] = useState(false);
  const [intentoGuardarSocio, setIntentoGuardarSocio] = useState(false);
  const [intentoGuardarApo, setIntentoGuardarApo] = useState(false);

  const {
    ref: cuitRef,
    onBlur: cuitOnBlur,
    name: cuitName,
  } = register("apoCuit");

  useEffect(() => {
    if (errorGlobal) setErrorGlobal("");
  }, [archivos, sociosFormValues, faseApoderado]);

  // --- HANDLERS DE ARCHIVOS ---
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

  const renderCargaArchivo = (key, title, subtitle, showError = false) => {
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
          hasError={showError}
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
    const sEmail = getValues(`socios.${index}.email`);
    const sCel = getValues(`socios.${index}.celular`);
    const sDir = getValues(`socios.${index}.direccion`);
    const sProv = getValues(`socios.${index}.provincia`);
    const sLoc = getValues(`socios.${index}.localidad`);

    const errs = errors?.socios?.[index];
    const sinErrores = !errs || Object.keys(errs).length === 0;

    const dniFrenteSubido = archivos[`socio-${index}-frente`];
    const dniDorsoSubido = archivos[`socio-${index}-dorso`];

    return !!(
      sEmail &&
      sCel &&
      sDir &&
      sProv &&
      sLoc &&
      sinErrores &&
      dniFrenteSubido &&
      dniDorsoSubido
    );
  };

  const validarCUIT = (cuit) => {
    if (!cuit) return false;
    const limpio = String(cuit).replace(/\D/g, "");
    if (limpio.length !== 11) return false;

    const mult = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2];
    const nums = limpio.split("").map(Number);
    const suma = mult.reduce((acc, m, i) => acc + nums[i] * m, 0);
    const mod = suma % 11;
    const digito = mod === 0 ? 0 : mod === 1 ? 9 : 11 - mod;

    return digito === nums[10];
  };

  const handleValidarApoderadoCuitClick = () => {
    if (!apoCuitIngresado) {
      setErrorApoCuit("El CUIT es obligatorio");
      return;
    }
    if (!validarCUIT(apoCuitIngresado)) {
      setErrorApoCuit("CUIT inválido o incorrecto");
      return;
    }

    setErrorApoCuit("");
    validarCuitApoderado();
  };

  const handleGuardarApoderadoFase2 = async () => {
    setIntentoGuardarApo(true);
    const camposValidosZod = await trigger(["apoEmail", "apoCelular"]);

    const emailApo = getValues("apoEmail") || "";
    const celApo = getValues("apoCelular") || "";

    if (
      camposValidosZod &&
      emailApo.trim() !== "" &&
      celApo.replace(/\D/g, "").length === 10
    ) {
      setIntentoGuardarApo(false);
      guardarApoderado();
    }
  };

  const handleAvanzarClick = () => {
    setIntentoAvanzar(true);
    const docsEmpresaListos =
      archivos["estatuto"] &&
      archivos["balance"] &&
      archivos["acta"] &&
      archivos["poderes"];
    const todosSociosCompletos =
      socios.length > 0 ? socios.every((_, i) => isSocioCompleto(i)) : true;
    const apoderadoListo = faseApoderado === "guardado";

    if (!docsEmpresaListos) {
      setErrorGlobal(
        "Falta subir documentación obligatoria de la empresa (Estatuto, Balance, Acta o Poderes).",
      );
      return;
    }
    if (!todosSociosCompletos) {
      setErrorGlobal(
        "Falta completar la información o subir el DNI de uno o más socios.",
      );
      return;
    }
    if (!apoderadoListo) {
      setErrorGlobal(
        "Falta validar y guardar los datos del Representante Legal / Apoderado.",
      );
      return;
    }

    setErrorGlobal("");
    avanzarPaso6();
  };

  const handleAbrirModalSocio = (index) => {
    setIntentoGuardarSocio(false);
    const datosTextosActuales = getValues(`socios.${index}`) || {};
    setBackupSocio(JSON.parse(JSON.stringify(datosTextosActuales)));
    setBackupArchivos({
      frente: archivos[`socio-${index}-frente`],
      dorso: archivos[`socio-${index}-dorso`],
    });
    setSocioActivoIndex(index);
  };

  const handleCerrarModalSinGuardar = () => {
    const campos = ["email", "celular", "direccion", "provincia", "localidad"];
    campos.forEach((campo) => {
      setValue(
        `socios.${socioActivoIndex}.${campo}`,
        backupSocio[campo] || "",
        {
          shouldValidate: false,
          shouldDirty: false,
        },
      );
    });
    setArchivos((prev) => {
      const nuevos = { ...prev };
      if (backupArchivos.frente)
        nuevos[`socio-${socioActivoIndex}-frente`] = backupArchivos.frente;
      else delete nuevos[`socio-${socioActivoIndex}-frente`];
      if (backupArchivos.dorso)
        nuevos[`socio-${socioActivoIndex}-dorso`] = backupArchivos.dorso;
      else delete nuevos[`socio-${socioActivoIndex}-dorso`];
      return nuevos;
    });
    clearErrors(`socios.${socioActivoIndex}`);
    setIntentoGuardarSocio(false);
    setSocioActivoIndex(null);
  };

  const handleGuardarSocio = async () => {
    setIntentoGuardarSocio(true);
    const camposValidos = await trigger([
      `socios.${socioActivoIndex}.email`,
      `socios.${socioActivoIndex}.celular`,
      `socios.${socioActivoIndex}.direccion`,
      `socios.${socioActivoIndex}.provincia`,
      `socios.${socioActivoIndex}.localidad`,
    ]);
    const dniFrente = archivos[`socio-${socioActivoIndex}-frente`];
    const dniDorso = archivos[`socio-${socioActivoIndex}-dorso`];
    if (camposValidos && dniFrente && dniDorso) {
      setIntentoGuardarSocio(false);
      setSocioActivoIndex(null);
    }
  };

  const obtenerEstadoAcordeon = (archivoKey) => {
    if (archivos[archivoKey]) return "check";
    if (intentoAvanzar) return "alert";
    return "warn";
  };

  const obtenerClaseAvatar = (index) => {
    if (isSocioCompleto(index)) return styles.avatarReady;
    if (intentoAvanzar) return styles.avatarError;
    return styles.avatarWarning;
  };

  const getCampoModal = (campo) => {
    if (socioActivoIndex === null) return { error: null, esValido: false };
    const hasError = errors?.socios?.[socioActivoIndex]?.[campo];
    const isDirty = dirtyFields?.socios?.[socioActivoIndex]?.[campo];
    const val = socioActivoValues?.[campo];
    const mostrarError = hasError && (isDirty || intentoGuardarSocio);
    return {
      error: mostrarError ? hasError.message : null,
      esValido:
        !hasError &&
        val &&
        val.toString().trim().length > 0 &&
        (isDirty || intentoGuardarSocio),
    };
  };

  const apoEmailVal = watch("apoEmail") || "";
  const apoCelVal = watch("apoCelular") || "";
  const errorApoEmail =
    errors.apoEmail?.message ||
    (intentoGuardarApo && apoEmailVal.trim() === "" ? "Requerido" : null);
  const errorApoCel =
    errors.apoCelular?.message ||
    (intentoGuardarApo && apoCelVal.replace(/\D/g, "").length < 10
      ? "Requerido"
      : null);

  return (
    <div className={styles.container}>
      <h3 className={styles.title}>Documentación requerida</h3>

      <Acordeon
        title="Estatuto"
        status={obtenerEstadoAcordeon("estatuto")}
        defaultOpen={true}
      >
        <div className={styles.documentRow}>
          {renderCargaArchivo(
            "estatuto",
            "Subir archivo",
            "PDF o ZIP menor a 5MB",
            intentoAvanzar && !archivos["estatuto"],
          )}
          <div className={styles.docInfoBox}>
            Los estatutos son las normas por las que se regirá el funcionamiento
            de la entidad.
          </div>
        </div>
      </Acordeon>

      <Acordeon
        title="Último Balance exigible, certificado"
        status={obtenerEstadoAcordeon("balance")}
      >
        <div className={styles.documentRow}>
          {renderCargaArchivo(
            "balance",
            "Subir archivo",
            "PDF o ZIP menor a 5MB",
            intentoAvanzar && !archivos["balance"],
          )}
          <div className={styles.docInfoBox}>
            Este informe debe ser auditado por un contador.
          </div>
        </div>
      </Acordeon>

      <Acordeon
        title="Acta de designación de autoridades"
        status={obtenerEstadoAcordeon("acta")}
      >
        <div className={styles.documentRow}>
          {renderCargaArchivo(
            "acta",
            "Subir archivo",
            "PDF o ZIP menor a 5MB",
            intentoAvanzar && !archivos["acta"],
          )}
          <div className={styles.docInfoBox}>
            Copia certificada del acta de asamblea donde se designan las
            autoridades vigentes.
          </div>
        </div>
      </Acordeon>

      <Acordeon title="Poderes" status={obtenerEstadoAcordeon("poderes")}>
        <div className={styles.documentRow}>
          {renderCargaArchivo(
            "poderes",
            "Subir archivo",
            "PDF o ZIP menor a 5MB",
            intentoAvanzar && !archivos["poderes"],
          )}
          <div className={styles.docInfoBox}>
            Copia de los poderes otorgados para operar y representar a la
            sociedad.
          </div>
        </div>
      </Acordeon>

      <hr className={styles.divider} />

      <h3 className={`${styles.title} ${styles.titleSmallMargin}`}>
        Completá la información y documentación de cada socio.
      </h3>

      {socios.length === 0 ? (
        <Alert variant="warning" layout="box">
          No hay socios cargados.
        </Alert>
      ) : (
        socios.map((socio, index) => {
          const estaCompleto = isSocioCompleto(index);
          const bordeError =
            !estaCompleto && intentoAvanzar
              ? { border: "1px solid #ff5252" }
              : {};
          return (
            <div className={styles.socioCard} key={index} style={bordeError}>
              <div className={styles.socioCardInfo}>
                <div
                  className={`${styles.socioAvatar} ${obtenerClaseAvatar(index)}`}
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
                onClick={() => handleAbrirModalSocio(index)}
              >
                {estaCompleto ? "Modificar" : "Completar datos"}
              </Button>
            </div>
          );
        })
      )}

      <hr className={styles.divider} />

      <h3 className={styles.title}>Representante Legal / Apoderado</h3>

      {faseApoderado === "ingresar" && (
        <div className={styles.searchContainerApoderado}>
          <div className={styles.col}>
            <InputFlotante
              label="CUIT del apoderado"
              maxLength={11}
              esValido={
                apoCuitIngresado?.length === 11 &&
                !errorApoCuit &&
                validarCUIT(apoCuitIngresado)
              }
              error={errorApoCuit}
              name={cuitName}
              inputRef={cuitRef}
              onBlur={cuitOnBlur}
              value={apoCuitIngresado || ""}
              onChange={(e) => {
                const limpio = e.target.value.replace(/\D/g, "").slice(0, 11);
                setValue("apoCuit", limpio, {
                  shouldValidate: true,
                  shouldDirty: true,
                });
                if (errorApoCuit) setErrorApoCuit("");
              }}
            />
          </div>
          <div className={styles.btnWrapperSmall}>
            <Button
              type="button"
              variant="primary"
              className={styles.tallButton}
              onClick={handleValidarApoderadoCuitClick}
            >
              VALIDAR
            </Button>
          </div>
        </div>
      )}

      {faseApoderado === "completar" && (
        <div className={styles.container}>
          <div className={styles.rowMtMedium}>
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
          <div className={styles.rowMtLarge}>
            <div className={styles.col}>
              <InputFlotante
                label="Email"
                type="email"
                esValido={!errorApoEmail && apoEmailVal.trim() !== ""}
                error={errorApoEmail}
                {...register("apoEmail")}
              />
            </div>
            <div className={styles.col}>
              <InputFlotante
                label="Celular"
                maxLength={10}
                esValido={
                  !errorApoCel && apoCelVal.replace(/\D/g, "").length === 10
                }
                error={errorApoCel}
                {...register("apoCelular")}
                onChange={(e) => {
                  e.target.value = e.target.value
                    .replace(/\D/g, "")
                    .slice(0, 10);
                  register("apoCelular").onChange(e);
                }}
              />
            </div>
          </div>
          <div className={styles.actionsFlexMtMedium}>
            <Button
              type="button"
              variant="outline"
              className={styles.borderless}
              onClick={() => {
                setValue("apoEmail", "", {
                  shouldValidate: false,
                  shouldDirty: false,
                });
                setValue("apoCelular", "", {
                  shouldValidate: false,
                  shouldDirty: false,
                });
                setIntentoGuardarApo(false);
                setFaseApoderado("ingresar");
              }}
            >
              CANCELAR
            </Button>
            <Button
              type="button"
              variant="primary"
              onClick={handleGuardarApoderadoFase2}
            >
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
            type="button"
            variant="outline"
            onClick={() => setFaseApoderado("completar")}
          >
            <FiEdit /> Editar
          </Button>
        </div>
      )}

      <hr className={styles.divider} />

      <div className={styles.billingSection}>
        <h3 className={styles.titleSmall}>MAIL DE FACTURACIÓN:</h3>
        <div className={styles.billingInputWrapper}>
          <InputFlotante
            label="Email"
            type="email"
            esValido={!errors.emailFacturacion && dirtyFields.emailFacturacion}
            error={errors.emailFacturacion?.message}
            {...register("emailFacturacion")}
          />
        </div>
      </div>

      {errorGlobal && (
        <div className={styles.globalErrorWrapper}>
          <Alert variant="danger" layout="box">
            {errorGlobal}
          </Alert>
        </div>
      )}

      <div className={styles.actionsRight}>
        <Button type="button" variant="primary" onClick={handleAvanzarClick}>
          CONTINUAR
        </Button>
      </div>

      <ModalSocio
        socio={socioActivoIndex !== null ? socios[socioActivoIndex] : null}
        socioIndex={socioActivoIndex}
        archivos={archivos}
        intentoGuardar={intentoGuardarSocio}
        onGuardar={handleGuardarSocio}
        onCerrar={handleCerrarModalSinGuardar}
        onFileUpload={handleFileUpload}
        onFileRemove={handleFileRemove}
        draggingKey={draggingKey}
        onDragOver={(key) => setDraggingKey(key)}
        onDragLeave={() => setDraggingKey(null)}
        onDrop={(key, file) => handleFileUpload(key, file)}
      />

      <div style={{ display: "none" }}>
        {socios.map((_, i) => (
          <React.Fragment key={i}>
            <input {...register(`socios.${i}.email`)} />
            <input {...register(`socios.${i}.celular`)} />
            <input {...register(`socios.${i}.direccion`)} />
            <input {...register(`socios.${i}.provincia`)} />
            <input {...register(`socios.${i}.localidad`)} />
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}
