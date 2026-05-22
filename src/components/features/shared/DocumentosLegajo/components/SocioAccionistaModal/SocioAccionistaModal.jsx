import React, { useState, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { FiCheckCircle, FiEdit2, FiMail, FiSmartphone, FiMapPin, FiMap } from "react-icons/fi";
import { toast } from "sonner";
import { Button, Modal, SelectSocio, InputSocioMasked, BuscadorCuit, CargaArchivos } from "../../../../../ui";
import { afipService } from "../../../../../../services/afipService";
import { sociosService } from "../../../../../../services/sociosService";
import { socioArchivoService } from "../../../../../../services/socioArchivoService";
import { useProvincias } from "../../../../../../hooks/useCatalogos";
import { ConfirmacionModal } from "../../../ConfirmacionModal/ConfirmacionModal";
import styles from "./SocioAccionistaModal.module.css";

const normalizarTexto = (str) =>
  String(str || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toUpperCase();

const DropzoneField = ({ file, title, subtitle, onChange, onRemove, fileKey, hasError }) => {
  const [isDragging, setIsDragging] = useState(false);
  return (
    <div className={styles.dropzoneWrapper}>
      <input
        type="file"
        id={`file-input-${fileKey}`}
        style={{ display: "none" }}
        onChange={(e) => {
          if (e.target.files?.[0]) onChange(e.target.files[0]);
        }}
      />
      <CargaArchivos
        title={title}
        subtitle={subtitle}
        hasError={hasError}
        file={
          file
            ? {
                name: file.name,
                size: file.size || "Cargado",
              }
            : null
        }
        onClick={() => document.getElementById(`file-input-${fileKey}`).click()}
        onRemove={onRemove}
        isDragging={isDragging}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragging(false);
          if (e.dataTransfer.files?.[0]) {
            onChange(e.dataTransfer.files[0]);
          }
        }}
      />
    </div>
  );
};

export function SocioAccionistaModal({ isOpen, onClose, onSave, socio, socioIdActivo, archivosBackend, accionistas = [], dniTerceros = {} }) {
  const [validando, setValidando] = useState(false);
  const [afipValidado, setAfipValidado] = useState(false);
  const [dniFrenteFile, setDniFrenteFile] = useState(null);
  const [dniDorsoFile, setDniDorsoFile] = useState(null);

  const indexSocioEditado = socio
    ? accionistas.findIndex(
        (s) => s.cuit === socio.cuit || (socio.relacionId && s.relacionId === socio.relacionId)
      )
    : -1;

  const totalSinSocioActual = accionistas.reduce(
    (acc, s, idx) => (idx === indexSocioEditado ? acc : acc + Number(s.participacion || 0)),
    0
  );

  const maximoPermitido = 100 - totalSinSocioActual;
  
  // Dropzone Error States
  const [errorDniFrente, setErrorDniFrente] = useState(false);
  const [errorDniDorso, setErrorDniDorso] = useState(false);

  const [filesChanged, setFilesChanged] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const { control, reset, setValue, watch, setError, clearErrors, trigger, getValues, formState: { errors, isDirty } } = useForm({
    defaultValues: {
      cuit: "",
      nombre: "",
      participacion: "",
      email: "",
      celular: "",
      direccion: "",
      provinciaid: "",
      localidad: "",
    }
  });

  const cuitValue = watch("cuit");
  const nombreValue = watch("nombre");

  useEffect(() => {
    if (errors.cuit?.type === "manual") {
      clearErrors("cuit");
    }
  }, [cuitValue, clearErrors, errors.cuit]);

  const { data: provinciasData, isLoading: cargandoProvincias } = useProvincias();
  const opcionesProvincias = provinciasData?.opciones || [];

  useEffect(() => {
    const cuitLimpio = String(cuitValue || "").replace(/\D/g, "");
    const nombreLimpio = normalizarTexto(nombreValue || socio?.nombre);

    console.log("📂 [SocioAccionistaModal PRELOAD DNI] Estado (En Memoria):", {
      isOpen,
      cuitValue,
      cuitLimpio,
      nombreValue,
      nombreLimpio,
      socioNombre: socio?.nombre,
      dniTerceros,
      archivosBackend
    });

    if (isOpen && cuitLimpio.length === 11) {
      // Buscar primero en la memoria local (dniTerceros)
      const memoryFiles = dniTerceros?.[cuitLimpio];

      if (memoryFiles?.dniFrente) {
        setDniFrenteFile(memoryFiles.dniFrente);
        setErrorDniFrente(false);
      } else {
        // Fallback a archivosBackend (legajo de la empresa, por compatibilidad)
        const frente = archivosBackend?.find((a) => {
          if (a.tipodocumentoarchivoid !== 7) return false;
          const descNorm = normalizarTexto(a.descripcion);
          return (
            descNorm.includes(cuitLimpio) ||
            (nombreLimpio && descNorm.includes(nombreLimpio))
          );
        });

        if (frente) {
          setDniFrenteFile({
            name: frente.nombrearchivo,
            size: "Cargado",
            _uploaded: true,
            _backendId: frente.socioarchivoid,
            _tipodocumentoarchivoid: 7,
          });
          setErrorDniFrente(false);
        } else {
          setDniFrenteFile(null);
        }
      }

      if (memoryFiles?.dniDorso) {
        setDniDorsoFile(memoryFiles.dniDorso);
        setErrorDniDorso(false);
      } else {
        // Fallback a archivosBackend
        const dorso = archivosBackend?.find((a) => {
          if (a.tipodocumentoarchivoid !== 8) return false;
          const descNorm = normalizarTexto(a.descripcion);
          return (
            descNorm.includes(cuitLimpio) ||
            (nombreLimpio && descNorm.includes(nombreLimpio))
          );
        });

        if (dorso) {
          setDniDorsoFile({
            name: dorso.nombrearchivo,
            size: "Cargado",
            _uploaded: true,
            _backendId: dorso.socioarchivoid,
            _tipodocumentoarchivoid: 8,
          });
          setErrorDniDorso(false);
        } else {
          setDniDorsoFile(null);
        }
      }
    } else if (isOpen && !cuitLimpio) {
      setDniFrenteFile(null);
      setDniDorsoFile(null);
      setErrorDniFrente(false);
      setErrorDniDorso(false);
    }
    setFilesChanged(false);
  }, [isOpen, cuitValue, nombreValue, archivosBackend, dniTerceros, socio]);

  useEffect(() => {
    if (isOpen) {
      if (socio) {
        reset({
          cuit: socio.cuit,
          nombre: socio.nombre,
          participacion: socio.participacion,
          email: socio.email,
          celular: socio.telefono || "",
          direccion: socio.direccion || "",
          provinciaid: String(socio.provinciaid || ""),
          localidad: socio.localidad || "",
        });
        setAfipValidado(true);
      } else {
        reset({
          cuit: "",
          nombre: "",
          participacion: "",
          email: "",
          celular: "",
          direccion: "",
          provinciaid: "",
          localidad: "",
        });
        setAfipValidado(false);
      }
      setFilesChanged(false);
      setErrorDniFrente(false);
      setErrorDniDorso(false);
      setShowConfirm(false);
    }
  }, [isOpen, socio, reset]);

  const handleAfipLookup = async () => {
    const cuitLimpio = String(cuitValue || "").replace(/\D/g, "");
    if (!cuitLimpio || cuitLimpio.length !== 11) {
      setError("cuit", { type: "manual", message: "Por favor, ingrese un CUIT de 11 dígitos válido." });
      return;
    }
    setValidando(true);
    clearErrors("cuit");
    try {
      const respSgr = await sociosService.obtenerSocios({ Cuit: cuitLimpio, page: 1, page_size: 10 });
      const socioSgrDb = Array.isArray(respSgr) ? respSgr[0] : respSgr?.items?.[0] || respSgr?.data?.[0];

      if (socioSgrDb) {
        setError("cuit", { type: "manual", message: "Esta empresa ya se encuentra en gestión por SGR+" });
        return;
      }

      const res = await afipService.obtenerConstanciaInscripcion(cuitLimpio);
      if (res && res.datosgenerales) {
        const dg = res.datosgenerales;
        const nombreSocio = dg.razonsocial || `${dg.nombre || ""} ${dg.apellido || ""}`.trim() || "Socio AFIP";
        setValue("nombre", nombreSocio, { shouldValidate: true, shouldDirty: true });
        
        if (dg.email || dg.emailfacturacion) {
          setValue("email", dg.email || dg.emailfacturacion, { shouldValidate: true, shouldDirty: true });
        }
        if (dg.telefono) {
          setValue("celular", dg.telefono, { shouldValidate: true, shouldDirty: true });
        }

        const dom = dg.domiciliofiscal || dg.domicilio;
        if (dom) {
          const addressVal = dom.direccion || (dom.calle ? `${dom.calle} ${dom.numero || ""}`.trim() : "") || "";
          if (addressVal) setValue("direccion", addressVal, { shouldValidate: true, shouldDirty: true });
          
          const locVal = dom.localidad || dom.localidadNombre || "";
          if (locVal) setValue("localidad", locVal, { shouldValidate: true, shouldDirty: true });
          
          const provNombre = (dom.descripcionprovincia || dom.provincia || "").toUpperCase();
          if (provNombre) {
            const match = opcionesProvincias.find(
              (p) =>
                p.label.toUpperCase() === provNombre ||
                provNombre.includes(p.label.toUpperCase()) ||
                p.label.toUpperCase().includes(provNombre)
            );
            if (match) {
              setValue("provinciaid", String(match.value), { shouldValidate: true, shouldDirty: true });
            }
          }
        }
        setAfipValidado(true);
      } else {
        setError("cuit", { type: "manual", message: "No se encontraron datos en AFIP para el CUIT ingresado." });
      }
    } catch (err) {
      console.error("Error validando CUIT en AFIP/SGR:", err);
      setError("cuit", { type: "manual", message: "Error al validar CUIT. Ingrese los datos manualmente si AFIP está caído." });
    } finally {
      setValidando(false);
    }
  };

  const handlePreSubmit = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    let hasDropzoneErrors = false;
    if (!dniFrenteFile && !socio) {
      setErrorDniFrente(true);
      hasDropzoneErrors = true;
    }
    if (!dniDorsoFile && !socio) {
      setErrorDniDorso(true);
      hasDropzoneErrors = true;
    }

    const isValid = await trigger();
    
    if (!isValid || hasDropzoneErrors) return;

    if (!isDirty && !filesChanged) {
      onClose();
      return;
    }

    setShowConfirm(true);
  };

  const onConfirmSave = async () => {
    const data = getValues();
    try {
      await onSave(
        {
          ...data,
          relacionId: socio?.relacionId,
          relacionOriginal: socio?.relacion,
        },
        {
          dniFrente: dniFrenteFile,
          dniDorso: dniDorsoFile,
        }
      );
      toast.success(socio ? "Accionista actualizado exitosamente." : "Accionista agregado exitosamente.");
      setShowConfirm(false);
      onClose();
    } catch (error) {
      setShowConfirm(false);
      if (error?.response?.status === 400 && error.response?.data?.errors) {
        const backendErrors = error.response.data.errors;
        Object.keys(backendErrors).forEach((key) => {
          setError(key, { type: "server", message: backendErrors[key] });
        });
        toast.error("Por favor, revisá los errores en el formulario.");
      } else {
        toast.error("Ocurrió un error inesperado al guardar los datos.");
      }
    }
  };

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title={socio ? "Editar Accionista" : "Agregar Accionista"}
        maxWidth="700px"
      >
        <form onSubmit={handlePreSubmit} className={styles.modalForm}>
          {!afipValidado && !socio ? (
            <div className={styles.cuitSearchStep}>
              <div className={styles.cuitSearchBanner}>
                <div className={styles.cuitSearchBannerIcon}>
                  <svg width="1rem" height="1rem" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  </svg>
                </div>
                <div className={styles.cuitSearchBannerText}>
                  <p className={styles.cuitSearchBannerTitle}>Validación segura con AFIP</p>
                  <p className={styles.cuitSearchBannerSub}>Ingresá el CUIT para autocompletar los datos del accionista</p>
                </div>
              </div>
              <div className={styles.cuitSearchInputWrapper}>
                <BuscadorCuit
                  name="cuit"
                  control={control}
                  label="CUIT del accionista"
                  onValidar={handleAfipLookup}
                  error={errors.cuit?.message}
                  esValido={String(cuitValue || "").replace(/\D/g, "").length === 11}
                  buttonText="VALIDAR CUIT"
                  isLoading={validando}
                />
              </div>
            </div>
          ) : (
            <>
              <div className={styles.summaryCard}>
                <div className={styles.summaryTop}>
                  <div className={styles.summaryLeft}>
                    <span className={styles.summaryStatus}>
                      <FiCheckCircle size={11} /> Accionista validado con AFIP
                    </span>
                    <h2 className={styles.summaryName}>{watch("nombre") || "Accionista"}</h2>
                    <p className={styles.summaryCuit}>CUIT: {cuitValue}</p>
                    {!socio && (
                      <button
                        type="button"
                        className={styles.editLink}
                        onClick={() => setAfipValidado(false)}
                        style={{ position: "absolute", top: "0.75rem", right: "0.75rem" }}
                      >
                        <FiEdit2 size={12} /> Cambiar CUIT
                      </button>
                    )}
                  </div>
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
                      className={`${styles.availableText} ${maximoPermitido === 0 ? styles.availableTextError : ""
                        }`}
                    >
                      {maximoPermitido > 0 ? `Máximo permitido: ${maximoPermitido}%` : "Cupo completo"}
                    </span>
                  </div>

                  <div
                    className={`${styles.customInputWrapper} ${
                      errors.participacion ? styles.wrapperError : ""
                    }`}
                  >
                    <Controller
                      name="participacion"
                      control={control}
                      rules={{
                        required: "Ingresá un porcentaje",
                        min: { value: 0.01, message: "Debe ser mayor a 0%" },
                        max: { value: maximoPermitido, message: `No puede superar el ${maximoPermitido}% máximo permitido.` },
                      }}
                      render={({ field }) => (
                        <input
                          {...field}
                          id="participacionSocioInput"
                          type="text"
                          className={styles.customInput}
                          placeholder="0"
                          maxLength={6}
                          onChange={(e) => {
                            const val = e.target.value.replace(/[^0-9.]/g, "");
                            const parts = val.split(".");
                            if (parts.length <= 2 && Number(val || 0) <= maximoPermitido) {
                              setValue("participacion", val, { shouldValidate: true, shouldDirty: true });
                            }
                          }}
                        />
                      )}
                    />
                    <span className={styles.percentageSymbol}>%</span>
                  </div>

                  <div className={styles.errorContainer}>
                    {errors.participacion && (
                      <span className={styles.errorText}>{errors.participacion.message}</span>
                    )}
                  </div>
                </div>
              </div>

              <div className={styles.modalRow2}>
                <Controller
                  name="email"
                  control={control}
                  rules={{
                    required: "El email es obligatorio",
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: "Email inválido",
                    },
                  }}
                  render={({ field, fieldState }) => (
                    <InputSocioMasked
                      value={field.value}
                      onChange={(val) => setValue("email", val, { shouldDirty: true, shouldValidate: true })}
                      onBlur={field.onBlur}
                      label="Email"
                      icon={<FiMail />}
                      error={fieldState.error?.message}
                    />
                  )}
                />
                
                <Controller
                  name="celular"
                  control={control}
                  rules={{ required: "El celular es obligatorio" }}
                  render={({ field, fieldState }) => (
                    <InputSocioMasked
                      value={field.value}
                      onChange={(val) => setValue("celular", val, { shouldDirty: true, shouldValidate: true })}
                      onBlur={field.onBlur}
                      label="Celular (Sin 0 ni 15)"
                      mask={[{ mask: "00 0000-0000" }, { mask: "000 000-0000" }]}
                      icon={<FiSmartphone />}
                      error={fieldState.error?.message}
                    />
                  )}
                />
              </div>

              <div className={styles.modalRow}>
                <Controller
                  name="direccion"
                  control={control}
                  rules={{ required: "La dirección es obligatoria" }}
                  render={({ field, fieldState }) => (
                    <InputSocioMasked
                      value={field.value}
                      onChange={(val) => setValue("direccion", val, { shouldDirty: true, shouldValidate: true })}
                      onBlur={field.onBlur}
                      label="Dirección"
                      icon={<FiMapPin />}
                      error={fieldState.error?.message}
                    />
                  )}
                />
              </div>

              <div className={styles.modalRow2}>
                <Controller
                  name="provinciaid"
                  control={control}
                  rules={{ required: "La provincia es obligatoria" }}
                  render={({ fieldState }) => (
                    <SelectSocio
                      control={control}
                      name="provinciaid"
                      label={cargandoProvincias ? "Cargando provincias..." : "Provincia"}
                      icon={<FiMapPin />}
                      options={opcionesProvincias}
                      error={fieldState.error?.message}
                    />
                  )}
                />
                
                <Controller
                  name="localidad"
                  control={control}
                  rules={{ required: "La localidad es obligatoria" }}
                  render={({ field, fieldState }) => (
                    <InputSocioMasked
                      value={field.value}
                      onChange={(val) => setValue("localidad", val, { shouldDirty: true, shouldValidate: true })}
                      onBlur={field.onBlur}
                      label="Localidad"
                      icon={<FiMap />}
                      error={fieldState.error?.message}
                    />
                  )}
                />
              </div>

              <h4 className={styles.sectionTitle}>
                Identidad (DNI)
              </h4>
              <div className={styles.dropzoneGrid}>
                <DropzoneField
                  file={dniFrenteFile}
                  title="DNI Frente"
                  subtitle="Imagen clara y legible (Obligatorio)"
                  fileKey="frente"
                  hasError={errorDniFrente}
                  onChange={(f) => { setDniFrenteFile(f); setFilesChanged(true); setErrorDniFrente(false); }}
                  onRemove={() => { setDniFrenteFile(null); setFilesChanged(true); }}
                />
                <DropzoneField
                  file={dniDorsoFile}
                  title="DNI Dorso"
                  subtitle="Imagen clara y legible (Obligatorio)"
                  fileKey="dorso"
                  hasError={errorDniDorso}
                  onChange={(f) => { setDniDorsoFile(f); setFilesChanged(true); setErrorDniDorso(false); }}
                  onRemove={() => { setDniDorsoFile(null); setFilesChanged(true); }}
                />
              </div>
            </>
          )}

          <div className={styles.modalFooter}>
            {(afipValidado || socio) && (
              <Button type="submit" variant="primary">
                {socio ? "Guardar Cambios" : "Agregar Accionista"}
              </Button>
            )}
          </div>
        </form>
      </Modal>

      <ConfirmacionModal
        isOpen={showConfirm}
        onClose={() => setShowConfirm(false)}
        onConfirm={onConfirmSave}
        titulo={socio ? "Actualizar Accionista" : "Agregar Accionista"}
        mensaje={socio ? "¿Estás seguro de que deseas guardar los cambios?" : "¿Estás seguro de que deseas agregar este accionista?"}
      />
    </>
  );
}
